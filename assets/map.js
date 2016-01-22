Game.DATASTORE.MAP = {};

Game.Map = function (mapTileSetName,presetId) {
//  console.log("setting up new map using "+mapTileSetName+" tile set");
  this._tiles = Game.MapTileSets[mapTileSetName].getMapTiles();

  this.attr = {
    _id: presetId||Game.util.uniqueId(),
    _mapTileSetName: mapTileSetName,
    _width: this._tiles.length,
    _height: this._tiles[0].length,
    _floorNum: -1,
    _entitiesByLocation: {},
    _locationsByEntity: {},
    _itemsByLocation: {},
  };

  this._fov = null;
  this.setUpFov();

  Game.DATASTORE.MAP[this.attr._id] = this;
};

// Given a position on the map, returns an array of all neighboring walkable tiles
Game.Map.prototype.getWalkableNeighbors = function(x,y) {
  var neighbors = [];
  if (this.isValidWalkableTile(x+1,y)) neighbors.push({x:x+1,y:y});
  if (this.isValidWalkableTile(x+1,y+1)) neighbors.push({x:x+1,y:y+1});
  if (this.isValidWalkableTile(x+1,y-1)) neighbors.push({x:x+1,y:y-1});
  if (this.isValidWalkableTile(x,y+1)) neighbors.push({x:x,y:y+1});
  if (this.isValidWalkableTile(x,y-1)) neighbors.push({x:x,y:y-1});
  if (this.isValidWalkableTile(x-1,y)) neighbors.push({x:x-1,y:y});
  if (this.isValidWalkableTile(x-1,y+1)) neighbors.push({x:x-1,y:y+1});
  if (this.isValidWalkableTile(x-1,y-1)) neighbors.push({x:x-1,y:y-1});
  return neighbors;
};

// Returns true if the tile in the given position is within the bounds of the map
// and is walkable
Game.Map.prototype.isValidWalkableTile = function(x,y) {
  if ((x >= 0) && (x < this.attr._width) && (y >= 0) && (y < this.attr._height)) {
    return this._tiles[x][y].isWalkable();
  } else {
    return false;
  }
};

// Return true if the second position is reachable from the first position

// Based on ROT.Path.Dijkstra
Game.Map.prototype.reachable = function(fromPos, toPos) {
  var todo = [fromPos];
  var processed = {};

  // While there are still unexplored positions
  while (todo.length > 0) {

    // Check whether we've already processed the top element of the todo stack
    curPos = todo.pop();
    var key = curPos.x + "," + curPos.y;

    // If we've reached destination position, we know the two positions are reachable
    // from each other and can return true
    if (toPos.x === curPos.x && toPos.y === curPos.y) {
      return true;

    // Otherwise we need to continue searching
    } else {
      // Add all the current position's neighbors to our todo stack
      var neighbors = this.getWalkableNeighbors(curPos.x,curPos.y);
      for (var i = 0; i < neighbors.length; i++) {
        // If we've already processed this tile, don't add to the todo stack
        if ((neighbors[i].x + "," + neighbors[i].y) in processed) { continue; }
        todo.push(neighbors[i]);
      }
      processed[key] = curPos;
    }
  }


  // If we never find the fromPos, it is not reachable from toPos
  return false;
};

