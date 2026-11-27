import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const versionFiles = [
  'package.json',
  'apps/web/package.json',
  'apps/extension/package.json',
  'packages/core/package.json',
  'packages/ui/package.json',
  'apps/extension/manifests/chrome.json',
  'apps/extension/manifests/firefox.json',
];

async function readJson(file) {
  return JSON.parse(await readFile(path.join(root, file), 'utf8'));
}

const manifests = await Promise.all(
  versionFiles.map(async (file) => ({ file, data: await readJson(file) })),
);
const expectedVersion = manifests[0].data.version;
const mismatches = manifests
  .filter(({ data }) => data.version !== expectedVersion)
  .map(({ file, data }) => `${file} has ${data.version}`);

if (!/^\d+\.\d+\.\d+$/.test(expectedVersion)) {
  mismatches.push(`root package has invalid version ${expectedVersion}`);
}

const lock = await readJson('package-lock.json');
if (lock.version !== expectedVersion) {
  mismatches.push(`package-lock.json has ${lock.version}`);
}
if (lock.packages?.['']?.version !== expectedVersion) {
  mismatches.push(
    `package-lock.json root entry has ${lock.packages?.['']?.version}`,
  );
}

for (const workspace of [
  'apps/web',
  'apps/extension',
  'packages/core',
  'packages/ui',
]) {
  const workspaceVersion = lock.packages?.[workspace]?.version;
  if (workspaceVersion !== expectedVersion) {
    mismatches.push(
      `package-lock.json ${workspace} entry has ${workspaceVersion}`,
    );
  }
}

const releaseTag = process.env.RELEASE_TAG;
if (releaseTag && releaseTag !== expectedVersion) {
  mismatches.push(`release tag ${releaseTag} does not match ${expectedVersion}`);
}

if (mismatches.length > 0) {
  console.error('Release version check failed:');
  for (const mismatch of mismatches) console.error(`- ${mismatch}`);
  process.exitCode = 1;
} else {
  console.log(
    releaseTag
      ? `Release tag and all manifests match ${expectedVersion}.`
      : `All manifests match ${expectedVersion}.`,
  );
}
