import { Component, input, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InputMode } from '../input.models';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { BaseFormControl } from '../control-base.directive';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-password-input',
  imports: [MatFormFieldModule, MatInputModule, FormField, SharedIconModule, MatButtonModule],
  host: { class: 'block w-full' },
  template: `
    <mat-form-field [appearance]="appearance()" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      @if (icon()) {
        <mat-icon matPrefix [name]="icon()!" />
      }
      <input
        matInput
        [formField]="formField()"
        [type]="hide() ? 'password' : 'text'"
        [inputMode]="inputMode()"
        [placeholder]="placeholder()"
      />
      <button
        matSuffix
        matIconButton
        (click)="clickEvent($event)"
        type="button"
        [attr.aria-label]="hide() ? 'Show password' : 'Hide password'"
        [attr.aria-pressed]="!hide()"
      >
        <mat-icon [name]="hide() ? 'visibility' : 'visibility_off'" />
      </button>
      @if (showError()) {
        <mat-error>{{ errorMessage() }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class PasswordInputComponent extends BaseFormControl<string | number> {
  readonly type = input<'password' | 'text'>('password');
  readonly inputMode = input<InputMode>('text');
  readonly icon = input<string | null>(null);
  readonly hide = signal(true);
  protected clickEvent(event: Event) {
    this.hide.set(!this.hide());
    event.stopPropagation();
  }
}
