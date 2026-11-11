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
let save=loadSave(),money=Number(save.money)||100,inventory=save.inventory,equipped=save.equipped;
let health=100,damage=10,income=0,nearShop=false,toastTimer;
function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify({money,inventory,equipped}))}
function part(id){return parts.find(p=>p.id===id)||parts[0]}
function stats(){const active=Object.values(equipped).filter(Boolean).map(part);income=active.reduce((n,p)=>n+p.income,0);health=100+active.reduce((n,p)=>n+p.health,0);damage=10+active.reduce((n,p)=>n+p.power,0)}
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
function roll(){
 const total=parts.reduce((n,p)=>n+p.weight,0);let r=Math.random()*total,pick=parts[0];
 for(const p of parts){r-=p.weight;if(r<=0){pick=p;break}}
 inventory.push(pick.id);if(!equipped[pick.slot])equipped[pick.slot]=pick.id;
 $("result").textContent=pick.icon+" "+pick.name+" — "+pick.rarity;
 updateStats();renderInventory();persist();notify("You rolled "+pick.name+"!");
}
$("rollButton").onclick=roll;
$("openInventory").onclick=()=>$("inventoryModal").classList.remove("hidden");
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$ (b.dataset.close).classList.add("hidden"));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.add("hidden")}));
function renderShop(){
 const ids=["robot-head","crown-head","rock-torso","neon-torso","steel-arms","crystal-arms","runner-legs","rocket-legs"];
 $("shopItems").innerHTML=ids.map(id=>{const p=part(id),owned=inventory.includes(id);return '<div class="shop-item"><span class="shop-icon">'+p.icon+'</span><div class="shop-copy"><b>'+p.name+'</b><small>'+p.rarity+' · +'+p.income+' coins/sec · +'+p.health+' HP</small></div><button class="buy-button" data-buy="'+id+'" '+(owned?"disabled":"")+'>'+(owned?"OWNED":p.price+" COINS")+'</button></div>'}).join("");
 $("shopItems").querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>buy(b.dataset.buy));
}
function buy(id){const p=part(id);if(inventory.includes(id))return notify("You already own this part!");if(money<p.price)return notify("Not enough coins! Equip income parts to earn coins.");money-=p.price;inventory.push(id);renderShop();renderInventory();updateStats();persist();notify("Bought "+p.name+"! Equip it from your bag.")}
let canvas,ctx,w=0,h=0,dpr=1;
const player={x:0,z:3,y:0,vy:0,walk:0};
const keys={};
function resize(){if(!canvas)return;const r=canvas.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
function project(x,y,z){const s=32;return {x:w/2+(x-z)*s*.72,y:h*.53+(x+z)*s*.36-y*s}}
function poly(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>{const q=project(...p);if(!i)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y)});ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
function block(x,y,z,ww,hh,dd,color){
 const a=[x-ww/2,y,z-dd/2],b=[x+ww/2,y,z-dd/2],c=[x+ww/2,y,z+dd/2],d=[x-ww/2,y,z+dd/2];
 const A=[a[0],y+hh,a[2]],B=[b[0],y+hh,b[2]],C=[c[0],y+hh,c[2]],D=[d[0],y+hh,d[2]];
 poly([A,B,C,D],color);poly([A,D,d,a],shade(color,.72));poly([B,C,c,b],shade(color,.82));
}
function shade(hex,f){const n=parseInt(hex.slice(1),16),r=Math.min(255,((n>>16)&255)*f)|0,g=Math.min(255,((n>>8)&255)*f)|0,b=Math.min(255,(n&255)*f)|0;return 'rgb('+r+','+g+','+b+')'}
function label(x,y,z,text,color="#fff",size=14){const p=project(x,y,z);ctx.font="900 "+size+"px Inter,Arial";ctx.textAlign="center";ctx.lineWidth=4;ctx.strokeStyle="#14243a";ctx.strokeText(text,p.x,p.y);ctx.fillStyle=color;ctx.fillText(text,p.x,p.y)}
function drawWorld(){
 ctx.fillStyle="#91bce0";ctx.fillRect(0,0,w,h);
 // distant sky and ground horizon
 const horizon=h*.43;const grad=ctx.createLinearGradient(0,horizon,0,h);grad.addColorStop(0,"#668eae");grad.addColorStop(1,"#294762");ctx.fillStyle=grad;ctx.fillRect(0,horizon,w,h-horizon);
 // checker-like plaza ground
 for(let x=-32;x<=32;x+=2)for(let z=-32;z<=32;z+=2){const p=project(x,0,z);const q=project(x+2,0,z);const r=project(x+2,0,z+2);const s=project(x,0,z+2);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(r.x,r.y);ctx.lineTo(s.x,s.y);ctx.closePath();ctx.fillStyle=((x+z)/2%2===0)?"#456b83":"#41657d";ctx.fill()}
 // paths and plaza disc
 ctx.beginPath();for(let i=0;i<=48;i++){const a=i*Math.PI/24,p=project(Math.cos(a)*5.5,0,Math.sin(a)*5.5);if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}ctx.closePath();ctx.fillStyle="#547d99";ctx.fill();ctx.strokeStyle="#a6d9f3";ctx.lineWidth=4;ctx.stroke();
 // shop building at north of spawn
 block(0,0,-12,8,.35,6,"#263d5a");block(0,.35,-14.7,7,3.8,.45,"#24517a");block(-3.3,.35,-12,.45,3.8,5.5,"#3272a5");block(3.3,.35,-12,.45,3.8,5.5,"#3272a5");block(0,4.15,-12,7.2,.45,6.1,"#17365c");block(0,.35,-10.5,6,.9,1,"#8b603d");block(0,4.7,-8.95,5.5,1.05,.2,"#ffcf61");label(0,5.2,-8.8,"BODY SHOP","#ffe18a",18);
 // decorative pillars and trees
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*9,z=Math.sin(a)*9;block(x,0,z,1.1,2.2,1.1,i%2?"#355c82":"#426e96");block(x,2.2,z,1.35,.18,1.35,"#75a8d7")}
 for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.cos(a)*16,z=Math.sin(a)*16;block(x,0,z,.45,1.7,.45,"#79543b");const p=project(x,2.7,z);ctx.beginPath();ctx.arc(p.x,p.y,25,0,Math.PI*2);ctx.fillStyle="#3f9b75";ctx.fill();ctx.strokeStyle="#8bc69c";ctx.lineWidth=2;ctx.stroke()}
}
function drawAvatar(){
 const x=player.x,z=player.z,y=player.y,head=part(equipped.Head),torso=part(equipped.Torso),arms=part(equipped.Arms),legs=part(equipped.Legs);
 // shadow
 const sh=project(x,0,z);ctx.beginPath();ctx.ellipse(sh.x,sh.y,25,10,0,0,Math.PI*2);ctx.fillStyle="#13283b66";ctx.fill();
 const step=Math.sin(player.walk)*.18;
 block(x-.3,.05+y,z+step,.48,1.05,.48,legs.color);block(x+.3,.05+y,z-step,.48,1.05,.48,legs.color);
 block(x-.82,1.25+y,z,.38,1.05,.42,arms.color);block(x+.82,1.25+y,z,.38,1.05,.42,arms.color);
 block(x,1.15+y,z,1.15,1.2,.62,torso.color);
 if(torso.id==="neon-torso"){const p=project(x,1.65+y,z-.34);ctx.fillStyle="#c8ffff";ctx.fillRect(p.x-5,p.y-5,10,10)}
 block(x,2.45+y,z,.9,.9,.9,head.color);
 if(head.id==="crown-head"){block(x,3.35+y,z,.95,.18,.95,"#f4c64e");for(let i=-1;i<=1;i++)block(x+i*.3,3.53+y,z,.16,.35,.16,"#ffe28a")}
 const face=project(x,2.7+y,z-.48);ctx.fillStyle="#17243a";ctx.fillRect(face.x-7,face.y-2,4,5);ctx.fillRect(face.x+4,face.y-2,4,5);
 label(x,3.9+y,z,"YOU","#fff",11);
}
function draw(){
 drawWorld();drawAvatar();
 const shopDist=Math.hypot(player.x,player.z+12)<5.2;
 if(shopDist!==nearShop){nearShop=shopDist;$("shopPrompt").classList.toggle("hidden",!nearShop)}
 if(nearShop){const p=project(0,5.7,-12);ctx.font="900 13px Inter,Arial";ctx.textAlign="center";ctx.fillStyle="#ffe18a";ctx.fillText("PRESS E AT THE COUNTER",p.x,p.y)}
}
let last=0;
function frame(now){const dt=Math.min((now-last)/1000||0,.04);last=now;
 let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
 let dz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
 if(dx||dz){const len=Math.hypot(dx,dz);dx/=len;dz/=len;const speed=(keys.ShiftLeft||keys.ShiftRight)?9:5.5;player.x=Math.max(-24,Math.min(24,player.x+dx*speed*dt));player.z=Math.max(-24,Math.min(24,player.z+dz*speed*dt));player.walk+=dt*10}
 if((keys.Space||keys.KeyJ)&&player.y===0)player.vy=7;
 player.vy-=18*dt;player.y=Math.max(0,player.y+player.vy*dt);if(player.y===0)player.vy=0;
 draw();requestAnimationFrame(frame)}
