//--------------------------------------------------------------------------------
// Planet - StarSystem - Cluster - DrawCluster
//--------------------------------------------------------------------------------
"use strict";
// Planet //--------------------------------------------------------------------------------
function Planet(die) {
    this.technology = die.Roll4DF();
    this.environment = die.Roll4DF();
    this.resources = die.Roll4DF();
}

Planet.prototype.Total = function () {
    return this.technology + this.environment + this.resources;
};

Planet.prototype.FormatNumber = function (value) {
    var str = ' ' + value;
    return str.slice(-2);
};

Planet.prototype.Formatted = function () {
    return 'T' + this.FormatNumber(this.technology) + ' E' + this.FormatNumber(this.environment) + ' R' + this.FormatNumber(this.resources);
};

// StarSystem //--------------------------------------------------------------------------------
function StarSystem(die) {
    this.planet = new Planet(die);
    this.links = [];
	this.x = 0;
	this.y = 0;
}

// Cluster //--------------------------------------------------------------------------------
function Cluster(die, count) {
	this.systems = [];
	this.systems.length = count;
	this.alternate = false;
	this.die = die;

    for (var index = 0; index < count; index++)
    {
        this.systems[index] = new StarSystem(die);
    }
    this.Link(die);
	this.EnforceTechMinimum();
}

Cluster.prototype.EnforceTechMinimum = function() {
    var index;
	var needToEnforceTechMinimum = true;
	for (index = 0; index < this.systems.length; index++)
    {
        if (this.systems[index].planet.technology > 1) 
		{
			needToEnforceTechMinimum = false;
		}
    }
	
	if (needToEnforceTechMinimum) 
	{
		// set the highest tech to 2
		var highTechIndex = 0;
		var lowestTech = -5;
		for (index = 0; index < this.systems.length; index++)
		{
			if (this.systems[index].planet.technology > lowestTech) 
			{
				lowestTech = this.systems[index].planet.technology;
				highTechIndex = index;
			}
		}
		this.systems[highTechIndex].planet.technology = 2;
		// set the lowest tech to 2
		var lowTechIndex = 0;
		var highestTech = 5;
		for (index = 0; index < this.systems.length; index++)
		{
			if (this.systems[index].planet.technology < highestTech) 
			{
				highestTech = this.systems[index].planet.technology;
				lowTechIndex = index;
			}
		}
		this.systems[lowTechIndex].planet.technology = 2;
	}
	
};

Cluster.prototype.Link = function (die) {
    var roll;
	for (var index = 0; index < this.systems.length - 1; index++) {
        roll = die.Roll4DF();
        if (roll < 0) {
            this.ConnectToNextSystem(index);
        }
        else if (roll === 0) {
            this.ConnectToNextSystem(index);
            this.ConnecttoNextFreeSystem(index);
        }
        else if (roll > 0) {
            this.ConnectToNextSystem(index);
            this.ConnecttoNextFreeSystem(index);
            this.ConnecttoNextFreeSystem(index);
        }
    }
};

Cluster.prototype.ConnectToNextSystem = function (index) {
    this.systems[index].links.push(index + 1);
    this.systems[index + 1].links.push(index);
};

Cluster.prototype.ConnecttoNextFreeSystem = function (index) {
    // start from index+2
    for (var i = index + 2; i < this.systems.length; i++) {
        if (this.systems[i].links.length === 0) {
            this.systems[index].links.push(i);
            this.systems[i].links.push(index);
            return;
        }
    }
};

Cluster.prototype.ColorByValue = function (value) {
    if (value < -1) return "red";
    if (value > 1) return "blue";
    return "black";
};

Cluster.prototype.SystemCenterByIndex = function(index) {
    var SystemRadius = 50;
    var SystemSpacing = 30;

	var x = SystemSpacing + SystemRadius;
    var y = (SystemSpacing * 4);
	
	return {x:x, y:y};
};

