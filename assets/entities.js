Game.ALL_ENTITIES = {};
Game.EntityGenerator = new Game.Generator('entities',Game.Entity);
Game.EntityGenerator.learn({
  name: 'avatar',
  description: 'our Hero!',
  chr:'\u2744',
  fg:'#2457c5',
  sightRadius: 5,
  maxHp: 25,
  attackAvoid: 1,
  attackDamage: 2,
  inventoryCapacity: 35,
  maxFood: 400,
  mixins: ["PlayerActor", "PlayerMessager", "WalkerCorporeal", "Sight", "MapMemory", "HitPoints", "Chronicle", "MeleeAttacker", "MeleeDefender","InventoryHolder","FoodConsumer", "MoneyHolder"]
});

Game.EntityGenerator.learn({
  name: 'shop',
  description: 'You could buy all sorts of stuff here - for the right price',
  chr: 'S',
  fg: '#9933ff',
  mixins: ["Shopkeeper"]
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
  amountToDrop: 5,
  items: [{itemName: 'vanilla ice cream', dropRate: 0.5}],
  mergesWith: [{monster:'chocolate scoop', becomes:'vanilla chocolate swirl scoop'},{monster:'vanilla scoop', becomes:'vanilla double scoop'}],
  mixins: ["HitPoints", "WalkerCorporeal", "MergerActor", "WanderActor", "ItemDropper", "MoneyDropper"]
});

Game.EntityGenerator.learn({
  name: 'vanilla double scoop',
  chr:'8',
  fg:'#fff',
  maxHp: 4,
  mergesWith: [],
  amountToDrop: 10,
  items: [{itemName: 'vanilla ice cream', dropRate: 0.9}],
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal", "ItemDropper", "MoneyDropper"]
});

Game.EntityGenerator.learn({
  name: 'strawberry scoop',
  description: "A scoop of strawberry ice cream that will attack if you get in its way",
  chr:'O',
  fg:'#ee9dda',
  maxHp: 2,
  mergesWith: [{monster:'strawberry scoop', becomes:'strawberry double scoop'},{monster:'vanilla chocolate swirl scoop', becomes:'Neopolitan scoop'}],
  attackPower: 1,
  attackAvoid: 2,
  damageMitigation: 1,
  amountToDrop: 20,
  items: [{itemName: 'strawberry ice cream', dropRate: 0.35}],
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal", "MeleeAttacker","MeleeDefender", "ItemDropper", "MoneyDropper", "MergerActor"]

});

Game.EntityGenerator.learn({
  name: 'strawberry double scoop',
  chr:'8',
  fg:'#ee9dda',
  maxHp: 4,
  mergesWith: [],
  attackPower: 2,
  attackAvoid: 2,
  damageMitigation: 1,
  amountToDrop: 30,
  items: [{itemName: 'strawberry ice cream', dropRate: 0.7}],
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal", "MeleeAttacker","MeleeDefender", "ItemDropper", "MoneyDropper"]

});

Game.EntityGenerator.learn({
  name: 'chocolate scoop',
  description: 'Beware the rage of this highly trained scoop of chocolate ice cream',
  chr:'O',
  fg:'#86592d',
  maxHp: 4,
  mergesWith: [{monster:'vanilla scoop', becomes:'vanilla chocolate swirl scoop'}, {monster:'chocolate scoop', becomes:'chocolate double scoop'} ],
  sightRadius: 4,
  attackPower: 1,
  wanderChaserActionDuration: 1200,
  attackActionDuration: 3000,
  amountToDrop: 10,
  items: [{itemName: 'chocolate ice cream', dropRate: 0.2}],
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker", "ItemDropper", "MoneyDropper", "MergerActor"]
});

Game.EntityGenerator.learn({
  name: 'chocolate double scoop',
  chr:'8',
  fg:'#86592d',
  maxHp: 4,
  sightRadius: 4,
  attackPower: 1,
  wanderChaserActionDuration: 1200,
  attackActionDuration: 3000,
  amountToDrop: 20,
  items: [{itemName: 'chocolate ice cream', dropRate: 0.4}],
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker", "WanderActor", "ItemDropper", "MoneyDropper"]
});

Game.EntityGenerator.learn({
  name: 'vanilla chocolate swirl scoop',
  chr:'8',
  fg:'#c68c53',
  maxHp: 6,
  mergesWith: [{monster:'strawberry scoop', becomes:'Neopolitan scoop'}],
  sightRadius: 4,
  attackPower: 1,
  wanderChaserActionDuration: 1200,
  attackActionDuration: 3000,
  amountToDrop: 25,
  items: [{itemName: 'chocolate ice cream', dropRate: 0.3},{itemName: 'vanilla ice cream', dropRate: 0.3}],
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker", "MergerActor", "ItemDropper", "MoneyDropper"]
});

Game.EntityGenerator.learn({
  name: 'Neopolitan scoop',
  chr:'N',
  fg:'#bf4040',
  maxHp: 6,
  mergesWith: [],
  sightRadius: 4,
  attackPower: 2,
  attackAvoid: 2,
  damageMitigation: 1,
  wanderChaserActionDuration: 1200,
  attackActionDuration: 3000,
  amountToDrop: 40,
  items: [{itemName: 'chocolate ice cream', dropRate: 0.4},{itemName: 'vanilla ice cream', dropRate: 0.4},{itemName: 'strawberry ice cream', dropRate: 0.4}],
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker", "MeleeDefender", "ItemDropper", "MoneyDropper"]
});
