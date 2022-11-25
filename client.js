"use strict";

const socket = io("http://localhost:3000");

//Canvas
//----------------------------------------------------

var mouseDown = 0;
document.body.onmousedown = function () {
	++mouseDown;
};
document.body.onmouseup = function () {
	--mouseDown;
};

function init() {
	var canvas = document.querySelector("#paint");

	if (canvas == null) {
		return;
	}

	var ctx = canvas.getContext("2d");

	var sketch = document.querySelector("#sketch");
	var sketch_style = getComputedStyle(sketch);
	canvas.width = parseInt(sketch_style.getPropertyValue("width"));
	canvas.height = parseInt(sketch_style.getPropertyValue("height"));

	var mouse = { x: 0, y: 0 };
	var last_mouse = { x: 0, y: 0 };

	/* Mouse Capturing Work */

	canvas.addEventListener(
		"mousemove",
		function (e) {
			last_mouse.x = mouse.x;
			last_mouse.y = mouse.y;

			mouse.x = e.pageX - this.offsetLeft;
			mouse.y = e.pageY - this.offsetTop;

			if (!mouseDown) {
				canvas.removeEventListener("mousemove", sendCoordinates, false);
			}
		},
		false
	);

	/* Drawing on Paint App */
	ctx.lineWidth = 5;
	ctx.lineJoin = "round";
	ctx.lineCap = "round";
	ctx.strokeStyle = "black";

	canvas.addEventListener(
		"mousedown",
		function (e) {
			canvas.addEventListener("mousemove", sendCoordinates, false);
		},
		false
	);

	canvas.addEventListener(
		"mouseup",
		function () {
			canvas.removeEventListener("mousemove", sendCoordinates, false);
		},
		false
	);

	var onPaint = function (data) {
		ctx.beginPath();
		ctx.moveTo(data[0][0] * canvas.width, data[0][1] * canvas.height);
		ctx.lineTo(data[1][0] * canvas.width, data[1][1] * canvas.height);
		ctx.closePath();
		ctx.stroke();
	};

	var sendCoordinates = function () {
		if (window.isMyTurn) {
			socket.emit("mouseCoordinates", [
				[last_mouse.x / canvas.width, last_mouse.y / canvas.height],
				[mouse.x / canvas.width, mouse.y / canvas.height],
			]);
		}
	};

	socket.on("serverMouseCoordinates", (data) => {
		onPaint(data);
	});

	socket.on("serverChangeColor", (data) => {
		ctx.strokeStyle = data;
		data == "white" ? (ctx.lineWidth = 30) : (ctx.lineWidth = 5);
	});
}
//----------------------------

function joinRoom(e) {
	e.preventDefault();
	var inputRoomCode = document.getElementById("roomCodeInput").value;
	if (inputRoomCode.length != 5) {
		alert("Invalid Room Code");
		return;
	}
	socket.emit("joinRoom", inputRoomCode);
}

function makeRoom(e) {
	socket.emit("makeRoom", "");
}

function GameHeader(props) {
	const [gameTime, changeGameTime] = React.useState(60);
	const [gameRound, changeGameRound] = React.useState(1);

	socket.on("gameTime", (data) => {
		changeGameTime(data);
	});

	socket.on("gameRound", (data) => {
		changeGameRound(data);
	});

	return (
		<div className="game__header">
			<div>Time Remaining: {gameTime}</div>
			<div>Room Code: {props.roomCode}</div>
			<div>Round: {gameRound}/3</div>
		</div>
	);
}

