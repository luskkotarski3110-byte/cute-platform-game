const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const keys={},touch={left:false,right:false,jump:false};
let state='story',last=performance.now(),score=0,frame=0,frameTimer=0;

const sprite=new Image();
sprite.src='assets/zipzip_phase1_player_sheet.png';

const background=new Image();
background.src='assets/zipzip_phase1_bg.jpg';

const level={
  width:960,
  spawn:{x:70,y:370},
  checkpoint:{x:500,active:false},
  fragments:[
    {x:185,y:425,taken:false},
    {x:440,y:445,taken:false},
    {x:680,y:382,taken:false},
    {x:865,y:350,taken:false}
  ],
  platforms:[
    {x:0,y:462,w:265,h:30},
    {x:270,y:492,w:350,h:30},
    {x:535,y:420,w:115,h:18},
    {x:650,y:392,w:120,h:18},
    {x:805,y:455,w:155,h:30}
  ],
  enemies:[
    {x:350,y:456,w:38,h:36,vx:55,a:280,b:535,alive:true},
    {x:820,y:419,w:38,h:36,vx:65,a:805,b:920,alive:true}
  ]
};

let player,cam=0;

function resetLevel(){
  player={x:level.spawn.x,y:level.spawn.y,w:52,h:70,vx:0,vy:0,ground:false,health:3,inv:0,spawnX:level.spawn.x,spawnY:level.spawn.y};
  level.fragments.forEach(f=>f.taken=false);
  level.enemies.forEach((e,i)=>{e.alive=true;e.x=i?820:350});
  level.checkpoint.active=false;
  score=0;frame=0;frameTimer=0;
  updateHud();
}

function updateHud(){
  const got=level.fragments.filter(f=>f.taken).length;
  $('objective').textContent=got===4?'Chegue à bandeira final':'Colete '+(4-got)+' fragmento'+(4-got===1?'':'s')+' restante'+(4-got===1?'':'s');
}

function begin(){
  resetLevel();
  $('story').classList.add('hidden');
  state='play';
}

$('storyNext').onclick=begin;
$('pauseBtn').onclick=()=>togglePause();
$('resumeBtn').onclick=()=>togglePause();
$('restartBtn').onclick=()=>{ $('pause').classList.add('hidden'); begin(); };
$('menuBtn').onclick=()=>location.href='index.html';

addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(k==='escape'){togglePause();return}
  keys[k]=true;
  if([' ','arrowup','arrowleft','arrowright'].includes(k))e.preventDefault();
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

document.querySelectorAll('.touch-controls button').forEach(btn=>{
  const k=btn.dataset.key;
  btn.addEventListener('pointerdown',e=>{
    e.preventDefault();
    if(k==='jump')touch.jump=true; else touch[k]=true;
  });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,e=>{
    e.preventDefault();
    if(k!=='jump')touch[k]=false;
  }));
});

function togglePause(){
  if(state==='play'){state='pause';$('pause').classList.remove('hidden')}
  else if(state==='pause'){state='play';$('pause').classList.add('hidden')}
}
function jumpPressed(){return keys[' ']||keys.arrowup||keys.w||touch.jump}

function update(dt){
  if(state!=='play')return;
  const left=keys.arrowleft||keys.a||touch.left;
  const right=keys.arrowright||keys.d||touch.right;
  player.vx=(right?270:0)-(left?270:0);

  if(jumpPressed()&&player.ground){
    player.vy=-650;player.ground=false;touch.jump=false;
  }

  player.vy+=1700*dt;
  const oldBottom=player.y+player.h;
  player.x+=player.vx*dt;
  player.y+=player.vy*dt;
  player.ground=false;

  for(const p of level.platforms){
    const bottom=player.y+player.h;
    if(player.x+player.w>p.x&&player.x<p.x+p.w&&oldBottom<=p.y&&bottom>=p.y&&player.vy>=0){
      player.y=p.y-player.h;player.vy=0;player.ground=true;
    }
  }

  player.x=Math.max(0,Math.min(level.width-player.w,player.x));
  player.inv=Math.max(0,player.inv-dt);

  if(player.x>level.checkpoint.x){
    level.checkpoint.active=true;
    player.spawnX=level.checkpoint.x+15;
    player.spawnY=350;
  }

  if(player.y>620)damage();

  for(const e of level.enemies){
    if(!e.alive)continue;
    e.x+=e.vx*dt;
    if(e.x<e.a||e.x>e.b)e.vx*=-1;
    if(player.inv<=0&&player.x+player.w-10>e.x&&player.x+10<e.x+e.w&&player.y+player.h>e.y&&player.y<e.y+e.h){
      if(player.vy>80&&player.y+player.h-e.y<28){
        e.alive=false;player.vy=-390;score+=100;
      }else damage();
    }
  }

  for(const f of level.fragments){
    if(f.taken)continue;
    if(player.x+player.w>f.x-16&&player.x<f.x+16&&player.y+player.h>f.y-16&&player.y<f.y+16){
      f.taken=true;score+=50;updateHud();
    }
  }

  if(level.fragments.every(f=>f.taken)&&player.x>900)finish();

  frameTimer+=dt;
  if(frameTimer>.11){frame=(frame+1)%5;frameTimer=0}
}

