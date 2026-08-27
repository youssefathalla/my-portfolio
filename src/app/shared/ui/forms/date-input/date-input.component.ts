import { Component, input } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormField } from '@angular/forms/signals';
import { SharedIconModule } from '@shared/ui/mat-icon';
import { BaseFormControl } from '../base-form-control.directive';

@Component({
  selector: 'app-date-input',
  imports: [MatFormFieldModule, MatInputModule, MatDatepickerModule, FormField, SharedIconModule],
  host: { class: 'block w-full' },
  template: `
    <mat-form-field [appearance]="appearance()" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      @if (icon()) {
        <mat-icon matPrefix [name]="icon()!" />
      }
      <input
        matInput
        [matDatepicker]="picker"
        [formField]="formField()"
        [min]="min()"
        [max]="max()"
        [placeholder]="placeholder()"
      />
      <mat-datepicker-toggle matIconSuffix [for]="picker" />
      <mat-datepicker #picker />

      @if (showError()) {
        <mat-error>{{ errorMessage() }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class DateInputComponent extends BaseFormControl<Date | string | null | undefined> {
  readonly icon = input<string | null>(null);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
}
