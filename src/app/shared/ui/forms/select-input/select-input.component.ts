import { Component, computed, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormField } from '@angular/forms/signals';
import { BaseFormControl } from '../control-base.directive';

@Component({
  selector: 'app-select-input',
  imports: [MatFormFieldModule, MatSelectModule, FormField],
  host: { class: 'block w-full' },
  template: `
    <mat-form-field [appearance]="appearance()" class="w-full">
      <mat-label>{{ label() }}</mat-label>
      <mat-select [formField]="$any(formField())" [multiple]="multiple()" [placeholder]="placeholder()">
        @for (opt of viewOptions(); track opt.value) {
          <mat-option [value]="opt.value">
            {{ opt.label }}
          </mat-option>
        }
      </mat-select>
      @if (showError()) {
        <mat-error>{{ errorMessage() }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class SelectInputComponent<T, V = T> extends BaseFormControl<V> {
  readonly options = input.required<readonly T[]>(); // Options are type T
  readonly multiple = input(false);

  // Configuration for handling objects or simple types
  readonly valueKey = input<keyof T>(); // If options are objects, which key is the value?
  readonly labelKey = input<keyof T>(); // If options are objects, which key is the label?

  // Translation prefix? If true, treats label as a key.
  readonly labelPrefix = input(''); // e.g. 'cities.'

  protected readonly viewOptions = computed(() => {
    const options = this.options();
    const valueKey = this.valueKey();
    const labelKey = this.labelKey();
    const prefix = this.labelPrefix();

    return options.map((opt) => {
      // 1. Resolve Value
      const value = valueKey ? opt[valueKey] : opt;

      // 2. Resolve Label
      const rawLabel = labelKey ? String(opt[labelKey]) : String(opt);
      const label = prefix ? `${prefix}.${rawLabel}` : rawLabel;

      return { value, label };
    });
  });
}
