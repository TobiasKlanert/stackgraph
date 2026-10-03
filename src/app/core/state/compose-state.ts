import { Injectable, inject, computed, signal, linkedSignal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  distinctUntilChanged,
  filter,
  timer,
  from,
  of,
  share,
  switchMap,
  startWith,
} from 'rxjs';
import { ComposeModel, ParseError } from '../models/compose.model';
import { PositionedGraph } from '../models/layout.model';
import { parseCompose } from '../parser/yaml-parser';
import { Layout } from '../layout/layout';

export type ParseState =
  | { status: 'empty' }
  | { status: 'pending' }
  | { status: 'error'; errors: ParseError[] }
  | {
      status: 'ready';
      model: ComposeModel;
      graph: PositionedGraph;
      /** Time spent parsing and validating the YAML, without the layout. */
      parseMs: number;
    };

export type ReadyState = Extract<ParseState, { status: 'ready' }>;

const debounceMs = 300;

/**
 * How long a change may be pending before "Updating…" appears. Shorter
 * updates finish unnoticed; showing them would flicker on every keystroke.
 */
export const updatingDelayMs = 400;

@Injectable({ providedIn: 'root' })
export class ComposeState {
  private readonly layout = inject(Layout);

  /** Single source of truth for the YAML text. Home and editor both write here. */
  readonly source = signal('');

  /** One pipeline for both signals below; `share` keeps it from running twice. */
  private readonly state$ = toObservable(this.source).pipe(
    switchMap((text) =>
      timer(debounceMs).pipe(
        switchMap(() => this.run(text)),
        startWith({ status: 'pending' } as ParseState)
      )
    ),
    share()
  );

  /** Honest result of the current input. Errors replace the graph. */
  readonly state = toSignal(this.state$, { initialValue: { status: 'empty' } as ParseState });

  /**
   * The current result without the "pending" phases. While typing, every
   * pause is pending for the debounce time; status bar and error box show
   * the last result instead of flickering. Built from the stream, not with
   * linkedSignal, so it does not depend on being read in between.
   */
  readonly settled = toSignal(this.state$.pipe(filter((s) => s.status !== 'pending')), {
    // `as const`, not `as ParseState`: the filter narrows the stream to
    // results without "pending", and the initial value has to fit that type.
    initialValue: { status: 'empty' } as const,
  });

  /**
   * True once a change has been pending for `updatingDelayMs`. Measured from
   * the first pending moment: typing on keeps the state pending, and the
   * clock does not restart with every keystroke.
   */
  readonly updating = toSignal(
    this.state$.pipe(
      map((s) => s.status === 'pending'),
      distinctUntilChanged(),
      switchMap((pending) => (pending ? timer(updatingDelayMs).pipe(map(() => true)) : of(false)))
    ),
    { initialValue: false }
  );

  /**
   * Last successful result, kept while the input is temporarily invalid.
   * An empty input is not an error but an intent, so it clears the view.
   *
   * Caveat: linkedSignal computes lazily, so `previous` only holds a value
   * if something read this signal during the preceding ready state. Nobody
   * reading it means nothing to fall back on. The bridging silently does
   * not happen. Currently safe because the graph view reads it on every
   * change detection while it is open.
   */
  readonly displayed = linkedSignal<ParseState, ReadyState | null>({
    source: this.state,
    computation: (state, previous) => {
      if (state.status === 'ready') {
        return state;
      }
      if (state.status === 'empty') {
        return null;
      }
      return previous?.value ?? null;
    },
  });

  readonly errors = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.errors : [];
  });

  private run(text: string): Observable<ParseState> {
    if (text.trim() === '') {
      return of({ status: 'empty' });
    }

    const start = performance.now();
    const result = parseCompose(text);
    const parseMs = performance.now() - start;
    if (!result.ok) {
      return of({ status: 'error', errors: result.errors });
    }

    // catchError sits inside the switchMap: a rejected layout must not
    // terminate the outer stream, or the editor would stop reacting.
    return from(this.layout.layout(result.model)).pipe(
      map((graph): ParseState => ({ status: 'ready', model: result.model, graph, parseMs })),
      catchError((error: unknown) =>
        of<ParseState>({
          status: 'error',
          errors: [{ message: `Layout failed: ${String(error)}` }],
        })
      )
    );
  }
}
