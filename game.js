// Starfall Chronicle - engine: world, combat, AI, bosses, audio, saves
'use strict';
const cv=document.getElementById('game'),cx=cv.getContext('2d');
let VW=400,VH=240,SC=3;
const T=16,PI=Math.PI,TAU=PI*2;
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a),ri=(a,b)=>Math.floor(rnd(a,b+1)),pick=a=>a[Math.random()*a.length|0];
const clamp=(v,a,b)=>v<a?a:v>b?b:v,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),angTo=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d};
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function resize(){const w=innerWidth,h=innerHeight;SC=Math.max(1,Math.round(Math.min(w,h)/215));VW=Math.ceil(w/SC);VH=Math.ceil(h/SC);cv.width=VW;cv.height=VH;cx.imageSmoothingEnabled=false}
addEventListener('resize',resize);resize();

// ---------- STATE ----------
let S=null,A=null,P=null,mode='title';
const W={en:[],pr:[],pa:[],tx:[],warn:[],pk:[],props:[],npcs:[],boss:null};
let cam={x:0,y:0},shake=0,hitstop=0,slowmo=0,gtime=0,banner=null;
const keys={},mouse={x:0,y:0,wx:0,wy:0,down:false,last:-9};
const TIN={x:0,y:0,active:false};
const need=l=>Math.floor(25+l*20+l*l*5);
function newState(slot){return{slot,lvl:1,xp:0,pts:0,skp:0,str:1,vit:1,agi:1,int:1,gold:30,items:[],eq:{},ore:1,pots:3,skills:{},active:'',main:0,
 sq:{glow:{s:0,c:0},bounty:{s:0,c:0},echo:{s:0,c:0}},flags:{},area:'town',px:0,py:0,time:0,kills:0,uid:0,boss:{},ending:''}}
function mkWeapon(i,lv,r){const w=WEAPONS[i];const it={u:++S.uid,k:'w',i,r:r??w[2],lv:Math.max(1,lv|0),p:0,aff:[]};rollAff(it);return it}
function rollAff(it){const w=WEAPONS[it.i],n=RARITY[it.r].aff,ks=Object.keys(AFFIXES);it.aff=[];if(w[7]&&n)it.aff.push([w[7],ri(...AFFIXES[w[7]].r)]);
 let g=0;while(it.aff.length<n&&g++<50){const k=pick(ks);if(!it.aff.some(a=>a[0]===k))it.aff.push([k,ri(...AFFIXES[k].r)])}}
function mkGear(k,i){return{u:++S.uid,k,i,r:(k==='a'?ARMORS:TRINKETS)[i][1],lv:1,p:0}}
function rollRarity(tier,boost=0){const wt=[[62,27,8,2.5,.5],[38,36,18,7,1],[24,34,26,13,3]][tier];let x=rnd(100),r=0;for(;r<4;r++){x-=wt[r];if(x<0)break}return Math.min(4,r+boost)}
function randWeapon(r,lv,cls){const c=WEAPONS.map((w,i)=>i).filter(i=>WEAPONS[i][2]===r&&(!cls||WEAPONS[i][1]===cls));return mkWeapon(pick(c),lv,r)}
function randGear(r){const k=Math.random()<.5?'a':'t',L=k==='a'?ARMORS:TRINKETS;let c=L.map((x,i)=>i).filter(i=>L[i][1]===r);if(!c.length)c=L.map((x,i)=>i).filter(i=>L[i][1]<=r);return mkGear(k,pick(c))}
const tierOf=()=>A&&A.def.lvl>=10?2:A&&A.def.lvl>=5?1:S.main>=5?2:S.main>=3?1:0;
function itemName(it){return it.k==='w'?WEAPONS[it.i][0]+(it.p?' +'+it.p:''):(it.k==='a'?ARMORS:TRINKETS)[it.i][0]}
function wDmg(it){if(!it)return 4;const w=WEAPONS[it.i];let m=1;it.aff.forEach(a=>{if(a[0]==='might')m+=a[1]/100});return CLASSES[w[1]].dmg*w[3]*RARITY[it.r].m*(1+.13*(it.lv-1))*(1+.1*it.p)*m}
function itemValue(it){return Math.round(RARITY[it.r].v*(1+(it.lv||1)*.12)*(1+(it.p||0)*.25))}
const getItem=u=>S.items.find(i=>i.u===u),eqW=()=>getItem(S.eq.w),cls=()=>{const w=eqW();return w?WEAPONS[w.i][1]:'sword'};
function addItem(it){if(S.items.length>=48){toast('Inventory full!','#f66');return false}S.items.push(it);return true}
let D={};
function calc(){const d={dm:1+.04*(S.str-1),hp:100+12*(S.vit-1)+S.lvl*6,def:.5*(S.vit-1),spd:72*(1+.01*(S.agi-1)),crit:5+.5*S.agi,cd:1.75,st:100+4*(S.agi-1),mp:50+6*(S.int-1),as:1,el:1+.04*(S.int-1),gold:1,xp:1,mpr:2+.1*S.int,str:1,burn:0,frost:0,life:0};
 const w=eqW();if(w){d.crit+=CLASSES[WEAPONS[w.i][1]].crit;w.aff.forEach(([k,v])=>{if(k==='crit')d.crit+=v;else if(k==='swift')d.as+=v/100;else if(k!=='might')d[k]=v})}
 const bon=s=>{if(!s)return;const[k,v]=s.split(':');const n=+v;if(k==='spd')d.spd*=1+n/100;else if(k==='mp')d.mp+=n;else if(k==='hp')d.hp+=n;else if(k==='crit')d.crit+=n;else if(k==='gold')d.gold+=n/100;else if(k==='xp')d.xp+=n/100;else if(k==='st')d.st+=n;else if(k==='elem')d.el+=n/100;else if(k==='as')d.as+=n/100;else if(k==='all'){const f=1+n/100;d.dm*=f;d.hp*=f;d.spd*=f;d.crit*=f;d.el*=f;d.st*=f;d.mp*=f}};
 const a=getItem(S.eq.a);if(a){const x=ARMORS[a.i];d.def+=x[2]*RARITY[a.r].m;d.hp+=x[3];bon(x[4])}
 const t=getItem(S.eq.t);if(t){bon(TRINKETS[t.i][2]);if(t.i===8)d.mpr+=2}
 const k=S.skills;if(k.m1)d.dm*=1.12;if(k.m2)d.cd+=.5;if(k.g1)d.spd*=1.1;if(k.g2)d.str=1.4;if(k.g4)d.as+=.15;if(k.a1){d.mp+=30;d.mpr+=1.5}if(k.a3)d.el*=1.5;
 d.hp=Math.round(d.hp);d.mp=Math.round(d.mp);d.st=Math.round(d.st);D=d;if(P){P.hp=Math.min(P.hp,d.hp);P.mp=Math.min(P.mp,d.mp)}return d}
function toast(t,c){if(window.UI)UI.toast(t,c)}
function addXp(n){S.xp+=Math.round(n*D.xp);let up=0;while(S.xp>=need(S.lvl)){S.xp-=need(S.lvl);S.lvl++;S.pts+=3;S.skp++;up=1}
 if(up){calc();P.hp=D.hp;P.mp=D.mp;sfx('lvl');toast('LEVEL UP! Lv '+S.lvl+' - stat & skill points ready (C)','#ffd34a');burst(P.x,P.y-8,'#ffd34a',30,90)}}

// ---------- AREAS ----------
function genTown(){const w=44,h=32,R=mulberry(99),m=[];for(let y=0;y<h;y++){m.push([]);for(let x=0;x<w;x++)m[y].push(x<2||y<2||x>w-3||y>h-3?'#':R()<.08?',':'.')}
 const set=(x,y,c)=>{if(m[y]&&m[y][x]!==undefined)m[y][x]=c},rect=(x,y,a,b,c)=>{for(let j=y;j<y+b;j++)for(let i=x;i<x+a;i++)set(i,j,c)};
 for(let i=0;i<40;i++){const x=ri(3,40),y=ri(3,28);if((x<15||x>28)&&(y<11||y>20)&&R()<.5)set(x,y,'#')}
 rect(21,0,2,h,'=');rect(0,15,w,2,'=');rect(15,11,14,10,'=');rect(20,14,4,3,'~');
 const house=(x,y,a,b)=>{rect(x-1,y-1,a+2,b+3,'.');rect(x,y,a,b-2,'R');rect(x,y+b-2,a,2,'W');set(x+(a>>1),y+b-1,'D')};
 house(5,3,9,6);house(30,3,8,6);house(5,21,8,5);house(30,21,8,5);rect(9,9,1,3,'=');rect(34,9,1,3,'=');rect(9,11,7,1,'=');rect(28,11,7,1,'=');rect(9,26,13,1,'=');rect(22,26,13,1,'=');
 set(29,10,'A');set(14,22,'K');set(15,11,'L');set(28,11,'L');set(15,20,'L');set(28,20,'L');
 rect(21,0,2,2,'N');rect(w-2,15,2,2,'E');rect(21,h-2,2,2,'M');rect(2,14,1,4,'F');rect(25,24,6,1,'F');
 return{m,W:w,H:h,spawn:[21.5,18.5],npcs:{oren:[12,12],brann:[31,11],sela:[11,20],mira:[32,20],dace:[39,13],vesna:[25,26],guardS:[24,29]},fountain:[22,15]}}
