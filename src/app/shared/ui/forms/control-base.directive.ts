import { Directive, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { InputAppearance, SubscriptSizing } from './input.models';

@Directive()
export abstract class BaseFormControl<T> {
  readonly formField = input.required<FieldTree<T>>();
  readonly label = input.required<string>();
  readonly appearance = input<InputAppearance>('outline');
  readonly subscriptSizing = input<SubscriptSizing>('fixed');
  readonly placeholder = input<string>('');

  protected readonly valueState = computed(() => this.formField()());
  protected readonly invalid = computed(() => this.valueState().invalid());
  protected readonly touched = computed(() => this.valueState().touched());
  protected readonly dirty = computed(() => this.valueState().dirty());
  protected readonly showError = computed(() => this.invalid() && (this.touched() || this.dirty()));
  protected readonly errorMessage = computed(() => this.valueState().errors()[0]?.message);
}
