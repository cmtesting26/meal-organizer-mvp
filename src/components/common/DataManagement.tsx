/**
 * DataManagement Component (Sprint 16 — S16-09 compact redesign)
 *
 * Design Spec V1.4: Single card with heading + subtitle left,
 * two side-by-side buttons (Export Data | Import Data).
 * Expands inline for import preview/confirmation.
 */

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, AlertTriangle, CheckCircle2, FileJson, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  downloadExport,
  previewImport,
  importData,
  readFileAsText,
  type ImportPreview,
} from '@/lib/exportImport';

interface DataManagementProps {
  onImportComplete?: () => void;
}

export function DataManagement({ onImportComplete }: DataManagementProps) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      setExporting(true); setError(null);
      await downloadExport();
    } catch (err) {
      setError(t('dataManagement.exportError', 'Failed to export data. Please try again.'));
      console.error('Export error:', err);
    } finally { setExporting(false); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setImportResult(null);
    try {
      const text = await readFileAsText(file);
      setPendingFile(text);
      const result = previewImport(text);
      setPreview(result);
    } catch {
      setError(t('dataManagement.readError', 'Failed to read file.'));
      setPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async (mode: 'replace' | 'merge') => {
    if (!pendingFile) return;
    try {
      setImporting(true); setError(null);
      const result = await importData(pendingFile, mode);
      setImportResult(
        t('dataManagement.importSuccessDetail', {
          recipes: result.recipesImported,
          schedules: result.scheduleEntriesImported,
          defaultValue: `Successfully imported ${result.recipesImported} recipes and ${result.scheduleEntriesImported} schedule entries.`
        })
      );
      setPreview(null); setPendingFile(null);
      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('dataManagement.importError'));
    } finally { setImporting(false); }
  };

  const cancelImport = () => { setPreview(null); setPendingFile(null); setError(null); };

  return (
    <div className="bg-white rounded-lg border p-4 mb-2">
      {/* Compact header: icon + text left, buttons right */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Database className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm">{t('dataManagement.title')}</p>
            <p className="text-xs text-gray-500 truncate">{t('settings.dataManagementDescription', 'Export or restore your data')}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={handleExport}
            disabled={exporting}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            {exporting ? '...' : t('settings.export', 'Export')}
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect}
            className="hidden" id="import-file" aria-label={t('dataManagement.selectFile')} />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <Upload className="w-3.5 h-3.5 mr-1" />
            {t('settings.import', 'Import')}
          </Button>
        </div>
      </div>

      {/* Import preview (expands inline) */}
      {preview && (
        <div className="mt-4 border rounded-md p-3 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <FileJson className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium">{t('dataManagement.backupPreview', 'Backup Preview')}</span>
          </div>

          {preview.valid ? (
            <>
              <div className="text-sm text-gray-600 space-y-1">
                <p>📦 {preview.recipeCount} {t('dataManagement.recipesLabel', 'recipes')}</p>
                <p>📅 {preview.scheduleEntryCount} {t('dataManagement.schedulesLabel', 'schedule entries')}</p>
                {preview.exportedAt && (
                  <p>🕐 {t('dataManagement.exported', 'Exported')}: {new Date(preview.exportedAt).toLocaleDateString()}</p>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={() => handleImport('replace')} disabled={importing} size="sm" variant="destructive">
                  {importing ? t('dataManagement.importing', 'Importing...') : t('dataManagement.replaceAll', 'Replace All Data')}
                </Button>
                <Button onClick={() => handleImport('merge')} disabled={importing} size="sm" variant="outline">
                  {importing ? t('dataManagement.importing', 'Importing...') : t('dataManagement.mergeKeep', 'Merge (Keep Existing)')}
                </Button>
                <Button onClick={cancelImport} disabled={importing} size="sm" variant="ghost">
                  {t('delete.cancel')}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-red-600">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">{t('dataManagement.invalidFile', 'Invalid backup file')}</span>
              </div>
              <ul className="list-disc pl-5 space-y-1">
                {preview.errors.map((err, i) => (<li key={i}>{err}</li>))}
              </ul>
              <Button onClick={cancelImport} size="sm" variant="ghost" className="mt-2">
                {t('dataManagement.tryAnother', 'Try Another File')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Status messages */}
      {importResult && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{importResult}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
