# Status da migração (backend próprio)

**Branch:** `migrate/own-backend`  
**Atualizado:** 2026-06-05

## Feito

- [x] Docs `docs/migracao/`
- [x] Switch `VITE_USE_FIREBASE_DATA` — dados Firestore, **auth Base44** (híbrido)
- [x] `firestoreEntity.js` — CRUD para todas entidades (interface Base44)
- [x] `server/index.ts` — `/api/chat` + `npm run dev:own`
- [x] `JotaAIChat` opcional
- [x] Seed MVP: `scripts/seed-data.mvp.json` + `scripts/seed-firebase-mvp.mjs`
- [x] `StudentLayout` usa `useMyProfile` (services, não Base44 direto)
- [x] Jota-Fit-Pro arquivado

## Testar Firebase (quando quiser)

1. Projeto Firebase `jota-fitnessapp` (ou outro) + Auth email/senha ou Google
2. `.env.local`:
   ```
   VITE_USE_FIREBASE_DATA=true
   VITE_FIREBASE_*=...
   VITE_BASE44_*=...   # auth ainda precisa
   ```
3. Deploy rules: `firebase deploy --only firestore:rules`
4. Seed: service account + `node scripts/seed-firebase-mvp.mjs`
5. Login Base44 com email que exista no Firestore **ou** alinhar emails do seed

## Próximo (pausado)

- [ ] Auth Firebase (trocar `AuthContext` + `authService`)
- [ ] Tela rotina 100% validada em Firebase
- [ ] Cortar Base44

## Rodar hoje (nada muda)

```bash
npm run dev
# VITE_USE_FIREBASE_DATA não definido ou false
```