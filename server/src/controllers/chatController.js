const { runChat } = require('../services/chatbot/runner');

/**
 * POST /api/chat/stream
 * SSE 스트리밍으로 챗봇 응답 반환.
 *
 * Request body:
 *   - message: string          사용자 입력
 *   - history: array (optional) 이전 대화 내역 [{ role, parts: [{ text }] }]
 *
 * SSE 이벤트:
 *   - data: { type: 'chunk', text }   텍스트 조각
 *   - data: { type: 'done' }          완료
 *   - data: { type: 'error', message } 오류
 */
const stream = async (req, res, next) => {
  const { message, history = [], selectedStudentId } = req.body;

  // 학부모: 선택된 자녀 정보를 req.user에 주입
  if (req.user.role === 'parent' && selectedStudentId) {
    const child = (req.user.children || []).find((c) => c.studentId === selectedStudentId);
    if (child) req.user.selectedChild = child;
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: '메시지를 입력해주세요.', error: 'EMPTY_MESSAGE' });
  }

  // SSE 헤더 설정
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await runChat(
      history,
      message.trim(),
      req.user,
      (chunk) => send({ type: 'chunk', text: chunk }),
    );
    send({ type: 'done' });
  } catch (err) {
    console.error('[chat] error:', err.stack || err.message);
    let userMessage = '챗봇 응답 중 오류가 발생했습니다.';
    if (err.status === 429) {
      userMessage = '일일 AI 요청 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
    } else if (err.status === 400) {
      userMessage = '요청을 처리할 수 없습니다. 다시 시도해주세요.';
    }
    send({ type: 'error', message: userMessage });
  } finally {
    res.end();
  }
};

// GET /api/chat/children — 학부모용: 자녀 목록 반환
const getChildren = (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ success: false, message: '학부모만 사용 가능합니다.', error: 'FORBIDDEN' });
  }
  return res.status(200).json({ success: true, data: req.user.children || [] });
};

module.exports = { stream, getChildren };
