import { useState, useCallback, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * SSE 기반 챗봇 훅.
 *
 * messages 형식: [{ id, role: 'user'|'assistant', content, isStreaming }]
 * history  형식: Gemini API용 [{ role: 'user'|'model', parts: [{ text }] }]
 */
const useChatSSE = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const historyRef = useRef([]); // Gemini turn 기록 (SSE 응답 완료 후 append)
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (userText, selectedStudentId = null) => {
    if (!userText.trim() || isLoading) return;

    const userMsg = { id: Date.now(), role: 'user', content: userText };
    const assistantMsgId = Date.now() + 1;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true },
    ]);
    setIsLoading(true);

    const token = localStorage.getItem('accessToken');
    const controller = new AbortController();
    abortRef.current = controller;

    let fullResponse = '';

    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userText,
          history: historyRef.current,
          selectedStudentId,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 마지막 불완전한 줄은 버퍼에 남김

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          let event;
          try { event = JSON.parse(jsonStr); } catch { continue; }

          if (event.type === 'chunk') {
            fullResponse += event.text;
            const snapshot = fullResponse;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: snapshot } : m
              )
            );
          } else if (event.type === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, isStreaming: false } : m
              )
            );
            // 대화 이력 추가 (OpenAI/Groq 호환 형식)
            historyRef.current = [
              ...historyRef.current,
              { role: 'user', content: userText },
              { role: 'assistant', content: fullResponse },
            ];
          } else if (event.type === 'error') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? { ...m, content: event.message, isStreaming: false, isError: true }
                  : m
              )
            );
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: '연결 오류가 발생했습니다.', isStreaming: false, isError: true }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [isLoading]);

  const resetChat = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    if (abortRef.current) abortRef.current.abort();
    setIsLoading(false);
  }, []);

  return { messages, isLoading, sendMessage, resetChat };
};

export default useChatSSE;
