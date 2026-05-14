# AGENTS.md — AI Agent Briefing

This file is read by AI coding agents (OpenAI Codex, etc.). Claude Code reads `CLAUDE.md` instead — both files describe the same project and should stay in sync.

## Source of Truth

- **Technical conventions, CLI, architecture, channel definitions**: see [CLAUDE.md](CLAUDE.md). All patterns there apply equally to Codex.
- **Brand strategy, voice/visual rules, production lessons learned, recent decisions**: see [docs/agent-context.md](docs/agent-context.md).
- **Open issues and continuing tasks**: see end of `docs/agent-context.md`.

Read both before touching anything for `genz-money` (公開ブランド: お金の初期設定 / @okane_setup).

## Quick Project Snapshot (2026-05-14)

- **Brand**: お金の初期設定 (channelId `genz-money`, handle `@okane_setup`)
  - Calm-trust tone, 煽らない, 出典明記
  - Target: 日本の 20代中心 (18-28歳)、30代以降も歓迎
  - Themes: 新NISA / クレカ積立 / ポイ活 / 家計管理
- **Voice**: VOICEVOX 四国めたん (speakerId=2)
- **Visual**: ミントグリーン / 白 / ダークグレー / 各社ブランドカラー
- **Published**:
  - Shorts #01 新NISA基本: <https://youtu.be/6LP8dOgua4g>
  - Shorts #02 クレカ積立 (19:00予約): <https://youtube.com/shorts/ok_vZB2QOm8>
  - note #01: <https://note.com/okane_setup/n/ne77c9941e5f5>
  - note #02: <https://note.com/okane_setup/n/n6cc6266b2c7c>
  - Linktree: <https://linktr.ee/okane_setup>

## What's Different vs CLAUDE.md

CLAUDE.md is the canonical project file. This file additionally:

1. Points to `docs/agent-context.md` for accumulated brand/production lessons (originally captured in Claude memory at `~/.claude/projects/.../memory/`)
2. Acts as the entry point for non-Claude agents that don't read `CLAUDE.md` by default

## Coding Agent Guidelines (Codex / Cursor / etc.)

When working in this repo:

1. **Run `git status` first**. The `content/` directory is gitignored (creative output / IP). Local files at those paths are still valid for the production pipeline but won't be tracked.
2. **Tests must pass before commits**: `node --test src/tests/narration-formatter.test.js` (23 tests).
3. **VOICEVOX must be running** on `http://127.0.0.1:50021` for audio generation and segment measurement scripts.
4. **Don't auto-generate brand-sensitive copy** without reviewing `docs/agent-context.md` rules (e.g. no 「儲かる」「絶対」「最大化」 in titles/descriptions; PR/出典/リスク注記 mandatory).
5. **When editing Remotion components**: read related 罠集 in `docs/agent-context.md` §3.
6. **For new Shorts**: follow the 7-step pipeline in `docs/agent-context.md` §5.
7. **For publish (公開) work**: follow the workflow in `docs/agent-context.md` §6.

## Local Environment Specifics

- OS: Windows 11
- Shell: PowerShell (default) / Bash (Git Bash)
- Node: v24.x
- Working directory: `C:\Users\nobuyoshi.ohhara\ai-content-studio`
- Memory directory (Claude only): `C:\Users\nobuyoshi.ohhara\.claude\projects\C--Users-nobuyoshi-ohhara\memory\`

## Continuity Notes

- This file and `docs/agent-context.md` are intended to be **continuously updated** by whichever agent is currently active. When a decision is finalized, update the relevant section so the next agent (Claude or Codex) inherits it.
- The Claude memory files in `~/.claude/projects/.../memory/` are Claude-specific and may diverge over time. **Treat `docs/agent-context.md` as the canonical version**, and sync new decisions there.
