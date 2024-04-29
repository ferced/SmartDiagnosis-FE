import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import PatientForm from './patient-form-view';

// ----------------------------------------------------------------------

export default function ProductCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Ask for a diagnosis"
        links={[
          {
            name: 'Diagnosis',
            href: paths.dashboard.product.root,
          },
          { name: 'New Diagnosis' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <PatientForm />
    </Container>
  );
}
