import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Editor } from './editor';
import { ComposeState } from '../../../core/state/compose-state';

describe('Editor', () => {
  let fixture: ComponentFixture<Editor>;
  let state: ComposeState;

  function textarea(): HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('textarea');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Editor] }).compileComponents();
    state = TestBed.inject(ComposeState);
    fixture = TestBed.createComponent(Editor);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the current source', async () => {
    state.source.set('services: {}');
    await fixture.whenStable();

    expect(textarea().value).toBe('services: {}');
  });

  it('writes typed text back into the source', () => {
    const el = textarea();
    el.value = 'services:\n  web:\n';
    el.dispatchEvent(new Event('input'));

    expect(state.source()).toBe('services:\n  web:\n');
  });
});
