import { useState } from "react";

function CadastroUsuarios() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState("BOMBEIRO");

  async function cadastrar(e) {
    e.preventDefault();

    const resposta = await fetch(
      "http://localhost:3000/usuarios",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          senhaHash: senha,
          role
        })
      }
    );

    if (resposta.ok) {
      alert("Usuário cadastrado com sucesso!");

      setEmail("");
      setSenha("");
      setRole("BOMBEIRO");
    } else {
      alert("Erro ao cadastrar usuário");
    }
  }

  function sair() {
    localStorage.removeItem("usuario");
    window.location.href = "/";
  }

  return (
    <div>
      <h1>Cadastro de Usuários</h1>

      <form onSubmit={cadastrar}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
        />

        <br />
        <br />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="BOMBEIRO">
            BOMBEIRO
          </option>

          <option value="ESCALANTE">
            ESCALANTE
          </option>
        </select>

        <br />
        <br />

        <button
        type="submit"
        style={{
            width: "150px",
            height: "40px",
            fontSize: "16px",
            fontWeight: "bold"
        }}
    >
         Cadastrar
    </button>

        <br />
        <br />

        <button
          type="button"
          onClick={sair}
        >
          Sair
        </button>

      </form>
    </div>
  );
}

export default CadastroUsuarios;