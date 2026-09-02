import { useEffect, useState } from "react";

function CadastroBombeiros() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(true);

  const [usuarioId, setUsuarioId] = useState("");
  const [matricula, setMatricula] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataAdmissao, setDataAdmissao] = useState("");

  function converterParaIso(data) {
    const partes = data.split("/");
    if (partes.length !== 3) return null;
    const [dia, mes, ano] = partes;
    if (!/^\d{2}$/.test(dia) || !/^\d{2}$/.test(mes) || !/^\d{4}$/.test(ano)) return null;
    return `${ano}-${mes}-${dia}`;
  }

  useEffect(() => {
    buscarUsuariosDisponiveis();
  }, []);

  async function buscarUsuariosDisponiveis() {
    try {
      setCarregandoUsuarios(true);

      const resposta = await fetch(
        "http://localhost:3000/usuarios/disponiveis-para-bombeiro"
      );

      if (!resposta.ok) {
        throw new Error("Não foi possível buscar os usuários");
      }

      const dados = await resposta.json();

      setUsuarios(dados);
    } catch (erro) {
      console.error(erro);
      alert("Erro ao buscar usuários disponíveis");
    } finally {
      setCarregandoUsuarios(false);
    }
  }

  async function cadastrar(e) {
    e.preventDefault();
    const dataAdmissaoIso = converterParaIso(dataAdmissao);

    if (!dataAdmissaoIso) {
      alert("Informe a data de admissão no formato DD/MM/AAAA.");
      return;
    }

    try {
      const resposta = await fetch(
        "http://localhost:3000/bombeiros",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            usuarioId,
            matricula,
            nomeCompleto,
            telefone,
            dataAdmissao: dataAdmissaoIso
          })
        }
      );

      const dados = await resposta.json();

      if (resposta.ok) {
        alert("Bombeiro cadastrado com sucesso!");

        setUsuarioId("");
        setMatricula("");
        setNomeCompleto("");
        setTelefone("");
        setDataAdmissao("");

        buscarUsuariosDisponiveis();
      } else {
        alert(dados.erro || "Erro ao cadastrar bombeiro");
      }
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível conectar ao backend");
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Cadastro de Bombeiros</h1>

      <form onSubmit={cadastrar}>
        <label htmlFor="usuarioId">Usuário</label>

        <br />

        {carregandoUsuarios ? (
          <p>Carregando usuários disponíveis...</p>
        ) : usuarios.length === 0 ? (
          <p>Não há usuários bombeiros disponíveis para cadastro.</p>
        ) : (
          <select
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            required
          >
            <option value="">Selecione um usuário</option>

            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.email}
              </option>
            ))}
          </select>
        )}

        <br />
        <br />

        <input
          placeholder="Matrícula"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          required
        />

        <br />
        <br />

        <input
          placeholder="Nome completo"
          value={nomeCompleto}
          onChange={(e) => setNomeCompleto(e.target.value)}
          required
        />

        <br />
        <br />

        <input
          placeholder="Telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Data de admissão (DD/MM/AAAA)"
          value={dataAdmissao}
          onChange={(e) => setDataAdmissao(e.target.value)}
          required
        />

        <br />
        <br />

        <button
          type="submit"
          disabled={carregandoUsuarios || usuarios.length === 0}
        >
          Cadastrar Bombeiro
        </button>
      </form>
    </div>
  );
}

export default CadastroBombeiros;
