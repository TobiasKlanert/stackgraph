import { phoneUri, siteOperator } from './site-operator';

describe('siteOperator', () => {
  // An incomplete imprint is a legal problem, not a cosmetic one, so it
  // fails the build. The message names the empty fields.
  it('has every field filled in', () => {
    const { address, ...contact } = siteOperator;
    const empty = Object.entries({ ...contact, ...address })
      .filter(([, value]) => value.trim() === '')
      .map(([field]) => field);

    expect(empty).toEqual([]);
  });
});

describe('phoneUri', () => {
  it('turns the display format into a tel: URI', () => {
    expect(phoneUri('+49 151 2345678')).toBe('tel:+491512345678');
  });

  it('drops separators other than spaces', () => {
    expect(phoneUri('+49 151-234 56/78')).toBe('tel:+491512345678');
  });
});
