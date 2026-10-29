const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true } });
app.use(express.static(path.join(__dirname)));
app.get('/health', (_req, res) => res.json({ ok: true }));

const COLS=18, ROWS=12, TOTAL=COLS*ROWS;
const COLORS=['#3b82f6','#ef4444','#22c55e','#a855f7','#f59e0b','#06b6d4','#ec4899','#84cc16'];
const rooms=new Map();
function newRoom(){return {cells:Array.from({length:TOTAL},()=>({owner:null,army:0})),players:[],turn:0}}
function adjacent(a,b){const ax=a%COLS, ay=Math.floor(a/COLS), bx=b%COLS, by=Math.floor(b/COLS);return Math.abs(ax-bx)+Math.abs(ay-by)===1}
function playerState(room){return {cells:room.cells,players:room.players.map(p=>({id:p.id,name:p.name,color:p.color,cells:room.cells.filter(c=>c.owner===p.id).length,army:p.army}))}}
function broadcast(roomName,room){io.to(roomName).emit('state',playerState(room))}
function freeCell(room){const empty=[];room.cells.forEach((c,i)=>{if(!c.owner)empty.push(i)});return empty.length?empty[Math.floor(Math.random()*empty.length)]:Math.floor(Math.random()*TOTAL)}
io.on('connection',socket=>{
 let joinedRoom=null;
 socket.on('join',data=>{
  const roomName=String(data?.room||'ARENA1').replace(/[^a-z0-9_-]/gi,'').slice(0,12).toUpperCase()||'ARENA1';
  const name=String(data?.name||'Oyuncu').replace(/[<>]/g,'').trim().slice(0,18)||'Oyuncu';
  if(joinedRoom) socket.leave(joinedRoom);
  if(!rooms.has(roomName))rooms.set(roomName,newRoom());
  const room=rooms.get(roomName);
  if(room.players.length>=8){socket.emit('notice','Bu oda dolu (en fazla 8 oyuncu).');return}
  const p={id:socket.id,name,color:COLORS[room.players.length%COLORS.length],army:20};
  room.players.push(p);joinedRoom=roomName;socket.join(roomName);
  const index=freeCell(room);room.cells[index]={owner:socket.id,army:20};
  socket.emit('joined',{id:socket.id,room:roomName});socket.emit('notice','Başladın! Renkli komşu bölgeleri ele geçir.');
  broadcast(roomName,room);
 });
 socket.on('attack',({index}={})=>{
  if(!joinedRoom||!rooms.has(joinedRoom))return;const room=rooms.get(joinedRoom),p=room.players.find(x=>x.id===socket.id);
  if(!p||!Number.isInteger(index)||index<0||index>=TOTAL)return;
  const target=room.cells[index];if(target.owner===socket.id)return;
  const owned=room.cells.map((c,i)=>c.owner===socket.id?i:-1).filter(i=>i>=0);
  if(!owned.some(i=>adjacent(i,index))){socket.emit('notice','Yalnızca kendi bölgene komşu alanlara saldırabilirsin.');return}
  const source=owned.map(i=>room.cells[i]).find(c=>c.army>1);
  if(!source){socket.emit('notice','Askerin kalmadı. Büyüme hamlesi kullan.');return}
  const force=Math.max(1,Math.floor(source.army*0.55));
  if(!target.owner || force>(target.army||0)){
   const oldOwner=target.owner;target.owner=socket.id;target.army=Math.max(1,force-(target.army||0));source.army=Math.max(1,source.army-force);
   if(oldOwner){const old=room.players.find(x=>x.id===oldOwner);if(old)old.army=Math.max(0,old.army-1)}
   socket.emit('notice','Bölge ele geçirildi!');
  } else {target.army=Math.max(1,target.army-force);source.army=Math.max(1,source.army-force);socket.emit('notice','Savunma güçlüydü, saldırı püskürtüldü.')}
  broadcast(joinedRoom,room);
 });
 socket.on('expand',()=>{
  if(!joinedRoom||!rooms.has(joinedRoom))return;const room=rooms.get(joinedRoom),p=room.players.find(x=>x.id===socket.id);if(!p)return;
  p.army+=5;const owned=room.cells.filter(c=>c.owner===socket.id);if(owned.length)owned.forEach(c=>c.army=Math.min(99,c.army+1));
  socket.emit('notice','Takviye geldi: +5 asker.');broadcast(joinedRoom,room);
 });
 socket.on('defend',()=>{
  if(!joinedRoom||!rooms.has(joinedRoom))return;const room=rooms.get(joinedRoom),p=room.players.find(x=>x.id===socket.id);if(!p)return;
  const c=room.cells.find(c=>c.owner===socket.id);if(c)c.army=Math.min(99,c.army+5);p.army+=2;
  socket.emit('notice','Savunma güçlendirildi.');broadcast(joinedRoom,room);
 });
 function leave(){
  if(!joinedRoom||!rooms.has(joinedRoom))return;const roomName=joinedRoom,room=rooms.get(roomName);
  room.players=room.players.filter(p=>p.id!==socket.id);room.cells.forEach(c=>{if(c.owner===socket.id){c.owner=null;c.army=0}});
  socket.leave(roomName);joinedRoom=null;
  if(!room.players.length)rooms.delete(roomName);else broadcast(roomName,room);
 }
 socket.on('leave',leave);socket.on('disconnect',leave);
});
const PORT=process.env.PORT||3000;
server.listen(PORT,()=>console.log(`Territory Clash.io listening on ${PORT}`));
