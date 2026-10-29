
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

let players = [];
let gameStarted = false;

function publicPlayers() {
  return players.map(p => ({
    id: p.id,
    name: p.name,
    ready: p.ready
  }));
}

function updateLobby() {
  io.emit('lobbyUpdate', {
    players: publicPlayers()
  });
}

function startGameIfReady() {
  if (gameStarted || players.length === 0) return;

  const allReady = players.every(p => p.ready);

  if (allReady) {
    gameStarted = true;
    io.emit('gameStart', {
      message: 'Maç başladı! İyi oyunlar!'
    });
  }
}

io.on('connection', socket => {
  const player = {
    id: socket.id,
    name: 'Oyuncu ' + (players.length + 1),
    ready: false
  };

  players.push(player);
  updateLobby();

  socket.on('joinLobby', () => {
    socket.emit('lobbyUpdate', {
      players: publicPlayers()
    });
  });

  socket.on('setReady', value => {
    const current = players.find(p => p.id === socket.id);
    if (!current || gameStarted) return;

    current.ready = Boolean(value);
    updateLobby();
    startGameIfReady();
  });

  socket.on('chatMessage', message => {
    if (typeof message !== 'string') return;

    const clean = message.trim().slice(0, 200);
    if (!clean) return;

    io.emit('chatMessage', {
      name: player.name,
      message: clean
    });
  });

  socket.on('disconnect', () => {
    players = players.filter(p => p.id !== socket.id);
    updateLobby();

    if (players.length === 0) {
      gameStarted = false;
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Territory Clash.io çalışıyor: ${PORT}`);
});
