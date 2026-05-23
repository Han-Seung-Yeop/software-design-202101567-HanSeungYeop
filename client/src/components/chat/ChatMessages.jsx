import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ChatMessages({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-sm'
                : msg.isError
                ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}
          >
            {msg.role === 'assistant' ? (
              <div className="prose prose-sm max-w-none prose-table:text-xs prose-td:py-1 prose-th:py-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content || (msg.isStreaming ? '▋' : '')}
                </ReactMarkdown>
                {msg.isStreaming && msg.content && (
                  <span className="inline-block w-1 h-3.5 bg-gray-500 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{msg.content}</p>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default ChatMessages;
