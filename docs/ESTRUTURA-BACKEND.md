# Estrutura de Pastas — Backend (NestJS)

**Versão:** 1.0  
**Stack:** NestJS · TypeScript · Prisma · PostgreSQL · Redis · BullMQ  

---

## Visão Geral

Backend organizado como **monólito modular NestJS**, com separação clara entre camadas de apresentação (controllers), aplicação (services/use cases), domínio (engines e regras) e infraestrutura (Prisma, filas, e-mail).

### Princípios

- **Um módulo NestJS por bounded context** de negócio
- **Schedule Engine** e **Substitution Engine** isolados em subpastas do módulo `escalas`
- DTOs com `class-validator` na borda; entidades de domínio internas quando necessário
- Prisma como única camada de persistência
- Jobs assíncronos (e-mail, notificações em massa) via BullMQ

---

## Árvore de Diretórios

```
backend/
├── .env.example
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
│
├── prisma/
│   ├── schema.prisma               # Modelo completo (ver ENTIDADES.md)
│   ├── migrations/
│   └── seed.ts                     # 12 bombeiros + 1 escalante
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
└── src/
    ├── main.ts                     # Bootstrap, CORS, Swagger, pipes globais
    ├── app.module.ts               # Root module — importa todos os módulos
    │
    ├── config/
    │   ├── config.module.ts
    │   ├── app.config.ts           # PORT, NODE_ENV, TZ
    │   ├── database.config.ts
    │   ├── jwt.config.ts           # secret, expiresIn access/refresh
    │   ├── redis.config.ts
    │   └── mail.config.ts          # SMTP / SendGrid
    │
    ├── common/
    │   ├── decorators/
    │   │   ├── roles.decorator.ts
    │   │   ├── current-user.decorator.ts
    │   │   └── public.decorator.ts
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts
    │   │   ├── jwt-refresh.guard.ts
    │   │   └── roles.guard.ts
    │   ├── filters/
    │   │   └── http-exception.filter.ts
    │   ├── interceptors/
    │   │   ├── logging.interceptor.ts
    │   │   └── transform.interceptor.ts
    │   ├── pipes/
    │   │   └── validation.pipe.ts
    │   ├── dto/
    │   │   └── pagination.dto.ts
    │   ├── enums/
    │   │   ├── papel.enum.ts
    │   │   ├── status-escala.enum.ts
    │   │   ├── tipo-plantao.enum.ts
    │   │   └── status-indisponibilidade.enum.ts
    │   └── utils/
    │       ├── date.utils.ts       # America/Sao_Paulo, plantão 08:00
    │       └── business-error.ts
    │
    ├── infrastructure/
    │   ├── prisma/
    │   │   ├── prisma.module.ts
    │   │   └── prisma.service.ts
    │   ├── redis/
    │   │   ├── redis.module.ts
    │   │   └── redis.service.ts
    │   ├── mail/
    │   │   ├── mail.module.ts
    │   │   ├── mail.service.ts
    │   │   └── templates/          # Handlebars: escala-publicada, etc.
    │   └── queue/
    │       ├── queue.module.ts
    │       ├── queue.constants.ts
    │       └── processors/
    │           ├── email.processor.ts
    │           └── notification.processor.ts
    │
    └── modules/
        ├── auth/
        │   ├── auth.module.ts
        │   ├── auth.controller.ts
        │   ├── auth.service.ts
        │   ├── strategies/
        │   │   ├── jwt.strategy.ts
        │   │   └── jwt-refresh.strategy.ts
        │   └── dto/
        │       ├── login.dto.ts
        │       ├── refresh-token.dto.ts
        │       └── auth-response.dto.ts
        │
        ├── usuarios/
        │   ├── usuarios.module.ts
        │   ├── usuarios.controller.ts
        │   ├── usuarios.service.ts
        │   └── dto/
        │
        ├── bombeiros/
        │   ├── bombeiros.module.ts
        │   ├── bombeiros.controller.ts
        │   ├── bombeiros.service.ts
        │   └── dto/
        │
        ├── feriados/
        │   ├── feriados.module.ts
        │   ├── feriados.controller.ts
        │   ├── feriados.service.ts
        │   └── dto/
        │
        ├── afastamentos/
        │   ├── afastamentos.module.ts
        │   ├── ferias/
        │   │   ├── ferias.controller.ts
        │   │   └── ferias.service.ts
        │   ├── atestados/
        │   │   ├── atestados.controller.ts
        │   │   └── atestados.service.ts
        │   ├── indisponibilidades/
        │   │   ├── indisponibilidades.controller.ts
        │   │   └── indisponibilidades.service.ts
        │   └── dto/
        │
        ├── escalas/
        │   ├── escalas.module.ts
        │   ├── escalas.controller.ts
        │   ├── escalas.service.ts
        │   ├── plantoes.controller.ts
        │   ├── plantoes.service.ts
        │   ├── dto/
        │   ├── schedule-engine/
        │   │   ├── schedule-engine.module.ts
        │   │   ├── schedule-engine.service.ts
        │   │   ├── shift-classifier.service.ts    # PRETA / VERMELHA
        │   │   ├── eligibility.service.ts           # RN03, RN07-RN09
        │   │   ├── equity-scorer.service.ts         # RN05, RN06
        │   │   ├── schedule-validator.service.ts
        │   │   └── types/
        │   │       └── schedule-context.types.ts
        │   └── substitution-engine/
        │       ├── substitution-engine.module.ts
        │       ├── substitution-engine.service.ts
        │       └── dto/
        │
        ├── historico/
        │   ├── historico.module.ts
        │   ├── historico.service.ts                # Consulta 12 meses
        │   └── historico.controller.ts             # Relatórios
        │
        ├── notificacoes/
        │   ├── notificacoes.module.ts
        │   ├── notificacoes.controller.ts
        │   ├── notificacoes.service.ts
        │   └── dto/
        │
        ├── auditoria/
        │   ├── auditoria.module.ts
        │   ├── auditoria.controller.ts
        │   ├── auditoria.service.ts
        │   └── dto/
        │
        └── relatorios/
            ├── relatorios.module.ts
            ├── relatorios.controller.ts
            └── relatorios.service.ts
```

