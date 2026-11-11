import * as THREE from "three";

const $ = (id) => document.getElementById(id);
const SAVE_KEY = "bodyPartRngSaveV2";

const partCatalog = [
  { id:"starter-head", name:"Starter Head", slot:"Head", rarity:"Common", weight:38, price:0, income:1, health:0, power:0, color:0xf1c7a0, icon:"🙂", shape:"box" },
  { id:"robot-head", name:"Robot Head", slot:"Head", rarity:"Rare", weight:14, price:85, income:4, health:10, power:2, color:0x8da9c7, icon:"🤖", shape:"box" },
  { id:"crown-head", name:"Royal Crown", slot:"Head", rarity:"Epic", weight:5, price:240, income:12, health:20, power:5, color:0xf4c64e, icon:"👑", shape:"crown" },
  { id:"starter-torso", name:"Starter Torso", slot:"Torso", rarity:"Common", weight:38, price:0, income:1, health:0, power:0, color:0x3978d4, icon:"🟦", shape:"box" },
  { id:"rock-torso", name:"Stone Torso", slot:"Torso", rarity:"Rare", weight:14, price:110, income:5, health:35, power:1, color:0x8794a7, icon:"🪨", shape:"stone" },
  { id:"neon-torso", name:"Neon Core", slot:"Torso", rarity:"Epic", weight:5, price:280, income:15, health:45, power:6, color:0x31d8d0, icon:"💠", shape:"neon" },
  { id:"starter-arms", name:"Starter Arms", slot:"Arms", rarity:"Common", weight:38, price:0, income:1, health:0, power:0, color:0xf1c7a0, icon:"💪", shape:"box" },
  { id:"steel-arms", name:"Steel Arms", slot:"Arms", rarity:"Rare", weight:14, price:130, income:5, health:20, power:8, color:0x9daec2, icon:"🦾", shape:"metal" },
  { id:"crystal-arms", name:"Crystal Arms", slot:"Arms", rarity:"Epic", weight:5, price:320, income:18, health:25, power:14, color:0x9c7bff, icon:"🔮", shape:"crystal" },
  { id:"starter-legs", name:"Starter Legs", slot:"Legs", rarity:"Common", weight:38, price:0, income:1, health:0, power:0, color:0x253d68, icon:"👖", shape:"box" },
  { id:"runner-legs", name:"Runner Legs", slot:"Legs", rarity:"Rare", weight:14, price:150, income:7, health:10, power:4, color:0x45b78b, icon:"🏃", shape:"box" },
  { id:"rocket-legs", name:"Rocket Legs", slot:"Legs", rarity:"Epic", weight:5, price:360, income:22, health:15, power:10, color:0xff875e, icon:"🚀", shape:"rocket" }
];

const defaultSave = () => ({
  money: 100,
  inventory: ["starter-head","starter-torso","starter-arms","starter-legs"],
  equipped: { Head:"starter-head", Torso:"starter-torso", Arms:"starter-arms", Legs:"starter-legs" }
});

let save = loadSave();
let money = save.money;
let inventory = save.inventory;
let equipped = save.equipped;
let health = 100;
let damage = 10;
let income = 1;
let toastTimer;

function loadSave() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!parsed || !Array.isArray(parsed.inventory) || !parsed.equipped) return defaultSave();
    return parsed;
  } catch { return defaultSave(); }
}
function persist() {
  save = { money, inventory, equipped };
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}
function partById(id) { return partCatalog.find(p => p.id === id) || partCatalog[0]; }
function calculateStats() {
  const parts = Object.values(equipped).filter(Boolean).map(partById);
  income = 1 + parts.reduce((n,p) => n + p.income, 0);
  health = 100 + parts.reduce((n,p) => n + p.health, 0);
  damage = 10 + parts.reduce((n,p) => n + p.power, 0);
}
function updateStats() {
  calculateStats();
  $("money").textContent = Math.floor(money).toLocaleString();
  $("health").textContent = health;
  const fill = $("healthFill");
  if (fill) fill.style.width = "100%";
  $("damage").textContent = damage;
  $("income").textContent = income;
}
function rarityClass(rarity) { return rarity.toLowerCase(); }

