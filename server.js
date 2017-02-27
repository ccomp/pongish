// HTTP PORTION

var http = require('http');
var fs = require('fs');
var httpServer = http.createServer(requestHandler);
var url = require('url');
httpServer.listen(8080);
var single = true;
var playerList = [];

function requestHandler(req, res) {

	var parsedUrl = url.parse(req.url);
	console.log("The Request is: " + parsedUrl.pathname);
		
	fs.readFile(__dirname + parsedUrl.pathname, 
		function (err, data) {
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + parsedUrl.pathname);
			}
			res.writeHead(200);
			res.end(data);
  		}
  	);
  	
}


// WEBSOCKET PORTION

var io = require('socket.io').listen(httpServer);

io.sockets.on('connection', 

	function (socket) {
	
		console.log("We have a new client: " + socket.id);
		
		///MY SOCKET EVENTS HERE

		// socket.on('playerAction', function(data) {
		// 	// send this drawing data to EVERYONE
		// 	// don't need to send back to the client it came from
		// 	socket.broadcast.emit('otherPlayerAction', data);
		// });

		socket.on('screenState', function(data) {
			if (single) {
				console.log(data);
				single = false;
			}
			// debugger;
			var player = data.player;
			var head = data.particleHead;
			var height = data.screenHeight;
			var node = head.next;
			while(node != null)
			{
				debugger;
				node.y = height - node.y;
				if (node.direction == "up") node.direction = "down";
				else node.direction = "up";
				node = node.next;
			}
			var package = {
				"player": player,
				"head": head
			};
			socket.broadcast.emit('screenUpdate', package);
		});

		socket.on('playerJoin', function(data) {
			socket.broadcast.emit('otherPlayerJoin', data)
		});

		socket.on('disconnect', function() {
			console.log("Client has disconnected " + socket.id);
		});

		socket.on("error", function() {
			//server couldnt be started, log the error
		});
	}
);