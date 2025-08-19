import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MigrationService, MigrationStatus } from '../../src/services/migrationService';

// Mock fetch globally
global.fetch = vi.fn();

describe('MigrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkMigrationStatus', () => {
    it('should fetch migration status successfully', async () => {
      const mockStatus: MigrationStatus = {
        is_complete: true,
        has_connection: true,
        extensions: { vector: true, pgcrypto: true },
        tables: {
          archon_settings: {
            name: 'archon_settings',
            exists: true,
            has_data: true,
            row_count: 50,
            error: null,
          },
        },
        missing_tables: [],
        errors: [],
        summary: 'Database migration is complete.',
        script_path: 'migration/complete_setup.sql',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await MigrationService.checkMigrationStatus();

      expect(result).toEqual(mockStatus);
      expect(global.fetch).toHaveBeenCalledWith('/api/database/migration-status');
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await MigrationService.checkMigrationStatus();

      expect(result).toEqual({
        is_complete: false,
        has_connection: false,
        extensions: {},
        tables: {},
        missing_tables: [],
        errors: ['Failed to check migration status: Network error'],
        summary: 'Failed to check migration status',
        script_path: '',
      });
    });

    it('should handle non-ok responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const result = await MigrationService.checkMigrationStatus();

      expect(result.is_complete).toBe(false);
      expect(result.has_connection).toBe(false);
      expect(result.errors[0]).toContain('Failed to check migration status: Server error: 500 Internal Server Error');
    });
  });

  describe('getMigrationScript', () => {
    it('should fetch migration script content', async () => {
      const mockScript = '-- SQL migration script\nCREATE TABLE test;';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockScript,
      });

      const result = await MigrationService.getMigrationScript();

      expect(result).toBe(mockScript);
      expect(global.fetch).toHaveBeenCalledWith('/migration/complete_setup.sql');
    });

    it('should return error message on fetch failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Not found'));

      const result = await MigrationService.getMigrationScript();

      expect(result).toContain('Failed to load migration script');
    });
  });

  describe('isMigrationNeeded', () => {
    it('should return false when migration is complete', () => {
      const status: MigrationStatus = {
        is_complete: true,
        has_connection: true,
        extensions: { vector: true, pgcrypto: true },
        tables: {},
        missing_tables: [],
        errors: [],
        summary: 'Complete',
        script_path: '',
      };

      expect(MigrationService.isMigrationNeeded(status)).toBe(false);
    });

    it('should return true when migration is incomplete', () => {
      const status: MigrationStatus = {
        is_complete: false,
        has_connection: true,
        extensions: { vector: true, pgcrypto: true },
        tables: {},
        missing_tables: ['archon_settings'],
        errors: [],
        summary: 'Incomplete',
        script_path: '',
      };

      expect(MigrationService.isMigrationNeeded(status)).toBe(true);
    });

    it('should return true when there is no connection', () => {
      const status: MigrationStatus = {
        is_complete: false,
        has_connection: false,
        extensions: {},
        tables: {},
        missing_tables: [],
        errors: ['Connection failed'],
        summary: 'No connection',
        script_path: '',
      };

      expect(MigrationService.isMigrationNeeded(status)).toBe(true);
    });
  });

  describe('getMissingTablesCount', () => {
    it('should return correct count of missing tables', () => {
      const status: MigrationStatus = {
        is_complete: false,
        has_connection: true,
        extensions: {},
        tables: {},
        missing_tables: ['table1', 'table2', 'table3'],
        errors: [],
        summary: '',
        script_path: '',
      };

      expect(MigrationService.getMissingTablesCount(status)).toBe(3);
    });

    it('should return 0 when no tables are missing', () => {
      const status: MigrationStatus = {
        is_complete: true,
        has_connection: true,
        extensions: {},
        tables: {},
        missing_tables: [],
        errors: [],
        summary: '',
        script_path: '',
      };

      expect(MigrationService.getMissingTablesCount(status)).toBe(0);
    });
  });
});