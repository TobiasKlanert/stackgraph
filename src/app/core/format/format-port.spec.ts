import { formatPort } from './format-port';

describe('formatPort', () => {
  it('shows only the container port in the short form', () => {
    expect(formatPort({ container: '5432' })).toBe('5432');
  });

  it('joins host and container port', () => {
    expect(formatPort({ host: '8080', container: '80' })).toBe('8080:80');
  });

  it('appends an explicit protocol', () => {
    expect(formatPort({ host: '53', container: '53', protocol: 'udp' })).toBe('53:53/udp');
  });
});
