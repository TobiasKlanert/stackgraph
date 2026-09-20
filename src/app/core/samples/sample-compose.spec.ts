import { toElkGraph } from '../layout/compose-to-elk';
import { parseCompose } from '../parser/yaml-parser';
import { sampleCompose } from './sample-compose';

describe('sampleCompose', () => {
  it('parses without errors', () => {
    const result = parseCompose(sampleCompose);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      expect(result.errors).toEqual([]);
    } else {
      expect(result.model.services).toHaveLength(5);
      expect(result.model.networks).toHaveLength(2);
      expect(result.model.volumes).toHaveLength(2);
    }
  });

  it('is correctly modeled as a graph', () => {
    const result = parseCompose(sampleCompose);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const graph = toElkGraph(result.model);
      expect(graph.edges).toHaveLength(12);
    }
  });
});
