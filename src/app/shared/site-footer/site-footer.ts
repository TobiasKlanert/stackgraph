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

  protected readonly links = externalLinks;
}
