const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const keys={};
const touch={left:false,right:false,jump:false};
let state='story',last=performance.now(),score=0,frame=0,frameTimer=0;

const sprite=new Image();
sprite.src='assets/zipzip_phase1_player_sheet.png';

const level={
  width:5000,
  spawn:{x:90,y:380},
  checkpoint:{x:2500,active:false},
  fragments:[
    {x:760,y:365,taken:false},{x:1550,y:295,taken:false},
    {x:2680,y:350,taken:false},{x:4150,y:305,taken:false}
  ],
  platforms:[
    {x:0,y:470,w:620,h:70},{x:720,y:430,w:300,h:22},{x:1110,y:365,w:250,h:22},
    {x:1450,y:425,w:330,h:22},{x:1870,y:335,w:260,h:22},{x:2200,y:450,w:310,h:22},
    {x:2600,y:405,w:330,h:22},{x:3030,y:325,w:290,h:22},{x:3420,y:430,w:390,h:22},
    {x:3920,y:360,w:330,h:22},{x:4300,y:450,w:700,h:70}
  ],
  enemies:[
    {x:430,y:434,w:38,h:36,vx:65,a:260,b:560,alive:true},
    {x:1190,y:329,w:38,h:36,vx:70,a:1110,b:1330,alive:true},
    {x:2740,y:369,w:38,h:36,vx:75,a:2610,b:2900,alive:true},
    {x:3510,y:394,w:38,h:36,vx:85,a:3430,b:3780,alive:true}
  ]
};

let player,cam=0;

