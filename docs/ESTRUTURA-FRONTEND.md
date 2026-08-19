# Estrutura de Pastas — Frontend (Next.js)

**Versão:** 1.0  
**Stack:** Next.js 14+ · App Router · TypeScript · Tailwind CSS  

---

## Visão Geral

O frontend utiliza **Next.js com App Router**, separando rotas públicas (login) e rotas autenticadas por perfil (Escalante / Bombeiro). A comunicação com o backend ocorre via API REST consumida por um client HTTP centralizado.

### Princípios

- **App Router** para roteamento baseado em pastas
- **Server Components** para páginas estáticas e layout; **Client Components** para interatividade (calendário, formulários)
- **Route Groups** `(auth)` e `(dashboard)` para organizar layouts sem afetar URLs
- **Middleware** Next.js para proteção de rotas e redirecionamento por papel
- Estado global mínimo (Zustand ou Context) — preferir fetch no servidor quando possível

---

## Árvore de Diretórios

```
frontend/
├── .env.local.example
├── .eslintrc.json
├── next.config.ts
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── Dockerfile
├── public/
│   ├── favicon.ico
│   └── assets/
│       └── logo.svg
│
└── src/
    ├── middleware.ts                 # Guard de rotas + JWT cookie check
    │
    ├── app/                          # App Router (rotas)
    │   ├── layout.tsx                # Root layout (providers globais)
    │   ├── page.tsx                  # Redirect → /login ou /dashboard
    │   ├── globals.css
    │   ├── not-found.tsx
    │   ├── error.tsx
    │   │
    │   ├── (auth)/                   # Grupo: rotas públicas
    │   │   ├── layout.tsx            # Layout centrado (login)
    │   │   └── login/
    │   │       └── page.tsx
    │   │
    │   └── (dashboard)/              # Grupo: rotas autenticadas
    │       ├── layout.tsx            # Sidebar + header + notificações
    │       │
    │       ├── dashboard/
    │       │   └── page.tsx          # Home por perfil
    │       │
    │       ├── escala/
    │       │   ├── page.tsx          # Calendário mensal
    │       │   ├── [ano]/[mes]/
    │       │   │   └── page.tsx      # Escala específica
    │       │   └── gerar/
    │       │       └── page.tsx      # Escalante: gerar rascunho
    │       │
    │       ├── bombeiros/            # Escalante only
    │       │   ├── page.tsx          # Lista
    │       │   ├── novo/
    │       │   │   └── page.tsx
    │       │   └── [id]/
    │       │       └── page.tsx      # Editar
    │       │
    │       ├── feriados/             # Escalante only
    │       │   └── page.tsx
    │       │
    │       ├── afastamentos/
    │       │   ├── page.tsx          # Tabs: férias, atestados, indispon.
    │       │   ├── ferias/
    │       │   │   └── page.tsx
    │       │   ├── atestados/
    │       │   │   └── page.tsx
    │       │   └── indisponibilidades/
    │       │       ├── page.tsx
    │       │       └── pendencias/   # Escalante: fila de aprovação
    │       │           └── page.tsx
    │       │
    │       ├── substituicoes/        # Escalante only
    │       │   └── page.tsx
    │       │
    │       ├── relatorios/           # Escalante only
    │       │   └── page.tsx
    │       │
    │       ├── auditoria/            # Escalante only
    │       │   └── page.tsx
    │       │
    │       ├── notificacoes/
    │       │   └── page.tsx
    │       │
    │       └── perfil/
    │           └── page.tsx
    │
    ├── components/
    │   ├── ui/                       # Primitivos (Button, Input, Modal, Badge)
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   ├── modal.tsx
    │   │   ├── badge.tsx
    │   │   ├── toast.tsx
    │   │   └── skeleton.tsx
    │   │
    │   ├── layout/
    │   │   ├── sidebar.tsx
    │   │   ├── header.tsx
    │   │   ├── nav-item.tsx
    │   │   └── role-guard.tsx        # Render condicional por papel
    │   │
    │   ├── auth/
    │   │   └── login-form.tsx
    │   │
    │   ├── calendar/
    │   │   ├── schedule-calendar.tsx # Calendário mensal principal
    │   │   ├── shift-cell.tsx        # Célula PRETA/VERMELHA
    │   │   ├── shift-detail-modal.tsx
    │   │   └── shift-edit-modal.tsx  # Escalante: trocar bombeiro
    │   │
    │   ├── bombeiros/
    │   │   ├── bombeiro-table.tsx
    │   │   └── bombeiro-form.tsx
    │   │
    │   ├── afastamentos/
    │   │   ├── ferias-form.tsx
    │   │   ├── atestado-form.tsx
    │   │   ├── indisponibilidade-form.tsx
    │   │   └── aprovacao-list.tsx
    │   │
    │   ├── escalas/
    │   │   ├── gerar-escala-form.tsx
    │   │   ├── escala-status-badge.tsx
    │   │   ├── aprovar-publicar-actions.tsx
    │   │   └── equidade-summary.tsx
    │   │
    │   ├── substituicoes/
    │   │   ├── substituto-suggestions.tsx
    │   │   └── confirmar-substituicao-modal.tsx
    │   │
    │   ├── relatorios/
    │   │   ├── plantoes-por-bombeiro-chart.tsx
    │   │   └── equilibrio-preta-vermelha.tsx
    │   │
    │   └── notificacoes/
    │       ├── notification-bell.tsx
    │       └── notification-list.tsx
    │
    ├── lib/
    │   ├── api/
    │   │   ├── client.ts             # Axios/fetch wrapper + interceptors
    │   │   ├── auth.api.ts
    │   │   ├── bombeiros.api.ts
    │   │   ├── feriados.api.ts
    │   │   ├── afastamentos.api.ts
    │   │   ├── escalas.api.ts
    │   │   ├── substituicoes.api.ts
    │   │   ├── notificacoes.api.ts
    │   │   ├── relatorios.api.ts
    │   │   └── auditoria.api.ts
    │   │
    │   ├── auth/
    │   │   ├── session.ts            # Leitura de tokens (cookies)
    │   │   ├── tokens.ts             # Set/clear cookies
    │   │   └── permissions.ts        # Helpers ESCALANTE | BOMBEIRO
    │   │
    │   ├── hooks/
    │   │   ├── use-auth.ts
    │   │   ├── use-notificacoes.ts
    │   │   └── use-escala-mes.ts
    │   │
    │   ├── stores/
    │   │   └── auth-store.ts         # Zustand: user + papel
    │   │
    │   ├── utils/
    │   │   ├── date.ts               # Fuso America/Sao_Paulo
    │   │   ├── shift-type.ts         # PRETA vs VERMELHA (client-side preview)
    │   │   └── format.ts
    │   │
    │   └── constants/
    │       ├── routes.ts
    │       └── enums.ts
    │
    └── types/
        ├── auth.types.ts
        ├── bombeiro.types.ts
        ├── escala.types.ts
        ├── plantao.types.ts
        ├── afastamento.types.ts
        ├── notificacao.types.ts
        └── api.types.ts              # Paginação, erros padronizados
```

