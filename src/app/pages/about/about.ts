import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AboutHero } from './about-hero/about-hero';

/** A section of the page; `id` is the fragment the table of contents links to. */
export interface AboutSection {
  id: string;
  title: string;
}

/**
 * Sections in page order. The table of contents is built from this list;
 * the headings in the template must match it (checked by the spec).
 */
export const aboutSections: readonly AboutSection[] = [
  { id: 'why', title: 'Why I built it' },
  { id: 'constraints', title: 'Goals & constraints' },
  { id: 'how-it-works', title: 'How it works' },
  { id: 'architecture', title: 'Architecture' },
  { id: 'stack', title: 'Stack & patterns' },
  { id: 'decisions', title: 'Key decisions' },
  { id: 'accessibility', title: 'Accessibility' },
  { id: 'lessons', title: 'Lessons learned' },
  { id: 'whats-next', title: "What's next" },
];

/** Case study: how StackGraph works and why it is built the way it is. */
@Component({
  selector: 'app-about',
  imports: [RouterLink, AboutHero],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  protected readonly sections = aboutSections;
}
