import { createHash } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const distDirectory = path.join(workspace, 'dist');
const packageJson = JSON.parse(
  readFileSync(path.join(workspace, 'package.json'), 'utf8'),
);
const manifestPath = path.join(distDirectory, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const version = packageJson.version;

if (manifest.version !== version) {
  throw new Error(
    `Version mismatch: package.json is ${version}, but dist/manifest.json is ${manifest.version}.`,
  );
}
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(
    `The extension version is not a valid release version: ${version}`,
  );
}

if (process.env.EVENT_NAME === 'release') {
  const releaseTag = process.env.RELEASE_TAG;
  if (releaseTag !== version && releaseTag !== `v${version}`) {
    throw new Error(
      `Release tag "${releaseTag}" must match extension version "${version}" (optionally prefixed with "v").`,
    );
  }
}

const requiredFiles = [
  'manifest.json',
  manifest.action?.default_popup,
  ...Object.values(manifest.icons ?? {}),
  ...Object.values(manifest.action?.default_icon ?? {}),
].filter(Boolean);

for (const file of requiredFiles) {
  if (!existsSync(path.join(distDirectory, file))) {
    throw new Error(
      `The built extension is missing a manifest-referenced file: ${file}`,
    );
  }
}

function listFiles(directory, relativeDirectory = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    const absolutePath = path.join(directory, entry.name);
    return entry.isDirectory()
      ? listFiles(absolutePath, relativePath)
      : [relativePath];
  });
}

const builtFiles = listFiles(distDirectory);
const archiveName = `chainbeacon-${version}.zip`;
const archivePath = path.join(workspace, archiveName);
const checksumPath = `${archivePath}.sha256`;
if (existsSync(archivePath) || existsSync(checksumPath)) {
  throw new Error(
    `Refusing to overwrite an existing release package: ${archiveName}`,
  );
}

execFileSync('zip', ['-qr', archivePath, '.'], { cwd: distDirectory });
execFileSync('unzip', ['-tq', archivePath], { stdio: 'pipe' });

const archiveEntries = execFileSync('unzip', ['-Z1', archivePath], {
  encoding: 'utf8',
})
  .split('\n')
  .map((entry) => entry.replace(/^\.\//, '').replace(/\/$/, ''))
  .filter(Boolean);
const archiveFileSet = new Set(archiveEntries);
for (const file of builtFiles) {
  if (!archiveFileSet.has(file)) {
    throw new Error(`The ZIP is missing a built extension file: ${file}`);
  }
}
if (
  !archiveFileSet.has('manifest.json') ||
  archiveFileSet.has('dist/manifest.json')
) {
  throw new Error(
    'The ZIP must contain manifest.json at its root, without a dist/ directory.',
  );
}

const checksum = createHash('sha256')
  .update(readFileSync(archivePath))
  .digest('hex');
writeFileSync(checksumPath, `${checksum}  ${archiveName}\n`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `archive_name=${archiveName}\n`);
}

console.log(
  `Created and verified ${archiveName} with ${builtFiles.length} packaged files.`,
);
console.log(`SHA-256: ${checksum}`);
