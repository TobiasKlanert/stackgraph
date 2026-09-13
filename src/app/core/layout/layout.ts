import { Injectable } from '@angular/core';
import type { ELK as ElkInstance, ElkNode } from 'elkjs/lib/elk.bundled.js';
import { ComposeModel } from '../models/compose.model';
import { PositionedGraph } from '../models/layout.model';
import { toElkGraph } from './compose-to-elk';

@Injectable({ providedIn: 'root' })
export class Layout {
  private elk?: ElkInstance;

  /** ELK is loaded on first use to keep it out of the initial bundle. */
  private async instance(): Promise<ElkInstance> {
    if (!this.elk) {
      const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
      this.elk = new ELK();
    }
    return this.elk;
  }

  async layout(model: ComposeModel): Promise<PositionedGraph> {
    const elk = await this.instance();
    const graph: ElkNode = toElkGraph(model);
    const result = await elk.layout(graph);

    // ELK preserves custom fields through layout, verified against elkjs@0.11.1
    return result as PositionedGraph;
  }
}
