import { Component } from '@angular/core';
import { phoneUri, siteOperator } from '../../core/config/site-operator';

/**
 * Impressum: who is responsible for this instance and how to reach them.
 * German, because German law requires it; the data comes from siteOperator.
 */
@Component({
  selector: 'app-imprint',
  templateUrl: './imprint.html',
  styleUrl: './imprint.scss',
})
export class Imprint {
  protected readonly operator = siteOperator;
  protected readonly phoneHref = phoneUri(siteOperator.phone);
  protected readonly emailHref = `mailto:${siteOperator.email}`;
}
