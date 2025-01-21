import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language: string;
  onLanguageChange: (language: string) => void;
}

export function CodeEditor({ code, onChange, language, onLanguageChange }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages = [
    'javascript',
    'typescript',
    'python',
    'java',
    'cpp',
    'html',
    'css',
  ];

  return (
    <div className="h-full flex flex-col bg-black/30 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-2 border-b border-white/10">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {languages.map(lang => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={handleCopy}
          className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full p-4 bg-transparent text-white font-mono text-sm resize-none focus:outline-none"
        placeholder="Write or paste your code here..."
      />
    </div>
  );
}