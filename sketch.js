// to-do: testing and handle disconnect
var socket = io.connect();

var playerObj, playerObjID, head, particlePackage, enemyObjPackage;
var alternator = true;
// var particlePackage = [];
var players = [];
var difficulty = 40;
var hit = false;
var colorCounter = 0;
var clearer = true;


function setup() {
	var myCanvas = createCanvas(600, 400);
	particlePackage = null;
	enemyObjPackage = null;
	myCanvas.parent("canvas");
	frameRate(30);
	playerObj = new Player("bottom");
	head = new Particle(0, "black", "up");
}

function randomWholeNum(range) {
	return Math.floor(Math.random() * range);
}

function searcher(node) {
	if (node == null) {
		return null;
	}
	if (node.next == null) {
		return node;
	}
	return searcher(node.next);
}

function draw() 
{
	if (enemyObjPackage != null) {
		var newPlayer = new Player("top");
		newPlayer.x = enemyObjPackage.x;
		newPlayer.id = enemyObjPackage.id;
		newPlayer.lives = enemyObjPackage.lives;
		newPlayer.points = enemyObjPackage.points;
		players.push(newPlayer);
		enemyObjPackage = null;
	}

	if (particlePackage != null) {
		var node = head;
		var last = searcher(node);
		var adder = particlePackage;
		var additive = new Particle(adder.x-25, adder.color, adder.direction);
		last.next = additive;
		additive.previous = last;
		particlePackage = null;
	}

	if (playerObj.lives > 0) 
	{
		background('black');

		if (keyIsDown(LEFT_ARROW) && (playerObj.x - 10 >= 0)) {
			playerObj.x -= 10;
		}

		if (keyIsDown(RIGHT_ARROW) && (playerObj.x + 10 < 600)) {
			playerObj.x += 10;
		}

		for (var i = 0; i < players.length; i++) {

			if (colorCounter >= 10) {
				players[i].color = "blue";
			}
			players[i].display();
		}

		var node = head.next;
		var current = node;
		while (current != null)
		{
			var next = current.next;
			current.update();
			current.display();
			
			for (var i = 0; i < players.length; i++) {
				hit = collideRectCircle(players[i].x, players[i].y, players[i].sizeX, players[i].sizeY, current.x, current.y, current.size);
				if (hit) {
					colorCounter = 0;
					players[i].color = current.color;
					players[i].interaction(players[i].color);
					if (current.next == null) {
						current.size = 0;
						current = null;
						break;
					} else {
						current.previous.next = next;
						next.previous = current.previous;
					}
				}
				if (current.y > height || node.y < 0) {
					if (current.next == null) {
						current = null;
						break;
					} else {
						current.previous.next = next;
						next.previous = current.previous;
					}
				}
			}	

			if (current == null) break;	
			
			current = current.next;

		}
		colorCounter++;
		document.getElementById('points').innerHTML = "Points: " + playerObj.points;
		document.getElementById('lives').innerHTML = "Lives: " + playerObj.lives;
	} else {
		if (clearer) {
			clear();
			clearer = false;
		}
		textSize(32);
		text("GAME OVER! Press any key to try again", 10, 150);
		fill(255);
		if (keyIsPressed === true) {
			playerObj = new Player("bottom");
			clearer = true;
		}
	}

	socket.emit('screenState', playerObj);

}

function keyPressed() {
  if (keyCode === 32) {
  		var particleAdd = new Particle(playerObj.x, ColorID(randomWholeNum(3)), "up");
  		
  		var packager = {
  			"particle": particleAdd,
  			"screenHeight": height
  		};

  		socket.emit('particleEmit', packager);

  		var node = head.next;
  		if (node == null) {
  			node = particleAdd;
  			head.next = node;
  			node.previous = head;
  		} else {
  			while (node.next != null) {
  				node = node.next;
  			}
  			node.next = particleAdd;
  			particleAdd.previous = node;
  		}
  }
}

function ColorID(integer)
{
	switch(integer){
		case 0: return "white";
		case 1: return "green";
		case 2: return "red";

		default: return "black";
	}
}

function Player(direction)
{
	this.next = null;
	this.previous = null;
	this.id = "";
	this.x = width/2;
	this.direction = direction;
	if (direction == "top") this.y = 20;
	else this.y = height-20;
	this.sizeX = 50;
	this.sizeY = 25;
	this.color = "blue";
	this.lives = 3;
	this.points = 0;

	this.display = function()
	{
		fill(this.color);
		rect(this.x, this.y, this.sizeX, this.sizeY);
	}

	this.interaction = function(color)
	{
		if (color == "red") this.lives--;
		else if (color == "green") {
			this.points += 100;
		} else this.points += 10;
	}
}

function Particle(xD, color, direction)
{
	this.x = xD + 25;
	if (direction == "up") {
		this.y = height-25;
	} else {
		this.y = 25;
	}
	this.color = color;
	this.size = 20;
	this.direction = direction;

	this.display = function()
	{
		fill(this.color);
		ellipse(this.x, this.y, this.size, this.size);
	}
	this.update = function()
	{
		if (this.direction == "up") this.y -= 10;
		else this.y += 10;
	}
}

socket.on('connect', function() {
	console.log("Connected");
	playerObjID = socket.id;
	playerObj.id = playerObjID;
	players.push(playerObj);

	var newObj = new Player("top");
	newObj.x = playerObj.x;
	newObj.id = playerObj.id;
	newObj.lives = playerObj.lives;
	newObj.points = playerObj.points;
	
	socket.emit('playerJoin', newObj);
});

socket.on('otherPlayerJoin', function(enemyObj) {
	console.log('new player');
	enemyObjPackage = enemyObj;
});

socket.on('screenUpdate', function(data) {
	var otherPlayer = data;
	var finder = false;
	for (var i = 0; i < players.length; i++) {
		if (players[i].id == otherPlayer.id){
			finder = true;
			players[i].x = otherPlayer.x;
			players[i].lives = otherPlayer.lives;
			players[i].points = otherPlayer.points;
		}
	}
	if (!finder) enemyObjPackage = otherPlayer;
});

socket.on('otherParticle', function(data) {
	particlePackage = data;
});