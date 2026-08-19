# Estrutura de Módulos

**Versão:** 1.0  

---

## Visão Geral

A aplicação divide responsabilidades em **módulos de negócio** (NestJS) no backend e **domínios de UI** no frontend, com comunicação exclusiva via API REST.

---

## Mapa de Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP MODULE (root)                        │
└─────────────────────────────────────────────────────────────────┘
         │
         ├── ConfigModule (global)
         ├── PrismaModule (global)
         ├── RedisModule (global)
         ├── QueueModule (global)
         ├── MailModule
         │
         ├── AuthModule ──────────────► UsuariosModule
         ├── BombeirosModule ───────────► UsuariosModule (1:1)
         ├── FeriadosModule
         ├── AfastamentosModule ────────► BombeirosModule
         │       ├── FeriasService
         │       ├── AtestadosService
         │       └── IndisponibilidadesService
         │
         ├── EscalasModule ◄──────────── CORE
         │       ├── EscalasService
         │       ├── PlantoesService
         │       ├── ScheduleEngineModule
         │       └── SubstitutionEngineModule
         │
         ├── HistoricoModule ───────────► EscalasModule (leitura)
         ├── NotificacoesModule ────────► QueueModule, MailModule
         ├── AuditoriaModule
         └── RelatoriosModule ──────────► HistoricoModule, EscalasModule
