import { Component, signal } from '@angular/core';
import { ColorComponent } from '@layout/color/color.component';

@Component({
  selector: 'app-root',
  imports: [ColorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('angular-lab');
}
