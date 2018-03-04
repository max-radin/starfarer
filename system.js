// Construct an object representing a star system
function System () {
  
  this.planets = [];
  this.planets.push(
    {
      name: LARGE_BODY_NAMES.random(),
      xCoord: MAP_WIDTH/2,
      yCoord: MAP_HEIGHT/2,
      radius: randomNumber(4,6),
      class: randomOption(LARGE_BODIES),
      mass: randomNumber(1,4)*100,
      events: null
    });
  
  var n_planets = randomNumber(0, 3);
  for (i = 0; i < n_planets; i++) {
    
    let r = randomNumber(2,3);
    var collision = true;
    for (var attempts = 0; attempts < 1000; attempts++) {
      x = randomNumber(8,MAP_WIDTH-8);
      y = randomNumber(8,MAP_HEIGHT-8);
      collision = false;
      for (var count = 0; count < this.planets.length; count++) {
        if (Math.abs(this.planets[count].xCoord - x) < this.planets[count].radius + r + 1)
          collision = true;
        if (Math.abs(this.planets[count].yCoord - y) < this.planets[count].radius + r + 1)
          collision = true; 
      }
      console.log(collision)
      if (!collision)
        break;
    }
    
    if (!collision) {
      this.planets.push({
        name: SMALL_BODY_NAMES.random(),
        xCoord: x,
        yCoord: y,
        radius: r,
        class: randomOption(SMALL_BODIES),
        mass: randomNumber(1,4),
        events: [new TempleEvent()]
      });
    }
  }
  
  this.ships = [];
  let ps = new Ship([20,10], [2,2], 5, 3, 10);
  ps.name = `player's ship`;
  ps.player = true;
  ps.powerDown();
  this.ships.push(ps);
  let s2 = new Ship([30,30], [1,-2], 5, 3, 10);
  s2.dijkstra[DIJKSTRA_AVOID_EDGE] = 1;
  s2.dijkstra[DIJKSTRA_AVOID_HAZARDS] = 1;
  this.ships.push(s2);

  this.pending_events = [];
  var message_text = "Xenopaleontologists have decrypted an intriguing Precursor digicodex. Apparently, by reversing the polarity, an Orbitron Device can be used to induce, rather than prevent, a supernova event. Records show that shortly after this capability was discovered, the Precursor council issued an edict ordering all Orbitron Devices to be destroyed.";
  this.pending_events.push(new MessageEvent(message_text, 6));

  this.map = [];
  this.generateMap();
	
}

System.prototype = {
  generateMap: function()
  {
    for(var i = 0; i < MAP_WIDTH; i++) {
      this.map[i] = [];
      for(var j = 0; j < MAP_HEIGHT; j++) {
        let dijkstraLayers = [];
        dijkstraLayers[DIJKSTRA_AVOID_EDGE] = 999;
        dijkstraLayers[DIJKSTRA_AVOID_HAZARDS] = 999;
        dijkstraLayers[DIJKSTRA_SEEK_PLAYER] = 999;
        dijkstraLayers[DIJKSTRA_AVOID_PLAYER] = 999;
        this.map[i][j] = {
          terrain: randomOption({ '80': TERRAIN_NONE_EMPTY, '15': TERRAIN_NONE_DIM_STAR, '5': TERRAIN_NONE_BRIGHT_STAR}),
          body: null,
          dijkstra: dijkstraLayers
        }
      }
    }

    //mark edge cells
    for(var i = 0; i < MAP_WIDTH; i++) {
      this.map[i][0].dijkstra[DIJKSTRA_AVOID_EDGE] = 0;
      this.map[i][MAP_HEIGHT-1].dijkstra[DIJKSTRA_AVOID_EDGE] = 0;
    }
    for(var j = 0; j < MAP_HEIGHT; j++) {
      this.map[0][j].dijkstra[DIJKSTRA_AVOID_EDGE] = 0;
      this.map[MAP_WIDTH-1][j].dijkstra[DIJKSTRA_AVOID_EDGE] = 0;
    }
    djikstraSearch(DIJKSTRA_AVOID_EDGE, true, this.map);

    this.planets.forEach((p) => {
      console.log(p);
      for (var x = p.xCoord - p.radius; x < p.xCoord + p.radius; x++) {
        for (var y = p.yCoord - p.radius; y < p.yCoord + p.radius; y++) {
          this.map[x][y].body = p;
          this.map[x][y].terrain = randomOption(TERRAINS[p.class]);
        }
      }
      this.map[p.xCoord - p.radius][p.yCoord - p.radius].body = null;
      this.map[p.xCoord - p.radius][p.yCoord - p.radius].terrain = TERRAIN_NONE_EMPTY;
      this.map[p.xCoord - p.radius][p.yCoord + p.radius - 1].body = null;
      this.map[p.xCoord - p.radius][p.yCoord + p.radius - 1].terrain = TERRAIN_NONE_EMPTY;
      this.map[p.xCoord + p.radius - 1][p.yCoord - p.radius].body = null;
      this.map[p.xCoord + p.radius - 1][p.yCoord - p.radius].terrain = TERRAIN_NONE_EMPTY;
      this.map[p.xCoord + p.radius - 1][p.yCoord + p.radius - 1].body = null;
      this.map[p.xCoord + p.radius - 1][p.yCoord + p.radius - 1].terrain = TERRAIN_NONE_EMPTY;
    });

    for(var i = 0; i < MAP_WIDTH; i++) {
      for(var j = 0; j < MAP_HEIGHT; j++) {
        if (this.map[i][j].body !== null) {
          this.map[i][j].dijkstra[DIJKSTRA_AVOID_HAZARDS] = 0;
        }
      }
    }

    djikstraSearch(DIJKSTRA_AVOID_HAZARDS, true, this.map);
  }
}