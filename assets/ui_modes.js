Game.UIMode = {};
Game.UIMode.DEFAULT_COLOR_FG = '#cceeff';
Game.UIMode.DEFAULT_COLOR_BG = '#19afdb';
Game.UIMode.DEFAULT_COLOR_STR = '%c{'+'#fff'+'}%b{'+'#000'+'}';
Game.UIMode.TOTAL_FLOORS = 3;

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
    display.drawText(1,1,Game.UIMode.DEFAULT_COLOR_STR+"You work on the top floor of an ice cream factory. Unfortunately, the recent nuclear explosion at the neighboring weapons factory has brought all of the ice cream to life. Escape or die a frosty death!");
    display.drawText(1,8,Game.UIMode.DEFAULT_COLOR_STR+"Press any key to continue.");
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
      // Game.util.cdebug(state_data);

      this._resetGameDataStructures();

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

      // items
      for (var itemId in state_data.ITEM) {
        if (state_data.ITEM.hasOwnProperty(itemId)) {
          var itemAttr = JSON.parse(state_data.ITEM[itemId]);
          var newI = Game.ItemGenerator.create(itemAttr._generator_template_key,itemAttr._id);
          Game.DATASTORE.ITEM[itemId] = newI;
          Game.DATASTORE.ITEM[itemId].fromJSON(state_data.ITEM[itemId]);
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
       // Game.util.cdebug(Game.DATASTORE);
       Game.Message.sendMessage('game saved');
       Game.switchUiMode('gamePlay');
     }
   },
   newGame: function () {
     this._resetGameDataStructures();
     Game.setRandomSeed(5 + Math.floor(Game.TRANSIENT_RNG.getUniform()*100000));
     Game.UIMode.gamePlay.setupNewGame();
     //Game.Message.sendMessage('new game started');
     Game.switchUiMode('gamePlay');

     Game.Message.sendMessage("Fight your way out of the ice cream factory!");
   },
   _resetGameDataStructures: function () {
     Game.DATASTORE = {};
     Game.DATASTORE.MAP = {};
     Game.DATASTORE.ENTITY = {};
     Game.DATASTORE.ITEM = {};
     Game.initializeTimingEngine();
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
    Game.TimeEngine.lock();
    Game.renderAvatar();
    Game.renderMain();
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
    Game.Message.clearMessages();
  }
};

//#############################################################################
//#############################################################################

