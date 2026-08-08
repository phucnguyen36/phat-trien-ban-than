/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, Save, Sparkles, Trash2, History, ChevronDown, ChevronUp, Clock, RotateCcw } from 'lucide-react';

interface NoteSnapshot {
  id: string;
  title: string;
  text: string;
  tag?: '#idea' | '#todo' | '#reference' | '';
  createdAt: number;
}

interface ScratchpadProps {
  initialText?: string;
  isCloudConnected?: boolean;
  onSaveText?: (text: string) => void;
  onSaveScratchpadText?: (text: string) => void;
  isLightMode?: boolean;
}

export default function Scratchpad({ 
  initialText, 
  isCloudConnected, 
  onSaveText, 
  onSaveScratchpadText, 
  isLightMode 
}: ScratchpadProps) {
  const [text, setText] = useState<string>(initialText || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<string>('Just now');
  
  // Archive Snapshots state
  const [snapshots, setSnapshots] = useState<NoteSnapshot[]>([]);
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string>('');
  // C1 — Tag for next snapshot save + active filter
  const SNAP_TAGS = [
    { value: '#idea' as const, color: 'text-violet-400 border-violet-500/40 bg-violet-500/10' },
    { value: '#todo' as const, color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' },
    { value: '#reference' as const, color: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10' },
  ];
  const [nextTag, setNextTag] = useState<'#idea' | '#todo' | '#reference' | ''>('');
  const [filterTag, setFilterTag] = useState<'#idea' | '#todo' | '#reference' | ''>('');

  useEffect(() => {
    setText(initialText || '');
  }, [initialText]);

  // Load archived snapshots from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('df_scratchpad_snapshots_archive');
    if (saved) {
      try {
        setSnapshots(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveSnapshotsToStorage = (list: NoteSnapshot[]) => {
    setSnapshots(list);
    localStorage.setItem('df_scratchpad_snapshots_archive', JSON.stringify(list));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (onSaveText) onSaveText(val);
    if (onSaveScratchpadText) onSaveScratchpadText(val);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSnapshot = () => {
    if (!text.trim()) return;
    const titleSnippet = text.trim().slice(0, 30).replace(/\n/g, ' ') + (text.length > 30 ? '...' : '');
    const newSnap: NoteSnapshot = {
      id: 'snap_' + Date.now(),
      title: titleSnippet || 'Note Snapshot',
      text: text,
      tag: nextTag || undefined,
      createdAt: Date.now()
    };
    const updated = [newSnap, ...snapshots];
    saveSnapshotsToStorage(updated);
    setNoticeMessage(`Note saved${nextTag ? ` as ${nextTag}` : ''} to archive!`);
    setTimeout(() => setNoticeMessage(''), 3000);
    setNextTag('');
  };

  const handleRestoreSnapshot = (snapText: string) => {
    setText(snapText);
    if (onSaveText) onSaveText(snapText);
    if (onSaveScratchpadText) onSaveScratchpadText(snapText);
    setLastSaved(new Date().toLocaleTimeString());
    setNoticeMessage('Restored note from archive into scratchpad!');
    setTimeout(() => setNoticeMessage(''), 3000);
  };

  const handleDeleteSnapshot = (id: string) => {
    const updated = snapshots.filter(s => s.id !== id);
    saveSnapshotsToStorage(updated);
  };

  const handleClear = () => {
    if (window.confirm('Clear active scratchpad text?')) {
      setText('');
      if (onSaveText) onSaveText('');
      if (onSaveScratchpadText) onSaveScratchpadText('');
      setLastSaved(new Date().toLocaleTimeString());
    }
  };

  return (
    <div id="scratchpad" className="p-6 md:p-8 glass-panel-true mb-12 border border-white/15 shadow-2xl space-y-6">
      
      {/* Scratchpad Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/15 pb-4">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white font-sans flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-300" />
            <span>Brain Scratchpad</span>
          </h2>
          <p className="text-xs font-sans text-zinc-400 mt-1">
            Unfiltered ideas, strategy outlines and quick code snippets
          </p>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-400 mr-1 hidden sm:inline">
            Saved: {lastSaved}
          </span>
          <button
            onClick={handleSaveSnapshot}
            className="px-3 py-1.5 glass-button-true text-xs font-sans font-semibold text-cyan-300 hover:text-white flex items-center gap-1.5 rounded-full"
            title="Save note snapshot into archive"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Save Snapshot</span>
          </button>
          {/* C1 — Pre-tag selector */}
          <div className="flex items-center gap-1">
            {SNAP_TAGS.map(({ value, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setNextTag(prev => prev === value ? '' : value)}
                className={`px-2 py-1 text-[9px] font-mono font-bold border rounded-full transition-all ${
                  nextTag === value ? color : 'text-zinc-600 border-zinc-700 hover:text-zinc-400'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsArchiveOpen(prev => !prev)}
            className="px-3 py-1.5 glass-button-true text-xs font-sans font-semibold text-zinc-200 hover:text-white flex items-center gap-1.5 rounded-full"
          >
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span>Archive ({snapshots.length})</span>
            {isArchiveOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 glass-button-true text-xs font-sans font-semibold text-white flex items-center gap-1.5 rounded-full"
            title="Copy notes to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 glass-button-true text-xs font-sans font-semibold text-zinc-400 hover:text-red-400 flex items-center gap-1.5 rounded-full"
            title="Clear scratchpad text"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {noticeMessage && (
        <div className="p-3 glass-card-true border-cyan-500/40 text-cyan-300 text-xs font-sans flex items-center gap-2 animate-fadeIn rounded-xl">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{noticeMessage}</span>
        </div>
      )}

      {/* Editor Area */}
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste code snippets, outline business strategies, or jot down unfiltered thoughts here. Auto-saved in real-time..."
          className="w-full h-96 glass-input-true p-5 text-xs font-mono leading-relaxed text-white placeholder-zinc-500 rounded-xl resize-y"
        />
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 px-1 font-bold">
          <span>CHARACTER COUNT: {text.length}</span>
          <span>WORD COUNT: {text.trim() ? text.trim().split(/\s+/).length : 0}</span>
        </div>
      </div>

      {/* Collapsible Archive Snapshots Drawer */}
      {isArchiveOpen && (
        <div className="pt-6 border-t border-white/15 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-sans font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Saved Scratchpad Note Snapshots</span>
            </h3>
            <div className="flex items-center gap-2">
              {/* C1 — Tag filter */}
              <span className="text-[9px] font-mono text-zinc-500">FILTER:</span>
              {SNAP_TAGS.map(({ value, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterTag(prev => prev === value ? '' : value)}
                  className={`px-2 py-0.5 text-[9px] font-mono font-bold border rounded-full transition-all ${
                    filterTag === value ? color : 'text-zinc-600 border-zinc-700 hover:text-zinc-400'
                  }`}
                >
                  {value}
                </button>
              ))}
              <span className="text-[10px] font-mono text-zinc-400 ml-2">
                {snapshots.length} saved
              </span>
            </div>
          </div>

          {snapshots.length === 0 ? (
            <div className="text-center py-8 glass-card-true text-xs font-sans text-zinc-400 rounded-xl">
              No saved snapshots found. Click "Save Snapshot" above to archive key note versions!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1 no-scrollbar">
              {snapshots.filter(s => !filterTag || s.tag === filterTag).map((snap) => {
                const tagMeta = snap.tag ? SNAP_TAGS.find(t => t.value === snap.tag) : null;
                return (
                <div
                  key={snap.id}
                  className="p-4 glass-card-true transition-all rounded-xl flex flex-col justify-between space-y-3 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-bold text-cyan-300 truncate max-w-[200px]">
                      {snap.title}
                    </span>
                    <div className="flex items-center gap-2">
                      {tagMeta && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${tagMeta.color}`}>
                          {snap.tag}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(snap.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-mono text-zinc-300 line-clamp-3 leading-relaxed bg-black/20 p-2.5 rounded-lg whitespace-pre-wrap">
                    {snap.text}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {snap.text.length} chars
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap.text)}
                        className="px-2.5 py-1 glass-button-true text-zinc-200 hover:text-white flex items-center gap-1 rounded-lg text-[10px] font-sans font-semibold"
                        title="Restore note into active scratchpad"
                      >
                        <RotateCcw className="w-3 h-3 text-cyan-300" />
                        <span>Restore Note</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSnapshot(snap.id)}
                        className="p-1 glass-button-true text-zinc-500 hover:text-red-400 rounded-lg"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
