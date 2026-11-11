// Body Part RNG - self-contained canvas game (no WebGL or external 3D library required)
const $ = (id) => document.getElementById(id);
const SAVE_KEY = "bodyPartRngSaveV2";
const parts = [
  {id:"starter-head",name:"Starter Head",slot:"Head",rarity:"Common",weight:38,price:0,income:0,health:0,power:0,color:"#f1c7a0",icon:"🙂"},
  {id:"robot-head",name:"Robot Head",slot:"Head",rarity:"Rare",weight:14,price:85,income:4,health:10,power:2,color:"#8da9c7",icon:"🤖"},
  {id:"crown-head",name:"Royal Crown",slot:"Head",rarity:"Epic",weight:5,price:240,income:12,health:20,power:5,color:"#f4c64e",icon:"👑"},
  {id:"starter-torso",name:"Starter Torso",slot:"Torso",rarity:"Common",weight:38,price:0,income:0,health:0,power:0,color:"#3978d4",icon:"🟦"},
  {id:"rock-torso",name:"Stone Torso",slot:"Torso",rarity:"Rare",weight:14,price:110,income:5,health:35,power:1,color:"#8794a7",icon:"🪨"},
  {id:"neon-torso",name:"Neon Core",slot:"Torso",rarity:"Epic",weight:5,price:280,income:15,health:45,power:6,color:"#31d8d0",icon:"💠"},
  {id:"starter-arms",name:"Starter Arms",slot:"Arms",rarity:"Common",weight:38,price:0,income:0,health:0,power:0,color:"#f1c7a0",icon:"💪"},
  {id:"steel-arms",name:"Steel Arms",slot:"Arms",rarity:"Rare",weight:14,price:130,income:5,health:20,power:8,color:"#9daec2",icon:"🦾"},
  {id:"crystal-arms",name:"Crystal Arms",slot:"Arms",rarity:"Epic",weight:5,price:320,income:18,health:25,power:14,color:"#9c7bff",icon:"🔮"},
  {id:"starter-legs",name:"Starter Legs",slot:"Legs",rarity:"Common",weight:38,price:0,income:0,health:0,power:0,color:"#253d68",icon:"👖"},
  {id:"runner-legs",name:"Runner Legs",slot:"Legs",rarity:"Rare",weight:14,price:150,income:7,health:10,power:4,color:"#45b78b",icon:"🏃"},
  {id:"rocket-legs",name:"Rocket Legs",slot:"Legs",rarity:"Epic",weight:5,price:360,income:22,health:15,power:10,color:"#ff875e",icon:"🚀"}
];
const starter = {money:100,inventory:["starter-head","starter-torso","starter-arms","starter-legs"],equipped:{Head:"starter-head",Torso:"starter-torso",Arms:"starter-arms",Legs:"starter-legs"}};
function loadSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return s&&Array.isArray(s.inventory)&&s.equipped?s:structuredClone(starter)}catch{return structuredClone(starter)}}
let save=loadSave(),money=Number.isFinite(Number(save.money))?Number(save.money):100,inventory=save.inventory,equipped=save.equipped;
let questProgress=Math.max(0,Number(save.questProgress)||0),questReward=250;
let upgrades={speed:0,luck:0,coins:0,...(save.upgrades||{})};
let health=100,damage=10,income=0,nearShop=false,toastTimer;
function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify({money,inventory,equipped,upgrades,questProgress}))}
function updateQuest(){const fill=$("questFill"),count=$("questCount");if(fill)fill.style.width=Math.min(100,questProgress/5*100)+"%";if(count)count.textContent=Math.min(questProgress,5)+" / 5";}
function part(id){return parts.find(p=>p.id===id)||parts[0]}
function stats(){const active=Object.values(equipped).filter(Boolean).map(part);income=Math.floor(active.reduce((n,p)=>n+p.income,0)*(1+upgrades.coins*.25));health=100+active.reduce((n,p)=>n+p.health,0);damage=10+active.reduce((n,p)=>n+p.power,0)}
function updateStats(){stats();$("money").textContent=Math.floor(money).toLocaleString();$("health").textContent=health;$("healthFill").style.width="100%";$("damage").textContent=damage;$("income").textContent=income}
function notify(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2200)}
function renderInventory(){
 const counts=new Map();inventory.forEach(id=>counts.set(id,(counts.get(id)||0)+1));
 $("inventoryCount").textContent=inventory.length+" PARTS";
 $("inventory").innerHTML=[...counts].map(([id,count])=>{const p=part(id),on=equipped[p.slot]===id;return '<div class="part-item"><span class="part-icon">'+p.icon+'</span><div class="part-info"><b>'+p.name+(count>1?" ×"+count:"")+'</b><small>'+p.rarity+' · '+p.slot+'</small></div><button class="equip-button" data-equip="'+id+'">'+(on?"ON":"EQUIP")+'</button></div>'}).join("")||'<div class="empty-state">Roll to find your first part!</div>';
 $("inventory").querySelectorAll("[data-equip]").forEach(b=>b.onclick=()=>equip(b.dataset.equip));
 $("equipped").innerHTML=["Head","Torso","Arms","Legs"].map(slot=>{const p=part(equipped[slot]);return '<div class="equip-slot"><span class="slot-icon">'+p.icon+'</span><b>'+slot+'</b><span>'+p.name+'</span></div>'}).join("");
}
function equip(id){if(!inventory.includes(id))return;equipped[part(id).slot]=id;updateStats();renderInventory();persist();notify(part(id).name+" equipped!")}
let rollBusy=false,rollSpin=0;
function roll(){
 if(rollBusy)return;rollBusy=true;const button=$("rollButton"),result=$("result"),flash=$("rarityFlash");
 button.disabled=true;button.classList.add("rolling");rollSpin=1;let ticks=0;
 const timer=setInterval(()=>{const preview=parts[Math.floor(Math.random()*parts.length)];result.className="roll-result rolling-result";result.textContent="✦ "+preview.icon+" "+preview.name+" ✦";ticks++;if(ticks>=9){clearInterval(timer);
 const weightOf=p=>p.weight*(p.rarity==="Common"?1:1+upgrades.luck*.25),total=parts.reduce((n,p)=>n+weightOf(p),0);let r=Math.random()*total,pick=parts[0];for(const p of parts){r-=weightOf(p);if(r<=0){pick=p;break}}
 inventory.push(pick.id);if(!equipped[pick.slot])equipped[pick.slot]=pick.id;questProgress++;let completed=questProgress>=5;if(completed){money+=questReward;questProgress=0}
 result.className="roll-result rarity-"+pick.rarity.toLowerCase();result.textContent=pick.icon+" "+pick.name+" — "+pick.rarity;updateStats();renderInventory();updateQuest();persist();
 if(pick.rarity!=="Common"&&flash){flash.className="rarity-flash "+pick.rarity.toLowerCase();setTimeout(()=>flash.className="rarity-flash",650)}
 notify(completed?"QUEST COMPLETE! +"+questReward+" coins":"You rolled "+pick.name+"!");button.disabled=false;button.classList.remove("rolling");rollBusy=false;rollSpin=0;
 }},105);
}
$("rollButton").onclick=roll;
$("openInventory").onclick=()=>$("inventoryModal").classList.remove("hidden");
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$ (b.dataset.close).classList.add("hidden"));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.add("hidden")}));
const upgradeInfo=[
 {id:"speed",name:"Sprint Boots",icon:"👟",description:"+1.5 movement speed per level",base:100,max:3},
 {id:"luck",name:"Lucky Charm",icon:"🍀",description:"+25% rare-part roll weight per level",base:150,max:3},
 {id:"coins",name:"Coin Multiplier",icon:"💰",description:"+25% coins per second per level",base:200,max:3}
];
function renderShop(){
 $("shopItems").innerHTML=upgradeInfo.map(u=>{const level=upgrades[u.id],price=u.base*(level+1),maxed=level>=u.max;return '<div class="shop-item"><span class="shop-icon">'+u.icon+'</span><div class="shop-copy"><b>'+u.name+' · Lv. '+level+'</b><small>'+u.description+'</small></div><button class="buy-button" data-upgrade="'+u.id+'" '+(maxed?"disabled":"")+'>'+(maxed?"MAX LEVEL":price+" COINS")+'</button></div>'}).join("");
 $("shopItems").querySelectorAll("[data-upgrade]").forEach(b=>b.onclick=()=>buyUpgrade(b.dataset.upgrade));
}
function buyUpgrade(id){const u=upgradeInfo.find(x=>x.id===id);if(!u)return;const level=upgrades[id],price=u.base*(level+1);if(level>=u.max)return notify("That upgrade is already maxed!");if(money<price)return notify("Not enough coins yet!");money-=price;upgrades[id]++;updateStats();renderShop();persist();notify(u.name+" upgraded to level "+upgrades[id]+"!")}

