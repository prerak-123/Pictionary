const express = require("express");
const app = express();
const port = 3000;
const server = app.listen(port);
const io = require("socket.io")(server, {
	cors: {
		origin: "*",
	},
});
app.get("/", (req, res) => {
	res.send("Hello World!");
});

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var roomCodes = {};
var users = {};

function generateString(length) {
	let result = "";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}

io.on("connection", (socket) => {
	users[socket.id] = {
		room: undefined,
		name: undefined
	};

	socket.emit("userID", socket.id);

	socket.on("userName", (data) => {
		users[socket.id]["name"] = data;
		console.log(users);
	})

	socket.on("makeRoom", (data) => {
		if (users[socket.id]["room"] != undefined) {
			console.log("Already in room!");
			return;
		}

		let roomCode = "";
		do {
			roomCode = generateString(5);
		} while (roomCodes.hasOwnProperty(roomCode));
		console.log(roomCode);

		socket.join(roomCode);
		roomCodes[roomCode] = [socket.id];
		users[socket.id]["room"] = roomCode;

		console.log(roomCodes);
		socket.emit("newRoomCode", roomCode);

		const userData = roomCodes[roomCode].map((entry)=>{
			return([entry,users[entry]["name"]]);
		})

		console.log(userData);

		io.to(roomCode).emit("playersInfo", userData);
	});

	socket.on("joinRoom", (data) => {
		if (users[socket.id]["room"] != undefined) {
			console.log("Already in room!");
			return;
		}

		if (!(data in roomCodes)) {
			console.log("Invalid Room Code");
			socket.emit("responseJoinRoom", [false, "Invalid Room Code"]);
			return;
		}

		if(roomCodes[data].length > 4){
			console.log("Too Many Players!");
			socket.emit("responseJoinRoom", [false, "Too Many Players!"]);
			return;
		}

		socket.join(data);
		roomCodes[data].push(socket.id);
		// io.to(data).emit("numPlayers", roomCodes[data].length);
		const userData = roomCodes[data].map((entry)=>{
			return([entry,users[entry]["name"]]);
		})

		io.to(data).emit("playersInfo", userData);

		console.log(userData);
		users[socket.id]["room"] = data;
		socket.emit("responseJoinRoom", [true, data]);
	});

	socket.on("startGame", (data)=>{
		if (users[socket.id]["room"] == undefined) {
			console.log("Not in any room!");
			return;
		}

		io.to(users[socket.id]["room"]).emit("serverStartGame", true);
		gameLoop(users[socket.id]["room"]);
	})

	socket.on("disconnect", ()=>{
		console.log("Bye");
		userRoomCode = users[socket.id]["room"];
		delete users[socket.id];

		if(userRoomCode == undefined){
			return;
		}
		
		const index = roomCodes[userRoomCode].indexOf(socket.id);
		roomCodes[userRoomCode].splice(index, 1);
		if(roomCodes[userRoomCode].length == 0){
			delete roomCodes[userRoomCode];
			return;
		}

		// io.to(userRoomCode).emit("numPlayers", roomCodes[userRoomCode].length);

		const userData = roomCodes[userRoomCode].map((entry)=>{
			return([entry,users[entry]["name"]]);
		})

		io.to(userRoomCode).emit("playersInfo", userData);
	})

	function gameLoop(roomCode){
		console.log(roomCode);
		var currTurn = 0;
		io.to(roomCode).emit("currTurn", roomCodes[roomCode][currTurn]);
		
		var gameInterval = setInterval(() => {
			if(!(roomCode in roomCodes)){
				clearInterval(gameInterval);
				return;
			}
			currTurn = (currTurn + 1) % roomCodes[roomCode].length;
			io.to(roomCode).emit("currTurn", roomCodes[roomCode][currTurn]);
		}, 10000)
	}
});
