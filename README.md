# A Coroa Perdida

Jogo de plataforma 2D de aventura com identidade retrô inspirada na era Super NES.

## Conceito

**Zip Zip**, um pequeno hamster aventureiro, atravessa um reino que perdeu a estabilidade depois que a Coroa Real foi fragmentada.

Os 10 fragmentos da Coroa estão espalhados pelo mundo. Cada fragmento guarda uma memória e, juntos, eles revelam a verdade sobre o desaparecimento da Coroa e sobre a força que existe além do selo.

O jogo foi estruturado para ter uma campanha fechada de **10 fases**, com puzzles, inimigos, guardiões, segredos e progressão de mecânicas.

## Campanha

| Fase | Região | Mecânica principal |
|---|---|---|
| 1 | Jardim da Rainha | Mecanismos e fundamentos |
| 2 | Bosque dos Cogumelos | Caminhos que mudam |
| 3 | Ruínas Submersas | Água |
| 4 | Cidade Quebrada | Realidade fragmentada |
| 5 | Torre dos Ecos | Som |
| 6 | Mundo Invertido | Gravidade |
| 7 | Laboratório Abandonado | Energia e máquinas |
| 8 | Coração da Coroa | Memórias e narrativa |
| 9 | A Última Ruptura | Combinação de mecânicas |
| 10 | O Fim da Coroa | Desafio final |

## Sistemas

- Plataforma 2D
- Movimento e pulo
- Walk cycle
- Câmera
- Colisão
- Coleta de fragmentos
- Checkpoints
- Inimigos
- Mini-chefes e chefes
- Puzzles ambientais
- Áreas secretas
- HUD
- Progressão de campanha
- Suporte a controles mobile
- Final com variação baseada na exploração

## Documentação

- [Documento de Design](docs/game-design.md)
- [Lore completa](story/lore.md)
- [Estrutura das 10 fases](docs/levels.md)
- [Mecânicas e sistemas](docs/mechanics.md)
- [Roadmap](docs/roadmap.md)
- [Template de fase](docs/phase-template.md)

## Estado atual

A base jogável existente permanece como ponto de partida. A estrutura narrativa e de conteúdo acima define o alvo da campanha; o visual definitivo será refinado posteriormente sem abandonar a identidade do jogo.

## Estrutura do projeto

- `gameplay/` — sistemas e mecânicas
- `story/` — lore, personagens e missões
- `assets/` — arte, animações, cenários e áudio
- `docs/` — documentação e planejamento

## Próximo marco

Transformar a **Fase 1 — Jardim da Rainha** em uma fase completa, com mapa maior, inimigos, puzzle, checkpoint, desafio final e guardião, mantendo o movimento e os sistemas já existentes.