let canvas,ctx,w=0,h=0,dpr=1,last=0;
const player={x:0,z:3,y:0,vy:0,walk:0},keys={},TILE=34;
function resize(){const r=canvas.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
function iso(x,z,y=0){let a=x-player.x,b=z-player.z;return{x:w/2+(a-b)*TILE,y:h*.55+(a+b)*TILE*.48-y*TILE}}
function tile(x,z,c){let p=iso(x,z);ctx.beginPath();ctx.moveTo(p.x,p.y-16);ctx.lineTo(p.x+34,p.y);ctx.lineTo(p.x,p.y+16);ctx.lineTo(p.x-34,p.y);ctx.closePath();ctx.fillStyle=c;ctx.fill();ctx.strokeStyle="#d8e8bb25";ctx.stroke()}
function block(x,z,ww,dd,hh,c){let p=iso(x,z),a=ww*TILE/2,b=dd*TILE*.24,v=hh*TILE;ctx.beginPath();ctx.moveTo(p.x-a,p.y-v);ctx.lineTo(p.x,p.y-v-b);ctx.lineTo(p.x+a,p.y-v);ctx.lineTo(p.x,p.y-v+b);ctx.closePath();ctx.fillStyle=c;ctx.fill();ctx.strokeStyle="#172b4088";ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-a,p.y-v);ctx.lineTo(p.x,p.y-v+b);ctx.lineTo(p.x,p.y+b);ctx.lineTo(p.x-a,p.y);ctx.closePath();ctx.fillStyle="#25435b";ctx.fill();ctx.beginPath();ctx.moveTo(p.x,p.y-v+b);ctx.lineTo(p.x+a,p.y-v);ctx.lineTo(p.x+a,p.y);ctx.lineTo(p.x,p.y+b);ctx.closePath();ctx.fillStyle="#37627d";ctx.fill()}
function rounded(x,y,a,b,r,c,s){ctx.beginPath();ctx.roundRect(x,y,a,b,r);ctx.fillStyle=c;ctx.fill();if(s){ctx.strokeStyle=s;ctx.lineWidth=2;ctx.stroke()}}
function tree(x,z){let p=iso(x,z),c=iso(x,z,1.6);block(x,z,.35,.35,1.1,"#795238");ctx.fillStyle="#27754e";ctx.beginPath();ctx.arc(c.x,c.y,22,0,7);ctx.fill();ctx.fillStyle="#65b979";ctx.beginPath();ctx.arc(c.x-7,c.y-8,11,0,7);ctx.fill()}
function shop(){
 const p=iso(0,-14),x=p.x,y=p.y;ctx.save();ctx.fillStyle="#14273a55";ctx.beginPath();ctx.ellipse(x,y+30,126,30,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#53677a";ctx.fillRect(x-104,y-28,208,58);ctx.fillStyle="#34495d";ctx.fillRect(x-104,y+20,208,12);
 ctx.fillStyle="#8b5b37";ctx.fillRect(x-96,y-111,192,84);ctx.fillStyle="#c18a50";ctx.fillRect(x-88,y-103,176,67);
 ctx.fillStyle="#573923";ctx.fillRect(x-96,y-111,192,9);ctx.fillRect(x-96,y-39,192,8);ctx.fillRect(x-88,y-103,9,67);ctx.fillRect(x+79,y-103,9,67);
 ctx.fillStyle="#f0c76c";ctx.fillRect(x-111,y-129,222,20);for(let i=0;i<8;i++){ctx.fillStyle=i%2?"#e8eee9":"#b84f43";ctx.fillRect(x-111+i*27.75,y-129,27.75,20)}ctx.fillStyle="#f6d98e";ctx.fillRect(x-115,y-111,230,5);
 for(const wx of [x-72,x+42]){ctx.fillStyle="#25475d";ctx.fillRect(wx,y-91,34,35);ctx.strokeStyle="#f2d49a";ctx.lineWidth=4;ctx.strokeRect(wx,y-91,34,35);ctx.fillStyle="#9dd9e8";ctx.fillRect(wx+4,y-87,26,27);ctx.fillStyle="#ffffff77";ctx.fillRect(wx+7,y-84,5,20);ctx.fillStyle="#f2d49a";ctx.fillRect(wx+15,y-91,3,35)}
 ctx.fillStyle="#3b2921";ctx.fillRect(x-19,y-91,39,64);ctx.fillStyle="#9c6337";ctx.fillRect(x-15,y-87,31,60);ctx.fillStyle="#e9bd69";ctx.beginPath();ctx.arc(x+9,y-57,2.5,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.moveTo(x-121,y-129);ctx.lineTo(x,y-188);ctx.lineTo(x+121,y-129);ctx.closePath();ctx.fillStyle="#405d78";ctx.fill();ctx.strokeStyle="#e3c58b";ctx.lineWidth=5;ctx.stroke();
 ctx.beginPath();ctx.moveTo(x-101,y-132);ctx.lineTo(x,y-180);ctx.lineTo(x+101,y-132);ctx.closePath();ctx.fillStyle="#8b463c";ctx.fill();
 rounded(x-75,y-160,150,27,7,"#173149","#f6d27b");ctx.fillStyle="#fff0bd";ctx.font="900 12px Inter,Arial";ctx.textAlign="center";ctx.fillText("✦ UPGRADE SHOP ✦",x,y-142);
 ctx.fillStyle="#e6bc68";ctx.fillRect(x-30,y+28,60,7);ctx.fillStyle="#fff0bd";ctx.font="900 10px Inter,Arial";ctx.fillText("PRESS E",x,y+50);ctx.restore();
}
function world(){let g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,"#82c0ed");g.addColorStop(.48,"#dcebe8");g.addColorStop(.49,"#82ae78");g.addColorStop(1,"#3d7655");ctx.fillStyle=g;ctx.fillRect(0,0,w,h);let cx=Math.floor(player.x),cz=Math.floor(player.z);for(let z=cz-14;z<=cz+14;z++)for(let x=cx-14;x<=cx+14;x++){tile(x,z,((x+z)&1)?"#76a96e":"#6d9f68");if(Math.abs(x)<3&&z<8&&z>-26)tile(x,z,"#a9a28c")}for(let i=0;i<12;i++){let a=i*Math.PI/6;tree(Math.cos(a)*15,Math.sin(a)*15)}for(let i=0;i<6;i++){let x=-12+i*4.8,p=iso(x,-5,2);block(x,-5,.12,.12,2,"#3d5362");ctx.fillStyle="#ffe7a1";ctx.beginPath();ctx.arc(p.x,p.y,5,0,7);ctx.fill()}shop();for(let [x,z] of [[-7,-3],[7,-3],[-8,7],[8,7]])block(x,z,1.6,.35,.35,"#8b603c")}
function avatar(){
 const p=iso(player.x,player.z,player.y),s=Math.max(.78,Math.min(1.1,h/700)),moving=!!(keys.KeyW||keys.KeyA||keys.KeyS||keys.KeyD||keys.ArrowUp||keys.ArrowDown||keys.ArrowLeft||keys.ArrowRight),swing=moving?Math.sin(player.walk)*.62:Math.sin(performance.now()*.002)*.035;
 const H=part(equipped.Head),T=part(equipped.Torso),A=part(equipped.Arms),L=part(equipped.Legs);ctx.save();ctx.translate(p.x,p.y);ctx.scale(s,s);
 ctx.fillStyle="#142a3b66";ctx.beginPath();ctx.ellipse(0,4,28,9,0,0,7);ctx.fill();
 ctx.save();ctx.translate(-10,-48);ctx.rotate(-swing);rounded(-8,0,16,49,5,L.color,"#172b40");rounded(-10,42,22,9,4,"#263c56","#172b40");ctx.restore();
 ctx.save();ctx.translate(10,-48);ctx.rotate(swing);rounded(-8,0,16,49,5,L.color,"#172b40");rounded(-10,42,22,9,4,"#263c56","#172b40");ctx.restore();
 ctx.save();ctx.translate(-23,-84);ctx.rotate(swing*.82);rounded(-7,0,14,49,6,A.color,"#172b40");ctx.restore();
 ctx.save();ctx.translate(23,-84);ctx.rotate(-swing*.82);rounded(-7,0,14,49,6,A.color,"#172b40");ctx.restore();
 rounded(-23,-111,46,62,8,T.color,"#172b40");rounded(-7,-59,14,12,3,"#d5a47f","#172b40");rounded(-18,-151,36,38,9,H.color,"#172b40");
 ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(-7,-137,4,0,7);ctx.arc(7,-137,4,0,7);ctx.fill();ctx.fillStyle="#18283b";ctx.beginPath();ctx.arc(-6,-137,2,0,7);ctx.arc(8,-137,2,0,7);ctx.fill();
 if(H.id==="crown-head"){ctx.fillStyle="#f4c64e";ctx.beginPath();ctx.moveTo(-18,-148);ctx.lineTo(-17,-166);ctx.lineTo(-7,-155);ctx.lineTo(0,-171);ctx.lineTo(8,-155);ctx.lineTo(18,-166);ctx.lineTo(18,-148);ctx.closePath();ctx.fill()}
 ctx.restore();let q=iso(player.x,player.z,2.6);rounded(q.x-22,q.y-10,44,18,6,"#10243be8","#ffffff77");ctx.fillStyle="#fff";ctx.font="900 10px Inter";ctx.textAlign="center";ctx.fillText("YOU",q.x,q.y+3);
}
function draw(){world();avatar();let n=Math.hypot(player.x,player.z+14)<3.5;if(n!==nearShop){nearShop=n;$("shopPrompt").classList.toggle("hidden",!n)}}
function frame(now){let dt=Math.min((now-last)/1000||0,.04);last=now;let x=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),z=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);if(x||z){let n=Math.hypot(x,z);x/=n;z/=n;let v=(4.7+upgrades.speed*1.15)*((keys.ShiftLeft||keys.ShiftRight)?1.45:1);player.x=Math.max(-24,Math.min(24,player.x+x*v*dt));player.z=Math.max(-24,Math.min(24,player.z+z*v*dt));player.walk+=dt*12}if((keys.Space||keys.KeyJ)&&player.y===0)player.vy=7;player.vy-=18*dt;player.y=Math.max(0,player.y+player.vy*dt);if(!player.y)player.vy=0;draw();requestAnimationFrame(frame)}
$("shopModal").classList.add("hidden");canvas=document.createElement("canvas");canvas.id="worldCanvas";canvas.tabIndex=0;canvas.style.cssText="display:block;width:100%;height:100%;outline:none;touch-action:none";$("gameCanvas").replaceChildren(canvas);ctx=canvas.getContext("2d");if(!ctx)throw Error("Canvas unavailable");canvas.addEventListener("pointerdown",()=>canvas.focus());document.addEventListener("keydown",e=>{keys[e.code]=true;if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();if(e.code==="KeyE"&&nearShop){$("shopModal").classList.remove("hidden");renderShop()}});document.addEventListener("keyup",e=>keys[e.code]=false);window.addEventListener("blur",()=>Object.keys(keys).forEach(k=>keys[k]=false));resize();window.addEventListener("resize",resize);renderShop();renderInventory();updateStats();updateQuest();notify("Explore the plaza! Walk to the shop and press E.");setInterval(()=>{if(income>0){money+=income;updateStats();persist()}},1000);requestAnimationFrame(frame);
