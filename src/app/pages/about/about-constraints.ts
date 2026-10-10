/**
 * The five constraints of "Goals & constraints". The ids are the anchors of
 * their rows on the page; the decision cards link to them. A union type, so
 * a typo in a card's `followsFrom` is a compile error, not a dead link.
 */
export type ConstraintId = 'c-browser' | 'c-feedback' | 'c-errors' | 'c-direction' | 'c-a11y';

/** Titles as the rows show them (the About spec checks that they match). */
export const constraintTitles: Readonly<Record<ConstraintId, string>> = {
  'c-browser': 'Nothing leaves the browser',
  'c-feedback': 'Feedback while typing',
  'c-errors': 'Errors a person can act on',
  'c-direction': 'A layout that shows direction',
  'c-a11y': 'Accessibility is part of v1',
};
