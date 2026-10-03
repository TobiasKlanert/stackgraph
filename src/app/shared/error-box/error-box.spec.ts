import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorBox, TextPosition } from './error-box';
import { ParseError } from '../../core/models/compose.model';

describe('ErrorBox', () => {
  let fixture: ComponentFixture<ErrorBox>;
  let jumps: TextPosition[];

  function text(selector: string, root: ParentNode = fixture.nativeElement): string {
    return root.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }

  function goToButton(): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector('button.go-to');
  }

  async function render(errors: ParseError[]): Promise<void> {
    fixture.componentRef.setInput('errors', errors);
    await fixture.whenStable();
  }

  beforeEach(() => {
    jumps = [];
    fixture = TestBed.createComponent(ErrorBox);
    fixture.componentInstance.goTo.subscribe((position) => jumps.push(position));
  });

  describe('syntax error', () => {
    beforeEach(async () => {
      await render([{ message: 'bad indentation of a mapping entry', line: 23, column: 4 }]);
    });

    it('names line and column in a heading', () => {
      expect(text('h3')).toBe('Invalid YAML on line 23, column 4');
    });

    it('shows the parser message as a sentence, with a fix hint', () => {
      expect(text('.message')).toBe('Bad indentation of a mapping entry.');
      expect(text('.hint')).toContain('must start in the same column');
    });

    it('jumps to the exact position', () => {
      expect(text('button.go-to')).toBe('Go to line 23');

      goToButton()?.click();

      expect(jumps).toEqual([{ line: 23, column: 4 }]);
    });
  });

  describe('structure error', () => {
    beforeEach(async () => {
      await render([{ message: 'Service "app" is not a valid object.', path: 'services.app' }]);
    });

    it('shows the path instead of a line, and no jump button', () => {
      expect(text('h3')).toBe('Invalid Compose file');
      expect(text('.path')).toBe('services.app');
      expect(goToButton()).toBeNull();
    });

    it('offers no hint it does not have', () => {
      expect(fixture.nativeElement.querySelector('.hint')).toBeNull();
    });
  });

  it('lists every error', async () => {
    await render([
      { message: 'Service "app" is not a valid object.', path: 'services.app' },
      { message: 'Service "db" is not a valid object.', path: 'services.db' },
    ]);

    expect(fixture.nativeElement.querySelectorAll('.error')).toHaveLength(2);
  });

  it('jumps to the first column when the parser gives none', async () => {
    await render([{ message: 'Invalid YAML syntax', line: 7 }]);
    goToButton()?.click();

    expect(text('h3')).toBe('Invalid YAML on line 7');
    expect(jumps).toEqual([{ line: 7, column: 1 }]);
  });
});
