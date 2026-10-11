import {
  EnvironmentInjector,
  createEnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FakeMediaQuery } from '../../../testing/fake-media-query';
import { mediaQuery } from './media-query';

describe('mediaQuery', () => {
  let list: FakeMediaQuery;
  let queried: string[];

  /** Own injector per test, so a test can destroy it and check the cleanup. */
  function create(query = '(width < 1024px)') {
    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const matches = runInInjectionContext(injector, () => mediaQuery(query));
    return { injector, matches };
  }

  beforeEach(() => {
    list = new FakeMediaQuery(false);
    queried = [];
    vi.stubGlobal('matchMedia', (query: string) => {
      queried.push(query);
      return list;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('asks the browser for exactly the given query', () => {
    create('(pointer: coarse)');

    expect(queried).toEqual(['(pointer: coarse)']);
  });

  it('starts with the current result', () => {
    list.matches = true;

    expect(create().matches()).toBe(true);
  });

  it('follows changes', () => {
    const { matches } = create();

    list.emit(true);
    expect(matches()).toBe(true);

    list.emit(false);
    expect(matches()).toBe(false);
  });

  it('stops listening when its injector is destroyed', () => {
    const { injector } = create();
    expect(list.hasListener).toBe(true);

    injector.destroy();

    expect(list.hasListener).toBe(false);
  });

  it('does not match where matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(create().matches()).toBe(false);
  });
});
