const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const ROOT_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(__dirname, 'assets');
const OUTPUTS_DIR = path.join(__dirname, 'outputs');

if (!fs.existsSync(OUTPUTS_DIR)) {
  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const SAMPLE_PATH = path.join(ASSETS_DIR, 'sample.mp4');

app.use(cors());
app.use(
  '/download',
  express.static(OUTPUTS_DIR, {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store');
    },
  })
);

async function ensureSampleVideo() {
  if (fs.existsSync(SAMPLE_PATH)) return SAMPLE_PATH;
  const url = 'https://www.w3schools.com/html/mov_bbb.mp4';
  const writer = fs.createWriteStream(SAMPLE_PATH);
  const response = await axios({ url, method: 'GET', responseType: 'stream' });
  await new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
  return SAMPLE_PATH;
}

function selectFontFile() {
  const candidatesByPlatform = {
    win32: [
      'C:/Windows/Fonts/arial.ttf',
      'C:/Windows/Fonts/ARIAL.TTF',
      'C:/Windows/Fonts/segoeui.ttf',
    ],
    darwin: [
      '/System/Library/Fonts/Supplemental/Arial.ttf',
      '/Library/Fonts/Arial.ttf',
      '/System/Library/Fonts/Supplemental/Helvetica.ttc',
    ],
    linux: [
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
    ],
  };
  const plat = process.platform;
  const candidates = candidatesByPlatform[plat] || [];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch (_) {}
  }
  return null;
}

function runFfmpegRender({ inputPath, outputPath }) {
  return new Promise((resolve, reject) => {
    const fontFile = selectFontFile();
    const fontParam = fontFile
      ? `fontfile='${fontFile.replace(/\\\\/g, '/')}':`
      : "font='Arial':";
    const args = [
      '-y',
      '-t',
      '10',
      '-i',
      inputPath,
      '-filter_complex',
      [
        '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=black[base]',
        'color=c=black@0.0:s=1080x1920,format=rgba[ct]',
        `[ct]drawtext=text='Life Demo':${fontParam}fontcolor=yellow:fontsize=160:bordercolor=black:borderw=10:x=(w-tw)/2:y=(h-th)/2[txt]`,
        '[txt]rotate=45*PI/180:ow=rotw(iw):oh=roth(ih):c=none[rot]',
        '[base][rot]overlay=(W-w)/2:(H-h)/2:format=auto,format=yuv420p[final]',
      ].join(';'),
      '-map',
      '[final]',
      '-map',
      '0:a?',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-c:a',
      'aac',
      '-shortest',
      outputPath,
    ];

    const ff = spawn(ffmpegPath, args, { windowsHide: true });
    let stderr = '';
    ff.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    ff.on('error', (err) => reject(err));
    ff.on('close', (code) => {
      if (code === 0) resolve({ outputPath });
      else reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
    });
  });
}

async function uploadToFileIo(filePath) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    const response = await axios.post('https://file.io', form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    if (response.data && response.data.link) {
      return response.data.link;
    }
  } catch (e) {}
  return null;
}

app.post('/render', async (_req, res) => {
  try {
    await ensureSampleVideo();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const outPath = path.join(OUTPUTS_DIR, `${id}.mp4`);

    await runFfmpegRender({ inputPath: SAMPLE_PATH, outputPath: outPath });

    const localUrl = `/download/${path.basename(outPath)}`;
    const absoluteLocalUrl = `${_req.protocol}://${_req.get(
      'host'
    )}${localUrl}`;
    const tempUrl = await uploadToFileIo(outPath);

    setTimeout(() => {
      if (fs.existsSync(outPath)) {
        fs.unlink(outPath, () => {});
      }
    }, 10 * 60 * 1000);

    res.json({ ok: true, id, localUrl, absoluteLocalUrl, tempUrl });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
