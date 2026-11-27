import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bumpType = process.argv[2] ?? 'patch';
const increments = ['major', 'minor', 'patch'];

function git(...args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function gh(...args) {
  try {
    return execFileSync('gh', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        'GitHub CLI (gh) is required. Install it with `brew install gh`, then run `gh auth login`.',
      );
    }
    throw error;
  }
}

if (!increments.includes(bumpType)) {
  throw new Error('Usage: npm run version:bump -- [major|minor|patch]');
}

if (git('status', '--porcelain')) {
  throw new Error(
    'Commit or stash the existing working tree changes before bumping the version.',
  );
}

const branch = git('branch', '--show-current');
if (!branch) {
  throw new Error('Check out a branch before creating a release.');
}

git('remote', 'get-url', 'origin');
gh('auth', 'status');
const repository = gh(
  'repo',
  'view',
  '--json',
  'nameWithOwner',
  '--jq',
  '.nameWithOwner',
);

const manifestPaths = [
  'package.json',
  'apps/web/package.json',
  'apps/extension/package.json',
  'packages/core/package.json',
  'packages/ui/package.json',
  'apps/extension/manifests/chrome.json',
  'apps/extension/manifests/firefox.json',
];

const manifests = await Promise.all(
  manifestPaths.map(async (file) => {
    const contents = await readFile(path.join(root, file), 'utf8');
    return { file, contents, data: JSON.parse(contents) };
  }),
);

const currentVersion = manifests[0].data.version;
if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) {
  throw new Error(`Expected a numeric x.y.z version, found: ${currentVersion}`);
}

for (const { file, data } of manifests) {
  if (data.version !== currentVersion) {
    throw new Error(
      `${file} is at ${data.version}; expected all app versions to match ${currentVersion}`,
    );
  }
}

const [major, minor, patch] = currentVersion.split('.').map(Number);
const nextVersion =
  bumpType === 'major'
    ? `${major + 1}.0.0`
    : bumpType === 'minor'
      ? `${major}.${minor + 1}.0`
      : `${major}.${minor}.${patch + 1}`;

if (git('tag', '--list', nextVersion)) {
  throw new Error(`Git tag ${nextVersion} already exists.`);
}

for (const manifest of manifests) {
  manifest.data.version = nextVersion;
  await writeFile(
    path.join(root, manifest.file),
    `${JSON.stringify(manifest.data, null, 2)}\n`,
  );
}

const lockPath = path.join(root, 'package-lock.json');
const lock = JSON.parse(await readFile(lockPath, 'utf8'));
lock.version = nextVersion;
lock.packages[''].version = nextVersion;
for (const workspace of [
  'apps/web',
  'apps/extension',
  'packages/core',
  'packages/ui',
]) {
  if (lock.packages[workspace]) lock.packages[workspace].version = nextVersion;
}
await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);

const changedFiles = [...manifestPaths, 'package-lock.json'];
git('add', '--', ...changedFiles);
git('commit', '-m', `${nextVersion}`);
git('tag', nextVersion);
git(
  'push',
  '--atomic',
  'origin',
  `HEAD:refs/heads/${branch}`,
  `refs/tags/${nextVersion}`,
);
gh(
  'release',
  'create',
  nextVersion,
  '--draft',
  '--generate-notes',
  '--title',
  `ChainBeacon ${nextVersion}`,
  '--repo',
  repository,
);

console.log(
  `Bumped ChainBeacon ${currentVersion} → ${nextVersion}, pushed the commit and tag, and created a draft GitHub Release. Review and publish the draft to package the extensions.`,
);
