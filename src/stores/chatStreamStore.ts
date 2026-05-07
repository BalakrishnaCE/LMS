// Module-level store: survives component unmounts/remounts
type Listener = () => void;

interface StreamState {
  isStreaming: boolean;
  accumulatedText: string;
  streamingMessageId: string | null;
}

let state: StreamState = {
  isStreaming: false,
  accumulatedText: '',
  streamingMessageId: null,
};

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export const chatStreamStore = {
  getState: () => state,

  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  startStream: (messageId: string) => {
    state = { isStreaming: true, accumulatedText: '', streamingMessageId: messageId };
    notify();
  },

  appendChunk: (chunk: string) => {
    state = { ...state, accumulatedText: state.accumulatedText + chunk };
    notify();
  },

  endStream: () => {
    state = { ...state, isStreaming: false };
    notify();
  },

  reset: () => {
    state = { isStreaming: false, accumulatedText: '', streamingMessageId: null };
    notify();
  },
};
