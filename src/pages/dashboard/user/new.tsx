import { useState } from 'react';
import { createUser } from 'src/api/userService';

const CreateUser = () => {
  const [user, setUser] = useState({ name: '', email: '' });

  const handleCreate = async () => {
    try {
      await createUser(user);
      alert('Usuario creado con éxito');
      setUser({ name: '', email: '' }); // Limpiar formulario
    } catch (err) {
      alert('Error al crear usuario: ' + err.message);
    }
  };

  return (
    <div>
      <h1>Crear Usuario</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreate();
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
        <button type="submit">Crear</button>
      </form>
    </div>
  );
};

export default CreateUser;
