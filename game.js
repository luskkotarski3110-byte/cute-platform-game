const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const keys = Object.create(null);
const touch = { left:false, right:false, jump:false };
let paused = false;
let finished = false;
let last = performance.now();
let anim = 0;
let animTimer = 0;

const sprite = new Image();
sprite.src = 'assets/zipzip_phase1_player_sheet.png';

const background = new Image();
background.src = 'assets/zipzip_phase1_bg.jpg';

// Colisões invisíveis alinhadas às plataformas/terrenos que aparecem na arte.
// O cenário continua sendo a imagem, mas estas áreas tornam as pedras e ilhas realmente jogáveis.
const platforms = [
  {x:0,   y:298, w:160, h:22},   // ilha esquerda alta
  {x:177, y:370, w:180, h:24},   // ilha da tora
  {x:365, y:426, w:305, h:24},   // chão central
  {x:410, y:374, w:78,  h:18},   // plataforma flutuante baixa
  {x:585, y:310, w:70,  h:18},    // plataforma flutuante alta
  {x:662, y:324, w:298, h:24}    // montanha/ilha direita
];

const fragment = { x:835, y:278, collected:false };

let player = {
  x:45, y:225, w:54, h:70,
  vx:0, vy:0, ground:false
};

function reset() {
  player = {x:45,y:225,w:54,h:70,vx:0,vy:0,ground:false};
  fragment.collected = false;
  finished = false;
  paused = false;
  document.getElementById('pause').classList.add('hidden');
  updateObjective();
}

function updateObjective() {
  document.getElementById('objective').textContent =
    fragment.collected ? 'Fragmento encontrado! ✦' : 'Encontre o fragmento ✦';
}

function jump() {
  if (!paused && player.ground) {
    player.vy = -650;
    player.ground = false;
  }
}

function leftPressed() {
  return keys.ArrowLeft || keys.a || touch.left;
}
function rightPressed() {
  return keys.ArrowRight || keys.d || touch.right;
}

function update(dt) {
  if (paused || finished) return;

  const left = leftPressed();
  const right = rightPressed();

  player.vx = 0;
  if (left) player.vx -= 280;
  if (right) player.vx += 280;

  player.vy += 1700 * dt;

  const oldBottom = player.y + player.h;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.ground = false;

  for (const p of platforms) {
    const bottom = player.y + player.h;
    const overlapsX = player.x + player.w - 8 > p.x && player.x + 8 < p.x + p.w;
    const crossingTop = oldBottom <= p.y && bottom >= p.y;
    if (overlapsX && crossingTop && player.vy >= 0) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.ground = true;
    }
  }

  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

  if (player.y > canvas.height + 80) {
    player.x = 45;
    player.y = 225;
    player.vx = 0;
    player.vy = 0;
  }

  if (!fragment.collected) {
    const dx = (player.x + player.w/2) - fragment.x;
    const dy = (player.y + player.h/2) - fragment.y;
    if (Math.hypot(dx,dy) < 48) {
      fragment.collected = true;
      updateObjective();
      finished = true;
      setTimeout(() => {
        const story = document.getElementById('story');
        document.getElementById('storyText').innerHTML =
          '<h2>Fragmento encontrado! ✦</h2><p>Você chegou até o alto das pedras do Jardim Encantado.</p><p>A Fase 1 agora pode crescer com novas áreas.</p>';
        document.getElementById('storyNext').textContent = 'Voltar ao mapa';
        document.getElementById('storyNext').onclick = () => location.href='campaign.html';
        story.classList.remove('hidden');
      }, 250);
    }
  }

  animTimer += dt;
  if (animTimer > 0.11) {
    anim = (anim + 1) % 5;
    animTimer = 0;
  }
}

function drawBackground() {
  ctx.fillStyle = '#a96be8';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  if (background.complete && background.naturalWidth) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
  }
}

function drawFragment() {
  if (fragment.collected) return;
  const t = performance.now()/450;
  const bob = Math.sin(t)*6;
  ctx.save();
  ctx.translate(fragment.x, fragment.y + bob);
  ctx.rotate(Math.sin(t)*0.12);
  ctx.fillStyle = '#ffe26b';
  ctx.strokeStyle = '#fff4b0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    const r=i%2===0 ? 18 : 8;
    const x=Math.cos(a)*r, y=Math.sin(a)*r;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
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
    ctx.arc(player.x+27, player.y+28, 22, 0, Math.PI*2);
    ctx.fill();
    return;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sprite,
    anim*32, 0, 32, 32,
    player.x-16, player.y-10, 86, 86
  );
}

function drawHud() {
  ctx.fillStyle = 'rgba(35,18,55,.68)';
  ctx.fillRect(14,14,300,42);
  ctx.fillStyle = '#fff';
  ctx.font = '17px system-ui';
  ctx.fillText(fragment.collected ? '✦ Fragmento encontrado' : '✦ Objetivo: subir até o fragmento', 26, 41);
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
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

document.getElementById('pauseBtn').onclick = togglePause;
document.getElementById('resumeBtn').onclick = togglePause;
document.getElementById('restartBtn').onclick = () => reset();
document.getElementById('menuBtn').onclick = () => location.href='index.html';

// Teclado
addEventListener('keydown', e => {
  const k = e.key;
  if (k === 'Escape') { e.preventDefault(); togglePause(); return; }
  keys[k] = true;
  if (k === ' ' || k === 'ArrowUp' || k === 'w') {
    e.preventDefault();
    jump();
  }
});
addEventListener('keyup', e => { keys[e.key] = false; });

// Controles touch robustos para celular
document.querySelectorAll('.touch-controls button').forEach(btn => {
  const action = btn.dataset.key;

  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    btn.setPointerCapture?.(e.pointerId);
    if (action === 'jump') {
      touch.jump = true;
      jump();
      setTimeout(() => touch.jump = false, 80);
    } else {
      touch[action] = true;
    }
  });

  const release = e => {
    e.preventDefault();
    if (action !== 'jump') touch[action] = false;
  };

  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('lostpointercapture', release);
});

document.getElementById('story').classList.add('hidden');
document.getElementById('storyNext').onclick = () => document.getElementById('story').classList.add('hidden');

function loop(now) {
  const dt = Math.min((now-last)/1000, 0.033);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

reset();
requestAnimationFrame(loop);
