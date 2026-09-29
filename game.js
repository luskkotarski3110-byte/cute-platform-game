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

const MOVE_SPEED = 300;
const GRAVITY = 1800;
const JUMP_SPEED = -720;
const COYOTE_WINDOW = 0.10;
const JUMP_BUFFER_WINDOW = 0.12;

const FRAME_W = 80;
const FRAME_H = 80;
const WALK_ROW = 0;
const JUMP_ROW = 1;
const DOWN_ROW = 2;
const IDLE_ROW = 3;
const WALK_FRAMES = [0,1,2,3,4];
const ANIM_SPEED = 8;

const sprite = new Image();
sprite.src = 'assets/zipzip_sprite.svg?v=zipzip-final-1';

const background = new Image();
background.src = 'assets/zipzip_phase1_bg.jpg?v=zipzip-bg-2';

const platforms = [
  {x:0,   y:298, w:160, h:22},
  {x:177, y:370, w:180, h:24},
  {x:365, y:426, w:305, h:24},
  {x:410, y:374, w:78,  h:18},
  {x:585, y:310, w:70,  h:18},
  {x:662, y:324, w:298, h:24}
];

const fragment = { x:835, y:278, collected:false };

let player = {
  x:34, y:218, w:58, h:76,
  vx:0, vy:0, ground:false,
  dir:1, animFrame:0
};

function reset() {
  player = {x:34,y:218,w:58,h:76,vx:0,vy:0,ground:false,dir:1,animFrame:0};
  fragment.collected = false;
  finished = false;
  paused = false;
  walkTime = 0;
  coyoteTime = 0;
  jumpBuffer = 0;
  document.getElementById('pause').classList.add('hidden');
  document.getElementById('story').classList.add('hidden');
  updateObjective();
}

function updateObjective() {
  document.getElementById('objective').textContent =
    fragment.collected ? 'Fragmento encontrado! ✦' : 'Suba pelas pedras até o fragmento ✦';
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
  player.x = 34;
  player.y = 218;
  player.vx = 0;
  player.vy = 0;
  player.ground = false;
  player.dir = 1;
  player.animFrame = 0;
  coyoteTime = 0;
  jumpBuffer = 0;
}

function update(dt) {
  if (paused || finished) return;

  const left = leftPressed();
  const right = rightPressed();
  const down = downPressed();

  if (left && !right) {
    player.vx = down ? -MOVE_SPEED * 0.35 : -MOVE_SPEED;
    player.dir = -1;
  } else if (right && !left) {
    player.vx = down ? MOVE_SPEED * 0.35 : MOVE_SPEED;
    player.dir = 1;
  } else {
    player.vx = 0;
  }

  if (player.ground) coyoteTime = COYOTE_WINDOW;
  else coyoteTime = Math.max(0, coyoteTime - dt);

  jumpBuffer = Math.max(0, jumpBuffer - dt);
  if (jumpBuffer > 0 && coyoteTime > 0 && !down) jump();

  player.vy += GRAVITY * dt;

  const oldBottom = player.y + player.h;
  const nextX = player.x + player.vx * dt;
  const nextY = player.y + player.vy * dt;
  player.x = nextX;
  player.y = nextY;
  player.ground = false;

  // Escolhe somente uma plataforma para pouso, evitando o personagem
  // atravessar/oscilar quando duas superfícies ficam próximas.
  if (player.vy >= 0) {
    const bottom = player.y + player.h;
    let landing = null;

    for (const p of platforms) {
      const overlapsX = player.x + player.w - 10 > p.x && player.x + 10 < p.x + p.w;
      const crossingTop = oldBottom <= p.y + 3 && bottom >= p.y;

      if (overlapsX && crossingTop && (!landing || p.y < landing.y)) {
        landing = p;
      }
    }

    if (landing) {
      player.y = landing.y - player.h;
      player.vy = 0;
      player.ground = true;
      coyoteTime = COYOTE_WINDOW;
    }
  }

  // O movimento e a animação são independentes: trocar de frame nunca altera X/Y.
  if (player.ground && Math.abs(player.vx) > 1 && !down) {
    walkTime += dt * ANIM_SPEED;
    player.animFrame = WALK_FRAMES[Math.floor(walkTime) % WALK_FRAMES.length];
  } else {
    walkTime = 0;
    player.animFrame = 0;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

  if (player.y > canvas.height + 90) respawn();

  if (!fragment.collected) {
    const dx = (player.x + player.w / 2) - fragment.x;
    const dy = (player.y + player.h / 2) - fragment.y;

    if (Math.hypot(dx, dy) < 55) {
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

  if (background.complete && background.naturalWidth) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(20, 8, 32, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawFragment() {
  if (fragment.collected) return;

  const t = performance.now() / 450;
  const bob = Math.sin(t) * 6;

  ctx.save();
  ctx.translate(fragment.x, fragment.y + bob);
  ctx.rotate(Math.sin(t) * 0.12);
  ctx.fillStyle = '#ffe26b';
  ctx.strokeStyle = '#fff4b0';
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let i=0; i<8; i++) {
    const a = i * Math.PI / 4;
    const r = i % 2 === 0 ? 18 : 8;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawPlayer() {
  if (!sprite.complete || !sprite.naturalWidth) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + 30, 25, 0, Math.PI*2);
    ctx.fill();
    return;
  }

  const down = downPressed() && player.ground;
  const moving = player.ground && Math.abs(player.vx) > 1 && !down;

  let row = IDLE_ROW;
  let frame = 0;

  if (!player.ground) {
    row = JUMP_ROW;
    frame = Math.max(0, Math.min(4, Math.floor((Math.abs(player.vy) / 720) * 4)));
  } else if (down) {
    row = DOWN_ROW;
    frame = Math.floor(performance.now() / 120) % 5;
  } else if (moving) {
    row = WALK_ROW;
    frame = player.animFrame;
  }

  const size = 112;
  const drawX = Math.round(player.x - 27);
  const drawY = Math.round(player.y - 38);

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
  ctx.fillRect(14, 14, 360, 42);
  ctx.fillStyle = '#fff';
  ctx.font = '17px system-ui';
  ctx.fillText(
    fragment.collected ? '✦ Fragmento encontrado' : '✦ Suba pelas pedras até o fragmento',
    26, 41
  );
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
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
