import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatPanel from './ChatPanel';

function ChatFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800 rotate-90'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
        title="AI 학습 도우미"
      >
        <MessageCircle size={24} />
      </button>
    </>
  );
}

export default ChatFloatingButton;
