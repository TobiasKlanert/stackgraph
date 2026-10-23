import { version } from '../../../../package.json';

const repository = 'https://github.com/TobiasKlanert/stackgraph';

/** External pages, linked from the footer and the About page. */
export const externalLinks = {
  github: repository,
  linkedIn: 'https://www.linkedin.com/in/tobias-klanert-80563731a',
  milestoneNext: `${repository}/milestone/9`,
  parseDontValidate: 'https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/',
} as const;

/**
 * Git ref the source links point to. Derived from package.json, so
 * `npm version` keeps the links in sync with the release tag.
 * The tag must exist on GitHub, so set it right after merging a release.
 */
export const sourceRef = `v${version}`;

/**
 * Link to a file or folder in the repository at `sourceRef`. Folders are
 * written with a trailing slash.
 */
export function sourceAt(path: string): string {
  const isFolder = path.endsWith('/');
  const kind = isFolder ? 'tree' : 'blob';
  return `${repository}/${kind}/${sourceRef}/${isFolder ? path.slice(0, -1) : path}`;
}
