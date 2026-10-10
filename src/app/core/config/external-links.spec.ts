import { externalLinks, sourceAt, sourceRef } from './external-links';

describe('sourceAt', () => {
  it('links a file at the release tag', () => {
    expect(sourceAt('Dockerfile')).toBe(`${externalLinks.github}/blob/${sourceRef}/Dockerfile`);
  });

  it('links a folder written with a trailing slash as a tree, without the slash', () => {
    expect(sourceAt('src/app/core/parser/')).toBe(
      `${externalLinks.github}/tree/${sourceRef}/src/app/core/parser`
    );
  });
});
