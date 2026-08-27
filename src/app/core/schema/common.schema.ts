import * as v from 'valibot';

export const emailError = 'Please enter a valid email address';
export const emailSchema = v.optional(
  v.pipe(v.string(), v.trim(), v.nonEmpty('Email is required'), v.email(emailError)),
  '',
);
export const passwordSchema = v.optional(
  v.pipe(
    v.string(),
    v.nonEmpty('Password is required'),
    v.minLength(8, 'Password must be at least 8 characters'),
  ),
  '',
);
export const minLengthError = (min: number) => `Minimum length is ${min} characters`;
export const maxLengthError = (max: number) => `Maximum length is ${max} characters`;
export const requiredString = (errMsg: string, min = 3, max = 15) =>
  v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.nonEmpty(errMsg),
      v.minLength(min, minLengthError(min)),
      v.maxLength(max, maxLengthError(max)),
    ),
    '',
  );
export const phoneSchema = v.optional(
  v.pipe(
    v.string('Phone number must be a string.'),
    v.trim(),
    v.nonEmpty('Phone number is required'),
    v.regex(/^[+]?[0-9\s\-()]+$/, 'Please enter a valid phone number'),
    v.minLength(8, minLengthError(8)),
    v.maxLength(20, maxLengthError(20)),
  ),
  '',
);

export const futureDateSchema = v.nonNullish(
  v.pipe(
    v.date('Invalid date format'),
    v.check((val) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(val);
      inputDate.setHours(0, 0, 0, 0);
      return inputDate >= today;
    }, 'Date cannot be in the past'),
  ),
  'Please select a preferred date',
);