Game.UIMode.gameLose = {
  enter: function () {
    console.log('game losing');
    Game.TimeEngine.lock();
    Game.renderAvatar();
    Game.renderMain();
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
    Game.Message.clearMessages();
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

    else if (actionBinding.actionKey == 'INVENTORY') {
      Game.addUiMode('LAYER_inventoryListing');
    } else if (actionBinding.actionKey == 'PICKUP') {
      var pickUpList = Game.util.objectArrayToIdArray(this.getAvatar().getMap().getItems(this.getAvatar().getPos()));
      if (pickUpList.length <= 1) {
        var pickupRes = this.getAvatar().pickupItems(pickUpList);
        tookTurn = pickupRes.numItemsPickedUp > 0;
      } else {
        Game.addUiMode('LAYER_inventoryPickup');
      }
    } else if (actionBinding.actionKey == 'DROP') {
      Game.addUiMode('LAYER_inventoryDrop');
    } else if (actionBinding.actionKey == 'EAT') {
      Game.addUiMode('LAYER_inventoryEat');
    } else if (actionBinding.actionKey == 'EXAMINE') {
      Game.addUiMode('LAYER_inventoryExamine');
    }

    else if (actionBinding.actionKey   == 'CHANGE_BINDINGS') {
      Game.KeyBinding.swapToNextKeyBinding();
    } else if (actionBinding.actionKey == 'PERSISTENCE') {
      Game.switchUiMode('gamePersistence');
    } else if (actionBinding.actionKey == 'HELP') {
      Game.UIMode.LAYER_textReading.setText(Game.KeyBinding.getBindingHelpText());
      Game.addUiMode('LAYER_textReading');
    } else if (actionBinding.actionKey == 'CHANGE_FLOOR') {
      // Check whether the player is occupying a stairs tile
      // If so, change their floor accordingly
      var avatarPos = this.getAvatar().getPos();
      if (this.getMap().getTile(avatarPos).getName() === 'stairsDown'){
        if (this.getMap().getFloorNum() === 1) {
          Game.Message.sendMessage("Congratulations! You escaped!");
          Game.switchUiMode('gameWin');
        } else {
          this.generateNewLevel(this.getMap().getFloorNum()-1);
          Game.Message.sendMessage("The stairs you just climbed down look very icy from this angle. Climbing back up seems too dangerous.");
        }
      } else {
        Game.Message.sendMessage("There are no stairs to climb here");
      }
    }

    if (tookTurn) {
      this.getAvatar().raiseSymbolActiveEvent('actionDone');
      Game.Message.ageMessages();
      return true;
    }
    return false;
  },
  renderOnMain: function (display) {
    display.clear();
    var seenCells = this.getAvatar().getVisibleCells();
    this.getMap().renderOn(display,this.attr._cameraX,this.attr._cameraY,{
      visibleCells:seenCells,
      maskedCells:this.getAvatar().getRememberedCoordsForMap()
    });
    this.getAvatar().rememberCoords(seenCells);
  },
  renderAvatarInfo: function (display) {
    // feels like this should be encapsulated somewhere else, but I don't really know where - perhaps in the PlayerActor mixin?
    var av = this.getAvatar();
    var y = 0;
    y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"ATTACK");
    y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"Accuracy: "+av.getAttackHit());
    y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"Power: "+av.getAttackDamage());
    y++;
    y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"DEFENSE");
    y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"Dodging: "+av.getAttackAvoid());
    y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"Toughness: "+av.getDamageMitigation());
    y++;
    y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"LIFE: "+av.getCurHp()+"/"+av.getMaxHp());
    y++;
    y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"MOVES: "+av.getTurns());
    y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+"KILLS: "+av.getTotalKills());
    y++;
    y += display.drawText(1,y,Game.UIMode.DEFAULT_COLOR_STR+av.getHungerStateDescr());
  },
  moveAvatar: function (pdx,pdy) {
    // console.log('moveAvatar '+pdx+','+pdy);
    var moveResp = this.getAvatar().raiseSymbolActiveEvent('adjacentMove',{dx:pdx,dy:pdy});
    // if (this.getAvatar().tryWalk(this.getMap(),dx,dy)) {
    if (moveResp.madeAdjacentMove && moveResp.madeAdjacentMove[0]) {
      this.setCameraToAvatar();
      return true;
    }
    return false;
  },
  generateNewLevel: function(floorNum) {
    this.setMap(new Game.Map('caves1'));
    this.getMap().setFloorNum(floorNum);

    this.getMap().addEntity(this.getAvatar(),this.getMap().getRandomWalkablePosition());
    this.setCameraToAvatar();

    var itemPos = '';
    // dev code - just add some entities to the map
    for (var ecount = 0; ecount < 20; ecount++) {
      this.getMap().addEntity(Game.EntityGenerator.create('ice'),this.getMap().getRandomWalkablePosition());
      this.getMap().addEntity(Game.EntityGenerator.create('vanilla scoop'),this.getMap().getRandomWalkablePosition());
      this.getMap().addEntity(Game.EntityGenerator.create('strawberry scoop'),this.getMap().getRandomWalkablePosition());
      this.getMap().addEntity(Game.EntityGenerator.create('chocolate scoop'),this.getMap().getRandomWalkablePosition());

      itemPos = this.getMap().getRandomWalkablePosition();
      this.getMap().addItem(Game.ItemGenerator.create('rock'),itemPos);

      itemPos = this.getMap().getRandomWalkablePosition();
      this.getMap().addItem(Game.ItemGenerator.create('maraschino cherry'),itemPos);
    }

    Game.Message.sendMessage("You've reached floor " + floorNum + ".");
    this.getMap().addItem(Game.ItemGenerator.create('rock'),itemPos);

    this.getMap().addShop(this.getAvatar().getPos());
    // Get the shop entity and add merchanise to the shop
    var shop = this.getMap().getEntity(this.getMap().getShopPos());
    shop.addMerchandise(Game.ItemGenerator.create('maraschino cherry'), 10);
    shop.addMerchandise(Game.ItemGenerator.create('maraschino cherry'), 10);
    shop.addMerchandise(Game.ItemGenerator.create('maraschino cherry'), 10);
    shop.addMerchandise(Game.ItemGenerator.create('chocolate ice cream'), 100);

    this.getMap().addStairs(this.getAvatar().getPos());

    // for (var ti=0; ti<30;ti++) {
    //   Game.getAvatar().addInventoryItems([Game.ItemGenerator.create('rock')]);
    // }

    // end dev code
    ////////////////////////////////////////////////////

    Game.renderMain();
  },
  setupNewGame: function () {
    // Set the current floor to the max number of floors we want in the game
    // TODO: make this a constant somewhere else in the code?
    Game.Message.clearMessages();
    this.setAvatar(Game.EntityGenerator.create('avatar'));
    this.generateNewLevel(Game.UIMode.TOTAL_FLOORS);
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
  }
};

