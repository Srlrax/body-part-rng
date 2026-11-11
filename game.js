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
let save=loadSave(),money=Number.isFinite(Number(save.money))?Number(save.money):100,inventory=save.inventory,equipped=save.equipped;\nlet questProgress=Math.max(0,Number(save.questProgress)||0),questReward=250;
let upgrades={speed:0,luck:0,coins:0,...(save.upgrades||{})};
let health=100,damage=10,income=0,nearShop=false,toastTimer;
function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify({money,inventory,equipped,upgrades,questProgress}))}\nfunction updateQuest(){const fill=$("questFill"),count=$("questCount");if(fill)fill.style.width=Math.min(100,questProgress/5*100)+"%";if(count)count.textContent=Math.min(questProgress,5)+" / 5";}
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
function roll(){
 const weightOf=p=>p.weight*(p.rarity==="Common"?1:p.rarity==="Rare"?1+upgrades.luck*.25:1+upgrades.luck*.25);
 const total=parts.reduce((n,p)=>n+weightOf(p),0);let r=Math.random()*total,pick=parts[0];
 for(const p of parts){r-=weightOf(p);if(r<=0){pick=p;break}}
 inventory.push(pick.id);if(!equipped[pick.slot])equipped[pick.slot]=pick.id;\n questProgress++;if(questProgress>=5){money+=questReward;questProgress=0;notify("QUEST COMPLETE! +"+questReward+" coins");persist()}
 $("result").textContent=pick.icon+" "+pick.name+" — "+pick.rarity;
 updateStats();renderInventory();updateQuest();persist();\n const result=$("result");result.className="roll-result rarity-"+pick.rarity.toLowerCase();result.textContent=pick.icon+" "+pick.name+" — "+pick.rarity;\n const button=$("rollButton");button.classList.remove("rolling");void button.offsetWidth;button.classList.add("rolling");\n if(pick.rarity!=="Common"){const flash=$("rarityFlash");if(flash){flash.className="rarity-flash "+pick.rarity.toLowerCase();setTimeout(()=>flash.className="rarity-flash",550)}}\n if(questProgress===0)notify("QUEST COMPLETE! +"+questReward+" coins");else notify("You rolled "+pick.name+"!");
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

let canvas,ctx,w=0,h=0,dpr=1;
const player={x:0,z:3,y:0,vy:0,walk:0,yaw:0};
const keys={};
let dragging=false,lastPointerX=0;
function resize(){if(!canvas)return;const r=canvas.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
// Perspective camera sits behind and above the avatar, like a third-person adventure game.
function project(x,y,z){
 const fx=Math.sin(player.yaw),fz=-Math.cos(player.yaw),rx=Math.cos(player.yaw),rz=Math.sin(player.yaw);
 const camX=player.x-fx*6.5,camZ=player.z-fz*6.5;
 const dx=x-camX,dz=z-camZ,side=dx*rx+dz*rz,depth=dx*fx+dz*fz;
 if(depth<.5)return {x:-9999,y:-9999,depth};
 const focal=Math.min(w,h)*.95;
 return {x:w/2+side*focal/depth,y:h*.43+(5.8-y)*focal/depth,depth};
}
function poly(points,fill,stroke){const pts=points.map(p=>project(...p));if(pts.some(p=>p.depth!==undefined&&p.depth<.5))return;ctx.beginPath();pts.forEach((p,i)=>{if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)});ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke()}}
function shade(hex,f){const n=parseInt(hex.slice(1),16),r=Math.min(255,((n>>16)&255)*f)|0,g=Math.min(255,((n>>8)&255)*f)|0,b=Math.min(255,(n&255)*f)|0;return 'rgb('+r+','+g+','+b+')'}
function block(x,y,z,ww,hh,dd,color){
 const a=[x-ww/2,y,z-dd/2],b=[x+ww/2,y,z-dd/2],c=[x+ww/2,y,z+dd/2],d=[x-ww/2,y,z+dd/2];
 const A=[a[0],y+hh,a[2]],B=[b[0],y+hh,b[2]],C=[c[0],y+hh,c[2]],D=[d[0],y+hh,d[2]];
 poly([A,B,C,D],color,"#101d2b88");poly([A,D,d,a],shade(color,.68));poly([B,C,c,b],shade(color,.82));
}
function label(x,y,z,txt,color="#fff",size=15){const p=project(x,y,z);if(p.depth<.5)return;ctx.font="900 "+size+"px Inter,Arial";ctx.textAlign="center";ctx.lineWidth=4;ctx.strokeStyle="#14243a";ctx.strokeText(txt,p.x,p.y);ctx.fillStyle=color;ctx.fillText(txt,p.x,p.y)}
function drawTree(x,z,scale=1){
 block(x,0,z,.38*scale,2.1*scale,.38*scale,"#79533b");
 const p=project(x,3.0*scale,z);if(p.depth<.5)return;
 const radius=Math.max(5,Math.min(45,34*scale*5/p.depth));
 const g=ctx.createRadialGradient(p.x-radius*.3,p.y-radius*.4,2,p.x,p.y,radius);
 g.addColorStop(0,"#9de49a");g.addColorStop(1,"#23734d");
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#b1e8a077";ctx.lineWidth=2;ctx.stroke();
}
function drawWorld(){
 const sky=ctx.createLinearGradient(0,0,0,h*.55);sky.addColorStop(0,"#72b9ed");sky.addColorStop(.7,"#d3e8f5");sky.addColorStop(1,"#f7d9ae");ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 // distant hills
 ctx.fillStyle="#719c91";ctx.beginPath();ctx.moveTo(0,h*.48);for(let x=0;x<=w;x+=35)ctx.lineTo(x,h*.42+Math.sin(x*.012)*22);ctx.lineTo(w,h*.58);ctx.lineTo(0,h*.58);ctx.fill();
 const ground=ctx.createLinearGradient(0,h*.48,0,h);ground.addColorStop(0,"#719b68");ground.addColorStop(1,"#294e3d");ctx.fillStyle=ground;ctx.fillRect(0,h*.48,w,h*.52);
 // perspective plaza tiles
 for(let z=-24;z<=34;z+=2){for(let x=-24;x<=24;x+=2){
   const col=((Math.floor(x/2)+Math.floor(z/2))%2===0)?"#6e9866":"#648d60";
   poly([[player.x+x,0,player.z+z],[player.x+x+2,0,player.z+z],[player.x+x+2,0,player.z+z+2],[player.x+x,0,player.z+z+2]],col);
 }}
 // central stone path leading to the shop
 poly([[-4,0,-30],[4,0,-30],[4,0,18],[-4,0,18]],"#9a9b8b","#d3c7a1");
 for(let z=-24;z<17;z+=4){poly([[-3.7,.02,z],[-3.45,.02,z],[3.45,.02,z],[3.7,.02,z]],"#b8b39e")}
 // plaza circle and trim
 const ring=[];for(let i=0;i<=48;i++){const a=i*Math.PI/24;ring.push([Math.cos(a)*7,.03,Math.sin(a)*7])}
 const pts=ring.map(p=>project(...p));ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.strokeStyle="#e6d6a0";ctx.lineWidth=5;ctx.stroke();
 // upgrade shop building
 block(0,0,-14,10,.45,7,"#34485d");
 block(0,.45,-17.2,9,4.3,.5,"#3977a0");block(-4.25,.45,-14,.5,4.2,6.2,"#315f83");block(4.25,.45,-14,.5,4.2,6.2,"#315f83");
 block(0,4.7,-14,10,.55,7,"#243d59");block(0,5.1,-14,9.3,.18,6.4,"#e4b95d");
 // glass doors and windows
 block(-2.5,.5,-16.82,2.1,2.7,.12,"#8ed4e6");block(2.5,.5,-16.82,2.1,2.7,.12,"#8ed4e6");
 block(0,.5,-16.7,1.4,3.2,.18,"#182b40");block(0,3.85,-16.75,5.8,.65,.2,"#f3c85e");
 label(0,4.0,-16.45,"UPGRADE SHOP","#fff0ad",19);
 // lamp posts, planters, trees
 for(let i=0;i<6;i++){const x=-14+i*5.6;block(x,0,-5,.18,3.7,.18,"#334b5c");block(x,3.7,-5,.8,.18,.8,"#f9e3a1");const p=project(x,3.8,-5);if(p.depth>.5){ctx.fillStyle="#ffe6a0";ctx.shadowColor="#ffe6a0";ctx.shadowBlur=18;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(2,9/p.depth),0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}}
 for(let i=0;i<12;i++){const a=i*Math.PI/6;drawTree(Math.cos(a)*19,Math.sin(a)*19,1.1)}
 // decorative low walls around the plaza
 for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*10,z=Math.sin(a)*10;block(x,0,z,1.4,.55,1.4,"#b5a47c");block(x,.55,z,1.45,.12,1.45,"#e2d3a8")}
}
function rounded(x,y,wid,hei,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,wid,hei,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function drawAvatar(){
 // Draw the avatar as a fully opaque, outlined character in screen space.
 const cx=w/2,base=h*.82,scale=Math.max(.72,Math.min(1.12,h/700)),step=Math.sin(player.walk)*8*scale;
 const head=part(equipped.Head),torso=part(equipped.Torso),arms=part(equipped.Arms),legs=part(equipped.Legs);
 ctx.save();ctx.translate(cx,base);ctx.scale(scale,scale);
 ctx.fillStyle="#10263b66";ctx.beginPath();ctx.ellipse(0,2,42,12,0,0,Math.PI*2);ctx.fill();
 // legs, with a visible dark outline and walking swing
 ctx.save();ctx.translate(-13,0);ctx.rotate(step*.012);rounded(-10,-61,20,64,7,legs.color,"#14263b");rounded(-12,-9,25,12,5,"#243a56","#14263b");ctx.restore();
 ctx.save();ctx.translate(13,0);ctx.rotate(-step*.012);rounded(-10,-61,20,64,7,legs.color,"#14263b");rounded(-12,-9,25,12,5,"#243a56","#14263b");ctx.restore();
 // arms behind torso
 ctx.save();ctx.translate(-29,-103);ctx.rotate(-.12-step*.008);rounded(-10,-4,20,68,8,arms.color,"#14263b");ctx.restore();
 ctx.save();ctx.translate(29,-103);ctx.rotate(.12+step*.008);rounded(-10,-4,20,68,8,arms.color,"#14263b");ctx.restore();
 // torso and chest detail
 rounded(-29,-137,58,78,10,torso.color,"#14263b");
 rounded(-19,-127,38,7,3,"#ffffff55");
 if(torso.id==="neon-torso"){ctx.shadowColor="#5ffff0";ctx.shadowBlur=18;rounded(-9,-108,18,18,5,"#bafffa","#eaffff");ctx.shadowBlur=0}
 // head, neck and face
 rounded(-9,-66,18,14,4,"#d5a47f","#14263b");
 rounded(-23,-190,46,48,12,head.color,"#14263b");
 ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(-9,-171,5,0,Math.PI*2);ctx.arc(9,-171,5,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="#18283b";ctx.beginPath();ctx.arc(-8,-171,2.5,0,Math.PI*2);ctx.arc(10,-171,2.5,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle="#593d32";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,-160,7,.15,Math.PI-.15);ctx.stroke();
 if(head.id==="crown-head"){ctx.fillStyle="#f4c64e";ctx.strokeStyle="#704d18";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-23,-186);ctx.lineTo(-22,-207);ctx.lineTo(-9,-196);ctx.lineTo(0,-213);ctx.lineTo(10,-196);ctx.lineTo(23,-207);ctx.lineTo(23,-186);ctx.closePath();ctx.fill();ctx.stroke()}
 ctx.restore();
 // Name tag floats over the avatar.
 rounded(cx-30,base-235*scale,60,22,8,"#10243be8","#ffffff66");ctx.fillStyle="#fff";ctx.font="900 10px Inter,Arial";ctx.textAlign="center";ctx.fillText("YOU",cx,base-220*scale);
}
function draw(){
 drawWorld();drawAvatar();
 const shopDist=Math.hypot(player.x,player.z+14)<6;
 if(shopDist!==nearShop){nearShop=shopDist;$("shopPrompt").classList.toggle("hidden",!nearShop)}
 if(nearShop){const p=project(0,5.8,-14);if(p.depth>.5){ctx.font="900 13px Inter,Arial";ctx.textAlign="center";ctx.fillStyle="#fff0ad";ctx.fillText("UPGRADE SHOP",p.x,p.y)}}
}
let last=0;
function frame(now){const dt=Math.min((now-last)/1000||0,.04);last=now;
 let forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);
 let side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
 if(forward||side){const len=Math.hypot(forward,side);forward/=len;side/=len;const speed=(5.5+upgrades.speed*1.5)*((keys.ShiftLeft||keys.ShiftRight)?1.5:1);
 const fx=Math.sin(player.yaw),fz=-Math.cos(player.yaw),rx=Math.cos(player.yaw),rz=Math.sin(player.yaw);
 player.x=Math.max(-26,Math.min(26,player.x+(fx*forward+rx*side)*speed*dt));
 player.z=Math.max(-26,Math.min(26,player.z+(fz*forward+rz*side)*speed*dt));
 player.walk+=dt*11;player.yaw=Math.atan2(fx*forward+rx*side,-(fz*forward+rz*side))}
 if((keys.Space||keys.KeyJ)&&player.y===0)player.vy=7;
 player.vy-=18*dt;player.y=Math.max(0,player.y+player.vy*dt);if(player.y===0)player.vy=0;
 draw();requestAnimationFrame(frame)}
