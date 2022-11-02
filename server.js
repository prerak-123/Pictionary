const express = require('express')
const app = express()
const port = 3000
const server = app.listen(port)
const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
  });

app.get('/', (req, res) => {
  res.send('Hello World!')
})

io.on('connection', (socket) => {
    console.log('a user connected');
  });
