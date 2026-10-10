import { Component } from '@angular/core';
import { architectureLayers } from './architecture-layers';

/** The four layers of StackGraph and the direction of their dependencies. */
@Component({
  selector: 'app-architecture-diagram',
  templateUrl: './architecture-diagram.html',
  styleUrl: './architecture-diagram.scss',
})
export class ArchitectureDiagram {
  protected readonly layers = architectureLayers;
}
