Game.EntityMixin = {};

// Mixins have a META property is is info about/for the mixin itself and then all other properties. The META property is NOT copied into objects for which this mixin is used - all other properies ARE copied in.

Game.EntityMixin.PlayerMessager = {
  META: {
    mixinName: 'PlayerMessager',
    mixinGroup: 'PlayerMessager',
    listeners: {

      'walkForbidden': function(evtData) {
        Game.Message.sendMessage('you can\'t walk into the '+evtData.target.getName());
        Game.renderMessage();
        Game.Message.ageMessages();
      },

      'attackAvoided': function(evtData) {
        Game.Message.sendMessage('you avoided the '+evtData.attacker.getName());
        Game.renderMessage();
        Game.Message.ageMessages(); // NOTE: maybe not do this? If surrounded by multiple attackers messages could be aged out before being seen...
      },

      'attackMissed': function(evtData) {
        Game.Message.sendMessage('you missed the '+evtData.recipient.getName());
        Game.renderMessage();
      },

      'dealtDamage': function(evtData) {
        Game.Message.sendMessage('you hit the '+evtData.damagee.getName()+' for '+evtData.damageAmount);
        Game.renderMessage();
      },

      'madeKill': function(evtData) {
        Game.Message.sendMessage('you killed the '+evtData.entKilled.getName());
        Game.renderMessage();
      },

      'damagedBy': function(evtData) {
        Game.Message.sendMessage('the '+evtData.damager.getName()+' hit you for '+evtData.damageAmount);
        Game.renderMessage();
        Game.Message.ageMessages();
      },

      'killed': function(evtData) {
        if (typeof evtData.killedBy == 'string') {
          Game.Message.sendMessage('you were killed by '+evtData.killedBy);
        } else {
          Game.Message.sendMessage('you were killed by the '+evtData.killedBy.getName());
        }
        Game.renderMessage();
        Game.Message.ageMessages();
      },

      'mergeMonsterComplete': function(evtData) {
        Game.Message.sendMessage('two monsters have merged into an even stronger monster! Look out for the '+ evtData + '!');
        Game.renderMessage();
        Game.Message.ageMessages();
      },

      'noItemsToPickup': function(evtData) {
        Game.Message.sendMessage('there is nothing to pickup');
        Game.renderMessage();
      },
      'inventoryFull': function(evtData) {
        Game.Message.sendMessage('your inventory is full');
        Game.renderMessage();
      },
      'inventoryEmpty': function(evtData) {
        Game.Message.sendMessage('you are not carrying anything');
        Game.renderMessage();
      },
      'noItemsPickedUp': function(evtData) {
        Game.Message.sendMessage('you could not pick up any items');
        Game.renderMessage();
      },
      'someItemsPickedUp': function(evtData) {
        Game.Message.sendMessage('you picked up '+evtData.numItemsPickedUp+' of the items, leaving '+evtData.numItemsNotPickedUp+' of them');
        Game.renderMessage();
      },
      'allItemsPickedUp': function(evtData) {
        if (evtData.numItemsPickedUp > 2) {
          Game.Message.sendMessage('you picked up all '+evtData.numItemsPickedUp+' items');
        } else if (evtData.numItemsPickedUp == 2) {
          Game.Message.sendMessage('you picked up both items');
        } else {
          Game.Message.sendMessage('you picked up the '+evtData.lastItemPickedUpName);
        }
        Game.renderMessage();
      },
      'itemsDropped': function(evtData) {
        if (evtData.numItemsDropped > 1) {
          Game.Message.sendMessage('you dropped '+evtData.numItemsDropped+' items');
        } else {
          Game.Message.sendMessage('you dropped the '+evtData.lastItemDroppedName);
        }
        Game.renderMessage();
      },

      'moneyObtained': function(evtData) {
        Game.Message.sendMessage('you got ' + evtData.amount + ' sprinkles');
      },

      'moneyLost': function(evtData) {
        Game.Message.sendMessage('you lost ' + evtData.amount + ' sprinkles');
      }
    }
  }
  //    Game.Message.send(msg);
};

