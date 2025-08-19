/**
 * Service for checking database migration status
 */

export interface TableStatus {
  name: string;
  exists: boolean;
  has_data: boolean;
  row_count: number;
  error: string | null;
}

export interface MigrationStatus {
  is_complete: boolean;
  has_connection: boolean;
  extensions: Record<string, boolean>;
  tables: Record<string, TableStatus>;
  missing_tables: string[];
  errors: string[];
  summary: string;
  script_path: string;
}

export class MigrationService {
  /**
   * Check the current database migration status
   */
  static async checkMigrationStatus(): Promise<MigrationStatus> {
    try {
      const response = await fetch('/api/database/migration-status');
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      
      const status = await response.json();
      return status as MigrationStatus;
    } catch (error) {
      console.error('Failed to check migration status:', error);
      
      // Return a default error status
      return {
        is_complete: false,
        has_connection: false,
        extensions: {},
        tables: {},
        missing_tables: [],
        errors: [error instanceof Error ? `Failed to check migration status: ${error.message}` : 'Failed to check migration status'],
        summary: 'Failed to check migration status',
        script_path: '',
      };
    }
  }

  /**
   * Execute the database migration
   */
  static async executeMigration(): Promise<{
    success: boolean;
    message: string;
    supabase_sql_url?: string;
    instructions?: any;
    error?: string;
    already_migrated?: boolean;
    requires_manual?: boolean;
  }> {
    try {
      const response = await fetch('/api/database/execute-migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to execute migration: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error executing migration:', error);
      throw error;
    }
  }

  /**
   * Get the migration SQL script content
   */
  static async getMigrationScript(): Promise<string> {
    try {
      const response = await fetch('/migration/complete_setup.sql');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch script: ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Failed to load migration script:', error);
      return `Failed to load migration script: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Check if migration is needed based on status
   */
  static isMigrationNeeded(status: MigrationStatus): boolean {
    return !status.is_complete || !status.has_connection || status.missing_tables.length > 0;
  }

  /**
   * Get a user-friendly description of what's missing
   */
  static getMissingDescription(status: MigrationStatus): string {
    const issues: string[] = [];
    
    if (!status.has_connection) {
      issues.push('Database connection is not configured');
    }
    
    if (status.missing_tables.length > 0) {
      issues.push(`${status.missing_tables.length} required tables are missing`);
    }
    
    const missingExtensions = Object.entries(status.extensions)
      .filter(([_, exists]) => !exists)
      .map(([name]) => name);
    
    if (missingExtensions.length > 0) {
      issues.push(`Missing extensions: ${missingExtensions.join(', ')}`);
    }
    
    if (issues.length === 0 && !status.is_complete) {
      issues.push('Database setup is incomplete');
    }
    
    return issues.join('. ');
  }

  /**
   * Get count of missing tables
   */
  static getMissingTablesCount(status: MigrationStatus): number {
    return status.missing_tables.length;
  }

  /**
   * Check if specific table exists
   */
  static tableExists(status: MigrationStatus, tableName: string): boolean {
    const table = status.tables[tableName];
    return table ? table.exists : false;
  }

  /**
   * Get list of tables with data
   */
  static getTablesWithData(status: MigrationStatus): string[] {
    return Object.entries(status.tables)
      .filter(([_, table]) => table.exists && table.has_data)
      .map(([name]) => name);
  }

  /**
   * Get total row count across all tables
   */
  static getTotalRowCount(status: MigrationStatus): number {
    return Object.values(status.tables)
      .filter(table => table.exists)
      .reduce((sum, table) => sum + table.row_count, 0);
  }

  /**
   * Format migration status for display
   */
  static formatStatus(status: MigrationStatus): {
    icon: string;
    color: string;
    title: string;
    description: string;
  } {
    if (status.is_complete) {
      return {
        icon: '✓',
        color: 'green',
        title: 'Database Ready',
        description: 'All migrations have been applied successfully',
      };
    }
    
    if (!status.has_connection) {
      return {
        icon: '⚠',
        color: 'red',
        title: 'Database Not Connected',
        description: 'Cannot connect to the database. Please check your configuration.',
      };
    }
    
    if (status.missing_tables.length > 0) {
      return {
        icon: '!',
        color: 'yellow',
        title: 'Migration Required',
        description: this.getMissingDescription(status),
      };
    }
    
    return {
      icon: '?',
      color: 'gray',
      title: 'Unknown Status',
      description: status.summary || 'Unable to determine migration status',
    };
  }
}