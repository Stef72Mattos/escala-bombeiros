import { useEffect, useState } from "react";

function CadastroAtestados() {
  const [bombeiros, setBombeiros] = useState([]);
  const [bombeiroId, setBombeiroId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/bombeiros")
      .then((resposta) => resposta.json())
      .then(setBombeiros)
      .catch(() => alert("Não foi possível buscar os bombeiros"));
  }, []);

  function converterParaIso(data) {
    const partes = data.split("/");
    if (partes.length !== 3) return null;
    const [dia, mes, ano] = partes;
    if (!/^\d{2}$/.test(dia) || !/^\d{2}$/.test(mes) || !/^\d{4}$/.test(ano)) return null;
    return `${ano}-${mes}-${dia}`;
  }

  async function cadastrar(evento) {
    evento.preventDefault();
    const inicioIso = converterParaIso(dataInicio);
    const fimIso = converterParaIso(dataFim);

    if (!inicioIso || !fimIso) {
      alert("Informe as datas no formato DD/MM/AAAA.");
      return;
    }

    const resposta = await fetch("http://localhost:3000/atestados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bombeiroId, dataInicio: inicioIso, dataFim: fimIso, observacao })
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      alert(dados.erro || "Erro ao cadastrar atestado");
      return;
    }

    alert("Atestado cadastrado com sucesso!");
    setBombeiroId("");
    setDataInicio("");
    setDataFim("");
    setObservacao("");
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Cadastro de Atestados</h1>
      <form onSubmit={cadastrar}>
        <select value={bombeiroId} onChange={(e) => setBombeiroId(e.target.value)} required>
          <option value="">Selecione um bombeiro</option>
          {bombeiros.map((bombeiro) => <option key={bombeiro.id} value={bombeiro.id}>{bombeiro.nomeCompleto} — {bombeiro.matricula}</option>)}
        </select><br /><br />
        <input placeholder="Data de início (DD/MM/AAAA)" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required /><br /><br />
        <input placeholder="Data de fim (DD/MM/AAAA)" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required /><br /><br />
        <textarea placeholder="Observação (opcional)" value={observacao} onChange={(e) => setObservacao(e.target.value)} /><br /><br />
        <button type="submit">Cadastrar atestado</button>
      </form>
    </div>
  );
}

export default CadastroAtestados;
