Game.UIMode = {};
Game.UIMode.DEFAULT_COLOR_FG = '#fff';
Game.UIMode.DEFAULT_COLOR_BG = '#000';
Game.UIMode.DEFAULT_COLOR_STR = '%c{'+Game.UIMode.DEFAULT_COLOR_FG+'}%b{'+Game.UIMode.DEFAULT_COLOR_BG+'}';

Game.UIMode.gameStart = {
  enter: function () {
    //console.log('game starting');
    Game.refresh();
  },
  exit: function () {
    Game.refresh();
  },
  handleInput: function (eventType, evt) {
    console.log("Game.UIMode.gameStart handleInput");
    if (evt.charCode !== 0) {
      Game.switchUiMode(Game.UIMode.gamePersistence);
    }
  },
  renderOnMain: function (display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    console.log("Game.UIMode.gameStart renderOnMain");
    display.clear();
    display.drawText(4,4,"Welcome to WSRL",fg,bg);
    display.drawText(4,6,"press any key to continue",fg,bg);
  }
};

Game.UIMode.gamePersistence = {
  RANDOM_SEED_KEY: 'gameRandomSeed',
  enter: function () {
    Game.refresh();
  },
  exit: function () {
    Game.refresh();
  },
  renderOnMain: function (display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    display.clear();
    display.drawText(1,3,"press 's' to save the current game, 'l' to load the saved game, or 'n' start a new one",fg,bg);
    console.log("TODO: check whether local storage has a game before offering restore");
    console.log("TODO: check whether a game is in progress before offering restore");
  },
  handleInput: function(eventType, evt){
    if (eventType == 'keypress'){
      var evtChar = String.fromCharCode(evt.charCode);
      if (evtChar == 's') { // ignore the various modding keys - control, shift, etc.
        this.saveGame();
      } else if (evtChar == 'l') {
        this.restoreGame();
      } else if (evtChar == 'n') {
        this.newGame();
      }
    } else if (eventType == 'keydown'){
      if (evt.keyCode == 27) { // 'Escape'
        Game.switchUiMode(Game.UIMode.gamePlay);
      }
    }
  },
  restoreGame: function () {
    if (this.localStorageAvailable()) {
      var json_state_data = window.localStorage.getItem(Game._PERSISTENCE_NAMESPACE);
      var state_data = JSON.parse(json_state_data);

      //console.log('state data: ');
      //console.dir(state_data);

      // game level stuff
      Game.setRandomSeed(state_data[this.RANDOM_SEED_KEY]);

      // maps
      for (var mapId in state_data.MAP) {
        if (state_data.MAP.hasOwnProperty(mapId)) {
          var mapAttr = JSON.parse(state_data.MAP[mapId]);
          //console.log("restoring map "+mapId+" with attributes:");
          //console.dir(mapAttr);
          Game.DATASTORE.MAP[mapId] = new Game.Map(mapAttr._mapTileSetName);
          Game.DATASTORE.MAP[mapId].fromJSON(state_data.MAP[mapId]);
        }
      }

      // entities
      for (var entityId in state_data.ENTITY) {
        if (state_data.ENTITY.hasOwnProperty(entityId)) {
          var entAttr = JSON.parse(state_data.ENTITY[entityId]);
          Game.DATASTORE.ENTITY[entityId] = Game.EntityGenerator.create(entAttr._generator_template_key);
          Game.DATASTORE.ENTITY[entityId].fromJSON(state_data.ENTITY[entityId]);
        }
      }

      // game play et al
      Game.UIMode.gamePlay.attr = state_data.GAME_PLAY;
      Game.Message.attr = state_data.MESSAGES;

      Game.switchUiMode(Game.UIMode.gamePlay);
    }
   },
   saveGame: function () {
     if (this.localStorageAvailable()) {
       Game.DATASTORE.GAME_PLAY = Game.UIMode.gamePlay.attr;
       Game.DATASTORE.MESSAGES = Game.Message.attr;
       window.localStorage.setItem(Game._PERSISTENCE_NAMESPACE, JSON.stringify(Game.DATASTORE));
       Game.switchUiMode(Game.UIMode.gamePlay);
     }
   },
   newGame: function () {
     Game.setRandomSeed(5 + Math.floor(Game.TRANSIENT_RNG.getUniform()*100000));
     Game.UIMode.gamePlay.setupNewGame();
     Game.switchUiMode(Game.UIMode.gamePlay);
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
     var json = JSON.stringify(state);
     /*var json = {};
     for (var at in state) {
       if (state.hasOwnProperty(at)) {
         if (state[at] instanceof Object && 'toJSON' in state[at]) {
           json[at] = state[at].toJSON();
         } else {
           json[at] = state[at];
         }
       }
     }*/
     return json;
   },
   BASE_fromJSON: function (json,state_hash_name) {
     var using_state_hash = 'attr';
     if (state_hash_name) {
       using_state_hash = state_hash_name;
     }
     this[using_state_hash] = JSON.parse(json);
     /*for (var at in this[using_state_hash]) {
       if (this[using_state_hash].hasOwnProperty(at)) {
         if (this[using_state_hash][at] instanceof Object && 'fromJSON' in this[using_state_hash][at]) {
           this[using_state_hash][at].fromJSON(json[at]);
         } else {
           this[using_state_hash][at] = json[at];
         }
       }
     }*/
   }
};

