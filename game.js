import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
const $=id=>document.getElementById(id);
const SAVE_KEY="bodyPartRngSaveV2";
const parts=[
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
{id:"rocket-legs",name:"Rocket Legs",slot:"Legs",rarity:"Epic",weight:5,price:360,income:22,health:15,power:10,color:"#ff875e",icon:"🚀"}];
const starter={money:100,inventory:["starter-head","starter-torso","starter-arms","starter-legs"],equipped:{Head:"starter-head",Torso:"starter-torso",Arms:"starter-arms",Legs:"starter-legs"}};
function loadSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return s&&Array.isArray(s.inventory)&&s.equipped?s:structuredClone(starter)}catch{return structuredClone(starter)}}
let save=loadSave(),money=Number.isFinite(Number(save.money))?Number(save.money):100,inventory=save.inventory,equipped=save.equipped,questProgress=Math.max(0,Number(save.questProgress)||0),upgrades={speed:0,luck:0,coins:0,...(save.upgrades||{})},health=100,damage=10,income=0,nearShop=false,toastTimer;
function persist(){localStorage.setItem(SAVE_KEY,JSON.stringify({money,inventory,equipped,upgrades,questProgress}))}
function notify(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove("show"),2300)}
function part(id){return parts.find(p=>p.id===id)||parts[0]}
function stats(){const active=Object.values(equipped).filter(Boolean).map(part);income=Math.floor(active.reduce((n,p)=>n+p.income,0)*(1+upgrades.coins*.25));health=100+active.reduce((n,p)=>n+p.health,0);damage=10+active.reduce((n,p)=>n+p.power,0)}
function updateStats(){stats();$("money").textContent=Math.floor(money).toLocaleString();$("health").textContent=health;$("healthFill").style.width="100%";$("damage").textContent=damage;$("income").textContent=income}
function updateQuest(){$("questFill").style.width=Math.min(100,questProgress/5*100)+"%";$("questCount").textContent=Math.min(questProgress,5)+" / 5"}
let player,scene,camera,renderer,clock,avatarRoot,bodyParts={},shopPosition=new THREE.Vector3(0,0,-12),cameraYaw=0,cameraPitch=.22,cameraDistance=7,keys={},rollBusy=false;
const mat=(color,roughness=.72,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
function box(parent,name,size,color,pos,opts={}){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(color,opts.roughness??.72,opts.metalness??0));m.name=name;m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function sphere(parent,name,r,color,pos,scale=[1,1,1],metalness=0){const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),mat(color,.48,metalness));m.name=name;m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;parent.add(m);return m}
function cylinder(parent,name,rt,rb,h,color,pos,segments=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat(color));m.name=name;m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function makeLimb(parent,name,color,top,bottom,r=.15){const pivot=new THREE.Group();pivot.position.set(...top);parent.add(pivot);const len=Math.hypot(top[0]-bottom[0],top[1]-bottom[1],top[2]-bottom[2]);const width=r*2.15;const mesh=new THREE.Mesh(new THREE.BoxGeometry(width,len,width),mat(color,.62));mesh.position.set(0,-len*.5,0);mesh.castShadow=true;mesh.receiveShadow=true;pivot.add(mesh);const joint=new THREE.Mesh(new THREE.BoxGeometry(width*.96,width*.96,width*.96),mat(color,.62));joint.position.set(0,-len,0);joint.castShadow=true;pivot.add(joint);return pivot}
function buildAvatar(){
 avatarRoot=new THREE.Group();scene.add(avatarRoot);
 const torso=box(avatarRoot,"torso",[.9,1.15,.48],part(equipped.Torso).color,[0,1.55,0],{roughness:.42});torso.geometry.dispose();torso.geometry=new THREE.BoxGeometry(.9,1.15,.48);
 bodyParts.torso=torso;
 bodyParts.neck=box(avatarRoot,"neck",[.28,.22,.28],"#d5a47f",[0,2.22,0]);
 bodyParts.head=box(avatarRoot,"head",[.82,.82,.78],part(equipped.Head).color,[0,2.68,0],{roughness:.62});
 bodyParts.eyeL=sphere(avatarRoot,"eyeL",.055,"#ffffff",[-.15,2.73,.402]);bodyParts.eyeR=sphere(avatarRoot,"eyeR",.055,"#ffffff",[.15,2.73,.402]);
 bodyParts.pupilL=sphere(avatarRoot,"pupilL",.027,"#17243a",[-.15,2.73,.45]);bodyParts.pupilR=sphere(avatarRoot,"pupilR",.027,"#17243a",[.15,2.73,.45]);
 bodyParts.armL=makeLimb(avatarRoot,"armL",part(equipped.Arms).color,[-.57,1.98,0],[-.66,.94,0],.17);
 bodyParts.armR=makeLimb(avatarRoot,"armR",part(equipped.Arms).color,[.57,1.98,0],[.66,.94,0],.17);
 bodyParts.legL=makeLimb(avatarRoot,"legL",part(equipped.Legs).color,[-.23,1.05,0],[-.25,.12,.02],.2);
 bodyParts.legR=makeLimb(avatarRoot,"legR",part(equipped.Legs).color,[.23,1.05,0],[.25,.12,.02],.2);
 bodyParts.footL=box(avatarRoot,"footL",[.38,.2,.58],"#263c56",[-.25,.11,.16]);bodyParts.footR=box(avatarRoot,"footR",[.38,.2,.58],"#263c56",[.25,.11,.16]);
 bodyParts.crown=new THREE.Group();avatarRoot.add(bodyParts.crown);
 for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI/4;const spike=cylinder(bodyParts.crown,"crownSpike",.035,.11,.27,"#f4c64e",[Math.cos(a)*.23,.2,Math.sin(a)*.23],8);spike.rotation.z=-Math.cos(a)*.4}
 bodyParts.crown.position.set(0,3.02,0);bodyParts.crown.visible=equipped.Head==="crown-head";
 bodyParts.headRing=new THREE.Mesh(new THREE.TorusGeometry(.43,.055,8,24),mat("#a9c4d8",.25,.8));bodyParts.headRing.rotation.x=Math.PI/2;bodyParts.headRing.position.set(0,2.68,0);avatarRoot.add(bodyParts.headRing);bodyParts.headRing.visible=equipped.Head==="robot-head";
 bodyParts.core=sphere(avatarRoot,"core",.2,"#31d8d0",[0,1.58,.255]);bodyParts.core.visible=equipped.Torso==="neon-torso";bodyParts.core.material.emissive=new THREE.Color("#087e85");bodyParts.core.material.emissiveIntensity=1.2;
 bodyParts.shoulderL=sphere(avatarRoot,"shoulderL",.22,part(equipped.Arms).color,[-.55,1.99,0]);bodyParts.shoulderR=sphere(avatarRoot,"shoulderR",.22,part(equipped.Arms).color,[.55,1.99,0]);
 bodyParts.kneeL=sphere(avatarRoot,"kneeL",.19,part(equipped.Legs).color,[-.25,.55,0]);bodyParts.kneeR=sphere(avatarRoot,"kneeR",.19,part(equipped.Legs).color,[.25,.55,0]);
 bodyParts.shadow=sphere(avatarRoot,"shadow",.01,"#152b30",[0,.02,0],[2.1,.01,1.4]);
 bodyParts.hair=box(avatarRoot,"hair",[.86,.24,.82],"#3b2b25",[0,3.08,-.015]);
 bodyParts.hairBack=box(avatarRoot,"hairBack",[.82,.48,.18],"#3b2b25",[0,2.91,-.34]);
 bodyParts.browL=box(avatarRoot,"browL",[.19,.045,.035],"#49332b",[-.15,2.84,.405]);
 bodyParts.browR=box(avatarRoot,"browR",[.19,.045,.035],"#49332b",[.15,2.84,.405]);
 bodyParts.mouth=box(avatarRoot,"mouth",[.16,.025,.025],"#75483d",[0,2.57,.405]);
 bodyParts.earL=box(avatarRoot,"earL",[.12,.2,.15],"#d5a47f",[-.45,2.67,0]);
 bodyParts.earR=box(avatarRoot,"earR",[.12,.2,.15],"#d5a47f",[.45,2.67,0]);
 bodyParts.shirtBand=box(avatarRoot,"shirtBand",[.92,.09,.5],"#e6edf5",[0,1.12,0]);
 bodyParts.shirtBadge=box(avatarRoot,"shirtBadge",[.17,.22,.035],"#f5c85d",[.24,1.75,.26]);
 bodyParts.belt=box(avatarRoot,"belt",[.94,.12,.51],"#273447",[0,1.02,0]);
 bodyParts.beltBuckle=box(avatarRoot,"beltBuckle",[.16,.16,.055],"#e6bc5d",[0,1.02,.29]);
 bodyParts.soleL=box(avatarRoot,"soleL",[.4,.09,.61],"#18283a",[-.25,.045,.17]);
 bodyParts.soleR=box(avatarRoot,"soleR",[.4,.09,.61],"#18283a",[.25,.045,.17]);
 // Armor is built as fitted layers on the avatar itself, not floating accessories.
 bodyParts.stoneArmor=new THREE.Group();avatarRoot.add(bodyParts.stoneArmor);
 box(bodyParts.stoneArmor,"stoneChest",[.72,.72,.075],"#8999a8",[0,1.62,.275],{roughness:.84});
 box(bodyParts.stoneArmor,"stoneChestInset",[.5,.43,.025],"#657787",[0,1.64,.325],{roughness:.9});
 for(const x of [-.39,.39])box(bodyParts.stoneArmor,"stoneSidePlate",[.12,.76,.39],"#758696",[x,1.58,0],{roughness:.9});
 bodyParts.neonArmor=new THREE.Group();avatarRoot.add(bodyParts.neonArmor);
 box(bodyParts.neonArmor,"neonChestFrame",[.66,.66,.075],"#167f83",[0,1.62,.278],{metalness:.45,roughness:.3});
 box(bodyParts.neonArmor,"neonChestCore",[.42,.42,.045],"#42f1df",[0,1.62,.33],{metalness:.2,roughness:.24});
 bodyParts.neonArmor.children[1].material.emissive=new THREE.Color("#12bcb1");bodyParts.neonArmor.children[1].material.emissiveIntensity=1.35;
 bodyParts.steelArmor=[];bodyParts.crystalArmor=[];bodyParts.runnerArmor=[];bodyParts.rocketArmor=[];
 for(const side of [-1,1]){const arm=side<0?bodyParts.armL:bodyParts.armR;const steel=new THREE.Group();arm.add(steel);bodyParts.steelArmor.push(steel);sphere(steel,"steelShoulder",.19,"#aebdca",[0,-.05,0],[1,1,.9],.45);box(steel,"steelForearmPlate",[.3,.42,.11],"#aebdca",[0,-.72,.16],{metalness:.55,roughness:.34});box(steel,"steelForearmInset",[.17,.25,.035],"#6f8498",[0,-.72,.225],{metalness:.55,roughness:.35});const crystal=new THREE.Group();arm.add(crystal);bodyParts.crystalArmor.push(crystal);box(crystal,"crystalBracer",[.31,.44,.13],"#a98bff",[0,-.72,.16],{metalness:.25,roughness:.28});box(crystal,"crystalBracerGem",[.13,.2,.045],"#e2d8ff",[0,-.72,.235],{metalness:.15,roughness:.2});const leg=side<0?bodyParts.legL:bodyParts.legR;const runner=new THREE.Group();leg.add(runner);bodyParts.runnerArmor.push(runner);box(runner,"runnerShinGuard",[.31,.43,.1],"#45b78b",[0,-.69,.15],{roughness:.4});box(runner,"runnerShinStripe",[.12,.24,.035],"#b4f0d4",[0,-.69,.21]);const rocket=new THREE.Group();leg.add(rocket);bodyParts.rocketArmor.push(rocket);box(rocket,"rocketShinGuard",[.34,.47,.13],"#e9784f",[0,-.68,.15],{metalness:.25,roughness:.38});box(rocket,"rocketShinInset",[.16,.27,.04],"#ffd08a",[0,-.68,.225]);}
 bodyParts.robotFace=new THREE.Group();avatarRoot.add(bodyParts.robotFace);
 box(bodyParts.robotFace,"robotVisor",[.62,.28,.045],"#526b80",[0,2.7,.407],{metalness:.75,roughness:.22});
 for(const x of [-.16,.16]){const eye=sphere(bodyParts.robotFace,"robotEye",.045,"#6ef4ff",[x,2.72,.445]);eye.material.emissive=new THREE.Color("#21d9ff");eye.material.emissiveIntensity=1.4;}
 updateAvatarParts();
}
function updateAvatarParts(){const H=part(equipped.Head),T=part(equipped.Torso),A=part(equipped.Arms),L=part(equipped.Legs);bodyParts.head.material.color.set(H.color);bodyParts.torso.material.color.set(T.color);for(const n of ["armL","armR","shoulderL","shoulderR"])bodyParts[n].traverse(o=>{if(o.isMesh&&o.material&&!o.name.includes("steel")&&!o.name.includes("crystal"))o.material.color.set(A.color)});for(const n of ["legL","legR","kneeL","kneeR"])bodyParts[n].traverse(o=>{if(o.isMesh&&o.material&&!o.name.includes("runner")&&!o.name.includes("rocket"))o.material.color.set(L.color)});bodyParts.crown.visible=H.id==="crown-head";bodyParts.headRing.visible=false;bodyParts.robotFace.visible=H.id==="robot-head";bodyParts.hair.visible=H.id==="starter-head";bodyParts.hairBack.visible=H.id==="starter-head";bodyParts.browL.visible=H.id!=="robot-head";bodyParts.browR.visible=H.id!=="robot-head";bodyParts.mouth.visible=H.id!=="robot-head";bodyParts.core.visible=false;bodyParts.stoneArmor.visible=T.id==="rock-torso";bodyParts.neonArmor.visible=T.id==="neon-torso";bodyParts.steelArmor.forEach(g=>g.visible=A.id==="steel-arms");bodyParts.crystalArmor.forEach(g=>g.visible=A.id==="crystal-arms");bodyParts.runnerArmor.forEach(g=>g.visible=L.id==="runner-legs");bodyParts.rocketArmor.forEach(g=>g.visible=L.id==="rocket-legs");bodyParts.shoulderL.visible=A.id!=="steel-arms"&&A.id!=="crystal-arms";bodyParts.shoulderR.visible=bodyParts.shoulderL.visible;}
function makeTree(x,z,scale=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);cylinder(g,"treeTrunk",.19,.31,2.25,"#65432f",[0,1.12,0],9);for(let i=0;i<3;i++){const b=cylinder(g,"treeBranch",.075,.12,.9,"#765039",[0,1.45+i*.18,0],7);b.rotation.z=(i%2?1:-1)*.72;b.position.x=(i%2?1:-1)*.28;}for(let i=0;i<4;i++){const y=2.1+i*.36,r=1.05-i*.17;const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),mat(i%2?"#286c43":"#347f4d",.92));crown.position.set((i%2?-.22:.2),y,(i%3-.9)*.13);crown.scale.set(1,.92,1);crown.castShadow=true;crown.receiveShadow=true;g.add(crown);}sphere(g,"leafHighlight",.42,"#4c965b",[-.42,2.75,.2],[1,.75,1]);}
function makeGrassTuft(x,z){const g=new THREE.Group();g.position.set(x,.03,z);scene.add(g);for(let i=0;i<3;i++){const blade=new THREE.Mesh(new THREE.ConeGeometry(.055,.36,5),mat(i%2?"#4b8c4b":"#639b50",1));blade.position.set((i-1)*.1,.16,0);blade.rotation.z=(i-1)*-.28;blade.castShadow=true;g.add(blade);}}
function makeRock(x,z,scale=1){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.5,0),mat("#788982",.96));rock.position.set(x,.25*scale,z);rock.scale.set(1.25*scale,.65*scale,.95*scale);rock.rotation.set(.2,x*.13,z*.17);rock.castShadow=true;rock.receiveShadow=true;scene.add(rock);}
function makeLamp(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);cylinder(g,"pole",.055,.075,3,"#344b5a",[0,1.5,0]);sphere(g,"lamp",.23,"#ffe8a2",[0,3.1,0]);const light=new THREE.PointLight("#ffe2a0",1.3,8);light.position.set(0,3,0);g.add(light)}
function makeShop(){const g=new THREE.Group();g.position.copy(shopPosition);scene.add(g);
 box(g,"foundation",[6.8,.3,4.2],"#9aa8aa",[0,.15,0]);box(g,"shopBody",[6.2,3.2,3.7],"#a66d43",[0,1.85,0]);
 box(g,"frontPanel",[6.25,.2,.15],"#f0d19a",[0,3.35,1.88]);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(4.6,2.1,4),mat("#405b78"));roof.rotation.y=Math.PI/4;roof.position.set(0,4.35,0);roof.scale.set(1,.8,.72);roof.castShadow=true;g.add(roof);
 box(g,"awning",[6.4,.25,.8],"#f3d9a1",[0,2.85,2.1]);for(let i=0;i<8;i++)box(g,"awningStripe",[.39,.27,.83],i%2?"#f3eee0":"#b94e42",[-2.75+i*.79,2.85,2.11]);
 box(g,"door",[1.25,2.4,.16],"#503525",[0,1.35,1.94]);sphere(g,"knob",.07,"#f6d27b",[.42,1.3,2.05]);
 for(const x of [-2.05,2.05]){box(g,"windowFrame",[1.25,1.25,.18],"#f4d59a",[x,2,1.94]);box(g,"windowGlass",[1.02,1.02,.08],"#72b6ce",[x,2,2.05]);box(g,"windowBar",[.07,1.02,.1],"#f7dfad",[x,2,2.11]);}
 box(g,"signBoard",[3,.58,.22],"#173149",[0,3.7,2.0]);const canvas=document.createElement("canvas");canvas.width=512;canvas.height=96;const c=canvas.getContext("2d");c.fillStyle="#fff0bd";c.font="bold 43px Arial";c.textAlign="center";c.fillText("UPGRADE SHOP",256,64);const tex=new THREE.CanvasTexture(canvas);const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.85,.52),new THREE.MeshBasicMaterial({map:tex,transparent:true}));sign.position.set(0,3.7,2.13);g.add(sign);
 const pad=box(g,"welcomeMat",[2.4,.08,1.1],"#d7b56b",[0,.34,3.1]);pad.material.color.set("#d7b56b");
}