function genArea(key){const d=AREAS[key],R=mulberry(d.seed),w=d.W,h=d.H;let g=[];
 for(let y=0;y<h;y++){g.push([]);for(let x=0;x<w;x++)g[y].push(x<2||y<2||x>w-3||y>h-3||R()<d.fill?1:0)}
 for(let it=0;it<4;it++){const n=g.map(r=>r.slice());for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let c=0;for(let j=-1;j<2;j++)for(let i=-1;i<2;i++)c+=g[y+j][x+i];n[y][x]=c>=5?1:0}g=n}
 const clr=(cx_,cy,r)=>{for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx_-r);x<=cx_+r;x++)if(x>1&&y>1&&x<w-2&&y<h-2&&Math.hypot(x-cx_,y-cy)<=r)g[y][x]=0};
 const pts=d.pts;for(let i=0;i<d.path.length-1;i++){let[x,y]=pts[d.path[i]];const[tx,ty]=pts[d.path[i+1]];let s=0;while(Math.hypot(tx-x,ty-y)>1&&s++<600){const a=Math.atan2(ty-y,tx-x)+(R()-.5)*1.6;x+=Math.cos(a);y+=Math.sin(a);clr(x,y,1.6+R()*.8)}}
 for(const k in pts)clr(pts[k][0],pts[k][1],k==='boss'?8:4);
 const seen=g.map(r=>r.map(()=>0)),st=[pts.entry];seen[pts.entry[1]][pts.entry[0]]=1;while(st.length){const[x,y]=st.pop();for(const[i,j]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+i,Y=y+j;if(!g[Y][X]&&!seen[Y][X]){seen[Y][X]=1;st.push([X,Y])}}}
 const m=[];for(let y=0;y<h;y++){m.push([]);for(let x=0;x<w;x++){if(!seen[y][x])m[y].push(d.wall);else m[y].push(R()<.12?d.alt:d.floor)}}
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){if(!seen[y][x])continue;let open=1;for(let j=-1;j<2;j++)for(let i=-1;i<2;i++)if(!seen[y+j][x+i])open=0;let near=0;for(const k in pts)if(Math.hypot(x-pts[k][0],y-pts[k][1])<5)near=1;if(open&&!near&&R()<.035)m[y][x]=d.edge}
 return{m,W:w,H:h,seen}}
function buildAreaCanvas(a,base){const c=document.createElement('canvas');c.width=a.W*T;c.height=a.H*T;const g=c.getContext('2d'),R=mulberry(5);
 for(let y=0;y<a.H;y++)for(let x=0;x<a.W;x++){const ch=a.m[y][x];let deep=0;if(SOLID.has(ch)){deep=1;for(let j=-1;j<2;j++)for(let i=-1;i<2;i++){const r=a.m[y+j];if(!r||!SOLID.has(r[x+i]??ch)||r[x+i]!==ch)deep=0}}drawTile(g,ch,x,y,R,base,deep)}return c}
const AREACACHE={};
function enterArea(key,px,py,fromGate){const d=AREAS[key];let a=AREACACHE[key];
 if(!a){a=key==='town'?genTown():genArea(key);a.cv=buildAreaCanvas(a,key==='town'?'.':d.floor);AREACACHE[key]=a}
 A={key,def:d,...a};S.area=key;W.en=[];W.pr=[];W.pa=[];W.tx=[];W.warn=[];W.pk=[];W.props=[];W.npcs=[];W.boss=null;
 if(key==='town'){for(const id in a.npcs){const[x,y]=a.npcs[id];W.npcs.push({id,x:x*T+8,y:y*T+8,pal:NPCS[id]?NPCS[id].pal:{h:'#6a5a4a',c:'#7a6a4a',C:'#5a4a3a',s:'#d8a078',b:'#333'},n:NPCS[id]?NPCS[id].n:'Miner'})}
  W.props.push({k:'fountain',x:a.fountain[0]*T,y:a.fountain[1]*T+8});
  if(px===undefined){const sp=fromGate==='forest'?[21.5,3]:fromGate==='desert'?[40.5,16]:fromGate==='cave'?[21.5,28.5]:a.spawn;px=sp[0]*T;py=sp[1]*T}
  if(W.boss===null&&window.UI)UI.restock()}
 else{const p=d.pts;W.props.push({k:'exit',x:p.entry[0]*T+8,y:p.entry[1]*T+8});
  d.chests.forEach(c=>{if(!S.flags['ch_'+key+c])W.props.push({k:'chest',id:c,x:(p[c][0]+2)*T+8,y:p[c][1]*T+8,last:c===d.chests[d.chests.length-1]})});
  W.props.push({k:'lore',x:(p.a[0]-2)*T+8,y:p.a[1]*T+8});
  (d.pylons||[]).forEach(c=>{W.props.push({k:'pylon',id:c,x:p[c][0]*T+8,y:(p[c][1]-2)*T+8,on:!!S.flags['py_'+c],prog:0})});
  if(S.boss[d.boss])W.props.push({k:'portal',x:p.boss[0]*T+8,y:p.boss[1]*T+8});
  const R=Math.random;let n=0,g=0;while(n<d.count&&g++<5000){const x=ri(2,a.W-3),y=ri(2,a.H-3);if(!a.seen[y][x]||SOLID.has(a.m[y][x]))continue;if(Math.hypot(x-p.entry[0],y-p.entry[1])<12||Math.hypot(x-p.boss[0],y-p.boss[1])<11)continue;
   const lv=Math.round(d.lvl+(x/a.W)*(d.lvlMax-d.lvl));spawnEnemy(pick(d.enemies),x*T+8,y*T+8,lv);n++}
  if(key==='forest'&&S.sq.glow.s===1){let c=0;while(c<9){const x=ri(3,a.W-4),y=ri(3,a.H-4);if(a.seen[y][x]&&!SOLID.has(a.m[y][x])&&x>12){W.props.push({k:'glow',x:x*T+8,y:y*T+8});c++}}}
  if(!S.boss[d.boss])spawnBoss(d.boss,p.boss[0]*T+8,p.boss[1]*T+8);
  if(px===undefined){px=(p.entry[0]+2)*T+8;py=p.entry[1]*T+8}}
 if(!P)P=mkPlayer();P.x=px;P.y=py;P.roll=0;P.atk=null;P.dash=null;P.steps=null;cam.x=P.x-VW/2;cam.y=P.y-VH/2;
 music(d.music);banner={t:d.name,l:3};if(window.UI)UI.bossBar(null);if(window.UI)UI.banner(d.name,key==='town'?'Hub Town':'Area Lv '+d.lvl+'-'+d.lvlMax)}
function solidAt(px,py){const tx=Math.floor(px/T),ty=Math.floor(py/T);if(tx<0||ty<0||tx>=A.W||ty>=A.H)return true;return SOLID.has(A.m[ty][tx])}
function boxHit(x,y,r){return solidAt(x-r,y-r)||solidAt(x+r,y-r)||solidAt(x-r,y+r)||solidAt(x+r,y+r)}
function moveEnt(e,dx,dy){const r=e.r||5;let hit=0;if(dx){if(!boxHit(e.x+dx,e.y,r))e.x+=dx;else hit=1}if(dy){if(!boxHit(e.x,e.y+dy,r))e.y+=dy;else hit=1}return hit}
const tileAt=(x,y)=>{const r=A.m[Math.floor(y/T)];return r?r[Math.floor(x/T)]:'#'};

// ---------- ENTITIES ----------
function mkPlayer(){calc();return{x:0,y:0,r:5,hp:D.hp,st:D.st,mp:D.mp,face:PI/2,inv:0,roll:0,rdx:0,rdy:0,atk:null,combo:0,comboT:0,charge:0,charging:false,anim:0,moving:0,stD:0,war:0,hurtT:9,cdS:0,dash:null,steps:null,flash:0}}
function spawnEnemy(type,x,y,lv){const d=ENEMIES[type],e={type,d,x,y,r:d.r,lv,mhp:Math.round(d.hp*(1+.38*(lv-1))),dmg:d.dmg*(1+.2*(lv-1)),spd:d.spd,st:'idle',tm:rnd(1),cd:rnd(1,2),flash:0,kb:{x:0,y:0},burn:null,slow:null,bob:rnd(TAU),hx:x,hy:y};e.hp=e.mhp;W.en.push(e);return e}
function spawnBoss(id,x,y){const d=BOSSES[id];W.boss={id,d,x,y,r:d.r,hp:d.hp,mhp:d.hp,ph:0,cd:2,act:null,awake:false,flash:0,inv:0,t:0,spiral:0,hx:x,hy:y,vis:1,kb:{x:0,y:0}}}
function burst(x,y,col,n=10,sp=60,g=0,sz=2){for(let i=0;i<n;i++){const a=rnd(TAU),s=rnd(sp*.3,sp);W.pa.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:rnd(.3,.7),ml:.7,col,sz:rnd(1,sz),g})}}
function dmgText(x,y,n,col,big){W.tx.push({x:x+rnd(-4,4),y,n:Math.round(n),col,l:.8,big})}
function warn(o){o.t=0;W.warn.push(o);return o}
function shoot(x,y,a,spd,o){W.pr.push({x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,r:3,life:2,hit:new Set(),...o})}

// ---------- PLAYER COMBAT ----------
function aim(){if(mouse.last>gtime-3&&!TIN.active){return Math.atan2(mouse.wy-(P.y-6),mouse.wx-P.x)}
 let best=null,bd=TIN.active?110:80;for(const e of allFoes()){const dd=dist(P,e);if(dd<bd&&(TIN.active||Math.abs(angDiff(P.face,angTo(P,e)))<1.2)){bd=dd;best=e}}return best?angTo(P,best):P.face}
