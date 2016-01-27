Game.MapTileSets = {
  caves1: {
    _width: 70,
    _height: 70,
    getMapTiles: function () {
      var mapTiles = Game.util.init2DArray(this._width,this._height,Game.Tile.nullTile);
      /*var generator = new ROT.Map.Cellular(this._width,this._height);
      generator.randomize(0.6);

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




      return mapTiles;
      */

      var map = new ROT.Map.Rogue(this._width,this._height);
      map.create(function(x,y,v) {
        if (v===1) {
          mapTiles[x][y] = Game.Tile.floorTile;
        } else {
          mapTiles[x][y] = Game.Tile.wallTile;
        }
      });

      /*var tX,tY;
      do {
        tX = Game.util.randomInt(0,this._width - 1);
        tY = Game.util.randomInt(0,this._height - 1);
      } while (! mapTiles[tX][tY].isWalkable);
      mapTiles[tX][tY] = Game.Tile.stairsDownTile;
      console.log("Stairs location is x: " + tX + ", y: " + tY);
      */

      return mapTiles;
    }
  }
};
