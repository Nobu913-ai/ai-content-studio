"""
DaVinci Resolve Scripting API ブリッジ
Node.js から子プロセスとして呼び出され、JSON で入出力する。

使い方:
  python bridge.py <command> [--arg=value ...]

コマンド:
  status          — 接続確認・バージョン取得
  create-project  — プロジェクト作成 + タイムライン設定
  import-media    — メディアプールにファイルインポート
  build-timeline  — ショットプランに基づきタイムラインにクリップ配置
  add-text        — Fusion Text+ オーバーレイ追加
  render          — レンダーキューに追加して書き出し
"""

import sys
import os
import json
import argparse

# Windows での UTF-8 出力を強制
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# DaVinci Resolve scripting API のパスを設定
RESOLVE_SCRIPT_API = os.environ.get(
    "RESOLVE_SCRIPT_API",
    os.path.join(os.environ.get("PROGRAMDATA", "C:\\ProgramData"),
                 "Blackmagic Design", "DaVinci Resolve", "Support", "Developer", "Scripting")
)
RESOLVE_SCRIPT_LIB = os.environ.get(
    "RESOLVE_SCRIPT_LIB",
    os.path.join(os.environ.get("PROGRAMFILES", "C:\\Program Files"),
                 "Blackmagic Design", "DaVinci Resolve", "fusionscript.dll")
)

sys.path.append(os.path.join(RESOLVE_SCRIPT_API, "Modules"))

def get_resolve():
    """DaVinci Resolve インスタンスに接続"""
    try:
        import DaVinciResolveScript as dvr_script
        resolve = dvr_script.scriptapp("Resolve")
        if not resolve:
            return None, "DaVinci Resolve が起動していません。起動してから再実行してください。"
        return resolve, None
    except ImportError as e:
        return None, f"DaVinci Resolve Scripting API が見つかりません: {e}"
    except Exception as e:
        return None, f"接続エラー: {e}"

def output(data):
    """JSON で結果を出力"""
    print(json.dumps(data, ensure_ascii=False))

def cmd_status(_args):
    """接続確認・バージョン取得"""
    resolve, err = get_resolve()
    if err:
        return output({"ok": False, "error": err})

    pm = resolve.GetProjectManager()
    current = pm.GetCurrentProject()
    output({
        "ok": True,
        "version": resolve.GetVersionString(),
        "product": resolve.GetProductName(),
        "currentProject": current.GetName() if current else None,
        "currentPage": resolve.GetCurrentPage(),
    })

def cmd_create_project(args):
    """プロジェクト作成 + タイムライン設定"""
    resolve, err = get_resolve()
    if err:
        return output({"ok": False, "error": err})

    pm = resolve.GetProjectManager()

    # 既存プロジェクトがあれば開く
    project = pm.LoadProject(args.name)
    if not project:
        project = pm.CreateProject(args.name)

    if not project:
        return output({"ok": False, "error": f"プロジェクト '{args.name}' の作成に失敗しました。同名プロジェクトが開かれている可能性があります。"})

    # プロジェクト設定
    if args.width and args.height:
        project.SetSetting("timelineResolutionWidth", str(args.width))
        project.SetSetting("timelineResolutionHeight", str(args.height))
    if args.fps:
        project.SetSetting("timelineFrameRate", str(args.fps))

    # タイムラインが無ければ作成
    mp = project.GetMediaPool()
    if project.GetTimelineCount() == 0:
        timeline_name = args.timeline_name or args.name
        timeline = mp.CreateEmptyTimeline(timeline_name)
        if not timeline:
            return output({"ok": False, "error": "タイムライン作成に失敗"})
    else:
        timeline = project.GetTimelineByIndex(1)

    pm.SaveProject()
    output({
        "ok": True,
        "project": project.GetName(),
        "timeline": timeline.GetName() if timeline else None,
        "resolution": f"{project.GetSetting('timelineResolutionWidth')}x{project.GetSetting('timelineResolutionHeight')}",
        "fps": project.GetSetting("timelineFrameRate"),
    })

