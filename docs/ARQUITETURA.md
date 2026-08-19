# Arquitetura da Aplicação

**Versão:** 1.0  
**Papel:** Arquiteto de Software Sênior  

---

## 1. Visão Executiva

Sistema web composto por **Frontend Next.js**, **Backend NestJS** e infraestrutura de suporte (**PostgreSQL**, **Redis**, **SMTP**), containerizado com Docker. Arquitetura **monólito modular** otimizada para 13 usuários concurrentes com regras de negócio complexas no motor de escalação.

---

## 2. Diagrama de Contexto (C4 — Nível 1)

```mermaid
C4Context
    title Sistema de Escalas — Contexto

    Person(escalante, "Escalante", "Administra escalas")
    Person(bombeiro, "Bombeiro", "Consulta escala e informa indisponibilidades")

    System(sistema, "Escala Bombeiros", "Gerencia escalas de plantão 24h")

    System_Ext(email, "Servidor SMTP", "Envio de e-mails")
    System_Ext(browser, "Navegador Web", "Chrome, Firefox, Edge")

    Rel(escalante, browser, "Usa")
    Rel(bombeiro, browser, "Usa")
    Rel(browser, sistema, "HTTPS")
    Rel(sistema, email, "SMTP")
```

---

## 3. Diagrama de Containers (C4 — Nível 2)

```mermaid
C4Container
    title Sistema de Escalas — Containers

    Person(user, "Usuário")

    Container(web, "Frontend", "Next.js", "SPA/SSR, UI, middleware auth")
    Container(api, "Backend API", "NestJS", "REST, regras de negócio, JWT")
    ContainerDb(db, "PostgreSQL", "PostgreSQL 16", "Dados persistentes")
    ContainerDb(redis, "Redis", "Redis 7", "Cache, filas BullMQ")
    Container_Ext(smtp, "SMTP", "E-mail")

    Rel(user, web, "HTTPS")
    Rel(web, api, "REST /api")
    Rel(api, db, "Prisma ORM")
    Rel(api, redis, "Filas + cache")
    Rel(api, smtp, "E-mails assíncronos")
```

---

## 4. Estilo Arquitetural

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Estilo | Monólito modular | Porte pequeno, deploy simples, regras coesas |
| Frontend | Next.js App Router | SSR parcial, middleware, rotas por perfil |
| Backend | NestJS | Módulos, DI, guards, testabilidade |
| Comunicação | REST síncrono | Simplicidade; WebSocket futuro para notificações live |
| Persistência | PostgreSQL + Prisma | ACID, JSONB para auditoria, migrations |
| Assíncrono | BullMQ + Redis | E-mail e notificações em massa |
| Auth | JWT stateless + refresh rotativo | Escalabilidade, mobile-ready futuro |

---

## 5. Camadas do Backend

```mermaid
flowchart TB
    subgraph Apresentacao["Camada de Apresentação"]
        C[Controllers REST]
        D[DTOs + Validation]
        G[Guards + Filters]
    end

    subgraph Aplicacao["Camada de Aplicação"]
        S[Services / Use Cases]
        E[Event Emitter]
    end

    subgraph Dominio["Camada de Domínio"]
        SE[Schedule Engine]
        SUB[Substitution Engine]
        V[Validators de Regras RN]
    end

    subgraph Infra["Camada de Infraestrutura"]
        P[Prisma Service]
        Q[BullMQ Processors]
        M[Mail Service]
    end

    C --> S
    S --> SE
    S --> SUB
    S --> P
    S --> E
    E --> Q
    Q --> M
    SE --> V
    SUB --> V
```

| Camada | Responsabilidade | Exemplos |
|--------|------------------|----------|
| **Apresentação** | HTTP, validação entrada, auth | `EscalasController`, `JwtAuthGuard` |
| **Aplicação** | Orquestração, transações | `EscalasService.publicar()` |
| **Domínio** | Regras puras, algoritmos | `ScheduleEngineService.gerar()` |
| **Infraestrutura** | I/O externo | Prisma, Redis, SMTP |

---

## 6. Camadas do Frontend

```mermaid
flowchart TB
    subgraph Rotas["App Router (pages)"]
        P[Server Components]
        CL[Client Components]
    end

    subgraph UI["Componentes"]
        L[Layout / Sidebar]
        CAL[Calendar]
        F[Forms]
    end

    subgraph Lib["Lib"]
        API[API Clients]
        AUTH[Auth Session]
        HK[Hooks]
    end

    P --> L
    CL --> CAL
    CL --> F
    CL --> API
    P --> AUTH
    API --> AUTH
```

| Camada | Responsabilidade |
|--------|------------------|
| **Middleware** | Proteção de rotas, redirect por papel |
| **Pages (RSC)** | Layout, fetch inicial server-side |
| **Components** | UI interativa (calendário, modais) |
| **Lib/API** | Comunicação REST, tokens |
| **Types** | Contratos TypeScript espelhando DTOs backend |

---

## 7. Componentes Principais e Interações

