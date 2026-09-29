const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha:false });

const keys = Object.create(null);
const touch = { left:false, right:false, down:false };
let paused = false;
let finished = false;
let last = performance.now();
let walkTime = 0;
let coyoteTime = 0;
let jumpBuffer = 0;
let cameraX = 0;

const WORLD_WIDTH = 3000;
const MOVE_SPEED = 250;
const GROUND_ACCEL = 1900;
const AIR_ACCEL = 1250;
const FRICTION = 2200;
const GRAVITY = 1800;
const JUMP_SPEED = -690;
const COYOTE_WINDOW = 0.10;
const JUMP_BUFFER_WINDOW = 0.12;

const FRAME_W = 128;
const FRAME_H = 128;
const WALK_ROW = 0;
const JUMP_ROW = 1;
const DOWN_ROW = 2;
const IDLE_ROW = 3;
const WALK_FRAMES = [0,1,2,3,4];
const ANIM_SPEED = 9;

const sprite = new Image();
sprite.src = 'assets/zipzip_sprite.svg?v=zipzip-reference-1';

const background = new Image();
background.src = 'assets/zipzip_phase1_bg.jpg?v=project-base-1';
const foreground = new Image();
foreground.src = 'assets/phase1_project_fg.svg?v=project-fg-2';


// Fragmento da Coroa: sprite sheet com 6 frames, brilho e símbolo da coroa.
const fragmentSprite = new Image();
fragmentSprite.src = 'assets/fragment_sprite.svg?v=fragment-1';

const platformSprite = new Image();
platformSprite.src = 'assets/platforms_sprite.svg?v=platforms-1';

const enemySprite = new Image();
enemySprite.src = 'assets/enemies_sprite.svg?v=enemies-1';

// Fase maior: os trechos antigos foram mantidos e novos caminhos foram adicionados.
const platforms = [
  {x:0,    y:390, w:260, h:24, kind:0},
  {x:300,  y:340, w:210, h:24, kind:1},
  {x:550,  y:420, w:270, h:24, kind:0},
  {x:650,  y:355, w:95,  h:18, kind:3},
  {x:850,  y:300, w:180, h:24, kind:1},
  {x:1060, y:370, w:220, h:24, kind:0},
  {x:1310, y:430, w:250, h:24, kind:2},
  {x:1440, y:350, w:95,  h:18, kind:3},
  {x:1600, y:300, w:230, h:24, kind:0},
  {x:1870, y:385, w:180, h:24, kind:1},
  {x:2080, y:325, w:220, h:24, kind:2},
  {x:2330, y:415, w:260, h:24, kind:0},
  {x:2620, y:350, w:170, h:24, kind:1},
  {x:2820, y:290, w:180, h:24, kind:3}
];

const fragment = { x:2920, y:235, collected:false };

// Inimigos simples e leves: patrulham plataformas e podem ser derrotados pulando sobre eles.
const enemies = [
  {x:385,  y:304, w:38, h:36, vx:55,  left:320,  right:480, alive:true},
  {x:735,  y:384, w:38, h:36, vx:-65, left:575, right:780, alive:true},
  {x:930,  y:264, w:38, h:36, vx:60,  left:875,  right:1000, alive:true},
  {x:1160, y:334, w:38, h:36, vx:-70, left:1080, right:1260, alive:true},
  {x:1510, y:314, w:38, h:36, vx:65, left:1450, right:1525, alive:true},
  {x:1710, y:264, w:38, h:36, vx:-75, left:1620, right:1810, alive:true},
  {x:1950, y:349, w:38, h:36, vx:60, left:1890, right:2020, alive:true},
  {x:2200, y:289, w:38, h:36, vx:-70, left:2100, right:2280, alive:true},
  {x:2420, y:379, w:38, h:36, vx:75, left:2350, right:2550, alive:true},
  {x:2680, y:314, w:38, h:36, vx:-65, left:2640, right:2770, alive:true}
];

let player = {
  x:34, y:314, w:58, h:76,
  vx:0, vy:0, ground:false,
  dir:1, animFrame:0
};

