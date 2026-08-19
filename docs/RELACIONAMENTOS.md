# Relacionamentos entre Entidades

**Versão:** 1.0  

---

## Diagrama Entidade-Relacionamento

```mermaid
erDiagram
    USUARIO ||--o| BOMBEIRO : "possui (0..1)"
    USUARIO ||--o{ REFRESH_TOKEN : "tem"
    USUARIO ||--o{ NOTIFICACAO : "recebe"
    USUARIO ||--o{ AUDITORIA : "registra"
    USUARIO ||--o{ ESCALA : "gera/aprova"

    BOMBEIRO ||--o{ FERIAS : "possui"
    BOMBEIRO ||--o{ ATESTADO : "possui"
    BOMBEIRO ||--o{ INDISPONIBILIDADE : "solicita"
    BOMBEIRO ||--o{ PLANTAO : "escalado em"
    BOMBEIRO ||--o{ HISTORICO_PLANTAO : "acumula"
    BOMBEIRO ||--o{ SUBSTITUICAO : "original/substituto"

    ESCALA ||--|{ PLANTAO : "contém"
    PLANTAO ||--o| HISTORICO_PLANTAO : "gera"
    PLANTAO ||--o{ SUBSTITUICAO : "pode ter"

    FERIADO }o--|| PLANTAO : "classifica (lógico)"

    USUARIO {
        uuid id PK
        string email UK
        enum papel
    }

    BOMBEIRO {
        uuid id PK
        uuid usuarioId FK UK
        string matricula UK
        enum status
    }

    ESCALA {
        uuid id PK
        int ano
        int mes
        enum status
    }

    PLANTAO {
        uuid id PK
        uuid escalaId FK
        uuid bombeiroId FK
        timestamp dataInicio UK
        enum tipo
    }
```

---

## Relacionamentos Detalhados

### 1. Usuario ↔ Bombeiro

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | 1 : 0..1 |
| **Direção** | Todo `Bombeiro` possui exatamente 1 `Usuario`; todo `Usuario` com papel BOMBEIRO possui 1 `Bombeiro` |
| **FK** | `Bombeiro.usuarioId` → `Usuario.id` |
| **Unique** | `usuarioId` unique em Bombeiro |
| **Cascade** | ON DELETE RESTRICT (não excluir usuário com bombeiro ativo) |
| **Nota** | Escalante tem `Usuario` sem registro em `Bombeiro` |

```
Usuario (1) ──────── (0..1) Bombeiro
   │                           │
   ESCALANTE                   matricula, status
   BOMBEIRO ──────────────────► dados operacionais
```

---

### 2. Bombeiro ↔ Afastamentos (Ferias, Atestado, Indisponibilidade)

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | 1 : N (cada tipo) |
| **FK** | `*.bombeiroId` → `Bombeiro.id` |
| **Cascade** | ON DELETE CASCADE (soft delete preferível em produção) |
| **Regra** | Ferias e Atestado bloqueiam escalação; Indisponibilidade só se APROVADA |

```
Bombeiro (1) ──── (N) Ferias
           ──── (N) Atestado
           ──── (N) Indisponibilidade
                         │
                         └── avaliadoPor → Usuario (Escalante)
```

---

### 3. Escala ↔ Plantao

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | 1 : N (28–31 plantões/mês) |
| **FK** | `Plantao.escalaId` → `Escala.id` |
| **Unique** | `(escalaId, dataInicio)` — 1 bombeiro por dia |
| **Cascade** | ON DELETE CASCADE (apenas em RASCUNHO; PUBLICADA usa soft archive) |
| **Regra** | RN01, RN10 |

```
Escala (1) ──────── (N) Plantao
  ano/mes              dataInicio 08:00
  status               bombeiroId
  versao               tipo PRETA|VERMELHA
```

---

### 4. Bombeiro ↔ Plantao

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | 1 : N |
| **FK** | `Plantao.bombeiroId` → `Bombeiro.id` |
| **Restrição lógica** | RN03 — descanso 24h entre plantões do mesmo bombeiro |
| **Restrição lógica** | RN13 — apenas bombeiros ATIVOS |

```
Bombeiro (1) ──────── (N) Plantao
  status ATIVO            escalaId + dataInicio (unique por escala)
```

---

### 5. Plantao ↔ HistoricoPlantao

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | 1 : 0..1 |
| **FK** | `HistoricoPlantao.plantaoId` → `Plantao.id` |
| **Unique** | `plantaoId` unique |
| **População** | Somente quando escala é PUBLICADA ou substituição confirmada |
| **Propósito** | Consulta O(1) do histórico 12 meses (RN06) |

```
Plantao (1) ──────── (0..1) HistoricoPlantao
  PUBLICADA                 bombeiroId + tipo + data
                            anoMes
```

