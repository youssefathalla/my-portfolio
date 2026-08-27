import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BaseFormControl } from '../control-base.directive';
import { FormField } from '@angular/forms/signals';
import { SharedIconModule } from '@shared/ui/mat-icon';

@Component({
  selector: 'app-text-field-input',
  imports: [MatFormFieldModule, MatInputModule, CdkTextareaAutosize, FormField, SharedIconModule],
  host: { class: 'block w-full' },
  template: `
    <mat-form-field [appearance]="appearance()" [subscriptSizing]="subscriptSizing()" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      @if (icon()) {
        <mat-icon matPrefix [name]="icon()!" />
      }
      <textarea
        [formField]="formField()"
        matInput
        cdkTextareaAutosize
        #autosize="cdkTextareaAutosize"
        [cdkAutosizeMinRows]="minRows()"
        [cdkAutosizeMaxRows]="5"
        [placeholder]="placeholder()"
      ></textarea>
      @if (showError()) {
        <mat-error>{{ errorMessage() }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class TextFieldInputComponent extends BaseFormControl<string> {
  readonly minRows = input(2);
  readonly icon = input<string | null>(null);
}