//#############################################################################
//#############################################################################

Game.UIMode.LAYER_itemListing = function(template) {
  template = template ? template : {};

  this._caption = template.caption || 'Items';
  this._processingFunction = template.processingFunction;
  this._filterListedItemsOnFunction = template.filterListedItemsOn || function(itemId) {
    return itemId;
  };
  this._canSelectItem = template.canSelect || false;
  this._canSelectMultipleItems = template.canSelectMultipleItems || false;
  this._hasNoItemOption = template.hasNoItemOption || false;
  this._origItemIdList= template.itemIdList ? JSON.parse(JSON.stringify(template.itemIdList)) : [];
  this._itemIdList = [];
  this._runFilterOnItemIdList();
  this._keyBindingName= template.keyBindingName || 'LAYER_itemListing';

  this._selectedItemIdxs= [];
  this._displayItemsStartIndex = 0;
  this._displayItems = [];
  this._displayMaxNum = Game.getDisplayHeight('main')-5;
  this._numItemsShown = 0;

  this._shopMode = template.shopMode || false;
};

Game.UIMode.LAYER_itemListing.prototype._runFilterOnItemIdList = function () {
  this._itemIdList = [];
  for (var i = 0; i < this._origItemIdList.length; i++) {
    if (this._filterListedItemsOnFunction(this._origItemIdList[i])) {
      this._itemIdList.push(this._origItemIdList[i]);
    }
  }
};

Game.UIMode.LAYER_itemListing.prototype.enter = function () {
  this._storedKeyBinding = Game.KeyBinding.getKeyBinding();
  Game.KeyBinding.setKeyBinding(this._keyBindingName);
  if ('doSetup' in this) {
    this.doSetup();
  }
  Game.refresh();
};
Game.UIMode.LAYER_itemListing.prototype.exit = function () {
  Game.KeyBinding.setKeyBinding(this._storedKeyBinding);
  setTimeout(function(){
    Game.refresh();
  }, 1);
};
Game.UIMode.LAYER_itemListing.prototype.setup = function(setupParams) {
  setupParams = setupParams ? setupParams : {};

  if (setupParams.hasOwnProperty('caption')) {
    this._caption = setupParams.caption;
  }
  if (setupParams.hasOwnProperty('processingFunction')) {
    this._processingFunction = setupParams.processingFunction;
  }
  if (setupParams.hasOwnProperty('filterListedItemsOn')) {
    this._filterListedItemsOnFunction = setupParams.filterListedItemsOn;
    this._runFilterOnItemIdList();
  }
  if (setupParams.hasOwnProperty('canSelect')) {
    this._canSelectItem = setupParams.canSelect;
  }
  if (setupParams.hasOwnProperty('canSelectMultipleItems')) {
    this._canSelectMultipleItems = setupParams.canSelectMultipleItems;
  }
  if (setupParams.hasOwnProperty('hasNoItemOption')) {
    this._hasNoItemOption = setupParams.hasNoItemOption;
  }
  if (setupParams.hasOwnProperty('itemIdList')) {
    this._origItemIdList= JSON.parse(JSON.stringify(setupParams.itemIdList));
    this._runFilterOnItemIdList();
  }
  if (setupParams.hasOwnProperty('keyBindingName')) {
    this._keyBindingName= setupParams.keyBindingName;
  }

  this._selectedItemIdxs= [];
  this._displayItemsStartIndex = 0;
  this._displayItems = [];
  this.determineDisplayItems();
  this._numItemsShown = 0;

};

