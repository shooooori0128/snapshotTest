const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const ja = require('dayjs/locale/ja');
const puppeteer = require('puppeteer');
const PixelDiff = require('pixel-diff');

dayjs.locale(ja);

const beforeUrl = process.argv[2];
const afterUrl = process.argv[3];

const delay = (second) => new Promise((resolve) => setTimeout(resolve, second * 1000));

const snapScreenshot = async (url, imageDir, prefix) => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewport({ width: 1024, height: 768 });
  
  const doLogin = await (async () => {
    const loginUrl = `${new URL(url).origin}/signin`;
    const userName = ''; // ← ユーザー名を入れてください
    const password = ''; // ← パスワードを入れてください
    
    await page.goto(loginUrl, { waitUntil: 'networkidle0' });
    await page.type('input[id=":r1:"]', userName);
    await page.type('input[id=":r3:"]', password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('#__next > div > div > div > div > div.MuiCardActions-root.MuiCardActions-spacing.css-1jst1nq-MuiCardActions-root > button'),
    ]);
  })();

  const imagePath = path.join(imageDir, `${prefix}.png`);

  await page.goto(url, { waitUntil: 'networkidle0' });
  await delay(5);
  await page.screenshot({
    path: imagePath,
    fullPage: true
  });
  await browser.close();

  return imagePath;
};

(async () => {
  const executeDateTime = dayjs().format('YYYY_MM_DD_HH_mm_ss');
  const imageDir = `images/${executeDateTime}`;

  fs.mkdirSync(imageDir, { recursive: true });

  const beforeImagePath = await snapScreenshot(beforeUrl, imageDir, 'before');
  const afterImagePath = await snapScreenshot(afterUrl, imageDir, 'after');
  const diffImagePath = path.join(imageDir, 'diff.png');

  const diff = new PixelDiff({
    imageAPath: beforeImagePath,
    imageBPath: afterImagePath,
    imageOutputPath: diffImagePath,
  });

  diff.run((error, result) => {
    if (error) {
      throw error;
    }
  });
})();

