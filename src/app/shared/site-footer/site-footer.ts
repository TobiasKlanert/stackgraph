import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { externalLinks } from '../../core/config/external-links';

/** Default footer text; the start page replaces it with the portfolio credit. */
export const privacyNote = 'Runs in your browser. Nothing is uploaded.';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  /** Left-hand text. */
  readonly tagline = input(privacyNote);

  /**
   * Only Impressum and Datenschutz, without tagline and the other links.
   * For views that need the height, like the split view on a phone: the
   * legal links stay one tap away there, the rest is on every other page.
   */
  readonly legalOnly = input(false);

  protected readonly links = externalLinks;
}
