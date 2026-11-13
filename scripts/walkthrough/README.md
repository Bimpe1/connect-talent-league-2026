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
The current video **has a voice-over**, recorded from `voiceover-script.md` (exact lines, timings and recording tips).
The captions are those same words. If you change the wording, update the `CUES` in `walkthrough-source.html`,
regenerate `captions.srt` / `captions.ass`, re-burn the captions (step 2) and record the new lines. To add or replace
the voice on a captions-only render, use an editor, or:
`ffmpeg -i captions-only.mp4 -i voice.m4a -c:v copy -c:a aac -shortest -movflags +faststart with-voice.mp4`.
Keep the MP4 as H.264 + AAC and add `-movflags +faststart` so it starts playing before it has fully downloaded.
