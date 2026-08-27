import { Component, signal } from '@angular/core';
import { PlaygroundComponent } from '@layout/playground/playground.component';

@Component({
  selector: 'app-root',
  imports: [PlaygroundComponent],
  template: '<app-playground />',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('angular-lab');
}
