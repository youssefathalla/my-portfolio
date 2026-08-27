import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { FormField } from '@angular/forms/signals';
import { DateInputType } from '../input.models';
import { BaseFormControl } from '../control-base.directive';

@Component({
  selector: 'app-timepicker',
  imports: [MatFormFieldModule, MatInputModule, MatTimepickerModule, FormField],
  template: `
    <mat-form-field [appearance]="appearance()" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      <input matInput [matTimepicker]="picker" [formField]="formField()" [placeholder]="placeholder()" />
      <mat-timepicker-toggle matIconSuffix [for]="picker" />
      <mat-timepicker #picker />

      @if (showError()) {
        <mat-error>{{ errorMessage() }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class TimepickerComponent extends BaseFormControl<DateInputType> {}
