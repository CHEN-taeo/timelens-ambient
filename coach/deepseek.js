const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export function getApiKey(override) {
  return override || process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY;
}

export async function chatCompletion({ apiKey, system, messages, json = false }) {
  const key = getApiKey(apiKey);
  if (!key) {
    throw new Error('未配置 DEEPSEEK_API_KEY');
  }

  const body = {
    model: DEEPSEEK_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'system',
        content: json
          ? `${system}\n\n你必须只输出一个合法 json 对象，不要 markdown 代码块，不要其他文字。`
          : system,
      },
      ...messages,
    ],
  };

  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `DeepSeek API 错误 (${response.status})`);
  }

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('DeepSeek 返回了空内容');
  }

  return text;
}
