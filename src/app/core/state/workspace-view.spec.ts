import { TestBed } from '@angular/core/testing';
import { WorkspaceView } from './workspace-view';

describe('WorkspaceView', () => {
  it('starts closed and follows open and close', () => {
    const view = TestBed.inject(WorkspaceView);

    expect(view.isOpen()).toBe(false);
    view.open();
    expect(view.isOpen()).toBe(true);
    view.close();
    expect(view.isOpen()).toBe(false);
  });
});
