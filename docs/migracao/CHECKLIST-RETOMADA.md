# Checklist — sessões curtas (projeto parado)

Marque `[x]` quando fizer. **Uma sessão = um bloco.**

---

## Sessão A (~30 min) — organização

- [x] Clonar `jota-fit` em `C:\Users\User\projects\jota-fit`
- [x] Branch: `migrate/own-backend`
- [x] Copiar esta pasta `jota-fit-migracao` para `jota-fit/docs/migracao/`
- [x] Copiar arquivos do Pro (`SALVAR-DO-PRO.md`)
- [x] Arquivar repo `Jota-Fit-Pro` no GitHub

---

## Sessão B (~45 min) — Firebase

- [x] Projeto Firebase (reutilizar `jota-fitnessapp` do Pro)
- [x] `firestore.rules` + `firebase.json`
- [x] `.env.example` documentado
- [x] `src/lib/firebase.js` integrado

---

## Sessão C (~60 min) — dados MVP

- [x] `firestoreEntity.js` (todas coleções)
- [x] Seed: `scripts/seed-data.mvp.json` + `seed-firebase-mvp.mjs`
- [x] Services usam `baseClient` (Firebase quando `VITE_USE_FIREBASE_DATA=true`)

---

## Sessão D (~60 min) — 1 tela funcionando

- [x] `StudentLayout` sem import direto Base44
- [ ] Deploy rules + seed no Firebase real
- [ ] Validar `MinhaRotina` com `VITE_USE_FIREBASE_DATA=true`
- [ ] Validar `ExecutarTreino` + `SetLog`

---

## Sessão E — só quando MVP estiver estável

- [ ] Despublicar / parar app na Base44
- [ ] Apagar pasta `base44/` e deps npm Base44
- [ ] Deletar repo `Jota-Fit-Pro`

---

## Se tiver 15 min e zero energia

- [ ] Ler `MANIFESTO-JOTA-FIT.md` no Pro
- [ ] Comentar na issue do GitHub o que travou
- [ ] Nada mais — válido também