function resetLevel(){
  player={x:level.spawn.x,y:level.spawn.y,w:52,h:70,vx:0,vy:0,ground:false,health:3,inv:0,spawnX:level.spawn.x,spawnY:level.spawn.y};
  level.fragments.forEach(f=>f.taken=false);
  level.enemies.forEach((e,i)=>{e.alive=true;e.x=[430,1190,2740,3510][i]});
  level.checkpoint.active=false;
  score=0; frame=0; frameTimer=0;
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
    if(k==='jump')touch.jump=true;
    else touch[k]=true;
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

function jumpPressed(){
  return keys[' ']||keys.arrowup||keys.w||touch.jump;
}

function update(dt){
  if(state!=='play')return;

  const left=keys.arrowleft||keys.a||touch.left;
  const right=keys.arrowright||keys.d||touch.right;
  player.vx=(right?270:0)-(left?270:0);

  if(jumpPressed()&&player.ground){
    player.vy=-650;
    player.ground=false;
    touch.jump=false;
  }

  player.vy+=1700*dt;
  const oldBottom=player.y+player.h;
  player.x+=player.vx*dt;
  player.y+=player.vy*dt;
  player.ground=false;

  for(const p of level.platforms){
    const bottom=player.y+player.h;
    if(player.x+player.w>p.x&&player.x<p.x+p.w&&oldBottom<=p.y&&bottom>=p.y&&player.vy>=0){
      player.y=p.y-player.h;
      player.vy=0;
      player.ground=true;
    }
  }

  player.x=Math.max(0,Math.min(level.width-player.w,player.x));
  player.inv=Math.max(0,player.inv-dt);

  if(player.x>level.checkpoint.x){
    level.checkpoint.active=true;
    player.spawnX=level.checkpoint.x+25;
    player.spawnY=300;
  }

  if(player.y>650)damage();

  for(const e of level.enemies){
    if(!e.alive)continue;
    e.x+=e.vx*dt;
    if(e.x<e.a||e.x>e.b)e.vx*=-1;

    if(player.inv<=0&&player.x+player.w-10>e.x&&player.x+10<e.x+e.w&&player.y+player.h>e.y&&player.y<e.y+e.h){
      if(player.vy>80&&player.y+player.h-e.y<28){
        e.alive=false;
        player.vy=-390;
        score+=100;
      }else damage();
    }
  }

  for(const f of level.fragments){
    if(f.taken)continue;
    if(player.x+player.w>f.x-16&&player.x<f.x+16&&player.y+player.h>f.y-16&&player.y<f.y+16){
      f.taken=true;
      score+=50;
      updateHud();
    }
  }

  if(level.fragments.every(f=>f.taken)&&player.x>4620)finish();
  frameTimer+=dt;
  if(frameTimer>.11){frame=(frame+1)%5;frameTimer=0}
}

function damage(){
  if(player.inv>0)return;
  player.health--;
  player.inv=1.2;
  if(player.health<=0){
    resetLevel();
    return;
  }
  player.x=player.spawnX;
  player.y=player.spawnY;
  player.vx=0;
  player.vy=0;
}

function finish(){
  state='story';
  $('story').classList.remove('hidden');
  $('storyText').innerHTML='<h2>Fase 1 concluída! ✦</h2><p>Você encontrou os quatro fragmentos e atravessou o primeiro jardim.</p><p>Este é o esqueleto jogável da Fase 1. A próxima etapa pode receber inimigos, combate e novos cenários.</p>';
  $('storyNext').textContent='Voltar ao mapa';
  $('storyNext').onclick=()=>location.href='campaign.html';
}

function drawBackground(){
  const g=ctx.createLinearGradient(0,0,0,540);
  g.addColorStop(0,'#f6c6e6');
  g.addColorStop(.55,'#d9b8df');
  g.addColorStop(1,'#a7c77d');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle='#b68bc1';
  for(let x=-200;x<level.width+500;x+=360){
    ctx.beginPath();ctx.arc(x+160,420,190,Math.PI,0);ctx.fill();
  }

  ctx.fillStyle='#7fac63';
  for(let x=-100;x<level.width+400;x+=250){
    ctx.beginPath();ctx.arc(x+100,475,105,Math.PI,0);ctx.fill();
  }
}

function drawPlatform(p){
  ctx.fillStyle='#7b4b37';
  ctx.fillRect(p.x,p.y,p.w,p.h);
  ctx.fillStyle='#8fc45f';
  ctx.fillRect(p.x,p.y-9,p.w,12);
  ctx.fillStyle='#b4dc72';
  for(let x=p.x+12;x<p.x+p.w-8;x+=34){
    ctx.fillRect(x,p.y-13,5,8);
  }
}

function drawEnemy(e){
  ctx.fillStyle='#54345f';
  ctx.beginPath();
  ctx.arc(e.x+19,e.y+20,19,Math.PI,0);
  ctx.lineTo(e.x+38,e.y+36);ctx.lineTo(e.x,e.y+36);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.arc(e.x+12,e.y+18,5,0,Math.PI*2);ctx.arc(e.x+26,e.y+18,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3b233f';
  ctx.beginPath();ctx.arc(e.x+12,e.y+19,2,0,Math.PI*2);ctx.arc(e.x+26,e.y+19,2,0,Math.PI*2);ctx.fill();
}

function drawFragment(f){
  ctx.save();
  ctx.translate(f.x,f.y);
  ctx.rotate(Math.sin(performance.now()/400+f.x)*.15);
  ctx.fillStyle='#ffe37a';
  ctx.beginPath();
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4, r=i%2?9:19;
    const x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();ctx.fill();
  ctx.strokeStyle='#fff5bd';ctx.lineWidth=3;ctx.stroke();
  ctx.restore();
}

function drawPlayer(){
  if(player.inv>0&&Math.floor(player.inv*12)%2===0)return;
  if(sprite.complete&&sprite.naturalWidth){
    const sx=frame*32;
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(sprite,sx,0,32,32,player.x-18,player.y-8,88,88);
  }else{
    ctx.fillStyle='#f5d59b';ctx.beginPath();ctx.arc(player.x+26,player.y+28,27,0,Math.PI*2);ctx.fill();
  }
}

function draw(){
  ctx.clearRect(0,0,960,540);
  cam=Math.max(0,Math.min(level.width-960,player.x-340));
  ctx.save();
  ctx.translate(-cam,0);
  drawBackground();

  for(const p of level.platforms)drawPlatform(p);

  ctx.fillStyle='#e6c86c';
  ctx.fillRect(level.checkpoint.x,315,6,115);
  ctx.font='25px sans-serif';
  ctx.fillText(level.checkpoint.active?'✓':'⚑',level.checkpoint.x-10,310);

  for(const f of level.fragments)if(!f.taken)drawFragment(f);
  for(const e of level.enemies)if(e.alive)drawEnemy(e);

  ctx.fillStyle='#f5d7e8';
  ctx.fillRect(4620,390,12,80);
  ctx.fillStyle='#ff7fb8';
  ctx.beginPath();ctx.moveTo(4632,390);ctx.lineTo(4690,410);ctx.lineTo(4632,430);ctx.closePath();ctx.fill();
  ctx.font='18px system-ui';ctx.fillStyle='#5c304e';ctx.fillText('FINAL',4600,375);

  drawPlayer();
  ctx.restore();

  const got=level.fragments.filter(f=>f.taken).length;
  ctx.fillStyle='rgba(35,18,35,.72)';
  ctx.fillRect(14,14,300,44);
  ctx.fillStyle='#fff';
  ctx.font='17px system-ui';
  ctx.fillText('✦ '+score+'    ♥ '+player.health+'    Fragmentos '+got+'/4',28,42);
}

function loop(now){
  const dt=Math.min((now-last)/1000,.033);
  last=now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
resetLevel();
$('storyText').innerHTML='<h2>Fase 1 · Jardim Encantado</h2><p>Este é o primeiro esqueleto jogável de Zip Zip.</p><p>Use os sprites do hamster para correr, pular, derrotar os pequenos inimigos e coletar os quatro fragmentos.</p>';
requestAnimationFrame(loop);