//--------------------------------------------------------------------------------
// Planet - StarSystem - Cluster - DrawCluster
//--------------------------------------------------------------------------------
"use strict";
// Planet //--------------------------------------------------------------------------------
function Planet(die) {
	if (die != undefined) {
		this.technology = die.Roll4DF();
		this.environment = die.Roll4DF();
		this.resources = die.Roll4DF();
	} else {
		this.technology = 0;
		this.environment = 0;
		this.resources = 0;
	}
}

// The total of the attributes. 
// Used for enforcing the technology minimums (at least one system needs Technology 2+)
Planet.prototype.Total = function () {
    return this.technology + this.environment + this.resources;
};

// Formats the attribute value for display
Planet.prototype.FormatNumber = function (value) {
    var str = ' ' + value;
    return str.slice(-2);
};

// Formats all of the attributes for display
Planet.prototype.Formatted = function () {
    return 'T' + this.FormatNumber(this.technology) + ' E' + this.FormatNumber(this.environment) + ' R' + this.FormatNumber(this.resources);
};

// StarSystem //--------------------------------------------------------------------------------
function StarSystem(die) {
    this.planet = new Planet(die);
    this.links = [];
	this.x = 0;
	this.y = 0;
	this.name = "";
	this.aspect1 = "";
	this.aspect2 = "";
}

// Cluster //--------------------------------------------------------------------------------
function Cluster() {
	this.systems = [];
}

Cluster.prototype.Generate = function(die, count) {
	this.systems = [];
	this.systems.length = Math.min(count,12);
	this.alternate = false;
	this.seed = die.seed;

    for (var index = 0; index < this.systems.length; index++)
    {
        this.systems[index] = new StarSystem(die);
    }
    this.Link(die);
	this.EnforceTechMinimum();
};

// Get JSON of Cluster, filtered to just essential properties
Cluster.prototype.GetJSON = function() {
	return JSON.stringify(this,ClusterStringifyReplacer);
};

// Set JSON of Cluster
Cluster.prototype.LoadFromJSON = function(text) {
	var obj = JSON.parse(text);
	this.systems = [];
	this.alternate = false;
	this.seed = '';

	this.systems.length = obj.systems.length;
    var index;
	for (index = 0; index < obj.systems.length; index++)
    {
		this.systems[index] = new StarSystem();
		this.systems[index].name = obj.systems[index].name;
		this.systems[index].aspect1 = obj.systems[index].aspect1;
		this.systems[index].aspect2 = obj.systems[index].aspect2;
		this.systems[index].planet.technology = obj.systems[index].planet.technology;
		this.systems[index].planet.environment = obj.systems[index].planet.environment;
		this.systems[index].planet.resources = obj.systems[index].planet.resources;
		this.systems[index].links = obj.systems[index].links;
    }
};

// At least one system needs Technology 2+
// If not, find the systems with the highest and lowest attribute totals and set their Technology to 2
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
			if (this.systems[index].planet.Total > lowestTech) 
			{
				lowestTech = this.systems[index].planet.Total;
				highTechIndex = index;
			}
		}
		this.systems[highTechIndex].planet.technology = 2;
		// set the lowest tech to 2
		var lowTechIndex = 0;
		var highestTech = 5;
		for (index = 0; index < this.systems.length; index++)
		{
			if (this.systems[index].planet.Total < highestTech) 
			{
				highestTech = this.systems[index].planet.Total;
				lowTechIndex = index;
			}
		}
		this.systems[lowTechIndex].planet.technology = 2;
	}
	
};

// Generates links between Systems
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

// Link to next System
Cluster.prototype.ConnectToNextSystem = function (index) {
    this.systems[index].links.push(index + 1);
    this.systems[index + 1].links.push(index);
};

// Link to the next System that is not the immediate next one
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

// for the -4..4 range
// -4,-3,-2 = red
// -1,0,1   = black
// 2,3,4    = blue
Cluster.prototype.ColorByValue = function (value) {
    if (value < -1) return "red";
    if (value > 1) return "blue";
    return "black";
};

// Used in drawing the System
Cluster.prototype.SystemCenterByIndex = function(index) {
    var SystemRadius = 50;
    var SystemSpacing = 30;

	var x = SystemSpacing + SystemRadius;
    var y = (SystemSpacing * 4);
	
	return {x:x, y:y};
};

// Longest link between Systems
// Used to determine height of canvas
Cluster.prototype.GetLongestLink = function() {
	var longestLink = 0;
    this.systems.forEach(function (element, index, array) {
        var system = element;

		for (var i = 0; i < system.links.length; i++) {
			var link = system.links[i];
			if (link > index)
			{
				longestLink = Math.max(longestLink,link-index);
			}
		}
	},this);

	return longestLink;
};

