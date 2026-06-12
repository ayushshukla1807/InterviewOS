'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Maximize2, Minimize2, Trash2 } from 'lucide-react';

// Excalidraw relies on window being present, so we dynamic import it
const Excalidraw = dynamic(
  async () => {
    const mod = await import('@excalidraw/excalidraw');
    return mod.Excalidraw;
  },
  { ssr: false }
);

interface WhiteboardIDEProps {
  theme?: { bg: string; border: string };
}

export default function WhiteboardIDE({ theme = { bg: '#050508', border: 'rgba(255,255,255,0.05)' } }: WhiteboardIDEProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [fullEditor, setFullEditor] = useState(false);

  // Wrapper styles
  const S = {
    wrap: {
      flex: 1, display: 'flex', flexDirection: 'column' as const,
      background: theme.bg, color: '#e6edf3',
      position: fullEditor ? 'fixed' as const : 'relative' as const,
      inset: fullEditor ? 0 : 'auto', zIndex: fullEditor ? 9999 : 1,
    },
    editorTopBar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px', background: '#0d1117',
      borderBottom: `1px solid ${theme.border}`,
      minHeight: 46, flexShrink: 0,
    },
    title: {
      fontSize: 12, fontWeight: 700, color: '#58a6ff',
      textTransform: 'uppercase' as const, letterSpacing: '1px'
    },
    iconBtn: {
      background: 'transparent', border: 'none', color: '#8b949e', cursor: 'pointer',
      padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: '0.2s'
    }
  };

  const handleClear = () => {
    if (excalidrawAPI) {
      excalidrawAPI.resetScene();
    }
  };

  return (
    <div style={S.wrap}>
      {/* Top Bar */}
      <div style={S.editorTopBar}>
        <div style={S.title}>SYSTEM ARCHITECTURE CANVAS</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleClear} title="Clear Canvas" style={S.iconBtn} onMouseEnter={e => e.currentTarget.style.color = '#ff375f'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>
            <Trash2 size={14} />
          </button>
          <button onClick={() => setFullEditor(p => !p)} title="Toggle fullscreen" style={S.iconBtn} onMouseEnter={e => e.currentTarget.style.color = '#c9d1d9'} onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}>
            {fullEditor ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Excalidraw 
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)} 
          theme="dark"
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: false,
              clearCanvas: false, // Handled by our custom button
              loadScene: false,
              saveToActiveFile: false,
              toggleTheme: false,
              saveAsImage: true,
            }
          }}
        />
      </div>
    </div>
  );
}
