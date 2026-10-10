const repository = 'https://github.com/TobiasKlanert/stackgraph';

/** External pages, linked from the footer and the About page. */
export const externalLinks = {
  github: repository,
  linkedIn: 'https://www.linkedin.com/in/tobias-klanert-80563731a',
  milestoneNext: `${repository}/milestone/9`,
  parseDontValidate: 'https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/',
} as const;

/**
 * Release whose code the About page describes. Links into the source point
 * to this tag instead of main, so page and code always show the same state
 * and a moved file cannot break a link. Update it with the page.
 */
export const sourceRef = 'v1.0.0';

/**
 * Link to a file or folder in the repository at `sourceRef`. Folders are
 * written with a trailing slash.
 */
export function sourceAt(path: string): string {
  const isFolder = path.endsWith('/');
  const kind = isFolder ? 'tree' : 'blob';
  return `${repository}/${kind}/${sourceRef}/${isFolder ? path.slice(0, -1) : path}`;
}
