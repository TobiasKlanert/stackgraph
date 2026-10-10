import { Component, input } from '@angular/core';

/**
 * One row of a data sheet on the About page: title (and optional tag) left,
 * text right. Used for the constraints and the accessibility points. The
 * text is projected as phrasing content into the component's own paragraph,
 * so inline code keeps the page's styles.
 *
 * The host can carry an id and tabindex="-1" to serve as a jump target.
 */
@Component({
  selector: 'app-spec-item',
  templateUrl: './spec-item.html',
  styleUrl: './spec-item.scss',
})
export class SpecItem {
  readonly heading = input.required<string>();
  /** Short label under the heading, e.g. a WCAG criterion. */
  readonly tag = input<string>();
}
