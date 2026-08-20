import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const navigate = useNavigate();

  async function realizarLogin(e) {
    e.preventDefault();

    const resposta = await fetch(
      "http://localhost:3000/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          senha
        })
      }
    );

    const dados = await resposta.json();

    if (resposta.ok) {
      localStorage.setItem(
        "usuario",
        JSON.stringify(dados)
      );

      navigate("/cadastro");
    } else {
      alert("Login inválido");
    }
  }

  return (
    <div>
      <h1>Escala Bombeiros</h1>

      <form onSubmit={realizarLogin}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <br /><br />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <br /><br />

        <button type="submit">
          Entrar
        </button>
      </form>
    </div>
  );
}

export default Login;