function renderInventory() {
  const counts = new Map();
  inventory.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
  const entries = [...counts.entries()].map(([id,count]) => ({part:partById(id),count}));
  $("inventoryCount").textContent = inventory.length + " PARTS";
  $("inventory").innerHTML = entries.length ? entries.map(({part,count}) => {
    const isEquipped = equipped[part.slot] === part.id;
    return `<div class="part-item">
      <span class="part-icon">${part.icon}</span>
      <div class="part-info"><b>${part.name}${count > 1 ? " ×"+count : ""}</b><small class="${rarityClass(part.rarity)}">${part.rarity} · ${part.slot}</small></div>
      <button class="equip-button" data-equip="${part.id}">${isEquipped ? "ON" : "EQUIP"}</button>
    </div>`;
  }).join("") : '<div class="empty-state">No parts yet. Try your first roll!</div>';
  $("inventory").querySelectorAll("[data-equip]").forEach(button => {
    button.addEventListener("click", () => equipPart(button.dataset.equip));
  });
  const slots = ["Head","Torso","Arms","Legs"];
  $("equipped").innerHTML = slots.map(slot => {
    const part = partById(equipped[slot]);
    return `<div class="equip-slot"><span class="slot-icon">${part.icon}</span><b>${slot}</b><span>${part.name}</span></div>`;
  }).join("");
}
function equipPart(id) {
  const part = partById(id);
  if (!inventory.includes(id)) return;
  equipped[part.slot] = id;
  updateAvatar();
  updateStats();
  renderInventory();
  persist();
  notify(part.name + " equipped!");
}
function rollPart() {
  const total = partCatalog.reduce((sum,p) => sum + p.weight, 0);
  let pick = Math.random() * total;
  let selected = partCatalog[0];
  for (const part of partCatalog) {
    pick -= part.weight;
    if (pick <= 0) { selected = part; break; }
  }
  inventory.push(selected.id);
  $("result").textContent = selected.icon + "  " + selected.name + " — " + selected.rarity;
  if (!equipped[selected.slot]) equipped[selected.slot] = selected.id;
  renderInventory();
  updateStats();
  updateAvatar();
  persist();
  notify("You rolled " + selected.name + "!");
}
$("rollButton").addEventListener("click", rollPart);
$("openShop").addEventListener("click", () => $("shopModal").classList.remove("hidden"));
$("openInventory").addEventListener("click", () => $("inventoryModal").classList.remove("hidden"));
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", () => $(button.dataset.close).classList.add("hidden")));
document.querySelectorAll(".modal").forEach(modal => modal.addEventListener("click", event => { if (event.target === modal) modal.classList.add("hidden"); }));

function renderShop() {
  const shopIds = ["robot-head","crown-head","rock-torso","neon-torso","steel-arms","crystal-arms","runner-legs","rocket-legs"];
  $("shopItems").innerHTML = shopIds.map(id => {
    const p = partById(id);
    const owned = inventory.includes(id);
    return `<div class="shop-item"><span class="shop-icon">${p.icon}</span><div class="shop-copy"><b>${p.name}</b><small class="${rarityClass(p.rarity)}">${p.rarity} · +${p.income} coins/sec · +${p.health} HP</small></div><button class="buy-button" data-buy="${id}" ${owned ? "disabled" : ""}>${owned ? "OWNED" : p.price+" COINS"}</button></div>`;
  }).join("");
  $("shopItems").querySelectorAll("[data-buy]").forEach(button => {
    button.addEventListener("click", () => buyPart(button.dataset.buy));
  });
}
function buyPart(id) {
  const part = partById(id);
  if (inventory.includes(id)) { notify("You already own this part!"); return; }
  if (money < part.price) { notify("Not enough coins! Keep earning and try again."); return; }
  money -= part.price;
  inventory.push(id);
  if (!equipped[part.slot]) equipped[part.slot] = id;
  updateStats();
  renderInventory();
  updateAvatar();
  persist();
  renderShop();
  notify("Bought " + part.name + "! Equip it from your bag.");
}

const mount = $("gameCanvas");
let scene, camera, renderer, avatar, avatarParts = {}, clock, cameraTarget;
let moveForward = false, moveBack = false, moveLeft = false, moveRight = false;
let jumping = false, velocityY = 0, isRunning = false;
const keys = {};
const worldObjects = [];
const groundY = 0;
const playerPosition = new THREE.Vector3(0, 0, 3);
const cameraOffset = new THREE.Vector3(0, 5.1, 8.2);

