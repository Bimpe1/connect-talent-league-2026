const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function main() {
  // Records the animated walkthrough source (scripts/walkthrough/walkthrough-source.html) to a silent .webm.
  // Then see scripts/walkthrough/README.md to add the captions and make the final MP4.
  const outputDir = path.resolve(__dirname, '../public/video_output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  // Edge on Windows by default; set BROWSER_PATH to use another Chromium-based browser (macOS/Linux)
  const executablePath = process.env.BROWSER_PATH || edgePaths.find(p => fs.existsSync(p));
  if (!executablePath) {
    console.error('No browser found. Install Edge, or set BROWSER_PATH to a Chrome/Chromium/Edge executable.');
    process.exit(1);
  }

  console.log('Launching browser:', executablePath);
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--disable-web-security',
      '--no-sandbox'
    ]
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  const htmlPath = path.resolve(__dirname, 'walkthrough/walkthrough-source.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  console.log('Starting walkthrough...');
  await page.evaluate(() => {
    if (window.startTour) {
      window.startTour();
    } else {
      const btn = document.getElementById('splashPlayBtn');
      if (btn) btn.click();
    }
  });

  // Total duration is 76 seconds. We'll wait 78 seconds to capture the full end scene.
  console.log('Recording 78 seconds of motion walkthrough...');
  const totalSeconds = 78;
  for (let s = 1; s <= totalSeconds; s++) {
    await page.waitForTimeout(1000);
    if (s % 10 === 0 || s === totalSeconds) {
      console.log(`Recorded ${s}/${totalSeconds} seconds...`);
    }
  }

  console.log('Finishing and saving video...');
  await page.close();
  await context.close();
  await browser.close();

  // Find the recorded video file
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const latestFile = path.join(outputDir, files[files.length - 1]);
    const finalDestWebm = path.resolve(__dirname, '../public/connect-talent-league-walkthrough.webm');
    fs.copyFileSync(latestFile, finalDestWebm);
    const stats = fs.statSync(finalDestWebm);
    console.log(`SUCCESS! Saved video to: ${finalDestWebm} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
  } else {
    console.error('No video file produced in:', outputDir);
  }
}

main().catch(err => {
  console.error('Recording error:', err);
  process.exit(1);
});