function makeTrail(points,width=3){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],.065,p[1])));
 const segments= Math.max(24,points.length*18),vertices=[],indices=[];
 for(let i=0;i<=segments;i++){const t=i/segments,p=curve.getPointAt(t),tan=curve.getTangentAt(t),side=new THREE.Vector3(-tan.z,0,tan.x).normalize().multiplyScalar(width/2);vertices.push(p.x-side.x,p.y,p.z-side.z,p.x+side.x,p.y,p.z+side.z);if(i<segments){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2)}}
 const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
 const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:"#b5a58b",roughness:1,side:THREE.DoubleSide}));mesh.receiveShadow=true;scene.add(mesh);
 for(let i=0;i<segments;i+=5){const p=curve.getPointAt(i/segments);const pebble=new THREE.Mesh(new THREE.DodecahedronGeometry(.09+Math.random()*.07,0),mat("#d4c6ac",1));pebble.position.set(p.x+(Math.random()-.5)*width*.8,.1,p.z+(Math.random()-.5)*width*.8);pebble.scale.y=.25;pebble.rotation.y=Math.random()*Math.PI;scene.add(pebble)}
}
function makePine(x,z,scale=1){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);scene.add(g);
 cylinder(g,"pineTrunk",.16,.23,1.8,"#65452f",[0,.9,0],8);
 for(let i=0;i<4;i++){const h=1.35+i*.48,r=1.12-i*.19;const crown=new THREE.Mesh(new THREE.ConeGeometry(r,1.75,8),mat(i%2?"#285b3e":"#326b47",.94));crown.position.set(0,h,0);crown.castShadow=true;crown.receiveShadow=true;g.add(crown)}
}
function makeHill(x,z,sx,sy,sz,color="#829b78"){
 const hill=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),mat(color,1));hill.position.set(x,-sy*.48,z);hill.scale.set(sx,sy,sz);hill.castShadow=true;hill.receiveShadow=true;scene.add(hill);
}
function makeLake(x,z,rx,rz){
 const bank=new THREE.Mesh(new THREE.CircleGeometry(1,64),mat("#b9aa83",1));bank.rotation.x=-Math.PI/2;bank.position.set(x,.035,z);bank.scale.set(rx+1.1,rz+1.1,1);bank.receiveShadow=true;scene.add(bank);
 const water=new THREE.Mesh(new THREE.CircleGeometry(1,64),new THREE.MeshStandardMaterial({color:"#4e9fa5",roughness:.22,metalness:.12,transparent:true,opacity:.9}));water.rotation.x=-Math.PI/2;water.position.set(x,.09,z);water.scale.set(rx,rz,1);scene.add(water);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(1,.035,6,64),mat("#d1c49f",1));rim.rotation.x=-Math.PI/2;rim.position.set(x,.105,z);rim.scale.set(rx,rz,1);scene.add(rim);
 for(let i=0;i<18;i++){const a=i*Math.PI*2/18;const reed=cylinder(scene,"shoreReed",.018,.025,.65,"#78904e",[x+Math.cos(a)*(rx+.35),.32,z+Math.sin(a)*(rz+.35)],5);reed.rotation.z=Math.cos(a)*-.16;}
}
function makeBridge(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 box(g,"bridgeDeck",[5,.28,3.2],"#806044",[0,.48,0]);
 for(let i=0;i<9;i++)box(g,"bridgePlank",[.48,.06,3.18],i%2?"#a47a52":"#936d49",[-2+i*.5,.65,0]);
 for(const side of [-1,1]){box(g,"bridgeRail",[5,.16,.16],"#62462f",[0,1.15,side*1.48]);for(let i=0;i<6;i++)box(g,"bridgePost",[.16,.8,.16],"#684a32",[-2+i*.8,.92,side*1.48]);}
}
function makeBench(x,z,rotation=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);
 for(let i=0;i<3;i++)box(g,"benchSeat",[2.1,.12,.18],"#8d6543",[0,.65,-.2+i*.2]);
 for(const side of [-1,1]){box(g,"benchLeg",[.13,.62,.15],"#4b4a40",[side*.78,.32,0]);box(g,"benchBack",[.13,.8,.15],"#765239",[side*.78,1,-.48]);}
 box(g,"benchBackrest",[2.1,.14,.16],"#8d6543",[0,1.02,-.48]);
}
function makeCrate(x,z,size=1){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 box(g,"crateBody",[size,.75*size,.75*size],"#8c633f",[0,.38*size,0]);
 for(const y of [.08,.68])box(g,"crateBand",[size+.025,.08,.78*size],"#c0945f",[0,y*size,0]);
 box(g,"crateCrossA",[.09,.7*size,.78*size],"#c0945f",[0,.38*size,0]).rotation.z=.7;
 box(g,"crateCrossB",[.09,.7*size,.78*size],"#c0945f",[0,.38*size,0]).rotation.z=-.7;
}
function makeSignpost(x,z,rotation=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);
 cylinder(g,"signPole",.07,.09,2.1,"#65452f",[0,1.05,0],8);
 box(g,"signBoard",[1.45,.48,.13],"#8a603d",[.48,1.72,0]);
 box(g,"signBoardEdge",[1.5,.06,.15],"#c59b66",[.48,1.98,0]);
}
function makeLookout(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 cylinder(g,"lookoutBase",.2,.2,.5,"#75644d",[0,.25,0],8);
 const deck=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.7,.38,12),mat("#806044"));deck.position.y=.62;deck.castShadow=true;deck.receiveShadow=true;g.add(deck);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;const post=box(g,"lookoutPost",[.14,1.4,.14],"#674a34",[Math.cos(a)*3.15,1.25,Math.sin(a)*3.15]);}
 const rail=new THREE.Mesh(new THREE.TorusGeometry(3.15,.09,6,12),mat("#986d48"));rail.rotation.x=Math.PI/2;rail.position.y=1.85;g.add(rail);
}
function makeCamp(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 const tent=new THREE.Mesh(new THREE.ConeGeometry(2.1,2.5,4),mat("#b8a17a",1));tent.position.set(0,1.25,0);tent.rotation.y=Math.PI/4;tent.scale.set(1,1,.82);tent.castShadow=true;g.add(tent);
 box(g,"tentDoor",[.95,1.3,.08],"#66533c",[0,.67,1.03]);
 const fireRing=new THREE.Mesh(new THREE.TorusGeometry(.75,.13,7,18),mat("#716b60"));fireRing.rotation.x=Math.PI/2;fireRing.position.set(3,.12,1);g.add(fireRing);
 for(let i=0;i<5;i++){const log=cylinder(g,"firewood",.09,.09,1.1,"#69452f",[3,.17,1],7);log.rotation.z=Math.PI/2;log.rotation.y=i*Math.PI/5;}
 for(const side of [-1,1]){const log=box(g,"campLog",[1.5,.25,.32],"#79563a",[side*1.5,.28,1.9]);log.rotation.y=side*.25;}
}
function makeTrainingYard(x,z){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 for(const side of [-1,1]){box(g,"yardPost",[.22,2.4,.22],"#745237",[side*4,1.2,0]);}
 box(g,"yardBeam",[8.2,.2,.22],"#8b6542",[0,2.35,0]);
 for(const x0 of [-2.5,0,2.5]){const target=new THREE.Mesh(new THREE.TorusGeometry(.62,.12,8,24),mat("#c8d1cf",.65));target.position.set(x0,1.5,.2);g.add(target);const center=sphere(g,"targetCenter",.2,"#bd5b4c",[x0,1.5,.23]);}
}

