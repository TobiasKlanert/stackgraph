import { ParseError } from '../models/compose.model';

/**
 * Fix hints for the js-yaml messages people run into most. Matched on the
 * start of js-yaml's `reason`; anything else gets no hint rather than a
 * guess. The parser reports where it noticed the problem, which for
 * indentation is often the line after the actual mistake.
 */
const hints: readonly (readonly [prefix: string, hint: string])[] = [
  [
    'bad indentation of a mapping entry',
    'Check this line and the one above: keys on the same level must start in the same column.',
  ],
  [
    'bad indentation of a sequence entry',
    'Check this line and the one above: list items on the same level must start in the same column.',
  ],
  [
    'tab characters must not be used',
    'Indent with spaces. YAML does not allow tabs for indentation.',
  ],
  [
    'duplicated mapping key',
    'This key appears twice on the same level. Remove or rename one of them.',
  ],
  [
    'unexpected end of the stream within a double quoted scalar',
    'A double quote (") opened earlier is never closed.',
  ],
  [
    'unexpected end of the stream within a single quoted scalar',
    "A single quote (') opened earlier is never closed.",
  ],
  [
    'unexpected end of the stream within a flow collection',
    'A bracket ([ or {) opened earlier is never closed.',
  ],
];

export function fixHint(error: ParseError): string | undefined {
  return hints.find(([prefix]) => error.message.startsWith(prefix))?.[1];
}

/** js-yaml writes "bad indentation of a mapping entry"; the box shows a sentence. */
export function asSentence(message: string): string {
  const text = message.trim();
  if (text === '') {
    return text;
  }
  const capitalised = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(capitalised) ? capitalised : `${capitalised}.`;
}
