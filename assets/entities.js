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
  mixins: ["PlayerActor", "PlayerMessager", "WalkerCorporeal", "Sight", "MapMemory", "HitPoints", "Hunger", "Chronicle", "MeleeAttacker", "MeleeDefender"]
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
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal"]
});

Game.EntityGenerator.learn({
  name: 'strawberry scoop',
  chr:'O',
  fg:'#ee9dda',
  maxHp: 2,
  attackPower: 1,
  attackAvoid: 2,
  damageMitigation: 1,
  mixins: ["HitPoints", "WanderActor", "WalkerCorporeal", "MeleeAttacker","MeleeDefender"]

});

Game.EntityGenerator.learn({
  name: 'chocolate scoop',
  chr:'O',
  fg:'#86592d',
  maxHp: 4,
  sightRadius: 4,
  attackPower: 1,
  wanderChaserActionDuration: 1200,
  attackActionDuration: 3000,
  mixins: ["HitPoints", "Sight", "WanderChaserActor", "WalkerCorporeal", "MeleeAttacker"]
});
