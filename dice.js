// Generic N sided Die
// Uses seedrandom.js
function Die(sides) {
	if (seed === undefined) 
	{
		var now = new Date();
		seed = now.getTime();		
	}
	Math.seedrandom(seed);
	this.seed = seed;
	this.sides = sides;
}

Die.prototype.Roll = function(){
    return Math.floor(Math.random() * this.sides) + 1;
}

// Fudge Die - A d6 with the following faces: -1, -1, 0, 0, 1, 1
function FudgeDie(seed) {
	if (seed === undefined) 
	{
		var now = new Date();
		seed = now.getTime();		
	}
	Math.seedrandom(seed);
	this.seed = seed;
	this.sides = 6;
}

FudgeDie.prototype.Roll = function(){
		val = Math.floor(Math.random() * this.sides) + 1;
		result = 0;
		switch (val)
		{
		case 1:
		case 2:
			result = -1;
			break;
		case 3:
		case 4:
			result = 0;
			break;
		case 5:
		case 6:
			result = 1;
			break;
		}
		return result;
}
FudgeDie.prototype.Roll4DF = function () {
    return this.Roll() + this.Roll() + this.Roll() + this.Roll();
}
