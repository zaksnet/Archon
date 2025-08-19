"""
Tests for the migration service that checks database migration status.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from dataclasses import asdict

from src.server.services.migration_service import (
    MigrationService,
    MigrationStatus,
    TableStatus,
)


class TestMigrationService:
    """Test suite for MigrationService."""

    @pytest.fixture
    def mock_supabase_client(self):
        """Create a mock Supabase client."""
        return Mock()

    @pytest.fixture
    def migration_service(self, mock_supabase_client):
        """Create a MigrationService instance with mock client."""
        return MigrationService(mock_supabase_client)

    @pytest.mark.asyncio
    async def test_check_migration_status_no_connection(self, migration_service):
        """Test migration status when database connection fails."""
        # Arrange
        # Set client to None to simulate no connection
        migration_service.client = None

        # Act
        status = await migration_service.check_migration_status()

        # Assert
        assert status.has_connection is False
        assert status.is_complete is False
        assert len(status.errors) > 0
        assert "Cannot connect to database" in status.summary

    @pytest.mark.asyncio
    async def test_check_migration_status_all_tables_present(self, migration_service, mock_supabase_client):
        """Test migration status when all required tables are present."""
        # Arrange
        # Mock successful database connection
        mock_supabase_client.rpc.return_value.execute.return_value = Mock(data="PostgreSQL")
        
        # Mock table checks - all tables exist with data
        mock_table = Mock()
        mock_table.select.return_value.limit.return_value.execute.return_value = Mock(
            data=[{"id": 1}], count=10
        )
        mock_supabase_client.table.return_value = mock_table
        
        # Mock extension checks (simplified for testing)
        migration_service._check_extensions = AsyncMock(
            return_value={"vector": True, "pgcrypto": True}
        )

        # Act
        status = await migration_service.check_migration_status()

        # Assert
        assert status.has_connection is True
        assert status.is_complete is True
        assert len(status.missing_tables) == 0
        assert "Database migration is complete" in status.summary

    @pytest.mark.asyncio
    async def test_check_migration_status_missing_tables(self, migration_service, mock_supabase_client):
        """Test migration status when some tables are missing."""
        # Arrange
        mock_supabase_client.rpc.return_value.execute.return_value = Mock(data="PostgreSQL")
        
        # Mock table checks - some tables missing
        def table_side_effect(table_name):
            mock_table = Mock()
            if table_name in ["archon_settings", "archon_sources"]:
                # These tables exist
                mock_table.select.return_value.limit.return_value.execute.return_value = Mock(
                    data=[{"id": 1}], count=5
                )
            else:
                # Other tables don't exist
                mock_table.select.return_value.limit.return_value.execute.side_effect = Exception(
                    f"relation {table_name} does not exist"
                )
            return mock_table
        
        mock_supabase_client.table.side_effect = table_side_effect
        
        # Mock extension checks
        migration_service._check_extensions = AsyncMock(
            return_value={"vector": True, "pgcrypto": True}
        )

        # Act
        status = await migration_service.check_migration_status()

        # Assert
        assert status.has_connection is True
        assert status.is_complete is False
        assert len(status.missing_tables) > 0
        assert "Database migration needed" in status.summary

    @pytest.mark.asyncio
    async def test_check_extensions_all_present(self, migration_service, mock_supabase_client):
        """Test extension checking when all required extensions are present."""
        # Arrange
        mock_supabase_client.rpc.return_value.execute.return_value = Mock(
            data=[{"exists": True}]
        )

        # Act
        extensions = await migration_service._check_extensions()

        # Assert
        assert extensions["vector"] is True
        assert extensions["pgcrypto"] is True

    @pytest.mark.asyncio
    async def test_check_extensions_missing(self, migration_service, mock_supabase_client):
        """Test extension checking when extensions are missing."""
        # Arrange
        def rpc_side_effect(func_name, params=None):
            mock_result = Mock()
            if params and "vector" in params.get("query", ""):
                mock_result.execute.return_value = Mock(data=[{"exists": False}])
            else:
                mock_result.execute.return_value = Mock(data=[{"exists": True}])
            return mock_result
        
        mock_supabase_client.rpc.side_effect = rpc_side_effect

        # Act
        extensions = await migration_service._check_extensions()

        # Assert
        assert extensions["vector"] is False or extensions["pgcrypto"] is False

    @pytest.mark.asyncio
    async def test_check_tables_all_exist(self, migration_service, mock_supabase_client):
        """Test table checking when all tables exist."""
        # Arrange
        mock_table = Mock()
        mock_table.select.return_value.limit.return_value.execute.return_value = Mock(
            data=[{"id": 1}], count=10
        )
        mock_supabase_client.table.return_value = mock_table

        # Act
        tables = await migration_service._check_tables()

        # Assert
        for table_name in MigrationService.REQUIRED_TABLES:
            assert table_name in tables
            assert tables[table_name].exists is True
            assert tables[table_name].has_data is True

    @pytest.mark.asyncio
    async def test_check_tables_some_missing(self, migration_service, mock_supabase_client):
        """Test table checking when some tables are missing."""
        # Arrange
        def table_side_effect(table_name):
            mock_table = Mock()
            if table_name == "archon_settings":
                mock_table.select.return_value.limit.return_value.execute.return_value = Mock(
                    data=[{"id": 1}], count=5
                )
            else:
                mock_table.select.return_value.limit.return_value.execute.side_effect = Exception(
                    f"relation {table_name} does not exist"
                )
            return mock_table
        
        mock_supabase_client.table.side_effect = table_side_effect

        # Act
        tables = await migration_service._check_tables()

        # Assert
        assert tables["archon_settings"].exists is True
        assert tables["archon_settings"].has_data is True
        
        for table_name in MigrationService.REQUIRED_TABLES:
            if table_name != "archon_settings":
                assert tables[table_name].exists is False

    @pytest.mark.asyncio
    async def test_check_critical_settings(self, migration_service, mock_supabase_client):
        """Test checking critical settings."""
        # Arrange
        mock_supabase_client.table.return_value.select.return_value.execute.return_value = Mock(
            data=[
                {"key": "OPENAI_API_KEY", "value": None, "encrypted_value": "encrypted", "is_encrypted": True},
                {"key": "MODEL_CHOICE", "value": "gpt-4", "is_encrypted": False},
                {"key": "USE_HYBRID_SEARCH", "value": "true", "is_encrypted": False},
            ]
        )

        # Act
        settings = await migration_service.check_critical_settings()

        # Assert
        assert "OPENAI_API_KEY" in settings
        assert settings["OPENAI_API_KEY"]["exists"] is True
        assert settings["OPENAI_API_KEY"]["is_encrypted"] is True
        assert settings["OPENAI_API_KEY"]["has_value"] is True

    @pytest.mark.asyncio
    async def test_get_migration_script_path(self, migration_service):
        """Test getting the migration script path."""
        # Act
        path = await migration_service.get_migration_script_path()

        # Assert
        assert path == "migration/complete_setup.sql"

    def test_to_dict_conversion(self, migration_service):
        """Test converting MigrationStatus to dictionary."""
        # Arrange
        status = MigrationStatus(
            is_complete=True,
            has_connection=True,
            extensions={"vector": True, "pgcrypto": True},
            tables={
                "archon_settings": TableStatus(
                    name="archon_settings",
                    exists=True,
                    has_data=True,
                    row_count=10
                )
            },
            missing_tables=[],
            errors=[],
            summary="Test summary"
        )

        # Act
        result = migration_service.to_dict(status)

        # Assert
        assert result["is_complete"] is True
        assert result["has_connection"] is True
        assert result["extensions"]["vector"] is True
        assert "archon_settings" in result["tables"]
        assert result["tables"]["archon_settings"]["exists"] is True
        assert result["summary"] == "Test summary"

    @pytest.mark.asyncio
    async def test_check_migration_status_with_permission_errors(self, migration_service, mock_supabase_client):
        """Test migration status when there are permission errors."""
        # Arrange
        mock_supabase_client.rpc.return_value.execute.return_value = Mock(data="PostgreSQL")
        
        # Mock table checks with permission errors
        mock_table = Mock()
        mock_table.select.return_value.limit.return_value.execute.side_effect = Exception(
            "permission denied for table archon_settings"
        )
        mock_supabase_client.table.return_value = mock_table
        
        migration_service._check_extensions = AsyncMock(
            return_value={"vector": True, "pgcrypto": True}
        )

        # Act
        status = await migration_service.check_migration_status()

        # Assert
        assert status.has_connection is True
        # Tables should be marked as existing despite permission errors
        for table_name in MigrationService.REQUIRED_TABLES:
            assert status.tables[table_name].exists is True
            assert "Permission denied" in status.tables[table_name].error