const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
const keys={},touch={left:false,right:false,jump:false};
let state='story',last=performance.now(),frame=0,frameTimer=0,score=0;
const bg=new Image(); bg.src='assets/zipzip_jardim.webp';
const sprite=new Image(); sprite.src='assets/zipzip_phase1_player_sheet.png';

const platforms=[
  {x:0,y:285,w:158,h:35,name:'Ilha esquerda'},
  {x:170,y:370,w:220,h:28,name:'Plataforma do tronco'},
  {x:385,y:420,w:295,h:30,name:'Campo central'},
  {x:410,y:372,w:78,h:18,name:'Plataforma flutuante 1'},
  {x:580,y:308,w:82,h:18,name:'Plataforma flutuante 2'},
  {x:675,y:333,w:285,h:35,name:'Ilha direita'}
];
const solidObstacles=[
  {x:190,y:307,w:155,h:63,type:'log'},
  {x:340,y:401,w:36,h:19,type:'rock'},
  {x:505,y:404,w:34,h:16,type:'rock'},
  {x:612,y:390,w:38,h:20,type:'rock'}
];
const hazards=[
  {x:365,y:348,r:10},{x:548,y:350,r:11},{x:690,y:315,r:10}
];
const fragments=[
  {x:95,y:245,taken:false},{x:455,y:330,taken:false},
  {x:620,y:265,taken:false},{x:825,y:290,taken:false}
];
const enemies=[
  {x:85,y:249,w:28,h:30,vx:38,a:20,b:130,alive:true},
  {x:420,y:390,w:28,h:30,vx:45,a:390,b:620,alive:true},
  {x:780,y:303,w:30,h:30,vx:42,a:700,b:900,alive:true}
];
const goal={x:920,y:273,w:28,h:60};
let player;

function resetLevel(){
  player={x:55,y:200,w:52,h:70,vx:0,vy:0,ground:false,health:3,inv:0,spawnX:55,spawnY:200};
  fragments.forEach(f=>f.taken=false);
  enemies.forEach(e=>{e.alive=true});
  score=0; frame=0; frameTimer=0; state='story';
  $('pause').classList.add('hidden');
  $('story').classList.remove('hidden');
  $('storyNext').textContent='Começar fase';
  $('storyNext').onclick=begin;
  updateHud();
}
function begin(){state='play';$('story').classList.add('hidden');last=performance.now()}
function updateHud(){
  const got=fragments.filter(f=>f.taken).length;
  $('objective').textContent=got<4?`Colete ${4-got} fragmento${4-got===1?'':'s'}`:'Chegue à bandeira';
}
$('pauseBtn').onclick=togglePause;
$('resumeBtn').onclick=togglePause;
$('restartBtn').onclick=()=>{resetLevel()};
$('menuBtn').onclick=()=>location.href='index.html';

addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(k==='escape'){togglePause();return}
  keys[k]=true;
  if([' ','arrowup','arrowleft','arrowright'].includes(k))e.preventDefault();
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
const controlButtons=document.querySelectorAll('.touch-controls button');
controlButtons.forEach(btn=>{
  const k=btn.dataset.key;
  const press=e=>{
    e.preventDefault();
    if(btn.setPointerCapture && e.pointerId!=null){try{btn.setPointerCapture(e.pointerId)}catch(_){}}
    if(k==='jump'){
      touch.jump=true;
    }else{
      touch[k]=true;
    }
  };
  const release=e=>{
    e.preventDefault();
    if(k!=='jump') touch[k]=false;
  };
  btn.addEventListener('pointerdown',press);
  btn.addEventListener('pointerup',release);
  btn.addEventListener('pointercancel',release);
  btn.addEventListener('lostpointercapture',release);
  btn.addEventListener('contextmenu',e=>e.preventDefault());
});
function togglePause(){
  if(state==='play'){state='pause';$('pause').classList.remove('hidden')}
  else if(state==='pause'){state='play';$('pause').classList.add('hidden');last=performance.now()}
}
function jumpPressed(){return keys[' ']||keys.arrowup||keys.w||touch.jump}
function rectsOverlap(a,b){
  return a.x+a.w>b.x && a.x<b.x+b.w && a.y+a.h>b.y && a.y<b.y+b.h;
}
function damage(){
  if(player.inv>0)return;
  player.health--; player.inv=1.15;
  if(player.health<=0){resetLevel();return}
  player.x=player.spawnX;player.y=player.spawnY;player.vx=0;player.vy=0;
}
function landOnPlatforms(oldBottom){
  let landed=null;
  const bottom=player.y+player.h;
  for(const p of platforms){
    if(player.x+player.w>p.x && player.x<p.x+p.w &&
       oldBottom<=p.y && bottom>=p.y && player.vy>=0){
      if(!landed||p.y<landed.y)landed=p;
    }
  }
  if(landed){
    player.y=landed.y-player.h;
    player.vy=0;player.ground=true;
    if(landed.x>650){player.spawnX=720;player.spawnY=263}
  }
}
function update(dt){
  if(state!=='play')return;
  const left=keys.arrowleft||keys.a||touch.left;
  const right=keys.arrowright||keys.d||touch.right;
  player.vx=(right?255:0)-(left?255:0);
  if(jumpPressed()&&player.ground){
    player.vy=-620;player.ground=false;touch.jump=false;
  }
  player.vy+=1650*dt;
  const oldBottom=player.y+player.h;
  player.x+=player.vx*dt;
  player.y+=player.vy*dt;
  player.ground=false;
  landOnPlatforms(oldBottom);

  for(const o of solidObstacles){
    if(rectsOverlap(player,o)){
      if(player.vy>=0 && player.y+player.h-o.y<26){
        player.y=o.y-player.h;player.vy=0;player.ground=true;
      }else{
        player.x-=player.vx*dt;player.vx=0;
      }
    }
  }

  player.x=Math.max(0,Math.min(960-player.w,player.x));
  player.inv=Math.max(0,player.inv-dt);
  if(player.y>560)damage();

  for(const h of hazards){
    const cx=Math.max(player.x,Math.min(h.x,player.x+player.w));
    const cy=Math.max(player.y,Math.min(h.y,player.y+player.h));
    if(Math.hypot(h.x-cx,h.y-cy)<h.r+4)damage();
  }

  for(const e of enemies){
    if(!e.alive)continue;
    e.x+=e.vx*dt;
    if(e.x<e.a||e.x>e.b)e.vx*=-1;
    if(rectsOverlap(player,e)){
      if(player.vy>80 && player.y+player.h-e.y<22){
        e.alive=false;player.vy=-360;score+=100;
      }else damage();
    }
  }
  for(const f of fragments){
    if(f.taken)continue;
    if(player.x+player.w>f.x-14&&player.x<f.x+14&&player.y+player.h>f.y-14&&player.y<f.y+14){
      f.taken=true;score+=50;updateHud();
    }
  }
  if(fragments.every(f=>f.taken)&&rectsOverlap(player,goal))finish();
  frameTimer+=dt;
  if(frameTimer>.11){frame=(frame+1)%5;frameTimer=0}
}
function finish(){
  state='story';
  $('story').classList.remove('hidden');
  $('storyText').innerHTML='<h2>Fase 1 concluída! ✦</h2><p>O Jardim Encantado foi atravessado com sucesso.</p><p>Você coletou todos os fragmentos e chegou à bandeira.</p>';
  $('storyNext').textContent='Voltar ao mapa';
  $('storyNext').onclick=()=>location.href='campaign.html';
}
function drawBackground(){
  if(bg.complete&&bg.naturalWidth)ctx.drawImage(bg,0,0,960,540);
  else {ctx.fillStyle='#8b4bd1';ctx.fillRect(0,0,960,540)}
}
function drawPlayer(){
  if(player.inv>0&&Math.floor(player.inv*12)%2===0)return;
  if(sprite.complete&&sprite.naturalWidth){
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(sprite,frame*32,0,32,32,player.x-18,player.y-10,88,88);
  }
}
function drawFragment(f){
  ctx.save();ctx.translate(f.x,f.y);ctx.rotate(Math.sin(performance.now()/300+f.x)*.12);
  ctx.fillStyle='#ffe36e';ctx.strokeStyle='#fff6b7';ctx.lineWidth=3;
  ctx.beginPath();
  for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?8:17;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}
  ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
function drawEnemy(e){
  ctx.fillStyle='#4b315c';ctx.beginPath();ctx.arc(e.x+14,e.y+17,15,Math.PI,0);ctx.lineTo(e.x+28,e.y+30);ctx.lineTo(e.x,e.y+30);ctx.closePath();ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(e.x+9,e.y+15,4,0,7);ctx.arc(e.x+19,e.y+15,4,0,7);ctx.fill();
  ctx.fillStyle='#2b1833';ctx.fillRect(e.x+8,e.y+15,3,3);ctx.fillRect(e.x+18,e.y+15,3,3);
}
function draw(){
  ctx.clearRect(0,0,960,540);
  drawBackground();
  for(const h of hazards){
    ctx.fillStyle='rgba(70,30,100,.22)';ctx.beginPath();ctx.arc(h.x,h.y,h.r+5,0,Math.PI*2);ctx.fill();
  }
  for(const f of fragments)if(!f.taken)drawFragment(f);
  for(const e of enemies)if(e.alive)drawEnemy(e);
  ctx.fillStyle='#f7e6ef';ctx.fillRect(goal.x,goal.y,4,60);
  ctx.fillStyle='#ff79b7';ctx.beginPath();ctx.moveTo(goal.x+4,goal.y);ctx.lineTo(goal.x+30,goal.y+9);ctx.lineTo(goal.x+4,goal.y+18);ctx.closePath();ctx.fill();
  drawPlayer();
  ctx.fillStyle='rgba(45,19,60,.70)';ctx.fillRect(14,14,280,42);
  ctx.fillStyle='#fff';ctx.font='16px system-ui';
  ctx.fillText(`✦ ${score}   ♥ ${player.health}   Fragmentos ${fragments.filter(f=>f.taken).length}/4`,26,41);
}
function loop(now){
  const dt=Math.min((now-last)/1000,.033);last=now;
  update(dt);draw();requestAnimationFrame(loop);
}
$('storyText').innerHTML='<h2>Fase 1 · Jardim Encantado</h2><p>Agora o cenário é o Jardim Encantado da arte enviada.</p><p>O tronco, plataformas, pedras e criaturas têm colisão e comportamento próprios. Colete os quatro fragmentos para liberar a bandeira final.</p>';
resetLevel();
requestAnimationFrame(loop);