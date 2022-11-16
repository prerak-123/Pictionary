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
	};

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
	});

	socket.on("joinRoom", (data) => {
		if (users[socket.id]["room"] != undefined) {
			console.log("Already in room!");
			return;
		}

		if (!(data in roomCodes)) {
			console.log("Invalid Room Code");
			socket.emit("responseJoinRoom", [false, ""]);
			return;
		}

		socket.join(data);
		roomCodes[data].push(socket.id);
		io.to(data).emit("numPlayers", roomCodes[data].length);
		users[socket.id]["room"] = data;
		socket.emit("responseJoinRoom", [true, data]);
	});

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

		io.to(userRoomCode).emit("numPlayers", roomCodes[userRoomCode].length);
	})
});
