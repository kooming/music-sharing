require('dotenv').config();
require('./models/config');
const express = require('express');
const socketIo = require('socket.io'); 
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { detailRouter, mainRouter, liveRouter, mypageRouter, searchViewRouter ,musicRouter, loginCheck} = require('./routers');
const Playlist  = require('./models/config'); 
const cookieParser = require('cookie-parser');
const { Live } = require('./models/config');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: false })); 
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/music", express.static(path.join(__dirname, "public/musics")));
app.use(cookieParser());
app.use(loginCheck);

app.use('/', mainRouter);
app.use('/detail', detailRouter);
app.use('/music', musicRouter);
app.use('/live', liveRouter);
app.use('/mypage', mypageRouter);
app.use('/search', searchViewRouter);

const videosDir = path.join(__dirname, "public/videos");
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

const server = app.listen(3000, () => {
    console.log('http://localhost:3000 서버가 열렸습니다.');
});

const io = socketIo(server);

let currentSongInfo = null;
let isHostStreaming = false;
let streamChunks = [];
const MAX_CHUNKS = 10;

const onlineUsers = new Set();

io.use((socket, next) => {
  const token = socket.handshake.headers.cookie
    ?.split('; ')
    .find(cookie => cookie.startsWith('login_access_token='))
    ?.split('=')[1];

  if (token) {
    try {
      const userData = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.user = userData;
      console.log('✅ 유저 검색 완료:', userData);
    } catch (err) {
      console.error('❌ JWT 검증 실패:', err.message);
    }
  }
  next();
});

const broadcasters = {};
app.locals.broadcasters = broadcasters;

io.on('connection', (socket) => {

  let nickName = socket.user?.properties?.nickname;
  if (!nickName) {
    nickName = 'Guest_' + Math.floor(Math.random() * 10000);
  }

  socket.nickname = nickName;
  onlineUsers.add(nickName);
  console.log(`🟢 ${nickName}님이 접속하셨습니다.`);

  io.emit('updateUserList', Array.from(onlineUsers));

    socket.on("videoChunk", (chunk) => {
      console.log("청크 수신 크기:", chunk.byteLength);
      if (!socket.writeStream) {
        const videoFileName = `recorded_video_${Date.now()}.webm`;
        socket.videoFileName = videoFileName;
        socket.videoPath = path.join(videosDir, videoFileName);
        socket.writeStream = fs.createWriteStream(socket.videoPath, { flags: "a" });
      }
  
      if (socket.writeStream && socket.writeStream.writable) {
        if (!socket.writeStream.write(Buffer.from(chunk))) {
          socket.writeStream.once("drain", () => {
            console.log("💧 스트림 드레인 완료");
          });
        }
        io.emit("videoChunk", chunk);
      }
    });
  
    socket.on("endRecording", async () => {
        if (socket.writeStream) {
          socket.writeStream.end(async () => {
            console.log(`🎥 비디오 저장 완료: ${socket.videoPath}`);
      
            const relativeUrl = `/public/videos/${socket.videoFileName}`;
      
            try {
              await Live.create({
                live_url: relativeUrl,
                user_id: socket.user.id,
                createdAt: new Date(),
                updatedAt: new Date()
              });
              console.log("📦 live 테이블에 녹화정보 저장 완료!");
            } catch (err) {
              console.error("❌ live 테이블 저장 실패:", err);
            }
      
            socket.emit("videoSaved", { fileName: socket.videoFileName });
      
            io.emit("broadcastEnded", {
              message: `${socket.nickname || '호스트'}님의 방송이 종료되었습니다.`,
              nickname: socket.nickname || '호스트'
            });
      
            io.emit("endRecording");
          });
        }
      });
      

  socket.on("sendMessage", (message) => {
    try {
      console.log("받은 메시지:", message);
      io.emit("receiveMessage", message);
    } catch (err) {
      console.error("sendMessage 처리 오류:", err);
    }
  });

  socket.on("disconnect", () => {
    if (socket.nickname) {
      onlineUsers.delete(socket.nickname);
      console.log(`${socket.nickname}님이 퇴장하셨습니다.`);
      io.emit("updateUserList", Array.from(onlineUsers));
    }

    if (socket.role === "host" && socket.writeStream) {
      socket.writeStream.end(() => {
        console.log("강제 종료된 호스트 스트림 종료");
      });
    }
  });



    socket.on('broadcaster', (broadcastId) => {
      broadcasters[broadcastId] = socket.id;
      socket.broadcast.emit('broadcaster', broadcastId);
    });
  
    socket.on('watcher', (broadcastId) => {
      const broadcasterId = broadcasters[broadcastId];
      if (broadcasterId) {
        io.to(broadcasterId).emit('watcher', socket.id);
      }
    });
  
    socket.on('offer', (id, message) => {
      io.to(id).emit('offer', socket.id, message);
    });
  
    socket.on('answer', (id, message) => {
      io.to(id).emit('answer', socket.id, message);
    });
  
    socket.on('candidate', (id, message) => {
      io.to(id).emit('candidate', socket.id, message);
    });
  
    socket.on('disconnect', () => {
      for (const [broadcastId, id] of Object.entries(broadcasters)) {
        if (id === socket.id) {
          delete broadcasters[broadcastId];
          socket.broadcast.emit('broadcaster_closed', broadcastId);
          break;
        }
      }
      socket.broadcast.emit('disconnectPeer', socket.id);
    });
});

module.exports = { io, broadcasters };