---

## Convenções por Camada

### Controllers (`*.controller.ts`)
- Prefixo REST por módulo: `/api/bombeiros`, `/api/escalas`
- Guards: `JwtAuthGuard` + `RolesGuard` onde aplicável
- Retorno padronizado via `TransformInterceptor`

### Services (`*.service.ts`)
- Orquestram casos de uso e transações Prisma
- Delegam regras complexas aos engines de domínio
- Emitem eventos internos ou enfileiram jobs

### Schedule Engine / Substitution Engine
- **Sem dependência de HTTP** — recebem contexto tipado, retornam resultado puro
- Testáveis unitariamente com mocks de repositório
- Localizados dentro do módulo `escalas` por coesão

### Infrastructure
- Módulos globais (`PrismaModule`, `QueueModule`) exportados para injeção
- Processors BullMQ consomem filas definidas em `queue.constants.ts`

---

## Endpoints REST (visão por módulo)

| Prefixo | Módulo | Exemplos |
|---------|--------|----------|
| `/api/auth` | auth | `POST /login`, `POST /refresh`, `POST /logout` |
| `/api/usuarios` | usuarios | CRUD usuários |
| `/api/bombeiros` | bombeiros | CRUD bombeiros |
| `/api/feriados` | feriados | CRUD feriados |
| `/api/ferias` | afastamentos | CRUD férias |
| `/api/atestados` | afastamentos | CRUD atestados |
| `/api/indisponibilidades` | afastamentos | CRUD + aprovação |
| `/api/escalas` | escalas | gerar, aprovar, publicar |
| `/api/plantoes` | escalas | editar plantão, listar por mês |
| `/api/substituicoes` | escalas | sugerir, confirmar |
| `/api/notificacoes` | notificacoes | listar, marcar lida |
| `/api/relatorios` | relatorios | equilíbrio, plantões/bombeiro |
| `/api/auditoria` | auditoria | trilha de alterações |
| `/api/historico` | historico | plantões 12 meses |

Contratos detalhados serão documentados em `API.md` (futuro).

---

## Variáveis de Ambiente

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/escala_bombeiros
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES=7d
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
MAIL_FROM=noreply@bombeiros.local
TZ=America/Sao_Paulo
FRONTEND_URL=http://localhost:3000
```

---

## Bootstrap (`main.ts`)

Responsabilidades:
1. Habilitar CORS para `FRONTEND_URL`
2. ValidationPipe global (`whitelist`, `transform`)
3. Prefixo global `/api`
4. Swagger em `/api/docs` (dev/homolog)
5. Timezone default `America/Sao_Paulo`

---

## Testes

```
backend/src/modules/escalas/schedule-engine/
├── schedule-engine.service.spec.ts
├── eligibility.service.spec.ts
└── equity-scorer.service.spec.ts
```

Prioridade de cobertura: **Schedule Engine** > **Substitution Engine** > services de afastamentos.

Ver também: [MODULOS.md](./MODULOS.md) · [ARQUITETURA.md](./ARQUITETURA.md)
