// Admin-only: popula ExerciseSubstitution com 60+ substituições mapeadas por slug.
// Limpa todas as substituições existentes e recria. Reporta slugs faltantes.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Lista mestre de substituições. from = slug do exercício original. Cada item em "to":
// { slug, reason, equipment_context, difficulty_match, same_movement_pattern, notes }
const SUBSTITUTIONS = [
  // ---------- SUPINO RETO (peitoral médio - empurrar horizontal) ----------
  { from: 'supino-reto-barra', to: [
    { slug: 'supino-reto-halteres',    reason: 'Sem barra livre disponível',        equipment_context: 'Halteres + banco', difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Mais amplitude e controle articular.' },
    { slug: 'supino-maquina',          reason: 'Sem spotter / iniciante',           equipment_context: 'Máquina de supino', difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Trajetória guiada, ideal para volume.' },
    { slug: 'flexao-bracos',           reason: 'Sem academia / em casa',            equipment_context: 'Apenas peso corporal', difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Eleve os pés para aumentar a carga.' },
    { slug: 'crossover-cabos',         reason: 'Foco em pico de contração',         equipment_context: 'Polia dupla',       difficulty_match: 'easier', same_movement_pattern: false, notes: 'Isolador, complementa bem o supino.' },
  ]},

  // ---------- SUPINO INCLINADO (peitoral superior) ----------
  { from: 'supino-inclinado-barra', to: [
    { slug: 'supino-inclinado-halteres', reason: 'Sem barra disponível',            equipment_context: 'Halteres + banco inclinado', difficulty_match: 'same', same_movement_pattern: true, notes: 'Trabalha estabilizadores extras.' },
    { slug: 'supino-inclinado-maquina',  reason: 'Iniciante / sem spotter',         equipment_context: 'Máquina de supino inclinado', difficulty_match: 'easier', same_movement_pattern: true, notes: 'Trajetória fixa, foco no peitoral alto.' },
    { slug: 'flexao-declinada',          reason: 'Em casa / sem equipamento',       equipment_context: 'Apenas peso corporal',        difficulty_match: 'easier', same_movement_pattern: true, notes: 'Pés elevados — mira parte alta do peitoral.' },
    { slug: 'crucifixo-inclinado',       reason: 'Foco em alongamento/peitoral alto', equipment_context: 'Halteres + banco inclinado', difficulty_match: 'easier', same_movement_pattern: false, notes: 'Isolador para finalizar o estímulo.' },
  ]},

  // ---------- DESENVOLVIMENTO (ombros - empurrar vertical) ----------
  { from: 'desenvolvimento-barra', to: [
    { slug: 'desenvolvimento-halteres',  reason: 'Sem barra / mais segurança',      equipment_context: 'Halteres + banco', difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Mais amplitude por braço.' },
    { slug: 'desenvolvimento-maquina',   reason: 'Trajetória guiada',                equipment_context: 'Máquina',          difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Bom para volume com fadiga.' },
    { slug: 'arnold-press',              reason: 'Variação completa do deltoide',    equipment_context: 'Halteres',         difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Recruta anterior + lateral.' },
    { slug: 'pike-pushup',               reason: 'Em casa / calistenia',             equipment_context: 'Apenas peso corporal', difficulty_match: 'harder', same_movement_pattern: true, notes: 'Quadril alto, mira ombros.' },
  ]},

  // ---------- ELEVAÇÃO LATERAL ----------
  { from: 'elevacao-lateral-halteres', to: [
    { slug: 'elevacao-lateral-cabo',     reason: 'Tensão constante',                 equipment_context: 'Polia baixa unilateral', difficulty_match: 'same', same_movement_pattern: true, notes: 'Tensão na descida = mais estímulo.' },
    { slug: 'elevacao-lateral-maquina',  reason: 'Trajetória guiada',                equipment_context: 'Máquina específica',     difficulty_match: 'easier', same_movement_pattern: true, notes: 'Bom para drop sets.' },
    { slug: 'elevacao-lateral-elastico', reason: 'Em casa / viagem',                 equipment_context: 'Elástico de mini band ou tubular', difficulty_match: 'easier', same_movement_pattern: true, notes: 'Pise no elástico e levante.' },
  ]},

  // ---------- AGACHAMENTO LIVRE (pernas - quadríceps) ----------
  { from: 'agachamento-livre', to: [
    { slug: 'leg-press',                 reason: 'Dor lombar / iniciante',           equipment_context: 'Máquina leg press 45º', difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Tira a coluna da equação.' },
    { slug: 'agachamento-hack',          reason: 'Sem barra / foco quadríceps',      equipment_context: 'Máquina hack',           difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Postura guiada, foco em quadríceps.' },
    { slug: 'agachamento-bulgaro',       reason: 'Sem barra ou foco unilateral',     equipment_context: 'Halteres + banco',       difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Ótimo para correção de lados.' },
    { slug: 'agachamento-goblet',        reason: 'Iniciante / sem barra',            equipment_context: 'Halter ou kettlebell',   difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Excelente para aprender padrão.' },
    { slug: 'agachamento-livre-corpo',   reason: 'Em casa / sem peso',               equipment_context: 'Peso corporal',          difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Aumente reps ou tempo sob tensão.' },
  ]},

  // ---------- LEG PRESS ----------
  { from: 'leg-press', to: [
    { slug: 'agachamento-hack',          reason: 'Leg press ocupado',                equipment_context: 'Máquina hack',           difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Estímulo similar para quadríceps.' },
    { slug: 'agachamento-livre',         reason: 'Foco em força global',             equipment_context: 'Barra olímpica + rack',  difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Mais demanda de core e estabilidade.' },
    { slug: 'agachamento-goblet',        reason: 'Sem máquina',                      equipment_context: 'Halter pesado',          difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Faça com 12-20 reps.' },
    { slug: 'avanco-halteres',           reason: 'Foco unilateral',                  equipment_context: 'Halteres',               difficulty_match: 'same',   same_movement_pattern: false, notes: 'Bom para corrigir desequilíbrios.' },
  ]},

  // ---------- CADEIRA EXTENSORA (quadríceps isolado) ----------
  { from: 'cadeira-extensora', to: [
    { slug: 'sissy-squat',               reason: 'Cadeira ocupada / em casa',        equipment_context: 'Peso corporal (apoio leve)', difficulty_match: 'harder', same_movement_pattern: true, notes: 'Isola o quadríceps de forma intensa.' },
    { slug: 'flexao-nordica-inversa',    reason: 'Sem máquina / foco quadríceps',    equipment_context: 'Apoio para os pés',      difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Excelente alternativa em casa.' },
    { slug: 'agachamento-bulgaro',       reason: 'Foco unilateral em quadríceps',    equipment_context: 'Halteres + banco',       difficulty_match: 'harder', same_movement_pattern: false, notes: 'Tronco mais ereto = mais quadríceps.' },
    { slug: 'agachamento-hack',          reason: 'Foco em quadríceps com carga',     equipment_context: 'Máquina hack',           difficulty_match: 'same',   same_movement_pattern: false, notes: 'Pés mais altos para isolar quadríceps.' },
  ]},

  // ---------- CADEIRA FLEXORA (posterior de coxa) ----------
  { from: 'cadeira-flexora', to: [
    { slug: 'mesa-flexora',              reason: 'Cadeira ocupada',                  equipment_context: 'Mesa flexora',           difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Estímulo praticamente idêntico.' },
    { slug: 'stiff-barra',               reason: 'Sem máquina / foco posterior',     equipment_context: 'Barra livre',            difficulty_match: 'harder', same_movement_pattern: false, notes: 'Hip hinge: trabalha posterior + glúteo.' },
    { slug: 'flexao-nordica',            reason: 'Em casa / força excêntrica',       equipment_context: 'Apoio para os pés',      difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Padrão ouro para isquiotibiais.' },
    { slug: 'good-morning',              reason: 'Foco em hip hinge',                equipment_context: 'Barra ou peso corporal', difficulty_match: 'harder', same_movement_pattern: false, notes: 'Trabalha cadeia posterior inteira.' },
  ]},

  // ---------- STIFF / DEADLIFT ROMENO ----------
  { from: 'stiff-barra', to: [
    { slug: 'stiff-halteres',            reason: 'Sem barra / mais leve',            equipment_context: 'Halteres',               difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Bom para aprender o hip hinge.' },
    { slug: 'good-morning',              reason: 'Foco em cadeia posterior',         equipment_context: 'Barra nas costas',       difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Carga mais leve, mais lombar.' },
    { slug: 'cadeira-flexora',           reason: 'Sem barra / iniciante',            equipment_context: 'Máquina',                difficulty_match: 'easier', same_movement_pattern: false, notes: 'Isola posterior de coxa.' },
    { slug: 'kettlebell-swing',          reason: 'Variação dinâmica',                equipment_context: 'Kettlebell',             difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Hip hinge explosivo.' },
  ]},

  // ---------- AVANÇO / LUNGE ----------
  { from: 'avanco-halteres', to: [
    { slug: 'agachamento-bulgaro',       reason: 'Foco unilateral mais intenso',     equipment_context: 'Halteres + banco',       difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Mais demanda do quadríceps.' },
    { slug: 'walking-lunge',             reason: 'Mais dinâmico / cardio',           equipment_context: 'Halteres',               difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Caminhada com cargas.' },
    { slug: 'step-up',                   reason: 'Joelho sensível / iniciante',      equipment_context: 'Banco / step + halteres', difficulty_match: 'easier', same_movement_pattern: true, notes: 'Sobe controlado, desce devagar.' },
  ]},

  // ---------- REMADA (puxar horizontal - dorsal/costas) ----------
  { from: 'remada-curvada-barra', to: [
    { slug: 'remada-cavalinho',          reason: 'Lombar sensível',                  equipment_context: 'Barra T ou landmine',    difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Apoio reduz tensão lombar.' },
    { slug: 'remada-halteres-banco',     reason: 'Foco unilateral',                  equipment_context: 'Halter + banco',         difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Apoie peito e cabeça.' },
    { slug: 'remada-maquina',            reason: 'Iniciante / volume',               equipment_context: 'Máquina remada',         difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Trajetória fixa, fácil progressão.' },
    { slug: 'remada-baixa-cabo',         reason: 'Tensão constante',                 equipment_context: 'Polia baixa + triângulo', difficulty_match: 'same', same_movement_pattern: true, notes: 'Excelente isolador de costas.' },
    { slug: 'australian-pullup',         reason: 'Em casa / sem peso',               equipment_context: 'Barra baixa ou TRX',     difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Quanto mais horizontal, mais difícil.' },
  ]},

  // ---------- REMADA HALTERES (uni) ----------
  { from: 'remada-halteres-banco', to: [
    { slug: 'remada-curvada-barra',      reason: 'Mais carga / bilateral',           equipment_context: 'Barra livre',            difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Mais demanda lombar.' },
    { slug: 'remada-baixa-cabo',         reason: 'Tensão constante',                 equipment_context: 'Polia baixa',            difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Sentado, sem carga axial.' },
    { slug: 'remada-elastico',           reason: 'Em casa / sem haltere',            equipment_context: 'Elástico ancorado',      difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Resistência progressiva no fim.' },
  ]},

  // ---------- PUXADA ALTA (puxar vertical - dorsal) ----------
  { from: 'puxada-alta', to: [
    { slug: 'puxada-pegada-fechada',     reason: 'Foco em bíceps / dorsal',          equipment_context: 'Pulley + triângulo',     difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Mais ativação de bíceps.' },
    { slug: 'pullup-com-elastico',       reason: 'Migrar para barra fixa',           equipment_context: 'Barra + elástico',       difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Próximo passo para a barra.' },
    { slug: 'remada-elastico',           reason: 'Em casa / viagem',                 equipment_context: 'Elástico forte ancorado em alto', difficulty_match: 'easier', same_movement_pattern: true, notes: 'Ancore numa porta alta.' },
    { slug: 'barra-fixa-pronada',        reason: 'Aluno avançado',                   equipment_context: 'Apenas barra fixa',      difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Padrão ouro de puxada vertical.' },
  ]},

  // ---------- PULL-UP / BARRA FIXA ----------
  { from: 'barra-fixa-pronada', to: [
    { slug: 'pullup-com-elastico',       reason: 'Ainda não consegue limpa',         equipment_context: 'Barra fixa + elástico',  difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Reduza a assistência ao longo das semanas.' },
    { slug: 'australian-pullup',         reason: 'Sem barra alta',                   equipment_context: 'Barra baixa ou TRX',     difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Quanto mais horizontal, mais difícil.' },
    { slug: 'puxada-alta',               reason: 'Não há barra fixa disponível',     equipment_context: 'Pulley',                 difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Use 70% do peso corporal.' },
    { slug: 'barra-negativa',            reason: 'Construir base para a primeira',   equipment_context: 'Barra fixa + caixa/banco', difficulty_match: 'easier', same_movement_pattern: true, notes: 'Suba assistido, desça em 5s.' },
    { slug: 'remada-elastico',           reason: 'Em casa / sem barra',              equipment_context: 'Elástico ancorado em alto', difficulty_match: 'easier', same_movement_pattern: false, notes: 'Mira o mesmo grupo muscular.' },
  ]},

  // ---------- DIPS ----------
  { from: 'mergulho-paralelas', to: [
    { slug: 'mergulho-banco',            reason: 'Iniciante',                        equipment_context: 'Banco',                  difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Pés no chão para reduzir carga.' },
    { slug: 'mergulho-assistido-elastico', reason: 'Sem força para limpa',           equipment_context: 'Paralelas + elástico',   difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Reduza a assistência mês a mês.' },
    { slug: 'supino-fechado',            reason: 'Sem paralelas',                    equipment_context: 'Barra ou halteres',      difficulty_match: 'same',   same_movement_pattern: false, notes: 'Mira tríceps + peitoral inferior.' },
    { slug: 'flexao-bracos',             reason: 'Em casa / sem paralelas',          equipment_context: 'Apenas peso corporal',   difficulty_match: 'easier', same_movement_pattern: false, notes: 'Mãos próximas para mais tríceps.' },
  ]},

  // ---------- ROSCA BÍCEPS ----------
  { from: 'rosca-direta-barra', to: [
    { slug: 'rosca-direta-halteres',     reason: 'Variação unilateral',              equipment_context: 'Halteres',               difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Permite supinar no caminho.' },
    { slug: 'rosca-martelo',             reason: 'Foco em braquial',                 equipment_context: 'Halteres',               difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Pegada neutra, mais espessura.' },
    { slug: 'rosca-scott',               reason: 'Foco em pico isolado',             equipment_context: 'Banco scott + barra w',  difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Elimina trapézio do movimento.' },
    { slug: 'rosca-cabo',                reason: 'Tensão constante',                 equipment_context: 'Polia baixa',            difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Bom para finalizar com drop.' },
    { slug: 'rosca-elastico',            reason: 'Em casa',                          equipment_context: 'Elástico',               difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Pise no elástico e role.' },
  ]},

  // ---------- TRÍCEPS PULLEY ----------
  { from: 'triceps-pulley', to: [
    { slug: 'triceps-frances',           reason: 'Foco em alongamento',              equipment_context: 'Halteres ou barra',      difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Trabalha cabeça longa.' },
    { slug: 'triceps-testa',             reason: 'Sem polia',                        equipment_context: 'Barra w + banco',        difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Cuide dos cotovelos.' },
    { slug: 'triceps-coice',             reason: 'Em casa',                          equipment_context: 'Halter ou elástico',     difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Foco em pico de contração.' },
    { slug: 'flexao-fechada',            reason: 'Sem academia',                     equipment_context: 'Apenas peso corporal',   difficulty_match: 'easier', same_movement_pattern: false, notes: 'Mãos em diamante.' },
  ]},

  // ---------- ABDOMINAL ----------
  { from: 'abdominal-supra', to: [
    { slug: 'prancha-abdominal',         reason: 'Lombar sensível',                  equipment_context: 'Apenas peso corporal',   difficulty_match: 'easier', same_movement_pattern: false, notes: 'Foco em estabilidade — anti-extensão.' },
    { slug: 'hollow-body-hold',          reason: 'Foco em core anterior',            equipment_context: 'Apenas peso corporal',   difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Padrão da ginástica.' },
    { slug: 'cable-crunch',              reason: 'Foco em hipertrofia',              equipment_context: 'Polia alta',             difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Permite carga progressiva.' },
    { slug: 'elevacao-pernas',           reason: 'Foco em abdômen inferior',         equipment_context: 'Barra fixa ou paralelas', difficulty_match: 'harder', same_movement_pattern: true, notes: 'Joelhos flexionados se for difícil.' },
  ]},

  // ---------- PRANCHA ----------
  { from: 'prancha-abdominal', to: [
    { slug: 'hollow-body-hold',          reason: 'Foco em compressão / hollow',      equipment_context: 'Solo',                   difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Lombar colada no chão.' },
    { slug: 'ab-wheel',                  reason: 'Avançado / força anti-extensão',   equipment_context: 'Roda abdominal',         difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Comece de joelhos.' },
    { slug: 'prancha-lateral',           reason: 'Foco em oblíquos',                 equipment_context: 'Solo',                   difficulty_match: 'same',   same_movement_pattern: false, notes: 'Trabalha core lateral.' },
  ]},

  // ---------- L-SIT ----------
  { from: 'l-sit-paralelas', to: [
    { slug: 'tuck-lsit',                 reason: 'Não chegou no L-Sit completo',     equipment_context: 'Paralelas ou solo',      difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Joelhos flexionados — base.' },
    { slug: 'one-leg-lsit',              reason: 'Progressão para o full',           equipment_context: 'Paralelas ou solo',      difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Treine os dois lados igualmente.' },
    { slug: 'tuck-hold',                 reason: 'Iniciante absoluto',               equipment_context: 'Solo / paralelas baixas', difficulty_match: 'easier', same_movement_pattern: true, notes: 'Construa base de compressão.' },
    { slug: 'hollow-body-hold',          reason: 'Sem paralelas',                    equipment_context: 'Solo',                   difficulty_match: 'easier', same_movement_pattern: false, notes: 'Trabalha mesmo padrão de core.' },
  ]},

  // ---------- FRONT LEVER ----------
  { from: 'full-front-lever', to: [
    { slug: 'straddle-front-lever',      reason: 'Não tem força para o full',        equipment_context: 'Barra fixa ou argolas',  difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Pernas afastadas reduzem alavanca.' },
    { slug: 'one-leg-front-lever',       reason: 'Progressão intermediária',         equipment_context: 'Barra fixa ou argolas',  difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Treine os dois lados.' },
    { slug: 'advanced-tuck-front-lever', reason: 'Construir base',                   equipment_context: 'Barra fixa ou argolas',  difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Quadril em extensão completa.' },
    { slug: 'front-lever-tuck',          reason: 'Iniciante absoluto na skill',      equipment_context: 'Barra fixa',             difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Joelhos no peito — primeiro passo.' },
  ]},

  // ---------- PISTOL SQUAT ----------
  { from: 'pistol-squat', to: [
    { slug: 'box-pistol-squat',          reason: 'Sem força para pistol completo',   equipment_context: 'Banco baixo',            difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Reduza altura do banco gradualmente.' },
    { slug: 'shrimp-squat-assistido',    reason: 'Variação unilateral alternativa',  equipment_context: 'Apenas peso corporal',   difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Trabalha quadríceps + estabilidade.' },
    { slug: 'agachamento-bulgaro',       reason: 'Em academia / com peso',           equipment_context: 'Halteres + banco',       difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Caminho mais simples para força unilateral.' },
  ]},

  // ---------- PANTURRILHA ----------
  { from: 'panturrilha-em-pe', to: [
    { slug: 'panturrilha-sentado',       reason: 'Foco em sóleo',                    equipment_context: 'Máquina sentado',        difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Joelho flexionado isola o sóleo.' },
    { slug: 'panturrilha-leg-press',     reason: 'Sem máquina específica',           equipment_context: 'Leg press',              difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Empurre só com a ponta dos pés.' },
    { slug: 'panturrilha-unilateral',    reason: 'Foco em correção unilateral',      equipment_context: 'Step + haltere',         difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Faça com amplitude completa.' },
  ]},

  // ---------- GLÚTEOS ----------
  { from: 'hip-thrust', to: [
    { slug: 'gluteo-maquina',            reason: 'Sem barra / em academia comum',    equipment_context: 'Máquina de glúteo',      difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Mesma cinética em máquina.' },
    { slug: 'elevacao-pelvica',          reason: 'Iniciante / em casa',              equipment_context: 'Solo',                   difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Foco em contração.' },
    { slug: 'kettlebell-swing',          reason: 'Foco em hip hinge explosivo',      equipment_context: 'Kettlebell',             difficulty_match: 'same',   same_movement_pattern: false, notes: 'Cardio + glúteo.' },
  ]},

  // ---------- CRUCIFIXO INCLINADO (alternativa para supino inclinado) ----------
  { from: 'crucifixo-inclinado-halteres', to: [
    { slug: 'supino-inclinado-halteres', reason: 'Foco em força composta',         equipment_context: 'Halteres + banco inclinado', difficulty_match: 'harder', same_movement_pattern: false, notes: 'Recruta tríceps + ombros junto.' },
    { slug: 'crossover',                 reason: 'Tensão constante',                equipment_context: 'Polia dupla',                difficulty_match: 'same',   same_movement_pattern: true, notes: 'Ajuste polias na parte alta.' },
    { slug: 'flexao-pes-elevados',       reason: 'Em casa',                         equipment_context: 'Peso corporal + banco/cadeira', difficulty_match: 'easier', same_movement_pattern: false, notes: 'Mira peitoral superior.' },
  ]},

  // ---------- GOBLET SQUAT ----------
  { from: 'goblet-squat', to: [
    { slug: 'agachamento-livre',         reason: 'Mais força / volume',             equipment_context: 'Barra + rack',               difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Próximo passo natural.' },
    { slug: 'agachamento-livre-corpo',   reason: 'Sem peso',                        equipment_context: 'Peso corporal',              difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Foque em amplitude.' },
    { slug: 'leg-press',                 reason: 'Joelho sensível',                 equipment_context: 'Máquina',                    difficulty_match: 'easier', same_movement_pattern: false, notes: 'Trajetória guiada.' },
  ]},

  // ---------- PIKE PUSH-UP ----------
  { from: 'pike-pushup', to: [
    { slug: 'desenvolvimento-na-maquina', reason: 'Em academia',                    equipment_context: 'Máquina',                    difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Trajetória guiada.' },
    { slug: 'desenvolvimento-halteres',  reason: 'Mais carga progressiva',          equipment_context: 'Halteres',                   difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Permite treinar pesado.' },
    { slug: 'flexao',                    reason: 'Iniciante / sem força',           equipment_context: 'Peso corporal',              difficulty_match: 'easier', same_movement_pattern: false, notes: 'Construa base de empurrar.' },
  ]},

  // ---------- KETTLEBELL SWING ----------
  { from: 'kettlebell-swing', to: [
    { slug: 'hip-thrust',                reason: 'Sem KB',                          equipment_context: 'Barra + banco',              difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Mais força máxima.' },
    { slug: 'glute-bridge',              reason: 'Em casa',                         equipment_context: 'Peso corporal',              difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Ative o glúteo manualmente.' },
    { slug: 'good-morning',              reason: 'Foco em hip hinge controlado',    equipment_context: 'Barra',                      difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Movimento mais lento.' },
  ]},

  // ---------- HIP THRUST ----------
  { from: 'hip-thrust', to: [
    { slug: 'glute-bridge',              reason: 'Em casa / iniciante',             equipment_context: 'Peso corporal',              difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Foque em pico de contração.' },
    { slug: 'kettlebell-swing',          reason: 'Foco em explosão',                equipment_context: 'Kettlebell',                 difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Hinge dinâmico.' },
    { slug: 'elevacao-quadril-banda',    reason: 'Ativação leve',                   equipment_context: 'Mini band',                  difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Bom para aquecer glúteo.' },
  ]},

  // ---------- ROSCA DIRETA (qualquer variação) ----------
  { from: 'rosca-alternada', to: [
    { slug: 'rosca-martelo',             reason: 'Foco em braquial',                equipment_context: 'Halteres',                   difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Pegada neutra.' },
    { slug: 'rosca-com-elastico',        reason: 'Em casa',                         equipment_context: 'Elástico',                   difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Pise no elástico e role.' },
    { slug: 'rosca-direta-cabo',         reason: 'Tensão constante',                equipment_context: 'Polia baixa',                difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Bom para finalização.' },
  ]},

  // ---------- ELEVAÇÃO DE PERNAS PENDURADA ----------
  { from: 'elevacao-pernas-pendurada', to: [
    { slug: 'abdominal-crunch',          reason: 'Sem barra',                       equipment_context: 'Solo',                       difficulty_match: 'easier', same_movement_pattern: false, notes: 'Foco em flexão de tronco.' },
    { slug: 'rope-crunch',               reason: 'Foco em hipertrofia',             equipment_context: 'Polia alta',                 difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Carga progressiva.' },
    { slug: 'prancha-abdominal',         reason: 'Iniciante / lombar sensível',     equipment_context: 'Solo',                       difficulty_match: 'easier', same_movement_pattern: false, notes: 'Anti-extensão.' },
  ]},

  // ---------- ABDOMINAL CRUNCH ----------
  { from: 'abdominal-crunch', to: [
    { slug: 'rope-crunch',               reason: 'Carga progressiva',               equipment_context: 'Polia alta',                 difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Permite progredir em carga.' },
    { slug: 'elevacao-pernas-pendurada', reason: 'Foco abdômen inferior',           equipment_context: 'Barra fixa',                 difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Mira parte baixa.' },
    { slug: 'prancha-abdominal',         reason: 'Lombar sensível',                 equipment_context: 'Solo',                       difficulty_match: 'easier', same_movement_pattern: false, notes: 'Estabilidade > flexão.' },
    { slug: 'hollow-body-hold',          reason: 'Calistenia / core completo',      equipment_context: 'Solo',                       difficulty_match: 'harder', same_movement_pattern: false, notes: 'Padrão da ginástica.' },
  ]},

  // ---------- PRANCHA LATERAL ----------
  { from: 'prancha-lateral', to: [
    { slug: 'prancha-abdominal',         reason: 'Foco em core anterior',           equipment_context: 'Solo',                       difficulty_match: 'easier', same_movement_pattern: false, notes: 'Trabalha o reto abdominal.' },
    { slug: 'pallof-press',              reason: 'Anti-rotação dinâmica',           equipment_context: 'Polia ou elástico',          difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Excelente complemento.' },
  ]},

  // ---------- BARRA NEGATIVA / PROGRESSÃO PULL-UP ----------
  { from: 'barra-negativa', to: [
    { slug: 'pullup-com-elastico',       reason: 'Próximo passo',                   equipment_context: 'Barra + elástico forte',     difficulty_match: 'harder', same_movement_pattern: true,  notes: 'Reduza assistência ao longo do tempo.' },
    { slug: 'australian-pullup',         reason: 'Sem barra alta',                  equipment_context: 'Barra baixa',                difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Ângulo controla a dificuldade.' },
    { slug: 'puxada-alta',                reason: 'Em academia',                     equipment_context: 'Pulley',                     difficulty_match: 'easier', same_movement_pattern: true,  notes: 'Construa força progressiva.' },
  ]},

  // ---------- AUSTRALIAN PULL-UP ----------
  { from: 'australian-pullup', to: [
    { slug: 'remada-curvada-halteres',   reason: 'Sem barra baixa',                 equipment_context: 'Halteres',                   difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Mira mesmo grupo.' },
    { slug: 'puxada-alta',                reason: 'Em academia',                     equipment_context: 'Pulley',                     difficulty_match: 'easier', same_movement_pattern: false, notes: 'Trabalha dorsal.' },
    { slug: 'pullup-com-elastico',       reason: 'Próximo passo (vertical)',        equipment_context: 'Barra + elástico',           difficulty_match: 'harder', same_movement_pattern: false, notes: 'Migrar para barra fixa.' },
  ]},

  // ---------- PANTURRILHA SENTADO ----------
  { from: 'panturrilha-sentado', to: [
    { slug: 'panturrilha-leg-press',     reason: 'Sem máquina sentado',             equipment_context: 'Leg press',                  difficulty_match: 'same',   same_movement_pattern: true,  notes: 'Pés baixos na plataforma.' },
  ]},

  // ---------- CARDIO / HIIT ----------
  { from: 'corrida-esteira', to: [
    { slug: 'bicicleta-ergometrica',     reason: 'Joelho sensível',                  equipment_context: 'Bike',                   difficulty_match: 'easier', same_movement_pattern: false, notes: 'Sem impacto.' },
    { slug: 'eliptico',                  reason: 'Sem impacto',                      equipment_context: 'Elíptico',               difficulty_match: 'easier', same_movement_pattern: false, notes: 'Trabalha membros sup. e inf.' },
    { slug: 'remo-ergometrico',          reason: 'Cardio mais completo',             equipment_context: 'Remo',                   difficulty_match: 'same',   same_movement_pattern: false, notes: 'Engaja costas, core e pernas.' },
  ]},
];

// Aliases manuais: slug do meu mapa → slug real (ou variações para fallback fuzzy).
const SLUG_ALIASES = {
  'agachamento-goblet': 'goblet-squat',
  'agachamento-bulgaro': 'bulgaro-com-halteres',
  'agachamento-hack': 'hack-squat',
  'corrida-esteira': 'esteira-cardio',
  'bicicleta-ergometrica': 'bike-ergometrica',
  'remada-baixa-cabo': 'remada-baixa',
  'rosca-direta-halteres': 'rosca-alternada',
  'crossover-cabos': 'crossover',
  'desenvolvimento-maquina': 'desenvolvimento-na-maquina',
  'supino-maquina': 'supino-reto-maquina',
  'supino-inclinado-maquina': 'supino-inclinado-na-maquina',
  'crucifixo-inclinado': 'crucifixo-inclinado-halteres',
  'remada-elastico': 'remada-curvada-halteres',
  'elevacao-pernas': 'elevacao-pernas-pendurada',
  'cable-crunch': 'rope-crunch',
  'abdominal-supra': 'abdominal-crunch',
  'flexao-bracos': 'flexao',
  'flexao-declinada': 'flexao-pes-elevados',
  'flexao-fechada': 'flexao-diamante',
  'panturrilha-em-pe': 'panturrilha-pe',
  'panturrilha-unilateral': 'panturrilha-unilat',
  'remo-ergometrico': 'remo-ergometro',
  'gluteo-maquina': 'gluteo-na-maquina',
  'elevacao-pelvica': 'glute-bridge',
  'walking-lunge': 'avanco-caminhando',
  'step-up': 'step-up-banco',
  'remada-cavalinho': 'remada-t',
  'rosca-cabo': 'rosca-direta-cabo',
  'rosca-elastico': 'rosca-com-elastico',
  'puxada-pegada-fechada': 'puxada-fechada',
  'triceps-frances': 'triceps-frances-halter',
  'triceps-testa': 'triceps-testa-barra',
  'triceps-coice': 'triceps-coice-halter',
  'flexao-nordica-inversa': 'reverse-nordic',
  'flexao-nordica': 'nordic-curl',
  'mesa-flexora': 'mesa-flexora-deitado',
  'eliptico': 'cardio-eliptico',
  'arnold-press': 'arnold-press-halteres',
};

// Fuzzy: tenta encontrar exercício pelo slug, alias ou nome aproximado.
function findExerciseId(exercises, slug) {
  if (!slug) return null;
  // 1) Direto
  const direct = exercises.find(e => e.slug === slug);
  if (direct) return direct.id;
  // 2) Alias
  const aliasSlug = SLUG_ALIASES[slug];
  if (aliasSlug) {
    const aliased = exercises.find(e => e.slug === aliasSlug);
    if (aliased) return aliased.id;
  }
  // 3) Slug que CONTÉM ou está CONTIDO no slug procurado
  const partial = exercises.find(e =>
    e.slug && (e.slug.includes(slug) || slug.includes(e.slug))
  );
  if (partial) return partial.id;
  // 4) Nome contém termos do slug
  const terms = slug.split('-').filter(t => t.length > 2);
  if (terms.length === 0) return null;
  const fuzzy = exercises.find(e => {
    const name = (e.name || '').toLowerCase();
    return terms.every(t => name.includes(t));
  });
  return fuzzy?.id || null;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const exercises = await base44.asServiceRole.entities.Exercise.list('-created_date', 1000);

    // Wipe existing
    const existing = await base44.asServiceRole.entities.ExerciseSubstitution.list('-created_date', 2000);
    let deleted = 0;
    for (const ep of existing) {
      await base44.asServiceRole.entities.ExerciseSubstitution.delete(ep.id);
      deleted += 1;
    }

    let created = 0;
    const missing = [];

    for (const group of SUBSTITUTIONS) {
      const fromId = findExerciseId(exercises, group.from);
      if (!fromId) {
        missing.push({ type: 'from', slug: group.from });
        continue;
      }
      for (const sub of group.to) {
        const toId = findExerciseId(exercises, sub.slug);
        if (!toId) {
          missing.push({ type: 'to', from: group.from, slug: sub.slug });
          continue;
        }
        if (toId === fromId) {
          missing.push({ type: 'self_match', from: group.from, slug: sub.slug });
          continue;
        }
        const fromEx = exercises.find(e => e.id === fromId);
        const toEx = exercises.find(e => e.id === toId);
        const samePrimary = fromEx?.primary_muscle && toEx?.primary_muscle && fromEx.primary_muscle === toEx.primary_muscle;

        await base44.asServiceRole.entities.ExerciseSubstitution.create({
          exercise_id: fromId,
          substitute_exercise_id: toId,
          reason: sub.reason,
          equipment_context: sub.equipment_context,
          difficulty_match: sub.difficulty_match,
          same_primary_muscle: samePrimary || false,
          same_movement_pattern: !!sub.same_movement_pattern,
          notes: sub.notes,
        });
        created += 1;
      }
    }

    return Response.json({
      ok: true,
      groups: SUBSTITUTIONS.length,
      created,
      deleted,
      missing,
      total_exercises: exercises.length,
    });
  } catch (error) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
});