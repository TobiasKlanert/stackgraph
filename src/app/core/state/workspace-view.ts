import { Injectable, signal } from '@angular/core';

/**
 * Whether the split view is open. Lives in a root service instead of the
 * page, so a detour to About or the legal pages returns to the graph
 * instead of the home view. Only the brand link closes it on purpose.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceView {
  private readonly openState = signal(false);

  readonly isOpen = this.openState.asReadonly();

  open(): void {
    this.openState.set(true);
  }

  close(): void {
    this.openState.set(false);
  }
}