```

---

## Módulos Backend — Detalhamento

### AuthModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Login, refresh, logout, emissão e validação JWT |
| **Exporta** | `AuthService`, `JwtModule` |
| **Depende de** | `UsuariosModule`, `ConfigModule` |
| **Endpoints** | `POST /auth/login`, `/refresh`, `/logout` |

### UsuariosModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | CRUD de contas (e-mail, senha, papel, ativo) |
| **Exporta** | `UsuariosService` |
| **Depende de** | `PrismaModule` |
| **Papel** | Entidade base de autenticação |

### BombeirosModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Dados operacionais do bombeiro vinculados ao usuário |
| **Exporta** | `BombeirosService` |
| **Depende de** | `UsuariosModule` |
| **Regra** | Bombeiro inativo excluído da rotação (RN13) |

### FeriadosModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Calendário de feriados (NACIONAL, ESTADUAL, LOCAL) |
| **Exporta** | `FeriadosService` |
| **Consumido por** | `ScheduleEngine` (classificação VERMELHA) |

### AfastamentosModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Férias, atestados e indisponibilidades |
| **Sub-serviços** | `FeriasService`, `AtestadosService`, `IndisponibilidadesService` |
| **Exporta** | Todos os sub-serviços + `AfastamentosFacade` (consulta unificada de bloqueios) |
| **Depende de** | `BombeirosModule`, `NotificacoesModule` (aprovação indispon.) |
| **Regras** | RN07, RN08, RN09 |

### EscalasModule *(core)*
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Ciclo de vida da escala e plantões |
| **Sub-módulos** | `ScheduleEngineModule`, `SubstitutionEngineModule` |
| **Exporta** | `EscalasService`, `PlantoesService` |
| **Depende de** | `BombeirosModule`, `FeriadosModule`, `AfastamentosModule`, `HistoricoModule`, `NotificacoesModule`, `AuditoriaModule` |
| **Operações** | Gerar, editar, aprovar, publicar, substituir |

### ScheduleEngineModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Algoritmo de geração e validação de escala |
| **Serviços internos** | `ShiftClassifier`, `Eligibility`, `EquityScorer`, `ScheduleValidator` |
| **Entrada** | `ScheduleContext` (mês, bombeiros, restrições, histórico) |
| **Saída** | Lista de plantões propostos + alertas (déficit, equidade) |
| **Regras** | RN01–RN06, RN13, RN14 |

### SubstitutionEngineModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Ranking de substitutos elegíveis |
| **Entrada** | `plantaoId`, motivo afastamento |
| **Saída** | Lista ordenada de candidatos com score |
| **Regras** | RN03, RN07–RN09, RN11 |

### HistoricoModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Persistência e consulta de `historico_plantoes` (12 meses) |
| **Exporta** | `HistoricoService` |
| **Alimentado por** | Publicação de escala e confirmação de substituição |
| **Consumido por** | `ScheduleEngine`, `SubstitutionEngine`, `RelatoriosModule` |

### NotificacoesModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Notificações in-app + disparo de e-mail via fila |
| **Exporta** | `NotificacoesService` |
| **Depende de** | `QueueModule`, `MailModule`, `PrismaModule` |
| **Métodos públicos** | `notify()`, `notifyMany()`, `markAsRead()` |

### AuditoriaModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Registro append-only de alterações |
| **Exporta** | `AuditoriaService` |
| **Método** | `log(usuario, entidade, acao, antes, depois)` |
| **Consumido por** | Todos os módulos de escrita |

### RelatoriosModule
| Item | Descrição |
|------|-----------|
| **Responsabilidade** | Agregações para dashboard do escalante |
| **Depende de** | `HistoricoModule`, `EscalasModule`, `BombeirosModule` |
| **Relatórios** | Plantões/bombeiro, equilíbrio PRETA/VERMELHA, exceções |

---

## Módulos Frontend — Detalhamento

| Domínio UI | Páginas | API Client | Perfil |
|------------|---------|------------|--------|
| **Auth** | `/login` | `auth.api.ts` | Todos |
| **Dashboard** | `/dashboard` | múltiplos | Todos |
| **Escala** | `/escala/*` | `escalas.api.ts` | Todos / Escalante |
| **Bombeiros** | `/bombeiros/*` | `bombeiros.api.ts` | Escalante |
| **Feriados** | `/feriados` | `feriados.api.ts` | Escalante |
| **Afastamentos** | `/afastamentos/*` | `afastamentos.api.ts` | Todos |
| **Substituições** | `/substituicoes` | `substituicoes.api.ts` | Escalante |
| **Relatórios** | `/relatorios` | `relatorios.api.ts` | Escalante |
| **Auditoria** | `/auditoria` | `auditoria.api.ts` | Escalante |
| **Notificações** | `/notificacoes` | `notificacoes.api.ts` | Todos |

---

## Matriz de Dependências

| Módulo | Auth | Usuarios | Bombeiros | Feriados | Afastamentos | Escalas | Historico | Notif. | Auditoria |
|--------|:----:|:--------:|:---------:|:--------:|:------------:|:-------:|:---------:|:------:|:---------:|
| Auth | — | ✓ | | | | | | | |
| Bombeiros | | ✓ | — | | | | | | |
| Afastamentos | | | ✓ | | — | | | ✓ | ✓ |
| Escalas | | | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ |
| ScheduleEngine | | | ✓ | ✓ | ✓ | | ✓ | | |
| SubstitutionEngine | | | ✓ | | ✓ | ✓ | ✓ | | |
| Historico | | | ✓ | | | ✓ | — | | |
| Notificacoes | | ✓ | | | | | | — | |
| Relatorios | | | ✓ | | | ✓ | ✓ | | |
| Auditoria | | ✓ | | | | | | | — |

---

## Eventos Internos (desacoplamento)

| Evento | Produtor | Consumidor |
|--------|----------|------------|
| `escala.gerada` | EscalasService | AuditoriaService |
| `escala.publicada` | EscalasService | NotificacoesService, HistoricoService |
| `plantao.alterado` | PlantoesService | NotificacoesService, AuditoriaService |
| `substituicao.confirmada` | EscalasService | NotificacoesService, HistoricoService, AuditoriaService |
| `indisponibilidade.aprovada` | IndisponibilidadesService | NotificacoesService |
| `afastamento.registrado` | AfastamentosModule | EscalasService (verificar impacto) |

Implementação sugerida: `@nestjs/event-emitter` ou chamadas diretas via services injetados (MVP).

---

## Boundaries — O que NÃO cruza módulos

| Proibido | Correto |
|----------|---------|
| Controller de bombeiros acessar Prisma de plantões | Usar `EscalasService` |
| ScheduleEngine enviar e-mail | Retornar resultado; `EscalasService` chama `NotificacoesService` |
| Frontend calcular equidade | Backend valida sempre (RN05) |
| Bombeiro acessar escala RASCUNHO | API filtra por papel + status |

Ver também: [ARQUITETURA.md](./ARQUITETURA.md) · [ESTRUTURA-BACKEND.md](./ESTRUTURA-BACKEND.md)
