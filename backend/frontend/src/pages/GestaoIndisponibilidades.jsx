import { useEffect, useState } from "react";

function GestaoIndisponibilidades() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const [indisponibilidades, setIndisponibilidades] = useState([]);

  async function carregarIndisponibilidades() {
    try {
      const resposta = await fetch("http://localhost:3000/indisponibilidades");
      setIndisponibilidades(await resposta.json());
    } catch {
      alert("Não foi possível carregar as solicitações.");
    }
  }

  useEffect(() => {
    carregarIndisponibilidades();
  }, []);

  function formatarData(data) {
    const [ano, mes, dia] = data.slice(0, 10).split("-");
    return `${dia}/${mes}/${ano}`;
  }

  async function avaliar(id, status) {
    const resposta = await fetch(
      `http://localhost:3000/indisponibilidades/${id}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          avaliadoPorId: usuario.id
        })
      }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || "Não foi possível avaliar a solicitação.");
      return;
    }

    alert(`Solicitação ${status.toLowerCase()} com sucesso!`);
    carregarIndisponibilidades();
  }

  if (!usuario || usuario.role !== "ESCALANTE") {
    return <h1>Esta tela é destinada ao escalante.</h1>;
  }

  return (
    <div>
      <h1>Gestão de Indisponibilidades</h1>
      <p>Avalie as solicitações enviadas pelos bombeiros.</p>

      {indisponibilidades.length === 0 ? (
        <p>Nenhuma solicitação cadastrada.</p>
      ) : (
        <table style={{ margin: "30px auto" }}>
          <thead>
            <tr>
              <th>Bombeiro</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Motivo</th>
              <th>Justificativa</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {indisponibilidades.map((indisponibilidade) => (
              <tr key={indisponibilidade.id}>
                <td>
                  {indisponibilidade.bombeiro.nomeCompleto}
                  <br />
                  ({indisponibilidade.bombeiro.matricula})
                </td>
                <td>{formatarData(indisponibilidade.dataInicio)}</td>
                <td>{formatarData(indisponibilidade.dataFim)}</td>
                <td>{indisponibilidade.motivo}</td>
                <td>{indisponibilidade.justificativa}</td>
                <td>{indisponibilidade.status}</td>
                <td>
                  {indisponibilidade.status === "PENDENTE" ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          avaliar(indisponibilidade.id, "APROVADA")
                        }
                      >
                        Aprovar
                      </button>

                      <br /><br />

                      <button
                        type="button"
                        onClick={() =>
                          avaliar(indisponibilidade.id, "REJEITADA")
                        }
                      >
                        Rejeitar
                      </button>
                    </>
                  ) : (
                    "Avaliada"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default GestaoIndisponibilidades;