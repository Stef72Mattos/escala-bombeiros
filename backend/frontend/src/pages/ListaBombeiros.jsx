import { useEffect, useState } from "react";

function ListaBombeiros() {
  const [bombeiros, setBombeiros] = useState([]);

  useEffect(() => {
    buscarBombeiros();
  }, []);

  async function buscarBombeiros() {
    try {
      const resposta = await fetch(
        "http://localhost:3000/bombeiros"
      );

      const dados = await resposta.json();

      setBombeiros(dados);
    } catch (erro) {
      console.log(erro);
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Lista de Bombeiros</h1>

      <table
        style={{
          margin: "0 auto",
          borderCollapse: "collapse",
          width: "80%"
        }}
      >
        <thead>
          <tr>
            <th>Matrícula</th>
            <th>Nome</th>
            <th>Telefone</th>
          </tr>
        </thead>

        <tbody>
          {bombeiros.map((bombeiro) => (
            <tr key={bombeiro.id}>
              <td>{bombeiro.matricula}</td>
              <td>{bombeiro.nomeCompleto}</td>
              <td>{bombeiro.telefone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ListaBombeiros;