Game.EntityMixin.PlayerActor = {
  META: {
    mixinName: 'PlayerActor',
    mixinGroup: 'Actor',
    stateNamespace: '_PlayerActor_attr',
    stateModel:  {
      baseActionDuration: 1000,
      actingState: false,
      currentActionDuration: 1000
    },
    init: function (template) {
      Game.Scheduler.add(this,true,1);
    },
    listeners: {
      'actionDone': function(evtData) {
        Game.Scheduler.setDuration(this.getCurrentActionDuration());
        this.raiseSymbolActiveEvent('getHungrier',{duration:this.getCurrentActionDuration()});
        this.setCurrentActionDuration(this.getBaseActionDuration()+Game.util.randomInt(-5,5));
        setTimeout(function() {
          Game.TimeEngine.unlock();
        },1); // NOTE: this tiny delay ensures console output happens in the right order, which in turn means I have confidence in the turn-taking order of the various entities
        Game.renderMessage();
        // console.log("end player acting");
      },
      'madeKill': function(evtData) {
        var self = this;
        setTimeout(function() { // NOTE: this tiny delay ensures event calls happen in the right order (yes, this is a bit of a hack... might be better to make a postChronicalKill event, though that's also a bit of a hack...)
          var victoryCheckResp = self.raiseSymbolActiveEvent('calcKillsOf',{entityName:'chocolate scoop'});
          if (Game.util.compactNumberArray_add(victoryCheckResp.killCount) >= 3) {
            //Game.switchUiMode("gameWin");
          }
        },1);
      },
      'killed': function(evtData) {
        //Game.TimeEngine.lock();
        Game.DeadAvatar = this;
        Game.switchUiMode("gameLose");
      },
      //TODO: fix this - there has to be a better way to interact with the shop
      'bumpEntity': function(evtData) {
        // If the player bumped into the shopkeeper, we want to raise an event
        evtData.recipient.raiseSymbolActiveEvent('bumped',{actor: evtData.actor});
      }
    }
  },
  getBaseActionDuration: function () {
    return this.attr._PlayerActor_attr.baseActionDuration;
  },
  setBaseActionDuration: function (n) {
    this.attr._PlayerActor_attr.baseActionDuration = n;
  },
  getCurrentActionDuration: function () {
    return this.attr._PlayerActor_attr.currentActionDuration;
  },
  setCurrentActionDuration: function (n) {
    this.attr._PlayerActor_attr.currentActionDuration = n;
  },
  isActing: function (state) {
    if (state !== undefined) {
      this.attr._PlayerActor_attr.actingState = state;
    }
    return this.attr._PlayerActor_attr.actingState;
  },
  act: function () {
    // console.log("begin player acting");
    // console.log("player pre-lock engine lock state is "+Game.TimeEngine._lock);
    if (this.isActing()) { return; } // a gate to deal with JS timing issues
    this.isActing(true);
    //Game.refresh();
    Game.renderMain();
    Game.renderAvatar();
    Game.TimeEngine.lock();
    // console.log("player post-lock engine lock state is "+Game.TimeEngine._lock);
    this.isActing(false);
  }
};

Game.EntityMixin.ItemDropper = {
  META: {
    mixinName: 'ItemDropper',
    mixinGroup: 'ItemDropper',
    stateNamespace: '_ItemDropper_attr',
    stateModel: {
      items: []
    },
    init: function(template) {
      this.attr._ItemDropper_attr.items = template.items || [];
    },
    listeners: {
      'killed': function(evtData) {
        // Use each item's drop rate to decide whether or not to drop
        for (var i = 0; i < this.attr._ItemDropper_attr.items.length; i++) {
          if (Math.random() < this.attr._ItemDropper_attr.items[i].dropRate) {
            // Drop the item at the spot the entity died
            itemPos = evtData.entityPos;
            this.getMap().addItem(Game.ItemGenerator.create(this.attr._ItemDropper_attr.items[i].itemName),itemPos);
          }
        }
      }
    }
  }
};

Game.EntityMixin.MoneyDropper = {
  META: {
    mixinName: 'MoneyDropper',
    mixinGroup: 'MoneyDropper',
    stateNamespace: '_MoneyDropper_attr',
    stateModel: {
      amountToDrop: 0
    },
    init: function(template) {
      this.attr._MoneyDropper_attr.amountToDrop = template.amountToDrop || [];
    },
    listeners: {
      'killed': function(evtData) {
        // If the attacker is a MoneyHolder, add this money to its balance
        if (evtData.killedBy.hasOwnProperty('deposit')) {
          evtData.killedBy.deposit(this.attr._MoneyDropper_attr.amountToDrop);
        }
      }
    }
  }
};

