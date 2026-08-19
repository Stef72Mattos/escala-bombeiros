# Fluxo de Autenticação JWT

**Versão:** 1.0  
**Módulos:** AuthModule, UsuariosModule  
**Frontend:** middleware.ts, lib/auth  

---

## 1. Visão Geral

Autenticação baseada em **JWT dual-token**:

| Token | Duração | Armazenamento | Uso |
|-------|---------|---------------|-----|
| **Access Token** | 15 minutos | Memória (Zustand) ou cookie não-httpOnly | Header `Authorization: Bearer` |
| **Refresh Token** | 7 dias | Cookie `httpOnly`, `Secure`, `SameSite=Strict` | Renovação silenciosa |

Refresh tokens são persistidos em `RefreshToken` (hash) para permitir revogação no logout.

---

## 2. Participantes

| Participante | Papel |
|--------------|-------|
| **Browser (Next.js)** | UI, middleware, API client |
| **AuthController** | Endpoints `/auth/*` |
| **AuthService** | Lógica login, refresh, logout |
| **JwtStrategy** | Valida access token |
| **JwtRefreshStrategy** | Valida refresh token |
| **Prisma** | Usuario, RefreshToken |
| **RolesGuard** | Autorização por papel |

---

## 3. Fluxo de Login

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant FE as Next.js Frontend
    participant API as AuthController
    participant SVC as AuthService
    participant DB as PostgreSQL

    U->>FE: Preenche e-mail + senha
    FE->>API: POST /api/auth/login { email, senha }
    API->>SVC: validateUser(credentials)
    SVC->>DB: find Usuario by email
    DB-->>SVC: usuario + senhaHash
    SVC->>SVC: bcrypt.compare(senha, hash)

    alt Credenciais inválidas
        SVC-->>API: UnauthorizedException
        API-->>FE: 401 { message: "Credenciais inválidas" }
        FE-->>U: Exibe erro
    else Usuario inativo
        SVC-->>API: ForbiddenException
        API-->>FE: 403
    else Credenciais válidas
        SVC->>SVC: generateAccessToken(payload)
        SVC->>SVC: generateRefreshToken()
        SVC->>DB: INSERT RefreshToken (hash)
        SVC-->>API: { accessToken, user, papel }
        API-->>FE: 200 + Set-Cookie: refresh_token (httpOnly)
        FE->>FE: Armazena accessToken (memória)
        FE->>FE: Redirect por papel
        alt ESCALANTE
            FE-->>U: /dashboard
        else BOMBEIRO
            FE-->>U: /dashboard
        end
    end
```

### Payload do Access Token

```json
{
  "sub": "uuid-usuario",
  "email": "bombeiro@exemplo.com",
  "papel": "BOMBEIRO",
  "bombeiroId": "uuid-bombeiro",
  "iat": 1690000000,
  "exp": 1690000900
}
```

> Escalante não possui `bombeiroId` no payload.

---

## 4. Fluxo de Requisição Autenticada

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend (API Client)
    participant MW as Next.js Middleware
    participant API as Controller
    participant G1 as JwtAuthGuard
    participant G2 as RolesGuard
    participant SVC as Service

    FE->>MW: GET /escala (cookie + token)
    MW->>MW: Verifica access token ou refresh

    alt Sem token válido
        MW-->>FE: Redirect /login
    else Token presente
        MW-->>FE: Permite navegação
        FE->>API: GET /api/escalas/2026/8<br/>Authorization: Bearer {access}
        API->>G1: canActivate()
        G1->>G1: Valida JWT signature + exp
        G1->>G2: canActivate(requiredRoles)
        G2->>G2: Verifica payload.papel
        G2->>SVC: execute business logic
        SVC-->>API: resultado
        API-->>FE: 200 JSON
    end
```

---

## 5. Fluxo de Refresh Token

```mermaid
sequenceDiagram
    autonumber
    participant FE as API Client (Interceptor)
    participant API as AuthController
    participant SVC as AuthService
    participant DB as PostgreSQL

    FE->>API: GET /api/escalas (access expirado)
    API-->>FE: 401 Unauthorized

    FE->>API: POST /api/auth/refresh<br/>Cookie: refresh_token
    API->>SVC: refresh(refreshToken)

    SVC->>DB: find RefreshToken by hash
    alt Token não encontrado ou revogado
        SVC-->>API: 401
        API-->>FE: 401 → redirect /login
    else Token expirado
        SVC->>DB: DELETE RefreshToken
        SVC-->>API: 401
    else Token válido
        SVC->>SVC: generateNewAccessToken()
        SVC->>SVC: rotateRefreshToken() (opcional)
        SVC->>DB: UPDATE/INSERT RefreshToken
        SVC-->>API: { accessToken }
        API-->>FE: 200 + Set-Cookie (novo refresh)
        FE->>FE: Atualiza accessToken
        FE->>API: Retry requisição original
        API-->>FE: 200
    end
```

