'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';

interface BlockCodeContextValue {
  setCode: (code: string) => void;
}

const BlockCodeContext = createContext<BlockCodeContextValue | null>(null);

interface BlockCodeProviderProps {
  children: ReactNode;
  onCodeChange: (code: string) => void;
}

export function BlockCodeProvider({ children, onCodeChange }: BlockCodeProviderProps) {
  const value = { setCode: onCodeChange };
  return (
    <BlockCodeContext.Provider value={value}>
      {children}
    </BlockCodeContext.Provider>
  );
}

/**
 * Hook for blocks to push live code to their parent BlockPreview.
 * Returns null when not inside a BlockPreview — safe to call unconditionally.
 */
export function useBlockCode(): BlockCodeContextValue | null {
  return useContext(BlockCodeContext);
}