def cmd_import_media(args):
    """メディアプールにファイルインポート"""
    resolve, err = get_resolve()
    if err:
        return output({"ok": False, "error": err})

    pm = resolve.GetProjectManager()
    project = pm.GetCurrentProject()
    if not project:
        return output({"ok": False, "error": "プロジェクトが開かれていません"})

    mp = project.GetMediaPool()
    root = mp.GetRootFolder()

    # サブフォルダを作成 or 取得
    target_folder = root
    if args.folder:
        existing = root.GetSubFolderList()
        found = None
        for f in existing:
            if f.GetName() == args.folder:
                found = f
                break
        if found:
            target_folder = found
        else:
            target_folder = mp.AddSubFolder(root, args.folder)

    mp.SetCurrentFolder(target_folder)

    # ファイルインポート
    paths = args.files
    abs_paths = [os.path.abspath(p) for p in paths]

    # 存在チェック
    missing = [p for p in abs_paths if not os.path.exists(p)]
    if missing:
        return output({"ok": False, "error": f"ファイルが見つかりません: {missing}"})

    items = mp.ImportMedia(abs_paths)
    if not items:
        return output({"ok": False, "error": "メディアインポートに失敗"})

    imported = []
    for item in items:
        imported.append({
            "name": item.GetName(),
            "id": item.GetMediaId(),
        })

    pm.SaveProject()
    output({
        "ok": True,
        "folder": target_folder.GetName(),
        "imported": imported,
        "count": len(imported),
    })

def cmd_build_timeline(args):
    """ショットプランに基づきタイムラインにクリップを配置"""
    resolve, err = get_resolve()
    if err:
        return output({"ok": False, "error": err})

    pm = resolve.GetProjectManager()
    project = pm.GetCurrentProject()
    if not project:
        return output({"ok": False, "error": "プロジェクトが開かれていません"})

    mp = project.GetMediaPool()
    timeline = project.GetCurrentTimeline()
    if not timeline:
        return output({"ok": False, "error": "タイムラインが選択されていません"})

    # ショットプランJSON を読み込み
    with open(args.shot_plan, "r", encoding="utf-8") as f:
        plan = json.load(f)

    shots = plan.get("shots", [])
    if not shots:
        return output({"ok": False, "error": "ショットプランにショットがありません"})

    # メディアプールからクリップを検索してタイムラインに追加
    root = mp.GetRootFolder()
    all_clips = _collect_clips(root)

    added = []
    fps = float(project.GetSetting("timelineFrameRate") or 30)

    for shot in shots:
        shot_id = shot.get("shot_id", "")
        duration_sec = shot.get("duration_sec", 5)
        duration_frames = int(duration_sec * fps)

        # shot_id に一致するクリップを検索
        clip = None
        for c in all_clips:
            if shot_id in c.GetName():
                clip = c
                break

        if clip:
            # クリップをタイムラインに追加
            clip_info = {
                "mediaPoolItem": clip,
                "endFrame": duration_frames,
            }
            result = mp.AppendToTimeline([clip_info])
            added.append({
                "shot_id": shot_id,
                "clip": clip.GetName(),
                "duration_sec": duration_sec,
                "status": "added" if result else "failed",
            })
        else:
            added.append({
                "shot_id": shot_id,
                "clip": None,
                "duration_sec": duration_sec,
                "status": "missing",
            })

    # 音声ファイルがあればオーディオトラックに追加
    if args.audio:
        audio_abs = os.path.abspath(args.audio)
        if os.path.exists(audio_abs):
            audio_clips = mp.ImportMedia([audio_abs])
            if audio_clips:
                mp.AppendToTimeline([{
                    "mediaPoolItem": audio_clips[0],
                    "mediaType": 2,  # Audio only
                    "trackIndex": 1,
                }])
                added.append({
                    "shot_id": "audio_narration",
                    "clip": audio_clips[0].GetName(),
                    "status": "added",
                })

    pm.SaveProject()
    output({
        "ok": True,
        "timeline": timeline.GetName(),
        "shots_planned": len(shots),
        "shots_added": len([a for a in added if a["status"] == "added"]),
        "shots_missing": len([a for a in added if a["status"] == "missing"]),
        "details": added,
    })

def cmd_add_text(args):
    """Fusion Text+ オーバーレイをタイムラインに挿入"""
    resolve, err = get_resolve()
    if err:
        return output({"ok": False, "error": err})

    pm = resolve.GetProjectManager()
    project = pm.GetCurrentProject()
    if not project:
        return output({"ok": False, "error": "プロジェクトが開かれていません"})

    timeline = project.GetCurrentTimeline()
    if not timeline:
        return output({"ok": False, "error": "タイムラインが選択されていません"})

    # テキストオーバーレイ情報を読み込み
    overlays = json.loads(args.overlays) if isinstance(args.overlays, str) else args.overlays

    added_count = 0
    for overlay in overlays:
        text = overlay.get("text", "")
        if not text:
            continue

        # Fusion Title をタイムラインに挿入
        title_item = timeline.InsertFusionTitleIntoTimeline("Text+")
        if title_item:
            # Fusion comp にアクセスしてテキストを設定
            comp = title_item.GetFusionCompByIndex(1)
            if comp:
                tools = comp.GetToolList(False)
                for tool_name, tool in tools.items():
                    if tool.GetAttrs()["TOOLS_RegID"] == "TextPlus":
                        tool.SetInput("StyledText", text)
                        # フォント設定
                        tool.SetInput("Font", "Noto Sans JP")
                        tool.SetInput("Style", "Bold")
                        tool.SetInput("Size", 0.05)
                        break
            added_count += 1

    pm.SaveProject()
    output({
        "ok": True,
        "overlays_requested": len(overlays),
        "overlays_added": added_count,
    })

