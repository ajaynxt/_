import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const configPath = resolve(process.cwd(), 'indexnow.config.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));

const args = process.argv.slice(2);
const rawUrls = args.length ? args : config.defaultUrls;

const urls = [...new Set(rawUrls.map((value) => {
  const url = new URL(value, `https://${config.host}/`);
  url.hash = '';
  return url.href;
}))];

for (const url of urls) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== config.host) {
    throw new Error(`IndexNow only accepts canonical production URLs for this site: ${url}`);
  }
  if (/localhost|127\.0\.0\.1|\.local$/i.test(parsed.hostname)) {
    throw new Error(`Refusing to submit local/test URL: ${url}`);
  }
}

const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: {
    'content-type': 'application/json; charset=utf-8'
  },
  body: JSON.stringify({
    host: config.host,
    key: config.key,
    keyLocation: config.keyLocation,
    urlList: urls
  })
});

const body = await response.text();
if (!response.ok) {
  throw new Error(`IndexNow submission failed (${response.status}): ${body}`);
}

console.log(`Submitted ${urls.length} URL(s) to IndexNow.`);
