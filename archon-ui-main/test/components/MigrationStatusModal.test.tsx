import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MigrationStatusModal } from '../../src/components/settings/MigrationStatusModal';
import { MigrationService } from '../../src/services/migrationService';

// Mock the migration service
vi.mock('../../src/services/migrationService', () => ({
  MigrationService: {
    checkMigrationStatus: vi.fn(),
    getMigrationScript: vi.fn(),
    isMigrationNeeded: vi.fn(),
    getMissingDescription: vi.fn(),
    formatStatus: vi.fn(),
  },
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('MigrationStatusModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(<MigrationStatusModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText(/Database Migration Status/i)).toBeInTheDocument();
  });

  it('should not render modal when closed', () => {
    const { container } = render(<MigrationStatusModal isOpen={false} onClose={vi.fn()} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should show loading state initially', () => {
    render(<MigrationStatusModal isOpen={true} onClose={vi.fn()} />);
    
    expect(screen.getByText(/Checking migration status/i)).toBeInTheDocument();
  });

  it('should display complete migration status', async () => {
    const mockStatus = {
      is_complete: true,
      has_connection: true,
      extensions: { vector: true, pgcrypto: true },
      tables: {
        archon_settings: { name: 'archon_settings', exists: true, has_data: true, row_count: 10, error: null },
      },
      missing_tables: [],
      errors: [],
      summary: 'Database migration is complete.',
      script_path: 'migration/complete_setup.sql',
    };

    vi.mocked(MigrationService.checkMigrationStatus).mockResolvedValue(mockStatus);
    vi.mocked(MigrationService.formatStatus).mockReturnValue({
      icon: '✓',
      color: 'green',
      title: 'Database Ready',
      description: 'All migrations have been applied successfully',
    });

    render(<MigrationStatusModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Database Ready/i)).toBeInTheDocument();
      expect(screen.getByText(/All migrations have been applied successfully/i)).toBeInTheDocument();
    });
  });

  it('should display incomplete migration status with missing tables', async () => {
    const mockStatus = {
      is_complete: false,
      has_connection: true,
      extensions: { vector: true, pgcrypto: true },
      tables: {},
      missing_tables: ['archon_settings', 'archon_sources'],
      errors: [],
      summary: 'Database migration needed. Missing 2 required tables.',
      script_path: 'migration/complete_setup.sql',
    };

    vi.mocked(MigrationService.checkMigrationStatus).mockResolvedValue(mockStatus);
    vi.mocked(MigrationService.isMigrationNeeded).mockReturnValue(true);
    vi.mocked(MigrationService.getMissingDescription).mockReturnValue('2 required tables are missing');
    vi.mocked(MigrationService.formatStatus).mockReturnValue({
      icon: '!',
      color: 'yellow',
      title: 'Migration Required',
      description: '2 required tables are missing',
    });

    render(<MigrationStatusModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Migration Required/i)).toBeInTheDocument();
      expect(screen.getByText(/2 required tables are missing/i)).toBeInTheDocument();
    });
  });

  it('should display connection error', async () => {
    const mockStatus = {
      is_complete: false,
      has_connection: false,
      extensions: {},
      tables: {},
      missing_tables: [],
      errors: ['Database connection failed'],
      summary: 'Cannot connect to database.',
      script_path: '',
    };

    vi.mocked(MigrationService.checkMigrationStatus).mockResolvedValue(mockStatus);
    vi.mocked(MigrationService.formatStatus).mockReturnValue({
      icon: '⚠',
      color: 'red',
      title: 'Database Not Connected',
      description: 'Cannot connect to the database. Please check your configuration.',
    });

    render(<MigrationStatusModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Database Not Connected/i)).toBeInTheDocument();
      expect(screen.getByText(/Cannot connect to the database/i)).toBeInTheDocument();
    });
  });

  it('should show SQL script when migration is needed', async () => {
    const mockStatus = {
      is_complete: false,
      has_connection: true,
      extensions: {},
      tables: {},
      missing_tables: ['archon_settings'],
      errors: [],
      summary: 'Migration needed',
      script_path: 'migration/complete_setup.sql',
    };

    const mockScript = '-- SQL migration script\nCREATE TABLE test;';

    vi.mocked(MigrationService.checkMigrationStatus).mockResolvedValue(mockStatus);
    vi.mocked(MigrationService.isMigrationNeeded).mockReturnValue(true);
    vi.mocked(MigrationService.getMigrationScript).mockResolvedValue(mockScript);

    render(<MigrationStatusModal isOpen={true} onClose={vi.fn()} />);

    // Click to load SQL script
    await waitFor(() => {
      const loadScriptButton = screen.getByText(/View SQL Script/i);
      fireEvent.click(loadScriptButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/CREATE TABLE test/i)).toBeInTheDocument();
    });
  });

  it('should copy SQL script to clipboard', async () => {
    const mockStatus = {
      is_complete: false,
      has_connection: true,
      extensions: {},
      tables: {},
      missing_tables: ['archon_settings'],
      errors: [],
      summary: 'Migration needed',
      script_path: 'migration/complete_setup.sql',
    };

    const mockScript = '-- SQL migration script\nCREATE TABLE test;';

    vi.mocked(MigrationService.checkMigrationStatus).mockResolvedValue(mockStatus);
    vi.mocked(MigrationService.isMigrationNeeded).mockReturnValue(true);
    vi.mocked(MigrationService.getMigrationScript).mockResolvedValue(mockScript);

    render(<MigrationStatusModal isOpen={true} onClose={vi.fn()} />);

    // Load script first
    await waitFor(() => {
      const loadScriptButton = screen.getByText(/View SQL Script/i);
      fireEvent.click(loadScriptButton);
    });

    // Copy script
    await waitFor(() => {
      const copyButton = screen.getByText(/Copy SQL/i);
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockScript);
  });

  it('should refresh status when refresh button is clicked', async () => {
    const mockStatus = {
      is_complete: true,
      has_connection: true,
      extensions: {},
      tables: {},
      missing_tables: [],
      errors: [],
      summary: 'Complete',
      script_path: '',
    };

    vi.mocked(MigrationService.checkMigrationStatus).mockResolvedValue(mockStatus);

    render(<MigrationStatusModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      const refreshButton = screen.getByText(/Refresh Status/i);
      fireEvent.click(refreshButton);
    });

    expect(MigrationService.checkMigrationStatus).toHaveBeenCalledTimes(2);
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<MigrationStatusModal isOpen={true} onClose={onClose} />);

    await waitFor(() => {
      const closeButton = screen.getByLabelText(/Close/i);
      fireEvent.click(closeButton);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('should display error state when status check fails', async () => {
    vi.mocked(MigrationService.checkMigrationStatus).mockRejectedValue(new Error('Network error'));

    render(<MigrationStatusModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to check migration status/i)).toBeInTheDocument();
    });
  });
});