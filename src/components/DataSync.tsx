import { useRef, useState } from 'react';
import { TrackerData, PriceEntry } from '../types';
import { exportToJSON, importFromJSON, downloadJSON, mergeNewPrices, deduplicateData } from '../utils/storage';
import { getToken, setToken, clearToken, validateToken } from '../utils/gist';

interface Props {
  data: TrackerData;
  onReplace: (data: TrackerData) => void;
  onClear: () => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  onForceSync: () => void;
}

export function DataSync({ data, onReplace, onClear, syncStatus, onForceSync }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editorValue, setEditorValue] = useState('');
  const [editorError, setEditorError] = useState('');

  const hasToken = !!getToken();

  const handleExportFile = () => {
    downloadJSON(data);
  };

  const handleCopyClipboard = async () => {
    const json = exportToJSON(data);
    await navigator.clipboard.writeText(json);
    alert('Data copied to clipboard!');
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = importFromJSON(ev.target?.result as string);
        const allPrices: Record<string, PriceEntry[]> = {};
        for (const [name, card] of Object.entries(imported.cards)) {
          allPrices[name] = card.prices;
        }
        const merged = mergeNewPrices(data, allPrices);
        onReplace(merged);
        alert(`Imported ${Object.keys(imported.cards).length} cards!`);
      } catch (err) {
        alert(`Import failed: ${err instanceof Error ? err.message : 'Invalid JSON'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const imported = importFromJSON(text);
      const allPrices: Record<string, PriceEntry[]> = {};
      for (const [name, card] of Object.entries(imported.cards)) {
        allPrices[name] = card.prices;
      }
      const merged = mergeNewPrices(data, allPrices);
      onReplace(merged);
      alert(`Imported ${Object.keys(imported.cards).length} cards from clipboard!`);
    } catch (err) {
      alert(`Paste failed: ${err instanceof Error ? err.message : 'Invalid clipboard data'}`);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      onClear();
    }
  };

  const handleSaveToken = async () => {
    const trimmed = tokenInput.trim();
    if (!trimmed) return;
    setSaving(true);
    setTokenError('');
    const valid = await validateToken(trimmed);
    if (valid) {
      setToken(trimmed);
      setTokenInput('');
      onForceSync();
    } else {
      setTokenError('Invalid token. Make sure it has "gist" scope.');
    }
    setSaving(false);
  };

  const handleDisconnect = () => {
    if (confirm('Disconnect GitHub sync? Your local data will be kept.')) {
      clearToken();
      setTokenInput('');
    }
  };

  const handleDeduplicate = () => {
    const { data: cleaned, removed } = deduplicateData(data);
    if (removed === 0) {
      alert('No duplicates found!');
      return;
    }
    onReplace(cleaned);
    alert(`Removed ${removed} duplicate entries.`);
  };

  const openEditor = () => {
    setEditorValue(exportToJSON(data));
    setEditorError('');
    setShowEditor(true);
  };

  const handleEditorSave = () => {
    try {
      const parsed = importFromJSON(editorValue);
      onReplace(parsed);
      setShowEditor(false);
      setEditorError('');
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const cardCount = Object.keys(data.cards).length;

  const syncLabel = {
    idle: 'Not connected',
    syncing: 'Syncing...',
    synced: 'Synced',
    error: 'Sync error',
  }[syncStatus];

  return (
    <div className="data-sync">
      <h2>Data Management</h2>
      <p className="data-info">
        {cardCount} cards tracked
      </p>

      <div className="sync-buttons">
        <div className="sync-group">
          <h3>GitHub Sync</h3>
          {hasToken ? (
            <div className="gist-sync-status">
              <div className={`sync-indicator ${syncStatus}`}>
                <span className="sync-dot" />
                {syncLabel}
              </div>
              <button onClick={onForceSync} disabled={syncStatus === 'syncing'}>
                Force Sync
              </button>
              <button onClick={handleDisconnect} className="btn-danger">
                Disconnect
              </button>
            </div>
          ) : (
            <div className="gist-token-setup">
              <p className="sync-help">
                Connect a GitHub token with <code>gist</code> scope to sync across devices.
              </p>
              <div className="token-input-row">
                <input
                  type="password"
                  placeholder="ghp_..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveToken()}
                />
                <button onClick={handleSaveToken} disabled={saving || !tokenInput.trim()}>
                  {saving ? 'Verifying...' : 'Connect'}
                </button>
              </div>
              {tokenError && <p className="error">{tokenError}</p>}
            </div>
          )}
        </div>

        <div className="sync-group">
          <h3>Export</h3>
          <button onClick={handleExportFile}>Download JSON</button>
          <button onClick={handleCopyClipboard}>Copy to Clipboard</button>
        </div>
        <div className="sync-group">
          <h3>Import</h3>
          <button onClick={handleImportFile}>Import JSON File</button>
          <button onClick={handlePasteClipboard}>Paste from Clipboard</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
        <div className="sync-group">
          <h3>Edit Data</h3>
          <button onClick={openEditor}>Edit JSON</button>
          <button onClick={handleDeduplicate}>Deduplicate</button>
        </div>
        <div className="sync-group">
          <h3>Danger Zone</h3>
          <button onClick={handleClear} className="btn-danger" disabled={cardCount === 0}>
            Clear All Data
          </button>
        </div>
      </div>

      {showEditor && (
        <div className="modal-overlay" onClick={() => setShowEditor(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Tracker Data</h3>
              <button className="btn-small" onClick={() => setShowEditor(false)}>✕</button>
            </div>
            <textarea
              className="json-editor"
              value={editorValue}
              onChange={(e) => {
                setEditorValue(e.target.value);
                setEditorError('');
              }}
              spellCheck={false}
            />
            {editorError && <p className="error">{editorError}</p>}
            <div className="modal-actions">
              <button onClick={() => setShowEditor(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleEditorSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
