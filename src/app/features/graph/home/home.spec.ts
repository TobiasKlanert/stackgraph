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

  async function settle(): Promise<void> {
    await fixture.whenStable(); // flush: observable emits
    await new Promise((resolve) => setTimeout(resolve, 400)); // debounce + ELK
    await fixture.whenStable(); // render the result
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
    await settle();

    expect(button().disabled).toBe(true);
  });

  it('enables the button once the yaml is valid', async () => {
    state.source.set(validYaml);
    await settle();

    expect(button().disabled).toBe(false);
  });

  it('emits when the button is clicked', async () => {
    state.source.set(validYaml);
    await settle();

    let emitted = false;
    fixture.componentInstance.submitted.subscribe(() => (emitted = true));
    button().click();

    expect(emitted).toBe(true);
  });
});
