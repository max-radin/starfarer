// Construct an object representing a star system
function System (universe) {

  this.universe = universe;
  this.planets = [];
  this.planets.push(
    {
      name: randomLargeBodyName(),
      xCoord: MAP_WIDTH/2,
      yCoord: MAP_HEIGHT/2,
      radius: randomNumber(4,6),
      class: randomOption(LARGE_BODIES),
      mass: randomNumber(1,4)*100,
      events: null
    });
  this.name = this.planets[0].name;
  if (this.name.substring(0,3) == "NGC")
    this.planet_naming_style = PLANET_NAMING_STYLE_SCIENTIFIC;
  else
    this.planet_naming_style = [PLANET_NAMING_STYLE_COMMON, PLANET_NAMING_STYLE_SCIENTIFIC, PLANET_NAMING_STYLE_SYSTEM_DERIVED].random();
  this.ships = [];
  this.map = [];
  this.addRandomPlanets();
  this.generateMap();
  this.addRandomAnomalies();
  this.khanFleet = false;

  let encounters = [
    {
      prob: 10,
      opt: SHIP_FLAG_KHAN
    },
    {
      prob: 20,
      opt: SHIP_FLAG_MERCHANT
    },
    {
      prob: 40,
      opt: SHIP_FLAG_PIRATE
    },
    {
      prob: 30,
      opt: SHIP_FLAG_UNKNOWN
    }
  ];
  switch (randomOption(encounters)) {
    case SHIP_FLAG_UNKNOWN:
      break;
    case SHIP_FLAG_MERCHANT:
      for (var count = 0; count < randomNumber(1, 3); count++) {
        let s = new Ship(this.randomUnoccupiedSpace(), [1,-2], randomOption([{prob: 50, opt: SHIP_TYPE_SLOOP}, {prob: 50, opt: SHIP_TYPE_FRIGATE}]), SHIP_FLAG_MERCHANT);
        this.ships.push(s);
      }
      break;
    case SHIP_FLAG_PIRATE:
      for (var count = 0; count < randomNumber(1, 2); count++) {
        let s = new Ship(this.randomUnoccupiedSpace(), [1,-2], SHIP_TYPE_FRIGATE, SHIP_FLAG_PIRATE);
        this.ships.push(s);
      }
      for (var count = 0; count < randomNumber(0, 2); count++) {
        let s = new Ship(this.randomUnoccupiedSpace(), [1,-2], SHIP_TYPE_SLOOP, SHIP_FLAG_PIRATE);
        this.ships.push(s);
      }
      if (percentChance(25))
        this.ships.push(new Ship(this.randomUnoccupiedSpace(), [1,-2], SHIP_TYPE_TRANSPORT, SHIP_FLAG_PIRATE));
      break;
    case SHIP_FLAG_KHAN:
      for (var count = 0; count < randomNumber(1, 2); count++) {
        let s = new Ship(this.randomUnoccupiedSpace(), [1,-2], SHIP_TYPE_FRIGATE, SHIP_FLAG_KHAN);
        this.ships.push(s);
      }
      for (var count = 0; count < randomNumber(0, 3); count++) {
        let s = new Ship(this.randomUnoccupiedSpace(), [1,-2], SHIP_TYPE_SLOOP, SHIP_FLAG_KHAN);
        this.ships.push(s);
      }
      break;
  }

  var n_stations = randomNumber(0, 1);
  for (var count = 0; count < n_stations; count++) {
    let s = new Ship(this.randomUnoccupiedSpace(), [0,0], SHIP_TYPE_STATION, SHIP_FLAG_MERCHANT);
    if (percentChance(20)) {
      s.event = new SpaceStationEvent();
    } else {
      s.event = new ShopEvent();
    }
    this.ships.push(s);
  }

  this.waypoints = [];
  for (let n = 0; n < 3; n++) {
    let rus = this.randomUnoccupiedSpace();
    let asfn = new ROT.Path.AStar(rus[0], rus[1], (x,y) => { //change these positions
       return !_.get(system.map, [x, y, 'forbiddenToAI'], true);
    });
    this.waypoints.push(asfn);
  }

  this.pending_events = [];

  this.bgm = bgms.random();

}

System.prototype = {
  clearTile: function (x, y) {
    this.map[x][y] = {
      terrain: randomOption([{ prob: 80, opt: TERRAIN_NONE_EMPTY}, {prob: 15, opt: TERRAIN_NONE_DIM_STAR}, {prob: 5, opt: TERRAIN_NONE_BRIGHT_STAR}]),
      body: null,
      forbiddenToAI: false
    }
  },
  generateMap: function()
  {
    for(var i = 0; i < MAP_WIDTH; i++) {
      this.map[i] = [];
      for(var j = 0; j < MAP_HEIGHT; j++) {
        this.clearTile(i, j);
      }
    }

    this.planets.forEach((p) => {

      if(p.class == BODY_QUASAR) {
        p.radius = 3; //smaller than other stellar bodies
      }

      if (p.radius == 0) {
        this.map[p.xCoord][p.yCoord].body = p;
        this.map[p.xCoord][p.yCoord].terrain = randomOption(TERRAINS[p.class]);
        this.map[p.xCoord][p.yCoord].forbiddenToAI = true;
      } else {
        if (_.has(JETS, p.class)) {
          drawJet(p.xCoord, p.yCoord, p.radius+1, (x, y) => {
            this.map[x][y].terrain = randomOption(JETS[p.class]);
            this.map[x][y].forbiddenToAI = true;
          });
        }
        if (_.has(CORONAS, p.class)) {
          drawSquareBody(p.xCoord, p.yCoord, p.radius+1, (x, y) => {
            this.map[x][y].terrain = randomOption(CORONAS[p.class]);
            this.map[x][y].forbiddenToAI = true;
          });
        }
        drawPseudoSphericalBody(p.xCoord, p.yCoord, p.radius, (x, y) => {
          this.map[x][y].body = p;
          this.map[x][y].terrain = randomOption(TERRAINS[p.class]);
          this.map[x][y].forbiddenToAI = true;
        });
      }
    });

  },
  removeShip: function(s) {
    let index = this.ships.indexOf(s);
    if (index > -1) {
      this.ships.splice(index, 1);
    }
  },
  randomUnoccupiedSpace: function() {
    var collision = true;
     while (collision) {
      x = randomNumber(2,MAP_WIDTH-2);
      y = randomNumber(2,MAP_HEIGHT-2);
      collision = false;
      this.ships.forEach( (s) => {
        if (s.xCoord == x && s.yCoord == y)
          collision = true;
      });
      if (this.map[x][y].body != null)
        collision = true;
    }
    return([x,y]);
  },
  addRandomAnomalies: function() {
    var n_anomalies = randomNumber(0, 2);
    for (i = 0; i < n_anomalies; i++) {
      let space = this.randomUnoccupiedSpace();
      let anomaly = new Planet(space[0], space[1], BODY_ANOMALY, 0, this);
      this.planets.push(anomaly);
      this.map[anomaly.xCoord][anomaly.yCoord].body = anomaly;
      this.map[anomaly.xCoord][anomaly.yCoord].terrain = TERRAIN_ANOMALY;
    }
  },
  addRandomPlanets: function() {
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
        if (!collision)
          break;
      }

      if (!collision) {
        this.planets.push(new Planet(x, y, randomOption(SMALL_BODIES), r, this));
      }
    }
  }
}