Game.EntityMixin.FoodConsumer = {
  META: {
    mixinName: 'FoodConsumer',
    mixinGroup: 'FoodConsumer',
    stateNamespace: '_FoodConsumer_attr',
    stateModel:  {
      currentFood: 2000,
      maxFood: 2000,
      foodConsumedPer1000Ticks: 1
    },
    init: function (template) {
      this.attr._FoodConsumer_attr.maxFood = template.maxFood || 2000;
      this.attr._FoodConsumer_attr.currentFood = template.currentFood || (this.attr._FoodConsumer_attr.maxFood*0.9);
      this.attr._FoodConsumer_attr.foodConsumedPer1000Ticks = template.foodConsumedPer1000Ticks || 1;
    },
    listeners: {
      'getHungrier': function(evtData) {
        this.getHungrierBy(this.attr._FoodConsumer_attr.foodConsumedPer1000Ticks * evtData.duration/1000);
      }
    }
  },
  getMaxFood: function () {
    return this.attr._FoodConsumer_attr.maxFood;
  },
  setMaxFood: function (n) {
    this.attr._FoodConsumer_attr.maxFood = n;
  },
  getCurFood: function () {
    return this.attr._FoodConsumer_attr.currentFood;
  },
  setCurFood: function (n) {
    this.attr._FoodConsumer_attr.currentFood = n;
  },
  getFoodConsumedPer1000: function () {
    return this.attr._FoodConsumer_attr.foodConsumedPer1000Ticks;
  },
  setFoodConsumedPer1000: function (n) {
    this.attr._FoodConsumer_attr.foodConsumedPer1000Ticks = n;
  },
  eatFood: function (foodAmt) {
    this.attr._FoodConsumer_attr.currentFood += foodAmt;
    if (this.attr._FoodConsumer_attr.currentFood > this.attr._FoodConsumer_attr.maxFood) {this.attr._FoodConsumer_attr.currentFood = this.attr._FoodConsumer_attr.maxFood;}
  },
  getHungrierBy: function (foodAmt) {
    this.attr._FoodConsumer_attr.currentFood -= foodAmt;
    if (this.attr._FoodConsumer_attr.currentFood < 0) {
      this.raiseSymbolActiveEvent('killed',{killedBy: 'starvation'});
    }
  },
  getHungerStateDescr: function () {
    var frac = this.attr._FoodConsumer_attr.currentFood/this.attr._FoodConsumer_attr.maxFood;
    if (frac < 0.1) { return '%c{#e600e5}%b{#000}*STARVING*'; }
    if (frac < 0.25) { return '%c{#ff80ff}%b{#000}ravenous'; }
    if (frac < 0.45) { return '%c{#ffccff}%b{#000}hungry'; }
    if (frac < 0.65) { return '%c{#fff}%b{#000}peckish'; }
    if (frac < 0.95) { return '%c{#fff}%b{#000}full'; }
    return '%c{#33bbff}%b{#000}*stuffed*';
  }
};

Game.EntityMixin.WalkerCorporeal = {
  META: {
    mixinName: 'WalkerCorporeal',
    mixinGroup: 'Walker',
    listeners: {
      'adjacentMove': function(evtData) {
        // console.log('listener adjacentMove');
        // console.dir(JSON.parse(JSON.stringify(evtData)));
        var map = this.getMap();
        var dx=evtData.dx,dy=evtData.dy;
        // var targetX = Math.min(Math.max(0,this.getX() + dx),map.getWidth()-1);
        // var targetY = Math.min(Math.max(0,this.getY() + dy),map.getHeight()-1);
        var targetX = this.getX() + dx;
        var targetY = this.getY() + dy;
        if ((targetX < 0) || (targetX >= map.getWidth()) || (targetY < 0) || (targetY >= map.getHeight())) {
          this.raiseSymbolActiveEvent('walkForbidden',{target:Game.Tile.nullTile});
          return {madeAdjacentMove:false};
        }
        if (map.getEntity(targetX,targetY)) { // can't walk into spaces occupied by other entities
          this.raiseSymbolActiveEvent('bumpEntity',{actor:this,recipient:map.getEntity(targetX,targetY), bumpedEntityPos: {x: targetX, y: targetY}});
          // NOTE: should bumping an entity always take a turn? might have to get some return data from the event (once event return data is implemented)
          return {madeAdjacentMove:true};
        }
        var targetTile = map.getTile(targetX,targetY);
        if (targetTile.isWalkable()) {
          this.setPos(targetX,targetY);
          var myMap = this.getMap();
          if (myMap) {
            myMap.updateEntityLocation(this);
          }
          return {madeAdjacentMove:true};
        } else {
          this.raiseSymbolActiveEvent('walkForbidden',{target:targetTile});
        }
        return {madeAdjacentMove:false};
      }
    }
  }
};

Game.EntityMixin.Chronicle = {
  META: {
    mixinName: 'Chronicle',
    mixinGroup: 'Chronicle',
    stateNamespace: '_Chronicle_attr',
    stateModel:  {
      turnCounter: 0,
      killLog:{},
      deathMessage:'',
      killCount: 0
    },
    listeners: {
      'actionDone': function(evtData) {
        this.trackTurnCount();
      },
      'madeKill': function(evtData) {
        //console.log('chronicle kill');
        this.addKill(evtData.entKilled);
      },
      'killed': function(evtData) {
        if (typeof evtData.killedBy == 'string') {
          this.attr._Chronicle_attr.deathMessage = 'killed by '+evtData.killedBy;
        } else {
          this.attr._Chronicle_attr.deathMessage = 'killed by '+evtData.killedBy.getName();
        }
      },
      'calcKillsOf': function (evtData) {
        return {killCount:this.getKillsOf(evtData.entityName)};
      }
    }
  },
  trackTurnCount: function () {
    this.attr._Chronicle_attr.turnCounter++;
  },
  getTurns: function () {
    return this.attr._Chronicle_attr.turnCounter;
  },
  setTurns: function (n) {
    this.attr._Chronicle_attr.turnCounter = n;
  },
  getKills: function () {
    return this.attr._Chronicle_attr.killLog;
  },
  getKillsOf: function (entityName) {
    return this.attr._Chronicle_attr.killLog[entityName] || 0;
  },
  getTotalKills: function () {
    return this.attr._Chronicle_attr.killCount;
  },
  clearKills: function () {
    this.attr._Chronicle_attr.killLog = {};
  },
  addKill: function (entKilled) {
    var entName = entKilled.getName();
    //console.log('chronicle kill of '+entName);
    if (this.attr._Chronicle_attr.killLog[entName]) {
      this.attr._Chronicle_attr.killLog[entName]++;
    } else {
      this.attr._Chronicle_attr.killLog[entName] = 1;
    }
    this.attr._Chronicle_attr.killCount++;
  }
};