function allFoes(){const l=W.en.slice();if(W.boss&&W.boss.awake&&W.boss.vis>.5)l.push(W.boss);return l}
function attackDown(){if(mode!=='play')return;P.charging=true;P.charge=0;basic()}
function attackUp(){if(!P||!P.charging)return;P.charging=false;const cost=S.skills.g4?16:25;if(P.charge>=.6){if(P.st>=cost){P.st-=cost;P.stD=.8;special()}else toast('Not enough stamina','#f88')}P.charge=0}
function basic(){if(P.roll>0||P.atk||P.dash||P.steps)return;const c=cls(),C=CLASSES[c];P.combo=P.comboT>0?(P.combo+1)%C.combo.length:0;
 const dur=C.t/D.as;P.atk={k:c,t:0,dur,mul:C.combo[P.combo],a:aim(),hit:new Set(),fired:0,dir:P.combo%2?-1:1,idx:P.combo};P.face=P.atk.a;sfx(c==='bow'||c==='staff'?'shoot':'swing')}
function special(){const c=cls(),a=aim();P.face=a;P.atk=null;sfx('magic');shake=Math.max(shake,3);
 if(c==='sword'){P.atk={k:'spin',t:0,dur:.5,mul:2,a,hit:new Set(),hit2:new Set()}}
 else if(c==='spear'){P.dash={t:0,dur:.24,a,hit:new Set()};P.inv=.35}
 else if(c==='bow'){for(let i=-2;i<=2;i++)shoot(P.x,P.y-6,a+i*.13,300,{own:'p',dmg:wDmg(eqW())*1.4,pierce:9,kind:'arrow',col:'#fff6a0',life:.9});P.atk={k:'bow',t:0,dur:.3,fired:1,a,hit:new Set()}}
 else if(c==='staff'){shoot(P.x,P.y-6,a,150,{own:'p',dmg:wDmg(eqW())*3,kind:'nova',col:eqW()?WEAPONS[eqW().i][6]:'#fff',r:5,life:.8,splash:46});P.atk={k:'staff',t:0,dur:.35,fired:1,a,hit:new Set()}}
 else{const t=allFoes().filter(e=>dist(P,e)<150).sort((x,y)=>dist(P,x)-dist(P,y)).slice(0,4);if(!t.length){P.dash={t:0,dur:.18,a,hit:new Set()};P.inv=.3}else{P.steps={list:t,i:0,tm:0};P.inv=.2+t.length*.1}}}
function castSkill(){if(mode!=='play'||P.cdS>0)return;const s=S.active;if(!s){toast('No active skill - unlock one in the skill tree (C)','#aaf');return}
 const cost={heal:30,warcry:25,starfall:40}[s];if(P.mp<cost){toast('Not enough mana','#88f');sfx('fail');return}P.mp-=cost;P.cdS=.8;
 if(s==='heal'){const h=D.hp*.35;P.hp=Math.min(D.hp,P.hp+h);dmgText(P.x,P.y-20,h,'#7f7');burst(P.x,P.y-6,'#9f9',24,60,-30);sfx('magic')}
 else if(s==='warcry'){P.war=8;burst(P.x,P.y-6,'#f84',30,110);shake=5;sfx('boom');toast('War Cry! +40% damage','#f96')}
 else{const a=aim(),r=Math.min(90,mouse.last>gtime-3?Math.hypot(mouse.wx-P.x,mouse.wy-P.y):70),tx=P.x+Math.cos(a)*r,ty=P.y+Math.sin(a)*r,dm=wDmg(eqW())*4*D.el;
  warn({type:'circle',x:tx,y:ty,r:46,T:.5,col:'255,210,80',fn:()=>{for(const e of allFoes())if(Math.hypot(e.x-tx,e.y-ty)<46+e.r)hitFoe(e,dm,{el:1,kb:4});burst(tx,ty,'#ffd34a',40,140);burst(tx,ty,'#fff',20,80);shake=8;sfx('boom')}})}}
function dodge(){if(mode!=='play'||P.roll>0||P.st<20||P.dash||P.steps)return;let dx=0,dy=0;const mv=moveVec();if(mv.x||mv.y){dx=mv.x;dy=mv.y}else{dx=Math.cos(P.face);dy=Math.sin(P.face)}const l=Math.hypot(dx,dy)||1;
 P.rdx=dx/l;P.rdy=dy/l;P.roll=S.skills.g3?.38:.3;P.inv=Math.max(P.inv,S.skills.g3?.34:.25);P.st-=20;P.stD=.7;P.atk=null;sfx('dodge')}
function usePotion(){if(mode!=='play')return;if(S.pots<=0){toast('No potions','#f88');return}if(P.hp>=D.hp){toast('HP is full');return}S.pots--;const h=D.hp*.45;P.hp=Math.min(D.hp,P.hp+h);dmgText(P.x,P.y-20,h,'#7f7');burst(P.x,P.y-6,'#f66',16,50,-40);sfx('pick')}
function hitFoe(e,base,o={}){if(e.dead||(e.inv>0))return;const w=eqW();let dm=base*D.dm*(P.war>0?1.4:1)*rnd(.9,1.1);
 if(S.skills.m4&&e.hp/e.mhp<.3)dm*=1.35;const crit=Math.random()*100<D.crit+(o.crit||0);if(crit)dm*=D.cd;dm=Math.max(1,dm);e.hp-=dm;e.flash=.12;
 const a=angTo(P,e),kb=(o.kb||2)*(e===W.boss?.15:1);e.kb.x+=Math.cos(a)*kb*30;e.kb.y+=Math.sin(a)*kb*30;
 dmgText(e.x,e.y-16,dm,crit?'#ffd34a':'#fff',crit);burst(e.x,e.y-6,crit?'#ffd34a':'#fff',crit?10:5,70);
 hitstop=Math.max(hitstop,crit?.07:.035);shake=Math.max(shake,crit?4:2);sfx(crit?'crit':'hit');
 if(D.burn)e.burn={t:3,dps:D.burn*D.el*(1+.15*((w?w.lv:1)-1))};if(D.frost)e.slow={t:2.2,p:Math.min(.65,D.frost/100*D.el)};
 if(D.life){P.hp=Math.min(D.hp,P.hp+dm*D.life/100*Math.min(D.el,1.6))}
 if(crit&&w&&w.r===4){warn({type:'circle',x:e.x,y:e.y,r:24,T:.15,col:'255,220,120',fn:()=>{for(const f of allFoes())if(f!==e&&Math.hypot(f.x-e.x,f.y-e.y)<24+f.r)hitFoe(f,base*.6,{kb:1});burst(e.x,e.y,'#ffd34a',14,90)}})}
 if(e.hp<=0){if(e===W.boss)bossDie();else killEnemy(e)}}
function meleeCheck(atk,reach,arc,mul,set){const w=wDmg(eqW());for(const e of allFoes()){if(set.has(e))continue;const dd=dist(P,e)-e.r;if(dd>reach)continue;if(arc<TAU&&Math.abs(angDiff(atk.a,angTo(P,e)))>arc/2&&dd>6)continue;set.add(e);hitFoe(e,w*mul,{kb:2,crit:cls()==='dagger'?5:0})}}
function updPlayerAtk(dt){const k=P.atk;if(k){k.t+=dt;const p=k.t/k.dur,C=CLASSES[k.k];
  if(k.k==='spin'){P.face+=dt*25;if(p>.15&&p<.4)meleeCheck(k,42,TAU,1,k.hit);if(p>.55&&p<.85)meleeCheck(k,42,TAU,1,k.hit2);if(Math.random()<.6)burst(P.x+Math.cos(P.face)*30,P.y-4+Math.sin(P.face)*30,'#fff',1,20)}
  else if(k.k==='bow'||k.k==='staff'){if(!k.fired&&p>.3){k.fired=1;const w=eqW(),dm=wDmg(w)*k.mul;if(k.k==='bow')shoot(P.x,P.y-6,k.a,280,{own:'p',dmg:dm,kind:'arrow',col:'#fff',life:.85});else shoot(P.x,P.y-6,k.a,190,{own:'p',dmg:dm,kind:'bolt',col:w?WEAPONS[w.i][6]:'#aaf',r:4,life:1,splash:14})}}
  else if(p>.2&&p<.75){let reach=C.reach,arc=C.arc;if(k.k==='spear'&&k.idx===1){reach=34;arc=2.3}meleeCheck(k,reach,arc,k.mul,k.hit)}
  if(k.t>=k.dur){P.atk=null;P.comboT=.38}}
 if(P.dash){const d=P.dash;d.t+=dt;const s=400*dt;moveEnt(P,Math.cos(d.a)*s,Math.sin(d.a)*s);burst(P.x,P.y-6,'#cdf',2,30);
  const w=wDmg(eqW());for(const e of allFoes())if(!d.hit.has(e)&&dist(P,e)<e.r+16){d.hit.add(e);hitFoe(e,w*2.6,{kb:3})}if(d.t>=d.dur)P.dash=null}
 if(P.steps){const s=P.steps;s.tm-=dt;if(s.tm<=0){const e=s.list[s.i];if(e&&!e.dead&&e.hp>0){const a=angTo(P,e);burst(P.x,P.y-6,'#a6f',10,50);P.x=e.x-Math.cos(a)*-14;P.y=e.y-Math.sin(a)*-14;if(boxHit(P.x,P.y,5)){P.x=e.x;P.y=e.y}P.face=a+PI;hitFoe(e,wDmg(eqW())*1.8,{crit:25,kb:1});burst(P.x,P.y-6,'#a6f',10,50)}s.i++;s.tm=.1;if(s.i>=s.list.length)P.steps=null}}}
