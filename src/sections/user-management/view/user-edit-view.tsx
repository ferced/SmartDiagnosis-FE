import { useState, useEffect } from 'react';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';

import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { HOST_API } from 'src/config-global';

import { IUserItem } from '../types';
import UserNewEditForm from '../user-new-edit-form';

// ----------------------------------------------------------------------

export default function UserEditView() {
  const params = useParams();
  const { id } = params;

  const [currentUser, setCurrentUser] = useState<IUserItem | null>(null);

  useEffect(() => {
    if (id) {
      fetchUser(id);
    }
  }, [id]);

  const fetchUser = async (username: string) => {
    try {
      const token = sessionStorage.getItem('accessToken');
      const response = await fetch(`${HOST_API}/user/${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <CustomBreadcrumbs
        heading="Edit user"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'User',
            href: paths.dashboard.user.list,
          },
          { name: currentUser?.displayName || currentUser?.username || '' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      {currentUser && <UserNewEditForm currentUser={currentUser} />}
    </Container>
  );
}