$("shopModal").classList.add("hidden");
canvas=document.createElement("canvas");canvas.id="worldCanvas";canvas.tabIndex=0;canvas.setAttribute("aria-label","Game world. Use WASD or arrow keys to move.");canvas.style.cssText="display:block;width:100%;height:100%;outline:none;touch-action:none";$("gameCanvas").replaceChildren(canvas);ctx=canvas.getContext("2d");
if(!ctx){$("gameCanvas").innerHTML="<div style=\"display:grid;place-items:center;width:100%;height:100%;padding:24px;color:white;text-align:center;font: bold 18px Arial\">Your browser could not start the game graphics. Try opening this page in a normal Chrome tab.</div>";throw new Error("2D canvas is unavailable");}
canvas.addEventListener("pointerdown",()=>canvas.focus());
document.addEventListener("keydown",e=>{keys[e.code]=true;if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();if(e.code==="KeyE"&&nearShop){$("shopModal").classList.remove("hidden");renderShop()}});
document.addEventListener("keyup",e=>keys[e.code]=false);window.addEventListener("blur",()=>Object.keys(keys).forEach(k=>keys[k]=false));
resize();window.addEventListener("resize",resize);
renderShop();renderInventory();updateStats();notify("Welcome! Use WASD to move. Walk to the BODY SHOP and press E.");
setInterval(()=>{if(income>0){money+=income;updateStats();persist()}},1000);
requestAnimationFrame(frame);
