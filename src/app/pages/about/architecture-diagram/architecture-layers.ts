/**
 * Content of the architecture diagram. Data instead of markup: every layer
 * is drawn the same way, and the spec can check the code names against the
 * real exports, so the diagram cannot silently fall behind a rename.
 */

/**
 * - `symbol`: an exported function or class; checked by the spec.
 * - `type`: an exported TypeScript type. Types do not exist at runtime, so
 *   these two names are the only ones the spec cannot check.
 * - `text`: a group of files, named in plain words.
 */
export type DiagramItemKind = 'symbol' | 'type' | 'text';

export interface DiagramItem {
  name: string;
  kind: DiagramItemKind;
}

export interface DiagramRow {
  items: readonly DiagramItem[];
  /** What the items in this row do. */
  note?: string;
}

export interface DiagramLayer {
  name: string;
  /** One line on what the layer is responsible for. */
  role: string;
  rows: readonly DiagramRow[];
  /** Libraries this layer uses directly. */
  libraries: readonly string[];
}

const symbol = (name: string): DiagramItem => ({ name, kind: 'symbol' });
const type = (name: string): DiagramItem => ({ name, kind: 'type' });
const text = (name: string): DiagramItem => ({ name, kind: 'text' });

/** Top to bottom; each layer may use the ones below it, never one above. */
export const architectureLayers: readonly DiagramLayer[] = [
  {
    name: 'Components',
    role: 'Render and delegate',
    rows: [
      { items: [symbol('GraphPage')], note: 'container: reads the state, holds the selection' },
      { items: [symbol('Home'), symbol('Editor')], note: 'write the text' },
      {
        items: [symbol('Rendering'), text('shapes'), symbol('Zoomable')],
        note: 'read the positioned graph',
      },
      { items: [symbol('DetailPanel'), symbol('StackOverview')], note: 'read the compose model' },
    ],
    libraries: ['d3-zoom'],
  },
  {
    name: 'State',
    role: 'Everything that has to do with time',
    rows: [
      {
        items: [symbol('ComposeState')],
        note: 'pause, parse, lay out; drops stale results, keeps the last good graph',
      },
    ],
    libraries: ['RxJS'],
  },
  {
    name: 'Pipeline',
    role: 'The steps from text to positions',
    rows: [
      {
        items: [
          symbol('parseCompose'),
          symbol('toElkGraph'),
          text('node geometry'),
          text('relations'),
          text('formatting'),
        ],
        note: 'pure functions, no Angular',
      },
      {
        items: [symbol('Layout'), symbol('SvgExport')],
        note: 'services where ELK or the DOM require one',
      },
    ],
    libraries: ['js-yaml', 'ELK.js'],
  },
  {
    name: 'Model',
    role: 'The contract between the layers',
    rows: [
      {
        items: [type('ComposeModel'), type('PositionedGraph')],
        note: 'types only',
      },
    ],
    libraries: [],
  },
];