function Scorecard(props) {
	const [scores, changeScores] = React.useState([])

	socket.on("serverScore", (data) => changeScores(data));
	return (
		<div className="my-auto">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Score</th>
					</tr>
				</thead>
				<tbody>
					{scores.map((score, index) => (
						<tr>
							<td>{score[0]}</td>
							<td>{score[1]}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function ChatBox(props) {
	const [messages, changeMessages] = React.useState([]);

	socket.on("displayMessage", (data) => {
		changeMessages([...messages, data]);
	});

	socket.on("nextTurn", () => {
		changeMessages([]);
	});
	return (
		<div className="messages">
			{messages
				.slice(0)
				.reverse()
				.map((elem, index) => (
					<div key={index} className="user__message" style={{ color: elem[2] }}>
						{elem[2] == "white" && elem[0] + ": " + elem[1]}
						{elem[2] == "yellow" && elem[0] + " " + elem[1]}
						{elem[2] == "pink" && "Correct Word: " + elem[1]}
					</div>
				))}
		</div>
	);
}
var s = null;
document.addEventListener("keydown", function (e) {
	s = document.getElementById("audio");
	s.currentTime = 0;
	s.play();
});

var sr = null;
socket.on("playsound", (data) => {
	sr = document.getElementById(data);
	sr.play();
});

function App(props) {
	const [myName, changeMyName] = React.useState("");
	const [myID, changeMyID] = React.useState("");
	const [playersInfo, changePlayersInfo] = React.useState(undefined);
	const [page, changePage] = React.useState("userName");
	const [currentRoomCode, changeRoomCode] = React.useState("");
	const [numPlayers, changeNumPlayers] = React.useState(1);
	const [currTurn, changeCurrTurn] = React.useState("");
	const [btnType, changeBtnType] = React.useState("copy");
	const [currWord, changecurrWord] = React.useState("");
	const [guessedWord, changeGuessedWord] = React.useState(false);
	const [winner, changeWinner] = React.useState("");

	socket.on("userID", (data) => {
		changeMyID(data);
		console.log(myID);
	});

	React.useEffect(() => {
		window.isMyTurn = currTurn == myID;
		init();
	});

	function userName(e) {
		e.preventDefault();
		var inputRoomCode = document.getElementById("userNameInput").value;
		if (inputRoomCode.length == 0) {
			alert("Enter a name!");
			return;
		}
		changeMyName(inputRoomCode);
		socket.emit("userName", inputRoomCode);
		changePage("roomButtons");
	}

	socket.on("newRoomCode", (data) => {
		changePage("waitPlayers");
		changeRoomCode(data);
	});

	socket.on("responseJoinRoom", (data) => {
		if (!data[0]) {
			alert(data[1]);
			return;
		} else {
			changeRoomCode(data[1]);
			data[2] ? changePage("gamePage") : changePage("waitPlayers");
		}
	});

	socket.on("playersInfo", (data) => {
		changeNumPlayers(data.length);
		changePlayersInfo(data);
	});

	socket.on("serverStartGame", (data) => {
		changePage("gamePage");
	});

	socket.on("currTurn", (data) => {
		console.log(data);
		changeCurrTurn(data);
	});

	socket.on("serverWord", (data) => {
		changecurrWord(data);
	});

	socket.on("nextTurn", (data) => {
		changecurrWord("");
		changeGuessedWord(false);
	});

	socket.on("correctGuess", (data) => {
		changeGuessedWord(true);
	});

	socket.on("gameOver", (data) => {
		changePage("showWinner");
		changeWinner(data);
	})

	if (page == "userName") {
		return (
			<>
				<div className="header py-2">
					<p>
						Pictionary <i className="bi bi-pencil-fill" />
					</p>
				</div>

				<div className="main__user__name">
					<form onSubmit={userName}>
						<h2>Enter Name</h2>
						<input
							type="text"
							className="form-control w-75 mx-auto"
							placeholder="Name"
							id="userNameInput"
						/>
					</form>
				</div>
			</>
		);
	}

	if (page == "roomButtons") {
		return (
			<>
				<div className="header py-2">
					<p>
						Pictionary <i className="bi bi-pencil-fill" />
					</p>
				</div>

				<div className="mx-auto char__show">
					<div className="my-auto px-5">
						<img src="images/char.png" className="char__img" />
						<p>{myName}</p>
					</div>

					<div className="main__buttons">
						<button
							id="make_room"
							type="button"
							onClick={makeRoom}
							className="btn btn-lg btn-warning m-4"
						>
							<i className="bi bi-plus-circle-fill mr-2" /> Make Room
						</button>

						<hr className="hruler" />

						<form onSubmit={joinRoom}>
							<input
								type="text"
								className="form-control w-75 mx-auto"
								placeholder="Room Code"
								id="roomCodeInput"
							/>
						</form>
						<button
							id="join_room"
							type="button"
							className="btn btn-lg btn-warning m-4"
							onClick={joinRoom}
						>
							{" "}
							<i className="bi bi-box-arrow-in-right mr-2" /> Join Room
						</button>
					</div>
				</div>
			</>
		);
	}

	if (page == "waitPlayers") {
		return (
			<>
				<div className="header py-2">
					<p>
						Pictionary <i className="bi bi-pencil-fill" />
					</p>
				</div>
				<div className="flex wait__main mx-auto">
					<div className="wait__players">
						<div>
							<img src="images/hourglass.gif" className="mx-5" />
						</div>
						<div>
							<p>Waiting For Players</p>
							<p>
								Room Code: {currentRoomCode}{" "}
								<button
									className="btn btn-dark"
									onClick={(e) => {
										navigator.clipboard.writeText(currentRoomCode);
										changeBtnType("tick");
										setTimeout(() => {
											changeBtnType("copy");
										}, 3000);
									}}
								>
									{btnType == "copy" ? (
										<i className="bi bi-clipboard-fill" />
									) : (
										<i className="bi bi-check-lg"></i>
									)}
								</button>
							</p>
							<h1>
								<i className="bi bi-person" size={14}></i> {numPlayers}
							</h1>
							<button
								className="btn btn-lg btn-info m-4"
								onClick={(e) => {
									if (numPlayers <= 1) {
										alert("Need atleast two players to start the game!");
										return;
									}
									socket.emit("startGame", "");
								}}
							>
								Start Game
							</button>
						</div>
						<div>
							{playersInfo != undefined &&
								playersInfo.map((name, index) => (
									<div className="mx-5" key={index}>
										{index + 1}. {name[1]} {name[0] == myID && "(Me)"}
									</div>
								))}
						</div>
					</div>
				</div>
			</>
		);
	}

	if (page == "gamePage") {
		console.log("Current Turn:" + currTurn);
		console.log("myID: " + myID);
		console.log(currTurn);
		return (
			<>
				<GameHeader roomCode={currentRoomCode} />
				<div className="header py-2">
					<p>
						Pictionary <i className="bi bi-pencil-fill" />
					</p>
				</div>

				{currTurn == myID && (
					<div className="curr__word">
						<h2>Your Word: {currWord}</h2>
					</div>
				)}

				<div className="sketch__div">
					<Scorecard/>
					{currTurn == myID && (
						<div className="canvas__buttons">
							<button
								className="btn color__button my-1"
								style={{ backgroundColor: "black" }}
								onClick={() => {
									socket.emit("changeColor", "black");
								}}
							/>

							<button
								className="btn color__button my-1"
								style={{ backgroundColor: "brown" }}
								onClick={() => {
									socket.emit("changeColor", "brown");
								}}
							/>

							<button
								className="btn color__button my-1"
								style={{ backgroundColor: "red" }}
								onClick={() => {
									socket.emit("changeColor", "red");
								}}
							/>

							<button
								className="btn color__button my-1"
								style={{ backgroundColor: "blue" }}
								onClick={() => {
									socket.emit("changeColor", "blue");
								}}
							/>

							<button
								className="btn color__button my-1"
								style={{ backgroundColor: "yellow" }}
								onClick={() => {
									socket.emit("changeColor", "yellow");
								}}
							/>

							<button
								className="btn color__button my-1 btn-dark"
								onClick={() => {
									socket.emit("changeColor", "white");
								}}
							>
								<h5>
									<i className="bi bi-eraser-fill"></i>
								</h5>
							</button>
						</div>
					)}
					<div id="sketch" className="canvas__main">
						<canvas id="paint" className="paint__canvas"></canvas>
					</div>
					<div className="chat__box">
						{playersInfo.map((elem, index) => (
							<div className="curr__turn">
								{" "}
								{elem[0] == currTurn && <h4>Current Turn: {elem[1]}</h4>}
							</div>
						))}

						<ChatBox />
						{myID != currTurn && !guessedWord && (
							<form
								className="mx-auto"
								onSubmit={(e) => {
									e.preventDefault();
									let guess = document.getElementById("guess").value;
									console.log(guess);
									document.getElementById("guess").value = "";
									socket.emit("guess", guess, myID);
								}}
							>
								<div class="input-group mb-3 my-3">
									<span className="input-group-text bg-primary text-white" id="basic-addon1">
										{myName}
									</span>
									<input
										type="text"
										className="form-control"
										placeholder="Guess"
										aria-label="Username"
										aria-describedby="basic-addon1"
										id="guess"
									/>
								</div>
							</form>
						)}
					</div>
				</div>
			</>
		);
	}

	if(page == "showWinner"){
		return(
			<>
				<div className="header py-2">
					<p>
						Pictionary <i className="bi bi-pencil-fill" />
					</p>
				</div>
				<div className="mx-auto">
					<Scorecard/>
				</div>
				<div className="winner m-auto">
					<img src="images/winner.gif" width={"200vw"}/>
					<div className="my-auto mx-5">
						<h1>Winner: {winner}</h1>
						<form>
							<button className="btn btn-lg btn-primary">Click Here To Play Again!</button>
						</form>
					</div>
				</div>
			</>
		)
	}
}

const rootNode = document.getElementById("root");
const root = ReactDOM.createRoot(rootNode);
root.render(React.createElement(App));
