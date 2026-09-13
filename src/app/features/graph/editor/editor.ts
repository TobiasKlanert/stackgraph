import { Component, inject } from '@angular/core';
import { ComposeState } from '../../../core/state/compose-state';

@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor {
  protected readonly state = inject(ComposeState);

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.state.source.set(target.value);
  }
}