```mermaid
flowchart LR
    FE[Next.js Frontend]
    API[NestJS API]

    subgraph Core["Core Domain"]
        SE[Schedule Engine]
        SUB[Substitution Engine]
    end

    subgraph Support["Supporting"]
        AUTH[Auth Module]
        AF[Afastamentos]
        NOT[Notificações]
        AUD[Auditoria]
        HIS[Histórico]
    end

    DB[(PostgreSQL)]
    RD[(Redis)]

    FE -->|REST| API
    API --> AUTH
    API --> SE
    API --> SUB
    SE --> AF
    SE --> HIS
    SUB --> AF
    SUB --> HIS
    API --> NOT
    NOT --> RD
    API --> AUD
    API --> DB
    SE --> DB
```

---

## 8. Topologia de Deploy (Docker)

```mermaid
flowchart TB
    subgraph Docker Compose
        NG[nginx :80/:443]
        FE_C[frontend :3000]
        BE_C[backend :3001]
        PG[(postgres :5432)]
        RD[(redis :6379)]
    end

    NG --> FE_C
    NG -->|/api| BE_C
    BE_C --> PG
    BE_C --> RD
```

### Serviços

| Container | Imagem | Porta | Volume |
|-----------|--------|-------|--------|
| `nginx` | nginx:alpine | 80, 443 | certs |
| `frontend` | build ./frontend | 3000 | — |
| `backend` | build ./backend | 3001 | — |
| `postgres` | postgres:16-alpine | 5432 | pgdata |
| `redis` | redis:7-alpine | 6379 | — |

### Rede
- Rede interna `escala-net`
- Apenas nginx exposto externamente
- PostgreSQL e Redis acessíveis somente na rede interna

---

## 9. Segurança

| Aspecto | Implementação |
|---------|---------------|
| Transporte | HTTPS via nginx (TLS 1.2+) |
| Autenticação | JWT access (15min) + refresh (7d) rotativo |
| Autorização | RBAC: ESCALANTE, BOMBEIRO |
| Senhas | bcrypt cost 12 |
| Cookies | refresh_token: httpOnly, Secure, SameSite=Strict |
| CORS | Apenas FRONTEND_URL |
| Rate limit | Login: 5 tentativas/min por IP |
| Headers | Helmet no NestJS |
| SQL | Prisma parameterized queries |
| Auditoria | Todas mutações críticas logadas |

---

## 10. Estratégia de Dados

| Aspecto | Decisão |
|---------|---------|
| PK | UUID v4 |
| Timestamps | UTC no banco; conversão America/Sao_Paulo na aplicação |
| Soft delete | Bombeiros (status INATIVO), não delete físico |
| Histórico | `HistoricoPlantao` desnormalizado na publicação |
| Migrations | Prisma migrate |
| Seed | 1 escalante + 12 bombeiros para dev |
| Backup | pg_dump diário (RNF05) |

---

## 11. Processamento Assíncrono

| Fila (BullMQ) | Job | Trigger |
|---------------|-----|---------|
| `email` | `send-scale-published` | Escala publicada |
| `email` | `send-shift-changed` | Plantão alterado |
| `email` | `send-substitution` | Substituição confirmada |
| `notification` | `create-bulk-notifications` | Publicação escala |
| `notification` | `create-notification` | Eventos unitários |

Workers executam no mesmo processo NestJS (MVP); separável em container próprio no futuro.

---

## 12. Observabilidade

| Item | Ferramenta |
|------|------------|
| Logs | Winston/Pino JSON estruturado |
| Health check | `GET /api/health` (db + redis) |
| Métricas | Prometheus endpoint (futuro) |
| Erros | HttpExceptionFilter padronizado |

---

## 13. Decisões Arquiteturais (ADRs resumidas)

| # | Decisão | Alternativa rejeitada | Motivo |
|---|---------|----------------------|--------|
| ADR-01 | Monólito modular | Microserviços | Complexidade desnecessária para 13 usuários |
| ADR-02 | Next.js App Router | Vite SPA puro | Middleware auth, SSR parcial |
| ADR-03 | Prisma ORM | TypeORM | DX, migrations, tipagem |
| ADR-04 | JWT stateless | Sessions server-side | Simplicidade de deploy |
| ADR-05 | BullMQ | Cron direto | Retry, dead letter, observabilidade |
| ADR-06 | HistoricoPlantao desnormalizado | JOIN em plantoes | Performance consulta 12 meses |

---

## 14. Evolução Futura

| Fase | Melhoria |
|------|----------|
| v1.1 | WebSocket para notificações live |
| v1.2 | Múltiplas guarnições (tenant por unidade) |
| v2.0 | App mobile (React Native) consumindo mesma API |
| v2.1 | Exportação PDF da escala publicada |

---

## Documentos Relacionados

- [MODULOS.md](./MODULOS.md)
- [ESTRUTURA-FRONTEND.md](./ESTRUTURA-FRONTEND.md)
- [ESTRUTURA-BACKEND.md](./ESTRUTURA-BACKEND.md)
- [FLUXO-AUTENTICACAO-JWT.md](./FLUXO-AUTENTICACAO-JWT.md)
- [FLUXO-GERACAO-ESCALAS.md](./FLUXO-GERACAO-ESCALAS.md)
- [FLUXO-SUBSTITUICOES.md](./FLUXO-SUBSTITUICOES.md)
- [FLUXO-NOTIFICACOES.md](./FLUXO-NOTIFICACOES.md)
