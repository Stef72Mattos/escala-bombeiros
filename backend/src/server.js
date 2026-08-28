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