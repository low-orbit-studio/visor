'use client';

import { useState } from 'react';

interface ComponentPreviewProps {
  children: React.ReactNode;
  code: string;
  title?: string;
}

export function ComponentPreview({
  children,
  code,
  title,
}: ComponentPreviewProps) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="preview-container">
      <div className="preview-render" style={{ isolation: 'isolate', color: 'var(--text-primary)' }}>
        {children}
      </div>
      <div className="preview-footer">
        {title ? <p className="preview-title">{title}</p> : <span />}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {showCode && (
            <button className="preview-copy" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          <button
            className="preview-toggle"
            onClick={() => setShowCode(!showCode)}
          >
            {showCode ? 'Hide Code' : 'Show Code'}
          </button>
        </div>
      </div>
      {showCode && (
        <div className="preview-code">
          <pre
            style={{
              margin: 0,
              padding: '1rem',
              overflowX: 'auto',
              fontSize: '0.8125rem',
              lineHeight: 1.6,
              backgroundColor: '#0f172a',
              color: '#e2e8f0',
            }}
          >
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
