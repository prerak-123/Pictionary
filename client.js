"use strict";
const socket = io("http://localhost:3000");

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
				canvas.removeEventListener("mousemove", onPaint, false);
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
			canvas.addEventListener("mousemove", onPaint, false);
		},
		false
	);

	canvas.addEventListener(
		"mouseup",
		function () {
			canvas.removeEventListener("mousemove", onPaint, false);
		},
		false
	);

	var onPaint = function () {
		ctx.beginPath();
		ctx.moveTo(last_mouse.x, last_mouse.y);
		ctx.lineTo(mouse.x, mouse.y);
		ctx.closePath();
		ctx.stroke();
	};
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

function App(props) {
	var myName = ""
	const [page, changePage] = React.useState("userName");
	const [currentRoomCode, changeRoomCode] = React.useState("");
	const [numPlayers, changeNumPlayers] = React.useState(1);

	React.useEffect(() => {
		init();
	});

	function userName(e){
		e.preventDefault();
		var inputRoomCode = document.getElementById("userNameInput").value;
		if(inputRoomCode.length == 0){
			alert("Enter a name!");
			return;
		}
		myName = inputRoomCode;
		socket.emit("userName", inputRoomCode);
		changePage("roomButtons");
	}

	socket.on("newRoomCode", (data) => {
		changePage("waitPlayers");
		changeRoomCode(data);
	});

	socket.on("responseJoinRoom", (data) => {
		if (!data[0]) {
			alert("Invalid Room Code");
			return;
		} else {
			changePage("waitPlayers");
			changeRoomCode(data[1]);
		}
	});

	socket.on("numPlayers", (data) => {
		changeNumPlayers(data);
	});

	socket.on("serverStartGame", (data)=>{
		changePage("gamePage");
	})

	if(page=="userName"){
		return(
			<div className="main__user__name">
				<form onSubmit={userName}>

					<h1>Enter Name</h1>
					<input
						type="text"
						className="form-control w-75 mx-auto"
						placeholder="Name"
						id="userNameInput"
					/>
				</form>
			</div>
		)
	}

	if (page == "roomButtons") {
		return (
			<div className="main__buttons">
				<button
					id="make_room"
					type="button"
					onClick={makeRoom}
					className="btn btn-lg btn-primary m-4"
				>
					{" "}
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
					className="btn btn-lg btn-primary m-4"
					onClick={joinRoom}
				>
					{" "}
					<i className="bi bi-box-arrow-in-right mr-2" /> Join Room
				</button>
			</div>
		);
	}

	if (page == "waitPlayers") {
		return (
			<div className="flex wait__main">
				<div className="wait__players">
					<div>
						<img src="images/hourglass.gif" className="mx-5" />
					</div>
					<div>
						<p>Waiting For Players</p>
						<p>Room Code: {currentRoomCode}</p>
						<h1>
							<i class="bi bi-person" size={14}></i> {numPlayers}
						</h1>
						<button className="btn btn-lg btn-warning m-4" onClick={(e)=>{
							if(numPlayers <= 1){
								alert("Need atleast two players to start the game!");
								return;
							}
							socket.emit("startGame", "");
						}}>Start Game</button>
					</div>
				</div>
			</div>
		);
	}

	if (page == "gamePage") {
		return (
			<>
				<div id="sketch" className="sketch__div">
					<div className="canvas__buttons">
						<button
							className="btn color__button my-1"
							style={{ backgroundColor: "black" }}
							onClick={() => {
								var canvas = document.querySelector("#paint");
								if (canvas == null) {
									return;
								}
								var ctx = canvas.getContext("2d");
								ctx.strokeStyle = "black";
								ctx.lineWidth = 5;
							}}
						/>

						<button
							className="btn color__button my-1"
							style={{ backgroundColor: "brown" }}
							onClick={() => {
								var canvas = document.querySelector("#paint");
								if (canvas == null) {
									return;
								}
								var ctx = canvas.getContext("2d");
								ctx.strokeStyle = "brown";
								ctx.lineWidth = 5;
							}}
						/>

						<button
							className="btn color__button my-1"
							style={{ backgroundColor: "red" }}
							onClick={() => {
								var canvas = document.querySelector("#paint");
								if (canvas == null) {
									return;
								}
								var ctx = canvas.getContext("2d");
								ctx.strokeStyle = "red";
								ctx.lineWidth = 5;
							}}
						/>

						<button
							className="btn color__button my-1"
							style={{ backgroundColor: "blue" }}
							onClick={() => {
								var canvas = document.querySelector("#paint");
								if (canvas == null) {
									return;
								}
								var ctx = canvas.getContext("2d");
								ctx.strokeStyle = "blue";
								ctx.lineWidth = 5;
							}}
						/>

						<button
							className="btn color__button my-1"
							style={{ backgroundColor: "yellow" }}
							onClick={() => {
								var canvas = document.querySelector("#paint");
								if (canvas == null) {
									return;
								}
								var ctx = canvas.getContext("2d");
								ctx.strokeStyle = "yellow";
								ctx.lineWidth = 5;
							}}
						/>

						<button
							className="btn color__button my-1 btn-dark"
							onClick={() => {
								var canvas = document.querySelector("#paint");
								if (canvas == null) {
									return;
								}
								var ctx = canvas.getContext("2d");
								ctx.strokeStyle = "white";
								ctx.lineWidth = 30;
							}}
						>
							<h5><i class="bi bi-eraser-fill"></i></h5>
						</button>
					</div>
					<canvas id="paint" className="paint__canvas"></canvas>
				</div>
			</>
		);
	}
}

const rootNode = document.getElementById("root");
const root = ReactDOM.createRoot(rootNode);
root.render(React.createElement(App));
