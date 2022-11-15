const socket = io('http://localhost:3000');

// socket.on('serverToClient', (data) =>{
//     alert(data);
// })

// socket.emit('clientToServer', "Hello, server!");

function joinRoom(e){
    
};

function makeRoom(e){
    socket.emit('makeRoom', '');
}

socket.on("newRoomCode", (data) => {
    document.getElementById("make_room").hidden = true;
    document.getElementById("join_room").hidden = true;
    alert(data);
})

document.getElementById("make_room").addEventListener("click", makeRoom);
document.getElementById("join_room").addEventListener("click", joinRoom);
