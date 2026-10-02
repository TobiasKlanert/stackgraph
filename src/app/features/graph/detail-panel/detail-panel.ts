import { Component, input } from '@angular/core';
import { ServiceNode, PortMapping, VolumeMount } from '../../../core/models/compose.model';
import { formatPort } from '../../../core/format/format-port';

@Component({
  selector: 'app-detail-panel',
  imports: [],
  templateUrl: './detail-panel.html',
  styleUrl: './detail-panel.scss',
})
export class DetailPanel {
  readonly service = input.required<ServiceNode>();

  formatPort(port: PortMapping): string {
    return formatPort(port);
  }

  formatVolume(volume: VolumeMount): string {
    if (!volume.source) {
      return `${volume.target} type: ${volume.type}`;
    }

    return `${volume.source}:${volume.target} type: ${volume.type}`;
  }
}
