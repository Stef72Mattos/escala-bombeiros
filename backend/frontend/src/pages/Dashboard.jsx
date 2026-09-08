import { Link } from "react-router-dom";

function Dashboard() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const ehBombeiro = usuario?.role === "BOMBEIRO";

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Sistema de Escalas dos Bombeiros</h1>

      {usuario && <p>Usuário logado: {usuario.email}</p>}

      <br />

      {ehBombeiro ? (
        <>
          <Link to="/minhas-indisponibilidades">
            <button>Minhas Indisponibilidades</button>
          </Link>

          <br /><br />

          <Link to="/escala">
            <button>Escala Mensal</button>
          </Link>
        </>
      ) : (
        <>
          <Link to="/cadastro">
            <button>Cadastro de Usuários</button>
          </Link>

          <br /><br />

          <Link to="/usuarios">
            <button>Listar Usuários</button>
          </Link>

          <br /><br />

          <Link to="/bombeiros">
            <button>Cadastro de Bombeiros</button>
          </Link>

          <br /><br />

          <Link to="/atestados">
            <button>Cadastro de Atestados</button>
          </Link>

          <br /><br />

          <Link to="/ferias">
            <button>Gestão de Férias</button>
          </Link>

          <br /><br />

          <Link to="/gestao-indisponibilidades">
            <button>Gestão de Indisponibilidades</button>
          </Link>

          <br /><br />

          <Link to="/escala">
            <button>Escala Mensal</button>
          </Link>

          <br /><br />

          <Link to="/lista-bombeiros">
            <button>Lista de Bombeiros</button>
          </Link>
        </>
      )}
    </div>
  );
}

export default Dashboard;