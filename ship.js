function Ship(coords, momentum, hull, shields, energy)
{
  this.name = 'unknown ship';
  this.xCoord = coords[0];
  this.yCoord = coords[1];
  this.char = "@";
  this.player = false;
  this.xMoment = momentum[0];
  this.yMoment = momentum[1];
  this.xCursor = momentum[0];
  this.yCursor = momentum[1];
  this.hull = hull;
  this.hullMax = hull;
  this.shields = shields;
  this.shieldsMax = shields;
  this.maneuverLevel = 1;
  this.maneuverCost = 3;
  this.energyRegen = 1;
  this.energy = energy;
  this.energyMax = energy;
  this.credits = 10;
  this.destroyed = false;
  this.maxSpeed = 3; // this is for AI only
}

Ship.prototype = {
	powerDown: function() {
		this.shields = 0;
    this.energy = 0;
	},
  stop: function() {
    this.xMoment = 0;
    this.yMoment = 0;
    this.xCursor = 0;
    this.yCursor = 0;
  },
	takeDamage: function(damage) {
		let damageAfterShields = Math.max(0, damage - Math.max(0, this.shields));
    this.shields = Math.max(0, this.shields - damage);
    this.hull = Math.max(0, this.hull - damageAfterShields);
    if (!this.hull)
      this.destroy();
    return this.destroyed;
	},
  takeHullDamage: function(damage) {
    this.hull = Math.max(0, this.hull - damage);
    if (!this.hull)
      this.destroy();
    return this.destroyed;
	},
  takeIonDamage: function(damage) {
		let damageAfterShields = Math.max(0, damage - Math.max(0, this.shields));
    this.shields = Math.max(0, this.shields - damage);
    this.energy -= damageAfterShields; // can go negative
    return this.destroyed;
	},
  destroy: function() {
    this.hull = 0;
    this.char = '#';
    this.energyRegen = 0;
    this.maneuverLevel = 0;
    this.powerDown();
    this.destroyed = true;
    console.log(this.name + ' is destroyed');
	},
  plotBetterCourse: function(map, astar) {

    let caution = 3;

    if (this.energy < this.maneuverCost)
      return; //don't bother

    let nextX = this.xCoord + this.xMoment;
    let nextY = this.yCoord + this.yMoment;
    let distToTargetX = Math.abs(astar._toX - nextX);
    let distToTargetY = Math.abs(astar._toY - nextY);
    let distToTarget = Math.max(distToTargetX, distToTargetY);

    if (nextX >= MAP_WIDTH || nextX < 0 || nextY >= MAP_HEIGHT || nextY < 0) {
      // dont' go off the map!
      let directionBackToMapX = MAP_WIDTH/2-this.xMoment;
      let directionBackToMapY = MAP_HEIGHT/2-this.yMoment;
      this.xCursor = this.xMoment + Math.sign(directionBackToMapX);
      this.yCursor = this.yMoment + Math.sign(directionBackToMapY);
      return;
    }

    let currentSpeed = Math.max(Math.abs(this.xMoment), Math.abs(this.yMoment));
    let desiredSpeed = Math.min(currentSpeed + 1, this.maxSpeed);
    //reduce desired speed here if too close to destination
    if (distToTarget/desiredSpeed < caution)
      desiredSpeed--;

    let desiredCourse = [0, 0];

    let stepCount = 0;
    astar.compute(nextX, nextY, function(x, y) {
      if (stepCount == desiredSpeed) {
        desiredCourse = [x,y];
      }
      stepCount++;
    });

    //slow down!
    while (desiredCourse[0] + this.xMoment - nextX > desiredSpeed)
      desiredCourse[0]--;
    while (desiredCourse[1] + this.yMoment - nextY > desiredSpeed)
      desiredCourse[1]--;
    while (desiredCourse[0] + this.xMoment - nextX < -desiredSpeed)
      desiredCourse[0]++;
    while (desiredCourse[1] + this.yMoment - nextY < -desiredSpeed)
      desiredCourse[1]++;

    this.xCursor = this.xMoment + Math.sign(desiredCourse[0] - nextX);
    this.yCursor = this.yMoment + Math.sign(desiredCourse[1] - nextY);

	}
}
