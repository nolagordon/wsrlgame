Game.ALL_ENTITIES = {};
Game.EntityGenerator = new Game.Generator('entities',Game.Entity);
Game.EntityGenerator.learn({
  name: 'avatar',
  chr:'\u2744',
  fg:'#2457c5',
  sightRadius: 5,
  maxHp: 10,
  attackAvoid: 1,
  attackDamage: 2,
  inventoryCapacity: 35,
  mixins: ["PlayerActor", "PlayerMessager", "WalkerCorporeal", "Sight", "MapMemory", "HitPoints", "Hunger", "Chronicle", "MeleeAttacker", "MeleeDefender", "InventoryHolder"]
});

Game.EntityGenerator.learn({
  name: 'ice',
  chr:'%',
  fg:'#fff',
  maxHp: 1,
  mixins: ["HitPoints"]
});

Game.EntityGenerator.learn({
  name: 'vanilla scoop',
  chr:'O',
  fg:'#fff',
  maxHp: 2,
  mergesWith: [{monster:'chocolate scoop', becomes:'vanilla chocolate swirl scoop'},{monster:'vanilla scoop', becomes:'vanilla double scoop'}],
  mixins: ["HitPoints", "WalkerCorporeal", "MergerActor", "WanderActor"]
});

Game.EntityGenerator.learn({
  name: 'vanilla double scoop',
  chr:'8',
  fg:'#fff',
  maxHp: 4,
  mergesWith: [],
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal"]
});

Game.EntityGenerator.learn({
  name: 'strawberry scoop',
  chr:'O',
  fg:'#ee9dda',
  maxHp: 2,
  mergesWith: [{monster:'strawberry scoop', becomes:'strawberry double scoop'}],
  attackPower: 1,
  attackAvoid: 2,
  damageMitigation: 1,
  mixins: ["HitPoints", "WanderActor", "MergerActor", "WalkerCorporeal", "MeleeAttacker","MeleeDefender"]

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
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal", "MeleeAttacker","MeleeDefender"]

});

Game.EntityGenerator.learn({
  name: 'chocolate scoop',
  chr:'O',
  fg:'#86592d',
  maxHp: 4,
  mergesWith: [{monster:'vanilla scoop', becomes:'vanilla chocolate swirl scoop'}, {monster:'chocolate scoop', becomes:'chocolate double scoop'} ],
  sightRadius: 4,
  attackPower: 1,
  wanderChaserActionDuration: 1200,
  attackActionDuration: 3000,
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker", "WanderActor", "MergerActor"]
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
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker", "WanderActor"]
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
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker", "MergerActor"]
});

Game.EntityGenerator.learn({
  name: 'Neopolitan scoop',
  chr:'N',
  fg:'#bf4040',
  maxHp: 6,
  mergesWith: [],
  sightRadius: 4,
  attackPower: 1,
  wanderChaserActionDuration: 1200,
  attackActionDuration: 3000,
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker"]
});