function material(color, roughness=0.78, metalness=0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
function block(parent, name, size, position, color, matOptions={}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color, matOptions.roughness ?? .78, matOptions.metalness ?? 0));
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function createAvatar() {
  avatar = new THREE.Group();
  scene.add(avatar);
  avatarParts.head = new THREE.Group();
  avatarParts.torso = new THREE.Group();
  avatarParts.arms = new THREE.Group();
  avatarParts.legs = new THREE.Group();
  avatar.add(avatarParts.head, avatarParts.torso, avatarParts.arms, avatarParts.legs);
  updateAvatar();
}
function updateAvatar() {
  if (!avatar) return;
  Object.values(avatarParts).forEach(group => {
    while (group.children.length) {
      const child = group.children.pop();
      child.geometry?.dispose();
      if (Array.isArray(child.material)) child.material.forEach(m=>m.dispose()); else child.material?.dispose();
      group.remove(child);
    }
  });
  const head = partById(equipped.Head);
  const torso = partById(equipped.Torso);
  const arms = partById(equipped.Arms);
  const legs = partById(equipped.Legs);

  const headMesh = block(avatarParts.head, "head", [.9,.9,.9], [0,2.55,0], head.color);
  if (head.shape === "crown") {
    block(avatarParts.head, "crown-base", [.95,.18,.95], [0,3.05,0], 0xf4c64e, {metalness:.6});
    for (let i=0;i<3;i++) block(avatarParts.head,"crown-point",[.17,.35,.17],[-.3+i*.3,3.28,0],0xffe28a,{metalness:.55});
  }
  if (head.id === "robot-head") headMesh.material.metalness=.65;
  // Simple face, always attached to the front of the head.
  const eyeMat = new THREE.MeshStandardMaterial({color:0x17243a,roughness:.35});
  for (const x of [-.19,.19]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(.09,.1,.035), eyeMat);
    eye.position.set(x,2.62,.46); avatarParts.head.add(eye);
  }
  block(avatarParts.torso,"torso",[1.15,1.2,.62],[0,1.48,0],torso.color,{metalness:torso.shape==="neon"?.45:0});
  if (torso.shape === "neon") {
    const core = new THREE.Mesh(new THREE.BoxGeometry(.36,.36,.08),new THREE.MeshStandardMaterial({color:0xc8ffff,emissive:0x21cbd0,emissiveIntensity:1.4}));
    core.position.set(0,1.5,.36); avatarParts.torso.add(core);
  }
  for (const side of [-1,1]) {
    const arm = block(avatarParts.arms,"arm",[.38,1.05,.42],[side*.82,1.52,0],arms.color,{metalness:arms.shape==="metal"?.65:0});
    arm.userData.side = side;
    if (arms.shape==="crystal") {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.29),material(arms.color,.25,.25));
      crystal.position.set(side*.82,1.52,0); avatarParts.arms.add(crystal);
    }
    block(avatarParts.legs,"leg",[.48,1.05,.48],[side*.3,.53,0],legs.color,{metalness:legs.shape==="rocket"?.45:0});
    if (legs.shape==="rocket") {
      const thruster = new THREE.Mesh(new THREE.ConeGeometry(.19,.35,8),material(0xffb35c,.4,.25));
      thruster.rotation.x=Math.PI; thruster.position.set(side*.3,.02,0); avatarParts.legs.add(thruster);
    }
  }
  avatarParts.head.position.y=0;
}
function addWorld() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100,100),material(0x243d5a));
  floor.rotation.x=-Math.PI/2; floor.position.y=-.08; floor.receiveShadow=true; scene.add(floor);
  const grid = new THREE.GridHelper(100,50,0x466486,0x324c6a); grid.position.y=-.06; scene.add(grid);
  // A small, colorful plaza gives the avatar landmarks to walk around.
  const platform = new THREE.Mesh(new THREE.CylinderGeometry(5.4,5.4,.28,48),material(0x345678));
  platform.position.set(0,.02,0); platform.receiveShadow=true; platform.castShadow=true; scene.add(platform);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.1,.07,8,64),new THREE.MeshStandardMaterial({color:0x64b5ff,emissive:0x164b86}));
  ring.rotation.x=Math.PI/2; ring.position.y=.19; scene.add(ring);
  for (let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    const x=Math.cos(a)*9,z=Math.sin(a)*9;
    const base=block(scene,"plaza-pillar",[1.1,2.2,1.1],[x,1.1,z],i%2?0x355c82:0x426e96);
    const cap=block(scene,"pillar-cap",[1.35,.18,1.35],[x,2.3,z],0x75a8d7);
    worldObjects.push(base,cap);
  }
  for (let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    const x=Math.cos(a)*16,z=Math.sin(a)*16;
    const trunk=block(scene,"tree-trunk",[.45,1.7,.45],[x,.85,z],0x79543b);
    const leaves=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,1),material(0x3f9b75));
    leaves.position.set(x,2.15,z); leaves.castShadow=true; scene.add(leaves);
    worldObjects.push(trunk,leaves);
  }
  // Decorative raised pads.
  for (let i=0;i<4;i++) {
    const pad=block(scene,"display-pad",[2.4,.25,2.4],[Math.cos(i*Math.PI/2)*7,.08,Math.sin(i*Math.PI/2)*7],0x263d5a);
    worldObjects.push(pad);
  }
}
function init3D() {
  // Wait until the full-screen game container has been laid out before creating WebGL.
  requestAnimationFrame(() => start3D());
}
function start3D() {
  try {
    const width = Math.max(mount.clientWidth, window.innerWidth);
    const height = Math.max(mount.clientHeight, window.innerHeight);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9bc4e8);
    scene.fog = new THREE.Fog(0x9bc4e8,28,65);
    camera = new THREE.PerspectiveCamera(65, width/height,.1,150);
    renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));
    renderer.setSize(width,height);
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.zIndex = "0";
    mount.appendChild(renderer.domElement);
    const hemi=new THREE.HemisphereLight(0xe4f4ff,0x52627c,2.1); scene.add(hemi);
    const sun=new THREE.DirectionalLight(0xffffff,2.4); sun.position.set(-8,16,9); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);
    addWorld();
    createAvatar();
    camera.position.copy(playerPosition).add(cameraOffset);
    camera.lookAt(0,1.25,0);
    clock=new THREE.Clock();
    window.addEventListener("resize",resize3D);
    if (window.ResizeObserver) new ResizeObserver(resize3D).observe(mount);
    renderer.domElement.addEventListener("click",()=>renderer.domElement.focus());
    animate();
  } catch (error) {
    console.error(error);
    mount.innerHTML='<div style="position:absolute;inset:0;display:grid;place-items:center;padding:30px;text-align:center;color:white;background:linear-gradient(145deg,#294d72,#101e33);font:700 15px Inter">3D world could not start. Refresh the page. If this message stays, your browser may have WebGL disabled.</div>';
  }
}
function resize3D() {
  if (!renderer || !camera) return;
  const w=Math.max(mount.clientWidth,window.innerWidth),h=Math.max(mount.clientHeight,window.innerHeight);
  camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h);
}
function animate() {
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  if (avatar) {
    const direction=new THREE.Vector3();
    if (keys.KeyW||keys.ArrowUp) direction.z-=1;
    if (keys.KeyS||keys.ArrowDown) direction.z+=1;
    if (keys.KeyA||keys.ArrowLeft) direction.x-=1;
    if (keys.KeyD||keys.ArrowRight) direction.x+=1;
    if (direction.lengthSq()>0) {
      direction.normalize();
      const speed=(keys.ShiftLeft||keys.ShiftRight)?8.4:5.4;
      playerPosition.addScaledVector(direction,speed*dt);
      playerPosition.x=THREE.MathUtils.clamp(playerPosition.x,-23,23);
      playerPosition.z=THREE.MathUtils.clamp(playerPosition.z,-23,23);
      avatar.rotation.y=Math.atan2(direction.x,direction.z);
      avatarParts.arms.rotation.x=Math.sin(performance.now()*.012)*.12;
      avatarParts.legs.rotation.x=Math.sin(performance.now()*.012)*.2;
    } else {
      avatarParts.arms.rotation.x=THREE.MathUtils.damp(avatarParts.arms.rotation.x,0,8,dt);
      avatarParts.legs.rotation.x=THREE.MathUtils.damp(avatarParts.legs.rotation.x,0,8,dt);
    }
    if ((keys.Space||keys.KeyJ) && !jumping) { velocityY=7.2; jumping=true; }
    velocityY-=18*dt;
    playerPosition.y+=velocityY*dt;
    if (playerPosition.y<=groundY) { playerPosition.y=groundY; velocityY=0; jumping=false; }
    avatar.position.copy(playerPosition);
    const target=playerPosition.clone().add(new THREE.Vector3(0,1.1,0));
    const desired=playerPosition.clone().add(cameraOffset);
    camera.position.lerp(desired,1-Math.pow(.001,dt));
    camera.lookAt(target);
  }
  renderer.render(scene,camera);
}
window.addEventListener("keydown",e=>{
  keys[e.code]=true;
  if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup",e=>{keys[e.code]=false;});
window.addEventListener("blur",()=>Object.keys(keys).forEach(k=>keys[k]=false));

let lastIncomeTick=Date.now();
setInterval(()=>{
  money+=income;
  updateStats();
  persist();
},1000);

renderShop();
renderInventory();
updateStats();
init3D();
notify("WASD to move · Space to jump · Shift to run");
