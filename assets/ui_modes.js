Game.UIMode = {};
Game.UIMode.DEFAULT_COLOR_FG = '#fff';
Game.UIMode.DEFAULT_COLOR_BG = '#000';
Game.UIMode.DEFAULT_COLOR_STR = '%c{'+Game.UIMode.DEFAULT_COLOR_FG+'}%b{'+Game.UIMode.DEFAULT_COLOR_BG+'}';

//#############################################################################
//#############################################################################

Game.UIMode.gameStart = {
  enter: function () {
    //console.log('game starting');
    Game.KeyBinding.setKeyBinding();
    Game.refresh();
  },
  exit: function () {
    Game.KeyBinding.informPlayer();
    Game.refresh();
  },
  handleInput: function (eventType, evt) {
    console.log("Game.UIMode.gameStart handleInput");
    if (evt.charCode !== 0) {
      Game.switchUiMode('gamePersistence');
    }
  },
  renderOnMain: function (display) {
    display.drawText(1,1,Game.UIMode.DEFAULT_COLOR_STR+"game start");
    display.drawText(1,3,Game.UIMode.DEFAULT_COLOR_STR+"press any key to continue");
  }
};

//#############################################################################
//#############################################################################

Game.UIMode.gamePersistence = {
  RANDOM_SEED_KEY: 'gameRandomSeed',
  _storedKeyBinding: '',
  enter: function () {
    this._storedKeyBinding = Game.KeyBinding.getKeyBinding();
    Game.KeyBinding.setKeyBinding('persist');
    Game.refresh();
  },
  exit: function () {
    Game.KeyBinding.setKeyBinding(this._storedKeyBinding);
    Game.refresh();
  },
  renderOnMain: function (display) {
    display.drawText(3,3,Game.UIMode.DEFAULT_COLOR_STR+"press 's' to save the current game, 'l' to load the saved game, or 'n' start a new one",70);
    //display.drawText(1,4,"press [Esc] to resume playing",fg,bg);
    //console.log("TODO: check whether local storage has a game before offering restore");
    //console.log("TODO: check whether a game is in progress before offering restore");
  },
  handleInput: function(eventType, evt){
    // console.log(eventType);
    // console.dir(evt);
    var actionBinding = Game.KeyBinding.getInputBinding(eventType,evt);
    // console.log('action binding is');
    // console.dir(actionBinding);
    // console.log('----------');
    if (! actionBinding) {
      return false;
    }

    if (actionBinding.actionKey == 'PERSISTENCE_SAVE') {
      this.saveGame();
    } else if (actionBinding.actionKey == 'PERSISTENCE_LOAD') {
      this.restoreGame();
    } else if (actionBinding.actionKey == 'PERSISTENCE_NEW') {
      this.newGame();
    } else if (actionBinding.actionKey == 'CANCEL') {
      if (Object.keys(Game.DATASTORE.MAP).length < 1) {
        this.newGame();
      } else {
        Game.switchUiMode('gamePlay');
      }
    } else if (actionBinding.actionKey == 'HELP') {
      //console.log('TODO: set up help stuff for gamepersistence');
      Game.UIMode.LAYER_textReading.setText(Game.KeyBinding.getBindingHelpText());
      Game.addUiMode('LAYER_textReading');
    }
    return false;
  },
  restoreGame: function () {
    if (this.localStorageAvailable()) {
      var json_state_data = window.localStorage.getItem(Game._PERSISTENCE_NAMESPACE);
      var state_data = JSON.parse(json_state_data);

      Game.DATASTORE = {};
      Game.DATASTORE.MAP = {};
      Game.DATASTORE.ENTITY = {};
      Game.initializeTimingEngine();
      // NOTE: the timing stuff is initialized here because we need to ensure that the stuff exists when entities are created, but the actual schedule restoration re-runs timing initialization

      // game level stuff
      Game.setRandomSeed(state_data[this.RANDOM_SEED_KEY]);

      // maps
      for (var mapId in state_data.MAP) {
        if (state_data.MAP.hasOwnProperty(mapId)) {
          var mapAttr = JSON.parse(state_data.MAP[mapId]);
          Game.DATASTORE.MAP[mapId] = new Game.Map(mapAttr._mapTileSetName,mapId);
          Game.DATASTORE.MAP[mapId].fromJSON(state_data.MAP[mapId]);
        }
      }

      ROT.RNG.getUniform(); // once the map is regenerated cycle the RNG so we're getting new data for entity generation

      // entities
      for (var entityId in state_data.ENTITY) {
        if (state_data.ENTITY.hasOwnProperty(entityId)) {
          var entAttr = JSON.parse(state_data.ENTITY[entityId]);
          var newE = Game.EntityGenerator.create(entAttr._generator_template_key,entAttr._id);

          Game.DATASTORE.ENTITY[entityId] = newE;
          Game.DATASTORE.ENTITY[entityId].fromJSON(state_data.ENTITY[entityId]);
        }
      }

      // game play et al
      Game.UIMode.gamePlay.attr = state_data.GAME_PLAY;
      Game.Message.attr = state_data.MESSAGES;
      this._storedKeyBinding = state_data.KEY_BINDING_SET; // NOTE: not setting the key binding directly because it's set to _storedKeyBinding when this ui mode is exited

      // schedule
      Game.initializeTimingEngine();
      for (var schedItemId in state_data.SCHEDULE) {
        if (state_data.SCHEDULE.hasOwnProperty(schedItemId)) {
          // check here to determine which data store thing will be added to the scheduler (and the actual addition may vary - e.g. not everyting will be a repeatable thing)
          if (Game.DATASTORE.ENTITY.hasOwnProperty(schedItemId)) {
            Game.Scheduler.add(Game.DATASTORE.ENTITY[schedItemId],true,state_data.SCHEDULE[schedItemId]);
          }
        }
      }
      Game.Scheduler._queue._time = state_data.SCHEDULE_TIME;

      Game.Message.sendMessage('game loaded');
      Game.switchUiMode('gamePlay');
      Game.KeyBinding.informPlayer();
    }
   },
   saveGame: function () {
     if (this.localStorageAvailable()) {
       Game.DATASTORE.GAME_PLAY = Game.UIMode.gamePlay.attr;
       Game.DATASTORE.MESSAGES = Game.Message.attr;

       Game.DATASTORE.KEY_BINDING_SET = this._storedKeyBinding; // NOTE: not getting the key binding directly because it's set to 'persist when this ui mode is entered - the 'real' key binding is saved in _storedKeyBinding

       Game.DATASTORE.SCHEDULE = {};
       // NOTE: offsetting times by 1 so later restore can just drop them in and go
       Game.DATASTORE.SCHEDULE[Game.Scheduler._current.getId()] = 1;
       for (var i = 0; i < Game.Scheduler._queue._eventTimes.length; i++) {
         Game.DATASTORE.SCHEDULE[Game.Scheduler._queue._events[i].getId()] = Game.Scheduler._queue._eventTimes[i] + 1;
        }
       Game.DATASTORE.SCHEDULE_TIME = Game.Scheduler._queue.getTime() - 1; // offset by 1 so that when the engine is started after restore the queue state will match that as when it was saved

       window.localStorage.setItem(Game._PERSISTENCE_NAMESPACE, JSON.stringify(Game.DATASTORE));
       Game.Message.sendMessage('game saved');
       Game.switchUiMode('gamePlay');
     }
   },
   newGame: function () {
     Game.DATASTORE = {};
     Game.DATASTORE.MAP = {};
     Game.DATASTORE.ENTITY = {};
     Game.initializeTimingEngine();
     Game.setRandomSeed(5 + Math.floor(Game.TRANSIENT_RNG.getUniform()*100000));
     Game.UIMode.gamePlay.setupNewGame();
     Game.Message.sendMessage('new game started');
     Game.switchUiMode('gamePlay');

     Game.Message.sendMessage("You work on the top floor of an ice cream factory. Unfortunately, there has been a nuclear explosion nearby and all the ice cream has come to life. Fight your way out!");
   },
   localStorageAvailable: function() {
     try {
       var x = '__storage_test__';
       window.localStorage.setItem(x,x);
       window.localStorage.removeItem(x);
       return true;
     }
     catch (e) {
       Game.Message.send('Sorry, no local data storage is available for this browser');
       return false;
     }
   },
   BASE_toJSON: function(state_hash_name) {
     var state = this.attr;
     if (state_hash_name) {
       state = this[state_hash_name];
     }
     return JSON.stringify(state);
   },
   BASE_fromJSON: function (json,state_hash_name) {
     var using_state_hash = 'attr';
     if (state_hash_name) {
       using_state_hash = state_hash_name;
     }
     this[using_state_hash] = JSON.parse(json);
   }
};

