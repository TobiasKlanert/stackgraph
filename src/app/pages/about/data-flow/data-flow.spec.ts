import { TestBed } from '@angular/core/testing';
import * as composeToElk from '../../../core/layout/compose-to-elk';
import * as yamlParser from '../../../core/parser/yaml-parser';
import { DataFlow } from './data-flow';

describe('DataFlow', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(DataFlow);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('shows the stations in pipeline order', () => {
    const types = Array.from(el.querySelectorAll('.station .type')).map((c) => c.textContent);

    expect(types).toEqual(['string', 'ComposeModel', 'PositionedGraph', 'SVG']);
  });

  it('names only functions that exist in the code', () => {
    const exports: Record<string, unknown> = { ...yamlParser, ...composeToElk };
    const names = Array.from(el.querySelectorAll('.by code')).map((c) => c.textContent ?? '');

    expect(names).toEqual(['parseCompose', 'toElkGraph']);
    for (const name of names) {
      expect(exports, name).toHaveProperty(name);
    }
  });

  it('is a figure named by its caption', () => {
    expect(el.querySelector('figure figcaption')?.textContent).toContain('Data flow');
  });
});
