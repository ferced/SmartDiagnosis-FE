import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, deleteUser } from 'src/api/userService';

const UserListView = () => {
  const [users, setUsers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userList = await getUsers();
        setUsers(userList);
      } catch (err) {
        console.error('Error al obtener usuarios:', err.message);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (username: string) => {
    try {
      await deleteUser(username);
      setUsers(users.filter((user) => user.username !== username));
      alert('Usuario eliminado con éxito');
    } catch (err) {
      alert('Error al eliminar usuario: ' + err.message);
    }
  };

  return (
    <div>
      <h1>Listado de Usuarios</h1>
      <button onClick={() => navigate('/dashboard/user/new')}>Crear Usuario</button>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <button onClick={() => navigate(`/dashboard/user/edit/${user.username}`)}>
                  Editar
                </button>
                <button onClick={() => handleDelete(user.username)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserListView;