Game.EntityMixin.HitPoints = {
  META: {
    mixinName: 'HitPoints',
    mixinGroup: 'HitPoints',
    stateNamespace: '_HitPoints_attr',
    stateModel:  {
      maxHp: 1,
      curHp: 1
    },
    init: function (template) {
      this.attr._HitPoints_attr.maxHp = template.maxHp || 1;
      this.attr._HitPoints_attr.curHp = template.curHp || this.attr._HitPoints_attr.maxHp;
    },
    listeners: {
      'attacked': function(evtData) {
        //console.log('HitPoints attacked');
        this.takeHits(evtData.attackDamage);
        this.raiseSymbolActiveEvent('damagedBy',{damager:evtData.attacker,damageAmount:evtData.attackDamage});
        evtData.attacker.raiseSymbolActiveEvent('dealtDamage',{damagee:this,damageAmount:evtData.attackDamage});
        if (this.getCurHp() <= 0) {
          this.raiseSymbolActiveEvent('killed',{entKilled: this, killedBy: evtData.attacker, entityPos: evtData.entityPos});
          evtData.attacker.raiseSymbolActiveEvent('madeKill',{entKilled: this, killedBy: evtData.attacker});
        }
      },
      'killed': function(evtData) {
        //console.log('HitPoints killed');
        this.destroy();
      }
    }
  },
  getMaxHp: function () {
    return this.attr._HitPoints_attr.maxHp;
  },
  setMaxHp: function (n) {
    this.attr._HitPoints_attr.maxHp = n;
  },
  getCurHp: function () {
    return this.attr._HitPoints_attr.curHp;
  },
  setCurHp: function (n) {
    this.attr._HitPoints_attr.curHp = n;
  },
  takeHits: function (amt) {
    this.attr._HitPoints_attr.curHp -= amt;
  },
  recoverHits: function (amt) {
    this.attr._HitPoints_attr.curHp = Math.min(this.attr._HitPoints_attr.curHp+amt,this.attr._HitPoints_attr.maxHp);
  }
};

Game.EntityMixin.MeleeAttacker = {
  META: {
    mixinName: 'MeleeAttacker',
    mixinGroup: 'Attacker',
    stateNamespace: '_MeleeAttacker_attr',
    stateModel:  {
      attackHit: 1,
      attackDamage: 1,
      attackActionDuration: 1000
    },
    init: function (template) {
      this.attr._MeleeAttacker_attr.attackDamage = template.attackDamage || 1;
      this.attr._MeleeAttacker_attr.attackActionDuration = template.attackActionDuration || 1000;
    },
    listeners: {
      'bumpEntity': function(evtData) {
        //console.log('MeleeAttacker bumpEntity');
        var hitValResp = this.raiseSymbolActiveEvent('calcAttackHit');
        var avoidValResp = evtData.recipient.raiseSymbolActiveEvent('calcAttackAvoid');
        //Game.util.cdebug(avoidValResp);
        var hitVal = Game.util.compactNumberArray_add(hitValResp.attackHit);
        var avoidVal = Game.util.compactNumberArray_add(avoidValResp.attackAvoid);
        if (ROT.RNG.getUniform()*(hitVal+avoidVal) > avoidVal) {
          var hitDamageResp = this.raiseSymbolActiveEvent('calcAttackDamage');
          var damageMitigateResp = evtData.recipient.raiseSymbolActiveEvent('calcDamageMitigation');

          evtData.recipient.raiseSymbolActiveEvent('attacked',{attacker:evtData.actor,attackDamage:Game.util.compactNumberArray_add(hitDamageResp.attackDamage) - Game.util.compactNumberArray_add(damageMitigateResp.damageMitigation), entityPos: evtData.bumpedEntityPos});
        } else {
          evtData.recipient.raiseSymbolActiveEvent('attackAvoided',{attacker:evtData.actor,recipient:evtData.recipient});
          evtData.actor.raiseSymbolActiveEvent('attackMissed',{attacker:evtData.actor,recipient:evtData.recipient});
        }
        this.setCurrentActionDuration(this.attr._MeleeAttacker_attr.attackActionDuration);
      },
      'calcAttackHit': function(evtData) {
        // console.log('MeleeAttacker bumpEntity');
        return {attackHit:this.getAttackHit()};
      },
      'calcAttackDamage': function(evtData) {
        // console.log('MeleeAttacker bumpEntity');
        return {attackDamage:this.getAttackDamage()};
      }

    }
  },
  getAttackHit: function () {
    return this.attr._MeleeAttacker_attr.attackHit;
  },
  getAttackDamage: function () {
    return this.attr._MeleeAttacker_attr.attackDamage;
  }
};

