/** A postal address as German law asks for it: one that can receive mail. */
export interface PostalAddress {
  /** Street and house number. */
  readonly street: string;
  /** Kept as a string: German postal codes can start with 0. */
  readonly postalCode: string;
  readonly city: string;
  readonly country: string;
}

/**
 * The person responsible for this StackGraph instance, as named in the
 * imprint and the privacy policy.
 *
 * Self-hosting StackGraph? Replace these values with your own. This file is
 * the only place that holds them.
 */
export interface SiteOperator {
  readonly name: string;
  readonly address: PostalAddress;
  readonly email: string;
  /** International format with spaces, e.g. "+49 151 2345678". */
  readonly phone: string;
}

export const siteOperator: SiteOperator = {
  name: 'Tobias Klanert',
  address: {
    street: 'Carl-Christian-Agthe-Str. 12',
    postalCode: '06333',
    city: 'Hettstedt',
    country: 'Deutschland',
  },
  email: 'kontakt@tobias-klanert.de',
  phone: '+49 3476 8479321',
};

/**
 * `tel:` URI for a number written as in `SiteOperator.phone`. Keeps the
 * leading "+" and the digits; spaces and other separators are only for
 * reading.
 */
export function phoneUri(phone: string): string {
  return `tel:${phone.replace(/[^+\d]/g, '')}`;
}