function hurtPlayer(dm,src){if(P.inv>0||P.hp<=0||mode!=='play')return;dm=dm*60/(60+D.def)*rnd(.9,1.1);P.hp-=dm;P.inv=.55;P.hurtT=0;P.flash=.15;shake=Math.max(shake,5);hitstop=Math.max(hitstop,.05);
 dmgText(P.x,P.y-20,dm,'#ff5a5a');burst(P.x,P.y-6,'#f44',10,70);sfx('hurt');if(src){const a=angTo(src,P);moveEnt(P,Math.cos(a)*6,Math.sin(a)*6)}
 if(P.hp<=0){P.hp=0;mode='dead';music('title');setTimeout(()=>window.UI&&UI.dead(),700)}}
function respawn(){const lost=Math.floor(S.gold*.15);S.gold-=lost;calc();P.hp=D.hp;P.mp=D.mp;P.st=D.st;P.inv=1;mode='play';enterArea('town');toast('You awaken by the fountain. Lost '+lost+' gold.','#fa8')}
function killEnemy(e){e.dead=1;W.en.splice(W.en.indexOf(e),1);S.kills++;burst(e.x,e.y-6,e.d.pal[Object.keys(e.d.pal)[0]],16,80);addXp(e.d.xp*(1+.25*(e.lv-1)));
 const g=Math.round(ri(...e.d.gold)*(1+.2*(e.lv-1))*D.gold);for(let i=0;i<Math.min(6,1+g/6|0);i++)W.pk.push({k:'gold',v:Math.ceil(g/Math.min(6,1+g/6|0)),x:e.x,y:e.y,vx:rnd(-50,50),vy:rnd(-50,50),t:0});
 const tr=tierOf();if(Math.random()<.075)W.pk.push({k:'item',it:randWeapon(rollRarity(tr),e.lv),x:e.x,y:e.y,vx:0,vy:0,t:0});else if(Math.random()<.035)W.pk.push({k:'item',it:randGear(rollRarity(tr)),x:e.x,y:e.y,vx:0,vy:0,t:0});
 if(Math.random()<.13)W.pk.push({k:'ore',x:e.x+4,y:e.y,vx:rnd(-30,30),vy:rnd(-30,30),t:0});if(Math.random()<.06)W.pk.push({k:'pot',x:e.x-4,y:e.y,vx:rnd(-30,30),vy:rnd(-30,30),t:0});
 if(e.type==='bandit'&&S.sq.bounty.s===1&&S.sq.bounty.c<10){S.sq.bounty.c++;toast('Dune Raiders '+S.sq.bounty.c+'/10',S.sq.bounty.c>=10?'#7f7':'#fd8')}}

// ---------- ENEMY AI ----------
function updEnemy(e,dt){if(e.flash>0)e.flash-=dt;e.bob+=dt*6;let sp=e.spd*(e.slow&&e.slow.t>0?1-e.slow.p:1);
 if(e.slow&&(e.slow.t-=dt)<=0)e.slow=null;if(e.burn){e.burn.t-=dt;e.burnT=(e.burnT||0)+dt;if(e.burnT>.5){e.burnT=0;const v=e.burn.dps*.5;e.hp-=v;dmgText(e.x,e.y-14,v,'#ff8a3a');burst(e.x,e.y-6,'#f82',3,30,-40);if(e.hp<=0){killEnemy(e);return}}if(e.burn.t<=0)e.burn=null}
 if(e.kb.x||e.kb.y){moveEnt(e,e.kb.x*dt*8,e.kb.y*dt*8);e.kb.x*=.75;e.kb.y*=.75;if(Math.abs(e.kb.x)+Math.abs(e.kb.y)<1)e.kb.x=e.kb.y=0}
 const dp=dist(e,P),ai=e.d.ai;e.tm-=dt;e.cd-=dt;
 if(e.st==='idle'){if(dp<140&&P.hp>0)e.st='chase';else if(e.tm<0){e.tm=rnd(1,3);e.wa=rnd(TAU)}if(e.wa!==undefined&&e.tm>1)moveEnt(e,Math.cos(e.wa)*sp*.3*dt,Math.sin(e.wa)*sp*.3*dt);return}
 if(e.st==='chase'){if(dp>260){e.st='idle';return}const a=angTo(e,P);let want=ai==='shoot'?90:ai==='blink'?100:16;
  if(dp>want)moveEnt(e,Math.cos(a)*sp*dt,Math.sin(a)*sp*dt);else if(ai==='shoot'&&dp<60)moveEnt(e,-Math.cos(a)*sp*.7*dt,-Math.sin(a)*sp*.7*dt);
  const rng={hop:50,charge:120,lunge:50,shoot:150,blink:170,swoop:110,slam:36}[ai];
  if(e.cd<=0&&dp<rng){e.st='tele';e.a=a;e.tx=P.x;e.ty=P.y;const tt={hop:.5,charge:.6,lunge:.42,shoot:.55,blink:.5,swoop:.55,slam:.75}[ai];e.tm=tt;
   if(ai==='slam')e.w=warn({type:'circle',x:e.x,y:e.y,r:38,T:tt,col:'255,60,60',own:e});
   else if(ai==='hop')e.w=warn({type:'circle',x:P.x,y:P.y,r:16,T:tt,col:'255,60,60',own:e});
   else if(ai==='blink'){const b=rnd(TAU);e.tx=P.x+Math.cos(b)*60;e.ty=P.y+Math.sin(b)*60;if(boxHit(e.tx,e.ty,6)){e.tx=e.x;e.ty=e.y}e.w=warn({type:'circle',x:e.tx,y:e.ty,r:10,T:tt,col:'200,80,255',own:e})}
   else e.w=warn({type:'line',x:e.x,y:e.y,a,len:{charge:130,lunge:55,shoot:150,swoop:150}[ai],wd:ai==='shoot'?6:12,T:tt,col:'255,60,60',own:e,follow:ai!=='shoot'})}return}
 if(e.st==='tele'){if(e.tm<=0){e.st='atk';e.tm={hop:.3,charge:.35,lunge:.18,shoot:.1,blink:.1,swoop:.45,slam:.1}[ai];e.hitP=0;
   if(ai==='shoot'){const p=e.d.proj==='spore';for(let i=p?-1:0;i<=(p?1:0);i++)shoot(e.x,e.y-6,e.a+i*.28,p?95:170,{own:'e',dmg:e.dmg,kind:e.d.proj,col:p?'#e8a0ff':'#ddd',life:1.6});if(!p)setTimeout(()=>{if(!e.dead&&mode==='play')shoot(e.x,e.y-6,angTo(e,P),170,{own:'e',dmg:e.dmg,kind:'knife',col:'#ddd',life:1.6})},180);sfx('shoot')}
   if(ai==='slam'){if(dist(e,P)<38+P.r)hurtPlayer(e.dmg*1.3,e);burst(e.x,e.y,'#9df',20,100);shake=Math.max(shake,3)}
   if(ai==='blink'){burst(e.x,e.y-6,'#a6f',12,60);e.x=e.tx;e.y=e.ty;burst(e.x,e.y-6,'#a6f',12,60);const n=e.d.proj==='void'?1:6;for(let i=0;i<n;i++){const aa=n===1?angTo(e,P):i/n*TAU;shoot(e.x,e.y-6,aa,n===1?110:120,{own:'e',dmg:e.dmg,kind:e.d.proj,col:n===1?'#ff4ae0':'#e8c890',life:2,homing:n===1?1.6:0})}}}return}
 if(e.st==='atk'){const s={hop:150,charge:330,lunge:300,swoop:290}[ai];if(s){moveEnt(e,Math.cos(e.a)*s*dt,Math.sin(e.a)*s*dt);if(!e.hitP&&dist(e,P)<e.r+P.r+3){e.hitP=1;hurtPlayer(e.dmg,e)}}
  if(e.tm<=0){e.st='rec';e.tm=rnd(.5,.9);e.cd=rnd(1.2,2.2)}return}
 if(e.st==='rec'&&e.tm<=0)e.st='chase'}

