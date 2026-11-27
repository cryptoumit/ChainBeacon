import { execFileSync } from 'node:child_process';

const releaseTag = process.env.RELEASE_TAG;
if (!releaseTag) throw new Error('RELEASE_TAG must be set.');

function git(args, allowFailure = false) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch (error) {
    if (allowFailure) return '';
    throw error;
  }
}

const releaseCommit = git(['rev-parse', '--verify', `refs/tags/${releaseTag}`]);
const reachableTags = git([
  'for-each-ref',
  `--merged=${releaseCommit}`,
  '--sort=-version:refname',
  '--format=%(refname:short)',
  'refs/tags',
])
  .split('\n')
  .filter((tag) => tag && tag !== releaseTag);
const previousTag = reachableTags[0] ?? '';
const range = previousTag ? `${previousTag}..${releaseTag}` : releaseTag;
const repository = process.env.GITHUB_REPOSITORY;
const commits = git(['log', '--format=%H%x1f%s%x1f%b%x1e', range])
  .split('\x1e')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [hash, subject, ...bodyParts] = entry.split('\x1f');
    const body = bodyParts.join('\x1f');
    const conventional = subject.match(
      /^([a-z]+)(?:\(([^)]+)\))?(!)?:\s+(.+)$/i,
    );
    const isBreaking =
      conventional?.[3] === '!' || /^BREAKING CHANGE:/m.test(body);
    const type = conventional?.[1]?.toLowerCase() ?? 'other';
    const scope = conventional?.[2];
    const description = conventional?.[4] ?? subject;
    if (/^v?\d+\.\d+\.\d+$/.test(subject)) return null;
    const detail = scope ? `**${scope}:** ${description}` : description;
    const commitUrl = repository
      ? `https://github.com/${repository}/commit/${hash}`
      : '';
    const reference = commitUrl
      ? ` ([${hash.slice(0, 7)}](${commitUrl}))`
      : ` (${hash.slice(0, 7)})`;

    if (isBreaking)
      return { section: 'Breaking Changes', line: `- ${detail}${reference}` };
    if (type === 'feat')
      return { section: 'Features', line: `- ${detail}${reference}` };
    if (type === 'fix')
      return { section: 'Fixes', line: `- ${detail}${reference}` };
    if (type === 'perf')
      return { section: 'Performance', line: `- ${detail}${reference}` };
    if (['chore', 'ci', 'docs', 'style', 'test', 'build'].includes(type)) {
      return null;
    }
    return { section: 'Other Changes', line: `- ${detail}${reference}` };
  })
  .filter(Boolean);

const sections = [
  'Breaking Changes',
  'Features',
  'Fixes',
  'Performance',
  'Other Changes',
];
const notes = [`# ChainBeacon ${releaseTag}`];
for (const section of sections) {
  const entries = commits.filter((commit) => commit.section === section);
  if (entries.length === 0) continue;
  notes.push('', `## ${section}`, '', ...entries.map(({ line }) => line));
}

if (notes.length === 1) notes.push('', 'No user-facing changes.');
console.log(notes.join('\n'));
