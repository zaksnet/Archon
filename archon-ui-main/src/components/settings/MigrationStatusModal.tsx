import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, Copy, CheckCircle, XCircle, AlertCircle, Database, Check, ExternalLink, Loader } from 'lucide-react';
import { MigrationService, MigrationStatus } from '../../services/migrationService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../../contexts/ToastContext';

interface MigrationStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MigrationStatusModal: React.FC<MigrationStatusModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sqlScript, setSqlScript] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const migrationStatus = await MigrationService.checkMigrationStatus();
      setStatus(migrationStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check migration status');
    } finally {
      setLoading(false);
    }
  };

  const executeMigration = async () => {
    setExecuting(true);
    setError(null);
    setMigrationResult(null);
    
    try {
      const result = await MigrationService.executeMigration();
      setMigrationResult(result);
      
      if (result.success && result.already_migrated) {
        showToast('Database is already migrated!', 'info');
        checkStatus();
      } else if (result.requires_manual) {
        // Show the SQL script that was returned
        setShowScript(true);
        if (result.sql_script) {
          setSqlScript(result.sql_script);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to prepare migration';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setExecuting(false);
    }
  };


  const copyToClipboard = async () => {
    if (sqlScript) {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />;
    if (error) return <XCircle className="w-8 h-8 text-red-500" />;
    if (!status) return <AlertCircle className="w-8 h-8 text-gray-500" />;
    
    const formatted = MigrationService.formatStatus(status);
    switch (formatted.color) {
      case 'green':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'red':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'yellow':
        return <AlertCircle className="w-8 h-8 text-yellow-500" />;
      default:
        return <Database className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusContent = () => {
    if (loading) {
      return (
        <div className="text-center">
          <p className="text-gray-400">Checking migration status...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center">
          <p className="text-red-400">Failed to check migration status</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      );
    }

    if (!status) {
      return (
        <div className="text-center">
          <p className="text-gray-400">No status information available</p>
        </div>
      );
    }

    const formatted = MigrationService.formatStatus(status);
    const needsMigration = MigrationService.isMigrationNeeded(status);

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">{formatted.title}</h3>
          <p className="text-sm text-gray-400 mt-1">{formatted.description}</p>
        </div>

        {/* Status Details */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Database Connection:</span>
              <span className={status.has_connection ? 'text-green-400' : 'text-red-400'}>
                {status.has_connection ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            
            {status.extensions && Object.keys(status.extensions).length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Extensions:</span>
                <span>
                  {Object.entries(status.extensions).map(([name, exists]) => (
                    <span key={name} className={exists ? 'text-green-400' : 'text-red-400'}>
                      {name}{exists ? ' ✓' : ' ✗'}{' '}
                    </span>
                  ))}
                </span>
              </div>
            )}

            {status.missing_tables.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Missing Tables:</span>
                <span className="text-red-400">{status.missing_tables.length}</span>
              </div>
            )}

            {status.tables && Object.keys(status.tables).length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Total Tables:</span>
                <span className="text-green-400">
                  {Object.values(status.tables).filter(t => t.exists).length} / {Object.keys(status.tables).length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Migration Instructions */}
        {needsMigration && !showScript && (
          <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">Migration Required</h4>
            <p className="text-sm text-gray-300">
              Your database needs to be initialized with the required tables and extensions.
              Click "Run Migration Script" below to get started.
            </p>
          </div>
        )}

        {/* SQL Script Section */}
        {needsMigration && (
          <div className="space-y-2">
            <Button
              onClick={executeMigration}
              variant="primary"
              className="w-full"
              disabled={executing}
            >
              {executing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Loading Migration Script...
                </>
              ) : (
                'View Migration Script'
              )}
            </Button>

            {(showScript || migrationResult?.requires_manual) && (
              <div className="space-y-3">
                {migrationResult?.supabase_sql_url && (
                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Complete Migration in Supabase
                    </h4>
                    <div className="space-y-3">
                      <Button
                        onClick={() => window.open(migrationResult.supabase_sql_url, '_blank')}
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Supabase SQL Editor
                      </Button>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                        <li>Click the button above to open SQL Editor</li>
                        <li>Copy the script below and paste it there</li>
                        <li>Click "Run" in the SQL Editor</li>
                        <li>Return here and click "Refresh Status"</li>
                      </ol>
                    </div>
                  </div>
                )}
                
                {!migrationResult?.supabase_sql_url && (
                  <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Manual Migration Required
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                      <li>Copy the migration script below</li>
                      <li>Open your Supabase SQL Editor</li>
                      <li>Paste and run the script</li>
                      <li>Click "Refresh Status" below to verify</li>
                    </ol>
                  </div>
                )}
                
                {sqlScript && (
                  <div className="relative">
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto max-h-64 text-xs border border-gray-800">
                      <code>{sqlScript}</code>
                  </pre>
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Script
                      </>
                    )}
                  </button>
                </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Messages */}
        {status.errors && status.errors.length > 0 && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-2">Errors</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-300">
              {status.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="relative">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <Database className="w-6 h-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-white">
                    Database Migration Status
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <div className="flex justify-center mb-6">
                  {getStatusIcon()}
                </div>

                {getStatusContent()}

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={checkStatus}
                    disabled={loading}
                    variant="secondary"
                    className="flex-1"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh Status
                  </Button>
                  
                  {status?.is_complete && (
                    <Button
                      onClick={onClose}
                      variant="primary"
                      className="flex-1"
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};