import { create } from 'zustand';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  view?: any;
  timestamp: string;
}

interface ConversationState {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),
}));