Game.EntityMixin.MeleeDefender = {
  META: {
    mixinName: 'MeleeDefender',
    mixinGroup: 'Defender',
    stateNamespace: '_MeleeDefenderr_attr',
    stateModel:  {
      attackAvoid: 0,
      damageMitigation: 0
    },
    init: function (template) {
      this.attr._MeleeDefenderr_attr.attackAvoid = template.attackAvoid || 0;
      this.attr._MeleeDefenderr_attr.damageMitigation = template.damageMitigation || 0;
    },
    listeners: {
      'calcAttackAvoid': function(evtData) {
        // console.log('MeleeDefender calcAttackAvoid');
        return {attackAvoid:this.getAttackAvoid()};
      },
      'calcDamageMitigation': function(evtData) {
        // console.log('MeleeAttacker bumpEntity');
        return {damageMitigation:this.getDamageMitigation()};
      }
    }
  },
  getAttackAvoid: function () {
    return this.attr._MeleeDefenderr_attr.attackAvoid;
  },
  getDamageMitigation: function () {
    return this.attr._MeleeDefenderr_attr.damageMitigation;
  }
};

Game.EntityMixin.Sight = {
  META: {
    mixinName: 'Sight',
    mixinGroup: 'Sense',
    stateNamespace: '_Sight_attr',
    stateModel:  {
      sightRadius: 3
    },
    init: function (template) {
      this.attr._Sight_attr.sightRadius = template.sightRadius || 3;
    },
    listeners: {
      'senseForEntity': function(evtData) {
        // console.log('Sight lookForEntity');
        return {entitySensed:this.canSeeEntity(evtData.senseForEntity)};
      }
    }
  },
  getSightRadius: function () {
    return this.attr._Sight_attr.sightRadius;
  },
  setSightRadius: function (n) {
    this.attr._Sight_attr.sightRadius = n;
  },

  canSeeEntity: function(entity) {
    // If not on the same map or on different maps, then exit early
    if (!entity || this.getMapId() !== entity.getMapId()) {
      return false;
    }
    return this.canSeeCoord(entity.getX(),entity.getY());
  },
  canSeeCoord: function(x_or_pos,y) {
    var otherX = x_or_pos,otherY=y;
    if (typeof x_or_pos == 'object') {
      otherX = x_or_pos.x;
      otherY = x_or_pos.y;
    }

    // If we're not within the sight radius, then we won't be in a real field of view either.
    if (Math.max(Math.abs(otherX - this.getX()),Math.abs(otherY - this.getY())) > this.attr._Sight_attr.sightRadius) {
      return false;
    }

    var inFov = this.getVisibleCells();
    return inFov[otherX+','+otherY] || false;
  },
  getVisibleCells: function() {
    var visibleCells = {'byDistance':{}};
    for (var i=0;i<=this.getSightRadius();i++) {
      visibleCells.byDistance[i] = {};
    }
    this.getMap().getFov().compute(
      this.getX(), this.getY(),
      this.getSightRadius(),
      function(x, y, radius, visibility) {
        visibleCells[x+','+y] = true;
        visibleCells.byDistance[radius][x+','+y] = true;
      }
    );
    return visibleCells;
  },
  canSeeCoord_delta: function(dx,dy) {
    return this.canSeeCoord(this.getX()+dx,this.getY()+dy);
  }
};


Game.EntityMixin.MapMemory = {
  META: {
    mixinName: 'MapMemory',
    mixinGroup: 'MapMemory',
    stateNamespace: '_MapMemory_attr',
    stateModel:  {
      mapsHash: {}
    },
    init: function (template) {
      this.attr._MapMemory_attr.mapsHash = template.mapsHash || {};
    }
  },
  rememberCoords: function (coordSet,mapId) {
    var mapKey=mapId || this.getMapId();
    if (! this.attr._MapMemory_attr.mapsHash[mapKey]) {
      this.attr._MapMemory_attr.mapsHash[mapKey] = {};
    }
    for (var coord in coordSet) {
      if (coordSet.hasOwnProperty(coord) && (coord != 'byDistance')) {
        this.attr._MapMemory_attr.mapsHash[mapKey][coord] = true;
      }
    }
  },
  getRememberedCoordsForMap: function (mapId) {
    var mapKey=mapId || this.getMapId();
    return this.attr._MapMemory_attr.mapsHash[mapKey] || {};
  }
};

