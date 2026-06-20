import { buildContextBlock } from './contextBlock.js';
import { chatCompletion } from './deepseek.js';
import { getPromptsForMode } from './structuredPrompt.js';

function parseJsonResponse(text) {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

function extractPromptBlock(text) {
  if (!text) return '';
  const match = text.match(/---\s*([\s\S]*?)\s*---/);
  return match ? match[1].trim() : text.trim();
}

function buildAnswerLines(answers) {
  return Object.entries(answers || {})
    .map(([id, value]) => `- ${id}: ${value}`)
    .join('\n');
}

/**
 * Core coach logic — embedded in Electron main process.
 */
export async function runCoach({
  intent,
  answers,
  apiKey,
  mode = 'feature',
  clientVague = false,
  editorContext,
}) {
  if (!intent?.trim()) {
    const err = new Error('intent 不能为空');
    err.status = 400;
    throw err;
  }

  const contextBlock = buildContextBlock(editorContext);
  const { analyze, generate } = getPromptsForMode(mode);

  if (!answers || Object.keys(answers).length === 0) {
    const vagueTag = clientVague
      ? '\n（系统判断：用户输入较模糊，请先追问收窄，禁止 ready=true 并编造细节）'
      : '';

    const text = await chatCompletion({
      apiKey,
      system: analyze,
      messages: [
        {
          role: 'user',
          content:
            (mode === 'fix'
              ? `用户说 AI 做错了：${intent.trim()}`
              : `用户想写新功能：${intent.trim()}`) +
            contextBlock +
            vagueTag,
        },
      ],
      json: true,
    });

    const data = parseJsonResponse(text);
    if (data.prompt) data.prompt = extractPromptBlock(data.prompt);
    return data;
  }

  const allUncertain = Object.values(answers).every((v) => String(v).includes('不确定'));
  const uncertainTag = allUncertain
    ? '\n\n（用户几乎全选「不确定」：confidence 必须 low，多用 [待确认]，加 before_coding 让 Cursor 先确认再改）'
    : '';

  const text = await chatCompletion({
    apiKey,
    system: generate,
    messages: [
      {
        role: 'user',
        content: `场景：${mode === 'fix' ? '纠正 AI' : '写新功能'}\n原始描述：${intent.trim()}${contextBlock}\n\n用户选择：\n${buildAnswerLines(answers)}${uncertainTag}`,
      },
    ],
    json: true,
  });

  const data = parseJsonResponse(text);
  if (data.prompt) data.prompt = extractPromptBlock(data.prompt);
  return data;
}
