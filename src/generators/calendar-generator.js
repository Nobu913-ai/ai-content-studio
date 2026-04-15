import { generate } from "../utils/claude-client.js";
import { getChannel } from "../../config/channels.js";
import { writeOutput, timestamp } from "../utils/file-helpers.js";
import { validateChannelId, validateWeeks } from "../utils/validators.js";

/**
 * チャンネルのコンテンツカレンダーを生成（4週間分）
 */
export async function generateCalendar(channelId, options = {}) {
  channelId = validateChannelId(channelId);
  const channel = getChannel(channelId);
  const weeks = validateWeeks(options.weeks || 4);
  const startDate = options.startDate || new Date().toISOString().slice(0, 10);

  const allTopics = channel.categories.flatMap((cat) => cat.topics.map((t) => `[${cat.name}] ${t.title}`));

  const lang = channel.language === "ja" ? "日本語" : "English";

  const systemPrompt = `You are a YouTube content strategist. Respond in ${lang}.
Plan a content calendar that maximizes audience growth through strategic topic sequencing.

## Rules
- Alternate between categories to keep the feed diverse
- Place high-search-volume topics on high-traffic days (Tue-Thu for most niches)
- Plan "pillar" content (long-form) and "cluster" content (Shorts) around the same theme
- Consider seasonal relevance and trending topics
- Respond in valid JSON only — no markdown fences.`;

  const userPrompt = `Create a ${weeks}-week content calendar for the "${channel.name}" channel.

Upload frequency: ${channel.uploadFrequency}
Start date: ${startDate}
Video length target: ${channel.videoLength.min}-${channel.videoLength.max} min

Available topics from our topic bank:
${allTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

You may also suggest NEW topics not in the bank if they fit the channel.

## Required JSON Output:
{
  "calendar": [
    {
      "week": 1,
      "theme": "Weekly theme description",
      "videos": [
        {
          "day": "YYYY-MM-DD",
          "dayOfWeek": "Tuesday",
          "type": "long-form",
          "title": "Video title",
          "category": "category name",
          "description": "Brief content outline (2-3 sentences)",
          "priority": "high|medium|low",
          "estimatedSearchVolume": "high|medium|low"
        }
      ],
      "shorts": [
        {
          "day": "YYYY-MM-DD",
          "hook": "First line of the Short",
          "relatedVideo": "Which long-form video this supports"
        }
      ]
    }
  ],
  "strategy_notes": "Overall strategy explanation"
}`;

  const result = await generate(systemPrompt, userPrompt, {
    maxTokens: 4096,
    temperature: 0.6,
  });

  let calendarData;
  try {
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    calendarData = JSON.parse(cleaned);
  } catch {
    calendarData = { raw: result, parseError: true };
  }

  const ts = timestamp();
  const outputPath = `content/${channelId}/calendar/${ts}_calendar.json`;
  const fullPath = writeOutput(outputPath, JSON.stringify(calendarData, null, 2));

  return { path: fullPath, outputPath, calendar: calendarData };
}

/**
 * カレンダーを見やすいテキスト形式で表示
 */
export function formatCalendarForDisplay(calendarData) {
  if (calendarData.parseError) {
    return calendarData.raw;
  }

  let output = "";
  for (const week of calendarData.calendar) {
    output += `\n${"=".repeat(60)}\n`;
    output += `WEEK ${week.week}: ${week.theme}\n`;
    output += `${"=".repeat(60)}\n`;

    if (week.videos) {
      for (const video of week.videos) {
        const icon = video.type === "long-form" ? "[VIDEO]" : "[SHORT]";
        const pri = video.priority === "high" ? "!!!" : video.priority === "medium" ? "!! " : "!  ";
        output += `  ${pri} ${video.day} (${video.dayOfWeek}) ${icon}\n`;
        output += `      ${video.title}\n`;
        output += `      ${video.description}\n\n`;
      }
    }

    if (week.shorts && week.shorts.length > 0) {
      output += `  --- Shorts ---\n`;
      for (const short of week.shorts) {
        output += `  [SHORT] ${short.day}: "${short.hook}"\n`;
        output += `          -> supports: ${short.relatedVideo}\n`;
      }
    }
    output += "\n";
  }

  if (calendarData.strategy_notes) {
    output += `\nSTRATEGY: ${calendarData.strategy_notes}\n`;
  }

  return output;
}
