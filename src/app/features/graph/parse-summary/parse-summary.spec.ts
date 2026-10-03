import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParseSummary } from './parse-summary';
import { ParseState } from '../../../core/state/compose-state';

const ready: ParseState = {
  status: 'ready',
  model: { services: [], networks: [], volumes: [] },
  graph: { id: 'root' },
  parseMs: 4.2,
};

function errors(n: number): ParseState {
  return {
    status: 'error',
    errors: Array.from({ length: n }, (_, i) => ({ message: `Problem ${i}` })),
  };
}

describe('ParseSummary', () => {
  let fixture: ComponentFixture<ParseSummary>;

  function text(selector?: string): string {
    const el: Element | null = selector
      ? fixture.nativeElement.querySelector(selector)
      : fixture.nativeElement;
    return el?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  async function render(status: ParseState): Promise<void> {
    fixture.componentRef.setInput('status', status);
    await fixture.whenStable();
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(ParseSummary);
  });

  it('confirms valid YAML with the parse time', async () => {
    await render(ready);

    expect(text()).toBe('Valid YAML · parsed in 4 ms');
  });

  it('counts errors and says the graph keeps the last valid version', async () => {
    await render(errors(1));
    expect(text()).toBe('1 error · The graph shows the last valid version');

    await render(errors(3));
    expect(text('.label')).toBe('3 errors');
  });

  it('shows nothing before the first result', async () => {
    await render({ status: 'empty' });

    expect(text()).toBe('');
  });

  it('announces the result, but not the timing', async () => {
    await render(ready);
    const region = fixture.nativeElement.querySelector('[role="status"]');

    expect(region?.textContent).toContain('Valid YAML');
    expect(region?.textContent).not.toContain('parsed in');
  });

  it('keeps the live region in the DOM across results', async () => {
    await render(ready);
    const region = fixture.nativeElement.querySelector('[role="status"]');
    await render(errors(1));

    expect(fixture.nativeElement.querySelector('[role="status"]')).toBe(region);
  });

  describe('while updating', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('updating', true);
      await render(ready);
    });

    it('says so instead of the last result, without the timing', () => {
      expect(text()).toBe('Updating…');
    });

    it('announces it in the same live region', () => {
      expect(text('[role="status"]')).toBe('Updating…');
    });

    it('returns to the result afterwards', async () => {
      fixture.componentRef.setInput('updating', false);
      await fixture.whenStable();

      expect(text()).toBe('Valid YAML · parsed in 4 ms');
    });
  });
});
