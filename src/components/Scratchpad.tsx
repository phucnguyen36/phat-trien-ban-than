/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, Save, Sparkles, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    setText(initialText || '');
  }, [initialText]);

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

  const handleClear = () => {
    if (window.confirm('Clear all scratchpad notes?')) {
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
          <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-white uppercase font-sans flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-300" />
            <span>Brain Scratchpad</span>
          </h2>
          <p className="text-[10px] font-mono text-zinc-300 tracking-widest uppercase mt-1 font-bold">
            UNFILTERED IDEAS & QUICK NOTES TELEMETRY
          </p>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-400 mr-2">
            Saved: {lastSaved}
          </span>
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 glass-button-true text-xs uppercase tracking-widest font-mono font-bold text-white flex items-center gap-1.5"
            title="Copy notes to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'COPIED' : 'COPY'}</span>
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 glass-button-true text-xs uppercase tracking-widest font-mono font-bold text-zinc-400 hover:text-red-400 flex items-center gap-1.5"
            title="Clear scratchpad text"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

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
    </div>
  );
}
