import { useEffect, useState } from 'react';
import { ipc } from '@/lib/ipc';

export function useIpc() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // En Web (Railway) siempre está listo (usa HTTP).
    // En Electron, espera a que el preload exponga `electronAPI`.
    if (typeof window !== 'undefined' && !window.electronAPI) {
      setIsReady(true);
      return;
    }

    if (typeof window !== 'undefined' && window.electronAPI) {
      setIsReady(true);
      return;
    }

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.electronAPI) {
        setIsReady(true);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return { ipc, isReady };
}



