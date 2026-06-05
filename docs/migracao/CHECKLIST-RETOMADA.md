# Checklist — sessões curtas (projeto parado)

Marque `[x]` quando fizer. **Uma sessão = um bloco.**

---

## Sessão A (~30 min) — organização

- [ ] Clonar `jota-fit` em `C:\Users\User\projects\jota-fit`
- [ ] Branch: `git checkout -b migrate/own-backend`
- [ ] Copiar esta pasta `jota-fit-migracao` para `jota-fit/docs/migracao/`
- [ ] Copiar arquivos do Pro (`SALVAR-DO-PRO.md`)
- [ ] Arquivar repo `Jota-Fit-Pro` no GitHub (não deletar)

---

## Sessão B (~45 min) — Firebase

- [ ] Projeto Firebase (ou reutilizar do Pro)
- [ ] `firestore.rules` mínimas (student só lê/escreve o próprio dado)
- [ ] `.env.local` no jota-fit (sem Base44)
- [ ] `src/lib/firebase.js` integrado

---

## Sessão C (~60 min) — dados MVP

- [ ] Coleções Fase 0 (`ENTIDADES-MVP.md`)
- [ ] Seed manual: 1 aluno teste + 1 rotina
- [ ] Camada `src/services/` com funções CRUD (sem Base44 SDK)

---

## Sessão D (~60 min) — 1 tela funcionando

- [ ] Tela: aluno vê rotina do dia (dados Firebase)
- [ ] Tela: marcar treino feito → `WorkoutLog` / `SetLog`
- [ ] Remover import `@base44/sdk` **só dessas telas**

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