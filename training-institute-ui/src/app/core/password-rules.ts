import { Validators } from '@angular/forms';

/** Same rule as the API (PasswordPolicy): 10-72 characters with at least one letter and one number. */
export const PASSWORD_VALIDATORS = [
  Validators.required,
  Validators.minLength(10),
  Validators.maxLength(72),
  Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)[\s\S]+$/),
];

export const PASSWORD_HINT = 'At least 10 characters, with a letter and a number. Avoid common passwords and your username.';
export const PASSWORD_PATTERN_MESSAGE = 'Password must contain at least one letter and one number';
