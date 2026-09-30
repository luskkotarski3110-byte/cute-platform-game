# Mecânicas e Sistemas

## Movimento
- esquerda/direita
- aceleração e desaceleração suaves
- pulo
- queda
- colisão com chão e plataformas
- direção visual do personagem

## Câmera
- câmera acompanha Zip Zip horizontalmente;
- limites definidos por sala;
- não revelar áreas fora do mapa;
- transições suaves entre trechos.

## Puzzles
### Mecanismos
Ativação em sequência ou por posicionamento.

### Símbolos
O cenário fornece a pista; o jogador reproduz a ordem.

### Água
Altera acesso vertical e horizontal.

### Realidade
Duas versões de uma mesma sala compartilham objetos-chave.

### Som
Sequências sonoras abrem portas.

### Gravidade
Alternância entre chão e teto.

### Energia
O jogador conecta fontes a receptores na ordem correta.

### Puzzle final
Combina as linguagens anteriores sem introduzir regra nova.

## Inimigos
Categorias:
- terrestre simples;
- voador;
- perseguidor;
- inimigo de área;
- inimigo mecânico;
- guardião de fase.

Cada inimigo deve ter comportamento legível e uma resposta clara do jogador.

## Chefes
Todo chefe deve ter:
1. padrão reconhecível;
2. janela de vulnerabilidade;
3. indicação visual antes do ataque;
4. mudança de comportamento na segunda etapa;
5. recompensa narrativa após a luta.

## Checkpoints
Cada fase deve possuir pelo menos um checkpoint antes do desafio final.

## Coleta
- fragmento principal da fase;
- colecionáveis opcionais;
- itens de recuperação;
- recompensas de exploração.

## HUD
Manter simples:
- vida;
- fragmentos;
- colecionáveis;
- indicador contextual quando necessário.

## Princípios
- controles responsivos;
- nenhuma morte causada por informação escondida sem pista;
- puzzles devem ter solução observável;
- dificuldade aumenta pela combinação de habilidades, não por controles injustos.
