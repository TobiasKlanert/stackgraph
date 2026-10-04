import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { ComposeState } from '../../../core/state/compose-state';
import { sampleCompose } from '../../../core/samples/sample-compose';
import { IS_APPLE_PLATFORM } from '../../../core/platform/platform';

const validYaml = `
services:
  web:
    image: nginx:alpine
`;

const brokenYaml = `
services:
  web:
    image: "nginx
`;

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let state: ComposeState;

  function button(testId: string): HTMLButtonElement {
    const el = fixture.nativeElement.querySelector(`[data-testid="${testId}"]`);
    expect(el).not.toBeNull();
    return el as HTMLButtonElement;
  }

  function showButton(): HTMLButtonElement {
    return button('show-graph');
  }

  function tryItButton(): HTMLButtonElement {
    return button('try-it');
  }

  function fieldStatus(): HTMLElement {
    return fixture.nativeElement.querySelector('.field-status');
  }

  /** Renders and polls until the pipeline produced the expected result. */
  async function settleUntil(predicate: () => boolean, timeoutMs = 10_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      await fixture.whenStable();
      if (predicate()) {
        return;
      }
      if (Date.now() > deadline) {
        throw new Error('Timed out waiting for the pipeline to settle');
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [{ provide: IS_APPLE_PLATFORM, useValue: false }],
    }).compileComponents();
    state = TestBed.inject(ComposeState);
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  function query(selector: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(selector);
  }

  function textarea(): HTMLTextAreaElement {
    return query('textarea') as HTMLTextAreaElement;
  }

  function announcement(): string {
    return query('[data-testid="announcement"]')?.textContent?.trim() ?? '';
  }

  /** Counts `submitted` emissions from now on. */
  function trackSubmits(): { count: number } {
    const counter = { count: 0 };
    fixture.componentInstance.submitted.subscribe(() => counter.count++);
    return counter;
  }

  describe('show graph', () => {
    it('is never disabled', () => {
      expect(showButton().disabled).toBe(false);
    });

    it('opens the graph for valid yaml', async () => {
      state.source.set(validYaml);
      await settleUntil(() => state.state().status === 'ready');
      const submits = trackSubmits();

      showButton().click();
      await settleUntil(() => submits.count > 0);

      expect(submits.count).toBe(1);
      expect(query('.feedback')).toBeNull();
    });

    it('waits for a pending parse instead of asking for a second click', async () => {
      const submits = trackSubmits();
      state.source.set(validYaml);
      await fixture.whenStable();
      expect(state.state().status).toBe('pending');

      showButton().click();
      await settleUntil(() => submits.count > 0);

      expect(submits.count).toBe(1);
    });

    it('opens only once when clicked twice while waiting', async () => {
      const submits = trackSubmits();
      state.source.set(validYaml);
      await fixture.whenStable();

      showButton().click();
      showButton().click();
      await settleUntil(() => submits.count > 0);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(submits.count).toBe(1);
    });

    it('explains an empty field and moves focus into it', async () => {
      const submits = trackSubmits();

      showButton().click();
      await settleUntil(() => query('[data-testid="empty-hint"]') !== null);

      expect(submits.count).toBe(0);
      expect(query('[data-testid="empty-hint"]')?.textContent).toContain(
        'Paste a compose file first'
      );
      expect(announcement()).toContain('Paste a compose file first');
      expect(document.activeElement).toBe(textarea());
    });

    it('shows the errors of broken yaml', async () => {
      state.source.set(brokenYaml);
      await settleUntil(() => state.errors().length > 0);
      const submits = trackSubmits();

      showButton().click();
      await settleUntil(() => query('app-error-box') !== null);

      expect(submits.count).toBe(0);
      expect(announcement()).toMatch(/^Fix the error on line \d+ first\.$/);
      expect(document.activeElement).toBe(textarea());
    });

    it('shows no feedback before the first click', async () => {
      state.source.set(brokenYaml);
      await settleUntil(() => state.errors().length > 0);

      expect(query('.feedback')).toBeNull();
      expect(announcement()).toBe('');
    });

    it('removes the feedback once the yaml is fixed', async () => {
      state.source.set(brokenYaml);
      await settleUntil(() => state.errors().length > 0);
      showButton().click();
      await settleUntil(() => query('app-error-box') !== null);

      state.source.set(validYaml);
      await settleUntil(() => query('.feedback') === null);

      expect(announcement()).toBe('');
    });
  });

  it('fills the source with the sample compose file', () => {
    tryItButton().click();

    expect(state.source()).toBe(sampleCompose);
  });

  it('opens the graph view directly', () => {
    let emitted = false;
    fixture.componentInstance.submitted.subscribe(() => (emitted = true));

    tryItButton().click();

    expect(emitted).toBe(true);
  });

  describe('field status', () => {
    it('says the field is empty at first', () => {
      expect(fieldStatus().textContent?.trim()).toBe('Empty');
      expect(fieldStatus().getAttribute('role')).toBe('status');
    });

    it('reports valid yaml', async () => {
      state.source.set(validYaml);
      await settleUntil(() => fieldStatus().textContent?.trim() === 'Valid');

      expect(fieldStatus().dataset['kind']).toBe('valid');
    });

    it('counts the errors of broken yaml', async () => {
      state.source.set(brokenYaml);
      await settleUntil(() => fieldStatus().textContent?.trim() === '1 error');

      expect(fieldStatus().dataset['kind']).toBe('error');
    });
  });

  it('describes the editor with the privacy note', () => {
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    const note = fixture.nativeElement.querySelector(
      `#${textarea.getAttribute('aria-describedby')}`
    );

    expect(note?.textContent).toContain('Nothing is uploaded');
  });

  describe('keyboard shortcut', () => {
    function press(target: HTMLElement, init: KeyboardEventInit): KeyboardEvent {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
        ...init,
      });
      target.dispatchEvent(event);
      return event;
    }

    it('shows Ctrl ↵ outside Apple systems', () => {
      expect(showButton().querySelector('kbd')?.textContent?.trim()).toBe('Ctrl ↵');
      expect(showButton().getAttribute('aria-keyshortcuts')).toBe('Control+Enter');
    });

    it('keeps the shortcut out of the button name', () => {
      expect(showButton().querySelector('kbd')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('shows ⌘ ↵ on Apple systems', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [Home],
        providers: [{ provide: IS_APPLE_PLATFORM, useValue: true }],
      }).compileComponents();
      fixture = TestBed.createComponent(Home);
      await fixture.whenStable();

      expect(showButton().querySelector('kbd')?.textContent?.trim()).toBe('⌘ ↵');
      expect(showButton().getAttribute('aria-keyshortcuts')).toBe('Meta+Enter');
    });

    it.each([{ ctrlKey: true }, { metaKey: true }])(
      'opens the graph from the field with %o',
      async (modifier) => {
        state.source.set(validYaml);
        await settleUntil(() => state.state().status === 'ready');
        const submits = trackSubmits();

        const event = press(textarea(), modifier);
        await settleUntil(() => submits.count > 0);

        expect(submits.count).toBe(1);
        expect(event.defaultPrevented).toBe(true);
      }
    );

    it('explains an empty field like a click does', async () => {
      press(textarea(), { ctrlKey: true });
      await settleUntil(() => query('[data-testid="empty-hint"]') !== null);

      expect(announcement()).toContain('Paste a compose file first');
    });

    it('ignores Enter without a modifier', async () => {
      const event = press(textarea(), {});
      await fixture.whenStable();

      expect(event.defaultPrevented).toBe(false);
      expect(query('.feedback')).toBeNull();
    });
  });
});
