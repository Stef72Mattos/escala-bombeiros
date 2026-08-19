# Entidades do Banco de Dados

**Versão:** 1.0  
**ORM:** Prisma · **SGBD:** PostgreSQL 16  

---

## Visão Geral

O modelo possui **11 entidades principais** organizadas em domínios: identidade, operacional, escala, comunicação e auditoria. Identificadores são **UUID v4**. Timestamps em UTC com aplicação de fuso `America/Sao_Paulo` na camada de negócio.

---

## Enums Globais

```text
Papel                  → ESCALANTE | BOMBEIRO
StatusBombeiro         → ATIVO | INATIVO
TipoFeriado            → NACIONAL | ESTADUAL | LOCAL
StatusIndisponibilidade → PENDENTE | APROVADA | REJEITADA
StatusEscala           → RASCUNHO | APROVADA | PUBLICADA | ARQUIVADA
TipoPlantao            → PRETA | VERMELHA
OrigemPlantao          → AUTOMATICA | MANUAL | SUBSTITUICAO
TipoNotificacao        → ESCALA_PUBLICADA | PLANTAO_ALTERADO | SUBSTITUICAO
                         | INDISPONIBILIDADE_AVALIADA | DEFICIT_ESCALA | SISTEMA
```

---

## Entidade: `Usuario`

Conta de acesso ao sistema.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `email` | VARCHAR(255) | ✓ | Unique, login |
| `senhaHash` | VARCHAR(255) | ✓ | bcrypt/argon2 |
| `papel` | Papel | ✓ | ESCALANTE ou BOMBEIRO |
| `ativo` | BOOLEAN | ✓ | Default `true` |
| `consentimentoEmail` | BOOLEAN | ✓ | Default `false` — RNF08 |
| `createdAt` | TIMESTAMP | ✓ | |
| `updatedAt` | TIMESTAMP | ✓ | |

**Índices:** `UNIQUE(email)`, `(papel, ativo)`

---

## Entidade: `Bombeiro`

Dados operacionais vinculados a um usuário.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `usuarioId` | UUID | ✓ | FK → Usuario, Unique |
| `matricula` | VARCHAR(20) | ✓ | Unique |
| `nomeCompleto` | VARCHAR(150) | ✓ | |
| `telefone` | VARCHAR(20) | | |
| `dataAdmissao` | DATE | ✓ | Usado em desempate RN06 |
| `status` | StatusBombeiro | ✓ | Default ATIVO |
| `createdAt` | TIMESTAMP | ✓ | |
| `updatedAt` | TIMESTAMP | ✓ | |

**Índices:** `UNIQUE(usuarioId)`, `UNIQUE(matricula)`, `(status)`

---

## Entidade: `Feriado`

Calendário de feriados configurável.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `data` | DATE | ✓ | Unique |
| `descricao` | VARCHAR(100) | ✓ | Ex: "Natal" |
| `tipo` | TipoFeriado | ✓ | |
| `createdAt` | TIMESTAMP | ✓ | |

**Índices:** `UNIQUE(data)`, `(tipo)`

---

## Entidade: `Ferias`

Períodos de férias — bloqueio inegociável (RN07).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `bombeiroId` | UUID | ✓ | FK → Bombeiro |
| `dataInicio` | DATE | ✓ | |
| `dataFim` | DATE | ✓ | >= dataInicio |
| `observacao` | TEXT | | |
| `createdAt` | TIMESTAMP | ✓ | |
| `createdById` | UUID | | FK → Usuario (quem registrou) |

**Índices:** `(bombeiroId, dataInicio, dataFim)`

---

## Entidade: `Atestado`

Afastamento médico — bloqueio inegociável (RN08).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `bombeiroId` | UUID | ✓ | FK → Bombeiro |
| `dataInicio` | DATE | ✓ | |
| `dataFim` | DATE | ✓ | |
| `observacao` | TEXT | | |
| `arquivoUrl` | VARCHAR(500) | | Upload opcional |
| `createdAt` | TIMESTAMP | ✓ | |
| `createdById` | UUID | | FK → Usuario |

**Índices:** `(bombeiroId, dataInicio, dataFim)`

---

## Entidade: `Indisponibilidade`

Solicitação de indisponibilidade com fluxo de aprovação (RN09).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `bombeiroId` | UUID | ✓ | FK → Bombeiro |
| `dataInicio` | DATE | ✓ | |
| `dataFim` | DATE | ✓ | |
| `motivo` | VARCHAR(100) | ✓ | |
| `justificativa` | TEXT | ✓ | |
| `status` | StatusIndisponibilidade | ✓ | Default PENDENTE |
| `avaliadoPorId` | UUID | | FK → Usuario |
| `avaliadoEm` | TIMESTAMP | | |
| `createdAt` | TIMESTAMP | ✓ | |

**Índices:** `(bombeiroId, status)`, `(status, dataInicio)`

---

## Entidade: `Escala`

Cabeçalho da escala mensal.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `ano` | SMALLINT | ✓ | Ex: 2026 |
| `mes` | SMALLINT | ✓ | 1–12 |
| `status` | StatusEscala | ✓ | Default RASCUNHO |
| `versao` | INTEGER | ✓ | Default 1, incrementa em republicação |
| `geradaEm` | TIMESTAMP | ✓ | |
| `geradaPorId` | UUID | ✓ | FK → Usuario |
| `aprovadaPorId` | UUID | | FK → Usuario |
| `aprovadaEm` | TIMESTAMP | | |
| `publicadaEm` | TIMESTAMP | | |
| `observacoes` | TEXT | | Alertas de déficit, etc. |

