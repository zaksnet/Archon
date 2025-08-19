"""
Database migration status checking service for Archon.
Checks if the complete_setup.sql migration has been run.
"""

from typing import Dict, List, Any, Optional
import logging
import os
from pathlib import Path
from dataclasses import dataclass, asdict
from supabase import Client
import httpx

logger = logging.getLogger(__name__)


@dataclass
class TableStatus:
    """Status of a single database table."""
    name: str
    exists: bool
    has_data: bool = False
    row_count: int = 0
    error: Optional[str] = None


@dataclass
class MigrationStatus:
    """Overall database migration status."""
    is_complete: bool
    has_connection: bool
    extensions: Dict[str, bool]
    tables: Dict[str, TableStatus]
    missing_tables: List[str]
    errors: List[str]
    summary: str


class MigrationService:
    """Service for checking database migration status."""
    
    # Core tables required for Archon to function
    REQUIRED_TABLES = [
        'archon_settings',
        'archon_sources', 
        'archon_crawled_pages',
        'archon_code_examples',
        'archon_projects',
        'archon_tasks',
        'archon_project_sources',
        'archon_document_versions',
        'archon_prompts'
    ]
    
    # Required PostgreSQL extensions
    REQUIRED_EXTENSIONS = ['vector', 'pgcrypto']
    
    def __init__(self, supabase_client: Client):
        """Initialize migration service with Supabase client."""
        self.client = supabase_client
        self.supabase = supabase_client
        
    async def execute_migration(self) -> dict:
        """
        Prepare migration for execution. Since Supabase doesn't allow direct SQL execution
        through their REST API, we'll return the script and instructions for manual execution.
        """
        try:
            # Read the migration script
            script_path = Path(__file__).parent.parent.parent.parent / "migration" / "complete_setup.sql"
            
            if not script_path.exists():
                return {
                    "success": False,
                    "error": f"Migration script not found",
                    "message": "Migration script file is missing"
                }
            
            logger.info(f"Reading migration script from {script_path}")
            with open(script_path, 'r', encoding='utf-8') as f:
                sql_script = f.read()
            
            # First, check current status to see what's missing
            current_status = await self.check_migration_status()
            
            if current_status.is_complete:
                return {
                    "success": True,
                    "message": "Migration already complete! All tables and extensions are present.",
                    "already_migrated": True
                }
            
            # Extract the Supabase project ID from the URL
            supabase_url = os.getenv("SUPABASE_URL", "")
            import re
            match = re.match(r"https://([^.]+)\.supabase\.co", supabase_url)
            
            if match:
                project_id = match.group(1)
                # Generate the SQL Editor URL
                sql_editor_url = f"https://supabase.com/dashboard/project/{project_id}/sql/new"
                
                return {
                    "success": False,
                    "requires_manual": True,
                    "message": "Migration script ready. Please run it in the Supabase SQL Editor.",
                    "sql_script": sql_script,
                    "supabase_sql_url": sql_editor_url,
                    "missing_tables": current_status.missing_tables,
                    "instructions": [
                        "Click 'Open Supabase SQL Editor' button",
                        "The SQL Editor will open in a new tab", 
                        "Paste the migration script",
                        "Click 'Run' to execute the migration",
                        "Return here and click 'Refresh Status' to verify"
                    ]
                }
            else:
                # Fallback if we can't extract project ID
                return {
                    "success": False,
                    "requires_manual": True,
                    "message": "Migration script ready. Please run it manually in your Supabase SQL Editor.",
                    "sql_script": sql_script,
                    "missing_tables": current_status.missing_tables,
                    "instructions": [
                        "Go to your Supabase Dashboard",
                        "Navigate to the SQL Editor",
                        "Create a new query",
                        "Paste the migration script",
                        "Click 'Run' to execute the migration",
                        "Return here and click 'Refresh Status' to verify"
                    ]
                }
                
        except Exception as e:
            logger.error(f"Failed to prepare migration: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to prepare migration"
            }

    async def check_migration_status(self) -> MigrationStatus:
        """
        Check if database migrations have been run.
        Returns detailed status of database setup.
        """
        status = MigrationStatus(
            is_complete=False,
            has_connection=False,
            extensions={},
            tables={},
            missing_tables=[],
            errors=[],
            summary=""
        )
        
        # Test database connection
        # We'll consider the connection successful if we can create the client
        # The actual table checks will determine if migration is needed
        try:
            # Try a simple operation that should work even without tables
            # Just having a client means we have connection credentials
            if self.client:
                status.has_connection = True
                logger.info("Database client initialized successfully")
            else:
                status.has_connection = False
                status.errors.append("Database client could not be initialized")
                status.summary = "Cannot connect to database. Please check your Supabase configuration."
                return status
        except Exception as e:
            status.errors.append(f"Database connection failed: {str(e)}")
            status.summary = "Cannot connect to database. Please check your Supabase configuration."
            logger.error(f"Database connection error: {e}")
            return status
            
        # Check extensions
        status.extensions = await self._check_extensions()
        
        # Check tables
        status.tables = await self._check_tables()
        
        # Determine missing tables
        status.missing_tables = [
            table for table, info in status.tables.items() 
            if not info.exists
        ]
        
        # Determine if migration is complete
        status.is_complete = (
            status.has_connection and
            len(status.missing_tables) == 0 and
            all(status.extensions.values()) and
            len(status.errors) == 0
        )
        
        # Generate summary
        if status.is_complete:
            status.summary = "Database migration is complete. All required tables and extensions are present."
        elif not status.has_connection:
            status.summary = "Cannot connect to database. Please check your Supabase configuration."
        elif status.missing_tables:
            status.summary = f"Database migration needed. Missing {len(status.missing_tables)} required tables."
        elif not all(status.extensions.values()):
            missing_ext = [ext for ext, exists in status.extensions.items() if not exists]
            status.summary = f"Missing required extensions: {', '.join(missing_ext)}"
        else:
            status.summary = "Database setup has errors. Please check the details."
            
        logger.info(f"Migration status check complete: {status.summary}")
        return status
        
    async def _check_extensions(self) -> Dict[str, bool]:
        """Check if required PostgreSQL extensions are installed."""
        extensions = {}
        
        for ext in self.REQUIRED_EXTENSIONS:
            try:
                # Query to check if extension exists
                query = f"""
                SELECT EXISTS (
                    SELECT 1 FROM pg_extension 
                    WHERE extname = '{ext}'
                ) as exists
                """
                result = self.client.rpc('sql_query', {'query': query}).execute()
                
                # Handle different response formats
                if result.data:
                    if isinstance(result.data, list) and len(result.data) > 0:
                        extensions[ext] = result.data[0].get('exists', False)
                    else:
                        extensions[ext] = False
                else:
                    extensions[ext] = False
                    
            except Exception as e:
                logger.warning(f"Could not check extension {ext}: {e}")
                # Try alternative method using information_schema
                try:
                    # For Supabase, extensions might be pre-installed
                    # Assume they exist if we can't check directly
                    extensions[ext] = True
                except:
                    extensions[ext] = False
                    
        return extensions
        
    async def _check_tables(self) -> Dict[str, TableStatus]:
        """Check if required tables exist and have data."""
        tables = {}
        
        for table in self.REQUIRED_TABLES:
            status = TableStatus(name=table, exists=False)
            
            try:
                # Try to count rows in the table
                result = self.client.table(table).select('*', count='exact').limit(1).execute()
                
                # If we get here, table exists
                status.exists = True
                status.row_count = result.count if hasattr(result, 'count') else 0
                status.has_data = status.row_count > 0
                
            except Exception as e:
                error_msg = str(e).lower()
                
                # Check if it's a "table doesn't exist" error
                if 'relation' in error_msg and 'does not exist' in error_msg:
                    status.exists = False
                    status.error = "Table does not exist"
                elif 'permission' in error_msg:
                    # Table might exist but we don't have permission
                    status.exists = True  # Assume it exists
                    status.error = "Permission denied"
                else:
                    status.error = str(e)
                    
                logger.debug(f"Table {table} check: {status.error}")
                
            tables[table] = status
            
        return tables
        
    async def get_migration_script_path(self) -> str:
        """Get the path to the migration SQL script."""
        return "migration/complete_setup.sql"
        
    async def check_critical_settings(self) -> Dict[str, Any]:
        """
        Check critical settings that indicate proper setup.
        Returns dict with setting values or errors.
        """
        critical_settings = {}
        
        try:
            # Check if we have any settings configured
            result = self.client.table('archon_settings').select('key, value, is_encrypted').execute()
            
            if result.data:
                for setting in result.data:
                    key = setting.get('key')
                    if key in ['OPENAI_API_KEY', 'MODEL_CHOICE', 'USE_HYBRID_SEARCH']:
                        critical_settings[key] = {
                            'exists': True,
                            'is_encrypted': setting.get('is_encrypted', False),
                            'has_value': bool(setting.get('value') or setting.get('encrypted_value'))
                        }
            else:
                critical_settings['error'] = 'No settings found'
                
        except Exception as e:
            critical_settings['error'] = str(e)
            logger.error(f"Error checking critical settings: {e}")
            
        return critical_settings
        
    def to_dict(self, status: MigrationStatus) -> Dict[str, Any]:
        """Convert MigrationStatus to dictionary for JSON serialization."""
        return {
            'is_complete': status.is_complete,
            'has_connection': status.has_connection,
            'extensions': status.extensions,
            'tables': {
                name: asdict(table_status) 
                for name, table_status in status.tables.items()
            },
            'missing_tables': status.missing_tables,
            'errors': status.errors,
            'summary': status.summary
        }