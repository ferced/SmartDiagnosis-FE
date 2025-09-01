import { Helmet } from 'react-helmet-async';

import { RoleBasedGuard } from 'src/auth/guard';

import { UserListView } from 'src/sections/user-management/view';

// ----------------------------------------------------------------------

export default function UserListPage() {
  return (
    <>
      <Helmet>
        <title>User Management - SmartDiagnosis</title>
      </Helmet>

      <RoleBasedGuard hasContent roles={['admin', 'manager']}>
        <UserListView />
      </RoleBasedGuard>
    </>
  );
}