Cluster.prototype.DrawLink = function(index1, index2) {
	var system1;
	var system2;
	if (Math.abs(index1 - index2) === 1)
	{
		// Straignt Lines
		system1 = this.systems[index1];
		system2 = this.systems[index2];
		$("canvas").drawLine({
            strokeStyle: "#000",
            strokeWidth: 2,
            x1: system1.x, y1: system1.y,
            x2: system2.x, y2: system2.y
        });
	} 
	else
	{
		// Arcs
		system1 = this.systems[index1];
		system2 = this.systems[index2];
		var separationDistance = Math.abs(system2.x - system1.x);
		var cxOffset = separationDistance * 0.1;
		var cyOffset = Math.abs(index1 - index2) * 50;
		if (this.alternate === false) 
		{
			cyOffset = cyOffset * -1;
		}
		this.alternate = !this.alternate;

		$("canvas").drawBezier({
            strokeStyle: "#000",
            strokeWidth: 2,
            x1: system1.x, y1: system1.y,
            cx1: system1.x+cxOffset, cy1: system1.y+cyOffset,
            cx2: system2.x-cxOffset, cy2: system2.y+cyOffset,
            x2: system2.x, y2: system2.y
        });
	}
};

Cluster.prototype.Draw = function () {
    var SystemRadius = 50;
    var SystemSpacing = 30;
    var width = (this.systems.length * (SystemRadius * 2)) + ((this.systems.length + 1) * SystemSpacing);
    var height = (SystemRadius * 2) + (SystemSpacing * 10);
    var cluster = this;
	var system;

    $("canvas").attr("width", width);
    $("canvas").attr("height", height);

    // elliptical arcs here

    // systems here
    var x = SystemSpacing + SystemRadius;
    var y = (SystemSpacing * 6);

    // draw systems
	// Set system x and y
    this.systems.forEach(function (element, index, array) {
        system = element;
		system.x = x;
		system.y = y;
        x += SystemSpacing + (SystemRadius * 2);
    });
	
	// draw links
    this.systems.forEach(function (element, index, array) {
        system = element;

		var flip = true;
		for (var i = 0; i < system.links.length; i++) {
			var link = system.links[i];
			if (link > index)
			{
				this.DrawLink(index,link);
			}
		}
	},this);
	
	// draw system
	x = SystemSpacing + SystemRadius;
	y = (SystemSpacing * 6);
	var fontName = "16pt Consolas, Courier, sans-serif";
	var fontStrokeWidth = 1;
    this.systems.forEach(function (element, index, array) {
        system = element;

        $("canvas").drawArc({
			fillStyle: "white",
            strokeStyle: "#000",
            strokeWidth: 2,
            x: x,
            y: y,
            radius: SystemRadius
        });

        $("canvas").drawText({
            fillStyle: cluster.ColorByValue(system.planet.technology),
            strokeWidth: fontStrokeWidth,
            x: x,
            y: y - 20,
            font: fontName,
            text: 'T' + system.planet.FormatNumber(system.planet.technology)
        });

        $("canvas").drawText({
            fillStyle: cluster.ColorByValue(system.planet.environment),
            strokeWidth: fontStrokeWidth,
            x: x,
            y: y,
            font: fontName,
            text: 'E' + system.planet.FormatNumber(system.planet.environment)
        });

        $("canvas").drawText({
            fillStyle: cluster.ColorByValue(system.planet.resources),
            strokeWidth: fontStrokeWidth,
            x: x,
            y: y + 20,
            font: fontName,
            text: 'R' + system.planet.FormatNumber(system.planet.resources)
        });

        x += SystemSpacing + (SystemRadius * 2);
    });

	fontName = "8pt Consolas, Courier, sans-serif";	
	var textWidth = $("canvas").measureText({
		fillStyle: "black",
		strokeWidth: 1,
		font: fontName,
		fromCenter: false,
		text: cluster.die.seed
	}).width;
	$("canvas").drawText({
		fillStyle: "black",
		strokeWidth: 1,
		x: width-(textWidth+10),
		y: 5,
		font: fontName,
		fromCenter: false,
		text: cluster.die.seed
	});

};

// Ignore these properties when strinifying a Cluster to JSON
function ClusterStringifyReplacer(key,value) {
	if (key=="x") return undefined;
	if (key=="y") return undefined;
	if (key=="alternate") return undefined;
	return value;
}

// Get canvas context
function getContext(canvas) {
	return (canvas && canvas.getContext ? canvas.getContext('2d') : null);
}

function ExtractHashFields(hash) {
	var splitValues = hash.split("|");
	var seed = splitValues[0];
	var count = splitValues[1];
	return {seed:seed, count:count};
}

function BuildHashFields(fields) {
	var fieldsArray = [fields.seed, fields.count];
	return fieldsArray.join("|");
}

