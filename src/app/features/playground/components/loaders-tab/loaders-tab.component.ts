import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { LoaderComponent } from '@shared/ui/loader/loader.component';
import { LoaderHeight } from '@shared/ui/loader/loader.model';

@Component({
  selector: 'app-loaders-tab',
  imports: [FormsModule, SharedIconModule, LoaderComponent],
  templateUrl: './loaders-tab.component.html',
})
export class LoadersTabComponent {
  protected readonly loaderDiameter = signal(60);
  protected readonly loaderHeight = signal<LoaderHeight>('20');
  protected readonly loaderMessage = signal('Processing design tokens...');
  protected readonly loaderSectionSpace = signal(false);
}