function init3D(){const host=$("gameCanvas");scene=new THREE.Scene();scene.background=new THREE.Color("#a9d3ec");scene.fog=new THREE.Fog("#c3d9d0",38,105);
 camera=new THREE.PerspectiveCamera(65,1,.1,180);renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.replaceChildren(renderer.domElement);
 scene.add(new THREE.HemisphereLight("#e8f5ff","#52664a",1.65));const sun=new THREE.DirectionalLight("#fff0cf",2.65);sun.position.set(-18,28,14);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-42;sun.shadow.camera.right=42;sun.shadow.camera.top=42;sun.shadow.camera.bottom=-42;sun.shadow.bias=-.00018;scene.add(sun);const fillLight=new THREE.DirectionalLight("#a9d5ff",.55);fillLight.position.set(15,10,-18);scene.add(fillLight);
 const terrainGeo=new THREE.PlaneGeometry(150,150,90,90);const pos=terrainGeo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getY(i);pos.setZ(i,Math.sin(x*.11)*.12+Math.cos(z*.13)*.1+Math.sin((x+z)*.07)*.07);}terrainGeo.computeVertexNormals();const grassCanvas=document.createElement("canvas");grassCanvas.width=grassCanvas.height=512;const gc=grassCanvas.getContext("2d");gc.fillStyle="#719d61";gc.fillRect(0,0,512,512);for(let i=0;i<11000;i++){const x=Math.random()*512,y=Math.random()*512;gc.fillStyle=["#638e56","#82a96b","#587f50","#91ad70"][Math.floor(Math.random()*4)];gc.globalAlpha=.18+Math.random()*.3;gc.fillRect(x,y,1+Math.random()*3,1+Math.random()*2);}gc.globalAlpha=1;const grassTex=new THREE.CanvasTexture(grassCanvas);grassTex.wrapS=grassTex.wrapT=THREE.RepeatWrapping;grassTex.repeat.set(18,18);grassTex.colorSpace=THREE.SRGBColorSpace;const ground=new THREE.Mesh(terrainGeo,new THREE.MeshStandardMaterial({map:grassTex,color:"#ffffff",roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 makeTrail([[0,7],[0,1],[0,-5],[0,-12]],5.8);makeTrail([[0,-12],[5,-15],[13,-18],[21,-22]],3.2);makeTrail([[0,-12],[-6,-15],[-14,-18],[-23,-22]],3.2);makeTrail([[0,-12],[6,-8],[14,-3],[22,7],[23,14]],3.1);makeTrail([[0,5],[-7,8],[-15,13],[-22,16]],3.1);makeLake(23,-24,7.2,4.7);const creekBank=new THREE.Mesh(new THREE.PlaneGeometry(5.4,34),mat("#b5a17b",1));creekBank.rotation.x=-Math.PI/2;creekBank.position.set(31,.035,-24);scene.add(creekBank);const creekWater=new THREE.Mesh(new THREE.PlaneGeometry(3.2,34),new THREE.MeshStandardMaterial({color:"#559ca5",roughness:.24,metalness:.1,transparent:true,opacity:.92}));creekWater.rotation.x=-Math.PI/2;creekWater.position.set(31,.075,-24);scene.add(creekWater);makeBridge(31,-24);makeLookout(-24,-22);makeCamp(-23,17);makeTrainingYard(23,16);makeSignpost(5,-14,-.6);makeBench(-5,-8,.2);makeBench(8,-8,-.2);for(const [x,z] of [[-4,-14],[4,-14],[-27,-20],[19,-19],[26,11]])makeCrate(x,z,.8);
 for(let i=0;i<42;i++){const a=i*Math.PI*2/42,r=23+(i%4)*3.2;makeTree(Math.cos(a)*r,Math.sin(a)*r,.8+Math.random()*.65)}for(let i=0;i<28;i++){const a=i*Math.PI*2/28,r=30+(i%3)*3;makePine(Math.cos(a)*r,Math.sin(a)*r,.8+Math.random()*.6)}for(const [x,z,sc] of [[-35,-8,1.2],[35,4,1.3],[-32,28,1.4],[34,-32,1.2],[-10,-38,1.1],[12,38,1.3]])makeHill(x,z,9,4.5,7, "#879b78");
 for(let i=0;i<230;i++){const a=Math.random()*Math.PI*2,r=8+Math.random()*32;const x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<5&&z>-34&&z<3)continue;makeGrassTuft(x,z)}
 for(const [x,z] of [[-9,-5],[9,-5],[-10,7],[10,7],[-4,-20],[5,-22]])makeLamp(x,z);
 for(let i=0;i<38;i++){const a=i*Math.PI/19;const x=Math.cos(a)*(8+Math.random()*5),z=Math.sin(a)*(8+Math.random()*5);makeRock(x,z,.65+Math.random()*.8)}
 for(const side of [-1,1])for(let i=0;i<9;i++){const z=-26+i*3.2;const x=side*13;box(scene,"fencePost",[.18,1.05,.18],"#76533a",[x,.52,z]);if(i<8)box(scene,"fenceRail",[.12,.13,3.15],"#98704a",[x,.72,z+1.55]);}
 makeShop();player=new THREE.Vector3(0,0,5);buildAvatar();clock=new THREE.Clock();
 const resize=()=>{const r=host.getBoundingClientRect();camera.aspect=Math.max(.1,r.width)/Math.max(.1,r.height);camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false)};new ResizeObserver(resize).observe(host);resize();
 renderer.domElement.addEventListener("pointerdown",e=>{renderer.domElement.setPointerCapture(e.pointerId);renderer.domElement.dataset.dragX=e.clientX;renderer.domElement.dataset.dragY=e.clientY;renderer.domElement.dataset.dragging="1"});renderer.domElement.addEventListener("pointermove",e=>{if(renderer.domElement.dataset.dragging!=="1")return;const dx=e.clientX-Number(renderer.domElement.dataset.dragX);const dy=e.clientY-Number(renderer.domElement.dataset.dragY);cameraYaw-=dx*.006;cameraPitch=Math.max(-.05,Math.min(.75,cameraPitch+dy*.003));renderer.domElement.dataset.dragX=e.clientX;renderer.domElement.dataset.dragY=e.clientY});const stop=()=>renderer.domElement.dataset.dragging="0";renderer.domElement.addEventListener("pointerup",stop);renderer.domElement.addEventListener("pointercancel",stop);
 renderer.domElement.addEventListener("wheel",e=>{cameraDistance=Math.max(4.5,Math.min(11,cameraDistance+e.deltaY*.008));e.preventDefault()},{passive:false});
}
function updateCamera(){const target=new THREE.Vector3(player.x,1.65,player.z);const offset=new THREE.Vector3(Math.sin(cameraYaw)*cameraDistance,2.1+cameraPitch*4,Math.cos(cameraYaw)*cameraDistance);camera.position.copy(target).add(offset);camera.lookAt(target)}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),forward=new THREE.Vector3(-Math.sin(cameraYaw),0,-Math.cos(cameraYaw)),right=new THREE.Vector3(Math.cos(cameraYaw),0,-Math.sin(cameraYaw)),move=new THREE.Vector3();if(keys.KeyW||keys.ArrowUp)move.add(forward);if(keys.KeyS||keys.ArrowDown)move.sub(forward);if(keys.KeyD||keys.ArrowRight)move.add(right);if(keys.KeyA||keys.ArrowLeft)move.sub(right);const moving=move.lengthSq()>0;if(moving){move.normalize();const speed=(5+upgrades.speed*1.15)*((keys.ShiftLeft||keys.ShiftRight)?1.45:1);player.addScaledVector(move,speed*dt);player.x=THREE.MathUtils.clamp(player.x,-35,35);player.z=THREE.MathUtils.clamp(player.z,-35,35);avatarRoot.rotation.y=Math.atan2(move.x,move.z);avatarRoot.userData.walk=(avatarRoot.userData.walk||0)+dt*10}
 const t=avatarRoot.userData.walk||0;bodyParts.legL.rotation.x=moving?Math.sin(t)*.75:0;bodyParts.legR.rotation.x=moving?-Math.sin(t)*.75:0;bodyParts.armL.rotation.x=moving?-Math.sin(t)*.58:Math.sin(performance.now()*.001)*.025;bodyParts.armR.rotation.x=moving?Math.sin(t)*.58:-Math.sin(performance.now()*.001)*.025;avatarRoot.position.set(player.x,0,player.z);
 if(nearShop!== (Math.hypot(player.x-shopPosition.x,player.z-shopPosition.z)<5.5)){nearShop=!nearShop;$("shopPrompt").classList.toggle("hidden",!nearShop)}
 updateCamera();renderer.render(scene,camera)}
