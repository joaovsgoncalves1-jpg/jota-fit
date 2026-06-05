# Status da migração (backend próprio)

**Branch:** `migrate/own-backend`  
**Atualizado:** 2026-06-05

## Feito nesta branch

- [x] Docs em `docs/migracao/`
- [x] `services/_base` com switch `VITE_DATA_BACKEND` (padrão: `base44`)
- [x] `server/index.ts` — `/api/chat` + health
- [x] `src/lib/firebase.js` + `JotaAIChat` (só aparece com Firebase configurado)
- [x] `firestore.rules` esboço MVP
- [x] Repo **Jota-Fit-Pro** arquivado no GitHub

## Ainda não feito (projeto pausado)

- [ ] Implementar `firebaseClient` para entidades Fase 0
- [ ] `VITE_DATA_BACKEND=firebase` em produção
- [ ] Remover pasta `base44/`
- [ ] Deletar repo Pro (já arquivado)

## Como rodar hoje (sem quebrar nada)

```bash
npm install
cp .env.example .env.local
# preencher VITE_BASE44_* como antes
npm run dev
```

## Chat IA (opcional)

```bash
# .env.local: VITE_ENABLE_JOTA_CHAT=true + vars Firebase + GEMINI_API_KEY
npm run dev:own
```

## Próximo passo

`docs/migracao/CHECKLIST-RETOMADA.md` → Sessão C