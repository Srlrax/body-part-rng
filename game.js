
let money = 0;
let health = 100;
let damage = 10;
let income = 1;

let inventory = [];

const bodyParts = [
  { name: "Basic Head", rarity: "Common", chance: 2, income: 1, health: 10, damage: 1 },
  { name: "Strong Arms", rarity: "Uncommon", chance: 5, income: 3, health: 20, damage: 5 },
  { name: "Golden Legs", rarity: "Rare", chance: 15, income: 15, health: 50, damage: 10 },
  { name: "Crystal Torso", rarity: "Epic", chance: 50, income: 50, health: 200, damage: 20 },
  { name: "Dragon Head", rarity: "Legendary", chance: 150, income: 200, health: 500, damage: 50 },
  { name: "Void Body", rarity: "Mythical", chance: 500, income: 1000, health: 2000, damage: 100 }
];

function updateStats() {
  document.getElementById("money").textContent = Math.floor(money);
  document.getElementById("health").textContent = health;
  document.getElementById("damage").textContent = damage;
  document.getElementById("income").textContent = income;
}

function rollPart() {
  const totalWeight = bodyParts.reduce(
    (sum, part) => sum + 1 / part.chance, 0
  );

  let random = Math.random() * totalWeight;
  let selected = bodyParts[0];

  for (const part of bodyParts) {
    random -= 1 / part.chance;
    if (random <= 0) {
      selected = part;
      break;
    }
  }

  inventory.push(selected);
  money += selected.income;
  income += selected.income;
  health += selected.health;
  damage += selected.damage;

  document.getElementById("result").textContent =
    selected.name + " - " + selected.rarity + "!";

  document.getElementById("inventory").innerHTML =
    inventory.map(part =>
      `<div class="part">${part.name} - ${part.rarity}</div>`
    ).join("");

  document.getElementById("equipped").textContent =
    inventory.length + " parts collected";

  updateStats();
}

document.getElementById("rollButton").addEventListener("click", rollPart);

setInterval(() => {
  money += income;
  updateStats();
}, 1000);

updateStats();
