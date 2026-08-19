# Escala Bombeiros

Aplicação web para **gerenciamento de escalas de plantão** de um Corpo de Bombeiros. O sistema automatiza a distribuição justa de plantões, respeita restrições operacionais e legais, permite aprovação humana antes da publicação e notifica alterações relevantes aos envolvidos.

---

## Índice

- [Contexto do Projeto](#contexto-do-projeto)
- [Premissas](#premissas)
- [Perfis de Usuário](#perfis-de-usuário)
- [Requisitos Funcionais](#requisitos-funcionais)
- [Requisitos Não Funcionais](#requisitos-não-funcionais)
- [Casos de Uso](#casos-de-uso)
- [Regras de Negócio](#regras-de-negócio)
- [Arquitetura da Solução](#arquitetura-da-solução)
- [Modelagem do Banco de Dados](#modelagem-do-banco-de-dados)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Fluxos do Sistema](#fluxos-do-sistema)
- [Glossário](#glossário)
- [Stack Tecnológica](#stack-tecnológica)
- [Documentação Complementar](#documentação-complementar)
- [Próximos Passos](#próximos-passos)

---

## Contexto do Projeto

| Item | Descrição |
|------|-----------|
| Equipe | 12 bombeiros + 1 escalante administrador |
| Plantão | 24 horas, das **08:00** às **08:00** do dia seguinte |
| Cobertura | **1 bombeiro por plantão** |
| Descanso | Mínimo de **24h após o término** do plantão |
| Escala PRETA | Dias úteis (segunda a sexta, exceto feriados) |
| Escala VERMELHA | Finais de semana e feriados |
| Equidade | Distribuição justa com diferença máxima de **3 plantões** entre bombeiros |
| Histórico | Considera **12 meses** para equilibrar finais de semana e feriados |
| Restrições inegociáveis | Férias e atestados médicos |
| Aprovação | Escalante aprova a escala antes da publicação |
| Comunicação | Notificações internas e e-mail para alterações importantes |

---

## Premissas

| Item | Premissa |
|------|----------|
| Período da escala | Mensal (do dia 1 ao último dia do mês) |
| Unidade operacional | Uma única guarnição/unidade |
| Feriados | Cadastro configurável pelo escalante (nacionais, estaduais e locais) |
| Idioma | Português (Brasil) |
| Fuso horário | `America/Sao_Paulo` |

---

## Perfis de Usuário

### Escalante (Administrador)
- Gerencia bombeiros, feriados e escalas
- Gera, edita, aprova e publica escalas
- Avalia indisponibilidades
- Confirma substitutos
- Consulta relatórios e auditoria

### Bombeiro
- Consulta escala publicada
- Registra indisponibilidades e justificativas
- Pode registrar atestados (conforme política interna)
- Recebe notificações de alterações

---

## Requisitos Funcionais

### RF01 — Autenticação e Autorização
- Login com e-mail e senha
- Controle de acesso baseado em papéis: **Escalante** e **Bombeiro**
- Escalante gerencia usuários, feriados e escalas; bombeiro consulta escala e registra indisponibilidades

### RF02 — Cadastro de Bombeiros
- CRUD de bombeiros: nome, e-mail, matrícula, telefone, data de admissão, status ativo/inativo
- Bombeiro inativo **não participa** da geração automática de escalas

### RF03 — Cadastro de Feriados
- Cadastro de feriados com data, descrição e tipo (nacional, estadual, local)
- Feriados cadastrados classificam o plantão como escala **VERMELHA**

### RF04 — Registro de Férias
- Registro de períodos de férias com data início e fim
- Férias são **obrigatórias e inegociáveis** — bombeiro não pode ser escalado no período

### RF05 — Registro de Atestados Médicos
- Registro de atestados com data início, fim, observação e comprovante (upload opcional)
- Atestados são **obrigatórios e inegociáveis** — bloqueiam escalação no período

### RF06 — Indisponibilidades e Justificativas
- Bombeiros informam indisponibilidades futuras com data(s), motivo e justificativa
- Indisponibilidades entram como restrição na geração (complementam férias/atestados)
- Escalante visualiza, aprova ou rejeita indisponibilidades

### RF07 — Geração Automática de Escala
O sistema gera proposta de escala mensal considerando:
- Apenas **1 bombeiro por plantão**
- Descanso mínimo de **24h após o término** do plantão
- Bloqueios por férias, atestados e indisponibilidades aprovadas
- Distribuição justa de plantões **PRETA** e **VERMELHA**
- Diferença máxima de **3 plantões** entre bombeiros ativos (total e por tipo)
- Histórico dos **últimos 12 meses** para equilibrar finais de semana e feriados

### RF08 — Edição Manual pela Escalante
- Ajuste manual da proposta após geração automática (trocar bombeiro de plantão)
- Validação de regras de negócio em tempo real
- Registro em log de auditoria

### RF09 — Aprovação e Publicação
- Escala permanece em **Rascunho** até aprovação
- Após aprovação, escala é **publicada** e visível a todos os bombeiros
- Escalas publicadas só podem ser alteradas com nova versão/republicação e notificação

### RF10 — Sugestão de Substitutos
- Diante de afastamento em plantão já publicado, sugere substitutos elegíveis ordenados por critério de justiça
- Escalante confirma ou escolhe substituto manualmente

### RF11 — Consulta de Escala
- Bombeiros visualizam escala publicada em calendário mensal e lista
- Destaque visual para plantões PRETA e VERMELHA
- Escalante visualiza rascunho, publicada e histórico

### RF12 — Relatórios e Indicadores
- Plantões por bombeiro (mês atual e acumulado 12 meses)
- Equilíbrio PRETA vs VERMELHA
- Violações evitadas e exceções aprovadas manualmente

### RF13 — Notificações
- **In-app:** publicação de escala, alteração de plantão, substituição pendente
- **E-mail:** escala publicada, plantão alterado, convocação como substituto

### RF14 — Auditoria
- Registro de quem fez o quê e quando: geração, edição, aprovação, publicação, substituições

---

## Requisitos Não Funcionais

| ID | Requisito | Especificação |
|----|-----------|---------------|
| RNF01 | Disponibilidade | 99,5% em horário comercial; consulta 24/7 |
| RNF02 | Performance | Geração ≤ 5s; calendário ≤ 2s |
| RNF03 | Segurança | Hash bcrypt/argon2, HTTPS, RBAC, proteção CSRF/XSS/SQLi |
| RNF04 | Usabilidade | Interface responsiva; calendário intuitivo PRETA/VERMELHA |
| RNF05 | Confiabilidade | Transações atômicas; backup diário |
| RNF06 | Manutenibilidade | Código modular; logs estruturados |
| RNF07 | Escalabilidade | Preparado para múltiplas guarnições no futuro |
| RNF08 | Conformidade | Consentimento para e-mail; retenção ≥ 5 anos |
| RNF09 | Testabilidade | Motor de escalação isolado com testes automatizados |
| RNF10 | Implantação | Docker para dev, homologação e produção |

---

## Casos de Uso

### Atores
- **Escalante (Administrador)**
- **Bombeiro**
- **Sistema** (processos automáticos)

| ID | Caso de Uso | Ator | Descrição |
|----|-------------|------|-----------|
| UC01 | Autenticar no sistema | Escalante / Bombeiro | Login seguro com redirecionamento por perfil |
| UC02 | Gerenciar bombeiros | Escalante | CRUD e ativação/desativação |
| UC03 | Gerenciar feriados | Escalante | Manter calendário de feriados |
| UC04 | Registrar férias | Escalante | Períodos de férias obrigatórios |
| UC05 | Registrar atestado | Escalante / Bombeiro | Afastamento médico com período |
| UC06 | Informar indisponibilidade | Bombeiro | Datas indisponíveis com justificativa |
| UC07 | Avaliar indisponibilidade | Escalante | Aprovar ou rejeitar |
| UC08 | Gerar escala mensal | Escalante | Proposta automática para o mês |
| UC09 | Editar escala (rascunho) | Escalante | Ajuste manual de plantões |
| UC10 | Aprovar e publicar escala | Escalante | Tornar escala oficial |
| UC11 | Consultar escala | Escalante / Bombeiro | Calendário e detalhes |
| UC12 | Solicitar substituto | Escalante | Sugestões e confirmação |
| UC13 | Receber notificações | Escalante / Bombeiro | In-app e e-mail |
| UC14 | Consultar relatórios | Escalante | Equilíbrio e histórico |
| UC15 | Consultar auditoria | Escalante | Trilha de alterações |

---

## Regras de Negócio

### RN01 — Composição do Plantão
Cada plantão possui **exatamente 1 bombeiro** escalado.

### RN02 — Horário e Duração
Plantão inicia às **08:00** e encerra às **08:00** do dia seguinte (24 horas).

### RN03 — Descanso Mínimo
Após o término do plantão (08:00), o bombeiro só pode iniciar novo plantão após **24 horas completas de descanso** — a partir das **08:00 do segundo dia** seguinte ao início do plantão anterior.

**Exemplo:** plantão seg 08:00 → ter 08:00. Descanso até qua 08:00. Próximo plantão permitido: qua 08:00.

### RN04 — Classificação PRETA / VERMELHA

| Tipo | Condição |
|------|----------|
| **PRETA** | Segunda a sexta, exceto feriados |
| **VERMELHA** | Sábado, domingo ou feriado cadastrado |

### RN05 — Equidade na Distribuição
- Diferença entre bombeiro com mais e menos plantões **não pode exceder 3**
- Vale para **total geral** e **subtotais por tipo** (PRETA e VERMELHA)
- Prioridade em conflito: (1) férias/atestados → (2) descanso → (3) equidade VERMELHA → (4) equidade total

### RN06 — Histórico de 12 Meses (VERMELHA)
- Bombeiros com **menos plantões VERMELHA** nos últimos 12 meses têm prioridade
- Empate: menor total geral → ordem rotativa por matrícula

### RN07 — Férias (Inegociável)
Bombeiro em férias **não pode** ser alocado. Bloqueia geração e edição manual (override excepcional exige justificativa auditada).

### RN08 — Atestados (Inegociável)
Bloqueio total no período do atestado — mesmo comportamento das férias.

### RN09 — Indisponibilidades
- **Aprovada:** restrição na geração
- **Pendente:** alerta o escalante; bloqueia após aprovação (padrão)

### RN10 — Ciclo de Vida da Escala

| Status | Descrição |
|--------|-----------|
| `RASCUNHO` | Proposta gerada ou em edição |
| `APROVADA` | Validada, aguardando publicação |
| `PUBLICADA` | Oficial, visível aos bombeiros |
| `ARQUIVADA` | Mês encerrado, somente consulta |

### RN11 — Substituição
Substituto deve: não estar afastado/indisponível; respeitar descanso (RN03); maximizar equidade.

**Ordenação:** menor carga VERMELHA (12 meses) → menor carga total no mês → maior tempo sem plantão.

### RN12 — Publicação e Alterações
- Alteração em escala publicada gera **notificação obrigatória** (in-app + e-mail)
- Alteração em plantão VERMELHA exige motivo registrado

### RN13 — Bombeiros Ativos
Apenas bombeiros **ATIVOS** entram na rotação. Se nenhum elegível em um dia, sistema alerta escalante.

### RN14 — Feriado vs Dia da Semana
Feriado em dia útil → plantão **VERMELHA** (prevalece sobre PRETA).

---

## Arquitetura da Solução

### Estilo
**Monólito modular** com frontend SPA e backend API REST — adequado ao porte inicial (13 usuários), com fronteiras claras para evolução.

### Diagrama de Contexto

```
┌──────────────┐         HTTPS          ┌──────────────────────────────┐
│   Browser    │ ◄────────────────────► │   API Backend (Monólito)      │
│  (React SPA) │                        │   - Auth / RBAC               │
└──────────────┘                        │   - Domínio Escalas           │
                                        │   - Motor de Equidade         │
                                        │   - Notificações              │
                                        └───────────┬──────────────────┘
                                                    │
                    ┌───────────────────────────────┼───────────────────────┐
                    │                               │                       │
              ┌─────▼─────┐                  ┌──────▼──────┐         ┌──────▼──────┐
              │ PostgreSQL │                  │   Redis     │         │  SMTP /     │
              │ (dados)    │                  │ (cache/jobs)│         │  SendGrid   │
              └───────────┘                  └─────────────┘         └─────────────┘
```

### Camadas (Backend)

| Camada | Responsabilidade |
|--------|------------------|
| Apresentação (API) | Controllers REST, DTOs, validação |
| Aplicação | Casos de uso, orquestração, transações |
| Domínio | Entidades, regras de negócio, motor de escalação |
| Infraestrutura | ORM, repositórios, e-mail, filas, arquivos |

### Componentes Principais

1. **Auth Service** — login, perfis, sessão
2. **Cadastro Service** — bombeiros, feriados
3. **Afastamento Service** — férias, atestados, indisponibilidades
4. **Schedule Engine** — algoritmo de geração e validação *(core)*
5. **Substitution Engine** — ranking de substitutos
6. **Notification Service** — in-app + e-mail assíncrono
7. **Audit Service** — trilha de auditoria append-only

### Motor de Escalação

```
ENTRADA: mês alvo, bombeiros ativos, restrições, histórico 12 meses
PARA cada dia D do mês:
  tipo ← PRETA ou VERMELHA (RN04)
  candidatos ← bombeiros elegíveis (RN07-RN09, RN03)
  ordenar candidatos por score de equidade (RN05, RN06)
  atribuir melhor candidato
  atualizar contadores temporários
VALIDAR diferença máxima 3 (RN05)
SE inválido → backtrack/heurística de swap ou alertar escalante
SAÍDA: proposta RASCUNHO
```

---

## Modelagem do Banco de Dados

### Entidades Principais

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Autenticação, e-mail, papel (ESCALANTE/BOMBEIRO) |
| `bombeiros` | Dados operacionais vinculados ao usuário |
| `feriados` | Calendário de feriados (NACIONAL, ESTADUAL, LOCAL) |
| `ferias` | Períodos de férias por bombeiro |
| `atestados` | Afastamentos médicos com comprovante opcional |
| `indisponibilidades` | Solicitações com status PENDENTE/APROVADA/REJEITADA |
| `escalas` | Mês/ano, status, versão, datas de aprovação/publicação |
| `plantoes` | Bombeiro, data 08:00, tipo PRETA/VERMELHA, origem |
| `substituicoes` | Histórico de trocas em plantões publicados |
| `notificacoes` | Notificações in-app por usuário |
| `auditoria` | Trilha append-only de alterações |
| `historico_plantoes` | Desnormalizado para consulta rápida dos 12 meses |

### Restrições Importantes

- `UNIQUE(escala_id, data_inicio)` em `plantoes` — garante 1 bombeiro por dia
- Índices recomendados: `(bombeiro_id, data)`, `(escala_id)`, `(historico_plantoes.bombeiro_id, tipo, data)`, `(ferias.data_inicio, data_fim)`

### Diagrama ER (conceitual)

```
USUARIO ─── BOMBEIRO ─── FERIAS / ATESTADO / INDISPONIBILIDADE
                │
                └── ESCALA ─── PLANTAO
FERIADO                    SUBSTITUICAO / HISTORICO_PLANTAO
NOTIFICACAO / AUDITORIA
```

> Detalhamento completo de campos e tipos: [`docs/DOCUMENTACAO.md`](docs/DOCUMENTACAO.md#6-modelagem-do-banco-de-dados)

---

## Estrutura de Pastas

```
escala-bombeiros/
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── README.md
├── docs/
│   ├── DOCUMENTACAO.md
│   ├── API.md                   # (futuro)
│   └── FLUXOS.md                # (futuro)
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   └── src/
│       ├── config/
│       ├── common/
│       └── modules/
│           ├── auth/
│           ├── usuarios/
│           ├── bombeiros/
│           ├── feriados/
│           ├── afastamentos/
│           ├── escalas/
│           │   ├── schedule-engine/
│           │   └── substitution-engine/
│           ├── notificacoes/
│           └── auditoria/
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── api/
│       ├── auth/
│       ├── components/
│       │   ├── calendar/
│       │   ├── layout/
│       │   └── ui/
│       └── pages/
│           ├── Login/
│           ├── Dashboard/
│           ├── Escala/
│           ├── Bombeiros/
│           ├── Afastamentos/
│           └── Relatorios/
└── scripts/
    ├── seed.ts
    └── backup-db.sh
```

---

## Fluxos do Sistema

### Geração e Publicação da Escala

1. Escalante solicita geração (mês/ano)
2. Sistema carrega bombeiros, feriados, afastamentos e histórico 12 meses
3. Schedule Engine gera proposta → status **RASCUNHO**
4. Escalante edita manualmente (opcional) com validação em tempo real
5. Escalante aprova → status **APROVADA**
6. Escalante publica → status **PUBLICADA** + notificações in-app e e-mail

### Afastamento e Impacto

| Tipo | Comportamento |
|------|---------------|
| Férias | Bloqueio inegociável imediato |
| Atestado | Bloqueio inegociável imediato |
| Indisponibilidade | Pendente → escalante aprova/rejeita → restrição se aprovada |

Se escala **já publicada** → aciona fluxo de **substituição**.

### Sugestão de Substituto

1. Escalante informa afastamento em plantão publicado
2. Substitution Engine ranqueia candidatos elegíveis
3. Escalante confirma substituto + motivo
4. Sistema atualiza plantão e notifica substituto

### Notificações

| Evento | In-App | E-mail |
|--------|--------|--------|
| Escala publicada | Todos os bombeiros | Sim |
| Plantão alterado após publicação | Bombeiro afetado | Sim |
| Convocação como substituto | Substituto | Sim |
| Indisponibilidade aprovada/rejeitada | Solicitante | Opcional |
| Falha na geração (déficit) | Escalante | Sim |

> Diagramas Mermaid detalhados: [`docs/DOCUMENTACAO.md`](docs/DOCUMENTACAO.md#8-fluxos-do-sistema)

---

## Glossário

| Termo | Definição |
|-------|-----------|
| **Plantão** | Turno de 24h das 08:00 às 08:00 |
| **Escala PRETA** | Plantão em dia útil (não feriado) |
| **Escala VERMELHA** | Plantão em fim de semana ou feriado |
| **Escalante** | Administrador responsável pela escala |
| **Motor de escalação** | Componente que aplica regras e gera a distribuição |

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 14+ (App Router) + TypeScript |
| UI | Tailwind CSS + calendário (FullCalendar ou similar) |
| Backend | NestJS + TypeScript |
| ORM | Prisma |
| Banco | PostgreSQL 16 |
| Cache/Fila | Redis + BullMQ |
| Auth | JWT (access + refresh token) |
| Container | Docker + Docker Compose |
| E-mail | SMTP institucional ou SendGrid |

---

## Documentação Complementar

### Análise e Requisitos
- [Documentação de análise](docs/DOCUMENTACAO.md) — requisitos, casos de uso, regras de negócio

### Arquitetura Técnica
- [Índice da documentação técnica](docs/README.md)
- [Arquitetura da aplicação](docs/ARQUITETURA.md)
- [Estrutura Frontend (Next.js)](docs/ESTRUTURA-FRONTEND.md)
- [Estrutura Backend (NestJS)](docs/ESTRUTURA-BACKEND.md)
- [Módulos e dependências](docs/MODULOS.md)
- [Entidades do banco](docs/ENTIDADES.md)
- [Relacionamentos](docs/RELACIONAMENTOS.md)

### Fluxos Operacionais
- [Autenticação JWT](docs/FLUXO-AUTENTICACAO-JWT.md)
- [Geração de escalas](docs/FLUXO-GERACAO-ESCALAS.md)
- [Substituições automáticas](docs/FLUXO-SUBSTITUICOES.md)
- [Notificações](docs/FLUXO-NOTIFICACOES.md)

---

## Próximos Passos

1. Validar premissas com stakeholders (período mensal, fluxo de indisponibilidades)
2. Prototipar UI do calendário
3. Implementar MVP: auth, cadastros, motor de escalação, publicação
4. Testes unitários do Schedule Engine com cenários de borda
5. Homologação com escalante real usando dados simulados

---

## Licença

A definir.
