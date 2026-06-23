import { Helmet } from 'react-helmet-async';

import { UserCreateView } from 'src/sections/user-management/view';

// ----------------------------------------------------------------------

export default function UserCreatePage() {
  return (
    <>
      <Helmet>
        <title>Create User - AI Professor</title>
      </Helmet>

      <UserCreateView />
    </>
  );
}