**Índices:** `UNIQUE(ano, mes, versao)`, `(status)`, `(ano, mes)`

---

## Entidade: `Plantao`

Alocação de um bombeiro em um dia específico.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `escalaId` | UUID | ✓ | FK → Escala |
| `bombeiroId` | UUID | ✓ | FK → Bombeiro |
| `dataInicio` | TIMESTAMP | ✓ | Sempre 08:00 America/Sao_Paulo |
| `dataFim` | TIMESTAMP | ✓ | dataInicio + 24h |
| `tipo` | TipoPlantao | ✓ | PRETA ou VERMELHA |
| `origem` | OrigemPlantao | ✓ | AUTOMATICA, MANUAL, SUBSTITUICAO |
| `observacao` | TEXT | | Obrigatório se VERMELHA alterada pós-publicação |
| `createdAt` | TIMESTAMP | ✓ | |
| `updatedAt` | TIMESTAMP | ✓ | |

**Índices:** `UNIQUE(escalaId, dataInicio)`, `(bombeiroId, dataInicio)`, `(escalaId, tipo)`

**Restrição:** RN01 — exatamente 1 registro por dia na escala.

---

## Entidade: `Substituicao`

Registro de troca em plantão publicado.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `plantaoId` | UUID | ✓ | FK → Plantao |
| `bombeiroOriginalId` | UUID | ✓ | FK → Bombeiro |
| `bombeiroSubstitutoId` | UUID | ✓ | FK → Bombeiro |
| `motivo` | TEXT | ✓ | |
| `confirmadaPorId` | UUID | ✓ | FK → Usuario |
| `confirmadaEm` | TIMESTAMP | ✓ | |

**Índices:** `(plantaoId)`, `(bombeiroSubstitutoId, confirmadaEm)`

---

## Entidade: `HistoricoPlantao`

Desnormalização para consultas rápidas de 12 meses (RN06).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `bombeiroId` | UUID | ✓ | FK → Bombeiro |
| `plantaoId` | UUID | ✓ | FK → Plantao, Unique |
| `data` | DATE | ✓ | Dia do plantão |
| `tipo` | TipoPlantao | ✓ | |
| `anoMes` | CHAR(7) | ✓ | Ex: "2026-08" |

**Índices:** `(bombeiroId, tipo, data)`, `(anoMes)`, `(data DESC)`

**Populado em:** publicação de escala e confirmação de substituição.

---

## Entidade: `Notificacao`

Notificações in-app por usuário.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `usuarioId` | UUID | ✓ | FK → Usuario |
| `tipo` | TipoNotificacao | ✓ | |
| `titulo` | VARCHAR(150) | ✓ | |
| `mensagem` | TEXT | ✓ | |
| `lida` | BOOLEAN | ✓ | Default false |
| `metadata` | JSONB | | IDs relacionados (escalaId, plantaoId) |
| `createdAt` | TIMESTAMP | ✓ | |

**Índices:** `(usuarioId, lida, createdAt DESC)`

---

## Entidade: `Auditoria`

Trilha append-only de alterações (RF14).

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `usuarioId` | UUID | | FK → Usuario (null se sistema) |
| `entidade` | VARCHAR(50) | ✓ | Ex: "Plantao", "Escala" |
| `entidadeId` | UUID | ✓ | |
| `acao` | VARCHAR(50) | ✓ | CREATE, UPDATE, DELETE, PUBLICAR, etc. |
| `payloadAntes` | JSONB | | Snapshot anterior |
| `payloadDepois` | JSONB | | Snapshot posterior |
| `ip` | VARCHAR(45) | | |
| `createdAt` | TIMESTAMP | ✓ | |

**Índices:** `(entidade, entidadeId)`, `(usuarioId, createdAt DESC)`, `(createdAt DESC)`

**Retenção:** mínimo 5 anos (RNF08).

---

## Entidade Auxiliar: `RefreshToken` (Auth)

Suporte ao fluxo JWT refresh.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|:-----------:|-----------|
| `id` | UUID | ✓ | PK |
| `usuarioId` | UUID | ✓ | FK → Usuario |
| `tokenHash` | VARCHAR(255) | ✓ | Hash do refresh token |
| `expiresAt` | TIMESTAMP | ✓ | |
| `revokedAt` | TIMESTAMP | | Logout / rotação |
| `createdAt` | TIMESTAMP | ✓ | |

**Índices:** `(usuarioId)`, `(tokenHash)`, `(expiresAt)`

---

## Resumo das Entidades

| # | Entidade | Domínio | Registros estimados (1 ano) |
|---|----------|---------|----------------------------|
| 1 | Usuario | Identidade | ~13 |
| 2 | Bombeiro | Operacional | ~12 |
| 3 | Feriado | Calendário | ~15/ano |
| 4 | Ferias | Afastamento | ~24/ano |
| 5 | Atestado | Afastamento | ~30/ano |
| 6 | Indisponibilidade | Afastamento | ~50/ano |
| 7 | Escala | Escala | ~12/ano |
| 8 | Plantao | Escala | ~365/ano |
| 9 | Substituicao | Escala | ~20/ano |
| 10 | HistoricoPlantao | Escala | ~365/ano |
| 11 | Notificacao | Comunicação | ~500/ano |
| 12 | Auditoria | Compliance | ~2000/ano |
| 13 | RefreshToken | Auth | ~13 ativos |

Ver também: [RELACIONAMENTOS.md](./RELACIONAMENTOS.md)
