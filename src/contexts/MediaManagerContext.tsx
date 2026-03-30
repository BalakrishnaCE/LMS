import React, { createContext, useContext, useRef, useCallback, useEffect } from 'react';

interface MediaElement {
  id: string;
  element: HTMLVideoElement | HTMLAudioElement;
  pause: () => void;
}

interface MediaManagerContextType {
  registerMedia: (id: string, element: HTMLVideoElement | HTMLAudioElement) => void;
  unregisterMedia: (id: string) => void;
  pauseAllExcept: (id: string) => void;
}

const MediaManagerContext = createContext<MediaManagerContextType | null>(null);

export function MediaManagerProvider({ children }: { children: React.ReactNode }) {
  const mediaElementsRef = useRef<Map<string, MediaElement>>(new Map());

  const registerMedia = useCallback((id: string, element: HTMLVideoElement | HTMLAudioElement) => {
    mediaElementsRef.current.set(id, {
      id,
      element,
      pause: () => {
        if (element && !element.paused) {
          element.pause();
        }
      }
    });
  }, []);

  const unregisterMedia = useCallback((id: string) => {
    mediaElementsRef.current.delete(id);
  }, []);

  const pauseAllExcept = useCallback((id: string) => {
    mediaElementsRef.current.forEach((media, mediaId) => {
      if (mediaId !== id && media.element && !media.element.paused) {
        media.element.pause();
      }
    });
  }, []);

  return (
    <MediaManagerContext.Provider value={{ registerMedia, unregisterMedia, pauseAllExcept }}>
      {children}
    </MediaManagerContext.Provider>
  );
}

export function useMediaManager() {
  const context = useContext(MediaManagerContext);
  if (!context) {
    throw new Error('useMediaManager must be used within MediaManagerProvider');
  }
  return context;
}