Game.UIMode.LAYER_itemListing.prototype.getItemList = function () {
  return this._itemIdList;
};
Game.UIMode.LAYER_itemListing.prototype.setItemList = function (itemList) {
  this._itemIdList = itemList;
};
Game.UIMode.LAYER_itemListing.prototype.getKeyBindingName = function () {
  return this._keyBindingName;
};
Game.UIMode.LAYER_itemListing.prototype.setKeyBindingName = function (keyBindingName) {
  this._keyBindingName = keyBindingName;
};

Game.UIMode.LAYER_itemListing.prototype.determineDisplayItems = function() {
  this._displayItems = this._itemIdList.slice(this._displayItemsStartIndex,this._displayItemsStartIndex+this._displayMaxNum).map(function(itemId) { return Game.DATASTORE.ITEM[itemId]; });
};
Game.UIMode.LAYER_itemListing.prototype.handlePageUp = function() {
  this._displayItemsStartIndex -= this._displayMaxNum;
  if (this._displayItemsStartIndex < 0) {
    this._displayItemsStartIndex = 0;
  }
  this.determineDisplayItems();
  Game.refresh();
};
Game.UIMode.LAYER_itemListing.prototype.handlePageDown = function() {
  var numUnseenItems = this._itemIdList.length - (this._displayItemsStartIndex + this._displayItems.length);
  this._displayItemsStartIndex += this._displayMaxNum;
  if (this._displayItemsStartIndex > this._itemIdList.length) {
    this._displayItemsStartIndex -= this._displayMaxNum;
  }
  this.determineDisplayItems();
  Game.refresh();
};

Game.UIMode.LAYER_itemListing.prototype.getCaptionText = function () {
  var captionText = 'Items';
  if (typeof this._caption == 'function') {
    captionText = this._caption();
  } else {
    captionText = this._caption;
  }
  return captionText;
};

Game.UIMode.LAYER_itemListing.prototype.renderOnMain = function (display) {
  var selectionLetters = 'abcdefghijklmnopqrstuvwxyz';

  display.drawText(0, 0, '%c{#fff}%b{#000}You have ' + Game.UIMode.gamePlay.getAvatar().getBalance() + ' sprinkles');

  display.drawText(0, 2, Game.UIMode.DEFAULT_COLOR_STR + this.getCaptionText());

  if (this._displayItems.length < 1) {
    display.drawText(0, 4, Game.UIMode.DEFAULT_COLOR_STR + 'nothing for '+ this.getCaptionText().toLowerCase());
    return;
  }

  var row = 2;

  if (this._hasNoItemOption) {
    display.drawText(0, 1 + row, Game.UIMode.DEFAULT_COLOR_STR + '0 - no item');
    row++;
  }
  if (this._displayItemsStartIndex > 0) {
    display.drawText(0, 1 + row, '%c{#fff}%b{#000}[ for more');
    row++;
  }
  this._numItemsShown = 0;
  for (var i = 0; i < this._displayItems.length; i++) {
    var trueItemIndex = this._displayItemsStartIndex + i;
    if (this._displayItems[i]) {
      var selectionLetter = selectionLetters.substring(i, i + 1);

      // If we have selected an item, show a +, else show a space between the selectionLetter and the item's name.
      var selectionState = (this._canSelectItem && this._canSelectMultipleItems && this._selectedItemIdxs[trueItemIndex]) ? '+' : ' ';

      var item_symbol = this._displayItems[i].getRepresentation("#000")+Game.UIMode.DEFAULT_COLOR_STR;
      var item_representation = Game.UIMode.DEFAULT_COLOR_STR + selectionLetter + ' ' + selectionState + ' ' + item_symbol + ' ' +this._displayItems[i].getName();
      var shop = Game.UIMode.gamePlay.getMap().getEntity(Game.UIMode.gamePlay.getMap().getShopPos());
      if (this._shopMode) {
        item_representation = item_representation + '    ' + shop.getPrice(this._displayItems[i]) + ' sprinkles';
      }
      display.drawText(0, 1 + row, item_representation);
      row++;
      this._numItemsShown++;
    }
  }
  if ((this._displayItemsStartIndex + this._displayItems.length) < this._itemIdList.length) {
    display.drawText(0, 1 + row, '%c{#fff}%b{#000}] for more');
    row++;
  }
};

