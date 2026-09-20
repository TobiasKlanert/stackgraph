import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { ComposeState } from '../../../core/state/compose-state';
import { sampleCompose } from '../../../core/samples/sample-compose';

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
    await TestBed.configureTestingModule({ imports: [Home] }).compileComponents();
    state = TestBed.inject(ComposeState);
    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('disables the button while nothing has been entered', () => {
    expect(showButton().disabled).toBe(true);
  });

  it('keeps the button disabled for invalid yaml', async () => {
    state.source.set(brokenYaml);
    await settleUntil(() => state.errors().length > 0);

    expect(showButton().disabled).toBe(true);
  });

  it('enables the button once the yaml is valid', async () => {
    state.source.set(validYaml);
    await settleUntil(() => !showButton().disabled);

    expect(showButton().disabled).toBe(false);
  });

  it('emits when the button is clicked', async () => {
    state.source.set(validYaml);
    await settleUntil(() => !showButton().disabled);

    let emitted = false;
    fixture.componentInstance.submitted.subscribe(() => (emitted = true));
    showButton().click();

    expect(emitted).toBe(true);
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
});
