# Jota Fit

App de treino com rotina, biblioteca de exercícios e execução guiada, criado por **João Victor Gonçalves** para quem treina calistenia e musculação com consistência.

**Ao vivo:** https://jota-fit.vercel.app

## O que tem

- **Aluno:** home com a rotina do dia, execução de treino série a série, biblioteca de exercícios, progresso e carga da semana, check-in, feed e perfil.
- **Instrutor:** painel com alunos, treinos, desafios, missões e habilidades.
- **Gamificação:** XP, níveis, conquistas, missões e ranking.

## Stack

- React + Vite
- Tailwind CSS e componentes Radix UI
- TanStack Query para dados e React Router para navegação
- Recharts para gráficos de evolução
- Backend e entidades no Base44 (esquemas em `base44/entities`)

## Rodar localmente

```bash
npm install
npm run dev
```

Crie um `.env.local` com as variáveis do seu app Base44:

```
VITE_BASE44_APP_ID=
VITE_BASE44_APP_BASE_URL=
```

## Status

Projeto em evolução. O produto principal de rotina do João hoje é o [Praxis](https://github.com/joaovsgoncalves1-jpg/praxis-showcase), que absorveu a base deste app.
