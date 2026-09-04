import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SharedIconModule } from '@shared/ui/mat-icon';

@Component({
  selector: 'app-buttons-tab',
  imports: [MatButtonModule, MatCheckboxModule, SharedIconModule],
  templateUrl: './buttons-tab.component.html',
})
export class ButtonsTabComponent {
  protected readonly buttonClicks = signal(0);

  protected incrementClicks(): void {
    this.buttonClicks.update((c) => c + 1);
  }
}