// Add stairs to the map reachable from the given position
Game.Map.prototype.addStairsReachableFrom = function(pos) {
  // Choose a random floor tile to act as stairs down to the next level
  var stairsPos;

  // Select a random walkable position reachable from the given position
  do {
    stairsPos = this.getRandomWalkablePosition();
  } while (!(this.reachable(stairsPos, pos)));

  // Place the stairs at that position
  this._tiles[stairsPos.x][stairsPos.y] = Game.Tile.stairsDownTile;
  console.log("stars at " + stairsPos.x + ", " + stairsPos.y);

/*
  // Place the stairs 100 steps away from the player's position
  var curX = pos.x, curY = pos.y;
  for (var i = 0; i < 100; i++) {
    var nextX, nextY;
    console.dir(this._tiles);
    do {
      // Choose a random number between 1 and 8 to choose next direction
      // to move
      var nextDir = Math.floor(Math.random() * 8) + 1;
      if (nextDir === 1) {
        nextX = curX - 1;
        nextY = curY + 1;
      } else if (nextDir === 2) {
        nextX = curX;
        nextY = curY + 1;
      } else if (nextDir === 3) {
        nextX = curX + 1;
        nextY = curY + 1;
      } else if (nextDir === 4) {
        nextX = curX - 1;
        nextY = curY;
      } else if (nextDir === 5) {
        nextX = curX + 1;
        nextY = curY;
      } else if (nextDir === 6) {
        nextX = curX - 1;
        nextY = curY - 1;
      } else if (nextDir === 7) {
        nextX = curX;
        nextY = curY - 1;
      } else if (nextDir === 8) {
        nextX = curX + 1;
        nextY = curY - 1;
      }
    } while ((nextX >= this.attr._width) ||
            (nextY >= this.attr._height) ||
            (nextX < 0) ||
            (nextY < 0) ||
            (!(this._tiles[nextX][nextY].isWalkable())));
    curX = nextX;
    curY = nextY;
  }

  this._tiles[curX][curY] = Game.Tile.stairsDownTile;
  //var path = ROT.Path.Dijkstra(pos.x,pos.y);
  //console.dir(path);
  //console.dir(path.compute(stairsPos.x,stairsPos.y));
  /*var tX,tY;
  do {
    tX = Game.util.randomInt(0,this._width - 1);
    tY = Game.util.randomInt(0,this._height - 1);
  } while (! mapTiles[tX][tY].isWalkable);
  mapTiles[tX][tY] = Game.Tile.stairsDownTile;
  */
//  console.log("Stairs location is x: " + curX + ", y: " + curX);

};

Game.Map.prototype.setFloorNum = function(n) {
  this.attr._floorNum = n;
};

Game.Map.prototype.getFloorNum = function() {
  return this.attr._floorNum;
};

Game.Map.prototype.setUpFov = function () {
  var map = this;
  this._fov = new ROT.FOV.DiscreteShadowcasting(function(x, y) {
    return !map.getTile(x, y).isOpaque();
  }, {topology: 8});
};

Game.Map.prototype.getId = function () {
  return this.attr._id;
};

Game.Map.prototype.getWidth = function () {
  return this.attr._width;
};

Game.Map.prototype.getHeight = function () {
  return this.attr._height;
};

Game.Map.prototype.getFov = function () {
  return this._fov;
};

