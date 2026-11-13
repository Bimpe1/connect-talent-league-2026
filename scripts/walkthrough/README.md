# Explainer video

`walkthrough-source.html` is the animated walkthrough (76 seconds). Its wording and timing live in the `CUES`
and `scenes` lists inside that file. **If the sign-up flow changes, edit those, then re-record.**
`captions.srt` holds the same narration lines as subtitles.

## Re-record
1. `node scripts/record_walkthrough.cjs` (Edge on Windows; set `BROWSER_PATH` for another browser). It plays the
   page for 78 seconds and saves a silent `.webm` in `public/video_output/`.
2. Trim the lead-in, burn in the captions and make the MP4 (needs ffmpeg). `LEAD` is the seconds of loading before
   the walkthrough starts (about 1.7, printed when the recording starts):
   ```
   ffmpeg -ss LEAD -t 76 -i public/video_output/<recording>.webm \
     -vf "ass=scripts/walkthrough/captions.ass" -r 25 \
     -c:v libx264 -pix_fmt yuv420p -crf 20 -movflags +faststart public/connect-talent-league-walkthrough.mp4
   ```
   For the `.webm`, use `-c:v libvpx-vp9 -b:v 0 -crf 34` instead. The captions use the Plus Jakarta Sans font if it is
   installed (otherwise a default sans-serif). `captions.srt` is the same text in the plain format that video editors
   and YouTube accept; `captions.ass` is the styled version for burning in.
3. The site plays `public/connect-talent-league-walkthrough.mp4` and `.webm`.

## Voice
The recorded file has captions but **no voice**. For a voice-over, record the narration lines (see
`captions.srt` for the exact text and timing) in any video editor and add it to the MP4.