def cmd_render(args):
    """レンダーキューに追加して書き出し"""
    resolve, err = get_resolve()
    if err:
        return output({"ok": False, "error": err})

    pm = resolve.GetProjectManager()
    project = pm.GetCurrentProject()
    if not project:
        return output({"ok": False, "error": "プロジェクトが開かれていません"})

    # レンダー設定
    settings = {
        "TargetDir": os.path.abspath(args.output_dir),
        "CustomName": args.filename or "output",
    }

    if args.format:
        project.SetCurrentRenderFormatAndCodec(args.format, args.codec or "H264")
    if args.width and args.height:
        settings["FormatWidth"] = int(args.width)
        settings["FormatHeight"] = int(args.height)

    project.SetRenderSettings(settings)

    # レンダーキューに追加
    job_id = project.AddRenderJob()
    if not job_id:
        return output({"ok": False, "error": "レンダージョブの追加に失敗"})

    if args.start:
        # レンダリング開始
        project.StartRendering([job_id])
        output({
            "ok": True,
            "jobId": job_id,
            "status": "rendering",
            "outputDir": settings["TargetDir"],
            "filename": settings["CustomName"],
        })
    else:
        output({
            "ok": True,
            "jobId": job_id,
            "status": "queued",
            "outputDir": settings["TargetDir"],
            "filename": settings["CustomName"],
            "message": "レンダーキューに追加しました。DaVinci Resolve の Deliver ページで開始してください。",
        })

def cmd_render_status(args):
    """レンダリング状況を確認"""
    resolve, err = get_resolve()
    if err:
        return output({"ok": False, "error": err})

    pm = resolve.GetProjectManager()
    project = pm.GetCurrentProject()
    if not project:
        return output({"ok": False, "error": "プロジェクトが開かれていません"})

    is_rendering = project.IsRenderingInProgress()
    jobs = project.GetRenderJobList()

    job_list = []
    for job in jobs:
        status = project.GetRenderJobStatus(job.get("JobId", ""))
        job_list.append({
            "jobId": job.get("JobId"),
            "name": job.get("RenderJobName"),
            "status": status,
        })

    output({
        "ok": True,
        "isRendering": is_rendering,
        "jobs": job_list,
    })


def _collect_clips(folder):
    """フォルダ内のすべてのクリップを再帰的に収集"""
    clips = list(folder.GetClipList())
    for sub in folder.GetSubFolderList():
        clips.extend(_collect_clips(sub))
    return clips


def main():
    parser = argparse.ArgumentParser(description="DaVinci Resolve Bridge")
    subparsers = parser.add_subparsers(dest="command")

    # status
    subparsers.add_parser("status")

    # create-project
    cp = subparsers.add_parser("create-project")
    cp.add_argument("--name", required=True)
    cp.add_argument("--width", type=int, default=1080)
    cp.add_argument("--height", type=int, default=1920)
    cp.add_argument("--fps", type=int, default=30)
    cp.add_argument("--timeline-name")

    # import-media
    im = subparsers.add_parser("import-media")
    im.add_argument("--files", nargs="+", required=True)
    im.add_argument("--folder", default=None)

    # build-timeline
    bt = subparsers.add_parser("build-timeline")
    bt.add_argument("--shot-plan", required=True)
    bt.add_argument("--audio")

    # add-text
    at = subparsers.add_parser("add-text")
    at.add_argument("--overlays", required=True, help="JSON array of overlay objects")

    # render
    rn = subparsers.add_parser("render")
    rn.add_argument("--output-dir", required=True)
    rn.add_argument("--filename")
    rn.add_argument("--format", default="mp4")
    rn.add_argument("--codec", default="H264")
    rn.add_argument("--width", type=int)
    rn.add_argument("--height", type=int)
    rn.add_argument("--start", action="store_true", help="即座にレンダリング開始")

    # render-status
    subparsers.add_parser("render-status")

    args = parser.parse_args()

    commands = {
        "status": cmd_status,
        "create-project": cmd_create_project,
        "import-media": cmd_import_media,
        "build-timeline": cmd_build_timeline,
        "add-text": cmd_add_text,
        "render": cmd_render,
        "render-status": cmd_render_status,
    }

    if args.command in commands:
        try:
            commands[args.command](args)
        except Exception as e:
            output({"ok": False, "error": str(e)})
    else:
        output({"ok": False, "error": f"不明なコマンド: {args.command}"})


if __name__ == "__main__":
    main()
