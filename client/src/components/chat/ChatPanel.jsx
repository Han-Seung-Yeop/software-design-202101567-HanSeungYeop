import { useState, useRef, useEffect } from 'react';
import { X, Send, RotateCcw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import useChatSSE from '../../hooks/useChatSSE';
import ChatMessages from './ChatMessages';
import WelcomeMessage from './WelcomeMessage';
import ChildSelector from './ChildSelector';

function ChatPanel({ isOpen, onClose }) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, resetChat } = useChatSSE();
  const [input, setInput] = useState('');
  // 학부모: 선택된 자녀 { studentId, name }
  const [selectedChild, setSelectedChild] = useState(null);
  const inputRef = useRef(null);

  // 패널 열릴 때 input 포커스
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const handleSend = (text) => {
    const msg = text ?? input;
    if (!msg.trim() || isLoading) return;
    setInput('');
    const studentId = selectedChild?.studentId ?? null;
    sendMessage(msg, studentId);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    resetChat();
    setSelectedChild(null);
  };

  // 학부모이고 자녀 미선택이면 ChildSelector 표시
  const showChildSelector = user?.role === 'parent' && !selectedChild;
  const showWelcome = !showChildSelector && messages.length === 0;

  return (
    <div
      className={`fixed bottom-20 right-5 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 ${
        isOpen ? 'w-[360px] h-[560px] opacity-100 scale-100' : 'w-0 h-0 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎓</span>
          <div>
            <p className="text-sm font-semibold">학습 AI 도우미</p>
            {selectedChild && (
              <p className="text-xs text-blue-200">{selectedChild.name} 학생</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleReset}
            title="대화 초기화"
            className="p-1.5 rounded-lg hover:bg-blue-500 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-blue-500 transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto">
        {showChildSelector && (
          <ChildSelector
            onSelect={(child) => {
              setSelectedChild(child);
              resetChat();
            }}
          />
        )}
        {showWelcome && !showChildSelector && (
          <WelcomeMessage
            role={user?.role}
            userName={user?.name || ''}
            onSuggestionClick={(s) => handleSend(s)}
          />
        )}
        {!showChildSelector && <ChatMessages messages={messages} />}
      </div>

      {/* 입력창 */}
      {!showChildSelector && (
        <div className="px-3 py-3 border-t border-gray-100 shrink-0">
          <div className="flex gap-2 items-end bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent resize-none text-sm text-gray-800 placeholder-gray-400 outline-none max-h-24 leading-5"
              style={{ overflowY: input.split('\n').length > 4 ? 'auto' : 'hidden' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-1.5">
            Enter로 전송 · Shift+Enter 줄바꿈
          </p>
        </div>
      )}
    </div>
  );
}

export default ChatPanel;
