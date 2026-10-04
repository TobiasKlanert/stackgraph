import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SiteHeader } from '../../shared/site-header/site-header';
import { SiteFooter } from '../../shared/site-footer/site-footer';
import { ThemeToggle } from '../../shared/theme-toggle/theme-toggle';

/** Frame for the text pages (About, Impressum, Datenschutz). */
@Component({
  selector: 'app-document-layout',
  imports: [RouterLink, RouterOutlet, SiteHeader, SiteFooter, ThemeToggle],
  templateUrl: './document-layout.html',
  styleUrl: './document-layout.scss',
})
export class DocumentLayout {}
