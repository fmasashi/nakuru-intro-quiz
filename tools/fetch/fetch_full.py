import subprocess
import json
import os

# Fetch ALL items from the playlist (no limit)
result = subprocess.run(
    ['yt-dlp', '--flat-playlist', '--no-warnings',
     '--print', '%(id)s\t%(title)s',
     '--playlist-end', '-1',
     'https://www.youtube.com/playlist?list=PLR-TVlABNl3M'],
    capture_output=True
)

for enc in ['utf-8', 'cp932', 'latin-1']:
    try:
        text = result.stdout.decode(enc)
        break
    except (UnicodeDecodeError, LookupError):
        continue

songs = []
for line in text.strip().split('\n'):
    line = line.strip()
    if not line:
        continue
    parts = line.split('\t', 1)
    if len(parts) == 2:
        vid_id, title = parts
        songs.append({"id": vid_id, "title": title})

print(f"Total songs fetched: {len(songs)}")

# Check for duplicate video IDs
id_counts = {}
for s in songs:
    id_counts[s['id']] = id_counts.get(s['id'], 0) + 1
dup_ids = {k: v for k, v in id_counts.items() if v > 1}
if dup_ids:
    print(f"\nDuplicate video IDs:")
    for vid_id, count in dup_ids.items():
        titles = [s['title'] for s in songs if s['id'] == vid_id]
        print(f"  {vid_id} x{count}: {titles}")

# Check for duplicate titles
title_counts = {}
for s in songs:
    title_counts[s['title']] = title_counts.get(s['title'], 0) + 1
dup_titles = {k: v for k, v in title_counts.items() if v > 1}
if dup_titles:
    print(f"\nDuplicate titles:")
    for title, count in dup_titles.items():
        ids = [s['id'] for s in songs if s['title'] == title]
        print(f"  '{title}' x{count}: {ids}")

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'playlist_full.json'), 'w', encoding='utf-8') as f:
    json.dump(songs, f, ensure_ascii=False, indent=2)
