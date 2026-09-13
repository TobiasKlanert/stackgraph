import { TestBed } from '@angular/core/testing';
import { ComposeState } from './compose-state';

const validYaml = `
services:
  web:
    image: nginx:alpine
    depends_on:
      - api
  api:
    image: node:22-alpine
`;

const otherYaml = `
services:
  solo:
    image: redis:7
`;

const brokenYaml = `
services:
  web:
    image: "nginx
`;

describe('ComposeState', () => {
  let state: ComposeState;

  /** Flushes effects and polls until the pipeline reached the expected state. */
  async function settleUntil(predicate: () => boolean, timeoutMs = 10_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      TestBed.tick();
      if (predicate()) {
        return;
      }
      if (Date.now() > deadline) {
        throw new Error('Timed out waiting for the pipeline to settle');
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    state = TestBed.inject(ComposeState);
  });

  it('starts empty', () => {
    expect(state.state().status).toBe('empty');
    expect(state.displayed()).toBeNull();
  });

  it('lays out a valid compose file', async () => {
    state.source.set(validYaml);
    await settleUntil(() => state.state().status === 'ready');

    const current = state.state();
    expect(current.status).toBe('ready');

    if (current.status === 'ready') {
      expect(current.model.services.map((s) => s.name)).toEqual(['web', 'api']);
      expect(current.graph.children?.length).toBe(2);
    }
    expect(state.displayed()?.graph).toBeDefined();
  });

  it('does not react before the debounce has elapsed', () => {
    state.source.set(validYaml);
    TestBed.tick();

    expect(state.state().status).toBe('empty');
  });

  it('keeps the last good graph while the input is broken', async () => {
    state.source.set(validYaml);
    await settleUntil(() => state.state().status === 'ready');
    const good = state.displayed();

    state.source.set(brokenYaml);
    await settleUntil(() => state.state().status === 'error');

    expect(state.state().status).toBe('error');
    expect(state.errors().length).toBeGreaterThan(0);
    expect(state.displayed()).toBe(good);
  });

  it('clears the displayed graph when the input is emptied', async () => {
    state.source.set(validYaml);
    await settleUntil(() => state.state().status === 'ready');

    state.source.set('   ');
    await settleUntil(() => state.displayed() === null);

    expect(state.state().status).toBe('empty');
    expect(state.displayed()).toBeNull();
  });

  it('replaces the displayed graph when a new valid file arrives', async () => {
    state.source.set(validYaml);
    await settleUntil(() => state.state().status === 'ready');

    state.source.set(otherYaml);
    await settleUntil(() => state.displayed()?.model.services[0]?.name === 'solo');

    expect(state.displayed()?.model.services.map((s) => s.name)).toEqual(['solo']);
  });
});
