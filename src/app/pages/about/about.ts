import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { externalLinks, sourceAt } from '../../core/config/external-links';
import { AboutHero } from './about-hero/about-hero';
import { ArchitectureDiagram } from './architecture-diagram/architecture-diagram';
import { DataFlow } from './data-flow/data-flow';
import { DecisionCard } from './decision-card/decision-card';
import { SpecItem } from './spec-item/spec-item';

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

/**
 * Repository links for the "Where" column of the stack tables, at the
 * release the page describes. Folders end with a slash.
 */
const where = {
  parser: sourceAt('src/app/core/parser/'),
  layout: sourceAt('src/app/core/layout/'),
  relations: sourceAt('src/app/core/relations/'),
  format: sourceAt('src/app/core/format/'),
  zoomable: sourceAt('src/app/shared/directives/zoomable.ts'),
  composeState: sourceAt('src/app/core/state/compose-state.ts'),
  composeModel: sourceAt('src/app/core/models/compose.model.ts'),
  layoutModel: sourceAt('src/app/core/models/layout.model.ts'),
  graphPage: sourceAt('src/app/features/graph/graph-page/graph-page.ts'),
  theme: sourceAt('src/app/core/theme/theme.ts'),
  platform: sourceAt('src/app/core/platform/platform.ts'),
  shapes: sourceAt('src/app/features/graph/rendering/shapes/'),
  routes: sourceAt('src/app/app.routes.ts'),
  styles: sourceAt('src/styles/'),
  ci: sourceAt('.github/workflows/ci.yml'),
  dockerfile: sourceAt('Dockerfile'),
} as const;

/** Case study: how StackGraph works and why it is built the way it is. */
@Component({
  selector: 'app-about',
  imports: [RouterLink, AboutHero, SpecItem, DataFlow, ArchitectureDiagram, DecisionCard],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {
  protected readonly sections = aboutSections;
  protected readonly links = externalLinks;
  protected readonly where = where;
}