function damage(){
  if(player.inv>0)return;
  player.health--;player.inv=1.2;
  if(player.health<=0){resetLevel();return}
  player.x=player.spawnX;player.y=player.spawnY;player.vx=0;player.vy=0;
}

function finish(){
  state='story';
  $('story').classList.remove('hidden');
  $('storyText').innerHTML='<h2>Fase 1 concluída! ✦</h2><p>Você atravessou o Jardim Encantado e encontrou os quatro fragmentos.</p><p>Agora podemos expandir este cenário com mais inimigos, poderes e partes do mapa.</p>';
  $('storyNext').textContent='Voltar ao mapa';
  $('storyNext').onclick=()=>location.href='campaign.html';
}

function drawBackground(){
  ctx.fillStyle='#c99bea';
  ctx.fillRect(0,0,960,540);
  if(background.complete&&background.naturalWidth){
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(background,0,0,960,540);
  }
}

function drawEnemy(e){
  ctx.save();
  ctx.fillStyle='rgba(54,25,68,.95)';
  ctx.beginPath();ctx.arc(e.x+19,e.y+20,19,Math.PI,0);ctx.lineTo(e.x+38,e.y+36);ctx.lineTo(e.x,e.y+36);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.arc(e.x+12,e.y+18,5,0,Math.PI*2);ctx.arc(e.x+26,e.y+18,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3b233f';
  ctx.beginPath();ctx.arc(e.x+12,e.y+19,2,0,Math.PI*2);ctx.arc(e.x+26,e.y+19,2,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawFragment(f){
  ctx.save();ctx.translate(f.x,f.y);ctx.rotate(Math.sin(performance.now()/400+f.x)*.15);
  ctx.fillStyle='#ffe37a';ctx.beginPath();
  for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?8:18,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
  ctx.closePath();ctx.fill();ctx.strokeStyle='#fff5bd';ctx.lineWidth=3;ctx.stroke();ctx.restore();
}

function drawCheckpoint(){
  ctx.fillStyle='#e6c86c';ctx.fillRect(level.checkpoint.x,335,5,115);
  ctx.font='22px sans-serif';ctx.fillStyle='#fff';ctx.fillText(level.checkpoint.active?'✓':'⚑',level.checkpoint.x-8,328);
}

function drawGoal(){
  ctx.fillStyle='#f7e8f2';ctx.fillRect(925,382,7,80);
  ctx.fillStyle='#ff75b7';ctx.beginPath();ctx.moveTo(932,382);ctx.lineTo(955,391);ctx.lineTo(932,401);ctx.closePath();ctx.fill();
}

function drawPlayer(){
  if(player.inv>0&&Math.floor(player.inv*12)%2===0)return;
  if(sprite.complete&&sprite.naturalWidth){
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(sprite,frame*32,0,32,32,player.x-18,player.y-8,88,88);
  }
}

function draw(){
  ctx.clearRect(0,0,960,540);
  drawBackground();
  drawCheckpoint();
  drawGoal();
  for(const f of level.fragments)if(!f.taken)drawFragment(f);
  for(const e of level.enemies)if(e.alive)drawEnemy(e);
  drawPlayer();

  const got=level.fragments.filter(f=>f.taken).length;
  ctx.fillStyle='rgba(35,18,35,.72)';ctx.fillRect(14,14,310,44);
  ctx.fillStyle='#fff';ctx.font='17px system-ui';
  ctx.fillText('✦ '+score+'    ♥ '+player.health+'    Fragmentos '+got+'/4',28,42);
}

function loop(now){
  const dt=Math.min((now-last)/1000,.033);
  last=now;update(dt);draw();requestAnimationFrame(loop);
}

resetLevel();
$('storyText').innerHTML='<h2>Fase 1 · Jardim Encantado</h2><p>Agora o cenário da fase usa a arte do jardim que você escolheu.</p><p>Corra, pule, derrote os pequenos inimigos e colete os quatro fragmentos.</p>';
requestAnimationFrame(loop);