import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusPanel } from './status-panel';
import { ParseState } from '../../core/state/compose-state';

const readyState: ParseState = {
  status: 'ready',
  model: { services: [], networks: [], volumes: [] },
  graph: { id: 'root' },
};

const errorState: ParseState = {
  status: 'error',
  errors: [
    { message: 'Invalid YAML syntax', line: 4 },
    { message: 'Service "app" is not a valid object.', path: 'services.app' },
  ],
};

describe('StatusPanel', () => {
  let fixture: ComponentFixture<StatusPanel>;

  function text(): string {
    return fixture.nativeElement.textContent?.trim() ?? '';
  }

  async function render(status: ParseState): Promise<void> {
    fixture.componentRef.setInput('status', status);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusPanel] }).compileComponents();
    fixture = TestBed.createComponent(StatusPanel);
  });

  it('should create', async () => {
    await render({ status: 'empty' });

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders nothing while the input is empty', async () => {
    await render({ status: 'empty' });

    expect(text()).toBe('');
  });

  it('renders nothing once a graph is ready', async () => {
    await render(readyState);

    expect(text()).toBe('');
  });

  it('announces a pending update', async () => {
    await render({ status: 'pending' });

    expect(text()).toContain('Updating');
  });

  it('lists every error message', async () => {
    await render(errorState);

    expect(text()).toContain('Invalid YAML syntax');
    expect(text()).toContain('is not a valid object');
  });

  it('shows the line only when the error carries one', async () => {
    await render({ status: 'error', errors: [{ message: 'Invalid YAML syntax', line: 4 }] });

    expect(text()).toContain('Line: 4');
  });

  it('omits the line when the error carries none', async () => {
    await render({ status: 'error', errors: [{ message: 'No services found.' }] });

    expect(text()).not.toContain('Line');
  });
});
