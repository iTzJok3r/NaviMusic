#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YouTube Audio Downloader for Archimedes Music.
Extracts pristine audio from YouTube videos with maximum bitrate and sample rate.
Outputs real-time JSON progress lines to stdout for Electron IPC consumption.
"""

import sys
import os
import json
import argparse
import traceback

try:
    import yt_dlp
except ImportError:
    print(json.dumps({"type": "error", "error": "yt-dlp is not installed. Please install with: pip install yt-dlp"}))
    sys.exit(1)


class JSONProgressHook:
    def __init__(self):
        self.last_percent = -1

    def __call__(self, d):
        status = d.get('status')
        if status == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
            downloaded = d.get('downloaded_bytes', 0)
            speed = d.get('speed') or 0
            eta = d.get('eta') or 0
            
            percent = 0
            if total > 0:
                percent = round((downloaded / total) * 100, 1)
            elif '_percent_str' in d:
                try:
                    clean = d['_percent_str'].replace('%', '').strip()
                    percent = float(clean)
                except Exception:
                    pass

            # Only print when integer percent changes to avoid IPC flooding
            int_pct = int(percent)
            if int_pct != self.last_percent or int_pct == 100:
                self.last_percent = int_pct
                payload = {
                    "type": "progress",
                    "status": "downloading",
                    "percent": percent,
                    "downloaded": downloaded,
                    "total": total,
                    "speed": speed,
                    "eta": eta
                }
                print(json.dumps(payload), flush=True)

        elif status == 'finished':
            payload = {
                "type": "status",
                "status": "processing",
                "message": "Converting audio & embedding tags..."
            }
            print(json.dumps(payload), flush=True)


def download_audio(video_url, output_dir, audio_format='mp3', quality='320', sample_rate='48000'):
    """
    Downloads audio only at highest quality.
    """
    os.makedirs(output_dir, exist_ok=True)
    hook = JSONProgressHook()

    # Base postprocessors
    postprocessors = []

    # 1. FFmpeg audio extract & transcode
    extract_opts = {
        'key': 'FFmpegExtractAudio',
        'preferredcodec': audio_format,
    }
    if audio_format in ['mp3', 'aac', 'm4a', 'opus', 'vorbis']:
        extract_opts['preferredquality'] = quality
    postprocessors.append(extract_opts)

    # 2. Embed metadata (Title, Artist, Album, etc.)
    postprocessors.append({
        'key': 'FFmpegMetadata',
        'add_metadata': True,
    })

    # 3. Embed thumbnail if possible
    try:
        postprocessors.append({
            'key': 'EmbedThumbnail',
            'already_have_thumbnail': False,
        })
    except Exception:
        pass

    # Postprocessor args for sample rate (frequency)
    postprocessor_args = []
    if sample_rate and sample_rate not in ['auto', 'source']:
        postprocessor_args.extend(['-ar', str(sample_rate)])

    outtmpl = os.path.join(output_dir, '%(title)s.%(ext)s')

    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': outtmpl,
        'postprocessors': postprocessors,
        'progress_hooks': [hook],
        'writethumbnail': True,
        'quiet': True,
        'noprogress': True,
        'no_warnings': True,
        # --- security hardening -------------------------------------------
        # This was True, which disables TLS certificate verification for the
        # whole download: any attacker on the same network (public Wi-Fi, a
        # hostile LAN, an ISP) could impersonate YouTube and serve forged
        # content, and nothing would notice. YouTube presents valid
        # certificates, so there is no reason to accept invalid ones.
        'nocheckcertificate': False,
        # A single track was requested, but a URL carrying a playlist parameter
        # (?list=...) would otherwise pull the entire playlist - one click could
        # queue hundreds of downloads. Limit the request to one item.
        'noplaylist': True,
        'playlist_items': '1',
        # Never hang forever: a stalled connection used to leave the child
        # process (and the progress UI) waiting indefinitely.
        'socket_timeout': 30,
        'retries': 3,
        'ignoreerrors': False,
    }

    if postprocessor_args:
        ydl_opts['postprocessor_args'] = {
            'ExtractAudio': postprocessor_args
        }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first
            info = ydl.extract_info(video_url, download=False)
            title = info.get('title', 'Unknown Title')
            uploader = info.get('uploader') or info.get('channel') or 'Unknown Artist'
            duration = info.get('duration', 0)
            thumbnail = info.get('thumbnail')

            print(json.dumps({
                "type": "info",
                "title": title,
                "artist": uploader,
                "duration": duration,
                "thumbnail": thumbnail,
                "format": audio_format,
                "quality": quality,
                "sample_rate": sample_rate
            }), flush=True)

            # Perform download and postprocessing
            ydl.download([video_url])

            # Locate downloaded file
            final_filename = ydl.prepare_filename(info)
            # Ext changes after FFmpegExtractAudio
            base, _ = os.path.splitext(final_filename)
            final_path = f"{base}.{audio_format}"

            # Fallback if filename differs
            if not os.path.exists(final_path):
                # Search directory for recent file with base
                expected_prefix = os.path.basename(base)
                for f in os.listdir(output_dir):
                    if f.startswith(expected_prefix) and f.endswith(f".{audio_format}"):
                        final_path = os.path.join(output_dir, f)
                        break

            file_size = 0
            if os.path.exists(final_path):
                file_size = os.path.getsize(final_path)

            print(json.dumps({
                "type": "complete",
                "status": "success",
                "title": title,
                "artist": uploader,
                "duration": duration,
                "file_path": final_path,
                "file_name": os.path.basename(final_path),
                "file_size": file_size,
                "format": audio_format,
                "quality": quality,
                "sample_rate": sample_rate
            }), flush=True)

            return True

    except Exception as err:
        error_msg = str(err)
        print(json.dumps({
            "type": "error",
            "status": "failed",
            "error": error_msg
        }), flush=True)
        return False


def main():
    parser = argparse.ArgumentParser(description="YouTube Audio Downloader")
    parser.add_argument("--url", required=True, help="YouTube video URL or Video ID")
    parser.add_argument("--dir", required=True, help="Destination directory path")
    parser.add_argument("--format", default="mp3", help="Audio format (mp3, flac, m4a, opus, wav)")
    parser.add_argument("--quality", default="320", help="Audio quality (320, 256, 0)")
    parser.add_argument("--sample-rate", default="48000", help="Sample rate in Hz (48000, 44100, source)")

    args = parser.parse_args()

    url = args.url
    if not url.startswith("http://") and not url.startswith("https://"):
        url = f"https://www.youtube.com/watch?v={url}"

    success = download_audio(
        video_url=url,
        output_dir=args.dir,
        audio_format=args.format.lower(),
        quality=args.quality,
        sample_rate=args.sample_rate
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
