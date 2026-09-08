import { useEffect, useState } from "react";

function MinhasIndisponibilidades() {
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

  const [indisponibilidades, setIndisponibilidades] = useState([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [motivo, setMotivo] = useState("");
  const [justificativa, setJustificativa] = useState("");

  async function carregarIndisponibilidades() {
    if (!usuario?.bombeiroId) return;

    try {
      const resposta = await fetch(
        `http://localhost:3000/indisponibilidades?bombeiroId=${usuario.bombeiroId}`
      );

      setIndisponibilidades(await resposta.json());
    } catch {
      alert("Não foi possível carregar suas solicitações.");
    }
  }

  useEffect(() => {
    carregarIndisponibilidades();
  }, []);

  function converterParaIso(data) {
    const partes = data.split("/");
    if (partes.length !== 3) return null;

    const [dia, mes, ano] = partes;

    if (
      !/^\d{2}$/.test(dia) ||
      !/^\d{2}$/.test(mes) ||
      !/^\d{4}$/.test(ano)
    ) {
      return null;
    }

    return `${ano}-${mes}-${dia}`;
  }

  function formatarData(data) {
    const [ano, mes, dia] = data.slice(0, 10).split("-");
    return `${dia}/${mes}/${ano}`;
  }

  async function solicitar(evento) {
    evento.preventDefault();

    const inicioIso = converterParaIso(dataInicio);
    const fimIso = converterParaIso(dataFim);

    if (!inicioIso || !fimIso) {
      alert("Informe as datas no formato DD/MM/AAAA.");
      return;
    }

    const resposta = await fetch("http://localhost:3000/indisponibilidades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bombeiroId: usuario.bombeiroId,
        dataInicio: inicioIso,
        dataFim: fimIso,
        motivo,
        justificativa
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || "Erro ao registrar solicitação.");
      return;
    }

    alert("Solicitação enviada para avaliação do escalante.");
    setDataInicio("");
    setDataFim("");
    setMotivo("");
    setJustificativa("");
    carregarIndisponibilidades();
  }

  if (!usuario || usuario.role !== "BOMBEIRO") {
    return <h1>Esta tela é destinada aos bombeiros.</h1>;
  }

  return (
    <div>
      <h1>Minhas Indisponibilidades</h1>

      <form onSubmit={solicitar}>
        <h2>Nova solicitação</h2>

        <input
          placeholder="Data de início (DD/MM/AAAA)"
          value={dataInicio}
          onChange={(evento) => setDataInicio(evento.target.value)}
          required
        />

        <br /><br />

        <input
          placeholder="Data de fim (DD/MM/AAAA)"
          value={dataFim}
          onChange={(evento) => setDataFim(evento.target.value)}
          required
        />

        <br /><br />

        <input
          placeholder="Motivo"
          value={motivo}
          onChange={(evento) => setMotivo(evento.target.value)}
          required
        />

        <br /><br />

        <textarea
          placeholder="Justificativa"
          value={justificativa}
          onChange={(evento) => setJustificativa(evento.target.value)}
          required
        />

        <br /><br />

        <button type="submit">Enviar solicitação</button>
      </form>

      <h2 style={{ marginTop: "40px" }}>Minhas solicitações</h2>

      {indisponibilidades.length === 0 ? (
        <p>Você ainda não possui solicitações cadastradas.</p>
      ) : (
        <table style={{ margin: "0 auto" }}>
          <thead>
            <tr>
              <th>Início</th>
              <th>Fim</th>
              <th>Motivo</th>
              <th>Justificativa</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {indisponibilidades.map((indisponibilidade) => (
              <tr key={indisponibilidade.id}>
                <td>{formatarData(indisponibilidade.dataInicio)}</td>
                <td>{formatarData(indisponibilidade.dataFim)}</td>
                <td>{indisponibilidade.motivo}</td>
                <td>{indisponibilidade.justificativa}</td>
                <td>{indisponibilidade.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default MinhasIndisponibilidades;