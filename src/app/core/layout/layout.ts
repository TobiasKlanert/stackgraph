import { Injectable } from '@angular/core';
import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { ComposeModel } from '../models/compose.model';
import { toElkGraph } from './compose-to-elk';

@Injectable({
  providedIn: 'root',
})
export class Layout {
  private elk = new ELK();

  layout(model: ComposeModel) {
    const graph: ElkNode = toElkGraph(model);

    return this.elk.layout(graph);
  }
}