Game.EntityMixin.MoneyHolder = {
  META: {
    mixinName: 'MoneyHolder',
    mixinGroup: 'MoneyHolder',
    stateNamespace: '_MoneyHolder_attr',
    stateModel:  {
      balance: 0
    },
    init: function (template) {
      this.attr._MoneyHolder_attr.balance = template.balance || 0;
    },
    listeners: {    }
  },
  getBalance: function () {
    return this.attr._MoneyHolder_attr.balance;
  },
  deposit: function (n) {
    this.attr._MoneyHolder_attr.balance = this.attr._MoneyHolder_attr.balance + n;
    this.raiseSymbolActiveEvent('moneyObtained',{amount: n});
  },
  withdraw: function (n) {
    this.attr._MoneyHolder_attr.balance = this.attr._MoneyHolder_attr.balance - n;
    this.raiseSymbolActiveEvent('moneyLost',{amount: n});
  }
};

Game.EntityMixin.InventoryHolder = {
  META: {
    mixinName: 'InventoryHolder',
    mixinGroup: 'InventoryHolder',
    stateNamespace: '_InventoryHolder_attr',
    stateModel:  {
      containerId: '',
      inventoryCapacity: 5
    },
    init: function (template) {
      this.attr._InventoryHolder_attr.inventoryCapacity = template.inventoryCapacity || 5;
      if (template.containerId) {
        this.attr._InventoryHolder_attr.containerId = template.containerId;
      } else {
        var container = Game.ItemGenerator.create('_inventoryContainer');
        container.setCapacity(this.attr._InventoryHolder_attr.inventoryCapacity);
        this.attr._InventoryHolder_attr.containerId = container.getId();
      }
    },
    listeners: {
      'pickupItems': function(evtData) {
        return {addedAnyItems: this.pickupItems(evtData.itemSet)};
      },
      'dropItems': function(evtData) {
        return {droppedItems: this.dropItems(evtData.itemSet)};
      }
    }
  },
  _getContainer: function () {
    return Game.DATASTORE.ITEM[this.attr._InventoryHolder_attr.containerId];
  },

  hasInventorySpace: function () {
    return this._getContainer().hasSpace();
  },
  addInventoryItems: function (items_or_ids) {
    return this._getContainer().addItems(items_or_ids);
  },
  getInventoryItemIds: function () {
    return this._getContainer().getItemIds();
  },
  extractInventoryItems: function (ids_or_idxs) {
    return this._getContainer().extractItems(ids_or_idxs);
  },
  pickupItems: function (ids_or_idxs) {
    var itemsToAdd = [];
    var fromPile = this.getMap().getItems(this.getPos());
    var pickupResult = {
      numItemsPickedUp:0,
      numItemsNotPickedUp:ids_or_idxs.length
    };

    if (fromPile.length < 1) {
      this.raiseSymbolActiveEvent('noItemsToPickup');
      return pickupResult;
    }
    if (! this._getContainer().hasSpace()) {
      this.raiseSymbolActiveEvent('inventoryFull');
      this.raiseSymbolActiveEvent('noItemsPickedUp');
      return pickupResult;
    }

    for (var i = 0; i < fromPile.length; i++) {
      if ((ids_or_idxs.indexOf(i) > -1) || (ids_or_idxs.indexOf(fromPile[i].getId()) > -1)) {
        itemsToAdd.push(fromPile[i]);
      }
    }
    var addResult = this._getContainer().addItems(itemsToAdd);
    pickupResult.numItemsPickedUp = addResult.numItemsAdded;
    pickupResult.numItemsNotPickedUp = addResult.numItemsNotAdded;
    var lastItemFromMap = '';
    for (var j = 0; j < pickupResult.numItemsPickedUp; j++) {
      lastItemFromMap = this.getMap().extractItemAt(itemsToAdd[j],this.getPos());
    }

    pickupResult.lastItemPickedUpName = lastItemFromMap.getName();
    if (pickupResult.numItemsNotPickedUp > 0) {
      this.raiseSymbolActiveEvent('someItemsPickedUp',pickupResult);
    } else {
      this.raiseSymbolActiveEvent('allItemsPickedUp',pickupResult);
    }

    return pickupResult;
  },
  dropItems: function (ids_or_idxs) {
    var itemsToDrop = this._getContainer().extractItems(ids_or_idxs);
    var dropResult = {numItemsDropped:0};
    if (itemsToDrop.length < 1) {
      this.raiseSymbolActiveEvent('inventoryEmpty');
      return dropResult;
    }
    var lastItemDropped = '';
    for (var i = 0; i < itemsToDrop.length; i++) {
      if (itemsToDrop[i]) {
        lastItemDropped = itemsToDrop[i];
        this.getMap().addItem(itemsToDrop[i],this.getPos());
        dropResult.numItemsDropped++;
      }
    }
    dropResult.lastItemDroppedName = lastItemDropped.getName();
    this.raiseSymbolActiveEvent('itemsDropped',dropResult);
    return dropResult;
  }
};

