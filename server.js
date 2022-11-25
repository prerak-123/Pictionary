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

const words = [
	"paper",
	"airport",
	"ship",
	"anchor",
	"eyes",
	"cat",
	"dog",
	"giraffe",
	"pinapple",
	"force",
	"waste",
	"class",
	"college",
	"pollution",
	"pocket",
	"permission",
	"trip",
	"music",
	"space",
	"transport",
	"brick",
	"lion",
	"dictionary",
	"cattle",
	"crime",
	"tornado",
	"degree",
	"increase",
	"exchange",
	"hospital",
	"curtains",
	"basketball",
	"tennis",
	"cactus",
	"shaker",
	"keyboard",
	"laptop",
	"headphones",
	"anger",
	"sorrow",
	"car",
	"crown",
	"movie",
	"sofa",
	"books",
	"picture",
	"question",
	"donut",
	"pastry",
	"umbrella",
	"rock",
	"shoes",
	"guitar",
	"piano",
	"running",
	"grass",
	"potrait",
];

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var roomCodes = {};
var users = {};
var gamesInfo = {};

function generateString(length) {
	let result = "";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}

function generateWord() {
	let ind1 = Math.floor(Math.random() * words.length);

	return words[ind1];
}

io.on("connection", (socket) => {
	users[socket.id] = {
		room: undefined,
		name: undefined,
	};

	socket.emit("userID", socket.id);

	socket.on("userName", (data) => {
		users[socket.id]["name"] = data;
	});

	socket.on("makeRoom", (data) => {
		if (users[socket.id]["room"] != undefined) {
			console.log("Already in room!");
			return;
		}

		let roomCode = "";
		do {
			roomCode = generateString(5);
		} while (roomCodes.hasOwnProperty(roomCode));

		socket.join(roomCode);
		roomCodes[roomCode] = [socket.id];
		users[socket.id]["room"] = roomCode;

		socket.emit("newRoomCode", roomCode);

		const userData = roomCodes[roomCode].map((entry) => {
			return [entry, users[entry]["name"]];
		});

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

		if (roomCodes[data].length > 4) {
			console.log("Too Many Players!");
			socket.emit("responseJoinRoom", [false, "Too Many Players!"]);
			return;
		}

		socket.join(data);
		roomCodes[data].push(socket.id);
		// io.to(data).emit("numPlayers", roomCodes[data].length);
		const userData = roomCodes[data].map((entry) => {
			return [entry, users[entry]["name"]];
		});

		io.to(data).emit("playersInfo", userData);

		users[socket.id]["room"] = data;
		if (data in gamesInfo) {
			gamesInfo[data]["playersScore"].push([socket.id, 0]);
			socket.emit("responseJoinRoom", [true, data, true]);
		} else {
			socket.emit("responseJoinRoom", [true, data, false]);
		}
	});

	socket.on("startGame", (data) => {
		if (users[socket.id]["room"] == undefined) {
			console.log("Not in any room!");
			return;
		}

		io.to(users[socket.id]["room"]).emit("serverStartGame", true);
		const playersScoreArr = roomCodes[users[socket.id]["room"]].map(
			(elem, index) => {
				return [elem, 0];
			}
		);

		gamesInfo[users[socket.id]["room"]] = {
			currWord: "",
			playersScore: playersScoreArr,
			time: 0,
			guessScore: [],
			currTurn: 0,
		};

		gameLoop(users[socket.id]["room"]);
	});

	socket.on("mouseCoordinates", (data) => {
		io.to(users[socket.id]["room"]).emit("serverMouseCoordinates", data);
	});

	socket.on("changeColor", (data) => {
		io.to(users[socket.id]["room"]).emit("serverChangeColor", data);
	});

	socket.on("guess", (data, id) => {
		if (data != gamesInfo[users[socket.id]["room"]]["currWord"]) {
			io.to(users[socket.id]["room"]).emit("displayMessage", [
				users[socket.id]["name"],
				data,
				"white",
			]);
			io.to(id).emit("playsound", "audiowrong");
		} else {
			const playersIndex = gamesInfo[users[socket.id]["room"]][
				"playersScore"
			].findIndex((data) => data[0] == socket.id);

			if (playersIndex > -1) {
				gamesInfo[users[socket.id]["room"]]["playersScore"][playersIndex][1] +=
					gamesInfo[users[socket.id]["room"]]["time"];

				gamesInfo[users[socket.id]["room"]]["guessScore"].push(
					gamesInfo[users[socket.id]["room"]]["time"]
				);

				io.to(users[socket.id]["room"]).emit("displayMessage", [
					users[socket.id]["name"],
					"Guessed Correctly!",
					"yellow",
				]);
				io.to(id).emit("playsound", "audioright");
				socket.emit("correctGuess", "");
			}
		}
	});

	socket.on("disconnect", () => {
		console.log("Bye");
		userRoomCode = users[socket.id]["room"];
		delete users[socket.id];

		if (userRoomCode == undefined) {
			return;
		}

		const index = roomCodes[userRoomCode].indexOf(socket.id);
		roomCodes[userRoomCode].splice(index, 1);
		if (roomCodes[userRoomCode].length == 0) {
			delete roomCodes[userRoomCode];
			return;
		}

		// io.to(userRoomCode).emit("numPlayers", roomCodes[userRoomCode].length);

		const userData = roomCodes[userRoomCode].map((entry) => {
			return [entry, users[entry]["name"]];
		});

		io.to(userRoomCode).emit("playersInfo", userData);

		if (userRoomCode in gamesInfo && userRoomCode in roomCodes) {
			if (index <= gamesInfo[userRoomCode]["currTurn"]) {
				gamesInfo[userRoomCode]["currTurn"] =
					(gamesInfo[userRoomCode]["currTurn"] -
						1 +
						roomCodes[userRoomCode].length) %
					roomCodes[userRoomCode].length;
			}
		}
	});

	function gameLoop(roomCode) {
		let round = 1;
		const MAX_ROUNDS = 3;
		const MAX_TIME = 60;
		gamesInfo[roomCode]["time"] = MAX_TIME;

		gamesInfo[roomCode]["currWord"] = generateWord();

		io.to(roomCode).emit(
			"currTurn",
			roomCodes[roomCode][gamesInfo[roomCode]["currTurn"]]
		);

		io.to(roomCodes[roomCode][gamesInfo[roomCode]["currTurn"]]).emit(
			"serverWord",
			gamesInfo[roomCode]["currWord"]
		);

		const playersScoreEmit = gamesInfo[roomCode]["playersScore"].map((elem) => [
			users[elem[0]]["name"],
			[elem[1]],
		]);
		io.to(roomCode).emit("serverScore", playersScoreEmit);

		let gameInterval = setInterval(() => {
			if (!(roomCode in roomCodes)) {
				clearInterval(gameInterval);
				delete gamesInfo[roomCode];
				return;
			}

			gamesInfo[roomCode]["time"] = gamesInfo[roomCode]["time"] - 1;

			if (gamesInfo[roomCode]["time"] == 1) {
				const playersScoreEmit = gamesInfo[roomCode]["playersScore"].map(
					(elem) =>
						elem[0] in users
							? [users[elem[0]]["name"], [elem[1]]]
							: ["Disconnected", elem[1]]
				);
				io.to(roomCode).emit("serverScore", playersScoreEmit);
			}
			if (
				gamesInfo[roomCode]["time"] < 0 ||
				gamesInfo[roomCode]["guessScore"].length ==
					roomCodes[roomCode].length - 1
			) {
				let mainScore = 0;

				gamesInfo[roomCode]["guessScore"].map((data) => (mainScore += data));

				gamesInfo[roomCode]["guessScore"].length != 0
					? (mainScore = Math.floor(
							(mainScore / gamesInfo[roomCode]["guessScore"].length) * 0.8
					  ))
					: (mainScore = mainScore);

				mainScore += 20;

				gamesInfo[roomCode]["guessScore"] = [];

				if (socket.id in users) {
					const playersIndex = gamesInfo[users[socket.id]["room"]][
						"playersScore"
					].findIndex(
						(data) =>
							data[0] == roomCodes[roomCode][gamesInfo[roomCode]["currTurn"]]
					);

					if (playersIndex > -1) {
						gamesInfo[users[socket.id]["room"]]["playersScore"][
							playersIndex
						][1] += mainScore;
					}
				}

				io.to(roomCode).emit("displayMessage", [
					"irrelevant",
					gamesInfo[roomCode]["currWord"],
					"pink",
				]);

				const playersScoreEmit = gamesInfo[roomCode]["playersScore"].map(
					(elem) =>
						elem[0] in users
							? [users[elem[0]]["name"], [elem[1]]]
							: ["Disconnected", elem[1]]
				);
				io.to(roomCode).emit("serverScore", playersScoreEmit);

				io.to(roomCode).emit("playsound", "audioround");

				io.to(roomCode).emit("nextTurn", "");

				var start = new Date().getTime();
				var end = start;
				while (end < start + 5000) {
					end = new Date().getTime();
				}

				gamesInfo[roomCode]["currWord"] = generateWord();

				gamesInfo[roomCode]["time"] = MAX_TIME;
				gamesInfo[roomCode]["currTurn"] =
					(gamesInfo[roomCode]["currTurn"] + 1) % roomCodes[roomCode].length;
				if (gamesInfo[roomCode]["currTurn"] == 0) {
					round = round + 1;
					if (round <= MAX_ROUNDS) {
						io.to(roomCode).emit("gameRound", round);
					} else {
						let maxScore = -1;
						let maxID;
						for (
							let i = 0;
							i < gamesInfo[roomCode]["playersScore"].length;
							i++
						) {
							if (gamesInfo[roomCode]["playersScore"][i][0] in users) {
								if (gamesInfo[roomCode]["playersScore"][i][1] > maxScore) {
									maxID = gamesInfo[roomCode]["playersScore"][i][0];
									maxScore = gamesInfo[roomCode]["playersScore"][i][1];
								}
							}
						}
						maxID != undefined
							? io.to(roomCode).emit("gameOver", users[maxID]["name"])
							: io.to(roomCode).emit("gameOver", "");
						clearInterval(gameInterval);
						return;
					}
				}
				io.to(roomCodes[roomCode][gamesInfo[roomCode]["currTurn"]]).emit(
					"serverWord",
					gamesInfo[roomCode]["currWord"]
				);
				io.to(roomCode).emit(
					"currTurn",
					roomCodes[roomCode][gamesInfo[roomCode]["currTurn"]]
				);
			}

			io.to(roomCode).emit("gameTime", gamesInfo[roomCode]["time"]);
		}, 1000);
	}
});
