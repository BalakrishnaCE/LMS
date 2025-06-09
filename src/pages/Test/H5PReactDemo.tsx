import React, { useState, useEffect, useRef } from 'react';
import { H5PPlayerUI, H5PEditorUI } from '@lumieducation/h5p-react';

const API_BASE = 'http://10.80.4.72/h5p';

interface H5PContentMeta {
  id: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  // Add more fields as needed
}

interface H5PLibrary {
  name: string;
  title: string;
  runnable: boolean;
  restricted: boolean;
  majorVersion: number;
  minorVersion: number;
  patchVersion: number;
}

export default function H5PReactDemo() {
  const [contents, setContents] = useState<H5PContentMeta[]>([]);
  const [contentId, setContentId] = useState<string | null>(null);
  const [mode, setMode] = useState<'player' | 'editor'>('player');
  const [status, setStatus] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [libraries, setLibraries] = useState<H5PLibrary[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch all H5P contents on mount
  useEffect(() => {
    const fetchContents = async () => {
      setStatus('Loading contents...');
      try {
        const res = await fetch(`${API_BASE}/content`);
        const data = await res.json();
        console.log('Contents:', data);
        setContents(Array.isArray(data) ? data : []);
        setStatus(null);
      } catch (e: any) {
        setStatus(null);
        setError(e.message || 'Error loading contents');
        console.error(e);
      }
    };
    fetchContents();
  }, []);

  // Player callback
  const loadContentCallback = async (id: string) => {
    setStatus('Loading content...');
    try {
      const res = await fetch(`${API_BASE}/content/${id}`);
      const data = await res.json();
      console.log('Player model:', data);
      setStatus(null);
      return data;
    } catch (e: any) {
      setStatus(null);
      setError(e.message || 'Error loading content');
      console.error(e);
      throw e;
    }
  };

  // Editor callback (existing)
  const loadEditorContentCallback = async (id?: string) => {
    setStatus('Loading editor...');
    try {
      const url = id ? `${API_BASE}/content/${id}` : `${API_BASE}/content`;
      const res = await fetch(url);
      const data = await res.json();
      console.log('Editor model:', data);
      setStatus(null);
      return data;
    } catch (e: any) {
      setStatus(null);
      setError(e.message || 'Error loading editor content');
      console.error(e);
      throw e;
    }
  };

  // For new content, return a model with the selected library
  const loadNewContentCallback = async () => {
    if (!selectedLibrary) {
      setError('Please select a library to create new content.');
      throw new Error('No library selected');
    }
    return { library: selectedLibrary, metadata: {}, params: {} };
  };

  // Save callback (existing or new)
  const saveContentCallback = async (id: string | undefined, requestBody: any) => {
    setStatus('Saving...');
    setError(null);
    try {
      const url = id ? `${API_BASE}/content/${id}` : `${API_BASE}/content`;
      const method = id ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const updated = await res.json();
      console.log('Save response:', updated);
      if (!res.ok) throw new Error(updated?.message || 'Failed to save content');
      setStatus('Saved!');
      setCreatingNew(false);
      setContentId(updated.id || id || null);
      // Re-fetch contents
      const listRes = await fetch(`${API_BASE}/content`);
      if (listRes.ok) setContents(await listRes.json());
      return updated;
    } catch (e: any) {
      setStatus(null);
      setError(e.message || 'Error saving content');
      console.error(e);
      throw e;
    }
  };

  // Upload .h5p content file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('Uploading...');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('h5p', file);
      const res = await fetch(`${API_BASE}/content`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log('Upload response:', data);
      if (!res.ok) throw new Error(data?.message || 'Failed to upload');
      setStatus('Uploaded!');
      // Refresh list
      const listRes = await fetch(`${API_BASE}/content`);
      if (listRes.ok) setContents(await listRes.json());
    } catch (e: any) {
      setStatus(null);
      setError(e.message || 'Error uploading file');
      console.error(e);
    }
  };

  // Upload H5P library file
  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('Uploading library...');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/ajax?action=libraries`, { method: 'POST', body: formData });
      const data = await res.json();
      console.log('Library upload response:', data);
      if (!res.ok) throw new Error(data?.message || 'Failed to upload library');
      setStatus('Library uploaded!');
      // Refresh libraries if in create new mode
      if (creatingNew) {
        const resLib = await fetch(`${API_BASE}/ajax?action=libraries`, { method: 'POST' });
        const libs = await resLib.json();
        setLibraries(Array.isArray(libs) ? libs.filter((lib) => lib.runnable && !lib.restricted) : []);
      }
    } catch (e: any) {
      setStatus(null);
      setError(e.message || 'Error uploading library');
      console.error(e);
    }
  };

  // Fetch libraries when creating new content
  const handleCreateNew = async () => {
    setCreatingNew(true);
    setContentId(null);
    setMode('editor');
    setSelectedLibrary('');
    setError(null);
    setStatus('Loading libraries...');
    try {
      // Use the AJAX endpoint for libraries (POST required)
      const res = await fetch(`${API_BASE}/ajax?action=libraries`, { method: 'POST' });
      const data = await res.json();
      console.log('Libraries:', data);
      setLibraries(Array.isArray(data) ? data.filter((lib) => lib.runnable && !lib.restricted) : []);
      setStatus(null);
    } catch (e: any) {
      setStatus(null);
      setError(e.message || 'Error loading libraries');
      setLibraries([]);
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2 className="text-xl font-bold mb-4">H5P React Demo</h2>
      <div className="mb-4 flex gap-2 items-center flex-wrap">
        <select
          value={contentId || ''}
          onChange={e => {
            setContentId(e.target.value || null);
            setCreatingNew(false);
            setError(null);
          }}
          className="border px-2 py-1 rounded"
        >
          <option value="">-- Select Content --</option>
          {contents.map(c => (
            <option key={c.id} value={c.id}>{c.title || c.id}</option>
          ))}
        </select>
        <button
          className="px-3 py-1 rounded border"
          onClick={handleCreateNew}
        >Create New</button>
        <button
          className={mode === 'player' ? 'bg-primary text-white px-3 py-1 rounded' : 'px-3 py-1 rounded border'}
          onClick={() => setMode('player')}
          disabled={creatingNew}
        >Player</button>
        <button
          className={mode === 'editor' ? 'bg-primary text-white px-3 py-1 rounded' : 'px-3 py-1 rounded border'}
          onClick={() => setMode('editor')}
        >Editor</button>
        <input
          type="file"
          accept=".h5p"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />
        <button
          className="px-3 py-1 rounded border"
          onClick={() => fileInputRef.current?.click()}
        >Upload .h5p</button>
        <input
          type="file"
          accept=".h5p"
          ref={libraryFileInputRef}
          style={{ display: 'none' }}
          onChange={handleLibraryUpload}
        />
        <button
          className="px-3 py-1 rounded border"
          onClick={() => libraryFileInputRef.current?.click()}
        >Upload H5P Library</button>
      </div>
      {error && <div className="mb-2 text-sm text-red-600">{error}</div>}
      {status && <div className="mb-2 text-sm text-muted-foreground">{status}</div>}
      {creatingNew && libraries.length > 0 && (
        <div className="mb-4">
          <label className="mr-2 font-medium">Select Content Type:</label>
          <select
            value={selectedLibrary}
            onChange={e => setSelectedLibrary(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="">-- Select Library --</option>
            {libraries.map(lib => (
              <option key={lib.name} value={lib.name}>
                {lib.title} ({lib.majorVersion}.{lib.minorVersion}.{lib.patchVersion})
              </option>
            ))}
          </select>
        </div>
      )}
      {mode === 'player' && contentId && !creatingNew && (
        <H5PPlayerUI
          contentId={contentId}
          loadContentCallback={loadContentCallback}
        />
      )}
      {mode === 'editor' && (
        <>
          {creatingNew && !selectedLibrary && (
            <div className="mb-2 text-sm text-blue-600">Please select a content type to start creating.</div>
          )}
          {(!creatingNew || selectedLibrary) && (
            <H5PEditorUI
              contentId={creatingNew ? '' : contentId || ''}
              loadContentCallback={creatingNew ? loadNewContentCallback : loadEditorContentCallback}
              saveContentCallback={saveContentCallback}
            />
          )}
        </>
      )}
    </div>
  );
} 