---

### 6. Plantao ↔ Substituicao

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | 1 : N (múltiplas substituições ao longo do tempo) |
| **FK** | `Substituicao.plantaoId` → `Plantao.id` |
| **FK** | `bombeiroOriginalId`, `bombeiroSubstitutoId` → `Bombeiro.id` |
| **FK** | `confirmadaPorId` → `Usuario.id` |
| **Efeito** | Atualiza `Plantao.bombeiroId` e `origem = SUBSTITUICAO` |

```
Plantao (1) ──────── (N) Substituicao
                              │
                              ├── bombeiroOriginal
                              ├── bombeiroSubstituto
                              └── confirmadaPor (Escalante)
```

---

### 7. Feriado ↔ Plantao (relacionamento lógico)

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | N : M (via data) |
| **Implementação** | Sem FK direta; `ShiftClassifier` consulta `Feriado.data = DATE(plantao.dataInicio)` |
| **Regra** | RN04, RN14 — feriado em dia útil → tipo VERMELHA |

```
Feriado.data ──match──► Plantao.dataInicio (DATE)
                              │
                              └── tipo = VERMELHA
```

---

### 8. Usuario ↔ Notificacao

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | 1 : N |
| **FK** | `Notificacao.usuarioId` → `Usuario.id` |
| **Cascade** | ON DELETE CASCADE |
| **Metadata** | JSONB com referências opcionais a escalaId, plantaoId |

---

### 9. Usuario ↔ Auditoria

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | 1 : N |
| **FK** | `Auditoria.usuarioId` → `Usuario.id` (nullable para jobs sistema) |
| **Polimorfismo** | `entidade` + `entidadeId` referenciam qualquer tabela |

---

### 10. Usuario ↔ Escala (geração e aprovação)

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | 1 : N |
| **FK** | `Escala.geradaPorId`, `aprovadaPorId` → `Usuario.id` |
| **Papel** | Apenas ESCALANTE |

---

### 11. Usuario ↔ RefreshToken

| Aspecto | Detalhe |
|---------|---------|
| **Cardinalidade** | 1 : N (múltiplos dispositivos) |
| **FK** | `RefreshToken.usuarioId` → `Usuario.id` |
| **Cascade** | ON DELETE CASCADE no logout global |

---

## Matriz de Cardinalidades

| Entidade A | Relação | Entidade B | Min | Max |
|------------|---------|------------|-----|-----|
| Usuario | possui | Bombeiro | 0 | 1 |
| Usuario | recebe | Notificacao | 0 | N |
| Usuario | registra | Auditoria | 0 | N |
| Usuario | gera | Escala | 0 | N |
| Usuario | tem | RefreshToken | 0 | N |
| Bombeiro | possui | Ferias | 0 | N |
| Bombeiro | possui | Atestado | 0 | N |
| Bombeiro | solicita | Indisponibilidade | 0 | N |
| Bombeiro | escalado | Plantao | 0 | N |
| Bombeiro | histórico | HistoricoPlantao | 0 | N |
| Escala | contém | Plantao | 28 | 31 |
| Plantao | gera | HistoricoPlantao | 0 | 1 |
| Plantao | sofre | Substituicao | 0 | N |
| Feriado | classifica | Plantao | 0 | N (lógico) |

---

## Integridade Referencial

| Regra | Implementação |
|-------|---------------|
| Não excluir bombeiro com plantões futuros publicados | RESTRICT ou soft delete |
| Não duplicar escala ativa no mesmo mês | `UNIQUE(ano, mes)` onde status ≠ ARQUIVADA |
| Histórico imutável | HistoricoPlantao sem UPDATE/DELETE |
| Auditoria imutável | Auditoria append-only, sem UPDATE/DELETE |
| Plantão único por dia | `UNIQUE(escalaId, dataInicio)` |

---

## Consultas Críticas Habilitadas pelos Relacionamentos

| Consulta | Joins envolvidos |
|----------|------------------|
| Bombeiros elegíveis no dia D | Bombeiro LEFT JOIN Ferias, Atestado, Indisponibilidade, Plantao (descanso) |
| Histórico VERMELHA 12 meses | HistoricoPlantao WHERE bombeiroId AND tipo=VERMELHA AND data >= D-12m |
| Plantões do mês publicado | Escala JOIN Plantao JOIN Bombeiro WHERE status=PUBLICADA |
| Substitutos elegíveis | Bombeiro NOT IN afastamentos AND NOT viola descanso ORDER BY score |
| Notificações não lidas | Notificacao WHERE usuarioId AND lida=false |

Ver também: [ENTIDADES.md](./ENTIDADES.md) · [ARQUITETURA.md](./ARQUITETURA.md)
