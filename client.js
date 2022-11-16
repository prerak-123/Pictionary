// 'use strict';
const socket = io('http://localhost:3000');

function joinRoom(e){
    
};

function makeRoom(e){
    socket.emit('makeRoom', '');
}

function App(props){
    const [page, changePage] = React.useState("roomButtons");

    socket.on("newRoomCode", (data) => {
        changePage("waitPlayers");
        alert(data);
    })

    if(page == "roomButtons"){
        return (
            <div className="main__buttons">
                <button id="make_room" type="button" onClick={makeRoom} className="btn btn-lg btn-primary m-4">  <i className="bi bi-plus-circle-fill mr-2"/> Make Room</button>
                
                <input type="text" className="form-control w-75 mx-auto" placeholder="Room Code"/>
                <button id="join_room" className="btn btn-lg btn-primary m-4"> <i className="bi bi-box-arrow-in-right mr-2" /> Join Room</button>
            </div>
        )
    }

    if(page == "waitPlayers"){
        return (
            <div>
                Waiting for Players
            </div>
        ) 
    }
}

const rootNode = document.getElementById('root');
const root = ReactDOM.createRoot(rootNode);
root.render(React.createElement(App));