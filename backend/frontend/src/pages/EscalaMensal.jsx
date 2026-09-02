import { useEffect, useState } from "react";

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

function formatarData(data) {
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

function EscalaMensal() {
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [plantoes, setPlantoes] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function buscarEscala() {
      try {
        setErro("");
        const resposta = await fetch(`http://localhost:3000/escala/mensal?ano=${ano}&mes=${mes}`);
        const dados = await resposta.json();

        if (!resposta.ok) throw new Error(dados.erro);
        setPlantoes(dados.plantoes);
      } catch (erroAtual) {
        setErro(erroAtual.message || "Não foi possível gerar a escala");
      }
    }

    buscarEscala();
  }, [ano, mes]);

  const primeiroDia = (new Date(ano, mes - 1, 1).getDay() + 6) % 7;
  const celulasVazias = Array.from({ length: primeiroDia }, (_, indice) => (
    <div key={`vazio-${indice}`} />
  ));
  const nomeMes = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  });

  return (
    <div className="calendar-page">
      <h1>Escala Mensal</h1>

      <label>
        Mês: {" "}
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, indice) => (
            <option key={indice + 1} value={indice + 1}>
              {new Date(ano, indice, 1).toLocaleDateString("pt-BR", { month: "long" })}
            </option>
          ))}
        </select>
      </label>{" "}
      <label>
        Ano: {" "}
        <input type="number" value={ano} onChange={(e) => setAno(Number(e.target.value))} min="2020" />
      </label>

      <h2 style={{ textTransform: "capitalize" }}>{nomeMes}</h2>
      {erro && <p style={{ color: "#b91c1c" }}>{erro}</p>}

      <div className="calendar-grid">
        {diasSemana.map((dia) => (
          <strong key={dia} className="calendar-weekday">{dia}</strong>
        ))}
        {celulasVazias}
        {plantoes.map((plantao) => (
          <article key={plantao.data} className="calendar-day">
            <strong>{formatarData(plantao.data)}</strong>
            {plantao.bombeiro ? (
              <p style={{ margin: "12px 0 0" }}>{plantao.bombeiro.nomeCompleto}<br /><small>Matrícula: {plantao.bombeiro.matricula}</small></p>
            ) : (
              <p className="unavailable">{plantao.observacao}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export default EscalaMensal;
