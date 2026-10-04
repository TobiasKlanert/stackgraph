import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Editor } from './editor';
import { ComposeState } from '../../../core/state/compose-state';

describe('Editor', () => {
  let fixture: ComponentFixture<Editor>;
  let state: ComposeState;

  function textarea(): HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('textarea');
  }

  function lineNumbers(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.line-numbers span'));
  }

  async function moveCaret(
    start: number,
    end = start,
    direction: 'forward' | 'backward' = 'forward'
  ) {
    textarea().setSelectionRange(start, end, direction);
    textarea().dispatchEvent(new Event('selectionchange'));
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Editor] }).compileComponents();
    state = TestBed.inject(ComposeState);
    fixture = TestBed.createComponent(Editor);
    fixture.componentRef.setInput('label', 'Docker Compose YAML');
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('moves focus into the textarea on request', () => {
    fixture.componentInstance.focus();

    expect(document.activeElement).toBe(textarea());
  });

  it('names the textarea after the label input', () => {
    expect(textarea().getAttribute('aria-label')).toBe('Docker Compose YAML');
  });

  it('shows no placeholder unless one is given', async () => {
    expect(textarea().hasAttribute('placeholder')).toBe(false);

    fixture.componentRef.setInput('placeholder', '# Paste here');
    await fixture.whenStable();

    expect(textarea().getAttribute('placeholder')).toBe('# Paste here');
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

  it('numbers every line, including the one after a trailing line break', async () => {
    state.source.set('services:\n  web:\n');
    await fixture.whenStable();

    expect(lineNumbers().map((n) => n.textContent?.trim())).toEqual(['1', '2', '3']);
  });

  it('hides the line numbers from screen readers', () => {
    expect(fixture.nativeElement.querySelector('.gutter')?.getAttribute('aria-hidden')).toBe(
      'true'
    );
  });

  it('does not wrap lines, so every number belongs to one line', () => {
    expect(textarea().getAttribute('wrap')).toBe('off');
  });

  it('reports the caret position and marks its line number', async () => {
    state.source.set('services:\n  web:\n    image: nginx');
    await fixture.whenStable();
    await moveCaret(14);

    expect(fixture.componentInstance.caret()).toEqual({ line: 2, column: 5 });
    expect(lineNumbers()[1]?.classList).toContain('current');
    expect(lineNumbers()[0]?.classList).not.toContain('current');
  });

  it('follows the moving end of a selection', async () => {
    state.source.set('services:\n  web:\n');
    await fixture.whenStable();

    await moveCaret(2, 12, 'forward');
    expect(fixture.componentInstance.caret()).toEqual({ line: 2, column: 3 });

    await moveCaret(2, 12, 'backward');
    expect(fixture.componentInstance.caret()).toEqual({ line: 1, column: 3 });
  });

  it('updates the caret while typing', async () => {
    const el = textarea();
    el.value = 'services:\n  ';
    el.setSelectionRange(el.value.length, el.value.length);
    el.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(fixture.componentInstance.caret()).toEqual({ line: 2, column: 3 });
  });

  it('moves the line numbers along when the text scrolls', async () => {
    const el = textarea();
    Object.defineProperty(el, 'scrollTop', { value: 60, configurable: true });
    el.dispatchEvent(new Event('scroll'));
    await fixture.whenStable();

    const numbers: HTMLElement = fixture.nativeElement.querySelector('.line-numbers');
    expect(numbers.style.transform).toBe('translateY(-60px)');
  });

  it('goes to a line and column, with focus in the text', async () => {
    state.source.set('services:\n  web:\n    image: nginx');
    await fixture.whenStable();

    fixture.componentInstance.goTo(3, 5);
    await fixture.whenStable();

    expect(document.activeElement).toBe(textarea());
    expect(textarea().selectionStart).toBe(21);
    expect(fixture.componentInstance.caret()).toEqual({ line: 3, column: 5 });
  });
});
