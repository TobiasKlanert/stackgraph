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

  it('measures how long parsing took', async () => {
    state.source.set(validYaml);
    await settleUntil(() => state.state().status === 'ready');

    const current = state.state();
    expect(current.status === 'ready' && current.parseMs).toBeGreaterThanOrEqual(0);
  });

  it('reports pending before the debounce has elapsed', () => {
    state.source.set(validYaml);
    TestBed.tick();

    expect(state.state().status).toBe('pending');
  });

  it('keeps the displayed graph while a change is pending', async () => {
    state.source.set(validYaml);
    await settleUntil(() => state.state().status === 'ready');
    const good = state.displayed();
    expect(good).not.toBeNull();

    state.source.set(otherYaml);
    TestBed.tick();

    expect(state.state().status).toBe('pending');
    expect(state.displayed()).toBe(good);
  });

  describe('updating', () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    it('stays quiet for a short update', async () => {
      state.source.set(validYaml);
      TestBed.tick();
      expect(state.state().status).toBe('pending');
      expect(state.updating()).toBe(false);

      await settleUntil(() => state.state().status === 'ready');
      expect(state.updating()).toBe(false);
    });

    it('turns on once a change has been pending long enough, and off when it settles', async () => {
      // Typing on (a key every 120 ms, below the 300 ms debounce) keeps the
      // state pending. The check falls after the delay but before the last
      // change settles.
      const typed = ['s', 'services:', 'services:\n  w', 'services:\n  we', validYaml];
      for (const text of typed) {
        state.source.set(text);
        TestBed.tick();
        await sleep(120);
      }
      await sleep(30);
      TestBed.tick();

      expect(state.state().status).toBe('pending');
      expect(state.updating()).toBe(true);

      await settleUntil(() => state.state().status === 'ready');
      expect(state.updating()).toBe(false);
    });
  });

  it('keeps the last settled result while a change is pending', async () => {
    state.source.set(brokenYaml);
    await settleUntil(() => state.state().status === 'error');

    state.source.set(validYaml);
    TestBed.tick();

    expect(state.state().status).toBe('pending');
    expect(state.settled().status).toBe('error');

    await settleUntil(() => state.settled().status === 'ready');
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
    expect(state.displayed()).not.toBeNull();

    state.source.set('   ');
    await settleUntil(() => state.state().status === 'empty');
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
