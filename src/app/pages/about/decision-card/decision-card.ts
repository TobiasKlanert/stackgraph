import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConstraintId, constraintTitles } from '../about-constraints';

/**
 * Frame of a key decision: number, title and the constraints it follows
 * from, linked to their rows. The body is projected, because the cards
 * differ in their blocks (problem or plan, options, measurements) and the
 * text contains inline code.
 */
@Component({
  selector: 'app-decision-card',
  imports: [RouterLink],
  templateUrl: './decision-card.html',
  styleUrl: './decision-card.scss',
})
export class DecisionCard {
  readonly index = input.required<number>();
  readonly heading = input.required<string>();
  readonly followsFrom = input.required<readonly ConstraintId[]>();

  protected readonly titles = constraintTitles;
}
