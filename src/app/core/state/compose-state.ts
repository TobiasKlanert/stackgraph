import { Injectable, inject, computed, signal, linkedSignal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, from, of, switchMap } from 'rxjs';
import { ComposeModel, ParseError } from '../models/compose.model';
import { PositionedGraph } from '../models/layout.model';
import { parseCompose } from '../parser/yaml-parser';
import { Layout } from '../layout/layout';

export type ParseState =
  | { status: 'empty' }
  | { status: 'error'; errors: ParseError[] }
  | { status: 'ready'; model: ComposeModel; graph: PositionedGraph };

export type ReadyState = Extract<ParseState, { status: 'ready' }>;

const debounceMs = 300;

@Injectable({ providedIn: 'root' })
export class ComposeState {
  private readonly layout = inject(Layout);

  /** Single source of truth for the YAML text. Home and editor both write here. */
  readonly source = signal('');

  /** Honest result of the current input. Errors replace the graph. */
  readonly state = toSignal(
    toObservable(this.source).pipe(
      debounceTime(debounceMs),
      switchMap((text) => this.run(text))
    ),
    { initialValue: { status: 'empty' } as ParseState }
  );

  /** Last successful result, kept while the input is broken. */
  readonly displayed = linkedSignal<ParseState, ReadyState | null>({
    source: this.state,
    computation: (state, previous) =>
      state.status === 'ready' ? state : (previous?.value ?? null),
  });

  readonly errors = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.errors : [];
  });

  private run(text: string): Observable<ParseState> {
    if (text.trim() === '') {
      return of({ status: 'empty' });
    }

    const result = parseCompose(text);
    if (!result.ok) {
      return of({ status: 'error', errors: result.errors });
    }

    // catchError sits inside the switchMap: a rejected layout must not
    // terminate the outer stream, or the editor would stop reacting.
    return from(this.layout.layout(result.model)).pipe(
      map((graph): ParseState => ({ status: 'ready', model: result.model, graph })),
      catchError((error: unknown) =>
        of<ParseState>({
          status: 'error',
          errors: [{ message: `Layout failed: ${String(error)}` }],
        })
      )
    );
  }
}
