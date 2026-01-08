import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api-client';
import { useConversationStore } from '../stores/conversation-store';
import { A2UIRenderer } from '../components/a2ui/A2UIRenderer';

export default function ChatPage() {
  const [input, setInput] = useState('');
  const { messages, addMessage } = useConversationStore();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const response = await api.agent.chat(message, history);
      return response.data;
    },
    onSuccess: (data) => {
      addMessage({
        role: 'assistant',
        content: data.message || '',
        view: data.view,
        timestamp: new Date().toISOString(),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage({
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    });

    chatMutation.mutate(input);
    setInput('');
  };

  const handleAction = async (action: any) => {
    try {
      const response = await api.agent.action(action);
      addMessage({
        role: 'assistant',
        content: response.data.message || '',
        view: response.data.view,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Action error:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Ask your AI personal trainer anything!
            </p>
            <div className="mt-6 space-y-2">
              <p className="text-sm text-gray-500">Try asking:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>"I weigh 187.6 lbs today"</li>
                <li>"Show me my weight history"</li>
                <li>"What's my progress?"</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800'
                } rounded-lg shadow p-4`}
              >
                {message.content && (
                  <p className={message.role === 'user' ? 'text-white' : 'text-gray-900 dark:text-white'}>
                    {message.content}
                  </p>
                )}
                {message.view && (
                  <div className="mt-4">
                    <A2UIRenderer view={message.view} onAction={handleAction} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-gray-500 dark:text-gray-400">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={chatMutation.isPending}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={chatMutation.isPending || !input.trim()}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