//#############################################################################
//#############################################################################

Game.UIMode.gameWin = {
  enter: function () {
    console.log('game winning');
  },
  exit: function () {
  },
  render: function (display) {
    display.drawText(1,1,Game.UIMode.DEFAULT_COLOR_STR+"You WON!!!!");
  },
  handleInput: function (inputType,inputData) {
    // console.log('gameStart inputType:');
    // console.dir(inputType);
    // console.log('gameStart inputData:');
    // console.dir(inputData);
    Game.Message.clear();
  }
};

//#############################################################################
//#############################################################################

Game.UIMode.gameLose = {
  enter: function () {
    console.log('game losing');
  },
  exit: function () {
  },
  render: function (display) {
    display.drawText(1,1,Game.UIMode.DEFAULT_COLOR_STR+"You lost :(");
  },
  handleInput: function (inputType,inputData) {
    // console.log('gameStart inputType:');
    // console.dir(inputType);
    // console.log('gameStart inputData:');
    // console.dir(inputData);
    Game.Message.clear();
  }
};

//#############################################################################
//#############################################################################

Game.UIMode.gamePlay = {
  attr: {
    _mapId: '',
    _avatarId: '',
    _cameraX: 100,
    _cameraY: 100
  },
  JSON_KEY: 'uiMode_gamePlay',
  enter: function () {
    // console.log('game playing');
    if (this.attr._avatarId) {
      this.setCameraToAvatar();
    }

    Game.TimeEngine.unlock();
    //Game.KeyBinding.informPlayer();
    Game.refresh();
  },
  exit: function () {
    Game.refresh();
    Game.TimeEngine.lock();
  },
  getMap: function () {
    return Game.DATASTORE.MAP[this.attr._mapId];
  },
  setMap: function (m) {
    this.attr._mapId = m.getId();
  },
  getAvatar: function () {
    return Game.DATASTORE.ENTITY[this.attr._avatarId];
  },
  setAvatar: function (a) {
    this.attr._avatarId = a.getId();
  },
  moveCamera: function (dx,dy) {
    this.setCamera(this.attr._cameraX + dx,this.attr._cameraY + dy);
  },
  setCamera: function (sx,sy) {
    this.attr._cameraX = Math.min(Math.max(0,sx),this.getMap().getWidth());
    this.attr._cameraY = Math.min(Math.max(0,sy),this.getMap().getHeight());
    //Game.refresh();
    //Game.renderMain();
  },
  setCameraToAvatar: function () {
    this.setCamera(this.getAvatar().getX(),this.getAvatar().getY());
  },
  handleInput: function (eventType,evt) {
    // console.log(inputType);
    // console.dir(inputData);
    var actionBinding = Game.KeyBinding.getInputBinding(eventType,evt);
    // console.log('action binding is');
    // console.dir(actionBinding);
    // console.log('----------');
    if ((! actionBinding) || (actionBinding.actionKey == 'CANCEL')) {
      return false;
    }
    var tookTurn = false;

    if (actionBinding.actionKey == 'MOVE_UL') {
      tookTurn = this.moveAvatar(-1 ,-1);
    } else if (actionBinding.actionKey == 'MOVE_U') {
      tookTurn = this.moveAvatar(0  ,-1);
    } else if (actionBinding.actionKey == 'MOVE_UR') {
      tookTurn = this.moveAvatar(1  ,-1);
    } else if (actionBinding.actionKey == 'MOVE_L') {
      tookTurn = this.moveAvatar(-1  ,0);
    } else if (actionBinding.actionKey == 'MOVE_WAIT') {
      tookTurn = true;
    } else if (actionBinding.actionKey == 'MOVE_R') {
      tookTurn = this.moveAvatar(1  , 0);
    } else if (actionBinding.actionKey == 'MOVE_DL') {
      tookTurn = this.moveAvatar(-1  , 1);
    } else if (actionBinding.actionKey == 'MOVE_D') {
      tookTurn = this.moveAvatar(0  , 1);
    } else if (actionBinding.actionKey == 'MOVE_DR') {
      tookTurn = this.moveAvatar(1  , 1);
    }

    else if (actionBinding.actionKey   == 'CHANGE_BINDINGS') {
      Game.KeyBinding.swapToNextKeyBinding();
    } else if (actionBinding.actionKey == 'PERSISTENCE') {
      Game.switchUiMode('gamePersistence');
    } else if (actionBinding.actionKey == 'HELP') {
      //console.log('TODO: set up help stuff for gameplay');
      Game.UIMode.LAYER_textReading.setText(Game.KeyBinding.getBindingHelpText());
      Game.addUiMode('LAYER_textReading');
    }
    if (tookTurn) {
      this.getAvatar().raiseEntityEvent('actionDone');
      Game.Message.ageMessages();
      return true;
    }
    return false;
  },
  renderOnMain: function (display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    console.log("Game.UIMode.gamePlay renderOnMain");
    display.clear();
    this.getMap().renderOn(display,this.attr._cameraX,this.attr._cameraY);
  },
  renderAvatarInfo: function (display) {
    display.drawText(1,2,Game.UIMode.DEFAULT_COLOR_STR+"avatar x: "+this.getAvatar().getX()); // DEV
    display.drawText(1,3,Game.UIMode.DEFAULT_COLOR_STR+"avatar y: "+this.getAvatar().getY()); // DEV
    display.drawText(1,4,Game.UIMode.DEFAULT_COLOR_STR+"turns: "+this.getAvatar().getTurns());
    display.drawText(1,5,Game.UIMode.DEFAULT_COLOR_STR+"HP: "+this.getAvatar().getCurHp());
    display.drawText(1,6,Game.UIMode.DEFAULT_COLOR_STR+"hunger: "+this.getAvatar().statusToString());
  },
  moveAvatar: function (dx,dy) {
    if (this.getAvatar().tryWalk(this.getMap(),dx,dy)) {
      this.setCameraToAvatar();
      return true;
    }
    return false;
  },
  setupNewGame: function () {
    Game.Message.clearMessages();
    this.setMap(new Game.Map('caves1'));
    this.setAvatar(Game.EntityGenerator.create('avatar'));

    this.getMap().addEntity(this.getAvatar(),this.getMap().getRandomWalkableLocation());
    this.setCameraToAvatar();

    // dev code - just add some entities to the map
    for (var ecount = 0; ecount < 5; ecount++) {
      this.getMap().addEntity(Game.EntityGenerator.create('moss'),this.getMap().getRandomWalkableLocation());
      this.getMap().addEntity(Game.EntityGenerator.create('newt'),this.getMap().getRandomWalkableLocation());
    }
  },
  toJSON: function() {
    return Game.UIMode.gamePersistence.BASE_toJSON.call(this);
  },
  fromJSON: function (json) {
    Game.UIMode.gamePersistence.BASE_fromJSON.call(this,json);
  }
};

