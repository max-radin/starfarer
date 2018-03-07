function ArrivalEvent (ship) {
	this.message = `Cherenkov radiation detected from an unknown object dropping out of hyperspace, bearing ${ship.xMoment} ${ship.yMoment}.`;
	this.time_until = 0;
	this.ship = ship;
}

ArrivalEvent.prototype = {

	action: function (system, callbackFunction) {
    system.ships.push(this.ship);
    getAcknowledgement(this.message, callbackFunction);
	}
}

function TempleEvent () {
	this.message = "Your landing party searches a crumbling Precursor temple and finds a digicodex containing the coordinates of a nearby anomaly. However, while decrypting the access key, your tech specialist accidentally activated the temple's subspace transponder. Orbital simulations indicate that if any ships in the nearest star system picked up the transmission, they could arrive in as few as 4 days.";
	this.time_until = 0;
}

TempleEvent.prototype = {

	action: function (system, callbackFunction) {
    let anomaly = new Ship([32,17], [0,0], 1, 0, 0);
    anomaly.char = "A";
    anomaly.name = "anomaly X72-C";
    anomaly.event = new AnomalyCollapseEvent(anomaly);
    system.ships.push(anomaly);
    getAcknowledgement(this.message, callbackFunction);
    
    var ship = new Ship([60,40], [2,1], 5, 3, 10);
    arrival = new ArrivalEvent(ship);
    arrival.time_until = 4;
    system.pending_events.push(arrival);
	}
}

function AnomalyCollapseEvent (anomaly) {
	this.message = `Your science officer scans the anomaly with a neutrino oscillation probe, accidentally triggering a Richtmyer-Meshkov instability. Gravity waves rock your ship violently as the anomaly begins collapsing into a black hole...SET THRUSTERS TO MAXIMUM!`;
	this.time_until = 0;
	this.anomaly = anomaly;
}

AnomalyCollapseEvent.prototype = {
  action: function (system, callbackFunction) {
    black_hole = {
      name: 'BLACK HOLE',
      xCoord: this.anomaly.xCoord,
      yCoord: this.anomaly.yCoord,
      radius: 6,
      class: BODY_BLACK_HOLE,
      mass: 1000,
      events: null
    }
    system.planets.push(black_hole);
    this.anomaly.destroy();
    getAcknowledgement(this.message, callbackFunction);
  }
}


function MessageEvent (message, time_until) {
	this.message = "A subspace communication has been received from Altaris IV. " + message;
	this.time_until = time_until;
}

MessageEvent.prototype = {
  action: function (system, callbackFunction) {
    getAcknowledgement(this.message, callbackFunction);
  }
}

function FindOrbitronEvent () {
	this.message = "Amongst the crumbling ruins of a Precursor temple, your landing party finds a metal sphere with many spindly antennas. Your tech specialist is ecstatic...this is an intact Orbitron Device!\n\n" +
  "Congratulations! You have saved the Altaris system and won the game.";
	this.time_until = 0;
}

FindOrbitronEvent.prototype = {
	action: function (system, callbackFunction) {
    getAcknowledgement(this.message, callbackFunction);
	}
}


function TempleClueEvent (orbitron_system, orbitron_planet) {
  
  switch(randomNumber(1,3)) {
      case 1:
        this.message = `Amongst the crumbling ruins of a Precursor temple, your landing party finds a damaged digicodex. A crude reconstruction of the glyphs suggests that the Orbitron Device resides in a system that contains ${orbitron_system.planets.length} bodies.`;
        break;
      case 2:
        this.message = `Amongst the crumbling ruins of a Precursor temple, your landing party finds a damaged digicodex. A crude reconstruction of the glyphs suggests that the Orbitron Device resides the ${orbitron_system.planets[0].name} system.`;
        break;
      case 3:
       this.message = `Amongst the crumbling ruins of a Precursor temple, your landing party finds a damaged digicodex. A crude reconstruction of the glyphs suggests that the Orbitron Device resides on a planet named ${orbitron_planet.name}.`;
       break;
  }
	this.time_until = 0;
}

TempleClueEvent.prototype = {

	action: function (system, callbackFunction) {
    getAcknowledgement(this.message, callbackFunction);
	}
}