// ---------- BOSS ----------
function updBoss(b,dt){b.t+=dt;if(b.flash>0)b.flash-=dt;if(b.inv>0)b.inv-=dt;const dp=dist(b,P);
 if(!b.awake){if(dp<150){b.awake=true;music('boss');if(window.UI)UI.bossBar(b.d.n);toast(b.d.n+' awakens!','#f66');shake=6}return}
 if(b.kb.x||b.kb.y){moveEnt(b,b.kb.x*dt*4,b.kb.y*dt*4);b.kb.x*=.7;b.kb.y*=.7}
 const ph=b.d.phases,np=ph[b.ph+1];if(np&&b.hp/b.mhp<=np.at){b.ph++;b.inv=1.2;b.cd=1.4;shake=10;toast(np.msg,'#f8a');burst(b.x,b.y-10,b.d.acc,50,160);sfx('boom')}
 if(b.burn){b.burn.t-=dt;b.burnT=(b.burnT||0)+dt;if(b.burnT>.5){b.burnT=0;b.hp-=b.burn.dps*.5;dmgText(b.x,b.y-30,b.burn.dps*.5,'#ff8a3a');if(b.hp<=0){bossDie();return}}if(b.burn.t<=0)b.burn=null}
 if(b.slow&&(b.slow.t-=dt)<=0)b.slow=null;
 if(b.spiral>0){b.spiral-=dt;b.sT=(b.sT||0)+dt;if(b.sT>.09){b.sT=0;b.sA=(b.sA||0)+.37;for(let i=0;i<4;i++)shoot(b.x,b.y-10,b.sA+i*PI/2,95,{own:'e',dmg:b.d.dmg*.6,kind:'orb',col:b.d.acc,r:4,life:3})}}
 const act=b.act;if(act){act.t+=dt;if(act.k==='charge'&&act.t>act.w){const s=420*dt;if(moveEnt(b,Math.cos(act.a)*s,Math.sin(act.a)*s)||act.t>act.w+.55){b.act=null;shake=4}if(dist(b,P)<b.r+P.r)hurtPlayer(b.d.dmg,b)}
  else if(act.k==='hop'){b.vis=act.t<act.w?Math.max(0,1-act.t*3):1;if(act.t>=act.w){b.x=act.x;b.y=act.y;b.act=null;b.vis=1}}
  else if(act.t>act.w)b.act=null;return}
 const sp=b.d.spd*(b.slow?.7:1),a=angTo(b,P);if(dp>70)moveEnt(b,Math.cos(a)*sp*dt,Math.sin(a)*sp*dt);else if(dp<40)moveEnt(b,-Math.cos(a)*sp*dt,-Math.sin(a)*sp*dt);
 if(dp<b.r+P.r)hurtPlayer(b.d.dmg*.6,b);
 b.cd-=dt;if(b.cd>0)return;const P_=ph[b.ph];b.cd=P_.cd*rnd(.9,1.2);bossAttack(b,pick(P_.atk))}
function bossAttack(b,k){const dm=b.d.dmg,a=angTo(b,P),c=b.d.acc.match(/\w\w/g).map(h=>parseInt(h,16)).join(',');
 if(k==='lines'){const n=b.ph?5:3;for(let i=0;i<n;i++){const aa=a+(i-(n-1)/2)*.32;warn({type:'line',x:b.x,y:b.y,a:aa,len:240,wd:14,T:.8,col:'255,60,60',fn:w=>{if(lineHit(w,P))hurtPlayer(dm,b);for(let s=0;s<240;s+=14)burst(w.x+Math.cos(aa)*s,w.y+Math.sin(aa)*s,'#6a4',2,30)}})}}
 else if(k==='ring'){const n=b.ph?20:14;b.act={k:'w',t:0,w:.6};warn({type:'circle',x:b.x,y:b.y,r:b.r+6,T:.5,col:c,fn:()=>{for(let w=0;w<(b.ph?2:1);w++)setTimeout(()=>{if(W.boss===b)for(let i=0;i<n;i++)shoot(b.x,b.y-8,i/n*TAU+w*.15,85+w*20,{own:'e',dmg:dm*.7,kind:'orb',col:b.d.acc,r:4,life:3})},w*300);sfx('magic')}})}
 else if(k==='slam'){const x=P.x,y=P.y;b.act={k:'hop',t:0,w:.9,x,y};warn({type:'circle',x,y,r:52,T:.9,col:'255,60,60',fn:()=>{if(Math.hypot(P.x-x,P.y-y)<52+P.r)hurtPlayer(dm*1.3,{x,y});burst(x,y,b.d.col,40,150);shake=9;sfx('boom')}})}
 else if(k==='summon'){const ad=b.d.adds;for(let i=0;i<3;i++){const aa=rnd(TAU),x=b.x+Math.cos(aa)*50,y=b.y+Math.sin(aa)*50;if(!boxHit(x,y,6)){const e=spawnEnemy(pick(ad),x,y,A.def.lvlMax);e.st='chase';burst(x,y,'#a6f',16,60)}}b.act={k:'w',t:0,w:.6};toast('Minions answer the call!','#c9f')}
 else if(k==='charge'){b.act={k:'charge',t:0,w:.7,a};warn({type:'line',x:b.x,y:b.y,a,len:260,wd:b.r*2,T:.7,col:'255,60,60',own:b,follow:1})}
 else if(k==='spiral'){b.spiral=2.6;b.act={k:'w',t:0,w:1.2}}
 else if(k==='meteors'){for(let i=0;i<(b.ph>1?9:6);i++){const x=P.x+rnd(-90,90),y=P.y+rnd(-70,70);warn({type:'circle',x,y,r:26,T:1+i*.14,col:'255,140,40',fn:()=>{if(Math.hypot(P.x-x,P.y-y)<26+P.r)hurtPlayer(dm,{x,y});burst(x,y,'#fa4',18,110);shake=Math.max(shake,4);sfx('boom')}})}b.act={k:'w',t:0,w:.8}}
 else if(k==='homing'){for(let i=0;i<(b.ph?4:3);i++)shoot(b.x,b.y-10,a+(i-1)*.7,90,{own:'e',dmg:dm*.8,kind:'orb',col:'#fff6a0',r:5,life:3.5,homing:2.2});sfx('magic');b.act={k:'w',t:0,w:.5}}
 else if(k==='teleport'){const aa=rnd(TAU);let x=P.x+Math.cos(aa)*80,y=P.y+Math.sin(aa)*80;if(boxHit(x,y,b.r*.6)){x=b.hx;y=b.hy}b.act={k:'hop',t:0,w:.7,x,y};warn({type:'circle',x,y,r:b.r+4,T:.7,col:c,fn:()=>{setTimeout(()=>{if(W.boss===b)bossAttack(b,'ring')},150)}})}}
function lineHit(w,p){const dx=p.x-w.x,dy=p.y-w.y,ca=Math.cos(w.a),sa=Math.sin(w.a),along=dx*ca+dy*sa,perp=Math.abs(-dx*sa+dy*ca);return along>-4&&along<w.len&&perp<w.wd/2+p.r}
function bossDie(){const b=W.boss;if(!b||b.dead)return;b.dead=1;slowmo=1.2;shake=14;sfx('boom');for(let i=0;i<6;i++)setTimeout(()=>{burst(b.x+rnd(-20,20),b.y-10+rnd(-20,20),b.d.acc,30,160);burst(b.x,b.y-10,'#fff',20,120);sfx('boom')},i*180);
 W.boss=null;W.warn=[];W.pr=W.pr.filter(p=>p.own==='p');S.boss[b.id]=1;if(window.UI)UI.bossBar(null);music(A.def.music);
 addXp(b.d.xp);const g=Math.round(b.d.gold*D.gold);W.pk.push({k:'gold',v:g,x:b.x,y:b.y,vx:0,vy:20,t:0});W.pk.push({k:'item',it:randWeapon(Math.min(4,b.d.shard+1),A.def.lvlMax+1),x:b.x+20,y:b.y,vx:0,vy:0,t:0});
 W.pk.push({k:'item',it:randGear(Math.min(4,b.d.shard+1)),x:b.x-20,y:b.y,vx:0,vy:0,t:0});for(let i=0;i<3;i++)W.pk.push({k:'ore',x:b.x,y:b.y,vx:rnd(-60,60),vy:rnd(-60,60),t:0});
 W.pk.push({k:'shard',n:b.d.shard,x:b.x,y:b.y-4,vx:0,vy:0,t:0});W.props.push({k:'portal',x:b.hx,y:b.hy+40})}
function gotShard(n){toast('Recovered Star Shard '+n+'/3!','#fff6a0');sfx('chest');burst(P.x,P.y-8,'#fff6a0',40,120);
 if(n===1&&S.main<=1)S.main=2;if(n===2&&S.main<=3)S.main=4;if(n===3){S.main=6;setTimeout(()=>{if(window.UI)UI.dialog('vael',()=>{mode='end';music('end');UI.ending()})},1400)}autosave()}

// ---------- INTERACTION ----------
function nearest(){let best=null,bd=26;for(const n of W.npcs){const d=dist(P,n);if(d<bd){bd=d;best={o:n,label:'Talk to '+n.n}}}
 for(const p of W.props){const d=dist(P,p),L={fountain:['Drink from the fountain',42],chest:['Open chest',22],lore:['Read stone',22],pylon:[p.on?'':'Attune pylon',26]}[p.k];if(L&&L[0]&&d<L[1]&&d<bd+6){bd=d;best={o:p,label:L[0]}}}return best}
function interact(){if(mode!=='play')return;const n=nearest();if(!n)return;const o=n.o;sfx('ui');
 if(o.id&&W.npcs.includes(o)){window.UI&&UI.dialog(npcDialog(o.id));return}
 if(o.k==='fountain'){P.hp=D.hp;P.mp=D.mp;P.st=D.st;burst(P.x,P.y-6,'#9df',20,60,-30);UI.dialog('fountain',()=>UI.openSave(true))}
 else if(o.k==='chest')openChest(o);else if(o.k==='lore')UI.dialog([['',LORE[A.key]]]);
 else if(o.k==='pylon'&&!o.on&&!o.active){o.active=1;o.prog=0;toast('Attuning... stay close!','#9ef');for(let i=0;i<3;i++){const a=rnd(TAU);spawnEnemy('shade',o.x+Math.cos(a)*70,o.y+Math.sin(a)*70,A.def.lvlMax-1).st='chase'}}}