//#############################################################################
//#############################################################################

Game.UIMode.LAYER_textReading = {
  _storedKeyBinding: '',
  _text: 'default',
  _renderY: 0,
  _renderScrollLimit: 0,
  enter: function () {
    this._renderY = 0;
    this._storedKeyBinding = Game.KeyBinding.getKeyBinding();
    Game.KeyBinding.setKeyBinding('LAYER_textReading');
    Game.refresh();
    Game.specialMessage("[Esc] to exit, [ and ] for scrolling");

    //console.log('game persistence');
  },
  exit: function () {
    Game.KeyBinding.setKeyBinding(this._storedKeyBinding);
    setTimeout(function(){
      Game.refresh();
    }, 1);
  },
  handleInput: function (inputType,inputData) {
    var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);
    // console.log('action binding is');
    // console.dir(actionBinding);
    // console.log('----------');
    if (! actionBinding) {
      return false;
    }

    if (actionBinding.actionKey == 'CANCEL') {
      Game.removeUiMode();
    }
    if        (actionBinding.actionKey == 'DATA_NAV_UP') {
      this._renderY++;
      if (this._renderY > 0) { this._renderY = 0; }
      Game.renderMain();
      return true;
    } else if (actionBinding.actionKey == 'DATA_NAV_DOWN') {
      this._renderY--;
      if (this._renderY < this._renderScrollLimit) { this._renderY = this._renderScrollLimit; }
      Game.renderMain();
      return true;
    }
    /*
     + else if (actionBinding.actionKey == 'PERSISTENCE_NEW') {
 +      this.newGame();
 +    } else if (actionBinding.actionKey == 'CANCEL') {
 +      Game.switchUiMode(Game.UIMode.gamePlay);
 +    }
 +    */
    return false;
  },
  renderOnMain: function (display) {
    var dims = Game.util.getDisplayDim(display);
    var linesTaken = display.drawText(1,this._renderY,Game.UIMode.DEFAULT_COLOR_STR+this._text, dims.w-2);
    // console.log("linesTaken is "+linesTaken);
    // console.log("dims.h is "+dims.h);
    this._renderScrollLimit = dims.h - linesTaken;
    if (this._renderScrollLimit > 0) { this._renderScrollLimit=0; }
  },
  getText: function () {
    return this._text;
  },
  setText: function (t) {
    this._text = t;
    // for (var i = 0; i < 400; i++) {
    //   this._text += ' '+['sit','amet','consectetur','adipiscing elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua'].random();
    // }
  }
};
