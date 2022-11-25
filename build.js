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
  var mouse = {
    x: 0,
    y: 0
  };
  var last_mouse = {
    x: 0,
    y: 0
  };

  /* Mouse Capturing Work */

  canvas.addEventListener("mousemove", function (e) {
    last_mouse.x = mouse.x;
    last_mouse.y = mouse.y;
    mouse.x = e.pageX - this.offsetLeft;
    mouse.y = e.pageY - this.offsetTop;
    if (!mouseDown) {
      canvas.removeEventListener("mousemove", sendCoordinates, false);
    }
  }, false);

  /* Drawing on Paint App */
  ctx.lineWidth = 5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "black";
  canvas.addEventListener("mousedown", function (e) {
    canvas.addEventListener("mousemove", sendCoordinates, false);
  }, false);
  canvas.addEventListener("mouseup", function () {
    canvas.removeEventListener("mousemove", sendCoordinates, false);
  }, false);
  var onPaint = function (data) {
    ctx.beginPath();
    ctx.moveTo(data[0][0] * canvas.width, data[0][1] * canvas.height);
    ctx.lineTo(data[1][0] * canvas.width, data[1][1] * canvas.height);
    ctx.closePath();
    ctx.stroke();
  };
  var sendCoordinates = function () {
    if (window.isMyTurn) {
      socket.emit("mouseCoordinates", [[last_mouse.x / canvas.width, last_mouse.y / canvas.height], [mouse.x / canvas.width, mouse.y / canvas.height]]);
    }
  };
  socket.on("serverMouseCoordinates", data => {
    onPaint(data);
  });
  socket.on("serverChangeColor", data => {
    ctx.strokeStyle = data;
    data == "white" ? ctx.lineWidth = 30 : ctx.lineWidth = 5;
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
  socket.on("gameTime", data => {
    changeGameTime(data);
  });
  socket.on("gameRound", data => {
    changeGameRound(data);
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "game__header"
  }, /*#__PURE__*/React.createElement("div", null, "Time Remaining: ", gameTime), /*#__PURE__*/React.createElement("div", null, "Room Code: ", props.roomCode), /*#__PURE__*/React.createElement("div", null, "Round: ", gameRound, "/3"));
}
function Scorecard(props) {
  const [scores, changeScores] = React.useState([]);
  socket.on("serverScore", data => changeScores(data));
  return /*#__PURE__*/React.createElement("div", {
    className: "my-auto"
  }, /*#__PURE__*/React.createElement("table", null, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Name"), /*#__PURE__*/React.createElement("th", null, "Score"))), /*#__PURE__*/React.createElement("tbody", null, scores.map((score, index) => /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, score[0]), /*#__PURE__*/React.createElement("td", null, score[1]))))));
}
function ChatBox(props) {
  const [messages, changeMessages] = React.useState([]);
  socket.on("displayMessage", data => {
    changeMessages([...messages, data]);
  });
  socket.on("nextTurn", () => {
    changeMessages([]);
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "messages"
  }, messages.slice(0).reverse().map((elem, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "user__message",
    style: {
      color: elem[2]
    }
  }, elem[2] == "white" && elem[0] + ": " + elem[1], elem[2] == "yellow" && elem[0] + " " + elem[1], elem[2] == "pink" && "Correct Word: " + elem[1])));
}
var s = null;
document.addEventListener("keydown", function (e) {
  s = document.getElementById("audio");
  s.currentTime = 0;
  s.play();
});
var sr = null;
socket.on("playsound", data => {
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
  socket.on("userID", data => {
    changeMyID(data);
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
  socket.on("newRoomCode", data => {
    changePage("waitPlayers");
    changeRoomCode(data);
  });
  socket.on("responseJoinRoom", data => {
    if (!data[0]) {
      alert(data[1]);
      return;
    } else {
      changeRoomCode(data[1]);
      data[2] ? changePage("gamePage") : changePage("waitPlayers");
    }
  });
  socket.on("playersInfo", data => {
    changeNumPlayers(data.length);
    changePlayersInfo(data);
  });
  socket.on("serverStartGame", data => {
    changePage("gamePage");
  });
  socket.on("currTurn", data => {
    changeCurrTurn(data);
  });
  socket.on("serverWord", data => {
    changecurrWord(data);
  });
  socket.on("nextTurn", data => {
    changecurrWord("");
    changeGuessedWord(false);
  });
  socket.on("correctGuess", data => {
    changeGuessedWord(true);
  });
  socket.on("gameOver", data => {
    changePage("showWinner");
    changeWinner(data);
  });
  if (page == "userName") {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "header py-2"
    }, /*#__PURE__*/React.createElement("p", null, "Pictionary ", /*#__PURE__*/React.createElement("i", {
      className: "bi bi-pencil-fill"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "main__user__name"
    }, /*#__PURE__*/React.createElement("form", {
      onSubmit: userName
    }, /*#__PURE__*/React.createElement("h2", null, "Enter Name"), /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control w-75 mx-auto",
      placeholder: "Name",
      id: "userNameInput"
    }))));
  }
  if (page == "roomButtons") {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "header py-2"
    }, /*#__PURE__*/React.createElement("p", null, "Pictionary ", /*#__PURE__*/React.createElement("i", {
      className: "bi bi-pencil-fill"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "mx-auto char__show"
    }, /*#__PURE__*/React.createElement("div", {
      className: "my-auto px-5"
    }, /*#__PURE__*/React.createElement("img", {
      src: "images/char.png",
      className: "char__img"
    }), /*#__PURE__*/React.createElement("p", null, myName)), /*#__PURE__*/React.createElement("div", {
      className: "main__buttons"
    }, /*#__PURE__*/React.createElement("button", {
      id: "make_room",
      type: "button",
      onClick: makeRoom,
      className: "btn btn-lg btn-warning m-4"
    }, /*#__PURE__*/React.createElement("i", {
      className: "bi bi-plus-circle-fill mr-2"
    }), " Make Room"), /*#__PURE__*/React.createElement("hr", {
      className: "hruler"
    }), /*#__PURE__*/React.createElement("form", {
      onSubmit: joinRoom
    }, /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control w-75 mx-auto",
      placeholder: "Room Code",
      id: "roomCodeInput"
    })), /*#__PURE__*/React.createElement("button", {
      id: "join_room",
      type: "button",
      className: "btn btn-lg btn-warning m-4",
      onClick: joinRoom
    }, " ", /*#__PURE__*/React.createElement("i", {
      className: "bi bi-box-arrow-in-right mr-2"
    }), " Join Room"))));
  }
  if (page == "waitPlayers") {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "header py-2"
    }, /*#__PURE__*/React.createElement("p", null, "Pictionary ", /*#__PURE__*/React.createElement("i", {
      className: "bi bi-pencil-fill"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "flex wait__main mx-auto"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wait__players"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", {
      src: "images/hourglass.gif",
      className: "mx-5"
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", null, "Waiting For Players"), /*#__PURE__*/React.createElement("p", null, "Room Code: ", currentRoomCode, " ", /*#__PURE__*/React.createElement("button", {
      className: "btn btn-dark",
      onClick: e => {
        navigator.clipboard.writeText(currentRoomCode);
        changeBtnType("tick");
        setTimeout(() => {
          changeBtnType("copy");
        }, 3000);
      }
    }, btnType == "copy" ? /*#__PURE__*/React.createElement("i", {
      className: "bi bi-clipboard-fill"
    }) : /*#__PURE__*/React.createElement("i", {
      className: "bi bi-check-lg"
    }))), /*#__PURE__*/React.createElement("h1", null, /*#__PURE__*/React.createElement("i", {
      className: "bi bi-person",
      size: 14
    }), " ", numPlayers), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-lg btn-info m-4",
      onClick: e => {
        if (numPlayers <= 1) {
          alert("Need atleast two players to start the game!");
          return;
        }
        socket.emit("startGame", "");
      }
    }, "Start Game")), /*#__PURE__*/React.createElement("div", null, playersInfo != undefined && playersInfo.map((name, index) => /*#__PURE__*/React.createElement("div", {
      className: "mx-5",
      key: index
    }, index + 1, ". ", name[1], " ", name[0] == myID && "(Me)"))))));
  }
  if (page == "gamePage") {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(GameHeader, {
      roomCode: currentRoomCode
    }), /*#__PURE__*/React.createElement("div", {
      className: "header py-2"
    }, /*#__PURE__*/React.createElement("p", null, "Pictionary ", /*#__PURE__*/React.createElement("i", {
      className: "bi bi-pencil-fill"
    }))), currTurn == myID && /*#__PURE__*/React.createElement("div", {
      className: "curr__word"
    }, /*#__PURE__*/React.createElement("h2", null, "Your Word: ", currWord)), /*#__PURE__*/React.createElement("div", {
      className: "sketch__div"
    }, /*#__PURE__*/React.createElement(Scorecard, null), currTurn == myID && /*#__PURE__*/React.createElement("div", {
      className: "canvas__buttons"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn color__button my-1",
      style: {
        backgroundColor: "black"
      },
      onClick: () => {
        socket.emit("changeColor", "black");
      }
    }), /*#__PURE__*/React.createElement("button", {
      className: "btn color__button my-1",
      style: {
        backgroundColor: "brown"
      },
      onClick: () => {
        socket.emit("changeColor", "brown");
      }
    }), /*#__PURE__*/React.createElement("button", {
      className: "btn color__button my-1",
      style: {
        backgroundColor: "red"
      },
      onClick: () => {
        socket.emit("changeColor", "red");
      }
    }), /*#__PURE__*/React.createElement("button", {
      className: "btn color__button my-1",
      style: {
        backgroundColor: "blue"
      },
      onClick: () => {
        socket.emit("changeColor", "blue");
      }
    }), /*#__PURE__*/React.createElement("button", {
      className: "btn color__button my-1",
      style: {
        backgroundColor: "yellow"
      },
      onClick: () => {
        socket.emit("changeColor", "yellow");
      }
    }), /*#__PURE__*/React.createElement("button", {
      className: "btn color__button my-1 btn-dark",
      onClick: () => {
        socket.emit("changeColor", "white");
      }
    }, /*#__PURE__*/React.createElement("h5", null, /*#__PURE__*/React.createElement("i", {
      className: "bi bi-eraser-fill"
    })))), /*#__PURE__*/React.createElement("div", {
      id: "sketch",
      className: "canvas__main"
    }, /*#__PURE__*/React.createElement("canvas", {
      id: "paint",
      className: "paint__canvas"
    })), /*#__PURE__*/React.createElement("div", {
      className: "chat__box"
    }, playersInfo.map((elem, index) => /*#__PURE__*/React.createElement("div", {
      className: "curr__turn"
    }, " ", elem[0] == currTurn && /*#__PURE__*/React.createElement("h4", null, "Current Turn: ", elem[1]))), /*#__PURE__*/React.createElement(ChatBox, null), myID != currTurn && !guessedWord && /*#__PURE__*/React.createElement("form", {
      className: "mx-auto",
      onSubmit: e => {
        e.preventDefault();
        let guess = document.getElementById("guess").value;
        document.getElementById("guess").value = "";
        socket.emit("guess", guess, myID);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "input-group mb-3 my-3"
    }, /*#__PURE__*/React.createElement("span", {
      className: "input-group-text bg-primary text-white",
      id: "basic-addon1"
    }, myName), /*#__PURE__*/React.createElement("input", {
      type: "text",
      className: "form-control",
      placeholder: "Guess",
      "aria-label": "Username",
      "aria-describedby": "basic-addon1",
      id: "guess"
    }))))));
  }
  if (page == "showWinner") {
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "header py-2"
    }, /*#__PURE__*/React.createElement("p", null, "Pictionary ", /*#__PURE__*/React.createElement("i", {
      className: "bi bi-pencil-fill"
    }))), /*#__PURE__*/React.createElement("div", {
      className: "winner m-auto"
    }, /*#__PURE__*/React.createElement("img", {
      src: "images/winner.gif",
      width: "200vw"
    }), /*#__PURE__*/React.createElement("div", {
      className: "my-auto mx-5"
    }, /*#__PURE__*/React.createElement("h1", null, "Winner: ", winner), /*#__PURE__*/React.createElement("form", null, /*#__PURE__*/React.createElement("button", {
      className: "btn btn-lg btn-primary"
    }, "Click Here To Play Again!")))));
  }
}
const rootNode = document.getElementById("root");
const root = ReactDOM.createRoot(rootNode);
root.render(React.createElement(App));