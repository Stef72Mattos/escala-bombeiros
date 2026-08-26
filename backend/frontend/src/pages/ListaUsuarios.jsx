import { useEffect, useState } from "react";

function ListaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    buscarUsuarios();
  }, []);

  async function buscarUsuarios() {
    const resposta = await fetch(
      "http://localhost:3000/usuarios"
    );

    const dados = await resposta.json();

    setUsuarios(dados);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Usuários Cadastrados</h1>

      {usuarios.map((usuario) => (
        <div key={usuario.id}>
          {usuario.email} - {usuario.role}
        </div>
      ))}
    </div>
  );
}

export default ListaUsuarios;