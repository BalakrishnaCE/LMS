import { useSyncExternalStore } from 'react';
import { chatStreamStore } from '@/stores/chatStreamStore';

export function useChatStream() {
  return useSyncExternalStore(
    chatStreamStore.subscribe,
    chatStreamStore.getState,
  );
}
