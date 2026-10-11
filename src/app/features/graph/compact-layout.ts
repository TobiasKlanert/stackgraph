/**
 * Below this width the split view shows one pane at a time, switched by
 * tabs, and the details become a sheet. Must match `$below` in
 * features/graph/_compact.scss: the stylesheets do the layout, this query
 * only switches the semantics (tabs, sheet handle).
 */
export const compactLayoutQuery = '(width < 1024px)';

export type Pane = 'editor' | 'graph';

/** The tabs of the compact layout, in order. Their ids are built from the pane: pane-tab-editor. */
export const paneTabs: readonly { readonly pane: Pane; readonly label: string }[] = [
  { pane: 'editor', label: 'Editor' },
  { pane: 'graph', label: 'Graph' },
];
