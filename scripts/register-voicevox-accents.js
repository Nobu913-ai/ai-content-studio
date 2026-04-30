#!/usr/bin/env node
/**
 * VOICEVOX user_dict にアクセント補正辞書を登録する。
 *
 * 使い方:
 *   node scripts/register-voicevox-accents.js
 *
 * config/voicevox-accent-dictionary.json の entries を VOICEVOX ENGINE の
 * /user_dict_word に登録する。同じ surface の既存エントリーは削除して再登録するため
 * 冪等に実行できる。
 *
 * 環境変数:
 *   VOICEVOX_ENGINE_URL (default: http://127.0.0.1:50021)
 *
 * 前提:
 *   - VOICEVOX ENGINE が起動していること
 *   - audio生成より前に実行する
 */
import { readFileSync } from "node:fs";

const ENGINE_URL = process.env.VOICEVOX_ENGINE_URL || "http://127.0.0.1:50021";
const DICT_PATH = "config/voicevox-accent-dictionary.json";

async function main() {
  const dict = JSON.parse(readFileSync(DICT_PATH, "utf-8"));
  const entries = dict.entries || [];

  if (entries.length === 0) {
    console.log("[INFO] No entries to register.");
    return;
  }

  // 既存の user_dict を取得し、同 surface の entry を削除
  const existing = await fetch(`${ENGINE_URL}/user_dict`).then((r) => r.json());
  const existingBySurface = new Map();
  for (const [uuid, entry] of Object.entries(existing)) {
    existingBySurface.set(entry.surface, uuid);
  }

  let registered = 0;
  let replaced = 0;

  for (const entry of entries) {
    const { surface, pronunciation, accent_type, word_type = "COMMON_NOUN", priority = 10 } = entry;

    if (existingBySurface.has(surface)) {
      const oldUuid = existingBySurface.get(surface);
      const delResp = await fetch(`${ENGINE_URL}/user_dict_word/${oldUuid}`, { method: "DELETE" });
      if (!delResp.ok && delResp.status !== 404) {
        throw new Error(`Failed to delete existing entry for "${surface}": ${delResp.status}`);
      }
      replaced++;
    }

    const params = new URLSearchParams({
      surface,
      pronunciation,
      accent_type: String(accent_type),
      word_type,
      priority: String(priority),
    });
    const resp = await fetch(`${ENGINE_URL}/user_dict_word?${params}`, { method: "POST" });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Failed to register "${surface}": ${resp.status} ${body}`);
    }
    const uuid = (await resp.json()).replace(/"/g, "");
    console.log(`  [OK] ${surface} → ${pronunciation} (accent_type=${accent_type}, priority=${priority}) uuid=${uuid.slice(0, 8)}`);
    registered++;
  }

  console.log(`\n[DONE] Registered ${registered} entries (${replaced} replaced existing).`);
}

main().catch((e) => {
  console.error(`[ERROR] ${e.message}`);
  process.exit(1);
});
