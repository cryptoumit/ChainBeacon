import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const archives = ['chainbeacon-chrome.zip', 'chainbeacon-firefox.zip'];

function unzip(args) {
  return execFileSync('unzip', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function requireFile(files, file, archive) {
  const normalized = path.posix.normalize(file.replace(/^\.\//, ''));
  if (normalized.startsWith('../') || normalized.startsWith('/')) {
    throw new Error(`${archive} manifest contains unsafe path: ${file}`);
  }
  if (!files.has(normalized)) {
    throw new Error(`${archive} is missing required file: ${normalized}`);
  }
}

function manifestFiles(manifest) {
  const refs = [];
  const add = (value) => {
    if (typeof value === 'string') refs.push(value);
  };
  const addMap = (value) => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(add);
    }
  };

  addMap(manifest.icons);
  add(manifest.action?.default_popup);
  addMap(manifest.action?.default_icon);
  add(manifest.options_page);
  add(manifest.options_ui?.page);
  add(manifest.background?.service_worker);
  add(manifest.background?.page);
  if (Array.isArray(manifest.background?.scripts)) {
    manifest.background.scripts.forEach(add);
  }
  for (const script of manifest.content_scripts ?? []) {
    script.js?.forEach(add);
    script.css?.forEach(add);
  }
  for (const page of Object.values(manifest.chrome_url_overrides ?? {}))
    add(page);
  return refs;
}

for (const archive of archives) {
  unzip(['-tq', archive]);
  const files = new Set(
    unzip(['-Z1', archive])
      .split('\n')
      .map((file) => file.replace(/^\.\//, '').trim())
      .filter((file) => file && !file.endsWith('/')),
  );

  requireFile(files, 'manifest.json', archive);
  requireFile(files, 'popup.html', archive);
  const manifest = JSON.parse(unzip(['-p', archive, 'manifest.json']));
  if (manifest.manifest_version !== 3) {
    throw new Error(`${archive} must contain a Manifest V3 manifest.`);
  }
  if (manifest.name !== 'ChainBeacon') {
    throw new Error(`${archive} has an unexpected extension name.`);
  }

  const expectedReferences = manifestFiles(manifest);
  for (const file of expectedReferences) requireFile(files, file, archive);

  const popup = unzip([
    '-p',
    archive,
    manifest.action?.default_popup ?? 'popup.html',
  ]);
  const assetReferences = [
    ...popup.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi),
  ]
    .map((match) => match[1])
    .filter((ref) => !/^(?:[a-z]+:|\/\/|#)/i.test(ref));
  const popupAssets = assetReferences.map((ref) =>
    path.posix.normalize(
      path.posix.join(
        path.posix.dirname(manifest.action?.default_popup ?? 'popup.html'),
        decodeURIComponent(ref.split(/[?#]/, 1)[0]),
      ),
    ),
  );
  for (const file of popupAssets) requireFile(files, file, archive);
  if (!popupAssets.some((file) => file.endsWith('.js'))) {
    throw new Error(`${archive} popup does not reference a JavaScript bundle.`);
  }

  console.log(
    `Verified ${archive}: valid ZIP, Manifest V3, popup, and referenced files.`,
  );
}
