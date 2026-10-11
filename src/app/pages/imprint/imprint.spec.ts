import { TestBed } from '@angular/core/testing';
import { siteOperator } from '../../core/config/site-operator';
import { Imprint } from './imprint';

describe('Imprint', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Imprint] });
    const fixture = TestBed.createComponent(Imprint);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('marks the page as German and the subtitle as English', () => {
    expect(el.querySelector('article')?.getAttribute('lang')).toBe('de');
    expect(el.querySelector('.subtitle')?.getAttribute('lang')).toBe('en');
  });

  it('names the operator with the full postal address', () => {
    const postal = el.querySelector('address')?.textContent ?? '';
    const { name, address } = siteOperator;

    for (const line of [
      name,
      address.street,
      `${address.postalCode} ${address.city}`,
      address.country,
    ]) {
      expect(postal).toContain(line);
    }
  });

  it('links the phone number and the e-mail address', () => {
    const phone = el.querySelector<HTMLAnchorElement>('a[href^="tel:"]');
    const email = el.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');

    expect(phone?.textContent?.trim()).toBe(siteOperator.phone);
    expect(email?.getAttribute('href')).toBe(`mailto:${siteOperator.email}`);
    expect(email?.textContent?.trim()).toBe(siteOperator.email);
  });
});
