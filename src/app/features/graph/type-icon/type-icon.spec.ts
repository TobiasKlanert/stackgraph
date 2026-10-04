import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TypeIcon, TypeIconKind } from './type-icon';

describe('TypeIcon', () => {
  let fixture: ComponentFixture<TypeIcon>;

  async function render(kind: TypeIconKind): Promise<HTMLElement> {
    fixture.componentRef.setInput('kind', kind);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(TypeIcon);
  });

  it('is hidden from assistive technology', async () => {
    const host = await render('service');

    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it.each<[TypeIconKind, string]>([
    ['service', 'rect'],
    ['network', 'polygon'],
    ['volume', 'path'],
    ['bind', 'path'],
  ])('draws the %s shape and exposes the kind for styling', async (kind, shape) => {
    const host = await render(kind);

    expect(host.dataset['kind']).toBe(kind);
    expect(host.querySelector(`svg ${shape}`)).not.toBeNull();
  });
});
