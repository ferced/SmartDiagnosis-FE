// Patient age as the engine takes it: whole years (0 for a baby under one
// year), plus optional months and days for young children. "0 years" alone
// does not tell a newborn from an 11-month-old, and their differentials differ.
// The limits mirror the backend's validation.

export const MAX_AGE_YEARS = 130;
export const MAX_AGE_MONTHS = 11;
export const MAX_AGE_DAYS = 30;

const isWholeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value);

// Months are asked while pediatrics still reasons in months (under 3 years);
// days only under one year, where they separate a neonate from an infant.
export const showsAgeMonths = (age: unknown) => isWholeNumber(age) && age >= 0 && age < 3;

export const showsAgeDays = (age: unknown) => age === 0;

// Normalizes the age fields of a patient record before it goes to the API:
// drops months/days the form no longer shows (the clinician changed the
// years), and never turns a missing age into 0 — a missing age is left out so
// the backend rejects the request instead of reading it as a newborn.
export function normalizePatientAge<T extends Record<string, any>>(info: T) {
  const { age: rawAge, ageMonths, ageDays, ...rest } = info;
  const age = rawAge === '' || rawAge === null || rawAge === undefined ? NaN : Number(rawAge);

  return {
    ...rest,
    ...(isWholeNumber(age) && { age }),
    ...(showsAgeMonths(age) && isWholeNumber(ageMonths) && { ageMonths }),
    ...(showsAgeDays(age) && isWholeNumber(ageDays) && { ageDays }),
  };
}
