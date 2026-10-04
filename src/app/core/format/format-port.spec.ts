import { describePort, formatPort } from './format-port';

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

describe('describePort', () => {
  it('names host and container port', () => {
    expect(describePort({ host: '8080', container: '80' })).toBe(
      'Host port 8080 to container port 80'
    );
  });

  it('explains the short form, which publishes on a random host port', () => {
    expect(describePort({ container: '3000' })).toBe('Container port 3000 on a random host port');
  });

  it('mentions UDP but not the TCP default', () => {
    expect(describePort({ host: '53', container: '53', protocol: 'udp' })).toBe(
      'Host port 53 to container port 53, UDP'
    );
    expect(describePort({ host: '80', container: '80', protocol: 'tcp' })).toBe(
      'Host port 80 to container port 80'
    );
  });
});