Game.EntityMixin.Shopkeeper = {
  META: {
    mixinName: 'Shopkeeper',
    mixinGroup: 'Shopkeeper',
    stateNamespace: '_Shopkeeper_attr',
    stateModel:  {
      containerId: '',
      prices: {}
    },
    init: function (template) {
      this.attr._Shopkeeper_attr.prices = template.prices || {};
      if (template.containerId) {
        this.attr._Shopkeeper_attr.containerId = template.containerId;
      } else {
        var container = Game.ItemGenerator.create('_inventoryContainer');
        container.setCapacity(1000);
        this.attr._Shopkeeper_attr.containerId = container.getId();
      }


    },
    listeners: {
      'bumped': function(evtData) {
        // Want to open up the shop window if the player bumps into the shop
        Game.addUiMode('LAYER_shopListing');
        if (evtData.actor.name === 'actor') {
          Game.addUiMode('LAYER_shopListing');
        }
      }
    }
  },

  _getContainer: function () {
    return Game.DATASTORE.ITEM[this.attr._Shopkeeper_attr.containerId];
  },
  getPrice: function(item) {
    return this.attr._Shopkeeper_attr.prices[item.attr._id];
  },

  addMerchandise: function (item, price) {
    console.log(item.attr._id);
    this.attr._Shopkeeper_attr.prices[item.attr._id] = price;
    console.log("price is " + this.attr._Shopkeeper_attr.prices[item.attr._id]);
    return this._getContainer().addItems([item]);
  },
  getMerchandiseIds: function () {
    return this._getContainer().getItemIds();
  },
  extractMerchandise: function (ids_or_idxs) {
    return this._getContainer().extractItems(ids_or_idxs);
  },

  sellItems: function (itemIds, buyer) {
    // Calculate total price of given items
    var total = 0;
    for (var i = 0; i < itemIds.length; i++) {
      console.log(itemIds[i]);
      console.log("price is " + this.attr._Shopkeeper_attr.prices[itemIds[i]]);
      total = total + this.attr._Shopkeeper_attr.prices[itemIds[i]];
    }

    console.log('total cost is ' + total);

    // Check whether the buyer can afford the items
    if (buyer.getBalance() < total) {
      Game.Message.sendMessage("insufficient funds");

    // otherwise withdraw the appropriate amt of money and add items to buyer's inventory
    } else {
      buyer.withdraw(total);
      buyer.addInventoryItems(itemIds);
      Game.Message.sendMessage("you bought " + itemIds.length + " item(s)");
      this.extractMerchandise(itemIds);
    }

    // Remove the appropriate amount of money from the buyer,
    // then add the item to the buyer's inventory
    //buyer.withdraw(items[itemIndex].price);
    //buyer.addInventoryItems(items[itemIndex].item);

    // Remove the bought item from the stock
    //items.splice(itemIndex,1);
  }
};

//#############################################################################
// ENTITY ACTORS / AI

Game.EntityMixin.WanderActor = {
  META: {
    mixinName: 'WanderActor',
    mixinGroup: 'Actor',
    stateNamespace: '_WanderActor_attr',
    stateModel:  {
      baseActionDuration: 1000,
      currentActionDuration: 1000
    },
    init: function (template) {
      Game.Scheduler.add(this,true, Game.util.randomInt(2,this.getBaseActionDuration()));
      this.attr._WanderActor_attr.baseActionDuration = template.wanderActionDuration || 1000;
      this.attr._WanderActor_attr.currentActionDuration = this.attr._WanderActor_attr.baseActionDuration;
    },
  },
  getBaseActionDuration: function () {
    return this.attr._WanderActor_attr.baseActionDuration;
  },
  setBaseActionDuration: function (n) {
    this.attr._WanderActor_attr.baseActionDuration = n;
  },
  getCurrentActionDuration: function () {
    return this.attr._WanderActor_attr.currentActionDuration;
  },
  setCurrentActionDuration: function (n) {
    this.attr._WanderActor_attr.currentActionDuration = n;
  },
  getMoveDeltas: function () {
    return Game.util.positionsAdjacentTo({x:0,y:0}).random();
  },
  act: function () {
    Game.TimeEngine.lock();
    var moveDeltas = this.getMoveDeltas();
    this.raiseSymbolActiveEvent('adjacentMove',{dx:moveDeltas.x,dy:moveDeltas.y});

    Game.Scheduler.setDuration(this.getCurrentActionDuration());
    this.setCurrentActionDuration(this.getBaseActionDuration()+Game.util.randomInt(-10,10));
    this.raiseSymbolActiveEvent('actionDone');
    //console.log("end wander acting");
    Game.TimeEngine.unlock();
  }
};

