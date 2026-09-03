const prisma = require("./prisma");
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    sistema: "Escala Bombeiros",
    status: "online"
  });
});

app.get("/bombeiros", async (req, res) => {
  try {
    const bombeiros = await prisma.bombeiro.findMany();

    res.json(bombeiros);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao buscar bombeiros"
    });
  }
});

app.get("/bombeiros/:id", async (req, res) => {
  try {
    const bombeiro = await prisma.bombeiro.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!bombeiro) {
      return res.status(404).json({
        erro: "Bombeiro não encontrado"
      });
    }

    res.json(bombeiro);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao buscar bombeiro"
    });
  }
});

app.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    res.json(usuarios);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao buscar usuários"
    });
  }
});

app.get("/usuarios/disponiveis-para-bombeiro", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: {
        role: "BOMBEIRO",
        ativo: true,
        bombeiro: null
      },
      select: {
        id: true,
        email: true
      }
    });

    res.json(usuarios);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao buscar usuários disponíveis"
    });
  }
});

app.post("/usuarios", async (req, res) => {
  try {
    const usuario = await prisma.usuario.create({
      data: {
        email: req.body.email,
        senhaHash: req.body.senhaHash,
        role: req.body.role || "BOMBEIRO",
        ativo: true
      }
    });

    res.status(201).json(usuario);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao criar usuário"
    });
  }
});

app.post("/bombeiros", async (req, res) => {
  try {
    const bombeiro = await prisma.bombeiro.create({
      data: {
        usuarioId: req.body.usuarioId,
        matricula: req.body.matricula,
        nomeCompleto: req.body.nomeCompleto,
        telefone: req.body.telefone,
        dataAdmissao: new Date(req.body.dataAdmissao)
      }
    });

    res.status(201).json(bombeiro);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao cadastrar bombeiro"
    });
  }
});

