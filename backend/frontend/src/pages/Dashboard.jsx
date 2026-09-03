import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div style={{ textAlign: "center" }}>
      <h1>Sistema de Escalas dos Bombeiros</h1>

      <br />

      <Link to="/cadastro">
        <button>
          Cadastro de Usuários
        </button>
      </Link>

      <br /><br />

      <Link to="/usuarios">
        <button>
          Listar Usuários
        </button>
      </Link>

      <br /><br />

      <Link to="/bombeiros">
        <button>
          Cadastro de Bombeiros
        </button>
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

      <Link to="/escala">
        <button>
          Escala Mensal
        </button>
      </Link>

      <Link to="/lista-bombeiros">
        <button>
            Lista de Bombeiros
        </button>
    </Link>

    <br /><br />
    </div>
  );
}

export default Dashboard;