function reset() {
  player = {x:34,y:314,w:58,h:76,vx:0,vy:0,ground:false,dir:1,animFrame:0};
  fragment.collected = false;
  for (const e of enemies) e.alive = true;
  finished = false;
  paused = false;
  walkTime = 0;
  coyoteTime = 0;
  jumpBuffer = 0;
  cameraX = 0;
  document.getElementById('pause').classList.add('hidden');
  document.getElementById('story').classList.add('hidden');
  updateObjective();
}

function updateObjective() {
  document.getElementById('objective').textContent =
    fragment.collected ? 'Fragmento encontrado! ✦' : 'Encontre o fragmento ✦';
}

function jump() {
  if (!paused && !finished && (player.ground || coyoteTime > 0)) {
    player.vy = JUMP_SPEED;
    player.ground = false;
    coyoteTime = 0;
    jumpBuffer = 0;
  }
}

function leftPressed() { return !!(keys.ArrowLeft || keys.a || touch.left); }
function rightPressed() { return !!(keys.ArrowRight || keys.d || touch.right); }
function downPressed() { return !!(keys.ArrowDown || keys.s || touch.down); }

function respawn() {
  player.x = Math.max(34, cameraX + 34);
  if (player.x > 180) player.x = 34;
  player.y = 314;
  player.vx = 0;
  player.vy = 0;
  player.ground = false;
  player.dir = 1;
  player.animFrame = 0;
  coyoteTime = 0;
  jumpBuffer = 0;
}

function approach(value, target, amount) {
  if (value < target) return Math.min(value + amount, target);
  if (value > target) return Math.max(value - amount, target);
  return target;
}

function hit(a,b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function updateEnemies(dt) {
  for (const e of enemies) {
    if (!e.alive) continue;
    e.x += e.vx * dt;
    if (e.x <= e.left) { e.x = e.left; e.vx = Math.abs(e.vx); }
    if (e.x + e.w >= e.right) { e.x = e.right - e.w; e.vx = -Math.abs(e.vx); }

    if (hit(player,e)) {
      const playerBottom = player.y + player.h;
      const enemyTop = e.y;
      if (player.vy > 120 && playerBottom - enemyTop < 26) {
        e.alive = false;
        player.y = e.y - player.h;
        player.vy = -390;
        player.ground = false;
      } else {
        respawn();
        return;
      }
    }
  }
}

function update(dt) {
  if (paused || finished) return;

  const left = leftPressed();
  const right = rightPressed();
  const down = downPressed();

  let target = 0;
  if (left && !right) {
    target = down ? -MOVE_SPEED * 0.42 : -MOVE_SPEED;
    player.dir = -1;
  } else if (right && !left) {
    target = down ? MOVE_SPEED * 0.42 : MOVE_SPEED;
    player.dir = 1;
  }

  const accel = player.ground ? GROUND_ACCEL : AIR_ACCEL;
  if (target !== 0) {
    player.vx = approach(player.vx, target, accel * dt);
  } else {
    player.vx = approach(player.vx, 0, FRICTION * dt);
  }

  if (player.ground) coyoteTime = COYOTE_WINDOW;
  else coyoteTime = Math.max(0, coyoteTime - dt);

  jumpBuffer = Math.max(0, jumpBuffer - dt);
  if (jumpBuffer > 0 && coyoteTime > 0 && !down) jump();

  player.vy += GRAVITY * dt;

  const oldBottom = player.y + player.h;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.ground = false;

  if (player.vy >= 0) {
    const bottom = player.y + player.h;
    let landing = null;

    for (const p of platforms) {
      const overlapsX = player.x + player.w - 8 > p.x && player.x + 8 < p.x + p.w;
      const crossingTop = oldBottom <= p.y + 4 && bottom >= p.y;
      if (overlapsX && crossingTop && (!landing || p.y < landing.y)) landing = p;
    }

    if (landing) {
      player.y = landing.y - player.h;
      player.vy = 0;
      player.ground = true;
      coyoteTime = COYOTE_WINDOW;
    }
  }

  updateEnemies(dt);

  if (player.ground && Math.abs(player.vx) > 5 && !down) {
    walkTime += dt * ANIM_SPEED;
    player.animFrame = WALK_FRAMES[Math.floor(walkTime) % WALK_FRAMES.length];
  } else if (!player.ground) {
    player.animFrame = 0;
    walkTime = 0;
  } else {
    walkTime = 0;
    player.animFrame = 0;
  }

  player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));

  if (player.y > canvas.height + 180) respawn();

  // Câmera suave, sem acompanhar cada micro movimento.
  const targetCamera = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width * 0.38));
  cameraX += (targetCamera - cameraX) * Math.min(1, dt * 7);

  if (!fragment.collected) {
    const dx = (player.x + player.w / 2) - fragment.x;
    const dy = (player.y + player.h / 2) - fragment.y;
    if (Math.hypot(dx, dy) < 62) {
      fragment.collected = true;
      finished = true;
      updateObjective();

      const story = document.getElementById('story');
      document.getElementById('storyText').innerHTML =
        '<h2>✦ Memória despertada</h2><p>Ao alcançar o fragmento, Zip Zip percebe que aquilo não é apenas um pedaço da Coroa Real.</p><p>Uma memória da noite do desaparecimento atravessa o jardim: alguém quebrou a coroa de propósito.</p><p><strong>O primeiro caminho foi encontrado. O Bosque dos Cogumelos espera.</strong></p>';
      document.getElementById('storyNext').textContent = 'Voltar ao mapa';
      story.classList.remove('hidden');
    }
  }
}