Game.UIMode.gamePlay = {
  attr: {
    _mapId: '',
    _cameraX: 100,
    _cameraY: 100,
    _avatarId: ''
  },
  JSON_KEY: 'uiMode_gamePlay',
  enter: function () {
    //console.log('game playing');
    //Game.Message.clearMessages();
    if (this.attr._avatarId) {
      this.setCameraToAvatar();
    }
    Game.refresh();
  },
  exit: function () {
    Game.refresh();
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
    Game.refresh();
  },
  setCameraToAvatar: function () {
    this.setCamera(this.getAvatar().getX(),this.getAvatar().getY());
  },
  handleInput: function (eventType,evt) {
    var pressedKey = String.fromCharCode(evt.charCode);

    if(eventType == 'keypress' || eventType == 'keydown'){
      //Game.Message.sendMessage("you pressed the '"+String.fromCharCode(evt.charCode)+"' key");
      if (eventType == "keypress" && evt.keyCode == 13) {
        Game.switchUiMode(Game.UIMode.gameWin);
        return;
      } else if (eventType == "keydown" && evt.keyCode == 27) {
        Game.switchUiMode(Game.UIMode.gameLose);
        return;
      } else if (eventType == "keydown" && evt.keyCode == 187) {
        Game.switchUiMode(Game.UIMode.gamePersistence);
        return;
      } else if (pressedKey == '1') {
        Game.Message.ageMessages();
        this.moveAvatar(-1,1);
      } else if (pressedKey == '2') {
        Game.Message.ageMessages();
        this.moveAvatar(0,1);
      } else if (pressedKey == '3') {
        Game.Message.ageMessages();
        this.moveAvatar(1,1);
      } else if (pressedKey == '4') {
        Game.Message.ageMessages();
        this.moveAvatar(-1,0);
      } else if (pressedKey == '5') {
        // do nothing / stay still
        Game.renderMessage();
      } else if (pressedKey == '6') {
        Game.Message.ageMessages();
        this.moveAvatar(1,0);
      } else if (pressedKey == '7') {
        Game.Message.ageMessages();
        this.moveAvatar(-1,-1);
      } else if (pressedKey == '8') {
        Game.Message.ageMessages();
        this.moveAvatar(0,-1);
      } else if (pressedKey == '9') {
        Game.Message.ageMessages();
        this.moveAvatar(1,-1);
      }
    }
  },
  renderOnMain: function (display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    console.log("Game.UIMode.gamePlay renderOnMain");
    display.clear();
    this.getMap().renderOn(display,this.attr._cameraX,this.attr._cameraY);
    //display.drawText(4,4,"Press [Enter] to win, [Esc] to lose",fg,bg);
    //display.drawText(1,5,"press = to save, restore, or start a new game",fg,bg);
    //this.renderAvatar(display);
  },
  //renderAvatar: function(display) {
    //Game.Symbol.AVATAR.draw(display,this.attr._avatar.getX()-this.attr._cameraX+display._options.width/2,
      //                              this.attr._avatar.getY()-this.attr._cameraY+display._options.height/2);
  //},
  renderAvatarInfo: function (display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    display.drawText(1,2,"avatar x: "+this.getAvatar().getX(),fg,bg); // DEV
    display.drawText(1,3,"avatar y: "+this.getAvatar().getY(),fg,bg); // DEV
    display.drawText(1,4,"turns: "+this.getAvatar().getTurns(),fg,bg);
    display.drawText(1,5,"HP: "+this.getAvatar().getCurHp(),fg,bg);
    display.drawText(1,6,"hunger: "+this.getAvatar().statusToString(),fg,bg);
  },
  moveAvatar: function (dx,dy) {
    if (this.getAvatar().tryWalk(this.getMap(),dx,dy)) {
      this.setCameraToAvatar();
    }
  },
  setupNewGame: function () {
    Game.Message.clearMessages();
    this.setMap(new Game.Map('caves1'));
    this.setAvatar(Game.EntityGenerator.create('avatar'));

    this.getMap().addEntity(this.getAvatar(),this.getMap().getRandomWalkableLocation());
    this.setCameraToAvatar();

    // dev code - just add some entities to the map
    for (var ecount = 0; ecount < 80; ecount++) {
      this.getMap().addEntity(Game.EntityGenerator.create('moss'),this.getMap().getRandomWalkableLocation());
    }
  },
  toJSON: function() {
    return Game.UIMode.gamePersistence.BASE_toJSON.call(this);
  },
  fromJSON: function (json) {
    Game.UIMode.gamePersistence.BASE_fromJSON.call(this,json);
  }
};

Game.UIMode.gameLose = {
  enter: function () {
    console.log("Game.UIMode.gameLose enter");
  },
  exit: function () {
    console.log("Game.UIMode.gameLose exit");
  },
  handleInput: function () {
    console.log("Game.UIMode.gameLose handleInput");
  },
  renderOnMain: function (display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    console.log("Game.UIMode.gameLose renderOnMain");
    display.clear();
    display.drawText(4,4,"You lost!",fg,bg);
  }
};

Game.UIMode.gameWin = {
  enter: function () {
    console.log("Game.UIMode.gameWin enter");
  },
  exit: function () {
    console.log("Game.UIMode.gameWin exit");
  },
  handleInput: function () {
    console.log("Game.UIMode.gameWin handleInput");
  },
  renderOnMain: function (display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    console.log("Game.UIMode.gameWin renderOnMain");
    display.clear();
    display.drawText(4,4,"You WON!!!",fg,bg);
  }
};
