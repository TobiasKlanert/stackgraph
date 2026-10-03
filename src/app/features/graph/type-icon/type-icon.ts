import { Component, input } from '@angular/core';

export type TypeIconKind = 'service' | 'network' | 'volume' | 'bind';

/**
 * Miniature of the graph shapes (rectangle, hexagon, cylinder) plus a folder
 * for bind mounts, so lists in the panels speak the graph's visual language.
 * Decorative only: the text next to it carries the meaning.
 */
@Component({
  selector: 'app-type-icon',
  templateUrl: './type-icon.html',
  styleUrl: './type-icon.scss',
  host: {
    'aria-hidden': 'true',
    // An attribute, not a class: a host class like "service" would also match
    // the parent's own `.service` rules through emulated encapsulation.
    '[attr.data-kind]': 'kind()',
  },
})
export class TypeIcon {
  readonly kind = input.required<TypeIconKind>();
}