function drawBackground() {
  ctx.fillStyle = '#8e55c5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // O fundo original do projeto é a base visual da Fase 1.
  // Ele acompanha a câmera suavemente, sem adicionar elementos que não existem no conceito.
  if (background.complete && background.naturalWidth) {
    ctx.imageSmoothingEnabled = true;
    const scale = canvas.height / background.naturalHeight;
    const bw = background.naturalWidth * scale;
    const offset = -(cameraX * 0.18) % bw;
    for (let x = offset - bw; x < canvas.width + bw; x += bw) {
      ctx.drawImage(background, x, 0, bw, canvas.height);
    }
  }
}
function drawWorld() {
  ctx.save();
  ctx.translate(-Math.round(cameraX), 0);

  // Pequena camada de chão/folhagem para dar mais sensação de profundidade.
  ctx.fillStyle = 'rgba(35,70,48,.35)';
  ctx.fillRect(cameraX, 505, canvas.width, 35);

  for (const p of platforms) {
    if (platformSprite.complete && platformSprite.naturalWidth) {
      const srcX = p.kind * 128;
      const srcY = 0;
      const srcW = 128;
      // Mostra apenas a faixa útil da plataforma. A colisão continua pequena e limpa.
      const srcH = p.kind === 2 ? 58 : 52;
      const drawH = Math.max(32, p.h + 9);
      ctx.drawImage(platformSprite, srcX, srcY, srcW, srcH, p.x, p.y - (drawH - p.h), p.w, drawH);
    } else {
      ctx.fillStyle = '#49333f';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#79a85d';
      ctx.fillRect(p.x, p.y, p.w, 7);
    }
  }

  for (const e of enemies) {
    if (!e.alive) continue;
    const bob = Math.sin(performance.now()/160 + e.x) * 1.5;
    ctx.save();
    ctx.translate(e.x, e.y + bob);
    if (enemySprite.complete && enemySprite.naturalWidth) {
      const frame = Math.floor(performance.now() / 180) % 3;
      ctx.drawImage(enemySprite, frame * 128, 0, 128, 96, 0, 0, e.w, e.h);
    } else {
      ctx.fillStyle = '#6e355e';
      ctx.beginPath();
      ctx.roundRect(0, 8, e.w, e.h - 8, 10);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();
}

function drawFragment() {
  if (fragment.collected) return;

  const t = performance.now() / 1000;
  const bob = Math.sin(t * 3.1) * 6;
  const frame = Math.floor(t * 8) % 6;
  const size = 56;
  const drawX = Math.round(fragment.x - cameraX - size / 2);
  const drawY = Math.round(fragment.y + bob - size / 2);

  ctx.save();
  ctx.globalAlpha = 0.96;

  if (fragmentSprite.complete && fragmentSprite.naturalWidth) {
    ctx.drawImage(
      fragmentSprite,
      frame * 64, 0, 64, 64,
      drawX, drawY, size, size
    );
  } else {
    // Fallback mínimo enquanto o sprite carrega.
    ctx.fillStyle = '#ffe26b';
    ctx.beginPath();
    ctx.moveTo(fragment.x - cameraX, drawY);
    ctx.lineTo(fragment.x - cameraX + 18, drawY + 28);
    ctx.lineTo(fragment.x - cameraX, drawY + 56);
    ctx.lineTo(fragment.x - cameraX - 18, drawY + 28);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawPlayer() {
  if (!sprite.complete || !sprite.naturalWidth) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x - cameraX + player.w/2, player.y + 30, 25, 0, Math.PI*2);
    ctx.fill();
    return;
  }

  const down = downPressed() && player.ground;
  const moving = player.ground && Math.abs(player.vx) > 5 && !down;

  let row = IDLE_ROW;
  let frame = 0;

  if (!player.ground) {
    row = JUMP_ROW;
    frame = player.vy < -100 ? 1 : player.vy > 260 ? 4 : 2;
  } else if (down) {
    row = DOWN_ROW;
    frame = Math.floor(performance.now() / 140) % 4;
  } else if (moving) {
    row = WALK_ROW;
    frame = player.animFrame;
  }

  const size = 132;
  const drawX = Math.round(player.x - cameraX - 37);
  const drawY = Math.round(player.y - 50);

  ctx.save();
  ctx.imageSmoothingEnabled = true;

  if (player.dir < 0) {
    ctx.translate(drawX + size, drawY);
    ctx.scale(-1, 1);
    ctx.drawImage(sprite, frame * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H, 0, 0, size, size);
  } else {
    ctx.drawImage(sprite, frame * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H, drawX, drawY, size, size);
  }

  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = 'rgba(35,18,55,.60)';
  ctx.fillRect(14, 14, 390, 42);
  ctx.fillStyle = '#fff';
  ctx.font = '17px system-ui';
  ctx.fillText(
    fragment.collected ? '✦ Fragmento 1/1 — encontrado' : '✦ Fragmento 0/1 — encontre o fragmento da Coroa',
    26, 41
  );
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawWorld();
  if (foreground.complete && foreground.naturalWidth) {
    const fw = canvas.width;
    const off = -(cameraX * 0.68) % fw;
    for (let x = off - fw; x < canvas.width + fw; x += fw) ctx.drawImage(foreground, x, 0, fw, canvas.height);
  }
  drawFragment();
  drawPlayer();
  drawHud();
}

function togglePause() {
  if (finished) return;
  paused = !paused;
  document.getElementById('pause').classList.toggle('hidden', !paused);
}

document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resumeBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', reset);
document.getElementById('menuBtn').addEventListener('click', () => { location.href = 'index.html'; });
document.getElementById('storyNext').addEventListener('click', () => { location.href = 'campaign.html'; });

addEventListener('keydown', e => {
  const k = e.key;
  if (k === 'Escape') {
    e.preventDefault();
    togglePause();
    return;
  }

  keys[k] = true;

  if (k === ' ' || k === 'ArrowUp' || k === 'w' || k === 'W') {
    e.preventDefault();
    jumpBuffer = JUMP_BUFFER_WINDOW;
    jump();
  }
});

addEventListener('keyup', e => { keys[e.key] = false; });

document.querySelectorAll('.touch-controls button').forEach(btn => {
  const action = btn.dataset.key;

  const press = e => {
    e.preventDefault();
    try { btn.setPointerCapture(e.pointerId); } catch (_) {}

    if (action === 'jump') {
      jumpBuffer = JUMP_BUFFER_WINDOW;
      jump();
      return;
    }

    if (action === 'down') {
      touch.down = true;
      return;
    }

    if (action === 'left') {
      touch.left = true;
      touch.right = false;
    } else if (action === 'right') {
      touch.right = true;
      touch.left = false;
    }
  };

  const release = e => {
    e.preventDefault();
    if (action === 'left') touch.left = false;
    if (action === 'right') touch.right = false;
    if (action === 'down') touch.down = false;
  };

  btn.addEventListener('pointerdown', press, {passive:false});
  btn.addEventListener('pointerup', release, {passive:false});
  btn.addEventListener('pointercancel', release, {passive:false});
  btn.addEventListener('lostpointercapture', release, {passive:false});
});

addEventListener('blur', () => {
  touch.left = false;
  touch.right = false;
  touch.down = false;
  keys.ArrowLeft = keys.ArrowRight = keys.ArrowDown = keys.a = keys.d = keys.s = false;
});

reset();

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