### Política de Rotação
- A cada refresh bem-sucedido, o refresh token anterior é **revogado** e um novo é emitido (previne replay).

---

## 6. Fluxo de Logout

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant FE as Frontend
    participant API as AuthController
    participant SVC as AuthService
    participant DB as PostgreSQL

    U->>FE: Clica "Sair"
    FE->>API: POST /api/auth/logout<br/>Cookie: refresh_token
    API->>SVC: logout(refreshToken)
    SVC->>DB: UPDATE RefreshToken SET revokedAt = NOW()
    SVC-->>API: OK
    API-->>FE: 200 + Clear-Cookie: refresh_token
    FE->>FE: Limpa accessToken da memória
    FE-->>U: Redirect /login
```

---

## 7. Autorização por Papel (RBAC)

```mermaid
flowchart TD
    REQ[Requisição HTTP] --> JWT{JwtAuthGuard<br/>token válido?}
    JWT -->|Não| E401[401 Unauthorized]
    JWT -->|Sim| ROLE{RolesGuard<br/>papel permitido?}

    ROLE -->|Não| E403[403 Forbidden]
    ROLE -->|Sim| RES[Resource-level check]

    RES --> FILTRO{Filtro por papel}
    FILTRO -->|BOMBEIRO| SOMENTE_PUBLICADA[Só escala PUBLICADA]
    FILTRO -->|ESCALANTE| TODOS_STATUS[Todos os status]
    FILTRO --> BOMBEIRO_PROPRIO[Bombeiro só edita próprios afastamentos]

    SOMENTE_PUBLICADA --> OK[200 OK]
    TODOS_STATUS --> OK
    BOMBEIRO_PROPRIO --> OK
```

### Matriz de Endpoints Protegidos

| Endpoint | ESCALANTE | BOMBEIRO |
|----------|:---------:|:--------:|
| `POST /escalas/gerar` | ✓ | ✗ |
| `PATCH /escalas/:id/publicar` | ✓ | ✗ |
| `GET /escalas/:ano/:mes` | ✓ (todos status) | ✓ (PUBLICADA) |
| `POST /indisponibilidades` | ✓ | ✓ (próprio) |
| `PATCH /indisponibilidades/:id/aprovar` | ✓ | ✗ |
| `GET /auditoria` | ✓ | ✗ |

Implementação: decorator `@Roles(Papel.ESCALANTE)` + verificação adicional no service.

---

## 8. Proteção de Rotas — Frontend (Middleware)

```mermaid
flowchart TD
    START[Request para rota] --> PUBLIC{Rota pública?<br/>/login}
    PUBLIC -->|Sim| ALLOW[Permite]
    PUBLIC -->|Não| TOKEN{Access token<br/>válido?}

    TOKEN -->|Sim| ROLE{Rota escalante-only?}
    TOKEN -->|Não| REFRESH{Tenta refresh<br/>via API}

    REFRESH -->|Sucesso| ROLE
    REFRESH -->|Falha| LOGIN[Redirect /login]

    ROLE -->|Sim + BOMBEIRO| FORBIDDEN[Redirect /dashboard]
    ROLE -->|OK| ALLOW
```

**Rotas escalante-only no middleware:**
- `/bombeiros`, `/feriados`, `/escala/gerar`, `/substituicoes`, `/relatorios`, `/auditoria`

---

## 9. Tratamento de Erros

| Código | Situação | Ação Frontend |
|--------|----------|---------------|
| 401 | Token inválido/expirado | Tentar refresh → login |
| 403 | Papel insuficiente | Toast + redirect dashboard |
| 429 | Rate limit login | Mensagem "Aguarde 1 minuto" |

---

## 10. Segurança Complementar

| Medida | Detalhe |
|--------|---------|
| Rate limiting | 5 tentativas login/min/IP |
| Hash refresh | SHA-256 do token antes de persistir |
| Revogação em massa | Endpoint escalante revoga tokens de bombeiro desativado |
| HTTPS | Obrigatório em produção para cookies Secure |
| Payload mínimo | Sem dados sensíveis no JWT |

---

## 11. Endpoints Auth

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/login` | Público | Login |
| POST | `/api/auth/refresh` | Refresh cookie | Renovar access |
| POST | `/api/auth/logout` | Refresh cookie | Logout |
| GET | `/api/auth/me` | Bearer | Dados do usuário logado |

Ver também: [ARQUITETURA.md](./ARQUITETURA.md) · [MODULOS.md](./MODULOS.md)
