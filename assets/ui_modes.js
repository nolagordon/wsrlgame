Game.UIMode = {};

Game.UIMode.gameStart = {
  enter: function () {
    console.log("Game.UIMode.gameStart enter");
  },
  exit: function () {
    console.log("Game.UIMode.gameStart exit");
  },
  handleInput: function (eventType, evt) {
    console.log("Game.UIMode.gameStart handleInput");
    if (evt.charCode !== 0) {
      Game.switchUiMode(Game.UIMode.gamePersistence);
    }
  },
  renderOnMain: function (display) {
    console.log("Game.UIMode.gameStart renderOnMain");
    display.clear();
    display.drawText(4,4,"Welcome to WSRL");
    display.drawText(4,6,"press any key to continue");
  }
};

Game.UIMode.gamePersistence = {
  enter: function () {
    console.log("Game.UIMode.gamePersistence enter");
  },
  exit: function () {
    console.log("Game.UIMode.gamePersistence exit");
  },
  renderOnMain: function (display) {
    display.clear();
    display.drawText(1,3,"press 's' to save the current game, 'l' to load the saved game, or 'n' start a new one");
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
  enter: function () {
    console.log("Game.UIMode.gamePlay enter");
  },
  exit: function () {
    console.log("Game.UIMode.gamePlay exit");
  },
  handleInput: function (eventType,evt) {
    console.log("Game.UIMode.gamePlay handleInput");
    console.log(eventType);
    console.dir(evt);
    if (eventType == "keypress" && evt.keyCode == 13) {
      Game.switchUiMode(Game.UIMode.gameWin);
    } else if (eventType == "keydown" && evt.keyCode == 27) {
      Game.switchUiMode(Game.UIMode.gameLose);
    } else if (eventType == "keydown" && evt.keyCode == 187) {
      Game.switchUiMode(Game.UIMode.gamePersistence);
    }

  },
  renderOnMain: function (display) {
    console.log("Game.UIMode.gamePlay renderOnMain");
    display.clear();
    display.drawText(4,4,"Press [Enter] to win, [Esc] to lose");
    display.drawText(1,5,"press = to save, restore, or start a new game");
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
    console.log("Game.UIMode.gameLose renderOnMain");
    display.clear();
    display.drawText(4,4,"You lost!");
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
    console.log("Game.UIMode.gameWin renderOnMain");
    display.clear();
    display.drawText(4,4,"You WON!!!");
  }
};
