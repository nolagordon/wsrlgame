Game.ItemGenerator = new Game.Generator('items',Game.Item);

Game.ItemGenerator.learn({name:'_inventoryContainer',mixins: ["Container"]});

Game.ItemGenerator.learn({
  name: 'rock',
  description: 'a generic lump of hard mineral',
  chr:String.fromCharCode(174),
  fg:'#bbc'
});

Game.ItemGenerator.learn({
  name: 'maraschino cherry',
  description: 'a great topping for a sundae',
  chr:String.fromCharCode(174),
  fg:'#f32',
  foodValue: 70,
  mixins: ['Food']
});

Game.ItemGenerator.learn({
  name: 'vanilla ice cream',
  description: 'classic vanilla ice cream',
  chr:String.fromCharCode(174),
  fg:'#fff',
  foodValue: 100,
  mixins: ['Food']
});

Game.ItemGenerator.learn({
  name: 'strawberry ice cream',
  description: 'tangy strawberry ice cream',
  chr:String.fromCharCode(174),
  fg:'#ee9dda',
  foodValue: 150,
  mixins: ['Food']
});

Game.ItemGenerator.learn({
  name: 'chocolate ice cream',
  description: 'rich chocolate ice cream',
  chr:String.fromCharCode(174),
  fg:'#86592d',
  foodValue: 200,
  mixins: ['Food']
});