function npcDialog(id){const m=S.main,q=S.sq,rw=(k,f)=>{q[k].s=3;f();autosave()};
 if(id==='oren')return'oren'+m;if(id==='brann'||id==='sela')return id;if(id==='guardS')return m>=5?[['Miner','The mine is open. Mind the glow - it bites.']]:'guardS';
 if(id==='mira'){const g=q.glow;if(g.s===0)return'mira0';if(g.s===1){if(g.c>=6){rw('glow',()=>{S.gold+=120;S.pots+=3;addItem(mkGear('t',3));toast('+120 gold, Heartstone, 3 potions','#7f7')});return'mira2'}return'mira1'}return'mira3'}
 if(id==='dace'){if(m<3)return'dace0';const g=q.bounty;if(g.s===0)return'dacek';if(g.s===1){if(g.c>=10){rw('bounty',()=>{S.gold+=300;S.ore+=4;addItem(randWeapon(2,8));toast('+300 gold, 4 ore, a Rare weapon','#7f7')});return'dace2'}return'dace1'}return'dace3'}
 if(id==='vesna'){if(m<5)return'vesna0';const g=q.echo;if(g.s===0)return'vesnak';if(g.s===1){if(g.c>=3){rw('echo',()=>{S.gold+=500;const it=mkGear('a',6);addItem(it);toast('+500 gold, Crystal Aegis','#7f7')});return'vesna2'}return'vesna1'}return'vesna3'}}
function act(a){if(!a)return;if(a==='main1'&&S.main===0){S.main=1;S.gold+=60;S.pots+=2;[7,14,21,28].forEach(i=>addItem(mkWeapon(i,1)));toast('Received 60 gold, 2 potions, a spear, bow, staff and daggers!','#7f7');autosave()}
 else if(a==='main3'&&S.main===2){S.main=3;toast('Act II begins - the east gate is open','#fd8')}else if(a==='main5'&&S.main===4){S.main=5;toast('Act III begins - the south mine is open','#fd8')}
 else if(a==='q_glow'){S.sq.glow.s=1;toast('Quest accepted: Glowcap Gathering','#fd8')}else if(a==='q_bounty'){S.sq.bounty.s=1;toast('Quest accepted: Dune Raiders','#fd8')}else if(a==='q_echo'){S.sq.echo.s=1;toast('Quest accepted: Echoes in the Deep','#fd8')}
 else if(a==='smith')setTimeout(()=>UI.smith(),50);else if(a==='shop')setTimeout(()=>UI.shop(),50);else if(a==='endA'||a==='endB')S.ending=a}
function openChest(o){W.props.splice(W.props.indexOf(o),1);S.flags['ch_'+A.key+o.id]=1;sfx('chest');burst(o.x,o.y,'#ffd34a',30,90);const t=tierOf(),lv=A.def.lvl+(o.last?A.def.lvlMax-A.def.lvl:1);
 W.pk.push({k:'item',it:randWeapon(Math.max(o.last?2:1,rollRarity(t,1)),lv),x:o.x,y:o.y,vx:0,vy:40,t:0});W.pk.push({k:'gold',v:ri(20,50)*(t+1),x:o.x,y:o.y,vx:30,vy:30,t:0});W.pk.push({k:'ore',x:o.x,y:o.y,vx:-30,vy:30,t:0});if(Math.random()<.5)W.pk.push({k:'pot',x:o.x,y:o.y,vx:-20,vy:40,t:0})}
function checkExits(){const ch=tileAt(P.x,P.y);if(A.key==='town'){
  if(ch==='N'){if(S.main<1){toast('Speak with Elder Oren first.');P.y+=12;return}enterArea('forest');autosave()}
  else if(ch==='E'){if(S.main<3){P.x-=14;UI.dialog('guardE');return}enterArea('desert');autosave()}
  else if(ch==='M'){if(S.main<5){P.y-=14;UI.dialog('guardS');return}enterArea('cave');autosave()}return}
 for(const p of W.props)if((p.k==='exit'||p.k==='portal')&&dist(P,p)<10){const from=A.key;enterArea('town',undefined,undefined,from);autosave();return}}

// ---------- SAVE ----------
function save(slot){if(W.boss&&W.boss.awake){toast('Cannot save during a boss fight!','#f66');return false}S.slot=slot;S.px=P.x;S.py=P.y;try{localStorage.setItem('sfc_slot'+slot,JSON.stringify(S));toast('Saved to slot '+slot,'#7f7');return true}catch(e){toast('Save failed (storage blocked)','#f66');return false}}
function autosave(){if(!S||!S.slot||(W.boss&&W.boss.awake))return;S.px=P.x;S.py=P.y;try{localStorage.setItem('sfc_slot'+S.slot,JSON.stringify(S))}catch(e){}}
function slotInfo(i){try{const s=JSON.parse(localStorage.getItem('sfc_slot'+i));if(!s)return null;return{lvl:s.lvl,area:AREAS[s.area].name,time:s.time,main:s.main,gold:s.gold}}catch(e){return null}}
function load(i){let s;try{s=JSON.parse(localStorage.getItem('sfc_slot'+i))}catch(e){}if(!s)return false;S=s;S.slot=i;P=null;calc();P=mkPlayer();mode='play';enterArea(S.area,S.px,S.py);toast('Loaded slot '+i,'#7f7');return true}
function newGame(slot){S=newState(slot);const w=mkWeapon(0,1),a=mkGear('a',0);S.items.push(w,a);S.eq.w=w.u;S.eq.a=a.u;P=null;calc();P=mkPlayer();mode='play';enterArea('town');autosave()}