// draws straight lines or arcs to the next linked System
Cluster.prototype.DrawLink = function(index1, index2, canvasId) {
	var system1;
	var system2;
	var strokeStyle = "#000";
	var strokeWidth = 2;
	if (Math.abs(index1 - index2) === 1)
	{
		// Straignt Lines
		system1 = this.systems[index1];
		system2 = this.systems[index2];
		$(canvasId).drawLine({
			layer: true,
            strokeStyle: strokeStyle,
            strokeWidth: strokeWidth,
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

		$(canvasId).drawBezier({
			layer: true,
            strokeStyle: strokeStyle,
            strokeWidth: strokeWidth,
            x1: system1.x, y1: system1.y,
            cx1: system1.x+cxOffset, cy1: system1.y+cyOffset,
            cx2: system2.x-cxOffset, cy2: system2.y+cyOffset,
            x2: system2.x, y2: system2.y
        });
	}
};

// Draws a Cluster
Cluster.prototype.Draw = function (canvasId) {
    var SystemRadius = 50;
    var SystemSpacing = 30;
    var width = (this.systems.length * (SystemRadius * 2)) + ((this.systems.length + 1) * SystemSpacing);
	var longestLink = this.GetLongestLink();
    var height = (SystemRadius * 2) + (longestLink * 60) + 20;
    var cluster = this;
	var system;

	$(canvasId).clearCanvas();
	
    $(canvasId).attr("width", width);
    $(canvasId).attr("height", height);

    // elliptical arcs here

    // systems here
    var x = SystemSpacing + SystemRadius;
    var y = height / 2; 

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
				this.DrawLink(index, link, canvasId);
			}
		}
	},this);
	
	// draw system
	x = SystemSpacing + SystemRadius;
	y = height / 2; //(SystemSpacing * 6);
	var fontFamily = "Consolas, Courier, sans-serif";
	var fontSize = "16pt";
	var fontStrokeWidth = 1;
    this.systems.forEach(function (element, index, array) {
        system = element;

		var systemName = "system"+index;
		
        $(canvasId).drawArc({
			fillStyle: "white",
            strokeStyle: "#000",
            strokeWidth: 2,
            x: x,
            y: y,
            radius: SystemRadius,
			layer: true,
			name: systemName,
			data: {
				index: index
			},
			groups: ["systems"],
			click: function(layer) {
				SelectSystem(layer);
			}
        });

        $(canvasId).drawText({
            fillStyle: cluster.ColorByValue(system.planet.technology),
            strokeWidth: fontStrokeWidth,
            x: x,
            y: y - 20,
			fontSize: fontSize,
			fontFamily: fontFamily,
            text: 'T' + system.planet.FormatNumber(system.planet.technology),
			layer: true,
			data: {
				index: index
			},
			click: function(layer) {
				SelectSystem(layer);
			}
        });

        $(canvasId).drawText({
            fillStyle: cluster.ColorByValue(system.planet.environment),
            strokeWidth: fontStrokeWidth,
            x: x,
            y: y,
			fontSize: fontSize,
			fontFamily: fontFamily,
            text: 'E' + system.planet.FormatNumber(system.planet.environment),
			layer: true,
			data: {
				index: index
			},
			click: function(layer) {
				SelectSystem(layer);
			}
        });

        $(canvasId).drawText({
            fillStyle: cluster.ColorByValue(system.planet.resources),
            strokeWidth: fontStrokeWidth,
            x: x,
            y: y + 20,
			fontSize: fontSize,
			fontFamily: fontFamily,
            text: 'R' + system.planet.FormatNumber(system.planet.resources),
			layer: true,
			data: {
				index: index
			},
			click: function(layer) {
				SelectSystem(layer);
			}
        });

        x += SystemSpacing + (SystemRadius * 2);
    });

	// Draw seed value in upper right
	fontFamily = "Consolas, Courier, sans-serif";
	fontSize = "8pt";
	var textWidth = $(canvasId).measureText({
		fillStyle: "black",
		strokeWidth: 1,
		fontSize: fontSize,
		fontFamily: fontFamily,
		fromCenter: false,
		text: cluster.seed
	}).width;
	$(canvasId).drawText({
		layer: true,
		fillStyle: "black",
		strokeWidth: 1,
		x: width-(textWidth+10),
		y: 5,
		fontSize: fontSize,
		fontFamily: fontFamily,
		fromCenter: false,
		text: cluster.seed
	});

};

function SelectSystem(layer) {
	var systems = $("#"+layer.canvas.id).getLayerGroup("systems");
	systems.forEach(function (element, index, array) {
		$("#"+layer.canvas.id).setLayer(element.name,	{
			strokeStyle: "#000",
			strokeWidth: 2
		});
	});			

	$("#"+layer.canvas.id).setLayer("system"+layer.data.index,	{
		strokeStyle: "blue",
		strokeWidth: 4
	}).drawLayers();
	$("#instructions").hide();
	$("#systemBlock").children("div").hide();
	$("#systemBlock").children("#"+layer.data.index).show("slow");
}

// Ignore these properties when stringifying a Cluster to JSON
function ClusterStringifyReplacer(key,value) {
	if (key=="x") return undefined;
	if (key=="y") return undefined;
	if (key=="alternate") return undefined;
	if (key=="canvasId") return undefined;
	if (key=="die") return undefined;
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

