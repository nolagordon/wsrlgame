window.onload = function() {
    //console.log("starting WSRL - window loaded");
    // Check if rot.js can work on this browser
    if (!ROT.isSupported()) {
        alert("The rot.js library isn't supported by your browser.");
    } else {
        // Initialize the game
        Game.init();

        // Add the containers to our HTML page
        document.getElementById('wsrl-avatar-display').appendChild(   Game.getDisplay('avatar').getContainer());
        document.getElementById('wsrl-main-display').appendChild(   Game.getDisplay('main').getContainer());
        document.getElementById('wsrl-message-display').appendChild(   Game.getDisplay('message').getContainer());

        Game.Message.sendMessage("Welcome to WSRL!");
        Game.switchUiMode('gameStart');
    }
};

var Game = {
  _PERSISTENCE_NAMESPACE: 'wsrlgame',

  _DISPLAY_SPACING: 1.1,
  DISPLAYS: {
    avatar: {
      w: 20,
      h: 24,
      o: null
    },
    main: {
      w: 80,
      h: 24,
      o: null
    },
    message: {
      w: 100,
      h: 6,
      o: null
    }
  },
  _game: null,
  _curUiMode: null,
  _uiModeNameStack: [],
  _randomSeed: 0,
  TRANSIENT_RNG: null,

  DATASTORE: {},

  DeadAvatar: null,

  Scheduler: null,
  TimeEngine: null,

  init: function () {
    this._game = this;
    this.TRANSIENT_RNG = ROT.RNG.clone();
    Game.setRandomSeed(5 + Math.floor(this.TRANSIENT_RNG.getUniform()*100000));

    //this.initializeTimingEngine();

    console.log("WSRL Live Initialization");
    // this.DISPLAYS.main.o = new ROT.Display({width:this.DISPLAYS.main.w, height:this.DISPLAYS.main.h});
    for (var displayName in this.DISPLAYS) {
      if (this.DISPLAYS.hasOwnProperty(displayName)) {
        this.DISPLAYS[displayName].o = new ROT.Display({width:this.DISPLAYS[displayName].w, height:this.DISPLAYS[displayName].h});
      }
    }

    Game.switchUiMode('gameStart');
    this.renderAll();

    var game = this;
    var bindEventToUiMode = function(event) {
      window.addEventListener(event, function(e) {
        // send event to the ui mode if there is one
        if (game.getCurUiMode() !== null) {
          game.getCurUiMode().handleInput(event, e);
        }
      });
    };
    // Bind keyboard input events
    bindEventToUiMode('keypress');
    bindEventToUiMode('keydown');
    // bindEventToUiMode('keyup');
  },
  initializeTimingEngine: function () {
    // NOTE: single, central timing system for now - might have to refactor this later to deal with mutliple map stuff
    Game.Scheduler = new ROT.Scheduler.Action();
    Game.TimeEngine = new ROT.Engine(Game.Scheduler);
  },
  getRandomSeed: function () {
    return this._randomSeed;
  },
  setRandomSeed: function (s) {
    this._randomSeed = s;
    console.log("using random seed "+this._randomSeed);
    this.DATASTORE[Game.UIMode.gamePersistence.RANDOM_SEED_KEY] = this._randomSeed;
    ROT.RNG.setSeed(this._randomSeed);
  },
  getDisplay: function(displayName) {
    return this.DISPLAYS[displayName].o;
  },
  getDisplayHeight: function (displayId) {
    if (this.DISPLAYS.hasOwnProperty(displayId)) {
      return this.DISPLAYS[displayId].h;
    }
    return null;
  },
  refresh: function () {
    this.renderAll();
  },
  renderAll: function() {
    this.renderAvatar();
    this.renderMain();
    this.renderMessage();
  },
  renderAvatar: function() {
    this.DISPLAYS.avatar.o.clear();
    if (this.getCurUiMode() === null) {
      return;
    }


    if ('renderAvatarInfo' in this.getCurUiMode()) {
      this.getCurUiMode().renderAvatarInfo(this.DISPLAYS.avatar.o);
    }
  },
  renderMain: function() {
    this.DISPLAYS.main.o.clear();
    if (this.getCurUiMode() === null) {
      return;
    }

    console.dir(this.getCurUiMode());
    if ('renderOnMain' in this.getCurUiMode()) {
      this.getCurUiMode().renderOnMain(this.DISPLAYS.main.o);
    }
  },
  renderMessage: function() {
    // this.DISPLAYS.message.o.drawText(2,3,"message display");
    Game.Message.renderOn(this.DISPLAYS.message.o);
  },

  hideDisplayMessage: function() {
    this.DISPLAYS.message.o.clear();
  },
  specialMessage: function(msg) {
    this.DISPLAYS.message.o.clear();
    this.DISPLAYS.message.o.drawText(1,1,'%c{#fff}%b{#000}'+msg,79);
  },

  getAvatar: function () {
    return Game.UIMode.gamePlay.getAvatar();
  },

  getCurUiMode: function () {
    var uiModeName = this._uiModeNameStack[0];
    if (uiModeName) {
      return Game.UIMode[uiModeName];
    }
    return null;
  },
  getCurUiModeName: function () {
    var uiModeName = this._uiModeNameStack[0];
    if (uiModeName) {
      return uiModeName;
    }
    return null;
  },
  switchUiMode: function (newUiModeName) {
    if (newUiModeName.startsWith('LAYER_')) {
      console.log('cannot switchUiMode to layer '+newUiModeName);
      return;
    }
    var curMode = this.getCurUiMode();
    if (curMode !== null) {
      curMode.exit();
    }
    this._uiModeNameStack[0] = newUiModeName;
    var newMode = Game.UIMode[newUiModeName];
    if (newMode) {
      newMode.enter();
    }
    //this.renderDisplayAll();
  },
  addUiMode: function (newUiModeLayerName) {
    if (! newUiModeLayerName.startsWith('LAYER_')) {
      console.log('addUiMode not possible for non-layer '+newUiModeLayerName);
      return;
    }
    // var curMode = this.getCurUiMode();
    // if (curMode !== null) {
    //   curMode.exit();
    // }
    this._uiModeNameStack.unshift(newUiModeLayerName);
    var newMode = Game.UIMode[newUiModeLayerName];
    if (newMode) {
      newMode.enter();
    }
    //this.renderDisplayAll();
  },
  removeUiMode: function () {
    var curMode = this.getCurUiMode();
    if (curMode !== null) {
      curMode.exit();
    }
    this._uiModeNameStack.shift();
    // curMode = this.getCurUiMode();
    // if (curMode !== null) {
    //   curMode.enter();
    // }
    //this.renderDisplayAll();
  },
  removeUiModeAllLayers: function () {
    var curModeName = this.getCurUiModeName();
    while ((curModeName !== null) && curModeName.startsWith('LAYER_')) {
      var curMode = this.getCurUiMode();
      curMode.exit();
      this._uiModeNameStack.shift();
      curModeName = this.getCurUiModeName();
    }
    // curMode = this.getCurUiMode();
    // if (curMode !== null) {
    //   curMode.enter();
    // }
    // this.renderDisplayAll();
  },

  /*toJSON: function() {
    var json = {};
    json._randomSeed = this._randomSeed;
    json[Game.UIMode.gamePlay.JSON_KEY] = Game.UIMode.gamePlay.toJSON();
    return json;
  },*/

  eventHandler: function(eventType, evt) {
    // When an event is received have the current ui handle it
    if (this.getCurUiMode() !== null) {
      this.getCurUiMode().handleInput(eventType, evt);
    }
  }
};
