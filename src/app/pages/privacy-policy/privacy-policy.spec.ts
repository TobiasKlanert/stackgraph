import { TestBed } from '@angular/core/testing';
import { siteOperator } from '../../core/config/site-operator';
import { themeStorageKey } from '../../core/theme/theme';
import { PrivacyPolicy } from './privacy-policy';

describe('PrivacyPolicy', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [PrivacyPolicy] });
    const fixture = TestBed.createComponent(PrivacyPolicy);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('marks the page as German and the subtitle as English', () => {
    expect(el.querySelector('article')?.getAttribute('lang')).toBe('de');
    expect(el.querySelector('.subtitle')?.getAttribute('lang')).toBe('en');
  });

  it('names the operator with postal address and contact links', () => {
    const contact = el.querySelector('address')?.textContent ?? '';
    const { name, address } = siteOperator;

    for (const line of [
      name,
      address.street,
      `${address.postalCode} ${address.city}`,
      address.country,
    ]) {
      expect(contact).toContain(line);
    }
    expect(el.querySelector('address a[href^="tel:"]')?.textContent?.trim()).toBe(
      siteOperator.phone
    );
    expect(el.querySelector(`address a[href="mailto:${siteOperator.email}"]`)).not.toBeNull();
  });

  it('names the storage key the theme service actually uses', () => {
    const keys = Array.from(el.querySelectorAll('code')).map((c) => c.textContent?.trim());

    expect(keys).toContain(themeStorageKey);
  });

  it('shows the right to object as its own marked paragraph', () => {
    const objection = el.querySelector('.objection');

    expect(objection?.tagName).toBe('P');
    expect(objection?.querySelector('strong')?.textContent?.trim()).toBe('Widerspruchsrecht:');
    expect(objection?.textContent).toContain('Art. 21 DSGVO');
  });
});