app.get("/atestados", async (req, res) => {
  try {
    const atestados = await prisma.atestado.findMany({
      include: {
        bombeiro: {
          select: { id: true, nomeCompleto: true, matricula: true }
        }
      },
      orderBy: { dataInicio: "asc" }
    });

    res.json(atestados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar atestados" });
  }
});

app.post("/atestados", async (req, res) => {
  try {
    const { bombeiroId, dataInicio, dataFim, observacao } = req.body;

    if (!bombeiroId || !dataInicio || !dataFim) {
      return res.status(400).json({
        erro: "Bombeiro, data de início e data de fim são obrigatórios"
      });
    }

    if (new Date(dataFim) < new Date(dataInicio)) {
      return res.status(400).json({
        erro: "A data final não pode ser anterior à data inicial"
      });
    }

    const atestado = await prisma.atestado.create({
      data: {
        bombeiroId,
        dataInicio: new Date(`${dataInicio}T00:00:00`),
        dataFim: new Date(`${dataFim}T23:59:59`),
        observacao: observacao || null
      }
    });

    res.status(201).json(atestado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao cadastrar atestado" });
  }
});
app.get("/ferias", async (req, res) => {
  try {
    const ferias = await prisma.ferias.findMany({
      include: {
        bombeiro: {
          select: { id: true, nomeCompleto: true, matricula: true }
        }
      },
      orderBy: { dataInicio: "asc" }
    });

    res.json(ferias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar férias" });
  }
});

app.post("/ferias", async (req, res) => {
  try {
    const { bombeiroId, dataInicio, dataFim, observacao } = req.body;

    if (!bombeiroId || !dataInicio || !dataFim) {
      return res.status(400).json({
        erro: "Bombeiro, data de início e data de fim são obrigatórios"
      });
    }

    if (new Date(dataFim) < new Date(dataInicio)) {
      return res.status(400).json({
        erro: "A data final não pode ser anterior à data inicial"
      });
    }

    const ferias = await prisma.ferias.create({
      data: {
        bombeiroId,
        dataInicio: new Date(`${dataInicio}T00:00:00`),
        dataFim: new Date(`${dataFim}T23:59:59`),
        observacao: observacao || null
      }
    });

    res.status(201).json(ferias);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao cadastrar férias" });
  }
});
app.get("/indisponibilidades", async (req, res) => {
  try {
    const indisponibilidades = await prisma.indisponibilidade.findMany({
      include: {
        bombeiro: {
          select: { id: true, nomeCompleto: true, matricula: true }
        },
        avaliadoPor: {
          select: { id: true, email: true }
        }
      },
      orderBy: { dataInicio: "asc" }
    });

    res.json(indisponibilidades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao buscar indisponibilidades" });
  }
});

app.post("/indisponibilidades", async (req, res) => {
  try {
    const { bombeiroId, dataInicio, dataFim, motivo, justificativa } = req.body;

    if (!bombeiroId || !dataInicio || !dataFim || !motivo || !justificativa) {
      return res.status(400).json({
        erro: "Bombeiro, período, motivo e justificativa são obrigatórios"
      });
    }

    if (new Date(dataFim) < new Date(dataInicio)) {
      return res.status(400).json({
        erro: "A data final não pode ser anterior à data inicial"
      });
    }

    const indisponibilidade = await prisma.indisponibilidade.create({
      data: {
        bombeiroId,
        dataInicio: new Date(`${dataInicio}T00:00:00`),
        dataFim: new Date(`${dataFim}T23:59:59`),
        motivo,
        justificativa
      }
    });

    res.status(201).json(indisponibilidade);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao cadastrar indisponibilidade" });
  }
});

app.patch("/indisponibilidades/:id/status", async (req, res) => {
  try {
    const { status, avaliadoPorId } = req.body;
    const statusPermitidos = ["APROVADA", "REJEITADA"];

    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({
        erro: "O status deve ser APROVADA ou REJEITADA"
      });
    }

    const indisponibilidade = await prisma.indisponibilidade.update({
      where: { id: req.params.id },
      data: {
        status,
        avaliadoPorId: avaliadoPorId || null
      }
    });

    res.json(indisponibilidade);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao avaliar indisponibilidade" });
  }
});

app.get("/escala/mensal", async (req, res) => {
  try {
    const hoje = new Date();
    const ano = Number(req.query.ano) || hoje.getFullYear();
    const mes = Number(req.query.mes) || hoje.getMonth() + 1;

    if (mes < 1 || mes > 12) {
      return res.status(400).json({ erro: "Mês deve estar entre 1 e 12" });
    }

    const inicioMes = new Date(ano, mes - 1, 1);
    const fimMes = new Date(ano, mes, 0, 23, 59, 59);
    const bombeiros = await prisma.bombeiro.findMany({
      where: { status: "ATIVO" },
      select: { id: true, nomeCompleto: true, matricula: true },
      orderBy: { nomeCompleto: "asc" }
    });
    const atestados = await prisma.atestado.findMany({
      where: {
        dataInicio: { lte: fimMes },
        dataFim: { gte: inicioMes }
      },
      select: { bombeiroId: true, dataInicio: true, dataFim: true }
    });


        const ferias = await prisma.ferias.findMany({
      where: {
        dataInicio: { lte: fimMes },
        dataFim: { gte: inicioMes }
      },
      select: { bombeiroId: true, dataInicio: true, dataFim: true }
    });

        const indisponibilidadesAprovadas =
      await prisma.indisponibilidade.findMany({
        where: {
          status: "APROVADA",
          dataInicio: { lte: fimMes },
          dataFim: { gte: inicioMes }
        },
        select: { bombeiroId: true, dataInicio: true, dataFim: true }
      });

    let proximoIndice = 0;
    const diasNoMes = new Date(ano, mes, 0).getDate();
    const plantoes = [];

    for (let dia = 1; dia <= diasNoMes; dia += 1) {
      const data = new Date(ano, mes - 1, dia);
      let selecionado = null;

      for (let tentativa = 0; tentativa < bombeiros.length; tentativa += 1) {
        const indice = (proximoIndice + tentativa) % bombeiros.length;
        const bombeiro = bombeiros[indice];
              const comAtestado = atestados.some((atestado) =>
          atestado.bombeiroId === bombeiro.id &&
          data >= new Date(atestado.dataInicio) &&
          data <= new Date(atestado.dataFim)
        );

        const emFerias = ferias.some((periodoFerias) =>
          periodoFerias.bombeiroId === bombeiro.id &&
          data >= new Date(periodoFerias.dataInicio) &&
          data <= new Date(periodoFerias.dataFim)
        );

                const comIndisponibilidadeAprovada =
          indisponibilidadesAprovadas.some((indisponibilidade) =>
            indisponibilidade.bombeiroId === bombeiro.id &&
            data >= new Date(indisponibilidade.dataInicio) &&
            data <= new Date(indisponibilidade.dataFim)
          );

        const indisponivel =
          comAtestado || emFerias || comIndisponibilidadeAprovada;

        if (!indisponivel) {

          selecionado = bombeiro;
          proximoIndice = (indice + 1) % bombeiros.length;
          break;
        }
      }

      plantoes.push({
        data: data.toISOString().slice(0, 10),
        bombeiro: selecionado,
        observacao: selecionado ? null : "Nenhum bombeiro disponível"
      });
    }

    res.json({ ano, mes, plantoes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao gerar escala mensal" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findFirst({
      where: {
        email,
        senhaHash: senha
      }
    });

    if (!usuario) {
      return res.status(401).json({
        erro: "Email ou senha inválidos"
      });
    }

    res.json({
      id: usuario.id,
      email: usuario.email,
      role: usuario.role,
      ativo: usuario.ativo
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Erro ao realizar login"
    });
  }
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Servidor rodando na porta 3000");
});
