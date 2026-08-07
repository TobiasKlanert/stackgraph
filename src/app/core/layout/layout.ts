import { Injectable } from '@angular/core';
import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { ComposeModel } from '../models/compose.model';
import { PositionedGraph } from '../models/layout.model';
import { toElkGraph } from './compose-to-elk';

@Injectable({
  providedIn: 'root',
})
export class Layout {
  private elk = new ELK();

  async layout(model: ComposeModel): Promise<PositionedGraph> {
    const graph: ElkNode = toElkGraph(model);
    const result = await this.elk.layout(graph);

    // ELK preserves custom fields through layout, verified against elkjs@0.11.1
    return result as PositionedGraph;
  }
}
