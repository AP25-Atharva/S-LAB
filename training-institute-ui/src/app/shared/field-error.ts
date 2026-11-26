import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Field-level validation message under an input.
 * Shows once the field is touched; server-side messages (from the API) take priority.
 * Eager change detection: form-control state is not a signal, and Angular 22 components are OnPush
 * by default, so without this the message would not refresh when the parent form is submitted.
 */
@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (message; as msg) {
      <div class="invalid-feedback d-block">{{ msg }}</div>
    }
  `,
})
export class FieldError {
  @Input({ required: true }) control!: AbstractControl | null;
  @Input() label = 'This field';
  @Input() patternMessage = 'Invalid format';

  get message(): string | null {
    const c = this.control;
    if (!c || !c.errors || !(c.touched || c.dirty)) return null;
    const e = c.errors;
    if (e['server']) return e['server'];
    if (e['required']) return `${this.label} is required`;
    if (e['minlength']) return `${this.label} must be at least ${e['minlength'].requiredLength} characters`;
    if (e['maxlength']) return `${this.label} must be at most ${e['maxlength'].requiredLength} characters`;
    if (e['min']) return `${this.label} must be at least ${e['min'].min}`;
    if (e['max']) return `${this.label} must be at most ${e['max'].max}`;
    if (e['email']) return 'Enter a valid email address';
    if (e['pattern']) return this.patternMessage;
    if (e['futureDate']) return `${this.label} cannot be in the future`;
    if (e['dateOrder']) return 'End date must be on or after the start date';
    return `${this.label} is invalid`;
  }
}
