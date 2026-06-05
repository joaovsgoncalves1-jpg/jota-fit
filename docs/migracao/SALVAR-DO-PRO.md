# Copiar do Jota-Fit-Pro antes de apagar

Repo: `joaovsgoncalves1-jpg/Jota-Fit-Pro` (parado desde 2026-05-07)

## Arquivos para trazer para `jota-fit`

- [ ] `server.ts` — API + chat
- [ ] `src/components/chat/JotaAIChat.jsx`
- [ ] `src/lib/firebase.js`
- [ ] `firestore.rules`
- [ ] `firebase-applet-config.json` / `firebase-blueprint.json` (revisar se ainda válidos)
- [ ] `.env.example`
- [ ] `MANIFESTO-JOTA-FIT.md` → colocar em `docs/MANIFESTO.md` no jota-fit

## Comandos (quando for fazer)

```powershell
cd C:\Users\User\projects
git clone https://github.com/joaovsgoncalves1-jpg/Jota-Fit-Pro.git
git clone https://github.com/joaovsgoncalves1-jpg/jota-fit.git
# copiar arquivos manualmente ou cherry-pick; depois:
# GitHub → Settings → Archive repository (Pro)
```

## Não precisa portar

- `package.json` inteiro do Pro (versões antigas, nome `react-example`)
- Layout mínimo se o `jota-fit` já tiver equivalente melhor