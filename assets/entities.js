Game.ALL_ENTITIES = {};
Game.EntityGenerator = new Game.Generator('entities',Game.Entity);
Game.EntityGenerator.learn({
  name: 'avatar',
  chr:'\u2744',
  fg:'#2457c5',
  maxHp: 10,
  mixins: ["PlayerActor", "PlayerMessager", "WalkerCorporeal", "HitPoints", "Chronicle", "Hunger", "MeleeAttacker"]
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
