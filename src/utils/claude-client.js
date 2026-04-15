import Anthropic from "@anthropic-ai/sdk";

let client = null;

/**
 * Claude API クライアントを取得（シングルトン）
 * 環境変数 ANTHROPIC_API_KEY が必要
 */
export function getClient() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY が設定されていません。\n" +
        "  export ANTHROPIC_API_KEY=sk-ant-... で設定してください。"
      );
    }
    client = new Anthropic();
  }
  return client;
}

/**
 * Claude API を呼び出してテキストを生成
 */
export async function generate(systemPrompt, userPrompt, { maxTokens = 4096, temperature = 0.7 } = {}) {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  return response.content[0].text;
}
