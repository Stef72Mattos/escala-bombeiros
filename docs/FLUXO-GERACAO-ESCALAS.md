# Fluxo de Geração de Escalas

**Versão:** 1.0  
**Módulos:** EscalasModule, ScheduleEngineModule, AfastamentosModule, HistoricoModule, FeriadosModule  
**Regras:** RN01–RN06, RN13, RN14  

---

## 1. Visão Geral

O fluxo transforma dados operacionais (bombeiros, feriados, afastamentos, histórico) em uma **proposta de escala mensal** com status `RASCUNHO`, passando por validação de equidade e elegibilidade antes de persistência.

### Resultados possíveis

| Resultado | Descrição |
|-----------|-----------|
| **Sucesso total** | 31/31 plantões atribuídos, equidade OK |
| **Sucesso parcial** | Plantões atribuídos + alertas de equidade/déficit |
| **Falha** | Impossível cobrir todos os dias → alerta escalante |

---

## 2. Participantes

| Componente | Responsabilidade |
|------------|------------------|
| **EscalasController** | `POST /escalas/gerar` |
| **EscalasService** | Orquestração, transação Prisma |
| **ScheduleEngineService** | Algoritmo principal |
| **ShiftClassifierService** | PRETA vs VERMELHA (RN04, RN14) |
| **EligibilityService** | Quem pode trabalhar no dia (RN03, RN07–RN09, RN13) |
| **EquityScorerService** | Score de justiça (RN05, RN06) |
| **ScheduleValidatorService** | Validação final da proposta |
| **AfastamentosFacade** | Bloqueios unificados |
| **HistoricoService** | Plantões VERMELHA 12 meses |
| **AuditoriaService** | Log da geração |

---

## 3. Fluxo Principal

```mermaid
sequenceDiagram
    autonumber
    actor E as Escalante
    participant API as EscalasController
    participant SVC as EscalasService
    participant ENG as ScheduleEngine
    participant DB as PostgreSQL
    participant AUD as AuditoriaService

    E->>API: POST /api/escalas/gerar { ano, mes }
    API->>SVC: gerar(ano, mes, usuarioId)

    SVC->>DB: Verificar escala existente (ano, mes)
    alt Já existe RASCUNHO
        SVC-->>API: 409 Conflict
    end

    SVC->>SVC: buildScheduleContext()
    Note over SVC: Carrega bombeiros ATIVOS,<br/>feriados, afastamentos,<br/>histórico 12 meses

    SVC->>ENG: generate(context)
    ENG-->>SVC: ScheduleResult { plantoes[], alertas[] }

    SVC->>SVC: ScheduleValidator.validate(result)

    alt Validação crítica falhou
        SVC-->>API: 422 + alertas detalhados
    else OK ou alertas não-críticos
        SVC->>DB: BEGIN TRANSACTION
        SVC->>DB: INSERT Escala (RASCUNHO)
        SVC->>DB: INSERT Plantoes (batch)
        SVC->>DB: COMMIT
        SVC->>AUD: log(GERAR, escala, payload)
        SVC-->>API: 201 { escala, plantoes, alertas }
        API-->>E: Exibe calendário rascunho
    end
```

---

## 4. Construção do Contexto (`ScheduleContext`)

```mermaid
flowchart LR
    subgraph Input["Entrada"]
        A[ano, mes]
    end

    subgraph Load["Carga de Dados"]
        B[Bombeiros ATIVOS]
        C[Feriados do mês/ano]
        D[Férias sobrepostas]
        E[Atestados sobrepostos]
        F[Indispon. APROVADAS]
        G[Histórico 12 meses]
        H[Plantões mês anterior<br/>para RN03 descanso]
    end

    subgraph Output["ScheduleContext"]
        I[context object]
    end

    A --> B & C & D & E & F & G & H
    B & C & D & E & F & G & H --> I
```

### Estrutura conceitual do contexto

| Campo | Tipo | Origem |
|-------|------|--------|
| `ano`, `mes` | number | Request |
| `dias` | Date[] | 1..último dia do mês |
| `bombeiros` | BombeiroAtivo[] | BombeirosModule |
| `feriados` | Set\<date\> | FeriadosModule |
| `bloqueios` | Map\<bombeiroId, DateRange[]\> | AfastamentosFacade |
| `historicoVermelha` | Map\<bombeiroId, number\> | HistoricoService |
| `historicoTotal` | Map\<bombeiroId, number\> | HistoricoService |
| `ultimoPlantao` | Map\<bombeiroId, Date\> | Plantões mês anterior + parcial |

---

## 5. Algoritmo de Geração (Schedule Engine)

```mermaid
flowchart TD
    START([Início]) --> INIT[Inicializar contadores<br/>por bombeiro no mês]
    INIT --> LOOP{Para cada dia D<br/>do mês}

    LOOP --> CLASS[ShiftClassifier:<br/>tipo = PRETA ou VERMELHA]
    CLASS --> ELIG[EligibilityService:<br/>filtrar candidatos elegíveis]

    ELIG --> EMPTY{candidatos<br/>vazios?}
    EMPTY -->|Sim| ALERT1[Alerta: DÉFICIT dia D]
    ALERT1 --> LOOP

    EMPTY -->|Não| SCORE[EquityScorer:<br/>ordenar por score]
    SCORE --> ASSIGN[Atribuir melhor candidato]
    ASSIGN --> UPDATE[Atualizar contadores<br/>+ ultimoPlantao]
    UPDATE --> LOOP

    LOOP -->|Fim| VALID[ScheduleValidator:<br/>diferença máx 3 RN05]

    VALID --> OK{Equidade OK?}
    OK -->|Não| SWAP[Tentar heurística de swap<br/>entre dias flexíveis]
    SWAP --> VALID2{Melhorou?}
    VALID2 -->|Não| ALERT2[Alerta: EQUIDADE<br/>requer ajuste manual]
    VALID2 -->|Sim| DONE
    OK -->|Sim| DONE([Retorna ScheduleResult])
    ALERT2 --> DONE
```

