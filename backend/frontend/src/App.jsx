import { useState } from "react";

function App() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function fazerLogin() {
  try {
    const resposta = await fetch("http://localhost:3000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        senha,
      }),
    });

    const dados = await resposta.json();

    console.log("STATUS:", resposta.status);
    console.log("DADOS:", dados);

    setMensagem(JSON.stringify(dados));
  } catch (erro) {
    console.error(erro);
    setMensagem("Erro ao conectar");
  }
}
  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        textAlign: "center",
      }}
    >
      <h1>Escala de Bombeiros</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />
      <br />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
      />

      <br />
      <br />

      <button onClick={fazerLogin}>
        Entrar
      </button>

      <p>{mensagem}</p>
    </div>
  );
}

export default App;