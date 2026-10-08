import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { SYMBOL } from './brand.ts';
import { PATHS, type IconName } from './icon-paths.ts';

export function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="logo" role="img" aria-label="Ancher">
      <svg width={size} height={size} viewBox={SYMBOL.viewBox} aria-hidden="true"><path d={SYMBOL.path} fill="currentColor" /></svg>
    </span>
  );
}

const ToastCtx = createContext<(text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

/** Toast duration scales with length (~reading speed), min 2.2s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState('');
  const [show, setShow] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const toast = useCallback((t: string) => {
    setText(t);
    setShow(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShow(false), Math.max(2200, t.length * 120));
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={`toast${show ? ' show' : ''}`} role="status" aria-live="polite">{text}</div>
    </ToastCtx.Provider>
  );
}

export const isMac = navigator.userAgent.includes('Mac');