---

## 6. Elegibilidade (`EligibilityService`)

Um bombeiro é **elegível** para o dia D se **todas** as condições forem verdadeiras:

| # | Condição | Regra |
|---|----------|-------|
| 1 | Status ATIVO | RN13 |
| 2 | Não está em férias no dia D | RN07 |
| 3 | Não possui atestado no dia D | RN08 |
| 4 | Indisponibilidade APROVADA não cobre D | RN09 |
| 5 | Descanso respeitado: `D >= ultimoPlantao + 48h` | RN03 |

### Cálculo de descanso (RN03)

```
Plantão anterior: início P_in (08:00) → fim P_fim (08:00+1d)
Próximo permitido: P_in + 2 dias às 08:00

Exemplo:
  Plantão seg 08:00 → próximo permitido qua 08:00
  Terça e quarta 00:00–07:59 = ainda em descanso se plantão seg→ter
```

---

## 7. Score de Equidade (`EquityScorerService`)

Score **menor = maior prioridade** (mais merece o plantão).

### Plantão VERMELHA (RN06)

```
score = (historicoVermelha12m * 1000)
      + (totalPlantoesMes * 10)
      + (historicoTotal12m * 1)
      + desempateMatricula
```

### Plantão PRETA

```
score = (totalPlantoesMes * 10)
      + (historicoTotal12m * 1)
      + desempateMatricula
```

### Penalidades dinâmicas (RN05)

Se atribuir plantão ao candidato violaria diferença > 3:
```
score += 10000  (penalidade alta — evitar)
```

---

## 8. Validação Final (`ScheduleValidatorService`)

| Validação | Tipo | Ação se falhar |
|-----------|------|----------------|
| 1 bombeiro/dia | Crítica | Rejeitar geração |
| Diferença total ≤ 3 | Alerta | Retornar com warning |
| Diferença PRETA ≤ 3 | Alerta | Retornar com warning |
| Diferença VERMELHA ≤ 3 | Alerta | Retornar com warning |
| Todos os dias cobertos | Crítica | Rejeitar + alerta déficit |
| Descanso em todos plantões | Crítica | Rejeitar |

---

## 9. Fluxo Pós-Geração (Edição → Aprovação → Publicação)

```mermaid
stateDiagram-v2
    [*] --> RASCUNHO: POST /gerar

    RASCUNHO --> RASCUNHO: PATCH plantão (manual)
    RASCUNHO --> APROVADA: POST /aprovar
    APROVADA --> PUBLICADA: POST /publicar
    PUBLICADA --> PUBLICADA: PATCH plantão + notificação
    PUBLICADA --> ARQUIVADA: Job fim do mês

    note right of RASCUNHO
        Escalante edita livremente
        Validação em tempo real
    end note

    note right of PUBLICADA
        Popula HistoricoPlantao
        Notifica todos bombeiros
    end note
```

### Edição manual (`PATCH /plantoes/:id`)

```mermaid
sequenceDiagram
    actor E as Escalante
    participant API as PlantoesController
    participant VAL as ScheduleValidator
    participant DB as PostgreSQL

    E->>API: PATCH { bombeiroId }
    API->>VAL: validateSingleShift(novoBombeiro, dia)
    alt Viola RN03/RN07/RN08/RN09
        VAL-->>API: 422 + detalhe regra
    else OK
        API->>DB: UPDATE Plantao (origem=MANUAL)
        API-->>E: 200
    end
```

---

## 10. Classificação PRETA / VERMELHA

```mermaid
flowchart TD
    D[Dia D] --> FER{É feriado<br/>cadastrado?}
    FER -->|Sim| VERM[VERMELHA]
    FER -->|Não| WD{Dia da semana?}
    WD -->|Sáb ou Dom| VERM
    WD -->|Seg-Sex| PRET[PRETA]
```

---

## 11. Alertas Retornados ao Escalante

| Código | Severidade | Mensagem exemplo |
|--------|------------|------------------|
| `DEFICIT_DIA` | ERROR | "Dia 15/08: nenhum bombeiro elegível" |
| `EQUIDADE_TOTAL` | WARN | "Diferença de 4 plantões entre A e B" |
| `EQUIDADE_VERMELHA` | WARN | "Diferença VERMELHA de 4 entre C e D" |
| `SWAP_SUGERIDO` | INFO | "Trocar plantão dia 10 e 22 melhora equidade" |

Alertas ERROR impedem geração; WARN permitem rascunho com revisão manual.

---

## 12. Endpoints Relacionados

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/escalas/gerar` | Gera rascunho |
| GET | `/api/escalas/:ano/:mes` | Consulta escala |
| PATCH | `/api/plantoes/:id` | Edição manual |
| POST | `/api/escalas/:id/aprovar` | Aprova |
| POST | `/api/escalas/:id/publicar` | Publica + histórico |
| GET | `/api/escalas/:id/equidade` | Resumo de equidade |

Ver também: [FLUXO-SUBSTITUICOES.md](./FLUXO-SUBSTITUICOES.md) · [FLUXO-NOTIFICACOES.md](./FLUXO-NOTIFICACOES.md)
