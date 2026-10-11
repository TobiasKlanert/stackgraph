/**
 * Below this width the split view shows one pane at a time, switched by
 * tabs. Must match `$compact-below` in graph-page.scss: the stylesheet lays
 * the panes out, this query only decides the tab semantics.
 */
export const compactLayoutQuery = '(width < 1024px)';

export type Pane = 'editor' | 'graph';

/** The tabs of the compact layout, in order. Their ids are built from the pane: pane-tab-editor. */
export const paneTabs: readonly { readonly pane: Pane; readonly label: string }[] = [
  { pane: 'editor', label: 'Editor' },
  { pane: 'graph', label: 'Graph' },
];
