import { useEffect, useState } from "react";

function CadastroFerias() {
  const [bombeiros, setBombeiros] = useState([]);
  const [ferias, setFerias] = useState([]);
  const [bombeiroId, setBombeiroId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");

  async function carregarDados() {
    try {
      const [respostaBombeiros, respostaFerias] = await Promise.all([
        fetch("http://localhost:3000/bombeiros"),
        fetch("http://localhost:3000/ferias")
      ]);

      setBombeiros(await respostaBombeiros.json());
      setFerias(await respostaFerias.json());
    } catch {
      alert("Não foi possível carregar os dados de férias.");
    }
  }

  useEffect(() => {
    carregarDados();
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

  async function cadastrar(evento) {
    evento.preventDefault();

    const inicioIso = converterParaIso(dataInicio);
    const fimIso = converterParaIso(dataFim);

    if (!inicioIso || !fimIso) {
      alert("Informe as datas no formato DD/MM/AAAA.");
      return;
    }

    const resposta = await fetch("http://localhost:3000/ferias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bombeiroId,
        dataInicio: inicioIso,
        dataFim: fimIso,
        observacao
      })
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || "Erro ao cadastrar férias.");
      return;
    }

    alert("Férias cadastradas com sucesso!");
    setBombeiroId("");
    setDataInicio("");
    setDataFim("");
    setObservacao("");
    carregarDados();
  }

  return (
    <div>
      <h1>Gestão de Férias</h1>

      <form onSubmit={cadastrar}>
        <h2>Cadastrar férias</h2>

        <select
          value={bombeiroId}
          onChange={(evento) => setBombeiroId(evento.target.value)}
          required
        >
          <option value="">Selecione um bombeiro</option>
          {bombeiros.map((bombeiro) => (
            <option key={bombeiro.id} value={bombeiro.id}>
              {bombeiro.nomeCompleto} — {bombeiro.matricula}
            </option>
          ))}
        </select>

        <br /><br />

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

        <textarea
          placeholder="Observação (opcional)"
          value={observacao}
          onChange={(evento) => setObservacao(evento.target.value)}
        />

        <br /><br />

        <button type="submit">Cadastrar férias</button>
      </form>

      <h2 style={{ marginTop: "40px" }}>Férias cadastradas</h2>

      {ferias.length === 0 ? (
        <p>Nenhum período de férias cadastrado.</p>
      ) : (
        <table style={{ margin: "0 auto" }}>
          <thead>
            <tr>
              <th>Bombeiro</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Observação</th>
            </tr>
          </thead>
          <tbody>
            {ferias.map((periodo) => (
              <tr key={periodo.id}>
                <td>
                  {periodo.bombeiro.nomeCompleto} ({periodo.bombeiro.matricula})
                </td>
                <td>{formatarData(periodo.dataInicio)}</td>
                <td>{formatarData(periodo.dataFim)}</td>
                <td>{periodo.observacao || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CadastroFerias;