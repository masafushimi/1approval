// Teams 画面モック (teams-mock.html) と SharePoint 画面モック (sharepoint-mock.html) を撮影して ../img/ に保存する。
// 使い方: node teams/manual/shots/capture.js
const path = require('path');
const { chromium } = require('playwright');

const SCENES = [
  'T01-apply-form', 'T02-arrange-card', 'T03-arrange-hotel', 'T04-imported', 'T05-request', 'T05b-requested',
  'T06-approver-card', 'T07-approved', 'T08-final-request', 'T09-final-approve', 'T09b-final-done',
  'T10-failed', 'T10b-failed-rearrange', 'T11-additional-approve', 'T12-cancelled',
  'T13-withdraw', 'T13b-withdraw-error', 'T14-receipt',
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 788 } });
  const url = 'file://' + path.join(__dirname, 'teams-mock.html');
  for (const s of SCENES) {
    await page.goto(`${url}#${s}`);
    await page.reload();
    await page.screenshot({ path: path.join(__dirname, '..', 'img', `${s}.png`) });
  }
  const sp = 'file://' + path.join(__dirname, 'sharepoint-mock.html');
  for (const s of ['S01-sp-list', 'S02-sp-views', 'S03-sp-csv']) {
    await page.goto(`${sp}#${s}`);
    await page.reload();
    await page.screenshot({ path: path.join(__dirname, '..', 'img', `${s}.png`) });
  }
  await browser.close();
})();
