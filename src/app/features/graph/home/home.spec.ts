import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { ComposeState } from '../../../core/state/compose-state';

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

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button');
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
    expect(button().disabled).toBe(true);
  });

  it('keeps the button disabled for invalid yaml', async () => {
    state.source.set(brokenYaml);
    await settleUntil(() => state.errors().length > 0);

    expect(button().disabled).toBe(true);
  });

  it('enables the button once the yaml is valid', async () => {
    state.source.set(validYaml);
    await settleUntil(() => !button().disabled);

    expect(button().disabled).toBe(false);
  });

  it('emits when the button is clicked', async () => {
    state.source.set(validYaml);
    await settleUntil(() => !button().disabled);

    let emitted = false;
    fixture.componentInstance.submitted.subscribe(() => (emitted = true));
    button().click();

    expect(emitted).toBe(true);
  });
});