Game.EntityMixin.MergerActor = {
  META: {
    mixinName: 'MergerActor',
    mixinGroup: 'Actor',
    stateNamespace: '_MergerActor_attr',
    stateModel:  {
      mergesWith: []
    },
    init: function (template) {
      this.attr._MergerActor_attr.mergesWith = template.mergesWith || [];
    },
    listeners: {
      'bumpEntity': function(evtData) {
        evtData.actor.doMerge(evtData.recipient);
      }
    }
  },
  getCompatibleMergeTypes: function (){
    return this.attr._MergerActor_attr.mergesWith;
  },
  findAdjacentMergable: function (adjMonst) {
    var types = this.getCompatibleMergeTypes();
    for (var mergeType = 0; mergeType < types.length; mergeType++) {
      if (adjMonst != null && types[mergeType].monster === adjMonst.getName()) {
        return adjMonst;
      }
    }
    return null;
  },
  mergeBecomes: function (typeToMerge) {
    var types = this.attr._MergerActor_attr.mergesWith;
    for (var merges = 0; merges < types.length; merges++) {
      if (typeToMerge == types[merges].monster) {
        //console.log("new type is " +types[merges].becomes);
        return types[merges].becomes;
      }
    }
    return this.getName();
  },
  doMerge: function (evtData) {
    var adjMonst = this.findAdjacentMergable(evtData);
    if(adjMonst == null){
      this.raiseSymbolActiveEvent('mergeFailed');
    } else {
      var newType = this.mergeBecomes(adjMonst.getName());
      var map = this.getMap();
      var xval = this.getX();
      var yval = this.getY();
      adjMonst.destroy();
      this.destroy();

      map.addEntity(Game.EntityGenerator.create(newType),{x:xval,y:yval});
      var newEntity = map.getEntity(xval,yval);

      Game.getAvatar().raiseSymbolActiveEvent('mergeMonsterComplete', newType);


    }
  }
};

// NOTE: could be a good route to extract the move chooser into a separate mixin - that's left as an exercise for the reader....
Game.EntityMixin.WanderChaserActor = {
  META: {
    mixinName: 'WanderChaserActor',
    mixinGroup: 'Actor',
    stateNamespace: '_WanderChaserActor_attr',
    stateModel:  {
      baseActionDuration: 1000,
      currentActionDuration: 1000
    },
    init: function (template) {
      Game.Scheduler.add(this,true, Game.util.randomInt(2,this.getBaseActionDuration()));
      this.attr._WanderChaserActor_attr.baseActionDuration = template.wanderChaserActionDuration || 1000;
      this.attr._WanderChaserActor_attr.currentActionDuration = this.attr._WanderChaserActor_attr.baseActionDuration;
    },
  },
  getBaseActionDuration: function () {
    return this.attr._WanderChaserActor_attr.baseActionDuration;
  },
  setBaseActionDuration: function (n) {
    this.attr._WanderChaserActor_attr.baseActionDuration = n;
  },
  getCurrentActionDuration: function () {
    return this.attr._WanderChaserActor_attr.currentActionDuration;
  },
  setCurrentActionDuration: function (n) {
    this.attr._WanderChaserActor_attr.currentActionDuration = n;
  },
  getMoveDeltas: function () {
    var avatar = Game.getAvatar();
    var senseResp = this.raiseSymbolActiveEvent('senseForEntity',{senseForEntity:avatar});
    if (Game.util.compactBooleanArray_or(senseResp.entitySensed)) {

      // build a path instance for the avatar
      var source = this;
      var map = this.getMap();
      var path = new ROT.Path.AStar(avatar.getX(), avatar.getY(), function(x, y) {
        // If an entity is present at the tile, can't move there.
        var entity = map.getEntity(x, y);
        if (entity && entity !== avatar && entity !== source) {
          return false;
        }
        return map.getTile(x, y).isWalkable();
      }, {topology: 8});

      // compute the path from here to there
      var count = 0;
      var moveDeltas = {x:0,y:0};
      path.compute(this.getX(), this.getY(), function(x, y) {
        if (count == 1) {
          moveDeltas.x = x - source.getX();
          moveDeltas.y = y - source.getY();
        }
        count++;
      });

      return moveDeltas;
    }
    return Game.util.positionsAdjacentTo({x:0,y:0}).random();
  },
  act: function () {
    Game.TimeEngine.lock();

    var moveDeltas = this.getMoveDeltas();
    this.raiseSymbolActiveEvent('adjacentMove',{dx:moveDeltas.x,dy:moveDeltas.y});

    Game.Scheduler.setDuration(this.getCurrentActionDuration());
    this.setCurrentActionDuration(this.getBaseActionDuration()+Game.util.randomInt(-10,10));
    this.raiseSymbolActiveEvent('actionDone');
    Game.TimeEngine.unlock();
  }
};
