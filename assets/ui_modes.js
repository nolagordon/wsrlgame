Game.UIMode = {};
Game.UIMode.DEFAULT_COLOR_FG = '#fff';
Game.UIMode.DEFAULT_COLOR_BG = '#000';
Game.UIMode.DEFAULT_COLOR_STR = '%c{'+Game.UIMode.DEFAULT_COLOR_FG+'}%b{'+Game.UIMode.DEFAULT_COLOR_BG+'}';

Game.UIMode.gameStart = {
  enter: function () {
    console.log('game starting');
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
    var evtChar = String.fromCharCode(evt.charCode);
    if (evt.keyCode == ROT.VK_S) { // ignore the various modding keys - control, shift, etc.
      this.saveGame();
    } else if (evt.keyCode == ROT.VK_L) {
      this.restoreGame();
    } else if (evt.keyCode == ROT.VK_N) {
      this.newGame();
    }
  },
  restoreGame: function () {
    if (this.localStorageAvailable()) {
      var json_state_data = window.localStorage.getItem(Game._PERSISTENCE_NAMESPACE);
      var state_data = JSON.parse(json_state_data);
      Game.setRandomSeed(state_data._randomSeed);
      Game.UIMode.gamePlay.setupPlay();
      Game.switchUiMode(Game.UIMode.gamePlay);
    }
   },
   saveGame: function (json_state_data) {
     if (this.localStorageAvailable()) {
       window.localStorage.setItem(Game._PERSISTENCE_NAMESPACE, JSON.stringify(Game._game)); // .toJSON()
       Game.switchUiMode(Game.UIMode.gamePlay);
     }
   },
   newGame: function () {
     Game.setRandomSeed(5 + Math.floor(ROT.RNG.getUniform()*100000));
     Game.UIMode.gamePlay.setupPlay();
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
   }
};

Game.UIMode.gamePlay = {
  attr: {
    _map: null,
    _mapWidth: 300,
    _mapHeight: 200,
    _cameraX: 100,
    _cameraY: 100
  },
  enter: function () {
    console.log('game playing');
    Game.Message.clearMessages();
    Game.refresh();
  },
  exit: function () {
    Game.refresh();
  },
  moveCamera: function (dx,dy) {
    this.attr._cameraX = Math.min(Math.max(0,this.attr._cameraX + dx),this.attr._mapWidth);
    this.attr._cameraY = Math.min(Math.max(0,this.attr._cameraY + dy),this.attr._mapHeight);
  },
  handleInput: function (eventType,evt) {
    var pressedKey = String.fromCharCode(inputData.charCode);
    console.log("Game.UIMode.gamePlay handleInput");
    console.log(eventType);
    console.dir(evt);
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
      this.moveCamera(-1,1);
    } else if (pressedKey == '2') {
      this.moveCamera(0,1);
    } else if (pressedKey == '3') {
      this.moveCamera(1,1);
    } else if (pressedKey == '4') {
      this.moveCamera(-1,0);
    } else if (pressedKey == '5') {
      // do nothing / stay still
    } else if (pressedKey == '6') {
      this.moveCamera(1,0);
    } else if (pressedKey == '7') {
      this.moveCamera(-1,-1);
    } else if (pressedKey == '8') {
      this.moveCamera(0,-1);
    } else if (pressedKey == '9') {
      this.moveCamera(1,-1);
    }
    Game.refresh();

  },
  renderOnMain: function (display) {
    var fg = Game.UIMode.DEFAULT_COLOR_FG;
    var bg = Game.UIMode.DEFAULT_COLOR_BG;
    console.log("Game.UIMode.gamePlay renderOnMain");
    display.clear();
    this.attr._map.renderOn(display,this.attr._cameraX,this.attr._cameraY);
    display.drawText(4,4,"Press [Enter] to win, [Esc] to lose",fg,bg);
    display.drawText(1,5,"press = to save, restore, or start a new game",fg,bg);
  },
  setupPlay: function () {
    var mapTiles = Game.util.init2DArray(this.attr._mapWidth,this.attr._mapHeight,Game.Tile.nullTile);
    var generator = new ROT.Map.Cellular(this.attr._mapWidth,this.attr._mapHeight);
    generator.randomize(0.5);

    // repeated cellular automata process
    var totalIterations = 3;
    for (var i = 0; i < totalIterations - 1; i++) {
      generator.create();
    }

    // run again then update map
    generator.create(function(x,y,v) {
      if (v === 1) {
        mapTiles[x][y] = Game.Tile.floorTile;
      } else {
        mapTiles[x][y] = Game.Tile.wallTile;
      }
    });

    // create map from the tiles
    this.attr._map =  new Game.Map(mapTiles);
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
