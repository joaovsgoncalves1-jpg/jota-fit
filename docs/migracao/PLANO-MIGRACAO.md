# Plano — um app, backend seu

**Status:** pausado · **Base:** `jota-fit` · **Referência:** `Jota-Fit-Pro`

## Objetivo

Um único repositório (`jota-fit`) com front atual e **Firebase + API Node** (Gemini no server). Zero dependência Base44 no fim.

## Por que não começar pelo Pro

| | jota-fit | Jota-Fit-Pro |
|---|----------|--------------|
| Produto | Completo | Protótipo |
| Atualização | Jun/2026 | Mai/2026 |
| Entidades | 47 | ~5 arquivos úteis |

## Arquitetura alvo

```
jota-fit/
├── src/                 # UI (hoje)
├── src/services/        # NOVO: firebase CRUD
├── src/lib/firebase.js
├── server/              # NOVO: server.ts do Pro
│   └── index.ts
├── docs/
│   ├── MANIFESTO.md
│   └── migracao/        # esta pasta
├── firestore.rules
└── (removido) base44/
```

## O que quebra ao sair da Base44

1. Auth de usuário
2. CRUD de todas as entidades
3. Regras / permissões (coach vs aluno)
4. Deploy (Vercel + Firebase em vez de publish Base44)
5. Sync “Update base44 packages” — deixa de existir

## Estratégia: strangler (não big bang)

1. Firebase convive temporariamente — novas telas usam Firebase; resto ainda Base44.
2. Quando uma feature migra, remove-se o uso do SDK naquela tela.
3. Último passo: delete `base44/` e credenciais.

Se não der para manter duplo backend tempo limitado → foco só no **MVP Fase 0** e desliga Base44 para esse fluxo mínimo.

## Deploy sugerido (quando chegar lá)

- **Front:** Vercel (já tens CLI logada)
- **API:** Vercel serverless ou Railway
- **DB/Auth:** Firebase

## Riscos

| Risco | Mitigação |
|-------|-----------|
| Perder dados dos alunos na Base44 | Export manual antes; pedir export à Base44 se existir |
| Escopo explode (47 entidades) | Só Fase 0 até validar |
| Projeto parado e esquecer contexto | Issue GitHub + esta pasta |

## Critério de “pronto para apagar Pro”

- [ ] Login Firebase funciona
- [ ] Aluno vê 1 rotina e registra 1 treino
- [ ] Chat IA opcional (pode ser Fase 4)
- [ ] Repo Pro arquivado

## Critério de “pronto para cortar Base44”

- [ ] Nenhum `import` de `@base44` no `src/`
- [ ] `.env` sem `VITE_BASE44_*`
- [ ] App publicado fora da Base44
- [ ] Backup dos dados feito

---

*Última atualização do plano: 2026-06-05*