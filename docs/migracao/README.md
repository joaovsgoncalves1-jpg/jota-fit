# Jota Fit — migração Base44 → backend próprio

Projeto **em pausa**. Use isto quando tiver 30–60 min, sem pressão de terminar tudo.

## Decisão (já tomada)

| Ação | Repo |
|------|------|
| **Manter e evoluir** | `joaovsgoncalves1-jpg/jota-fit` |
| **Arquivar e apagar depois** | `joaovsgoncalves1-jpg/Jota-Fit-Pro` (só depois de copiar o que está em `SALVAR-DO-PRO.md`) |

## Arquivos desta pasta

- `PLANO-MIGRACAO.md` — fases e ordem de trabalho
- `CHECKLIST-RETOMADA.md` — tarefas curtas (modo “sem foco”)
- `ENTIDADES-MVP.md` — o que migrar primeiro (47 entidades Base44 mapeadas)
- `SALVAR-DO-PRO.md` — o que extrair do Jota-Fit-Pro antes de deletar

## Stack alvo (sugestão)

- **Front:** `jota-fit` / `src` (Vite + React) — reaproveitar
- **Backend:** API Node (`server.ts` do Pro como base)
- **Dados + auth:** Firebase (já usado no Pro) ou Supabase
- **IA:** Gemini no backend (não no client)

## Quando retomar

1. Abrir `CHECKLIST-RETOMADA.md` e fazer só o próximo item `[ ]`.
2. Trabalhar na branch `migrate/own-backend` (criar na primeira sessão).
3. Não apagar Base44 nem o repo Pro até o MVP rodar login + 1 rotina.

Issue de tracking no GitHub: ver repo `jota-fit` (label `migration` se existir).