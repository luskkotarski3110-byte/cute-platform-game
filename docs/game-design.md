# Documento de Design — A Coroa Perdida

## Visão
**A Coroa Perdida** é um jogo de plataforma 2D de aventura, inspirado na linguagem de jogos de Super NES: controles simples, fases bem delimitadas, segredos, inimigos, puzzles e chefes.

**Protagonista:** Zip Zip, um pequeno hamster aventureiro.

**Objetivo:** recuperar os 10 fragmentos da Coroa Real e descobrir por que ela desapareceu.

## Estrutura
- 10 fases principais
- 1 fragmento por fase
- 1 desafio final por fase
- checkpoints
- segredos opcionais
- chefes e mini-chefes progressivos
- mecânicas introduzidas uma por vez e reutilizadas depois
- final fechado, com variação conforme segredos encontrados

## Loop de gameplay
Explorar -> superar plataformas -> resolver puzzle -> enfrentar inimigos -> checkpoint -> desafio da fase -> chefe/guardião -> fragmento -> revelação da história.

## Progressão
As primeiras fases ensinam movimento e leitura de cenário. A partir da fase 3 entram sistemas ambientais. As fases 9 e 10 combinam tudo que foi aprendido.

## Direção técnica
A lógica deve ser compatível com uma experiência retrô: salas e trechos curtos, transições claras, HUD enxuto, animações legíveis, colisões previsíveis e dificuldade crescente.

## Regras de preservação do projeto
- Não remover o movimento e o walk cycle já existentes.
- Não quebrar a coleta do primeiro fragmento.
- O Jardim da Rainha continua sendo a primeira área.
- O visual definitivo será refinado depois da estrutura e da jogabilidade.
- Cada nova mecânica deve ter tutorialização dentro da própria fase.
