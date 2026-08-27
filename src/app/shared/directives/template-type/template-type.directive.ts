import { Directive, input } from '@angular/core';

@Directive({ selector: 'ng-template[templateType]' })
export class TemplateTypeDirective<T> {
  readonly templateType = input<T>();

  static ngTemplateContextGuard<T>(
    _dir: TemplateTypeDirective<T>,
    _ctx: unknown,
  ): _ctx is { $implicit: T; row: T } {
    return true;
  }
}
