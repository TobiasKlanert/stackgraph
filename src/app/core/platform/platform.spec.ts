import { isApplePlatform } from './platform';

describe('isApplePlatform', () => {
  it.each(['MacIntel', 'iPhone', 'iPad'])('detects %s from navigator.platform', (platform) => {
    expect(isApplePlatform({ platform })).toBe(true);
  });

  it.each(['Win32', 'Linux x86_64', ''])('treats %j as not Apple', (platform) => {
    expect(isApplePlatform({ platform })).toBe(false);
  });

  it('prefers userAgentData over the deprecated platform', () => {
    expect(isApplePlatform({ platform: 'Win32', userAgentData: { platform: 'macOS' } })).toBe(true);
    expect(isApplePlatform({ platform: 'MacIntel', userAgentData: { platform: 'Windows' } })).toBe(
      false
    );
  });

  it('falls back to platform when userAgentData has none', () => {
    expect(isApplePlatform({ platform: 'MacIntel', userAgentData: { platform: '' } })).toBe(true);
  });

  it('handles a missing navigator', () => {
    expect(isApplePlatform(undefined)).toBe(false);
  });
});
