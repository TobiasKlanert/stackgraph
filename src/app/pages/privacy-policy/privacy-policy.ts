import { Component } from '@angular/core';
import { phoneUri, siteOperator } from '../../core/config/site-operator';
import { themeStorageKey } from '../../core/theme/theme';

/**
 * Datenschutzerklärung. German, like the imprint.
 *
 * The text describes what this deployment actually does: hosting, server
 * logs, browser storage. The operator's data and the storage key come from
 * code, so they cannot drift; the rest is prose. Self-hosting StackGraph?
 * Rewrite the hosting and e-mail sections for your own setup.
 */
@Component({
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  protected readonly operator = siteOperator;
  protected readonly phoneHref = phoneUri(siteOperator.phone);
  protected readonly emailHref = `mailto:${siteOperator.email}`;
  protected readonly themeStorageKey = themeStorageKey;
}
