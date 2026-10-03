import { asSentence, fixHint } from './error-hints';
import { parseCompose } from './yaml-parser';

/** The first error the real parser reports for a source. */
function firstError(source: string) {
  const result = parseCompose(source);
  if (result.ok) {
    throw new Error('Expected a parse error');
  }
  const [error] = result.errors;
  if (!error) {
    throw new Error('Expected at least one error');
  }
  return error;
}

describe('fixHint', () => {
  // Real js-yaml messages, so a changed wording in a js-yaml update shows up here.
  it.each([
    ['services:\n  api:\n    image: a\n   ports:\n', 'keys on the same level'],
    ['services:\n\tweb:\n    image: a\n', 'Indent with spaces'],
    ['services:\n  web:\n    image: a\n    image: b\n', 'appears twice'],
    ['services:\n  web:\n    image: "nginx\n', 'double quote'],
    ['services:\n  web: [\n', 'bracket'],
  ])('explains how to fix %j', (source, expected) => {
    expect(fixHint(firstError(source))).toContain(expected);
  });

  it('gives no hint when it has none that fits', () => {
    expect(fixHint({ message: 'Service "app" is not a valid object.' })).toBeUndefined();
  });
});

describe('asSentence', () => {
  it('capitalises and closes a js-yaml message', () => {
    expect(asSentence('bad indentation of a mapping entry')).toBe(
      'Bad indentation of a mapping entry.'
    );
  });

  it('leaves a finished sentence alone', () => {
    expect(asSentence('Service "app" is not a valid object.')).toBe(
      'Service "app" is not a valid object.'
    );
  });
});
