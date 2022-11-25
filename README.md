# Pictionary
This web app is a clone of pictionary made as part of SSL project.

### Installation

1. Clone the repository on your local device.
```shell
git clone https://github.com/prerak-123/Pictionary
```
2. Change directory to Pictionary
```shell
cd Pictionary
```

3. Install required packages
```shell
npm i
```

4. Run the server

```shell
node server
```

5. Open `index.html` in your browser.

### Files

* **server.js** The server file for the game. Connects to clients using socket.io and runs the game and enables communication between clients

* **build.js/client.js** The frontend of the game. Uses ReactJS and renders the games. Connects to server using socket.io.

* **index.html/styles.css** The HTML and CSS files.
### Features Implemented
#### Basic Features

* Ability to create private lobbies which can be joined by other players using a unique five letter room code. Implemented using socket.io's room feature which provides a channel where events can be broadcasted to multiple sockets.

* A canvas where user can draw and synchronously be viewed by other users. This is done by emiting mouse coordinates of user to all the other users.

* A chatbox where users can guess. Wrong guesses are viewed by all users.

* Implemented turns, and in each turn, one user is provided with a word (which only they can see) and others have to guess based on the drawing on canvas. The words and turns are determined on server side.

* Once a user guesses the word, they cannot chat on the chatbox.

* At the end of each round, correct word is displayed on the chatbox.

* A global scoreboard is maintained and updated at the end of each turn. Scores are given based on speed of guessing.
#### Additional Features

* Added sound effects on keyboard events, correct/incorrect guess and completion of round.

* Handled connection/disconnection of users during game. Users directly access the game on connection. Disconnected users are displayed on scoreboard.

### Technology used

#### Backend
* NodeJS (v $\geq 18.12.1$)
* socket.io
* expressJS

#### Frontend

* React
* HTML and CSS

### Team Members:

* Prerak Contractor 
* Rishit Shrivastava
* Yash Virani

### Link to play online:

http://goaldiggers-pictionary.herokuapp.com/
