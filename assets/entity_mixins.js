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
        Game.Message.sendMessage('you were killed by the '+evtData.killedBy.getName());
        Game.renderMessage();
        Game.Message.ageMessages();
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
        this.setCurrentActionDuration(this.getBaseActionDuration()+Game.util.randomInt(-5,5));
        setTimeout(function() {Game.TimeEngine.unlock();},1); // NOTE: this tiny delay ensures console output happens in the right order, which in turn means I have confidence in the turn-taking order of the various entities
        Game.renderMessage();
        // console.log("end player acting");
      },
      'killed': function(evtData) {
        Game.TimeEngine.lock();
        Game.switchUiMode("gameLose");
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

Game.EntityMixin.WalkerCorporeal = {
  META: {
    mixinName: 'WalkerCorporeal',
    mixinGroup: 'Walker'
  },
  tryWalk: function (map,dx,dy) {
    var targetX = Math.min(Math.max(0,this.getX() + dx),map.getWidth()-1);
    var targetY = Math.min(Math.max(0,this.getY() + dy),map.getHeight()-1);
    //console.log('tryWalk deltas: '+dx+','+dy+' '+this.getName());
    //console.log('tryWalk initial pos: '+this.getX()+','+this.getY()+' '+this.getName());
    //console.log('tryWalk: '+targetX+','+targetY+' '+this.getName());

    if (map.getEntity(targetX,targetY)) { // can't walk into spaces occupied by other entities
      this.raiseEntityEvent('bumpEntity',{actor:this,recipient:map.getEntity(targetX,targetY)});
      // NOTE: should bumping an entity always take a turn? might have to get some return data from the event (once event return data is implemented)
      return true;
    }
    var targetTile = map.getTile(targetX,targetY);
    if (targetTile.isWalkable()) {
      //console.log('tryWalk - walkable: '+this.getName());
      this.setPos(targetX,targetY);
      var myMap = this.getMap();
      if (myMap) {
        //console.log('tryWalk - myMap.updateEntityLocation: '+this.getName());
        myMap.updateEntityLocation(this);
      }
      //console.log('tryWalk post movement pos: '+this.getX()+','+this.getY()+' '+this.getName());
      return true;
    } else {
      //console.log('tryWalk - walkForbidden: '+this.getName());
      this.raiseEntityEvent('walkForbidden',{target:targetTile});
    }
    return false;
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
      deathMessage:''
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
        this.attr._Chronicle_attr.deathMessage = 'killed by '+evtData.killedBy.getName();
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
        this.takeHits(evtData.attackPower);
        this.raiseEntityEvent('damagedBy',{damager:evtData.attacker,damageAmount:evtData.attackPower});
        evtData.attacker.raiseEntityEvent('dealtDamage',{damagee:this,damageAmount:evtData.attackPower});
        if (this.getCurHp() <= 0) {
          this.raiseEntityEvent('killed',{entKilled: this, killedBy: evtData.attacker});
          evtData.attacker.raiseEntityEvent('madeKill',{entKilled: this, killedBy: evtData.attacker});
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
  curHpToString: function() {
    percentTotalHp = this.attr._HitPoints_attr.curHp / this.attr._HitPoints_attr.maxHp;
    if (percentTotalHp < 10) {
      return "freezing";
    } else if (percentTotalHp < 30) {
      return "cold";
    } else if (percentTotalHp < 50) {
      return "chilly";
    } else if (percentTotalHp < 70) {
      return "fine";
    } else {
      return "warm";
    }
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

Game.EntityMixin.Hunger = {
  META: {
    mixinName: 'Hunger',
    mixinGroup: 'Hunger',
    stateNamespace: '_Hunger_attr',
    stateModel:  {
      status: 4,
      maxTurnsUntilHungerDrops: 50,
      turnsUntilHungerDrops: 50
    },
    init: function (template) {
      this.attr._Hunger_attr.status = template.status || 4;
      this.attr._Hunger_attr.maxTurnsUntilHungerDrops = template.maxTurnsUntilHungerDrops || 50;
      this.attr._Hunger_attr.turnsUntilHungerDrops = template.turnsUntilHungerDrops || this.attr._Hunger_attr.maxTurnsUntilHungerDrops;
    },
    listeners: {
      'actionDone': function(evtData) {
        this.attr._Hunger_attr.turnsUntilHungerDrops--;
        console.log("turns until hunger drops is: " + this.attr._Hunger_attr.turnsUntilHungerDrops);
        if (this.attr._Hunger_attr.turnsUntilHungerDrops === 0) {
          this.attr._Hunger_attr.status--;
          /* Code to make character die if hunger drops to 0 goes here */
          this.turnsUntilHungerDrops = this.maxTurnsUntilHungerDrops;
        }
      }
    }
  },
  statusToString: function() {
    switch(this.attr._Hunger_attr.status) {
      case 1:
        return "starving";
      case 2:
        return "ravenous";
      case 3:
        return "hungry";
      case 4:
        return "fine";
      case 5:
        return "full";
      case 6:
        return "stuffed";
      case 7:
        return "brainfreeze!";
      default:
        return "error: out of range";
    }
  },
  getStatus: function () {
    return this.attr._Hunger_attr.status;
  },
  setStatus: function (n) {
    this.attr._Hunger_attr.status = n;
  }
};

Game.EntityMixin.MeleeAttacker = {
  META: {
    mixinName: 'MeleeAttacker',
    mixinGroup: 'Attacker',
    stateNamespace: '_MeleeAttacker_attr',
    stateModel:  {
      attackPower: 1
    },
    init: function (template) {
      this.attr._MeleeAttacker_attr.attackPower = template.attackPower || 1;
    },
    listeners: {
      'bumpEntity': function(evtData) {
        //console.log('MeleeAttacker bumpEntity');
        evtData.recipient.raiseEntityEvent('attacked',{attacker:evtData.actor,attackPower:this.getAttackPower()});
      }
    }
  },
  getAttackPower: function () {
    return this.attr._MeleeAttacker_attr.attackPower;
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
    }
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
    //console.log("begin wander acting");
    //console.log('wander for '+this.getName());
    var moveDeltas = this.getMoveDeltas();
    if (this.hasMixin('Walker')) { // NOTE: this pattern suggests that maybe tryWalk shoudl be converted to an event
      //console.log('trying to walk to '+moveDeltas.x+','+moveDeltas.y);
      this.tryWalk(this.getMap(), moveDeltas.x, moveDeltas.y);
    }
    Game.Scheduler.setDuration(this.getCurrentActionDuration());
    this.setCurrentActionDuration(this.getBaseActionDuration()+Game.util.randomInt(-10,10));
    this.raiseEntityEvent('actionDone');
    //console.log("end wander acting");
    Game.TimeEngine.unlock();
  }
};
