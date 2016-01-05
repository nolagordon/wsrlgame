console.log("hello console");

window.onload = function() {
    console.log("starting WSRL - window loaded");
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
        Game.switchUiMode(Game.UIMode.gameStart);
    }
};

var Game = {
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
  _randomSeed: 0,
  init: function () {
    this._game = this;
    console.log("WSRL Live Initialization");
    // this.DISPLAYS.main.o = new ROT.Display({width:this.DISPLAYS.main.w, height:this.DISPLAYS.main.h});
    for (var displayName in this.DISPLAYS) {
      if (this.DISPLAYS.hasOwnProperty(displayName)) {
        this.DISPLAYS[displayName].o = new ROT.Display({width:this.DISPLAYS[displayName].w, height:this.DISPLAYS[displayName].h});
      }
    }

    var bindEventToScreen = function(eventType) {
      window.addEventListener(eventType, function(evt) {
        Game.eventHandler(eventType, evt);
      });
     };
     // Bind keyboard input events
     bindEventToScreen('keypress');
     bindEventToScreen('keydown');
     //        bindEventToScreen('keyup');

    Game.switchUiMode(Game.UIMode.gameStart);
    this.renderAll();
  },
  getRandomSeed: function () {
    return this._randomSeed;
  },
  setRandomSeed: function (s) {
    this._randomSeed = s;
    console.log("using random seed "+this._randomSeed);
    ROT.RNG.setSeed(this._randomSeed);
  },
  getDisplay: function(displayName) {
    return this.DISPLAYS[displayName].o;
  },
  renderAll: function() {
    this.renderAvatar();
    this.renderMain();
    this.renderMessage();
  },
  renderAvatar: function() {
    if (this._curUiMode !== null && this._curUiMode.hasOwnProperty('renderOnAvatar')) {
      this._curUiMode.renderOnAvatar(this.DISPLAYS.avatar.o);
    } else {
      this.DISPLAYS.avatar.o.drawText(2,1,"avatar display");
    }
  },
  renderMain: function() {
    if (this._curUiMode !== null && this._curUiMode.hasOwnProperty('renderOnMain')) {
      this._curUiMode.renderOnMain(this.DISPLAYS.main.o);
    } else {
      this.DISPLAYS.main.o.drawText(2,1,"main display");
    }
  },
  renderMessage: function() {
    // this.DISPLAYS.message.o.drawText(2,3,"message display");
    Game.Message.renderOn(this.DISPLAYS.message.o);
  },
  switchUiMode: function (newMode) {
    if (this._curUiMode !== null) {
      this._curUiMode.exit();
    }
    this._curUiMode = newMode;
    if (this._curUiMode !== null) {
      this._curUiMode.enter();
    }
    this.renderAll();
  },
  eventHandler: function(eventType, evt) {
    console.log(eventType);
    console.dir(evt);
    if (this._curUiMode !== null && this._curUiMode.hasOwnProperty('handleInput')) {
      this._curUiMode.handleInput(eventType, evt);
    }
  }
};
