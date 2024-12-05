import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, updateUser } from 'src/api/userService';

const EditUser = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser(id!);
        setUser(userData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleUpdate = async () => {
    try {
      await updateUser(id!, user);
      alert('Usuario actualizado con éxito');
    } catch (err) {
      alert('Error al actualizar usuario: ' + err.message);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Editar Usuario</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleUpdate();
        }}
      >
        <label>
          Nombre:
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </label>
        <button type="submit">Actualizar</button>
      </form>
    </div>
  );
};

export default EditUser;
