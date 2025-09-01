import { Helmet } from 'react-helmet-async';

import { UserEditView } from 'src/sections/user-management/view';

// ----------------------------------------------------------------------

export default function UserEditPage() {
  return (
    <>
      <Helmet>
        <title>Edit User - SmartDiagnosis</title>
      </Helmet>

      <UserEditView />
    </>
  );
}