---

## Convenções por Pasta

### `app/`
| Pasta | Responsabilidade |
|-------|------------------|
| `(auth)` | Rotas públicas sem sidebar |
| `(dashboard)` | Rotas protegidas com layout autenticado |
| `[ano]/[mes]` | Parâmetros dinâmicos para navegação mensal |

### `components/`
| Pasta | Responsabilidade |
|-------|------------------|
| `ui/` | Componentes genéricos reutilizáveis (design system) |
| `layout/` | Shell da aplicação autenticada |
| Domínio (`calendar/`, `escalas/`, etc.) | Componentes específicos do negócio |

### `lib/api/`
Um arquivo por recurso REST, espelhando módulos do backend NestJS.

### `middleware.ts`
- Verifica presença de `access_token` em cookie httpOnly
- Redireciona não autenticados para `/login`
- Redireciona bombeiros que tentam acessar rotas exclusivas do escalante

---

## Mapeamento Rota → Perfil

| Rota | Escalante | Bombeiro |
|------|:---------:|:--------:|
| `/login` | ✓ | ✓ |
| `/dashboard` | ✓ | ✓ |
| `/escala` | ✓ | ✓ (somente publicada) |
| `/escala/gerar` | ✓ | ✗ |
| `/bombeiros` | ✓ | ✗ |
| `/feriados` | ✓ | ✗ |
| `/afastamentos` | ✓ | ✓ |
| `/afastamentos/indisponibilidades/pendencias` | ✓ | ✗ |
| `/substituicoes` | ✓ | ✗ |
| `/relatorios` | ✓ | ✗ |
| `/auditoria` | ✓ | ✗ |
| `/notificacoes` | ✓ | ✓ |
| `/perfil` | ✓ | ✓ |

---

## Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=Escala Bombeiros
```

---

## Dependências Previstas

| Pacote | Uso |
|--------|-----|
| `next` | Framework |
| `react`, `react-dom` | UI |
| `typescript` | Tipagem |
| `tailwindcss` | Estilos |
| `@tanstack/react-query` | Cache e mutations de API |
| `zustand` | Estado auth leve |
| `axios` | HTTP client |
| `date-fns` + `date-fns-tz` | Datas com fuso |
| `react-hook-form` + `zod` | Formulários e validação |
| `lucide-react` | Ícones |
| `@fullcalendar/react` | Calendário mensal (opcional) |

---

## Relacionamento com Backend

```
Frontend (Next.js :3000)
    │
    │  HTTPS / REST
    │  Authorization: Bearer <access_token>
    │  Cookie: refresh_token (httpOnly)
    ▼
Backend (NestJS :3001/api)
```

Ver também: [ARQUITETURA.md](./ARQUITETURA.md) · [FLUXO-AUTENTICACAO-JWT.md](./FLUXO-AUTENTICACAO-JWT.md)
