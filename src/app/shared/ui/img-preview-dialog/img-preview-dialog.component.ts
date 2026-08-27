import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SafeUrl } from '@angular/platform-browser';
import { NgOptimizedImage } from '@angular/common';
import { SharedIconModule } from '../mat-icon';

export interface ImgPreviewData {
  title?: string;
  imageSrc: string | SafeUrl;
}

@Component({
  selector: 'app-img-preview-dialog',
  imports: [MatDialogModule, MatButtonModule, SharedIconModule, MatTooltipModule, NgOptimizedImage],
  templateUrl: './img-preview-dialog.component.html',
  host: {
    class: 'flex flex-col w-full h-full overflow-hidden rounded-xl  backdrop-blur',
  },
})
export class ImgPreviewDialogComponent {
  readonly data = inject<ImgPreviewData>(MAT_DIALOG_DATA);
  #startPan = { x: 0, y: 0 };
  // State
  readonly scale = signal(1);
  readonly rotation = signal(0);
  readonly panning = signal(false);
  readonly position = signal({ x: 0, y: 0 });
  readonly scalePercentage = computed(() => (this.scale() * 100).toFixed(0));
  readonly transformStyle = computed(
    () =>
      `translate(${this.position().x}px, ${this.position().y}px) scale(${this.scale()}) rotate(${this.rotation()}deg)`,
  );

  protected zoomIn = () => this.scale.update((s) => Math.min(s + 0.25, 4));
  protected zoomOut = () => this.scale.update((s) => Math.max(s - 0.25, 0.5));
  protected rotate = () => this.rotation.update((r) => r + 90);
  protected stopPanning = () => this.panning.set(false);
  protected reset = () => {
    this.scale.set(1);
    this.rotation.set(0);
    this.position.set({ x: 0, y: 0 });
  };

  protected onWheel(event: WheelEvent) {
    event.preventDefault();
    if (event.deltaY < 0) this.zoomIn();
    else this.zoomOut();
  }

  protected startPanning(event: MouseEvent) {
    if (this.scale() > 1) {
      this.panning.set(true);
      this.#startPan = {
        x: event.clientX - this.position().x,
        y: event.clientY - this.position().y,
      };
    }
  }

  protected pan(event: MouseEvent) {
    if (this.panning()) {
      event.preventDefault();
      this.position.set({
        x: event.clientX - this.#startPan.x,
        y: event.clientY - this.#startPan.y,
      });
    }
  }
}