Game.UIMode.LAYER_itemListing.prototype.executeProcessingFunction = function() {
  // Gather the selected item ids
  var selectedItemIds = [];
  for (var selectionIndex in this._selectedItemIdxs) {
    if (this._selectedItemIdxs.hasOwnProperty(selectionIndex)) {
      selectedItemIds.push(this._itemIdList[selectionIndex]);
    }
  }
  Game.removeUiModeAllLayers();
  // Call the processing function and end the player's turn if it returns true.
  if (this._processingFunction(selectedItemIds)) {
    Game.getAvatar().raiseSymbolActiveEvent('actionDone');
    setTimeout(function(){
      Game.Message.ageMessages();
    }, 1);
  }
};

Game.UIMode.LAYER_itemListing.prototype.handleInput = function (inputType,inputData) {
  var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);
  if (! actionBinding) {
    if ((inputType === 'keydown') && this._canSelectItem && inputData.keyCode >= ROT.VK_A && inputData.keyCode <= ROT.VK_Z) {
      // Check if it maps to a valid item by subtracting 'a' from the character to know what letter of the alphabet we used.
      var index = inputData.keyCode - ROT.VK_A;
      if (index >= this._numItemsShown) {
        return false;
      }
      var trueItemIndex = this._displayItemsStartIndex + index;
      if (this._itemIdList[trueItemIndex]) {
        // If multiple selection is allowed, toggle the selection status, else select the item and process it
        if (this._canSelectMultipleItems) {
          if (this._selectedItemIdxs[trueItemIndex]) {
            delete this._selectedItemIdxs[trueItemIndex];
          } else {
            this._selectedItemIdxs[trueItemIndex] = true;
          }
          Game.refresh();
        } else {
          this._selectedItemIdxs[trueItemIndex] = true;
          this.executeProcessingFunction();
        }
      } else {
        return false;
      }
    }
  }

  if (actionBinding.actionKey == 'CANCEL') {
     Game.removeUiMode();
   } else if (actionBinding.actionKey == 'PROCESS_SELECTIONS') {
     this.executeProcessingFunction();
   } else if (this._canSelectItem && this._hasNoItemOption && (actionBinding.actionKey == 'SELECT_NOTHING')) {
     this._selectedItemIdxs = {};
   } else if (actionBinding.actionKey == 'DATA_NAV_UP') {
     this.handlePageUp();
   } else if (actionBinding.actionKey == 'DATA_NAV_DOWN') {
     this.handlePageDown();
   } else if (actionBinding.actionKey == 'HELP') {
     var helpText = this.getCaptionText()+"\n";
     if (this._canSelectItem || this._canSelectMultipleItems) {
       var lastSelectionLetter = (String.fromCharCode(ROT.VK_A + this._numItemsShown-1)).toLowerCase();
       helpText += "a-"+lastSelectionLetter+"   select the indicated item\n";
     }
     helpText += Game.KeyBinding.getBindingHelpText();
     Game.UIMode.LAYER_textReading.setText(helpText);
     Game.addUiMode('LAYER_textReading');
   }

   return false;
};

//-------------------

Game.UIMode.LAYER_inventoryListing = new Game.UIMode.LAYER_itemListing({
  caption: 'Inventory',
  canSelect: false,
  keyBindingName: 'LAYER_inventoryListing'
});
Game.UIMode.LAYER_inventoryListing.doSetup = function () {
  this.setup({itemIdList: Game.getAvatar().getInventoryItemIds()});
};

//-------------------

Game.UIMode.LAYER_inventoryDrop = new Game.UIMode.LAYER_itemListing({
  caption: 'Drop',
  canSelect: true,
  canSelectMultipleItems: true,
  keyBindingName: 'LAYER_inventoryDrop',
  processingFunction: function (selectedItemIds) {
    if (selectedItemIds.length < 1) {
      return false;
    }
    var dropResult = Game.getAvatar().dropItems(selectedItemIds);
    return dropResult.numItemsDropped > 0;
  }
});
Game.UIMode.LAYER_inventoryDrop.doSetup = function () {
  this.setup({itemIdList: Game.getAvatar().getInventoryItemIds()});
};

