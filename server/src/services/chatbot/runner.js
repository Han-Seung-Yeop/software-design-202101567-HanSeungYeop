const { groq, MODEL } = require('../../config/groq');
const { buildSystemPrompt } = require('./systemPrompt');
const { groqToolDefinitions, toolExecutors } = require('./tools/index');

/**
 * Tool 라운드는 non-streaming으로 처리 (llama 스트리밍 버그 회피).
 * 최종 답변만 streaming으로 전달.
 */
const runChat = async (history, userMessage, reqUser, onChunk) => {
  const systemPrompt = buildSystemPrompt(reqUser);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ];

  // Tool 루프 — non-streaming으로 tool_calls 감지
  let toolEverCalled = false;
  let noToolRetried = false;

  while (true) {
    let response;
    try {
      response = await groq.chat.completions.create({
        model: MODEL,
        messages,
        tools: groqToolDefinitions,
        tool_choice: 'auto',
        stream: false,
      });
    } catch (err) {
      // Groq 400 (failed_generation): 지원하지 않는 함수 호출 시도 등 — 루프 탈출 후 최종 답변 진행
      if (err.status === 400) break;
      throw err;
    }

    const msg = response.choices[0].message;
    const toolCalls = msg.tool_calls || [];

    console.log(`[runner] toolCalls=${toolCalls.length}, content="${(msg.content || '').substring(0, 80)}"`);
    for (const tc of toolCalls) {
      console.log(`[runner]  → ${tc.function.name}(${tc.function.arguments})`);
    }

    // Tool 호출 없을 때: 아직 tool을 한 번도 안 썼고 첫 재시도라면 한 번 더 시도
    if (!toolCalls.length) {
      if (!toolEverCalled && !noToolRetried) {
        noToolRetried = true;
        if (msg.content) messages.push({ role: 'assistant', content: msg.content });
        messages.push({ role: 'user', content: '반드시 도구를 직접 호출해서 실제 데이터를 조회하세요. 데이터를 임의로 생성하지 마세요.' });
        console.log('[runner] no tool called — retrying with hint');
        continue;
      }
      break;
    }

    toolEverCalled = true;

    // assistant 메시지 + tool 결과 추가
    messages.push({ role: 'assistant', content: msg.content || null, tool_calls: toolCalls });

    for (const tc of toolCalls) {
      const executor = toolExecutors[tc.function.name];
      let result;
      if (!executor) {
        result = { error: `Unknown tool: ${tc.function.name}` };
      } else {
        try {
          const args = JSON.parse(tc.function.arguments || '{}');
          result = await executor(args, reqUser);
        } catch (err) {
          result = { error: err.message };
        }
      }
      messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
    }
  }

  // 최종 답변 streaming (tools 제외 — llama streaming 버그 회피)
  const finalStream = await groq.chat.completions.create({
    model: MODEL,
    messages,
    stream: true,
  });

  for await (const chunk of finalStream) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) onChunk(text);
  }
};

module.exports = { runChat };