Game.Map.prototype.getTile = function (x_or_pos,y) {
  var useX = x_or_pos,useY=y;
  if (typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  if ((useX < 0) || (useX >= this.attr._width) || (useY<0) || (useY >= this.attr._height)) {
    return Game.Tile.nullTile;
  }

  return this._tiles[useX][useY] || Game.Tile.nullTile;
};

Game.Map.prototype.addEntity = function (ent,pos) {
  this.attr._entitiesByLocation[pos.x+","+pos.y] = ent.getId();
  this.attr._locationsByEntity[ent.getId()] = pos.x+","+pos.y;
  ent.setMap(this);
  ent.setPos(pos);
};

Game.Map.prototype.addItem = function (itm,pos) {
  var loc = pos.x+","+pos.y;
  if (! this.attr._itemsByLocation[loc]) {
    this.attr._itemsByLocation[loc] = [];
  }
  this.attr._itemsByLocation[loc].push(itm.getId());
};

Game.Map.prototype.updateEntityLocation = function (ent) {
  //console.log('updating position of '+ent.getName()+' ('+ent.getId()+')');
  var origLoc = this.attr._locationsByEntity[ent.getId()];
  if (origLoc) {
    this.attr._entitiesByLocation[origLoc] = undefined;
  }
  var pos = ent.getPos();
  this.attr._entitiesByLocation[pos.x+","+pos.y] = ent.getId();
  this.attr._locationsByEntity[ent.getId()] = pos.x+","+pos.y;
};

Game.Map.prototype.getEntity = function (x_or_pos,y) {
  var useX = x_or_pos,useY=y;
  if (typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  var entId = this.attr._entitiesByLocation[useX+','+useY];
  if (entId) { return Game.DATASTORE.ENTITY[entId]; }
  return  false;
};

Game.Map.prototype.getItems = function (x_or_pos,y) {
  var useX = x_or_pos,useY=y;
  if (typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  var itemIds = this.attr._itemsByLocation[useX+','+useY];
  if (itemIds) { return itemIds.map(function(iid) { return Game.DATASTORE.ITEM[iid]; }); }
  return  [];
};

Game.Map.prototype.getEntitiesNearby = function (radius,x_or_pos,y) {
  var useX = x_or_pos,useY=y;
  if (typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  var entLocs = Object.keys(this.attr._entitiesByLocation);
  var foundEnts = [];
  if (entLocs.length < radius*radius*4) {
    for (var i = 0; i < entLocs.length; i++) {
      var el = entLocs[i].split(',');
      if ((Math.abs(el[0]-useX) <= radius) && (Math.abs(el[1]-useY) <= radius)) {
        foundEnts.push(Game.DATASTORE.ENTITY[this.attr._entitiesByLocation[entLocs[i]]]);
      }
    }
  } else {
    for (var cx = radius*-1; cx <= radius; cx++) {
      for (var cy = radius*-1; cy <= radius; cy++) {
        var entId = this.getEntity(useX+cx,useY+cy);
        if (entId) {
          foundEnts.push(Game.DATASTORE.ENTITY[entId]);
        }
      }
    }
  }
  return foundEnts;
};

Game.Map.prototype.extractEntity = function (ent) {
  this.attr._entitiesByLocation[ent.getX()+","+ent.getY()] = undefined;
  this.attr._locationsByEntity[ent.getId()] = undefined;
  return ent;
};
Game.Map.prototype.extractEntityAt = function (x_or_pos,y) {
  var ent = this.getEntity(x_or_pos,y);
  if (ent) {
    this.attr._entitiesByLocation[ent.getX()+","+ent.getY()] = undefined;
    this.attr._locationsByEntity[ent.getId()] = undefined;
  }
  return ent;
};

Game.Map.prototype.extractItemAt = function (itm_or_idx,x_or_pos,y) {
  var useX = x_or_pos,useY=y;
  if (typeof x_or_pos == 'object') {
    useX = x_or_pos.x;
    useY = x_or_pos.y;
  }
  var itemIds = this.attr._itemsByLocation[useX+','+useY];
  if (! itemIds) { return false; }

  var item = false, extractedId = '';
  if (Number.isInteger(itm_or_idx)) {
    extractedId = itemIds.splice(itm_or_idx,1);
    item = Game.DATASTORE.ITEM[extractedId];
  } else {
    var idToFind = itm_or_idx.getId();
    for (var i = 0; i < itemIds.length; i++) {
      if (idToFind === itemIds[i]) {
        extractedId = itemIds.splice(i,1);
        item = Game.DATASTORE.ITEM[extractedId];
        break;
      }
    }
  }
  return item;
};

Game.Map.prototype.getRandomPosition = function(filter_func) {
  if (filter_func === undefined) {
    filter_func = function(tile,tX,tY) { return true; };
  }
  var tX,tY,t;
  do {
    tX = Game.util.randomInt(0,this.attr._width - 1);
    tY = Game.util.randomInt(0,this.attr._height - 1);
    t = this.getTile(tX,tY);
  } while (! filter_func(t,tX,tY));
  return {x:tX,y:tY};
};

// tile is walkable and unoccupied
Game.Map.prototype.getRandomWalkablePosition = function() {
  var map = this;
  return this.getRandomPosition(function(t,tX,tY){ return t.isWalkable() && (!map.getEntity(tX,tY)); });
};

Game.Map.prototype.rememberCoords = function (toRemember) {
  for (var coord in toRemember) {
    if (toRemember.hasOwnProperty(coord)) {
      this.attr._rememberedCoords[coord] = true;
    }
  }
};

Game.Map.prototype.renderOn = function (display,camX,camY,renderOptions) { //visibleCells,showEntities,showTiles,maskRendered,memoryOnly) {
  var opt = renderOptions || {};

  var checkCellsVisible = opt.visibleCells !== undefined;
  var visibleCells = opt.visibleCells || {};
  var showVisibleEntities = (opt.showVisibleEntities !== undefined) ? opt.showVisibleEntities : true;
  var showVisibleItems = (opt.showVisibleItems !== undefined) ? opt.showVisibleItems : true;
  var showVisibleTiles = (opt.showVisibleTiles !== undefined) ? opt.showVisibleTiles : true;

  var checkCellsMasked = opt.maskedCells !== undefined;
  var maskedCells = opt.maskedCells || {};
  var showMaskedEntities = (opt.showMaskedEntities !== undefined) ? opt.showMaskedEntities : false;
  var showMaskedItems = (opt.showMaskedItems !== undefined) ? opt.showMaskedItems : false;
  var showMaskedTiles = (opt.showMaskedTiles !== undefined) ? opt.showMaskedTiles : true;


  if (! (showVisibleEntities || showVisibleTiles || showMaskedEntities || showMaskedTiles)) { return; }

  var dims = Game.util.getDisplayDim(display);
  var xStart = camX-Math.round(dims.w/2);
  var yStart = camY-Math.round(dims.h/2);
  for (var x = 0; x < dims.w; x++) {
    for (var y = 0; y < dims.h; y++) {
      var mapPos = {x:x+xStart,y:y+yStart};
      var mapCoord = mapPos.x+','+mapPos.y;

      if (! ((checkCellsVisible && visibleCells[mapCoord]) || (checkCellsMasked && maskedCells[mapCoord]))) {
        continue;
      }

      var tile = this.getTile(mapPos);
      if (tile.getName() == 'nullTile') {
        tile = Game.Tile.wallTile;
      }
      if (showVisibleTiles && visibleCells[mapCoord]) {
        tile.draw(display,x,y);
      } else if (showMaskedTiles && maskedCells[mapCoord]) {
        tile.draw(display,x,y,true);
      }

      var items = this.getItems(mapPos);
      if (items.length == 1) {
        if (showVisibleItems && visibleCells[mapCoord]) {
          items[0].draw(display,x,y);
        } else if (showMaskedItems && maskedCells[mapCoord]) {
          items[0].draw(display,x,y,true);
        }
      } else if (items.length > 1) {
        if (showVisibleItems && visibleCells[mapCoord]) {
          Game.Symbol.ITEM_PILE.draw(display,x,y);
        } else if (showMaskedItems && maskedCells[mapCoord]) {
          Game.Symbol.ITEM_PILE.draw(display,x,y,true);
        }
      }

      var ent = this.getEntity(mapPos);
      if (ent) {
        if (showVisibleEntities && visibleCells[mapCoord]) {
          ent.draw(display,x,y);
        } else if (showMaskedEntities && maskedCells[mapCoord]) {
          ent.draw(display,x,y,true);
        }
      }
    }
  }
};

Game.Map.prototype.renderFovOn = function (display,camX,camY,radius) {
  // console.log("display is ");
  // console.dir(display);
  var dims = Game.util.getDisplayDim(display);
  var xStart = camX-Math.round(dims.w/2);
  var yStart = camY-Math.round(dims.h/2);

  // track fov visibility
  var inFov = {};
  this._fov.compute(camX,camY,radius,function(x, y, radius, visibility) {
    inFov[x+","+y] = true;
  });

  for (var x = 0; x < dims.w; x++) {
    for (var y = 0; y < dims.h; y++) {
      // Fetch the glyph for the tile and render it to the screen - sub in wall tiles for nullTiles / out-of-bounds
      var mapPos = {x:x+xStart,y:y+yStart};
      if (inFov[mapPos.x+','+mapPos.y]) {
        var tile = this.getTile(mapPos);
        if (tile.getName() == 'nullTile') {
          tile = Game.Tile.wallTile;
        }
        tile.draw(display,x,y);
        var ent = this.getEntity(mapPos);
        if (ent) {
          ent.draw(display,x,y);
        }
      }
    }
  }

  return inFov;
};

Game.Map.prototype.toJSON = function () {
  var json = Game.UIMode.gamePersistence.BASE_toJSON.call(this);
  return json;
};

Game.Map.prototype.fromJSON = function (json) {
  Game.UIMode.gamePersistence.BASE_fromJSON.call(this,json);
};
