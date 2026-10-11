# tools/

**イントロクイズ用**の開発ツール。`../songs.js` の作成・検証に使うスクリプト群で、ゲーム本体（`index.html` / `app.js` / `songs.js` / `style.css`）からは一切参照されない。
リポジトリに含めて履歴管理している（GitHub Pages 上にもそのまま置かれるが、ゲームの動作には無関係）。

## 実行方法

全スクリプトが `_paths.js` 経由で「このフォルダの位置」を基準にファイルを解決するので、**どのディレクトリから実行してもよい**。

```
node C:\藍月なくる\イントロクイズ\tools\check\validate.js
node tools\check\test_flow.js        （イントロクイズ をカレントにした場合）
```

## 構成

| 場所 | 内容 | songs.js を書き換えるもの |
|---|---|---|
| `_paths.js` | 共有パス定義。`ROOT`（ゲームフォルダ）、`SONGS` / `HTML` / `APP`、`data(name)`（data/ 内のファイル） | – |
| `check/` | 検証。validate（HTML↔JSのID整合・カテゴリ欠落）、test_flow（曲数・重複ID/タイトル・出題フローの模擬）、verify_songs / verify_detail（data/channel_check.json との照合）、verify_albums（アルバム割当）、check_channels（oEmbedで全曲の投稿チャンネル確認 → data/channel_check.json）、full_audit（全曲の存在確認） | full_audit.js のみ（死んだ動画を songs.js から削除する） |
| `fetch/` | 収集。fetch_playlist.js / fetch_full.py（プレイリストのID・タイトル → data/）、fetch_titles.js（oEmbedで正式タイトル → data/oembed_results.json）、fetch_full_playlist.js（プレイリストの未収録曲を songs.js に追加）、find_alt_ids.js（見つからない曲の代替ID探索）、browser_extract.js（YouTubeのDevToolsコンソールに貼って使う。node用ではない） | fetch_full_playlist.js（既存は保持、新曲のみ追加） |
| `audio/` | yt-dlp + ffmpeg でイントロ開始位置と音量を測定し適用。detect_starts / detect_all / test_detect（3曲テスト）→ data/start_times.json → apply_starts。measure_loudness → data/loudness.json → apply_loudness | apply_starts.js / apply_loudness.js |
| `data/` | 中間データ。channel_check.json / oembed_results.json / playlist_ids.json / playlist_full.json。audio/ の出力もここに生成される | – |

## 注意

- `audio/` は yt-dlp と ffmpeg が PATH にあること。作業用音声は `audio/tmp_audio/` に落ちる（.gitignore 済み、消してよい）。
- 曲データの事実関係は 2026-07 に全曲を一次資料で確認済み。**songs.js が正**。収集スクリプトが埋める `info` 等は鵜呑みにしない。
- songs.js を書き換えるスクリプトは、実行後に `git diff` で差分を確認してから commit する。
- 曲を追加・削除したら `check/check_channels.js` を再実行して data/channel_check.json を更新する（verify_songs の「oEmbedデータなし」はこれが古いサイン）。
- 2026-06 のデータ整備で使った一回限りの修正スクリプト（fix_* / update_info / enrich_info / rebuild_songs / add_*）は適用済みのため 2026-10 に削除した。
