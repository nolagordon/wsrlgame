Game.ALL_ENTITIES = {};
Game.EntityGenerator = new Game.Generator('entities',Game.Entity);
Game.EntityGenerator.learn({
  name: 'avatar',
  description: 'our Hero!',
  chr:'\u2744',
  fg:'#2457c5',
  sightRadius: 5,
  maxHp: 10,
  attackAvoid: 1,
  attackDamage: 2,
  inventoryCapacity: 35,
  maxFood: 400,
  mixins: ["PlayerActor", "PlayerMessager", "WalkerCorporeal", "Sight", "MapMemory", "HitPoints", "Chronicle", "MeleeAttacker", "MeleeDefender","InventoryHolder","FoodConsumer", "MoneyHolder"]
});

Game.EntityGenerator.learn({
  name: 'ice',
  description: 'A large ground-covering patch of frozen water',
  chr:'%',
  fg:'#fff',
  maxHp: 1,
  mixins: ["HitPoints"]
});

Game.EntityGenerator.learn({
  name: 'vanilla scoop',
  description: 'A classic scoop of vanilla ice cream. ',
  chr:'O',
  fg:'#fff',
  maxHp: 2,
  items: [{itemName: 'vanilla ice cream', dropRate: 0.5}],
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal", "ItemDropper"]
});

Game.EntityGenerator.learn({
  name: 'strawberry scoop',
  description: "A scoop of strawberry ice cream that will attack if you get in its way",
  chr:'O',
  fg:'#ee9dda',
  maxHp: 2,
  attackPower: 1,
  attackAvoid: 2,
  damageMitigation: 1,
  items: [{itemName: 'strawberry ice cream', dropRate: 0.35}],
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal", "MeleeAttacker","MeleeDefender", "ItemDropper"]

});

Game.EntityGenerator.learn({
  name: 'chocolate scoop',
  description: 'Beware the rage of this highly trained scoop of chocolate ice cream',
  chr:'O',
  fg:'#86592d',
  maxHp: 4,
  sightRadius: 4,
  attackPower: 1,
  wanderChaserActionDuration: 1200,
  attackActionDuration: 3000,
  items: [{itemName: 'chocolate ice cream', dropRate: 0.2}],
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker", "ItemDropper"]
});
