"use strict";
const socket = io("http://localhost:3000");


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
	const [page, changePage] = React.useState("test");
	const [currentRoomCode, changeRoomCode] = React.useState("");
	const [numPlayers, changeNumPlayers] = React.useState(1);

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
					</div>
				</div>
			</div>
		);
	}

	if (page == "test") {
		return (
			<div>
				Hi
			</div>
		);
	}
}

const rootNode = document.getElementById("root");
const root = ReactDOM.createRoot(rootNode);
root.render(React.createElement(App));