$("shopModal").classList.add("hidden");
canvas=document.createElement("canvas");canvas.id="worldCanvas";canvas.tabIndex=0;canvas.setAttribute("aria-label","Third person game world. Use WASD or arrow keys to move.");canvas.style.cssText="display:block;width:100%;height:100%;outline:none;touch-action:none";$("gameCanvas").replaceChildren(canvas);ctx=canvas.getContext("2d");
if(!ctx){$("gameCanvas").innerHTML="<div style=\"display:grid;place-items:center;width:100%;height:100%;padding:24px;color:white;text-align:center;font:bold 18px Arial\">Your browser could not start the game graphics. Try opening this page in a normal Chrome tab.</div>";throw new Error("2D canvas is unavailable");}
canvas.addEventListener("pointerdown",e=>{canvas.focus();dragging=true;lastPointerX=e.clientX});
window.addEventListener("pointerup",()=>dragging=false);
window.addEventListener("pointermove",e=>{if(dragging){player.yaw+= (e.clientX-lastPointerX)*.006;lastPointerX=e.clientX}});
document.addEventListener("keydown",e=>{keys[e.code]=true;if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();if(e.code==="KeyE"&&nearShop){$("shopModal").classList.remove("hidden");renderShop()}});
document.addEventListener("keyup",e=>keys[e.code]=false);window.addEventListener("blur",()=>{dragging=false;Object.keys(keys).forEach(k=>keys[k]=false)});
resize();window.addEventListener("resize",resize);
renderShop();renderInventory();updateStats();updateQuest();notify("Welcome! WASD to move. Drag to turn the camera. Find the UPGRADE SHOP!");
setInterval(()=>{if(income>0){money+=income;updateStats();persist()}},1000);
requestAnimationFrame(frame);