//-------------------

Game.UIMode.LAYER_inventoryPickup = new Game.UIMode.LAYER_itemListing({
  caption: 'Pick up',
  canSelect: true,
  canSelectMultipleItems: true,
  keyBindingName: 'LAYER_inventoryPickup',
  processingFunction: function (selectedItemIds) {
    var pickupResult = Game.getAvatar().pickupItems(selectedItemIds);
    return pickupResult.numItemsPickedUp > 0;
  }
});
Game.UIMode.LAYER_inventoryPickup.doSetup = function () {
  this.setup({itemIdList: Game.util.objectArrayToIdArray(Game.getAvatar().getMap().getItems(Game.getAvatar().getPos()))});
};

Game.UIMode.LAYER_inventoryListing.handleInput = function (inputType,inputData) {
  var actionBinding = Game.KeyBinding.getInputBinding(inputType,inputData);

  if (actionBinding) {
    if (actionBinding.actionKey == 'EXAMINE') {
      Game.addUiMode('LAYER_inventoryExamine');
      return false;
    }
    if (actionBinding.actionKey == 'DROP') {
      Game.addUiMode('LAYER_inventoryDrop');
      return false;
    }
    if (actionBinding.actionKey == 'EAT') {
      Game.addUiMode('LAYER_inventoryEat');
      return false;
    }
  }
  return Game.UIMode.LAYER_itemListing.prototype.handleInput.call(this,inputType,inputData);
};

//-------------------

Game.UIMode.LAYER_inventoryExamine = new Game.UIMode.LAYER_itemListing({
  caption: 'Examine',
  canSelect: true,
  keyBindingName: 'LAYER_inventoryExamine',
  processingFunction: function (selectedItemIds) {
    //console.log('LAYER_inventoryExamine processing on '+selectedItemIds[0]);
    if (selectedItemIds[0]) {
      var d = Game.DATASTORE.ITEM[selectedItemIds[0]].getDetailedDescription();
      //console.log('sending special message of '+d);
      setTimeout(function() { // delay here because of the general refresh on exiting the layer
        Game.specialMessage(d);
      }, 2);
    }
    return false;
  }
});
Game.UIMode.LAYER_inventoryExamine.doSetup = function () {
  this.setup({itemIdList: Game.getAvatar().getInventoryItemIds()});
};

Game.UIMode.LAYER_inventoryEat = new Game.UIMode.LAYER_itemListing({
  caption: 'Eat',
  canSelect: true,
  keyBindingName: 'LAYER_inventoryEat',
  filterListedItemsOn: function(itemId) {
    return  Game.DATASTORE.ITEM[itemId].hasMixin('Food');
  },
  processingFunction: function (selectedItemIds) {
    if (selectedItemIds[0]) {
      var foodItem = Game.getAvatar().extractInventoryItems([selectedItemIds[0]])[0];
//        Game.util.cdebug(foodItem);
      Game.getAvatar().eatFood(foodItem.getFoodValue());
      return true;
    }
    return false;
  }
});
Game.UIMode.LAYER_inventoryEat.doSetup = function () {
  this.setup({itemIdList: Game.getAvatar().getInventoryItemIds()});
};

//-----------------------

Game.UIMode.LAYER_shopListing = new Game.UIMode.LAYER_itemListing({
  caption: 'Merchandise',
  canSelect: true,
  canSelectMultipleItems: true,
  keyBindingName: 'LAYER_shopListing',
  shopMode: true,
  processingFunction: function (selectedItemIds) {
    var map = Game.UIMode.gamePlay.getMap();
    var shop = map.getEntity(map.getShopPos());
    shop.sellItems(selectedItemIds, Game.getAvatar());
  }
});

Game.UIMode.LAYER_shopListing.doSetup = function () {
  var map = Game.UIMode.gamePlay.getMap();
  var shop = map.getEntity(map.getShopPos());
  this.setup({itemIdList: shop.getMerchandiseIds()});
};