function renderInventory(){const counts=new Map();inventory.forEach(id=>counts.set(id,(counts.get(id)||0)+1));$("inventoryCount").textContent=inventory.length+" PARTS";$("inventory").innerHTML=[...counts].map(([id,count])=>{const p=part(id),on=equipped[p.slot]===id;return '<div class="part-item"><span class="part-icon">'+p.icon+'</span><div class="part-info"><b>'+p.name+(count>1?" ×"+count:"")+'</b><small>'+p.rarity+' · '+p.slot+'</small></div><button class="equip-button" data-equip="'+id+'">'+(on?"ON":"EQUIP")+'</button></div>'}).join("")||'<div class="empty-state">Roll to find your first part!</div>';$("inventory").querySelectorAll("[data-equip]").forEach(b=>b.onclick=()=>equip(b.dataset.equip));$("equipped").innerHTML=["Head","Torso","Arms","Legs"].map(slot=>{const p=part(equipped[slot]);return '<div class="equip-slot"><span class="slot-icon">'+p.icon+'</span><b>'+slot+'</b><span>'+p.name+'</span></div>'}).join("")}
function equip(id){if(!inventory.includes(id))return;equipped[part(id).slot]=id;updateStats();updateAvatarParts();renderInventory();persist();notify(part(id).name+" equipped!")}
const upgradeInfo=[{id:"speed",name:"Sprint Boots",icon:"👟",description:"+1.5 movement speed per level",base:100,max:3},{id:"luck",name:"Lucky Charm",icon:"🍀",description:"+25% rare-part roll weight per level",base:150,max:3},{id:"coins",name:"Coin Multiplier",icon:"💰",description:"+25% coins per second per level",base:200,max:3}];
function renderShop(){$("shopItems").innerHTML=upgradeInfo.map(u=>{const level=upgrades[u.id],price=u.base*(level+1),maxed=level>=u.max;return '<div class="shop-item"><span class="shop-icon">'+u.icon+'</span><div class="shop-copy"><b>'+u.name+' · Lv. '+level+'</b><small>'+u.description+'</small></div><button class="buy-button" data-upgrade="'+u.id+'" '+(maxed?"disabled":"")+'>'+(maxed?"MAX LEVEL":price+" COINS")+'</button></div>'}).join("");$("shopItems").querySelectorAll("[data-upgrade]").forEach(b=>b.onclick=()=>buyUpgrade(b.dataset.upgrade))}
function buyUpgrade(id){const u=upgradeInfo.find(x=>x.id===id);if(!u)return;const level=upgrades[id],price=u.base*(level+1);if(level>=u.max)return notify("That upgrade is already maxed!");if(money<price)return notify("Not enough coins yet!");money-=price;upgrades[id]++;updateStats();renderShop();persist();notify(u.name+" upgraded to level "+upgrades[id]+"!")}
function roll(){if(rollBusy)return;rollBusy=true;const button=$("rollButton"),result=$("result"),flash=$("rarityFlash");button.disabled=true;button.classList.add("rolling");let ticks=0;const timer=setInterval(()=>{const preview=parts[Math.floor(Math.random()*parts.length)];result.className="roll-result rolling-result";result.textContent="✦ "+preview.icon+" "+preview.name+" ✦";if(++ticks>=10){clearInterval(timer);const weightOf=p=>p.weight*(p.rarity==="Common"?1:1+upgrades.luck*.25),total=parts.reduce((n,p)=>n+weightOf(p),0);let r=Math.random()*total,pick=parts[0];for(const p of parts){r-=weightOf(p);if(r<=0){pick=p;break}}inventory.push(pick.id);if(!equipped[pick.slot])equipped[pick.slot]=pick.id;questProgress++;const completed=questProgress>=5;if(completed){money+=250;questProgress=0}result.className="roll-result rarity-"+pick.rarity.toLowerCase();result.textContent=pick.icon+" "+pick.name+" — "+pick.rarity;updateStats();updateAvatarParts();renderInventory();updateQuest();persist();if(pick.rarity!=="Common"){flash.className="rarity-flash "+pick.rarity.toLowerCase();setTimeout(()=>flash.className="rarity-flash",650)}notify(completed?"QUEST COMPLETE! +250 coins":"You rolled "+pick.name+"!");button.disabled=false;button.classList.remove("rolling");rollBusy=false}},100)}
$("rollButton").onclick=roll;$("openInventory").onclick=()=>$("inventoryModal").classList.remove("hidden");document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>$(b.dataset.close).classList.add("hidden"));document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.add("hidden")}));
$("shopModal").classList.add("hidden");document.addEventListener("keydown",e=>{keys[e.code]=true;if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code))e.preventDefault();if(e.code==="KeyE"&&nearShop){$("shopModal").classList.remove("hidden");renderShop()}});document.addEventListener("keyup",e=>keys[e.code]=false);window.addEventListener("blur",()=>Object.keys(keys).forEach(k=>keys[k]=false));
try{init3D();renderShop();renderInventory();updateStats();updateQuest();notify("3D world loaded! WASD to move · drag to orbit camera · walk to the shop and press E.");setInterval(()=>{if(income>0){money+=income;updateStats();persist()}},1000);animate()}catch(err){console.error(err);notify("3D graphics could not start. Try refreshing or using Chrome.")}