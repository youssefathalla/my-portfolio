import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SharedIconModule } from '@shared/ui/mat-icon';

@Component({
  selector: 'app-textures-tab',
  imports: [MatButtonModule, SharedIconModule],
  templateUrl: './textures-tab.component.html',
  host: {
    class: 'block',
  },
})
export class TexturesTabComponent {
  protected readonly testClicks = signal(0);
  protected readonly lightMode = signal<'opposite' | 'single'>('opposite');
  protected readonly framerGrainOpacity = signal(0.35);
  protected readonly framerBlur = signal(0.6);

  protected incrementClicks(): void {
    this.testClicks.update((c) => c + 1);
  }

  protected setFramerGrain(opacity: number, blur = 0.6): void {
    this.framerGrainOpacity.set(opacity);
    this.framerBlur.set(blur);
  }

  protected toggleLightMode(): void {
    this.lightMode.update((mode) => (mode === 'opposite' ? 'single' : 'opposite'));
  }

  protected onSpotlightMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    target.style.setProperty('--mouse-x', `${x}px`);
    target.style.setProperty('--mouse-y', `${y}px`);
  }

  protected onCardSpotlightMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const oppX = rect.width - x;
    const oppY = rect.height - y;

    target.style.setProperty('--mouse-x', `${x}px`);
    target.style.setProperty('--mouse-y', `${y}px`);
    target.style.setProperty('--opp-x', `${oppX}px`);
    target.style.setProperty('--opp-y', `${oppY}px`);
  }
}
