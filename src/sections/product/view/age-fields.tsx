import { useWatch, Controller, useFormContext } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';

import {
  MAX_AGE_DAYS,
  showsAgeDays,
  MAX_AGE_YEARS,
  MAX_AGE_MONTHS,
  showsAgeMonths,
} from './patient-age';

// ----------------------------------------------------------------------

type AgeNumberFieldProps = {
  name: string;
  label: string;
  max: number;
};

// Not RHFTextField: its number mode renders 0 as an empty field and turns an
// emptied field into 0, so a baby's age of 0 could not be typed and a cleared
// age would have been sent as a newborn. Here empty stays empty and 0 stays 0.
function AgeNumberField({ name, label, max }: AgeNumberFieldProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          fullWidth
          type="number"
          label={label}
          value={field.value ?? ''}
          onChange={(event) => {
            const { value } = event.target;
            field.onChange(value === '' ? undefined : Number(value));
          }}
          inputProps={{ min: 0, max, step: 1, inputMode: 'numeric' }}
          error={!!error}
          helperText={error?.message}
        />
      )}
    />
  );
}

// Age in whole years, plus months for children under 3 and days for babies
// under one year, which appear only when they apply. Next to them the years
// field reads "Years", so the three read as one age.
export default function AgeFields() {
  const age = useWatch({ name: 'age' });
  const withMonths = showsAgeMonths(age);

  return (
    <Stack direction="row" spacing={1}>
      <AgeNumberField name="age" label={withMonths ? 'Years' : 'Age'} max={MAX_AGE_YEARS} />
      {withMonths && <AgeNumberField name="ageMonths" label="Months" max={MAX_AGE_MONTHS} />}
      {showsAgeDays(age) && <AgeNumberField name="ageDays" label="Days" max={MAX_AGE_DAYS} />}
    </Stack>
  );
}
