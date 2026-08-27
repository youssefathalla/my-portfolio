import { Pipe, PipeTransform } from '@angular/core';

const GBP_FORMATTER = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

/**
 * Converts an integer pence value to a formatted GBP string.
 * Example: 1050 → "£10.50", 0 → "£0.00", 100 → "£1.00"
 */
@Pipe({ name: 'penceToPounds', pure: true })
export class PenceToPoundsPipe implements PipeTransform {
  transform(pence: number): string {
    return GBP_FORMATTER.format(pence / 100);
  }
}
