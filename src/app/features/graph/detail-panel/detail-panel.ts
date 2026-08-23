import { Component, input } from '@angular/core';
import { ServiceNode, PortMapping, VolumeMount } from '../../../core/models/compose.model';

@Component({
  selector: 'app-detail-panel',
  imports: [],
  templateUrl: './detail-panel.html',
  styleUrl: './detail-panel.scss',
})
export class DetailPanel {
  readonly service = input.required<ServiceNode>();

  formatPort(port: PortMapping): string {
    if (!port.host) {
      return port.container;
    }

    if (!port.protocol) {
      return `${port.host}:${port.container}`;
    }

    return `${port.host}:${port.container}/${port.protocol}`;
  }

  formatVolume(volume: VolumeMount): string {
    if (!volume.source) {
      return `${volume.target} type: ${volume.type}`;
    }

    return `${volume.source}:${volume.target} type: ${volume.type}`;
  }
}
