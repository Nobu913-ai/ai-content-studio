import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { writeOutput, timestamp } from "../utils/file-helpers.js";

/**
 * チャンネル設定に基づいた台本生成システムプロンプトを構築
 */
function buildSystemPrompt(channel) {
  const lang = channel.language === "ja" ? "日本語" : "English";

  return `You are an expert YouTube scriptwriter. You write scripts in ${lang}.

## Channel Profile
- Channel: ${channel.name}
- Description: ${channel.description}
- Target Audience: ${channel.target}
- Tone & Style: ${channel.tone}
- Video Length: ${channel.videoLength.min}-${channel.videoLength.max} ${channel.videoLength.unit}

## Script Structure Rules
1. HOOK (first 30 seconds): Start with a compelling question, surprising fact, or bold statement that stops the scroll. Never start with "Hi, welcome to..."
2. INTRO (30s-1min): Brief context. Establish why this topic matters to the viewer NOW.
3. BODY (main content): 3-5 key sections, each with a clear takeaway. Use stories, examples, and analogies. Include pattern interrupts every 2-3 minutes.
4. CALLBACK: Reference the hook — show the viewer how the content answered the opening question.
5. CTA: Natural call-to-action. Don't beg for likes — give a reason to subscribe.

## Formatting Rules
- Use [SECTION: name] markers for each section
- Use [B-ROLL: description] to suggest visual elements
- Use [TEXT ON SCREEN: text] for key statistics or quotes
- Use [PAUSE] for dramatic effect
- Estimated reading time annotations: [~Xs] at section starts
- Write spoken word — short sentences, conversational rhythm${channel.contentWarning ? `\n\n## Content Warning\n${channel.contentWarning}` : ""}`;
}

/**
 * 台本を生成
 */
export async function generateScript(channelId, topic, options = {}) {
  const channel = getChannel(channelId);
  const systemPrompt = buildSystemPrompt(channel);

  const topicInfo = findTopicInChannel(channel, topic);

  let userPrompt;
  if (topicInfo) {
    userPrompt = `Write a complete YouTube script for the following topic:

Title: ${topicInfo.title}
Target Keywords: ${topicInfo.keywords.join(", ")}

The script should be ${channel.videoLength.min}-${channel.videoLength.max} minutes when read aloud.
Include all visual direction markers ([B-ROLL], [TEXT ON SCREEN], etc.).
Make the hook irresistible — the viewer should feel they MUST keep watching.`;
  } else {
    userPrompt = `Write a complete YouTube script on the topic: "${topic}"

The script should be ${channel.videoLength.min}-${channel.videoLength.max} minutes when read aloud.
Include all visual direction markers ([B-ROLL], [TEXT ON SCREEN], etc.).
Make the hook irresistible — the viewer should feel they MUST keep watching.`;
  }

  if (options.angle) {
    userPrompt += `\n\nSpecific angle/approach: ${options.angle}`;
  }

  const script = await generate(systemPrompt, userPrompt, {
    maxTokens: 8192,
    temperature: 0.75,
  });

  const ts = timestamp();
  const slug = topic.toLowerCase().replace(/[^a-z0-9\u3040-\u9fff]+/g, "-").slice(0, 50);
  const outputPath = `content/${channelId}/scripts/${ts}_${slug}.md`;
  const fullPath = writeOutput(outputPath, formatScript(channel, topic, script, ts));

  return { path: fullPath, outputPath, script };
}

/**
 * チャンネル設定からトピック情報を検索
 */
function findTopicInChannel(channel, query) {
  const q = query.toLowerCase();
  for (const category of channel.categories) {
    for (const topic of category.topics) {
      if (
        topic.title.toLowerCase().includes(q) ||
        q.includes(topic.title.toLowerCase().slice(0, 20))
      ) {
        return topic;
      }
    }
  }
  return null;
}

/**
 * 台本をMarkdownファイルとしてフォーマット
 */
function formatScript(channel, topic, script, ts) {
  return `---
channel: ${channel.name}
topic: "${topic}"
generated: ${ts}
language: ${channel.language}
target_length: ${channel.videoLength.min}-${channel.videoLength.max} min
status: draft
---

# ${topic}

${script}
`;
}