// ---------- INPUT ----------
function moveVec(){let x=0,y=0;if(keys.KeyA||keys.ArrowLeft)x--;if(keys.KeyD||keys.ArrowRight)x++;if(keys.KeyW||keys.ArrowUp)y--;if(keys.KeyS||keys.ArrowDown)y++;if(TIN.active&&(TIN.x||TIN.y)){x=TIN.x;y=TIN.y}const l=Math.hypot(x,y);return l>1?{x:x/l,y:y/l}:{x,y}}
addEventListener('keydown',e=>{if(e.repeat&&!['KeyW','KeyA','KeyS','KeyD'].includes(e.code)){if(e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault();return}keys[e.code]=1;auInit();if(window.UI&&UI.key(e))return;
 if(mode!=='play')return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();
 if(e.code==='KeyJ')attackDown();else if(e.code==='Space'||e.code==='ShiftLeft'||e.code==='ShiftRight')dodge();else if(e.code==='KeyK')castSkill();else if(e.code==='KeyE')interact();else if(e.code==='KeyF'||e.code==='Digit1')usePotion()});
addEventListener('keyup',e=>{keys[e.code]=0;if(e.code==='KeyJ')attackUp()});
addEventListener('blur',()=>{for(const k in keys)keys[k]=0;if(P&&P.charging)attackUp()});
cv.addEventListener('mousemove',e=>{mouse.x=e.clientX/SC;mouse.y=e.clientY/SC;mouse.last=gtime});
cv.addEventListener('mousedown',e=>{auInit();mouse.x=e.clientX/SC;mouse.y=e.clientY/SC;mouse.last=gtime;if(e.button===0)attackDown();else if(e.button===2)castSkill()});
addEventListener('mouseup',e=>{if(e.button===0)attackUp()});cv.addEventListener('contextmenu',e=>e.preventDefault());

// ---------- UPDATE ----------
function update(dt){gtime+=dt;if(mode!=='play'){updFx(dt);return}S.time+=dt;
 if(hitstop>0){hitstop-=dt;return}if(slowmo>0){slowmo-=dt;dt*=.35}
 const mv=moveVec();P.moving=mv.x||mv.y;P.anim+=dt*(P.moving?10:2);
 if(P.inv>0)P.inv-=dt;if(P.flash>0)P.flash-=dt;if(P.war>0)P.war-=dt;if(P.cdS>0)P.cdS-=dt;if(P.comboT>0)P.comboT-=dt;P.hurtT+=dt;
 if(P.charging){P.charge+=dt;if(P.charge>.6&&P.charge-dt<=.6){sfx('tele');burst(P.x,P.y-6,'#fff6a0',12,50)}}
 if(P.stD>0)P.stD-=dt;else P.st=Math.min(D.st,P.st+32*D.str*dt);P.mp=Math.min(D.mp,P.mp+D.mpr*dt);
 if(P.hurtT>6&&!(W.boss&&W.boss.awake))P.hp=Math.min(D.hp,P.hp+D.hp*.012*dt);
 if(P.roll>0){P.roll-=dt;moveEnt(P,P.rdx*215*dt,P.rdy*215*dt);if(Math.random()<.5)burst(P.x,P.y-2,'#cbb',1,15);if(S.skills.g3)for(const e of allFoes())if(dist(P,e)<e.r+10&&!(e.rollHit>gtime)){e.rollHit=gtime+.5;hitFoe(e,wDmg(eqW())*.6,{kb:1})}}
 else if(!P.dash&&!P.steps){const slow=P.atk&&!['bow','staff'].includes(P.atk.k)?.45:P.charging&&P.charge>.3?.6:1;moveEnt(P,mv.x*D.spd*slow*dt,mv.y*D.spd*slow*dt);if(P.moving&&!P.atk)P.face=Math.atan2(mv.y,mv.x)}
 if(mouse.last>gtime-3&&!P.atk&&!P.roll)P.face=Math.atan2(mouse.wy-(P.y-6),mouse.wx-P.x);
 updPlayerAtk(dt);
 for(let i=W.en.length-1;i>=0;i--){const e=W.en[i];if(e)updEnemy(e,dt)}
 for(let i=0;i<W.en.length;i++)for(let j=i+1;j<W.en.length;j++){const a=W.en[i],b=W.en[j],d=dist(a,b);if(d<10&&d>0){const ax=(a.x-b.x)/d*(10-d)*.5,ay=(a.y-b.y)/d*(10-d)*.5;moveEnt(a,ax,ay);moveEnt(b,-ax,-ay)}}
 if(W.boss)updBoss(W.boss,dt);if(mode!=='play')return;
 for(let i=W.warn.length-1;i>=0;i--){const w=W.warn[i];w.t+=dt;if(w.own){if(w.own.dead||w.own.hp<=0){W.warn.splice(i,1);continue}if(w.follow){w.x=w.own.x;w.y=w.own.y}}if(w.t>=w.T){W.warn.splice(i,1);w.fn&&w.fn(w)}}
 for(let i=W.pr.length-1;i>=0;i--){const p=W.pr[i];p.life-=dt;if(p.homing&&p.own==='e'&&p.life>0){const a=Math.atan2(P.y-6-p.y,P.x-p.x),c=Math.atan2(p.vy,p.vx),s=Math.hypot(p.vx,p.vy),n=c+clamp(angDiff(c,a),-p.homing*dt,p.homing*dt);p.vx=Math.cos(n)*s;p.vy=Math.sin(n)*s}
  p.x+=p.vx*dt;p.y+=p.vy*dt;let dead=p.life<=0||solidAt(p.x,p.y+6);
  if(p.own==='p'){for(const e of allFoes()){if(p.hit.has(e))continue;if(Math.hypot(e.x-p.x,e.y-6-p.y)<e.r+p.r+2){p.hit.add(e);if(p.splash){dead=1;break}hitFoe(e,p.dmg,{kb:1.5});if(!p.pierce){dead=1;break}}}
   if(dead&&p.splash){for(const e of allFoes())if(Math.hypot(e.x-p.x,e.y-p.y)<p.splash+e.r)hitFoe(e,p.dmg,{kb:p.kind==='nova'?4:1});burst(p.x,p.y,p.col,p.kind==='nova'?40:10,p.kind==='nova'?140:60);if(p.kind==='nova'){shake=7;sfx('boom')}}}
  else if(Math.hypot(P.x-p.x,P.y-6-p.y)<P.r+p.r){if(P.inv<=0){hurtPlayer(p.dmg,p);dead=1}}
  if(Math.random()<.4)W.pa.push({x:p.x,y:p.y,vx:0,vy:0,l:.2,ml:.2,col:p.col,sz:p.kind==='nova'?3:1.5,g:0});if(dead)W.pr.splice(i,1)}
 for(let i=W.pk.length-1;i>=0;i--){const k=W.pk[i];k.t+=dt;k.x+=k.vx*dt;k.y+=k.vy*dt;k.vx*=.9;k.vy*=.9;const d=dist(P,k);if(k.t>.4&&d<40&&k.k!=='item'){const a=angTo(k,P);k.x+=Math.cos(a)*160*dt;k.y+=Math.sin(a)*160*dt}
  if(k.t>.4&&d<10){if(k.k==='item'&&!addItem(k.it)){k.t=-3;continue}W.pk.splice(i,1);if(k.k==='gold'){S.gold+=k.v;sfx('coin')}else if(k.k==='ore'){S.ore++;toast('+1 Star Ore','#9cf');sfx('pick')}else if(k.k==='pot'){S.pots++;toast('+1 Potion','#f88');sfx('pick')}
   else if(k.k==='item'){toast('Found '+RARITY[k.it.r].n+' '+itemName(k.it)+'!',RARITY[k.it.r].c);sfx('pick');if(window.UI)UI.lootPop(k.it)}else if(k.k==='shard')gotShard(k.n)}}
 for(const p of W.props){if(p.k==='glow'&&!p.got&&dist(P,p)<12){p.got=1;S.sq.glow.c=Math.min(6,S.sq.glow.c+1);sfx('pick');burst(p.x,p.y,'#7fffd0',14,50,-20);toast('Glowcap '+S.sq.glow.c+'/6',S.sq.glow.c>=6?'#7f7':'#9fd')}
  if(p.k==='pylon'&&p.active&&!p.on){if(dist(P,p)<40)p.prog+=dt/4;if(p.prog>=1){p.on=1;p.active=0;S.flags['py_'+p.id]=1;S.sq.echo.c=Math.min(3,S.sq.echo.c+(S.sq.echo.s===1?1:0));sfx('chest');burst(p.x,p.y-10,'#7af0ff',40,100);toast(S.sq.echo.s===1?'Pylon attuned '+S.sq.echo.c+'/3':'The pylon sings softly...','#9ef')}}}
 W.props=W.props.filter(p=>!p.got);checkExits();updFx(dt)}
function updFx(dt){for(let i=W.pa.length-1;i>=0;i--){const p=W.pa[i];p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.92;p.vy=p.vy*.92+(p.g||0)*dt;if(p.l<=0)W.pa.splice(i,1)}
 for(let i=W.tx.length-1;i>=0;i--){const t=W.tx[i];t.l-=dt;t.y-=dt*(t.l>.5?40:8);if(t.l<=0)W.tx.splice(i,1)}if(shake>0)shake=Math.max(0,shake-dt*25);
 if(A&&A.def.fx&&W.pa.length<220&&Math.random()<.35){const x=cam.x+rnd(VW),y=cam.y+rnd(VH),f=A.def.fx;W.pa.push(f==='leaf'?{x,y,vx:rnd(-15,-5),vy:rnd(8,18),l:3,ml:3,col:pick(['#7ac04a','#c8d84a','#5a9a3a']),sz:2,g:0,amb:1}:f==='dust'?{x,y,vx:rnd(20,40),vy:rnd(-3,3),l:2.5,ml:2.5,col:'#f0dca8',sz:1,g:0,amb:1}:{x,y,vx:0,vy:-6,l:2,ml:2,col:pick(['#7af0ff','#c07aff','#fff']),sz:1,g:0,amb:1})}}

// ---------- RENDER ----------
function drawHuman(x,y,pal,id,face,anim,moving,flash){pal.e||(pal.e='#1a1a2a');pal.w||(pal.w=pal.b);const back=Math.sin(face)<-.35,s=spr(back?'heroB':'hero',pal,id+(back?'b':''),flash);
 cx.fillStyle='#0004';cx.beginPath();cx.ellipse(x,y+1,6,2.5,0,0,TAU);cx.fill();const l=moving?Math.sin(anim)*1.5:0,by=Math.round(y-14+(moving?Math.abs(Math.sin(anim))*-1:0));
 cx.fillStyle='#2b2b3a';cx.fillRect(Math.round(x-4),Math.round(y-3+Math.max(0,l)),3,3);cx.fillRect(Math.round(x+1),Math.round(y-3+Math.max(0,-l)),3,3);cx.drawImage(s,Math.round(x-6),by)}
const HERO={h:'#f0c860',s:'#f2c9a0',e:'#1a1a2a',c:'#3a5fcd',C:'#283f8f',b:'#7a4a2a',w:'#fff6b0'};
function drawWeaponHeld(){const w=eqW();if(!w)return;const ic=wIcon(w.i),k=P.atk;let a=P.face,off=0;const c=cls();
 if(k&&k.k!=='spin'&&CLASSES[k.k]){const p=Math.min(1,k.t/k.dur),C=CLASSES[k.k];a=k.a;if(c==='spear'&&k.idx===0)off=Math.sin(p*PI)*12;else if(c==='sword'||c==='dagger'||c==='spear'){const e=1-Math.pow(1-p,3);a=k.a+k.dir*(-C.arc/2+C.arc*e)}
  if(c!=='bow'&&c!=='staff'&&p>.15&&p<.8){cx.strokeStyle='rgba(255,255,255,'+(0.5*(1-p))+')';cx.lineWidth=3;cx.beginPath();const r=(c==='spear'?C.reach:C.reach)-4,ar=c==='spear'&&k.idx===0?.2:C.arc;cx.arc(P.x,P.y-6,r,k.a-ar/2,k.a+ar/2);cx.stroke()}}
 if(k&&k.k==='spin')a=P.face;if(P.dash)a=P.dash.a;
 const hx=P.x+Math.cos(a)*(4+off),hy=P.y-7+Math.sin(a)*(3+off*.6);cx.save();cx.translate(Math.round(hx),Math.round(hy));cx.rotate(a+PI/4);if(c==='dagger'||c==='sword')cx.scale(1.05,1.05);cx.drawImage(ic,-2,-13);cx.restore();
 if(k&&k.k==='spin'){cx.strokeStyle='rgba(255,246,200,.6)';cx.lineWidth=4;cx.beginPath();cx.arc(P.x,P.y-6,36,P.face-2,P.face);cx.stroke()}}
function drawEnemy(e){const s=spr(e.d.spr,e.d.pal,e.type,e.flash>0),b=e.st==='tele'?Math.sin(gtime*40)*1:Math.sin(e.bob)*1;
 cx.fillStyle='#0004';cx.beginPath();cx.ellipse(e.x,e.y+1,6,2.5,0,0,TAU);cx.fill();if(e.d.ai==='swoop'||e.d.ai==='blink')cx.globalAlpha=.9;
 cx.drawImage(s,Math.round(e.x-6),Math.round(e.y-12+b-(e.d.ai==='swoop'?4:0)));cx.globalAlpha=1;
 if(e.burn){cx.fillStyle='#f82';cx.fillRect(Math.round(e.x-1+rnd(-3,3)),Math.round(e.y-14),2,2)}if(e.slow){cx.fillStyle='#9df8';cx.fillRect(Math.round(e.x-6),Math.round(e.y-12),12,12)}
 if(e.hp<e.mhp){cx.fillStyle='#140c1c';cx.fillRect(Math.round(e.x-7),Math.round(e.y-17),14,3);cx.fillStyle='#e33';cx.fillRect(Math.round(e.x-6),Math.round(e.y-16),Math.ceil(12*e.hp/e.mhp),1)}}
function render(){cx.fillStyle='#0c0818';cx.fillRect(0,0,VW,VH);if(!A||!P)return;
 const tx=clamp(P.x-VW/2,0,Math.max(0,A.W*T-VW)),ty=clamp(P.y-8-VH/2,0,Math.max(0,A.H*T-VH));cam.x+=(tx-cam.x)*.15;cam.y+=(ty-cam.y)*.15;
 const sx=Math.round(cam.x+rnd(-shake,shake)),sy=Math.round(cam.y+rnd(-shake,shake));mouse.wx=mouse.x+cam.x;mouse.wy=mouse.y+cam.y;
 cx.save();cx.translate(-sx,-sy);cx.drawImage(A.cv,sx,sy,VW,VH,sx,sy,VW,VH);
 for(const w of W.warn){const p=Math.min(1,w.t/w.T);cx.fillStyle='rgba('+w.col+','+(.12+p*.2)+')';cx.strokeStyle='rgba('+w.col+',.7)';cx.lineWidth=1;
  if(w.type==='circle'){cx.beginPath();cx.arc(w.x,w.y,w.r,0,TAU);cx.fill();cx.stroke();cx.fillStyle='rgba('+w.col+',.3)';cx.beginPath();cx.arc(w.x,w.y,w.r*p,0,TAU);cx.fill()}
  else{cx.save();cx.translate(w.x,w.y);cx.rotate(w.a);cx.fillRect(0,-w.wd/2,w.len,w.wd);cx.strokeRect(0,-w.wd/2,w.len,w.wd);cx.fillStyle='rgba('+w.col+',.35)';cx.fillRect(0,-w.wd/2,w.len*p,w.wd);cx.restore()}}
 const L=[];W.props.forEach(p=>L.push([p.y,()=>drawProp(p)]));W.pk.forEach(k=>L.push([k.y-1,()=>drawPickup(k)]));W.en.forEach(e=>L.push([e.y,()=>drawEnemy(e)]));W.npcs.forEach(n=>L.push([n.y,()=>{drawHuman(n.x,n.y,n.pal,'npc'+n.id,PI/2+Math.sin(gtime+n.x)*.2,0,0);if(dist(P,n)<60){cx.fillStyle='#ffd34a';cx.fillRect(n.x-1,n.y-24+Math.sin(gtime*4)*1.5,2,4);cx.fillRect(n.x-1,n.y-19+Math.sin(gtime*4)*1.5,2,1)}}]));
 if(W.boss)L.push([W.boss.y,()=>drawBoss(W.boss)]);
 L.push([P.y,()=>{if(P.inv>0&&P.roll<=0&&Math.sin(gtime*50)>0&&P.hurtT<.6)return;const back=Math.sin(P.face)<-.35;if(back)drawWeaponHeld();
  if(P.roll>0){cx.save();cx.translate(P.x,P.y-6);cx.rotate((1-P.roll/.3)*TAU*Math.sign(P.rdx||1));cx.drawImage(spr('hero',HERO,'hero'),-6,-6);cx.restore()}else drawHuman(P.x,P.y,HERO,'hero',P.face,P.anim,P.moving,P.flash>0);if(!back)drawWeaponHeld();
  if(P.charging&&P.charge>.15){const p=Math.min(1,(P.charge-.15)/.45);cx.strokeStyle=p>=1?'#fff6a0':'#ffffff80';cx.lineWidth=p>=1?2:1;cx.beginPath();cx.arc(P.x,P.y-6,12,-PI/2,-PI/2+TAU*p);cx.stroke()}
  if(P.war>0){cx.strokeStyle='rgba(255,120,60,.5)';cx.beginPath();cx.arc(P.x,P.y-6,10+Math.sin(gtime*10),0,TAU);cx.stroke()}}]);
 L.sort((a,b)=>a[0]-b[0]).forEach(l=>l[1]());
 for(const p of W.pr){if(p.kind==='arrow'||p.kind==='knife'){const a=Math.atan2(p.vy,p.vx);cx.strokeStyle=p.col;cx.lineWidth=p.kind==='knife'?2:1;cx.beginPath();cx.moveTo(p.x-Math.cos(a)*6,p.y-Math.sin(a)*6);cx.lineTo(p.x,p.y);cx.stroke()}
  else{cx.fillStyle=p.col;cx.beginPath();cx.arc(p.x,p.y,p.r,0,TAU);cx.fill();cx.fillStyle='#fff';cx.beginPath();cx.arc(p.x,p.y,p.r*.4,0,TAU);cx.fill()}}
 for(const p of W.pa){cx.globalAlpha=Math.min(1,p.l/p.ml*1.5);cx.fillStyle=p.col;cx.fillRect(Math.round(p.x),Math.round(p.y),Math.ceil(p.sz),Math.ceil(p.sz))}cx.globalAlpha=1;
 const obj=objective();if(obj&&mode==='play'){const a=Math.atan2(obj.y-P.y,obj.x-P.x),d=Math.hypot(obj.x-P.x,obj.y-P.y);if(d>60){const ax=P.x+Math.cos(a)*20,ay=P.y-6+Math.sin(a)*20;cx.save();cx.translate(ax,ay);cx.rotate(a);cx.fillStyle='rgba(255,211,74,'+(.55+Math.sin(gtime*4)*.25)+')';cx.beginPath();cx.moveTo(4,0);cx.lineTo(-3,-3);cx.lineTo(-1,0);cx.lineTo(-3,3);cx.fill();cx.restore()}}
 for(const t of W.tx){cx.globalAlpha=Math.min(1,t.l*3);drawNum(t.n,t.x,t.y,t.col,t.big?2:1)}cx.globalAlpha=1;cx.restore();
 if(A.def.dark){const d=lightCv();cx.drawImage(d,0,0)}if(A.def.tint){cx.fillStyle=A.def.tint;cx.fillRect(0,0,VW,VH)}
 if(P.hp<D.hp*.3&&mode==='play'){cx.fillStyle='rgba(255,0,40,'+(.1+Math.sin(gtime*6)*.06)+')';cx.fillRect(0,0,VW,VH)}}
let LC=null;function lightCv(){if(!LC)LC=document.createElement('canvas');if(LC.width!==VW||LC.height!==VH){LC.width=VW;LC.height=VH}const g=LC.getContext('2d');g.globalCompositeOperation='source-over';g.clearRect(0,0,VW,VH);g.fillStyle='rgba(6,2,16,'+A.def.dark+')';g.fillRect(0,0,VW,VH);g.globalCompositeOperation='destination-out';
 const hole=(x,y,r,s=1)=>{const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(0,0,0,'+s+')');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,TAU);g.fill()};
 hole(P.x-cam.x,P.y-6-cam.y,95);for(const p of W.pr)hole(p.x-cam.x,p.y-cam.y,20,.7);for(const p of W.props)if(p.k!=='chest')hole(p.x-cam.x,p.y-cam.y,p.k==='pylon'&&p.on?70:30,.8);if(W.boss&&W.boss.awake)hole(W.boss.x-cam.x,W.boss.y-cam.y,90);
 for(const w of W.warn)hole(w.x-cam.x,w.y-cam.y,30,.6);return LC}
function objective(){if(!A)return null;const m=S.main,tw=A.key==='town',a=AREACACHE.town;const tp=(x,y)=>({x:x*T+8,y:y*T+8});
 if(tw){if(m===0||m===2||m===4)return tp(...a.npcs.oren);if(m===1)return tp(21.5,0);if(m===3)return tp(43,15.5);if(m===5)return tp(21.5,31);return null}
 const want={forest:1,desert:3,cave:5}[A.key];if(m===want&&W.boss)return W.boss;if(m>want||(m===want&&!W.boss)){const e=W.props.find(p=>p.k==='portal');if(e)return e}return null}

// ---------- LOOP ----------
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{update(dt);render();if(window.UI)UI.hud()}catch(err){console.error(err)}requestAnimationFrame(loop)}
requestAnimationFrame(loop);
const G={get S(){return S},get P(){return P},get D(){return D},get A(){return A},W,get mode(){return mode},set mode(v){mode=v},TIN,keys,newGame,load,save,slotInfo,calc,act,npcDialog,interact,dodge,castSkill,usePotion,attackDown,attackUp,respawn,auInit,setSound,AU,
 mkWeapon,mkGear,randWeapon,randGear,rollAff,wDmg,itemName,itemValue,itemIcon,addItem,getItem,need,tierOf,nearest,enterArea,autosave,sfx,music,spawnEnemy,hitFoe};
window.G=G;
