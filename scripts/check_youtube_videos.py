#!/usr/bin/env python3
"""Compare public YouTube uploads against embedded videos in index.html."""
import json, os, re, sys, urllib.parse, urllib.request
from pathlib import Path

CHANNEL_ID = "UCN740eAr2LnIyiCYZ8SIOyg"
BASE = "https://www.googleapis.com/youtube/v3/"
KEY = os.environ.get("YOUTUBE_API_KEY")
if not KEY:
    sys.exit("YOUTUBE_API_KEY is missing")

def api(endpoint, **params):
    params["key"] = KEY
    url = BASE + endpoint + "?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            return json.load(response)
    except Exception as exc:
        sys.exit(f"YouTube API request failed: {exc}")

channel = api("channels", part="contentDetails", id=CHANNEL_ID)
items = channel.get("items", [])
if not items:
    sys.exit("Channel not found or uploads playlist unavailable")
playlist = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]
videos = []
token = None
while True:
    args = dict(part="snippet,contentDetails", playlistId=playlist, maxResults=50)
    if token:
        args["pageToken"] = token
    data = api("playlistItems", **args)
    for item in data.get("items", []):
        vid = item.get("contentDetails", {}).get("videoId")
        snippet = item.get("snippet", {})
        if vid and snippet.get("title") not in ("Private video", "Deleted video"):
            videos.append(dict(id=vid, title=snippet.get("title", ""), published=snippet.get("publishedAt", "")))
    token = data.get("nextPageToken")
    if not token:
        break

html = Path("index.html").read_text(encoding="utf-8")
embedded = set(re.findall(r"youtube\.com/embed/([A-Za-z0-9_-]{11})", html))
missing = [v for v in videos if v["id"] not in embedded]
lines = ["# Verse and Variation video comparison", "",
         f"Channel uploads returned: {len(videos)}",
         f"Unique videos embedded on homepage: {len(embedded)}",
         f"Uploads missing from homepage: {len(missing)}", "",
         "## Missing videos", ""]
lines += [f"- [{v['title']}](https://youtu.be/{v['id']}) — {v['published']}" for v in missing] or ["None"]
lines += ["", "## All returned uploads", ""]
lines += [f"- {'MISSING' if v in missing else 'Embedded'} — [{v['title']}](https://youtu.be/{v['id']})" for v in videos]
report = "\n".join(lines) + "\n"
Path("youtube-video-report.md").write_text(report, encoding="utf-8")
print(report)
if os.environ.get("GITHUB_STEP_SUMMARY"):
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
        f.write(report)
