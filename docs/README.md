# Documentação Técnica — Escala Bombeiros

Índice da documentação do projeto. Esta pasta contém a especificação de análise ([DOCUMENTACAO.md](./DOCUMENTACAO.md)) e a arquitetura técnica detalhada para implementação.

---

## Análise e Requisitos

| Documento | Descrição |
|-----------|-----------|
| [DOCUMENTACAO.md](./DOCUMENTACAO.md) | Análise de sistemas: requisitos, casos de uso, regras de negócio e visão geral |

---

## Arquitetura Técnica

| # | Documento | Conteúdo |
|---|-----------|----------|
| 1 | [ESTRUTURA-FRONTEND.md](./ESTRUTURA-FRONTEND.md) | Estrutura de pastas do Frontend (Next.js App Router) |
| 2 | [ESTRUTURA-BACKEND.md](./ESTRUTURA-BACKEND.md) | Estrutura de pastas do Backend (NestJS) |
| 3 | [MODULOS.md](./MODULOS.md) | Módulos da aplicação, responsabilidades e dependências |
| 4 | [ENTIDADES.md](./ENTIDADES.md) | Entidades do banco de dados, campos e enums |
| 5 | [RELACIONAMENTOS.md](./RELACIONAMENTOS.md) | Relacionamentos entre entidades e cardinalidades |
| 6 | [ARQUITETURA.md](./ARQUITETURA.md) | Arquitetura da aplicação, camadas e integrações |

---

## Fluxos Operacionais

| # | Documento | Conteúdo |
|---|-----------|----------|
| 7 | [FLUXO-AUTENTICACAO-JWT.md](./FLUXO-AUTENTICACAO-JWT.md) | Fluxo de autenticação JWT (access + refresh token) |
| 8 | [FLUXO-GERACAO-ESCALAS.md](./FLUXO-GERACAO-ESCALAS.md) | Fluxo de geração automática de escalas |
| 9 | [FLUXO-SUBSTITUICOES.md](./FLUXO-SUBSTITUICOES.md) | Fluxo de substituições automáticas |
| 10 | [FLUXO-NOTIFICACOES.md](./FLUXO-NOTIFICACOES.md) | Fluxo de notificações in-app e e-mail |

---

## Stack Definida

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14+ (App Router) + TypeScript |
| Backend | NestJS + TypeScript |
| ORM | Prisma |
| Banco | PostgreSQL 16 |
| Cache/Fila | Redis + BullMQ |
| Auth | JWT (access + refresh) |

---

## Ordem de Leitura Recomendada

1. [ARQUITETURA.md](./ARQUITETURA.md) — visão geral do sistema
2. [MODULOS.md](./MODULOS.md) — fronteiras e responsabilidades
3. [ENTIDADES.md](./ENTIDADES.md) + [RELACIONAMENTOS.md](./RELACIONAMENTOS.md) — modelo de dados
4. [ESTRUTURA-FRONTEND.md](./ESTRUTURA-FRONTEND.md) + [ESTRUTURA-BACKEND.md](./ESTRUTURA-BACKEND.md) — layout do código
5. Fluxos (7–10) — comportamento em runtime
