import { useState } from "react";

function CadastroBombeiros() {
  const [usuarioId, setUsuarioId] = useState("");
  const [matricula, setMatricula] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");

  async function cadastrar(e) {
    e.preventDefault();

    const resposta = await fetch(
      "http://localhost:3000/bombeiros",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuarioId,
          matricula,
          nomeCompleto,
          telefone,
          dataAdmissao
        })
      }
    );

    if (resposta.ok) {
      alert("Bombeiro cadastrado com sucesso!");

      setUsuarioId("");
      setMatricula("");
      setNomeCompleto("");
      setTelefone("");
      setDataAdmissao("");
    } else {
      alert("Erro ao cadastrar bombeiro");
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Cadastro de Bombeiros</h1>

      <form onSubmit={cadastrar}>
        <input
          placeholder="ID do usuário"
          value={usuarioId}
          onChange={(e) => setUsuarioId(e.target.value)}
        />

        <br /><br />

        <input
          placeholder="Matrícula"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
        />

        <br /><br />

        <input
          placeholder="Nome completo"
          value={nomeCompleto}
          onChange={(e) => setNomeCompleto(e.target.value)}
        />

        <br /><br />

        <input
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        <br /><br />

        <input
          type="date"
          value={dataAdmissao}
          onChange={(e) => setDataAdmissao(e.target.value)}
        />

        <br /><br />

        <button type="submit">
          Cadastrar Bombeiro
        </button>
      </form>
    </div>
  );
}

export default CadastroBombeiros;