import { Component, signal, computed } from '@angular/core';
import { ComposeModel } from '../../../core/models/compose.model';
import { PositionedGraph } from '../../../core/models/layout.model';
import { Rendering } from '../rendering/rendering';
import { DetailPanel } from '../detail-panel/detail-panel';

@Component({
  selector: 'app-graph-page',
  imports: [Rendering, DetailPanel],
  templateUrl: './graph-page.html',
  styleUrl: './graph-page.scss',
})
export class GraphPage {
  protected readonly graph = mockGraph;
  protected readonly model = mockModel;

  protected readonly selectedId = signal<string | null>(null);

  protected readonly selectedService = computed(() => {
    const id = this.selectedId();
    if (id === null) {
      return null;
    }
    // Service nodes carry no id prefix, so the id is the service name.
    return this.model.services.find((s) => s.name === id) ?? null;
  });

  protected onNodeSelected(id: string): void {
    this.selectedId.set(id);
  }
}

// TODO: remove / temporary fixture until the state service feeds both models (Phase 5)
export const mockGraph: PositionedGraph = {
  id: 'root',
  width: 580,
  height: 292,
  children: [
    { id: 'web', nodeType: 'service', x: 210, y: 0, width: 160, height: 64 },
    { id: 'api', nodeType: 'service', x: 0, y: 114, width: 160, height: 64 },
    { id: 'db', nodeType: 'service', x: 0, y: 228, width: 160, height: 64 },
    { id: 'net:web', nodeType: 'network', x: 210, y: 114, width: 160, height: 64 },
    { id: 'vol:db_data', nodeType: 'volume', x: 420, y: 114, width: 160, height: 64 },
  ],
  edges: [
    {
      id: 'web->api',
      edgeType: 'dependsOn',
      sources: ['web'],
      targets: ['api'],
      sections: [
        {
          id: 'web->api-s0',
          startPoint: { x: 290, y: 64 },
          bendPoints: [
            { x: 290, y: 89 },
            { x: 80, y: 89 },
          ],
          endPoint: { x: 80, y: 114 },
        },
      ],
    },
    {
      id: 'api->db',
      edgeType: 'dependsOn',
      sources: ['api'],
      targets: ['db'],
      sections: [
        {
          id: 'api->db-s0',
          startPoint: { x: 80, y: 178 },
          endPoint: { x: 80, y: 228 },
        },
      ],
    },
    {
      id: 'web--net:web',
      edgeType: 'network',
      sources: ['web'],
      targets: ['net:web'],
      sections: [
        {
          id: 'web--net:web-s0',
          startPoint: { x: 290, y: 64 },
          endPoint: { x: 290, y: 114 },
        },
      ],
    },
    {
      id: 'web--vol:db_data',
      edgeType: 'volume',
      sources: ['web'],
      targets: ['vol:db_data'],
      sections: [
        {
          id: 'web--vol:db_data-s0',
          startPoint: { x: 290, y: 64 },
          bendPoints: [
            { x: 290, y: 89 },
            { x: 500, y: 89 },
          ],
          endPoint: { x: 500, y: 114 },
        },
      ],
    },
  ],
};

export const mockModel: ComposeModel = {
  services: [
    {
      name: 'web',
      image: 'nginx:alpine',
      ports: [{ host: '8080', container: '80' }],
      dependsOn: ['api'],
      networks: ['web'],
      volumes: [{ source: 'db_data', target: '/var/lib/data', type: 'volume' }],
    },
    {
      name: 'api',
      image: 'node:22-alpine',
      ports: [],
      dependsOn: ['db'],
      networks: [],
      volumes: [],
    },
    { name: 'db', image: 'postgres:16', ports: [], dependsOn: [], networks: [], volumes: [] },
  ],
  networks: [{ name: 'web' }],
  volumes: [{ name: 'db_data' }],
};
