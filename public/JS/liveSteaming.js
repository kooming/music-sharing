const playButton = document.querySelector('.play-button');
const videoElement = document.getElementById('main-stream');
const titleElement = document.getElementById('stream-title');
const artistElement = document.getElementById('stream-artist');
const hostniclElement = document.getElementById('stream-nick');
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const volumeSlider = document.querySelector('.volume-slider');
const hostCanvas = document.getElementById("hostCanvas");
const audio = document.getElementById('audio');
const hostCtx = hostCanvas.getContext("2d");
const urlParams = new URLSearchParams(window.location.search);
const playlistName = urlParams.get('playlistName');
const musicId = urlParams.get('musicId');
const socket = io();
let userImage = new Image();
let imageLoaded = false;
userImage.onload = function () {
  imageLoaded = true;
};
let isPlaying = false;
let musicdata = [];
let currentIndex = 0;
const chatBubbles = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!playlistName) {
    alert("Missing playlistName in URL");
    return;
  }

  try {
    const res = await axios.get(`/live/api/musiclist/${encodeURIComponent(playlistName)}`);
    const allMusic = res.data;

    const filteredMusic = musicId
      ? allMusic.filter(music => music.musicid == musicId)
      : allMusic;

    musicdata = filteredMusic;

    if (!musicdata.length) {
      alert("재생할 음악이 없습니다.");
      return;
    }

    let combinedStream = new MediaStream();

    const playNext = () => {
      if (currentIndex >= musicdata.length) {
        console.log("모든 트랙 재생 완료");
        showSuccessAlert('모든 트랙 재생 완료')
        return;
      }
      
      const music = musicdata[currentIndex];
      
      audio.src = `/public/musics/${music.musicResource}`;
      imageLoaded = false;
      userImage.src = `/public/images/musicimages/${music.songImg}`;
      titleElement.textContent = music.songName || '제목 없음';
      artistElement.textContent = `아티스트: ${music.artist || '알 수 없음'}`;
      
      audio.play().catch(error => {
        console.warn("자동 재생 실패: 사용자 액션이 필요할 수 있음.", error);
      });
      currentIndex++;
    };
    audio.addEventListener('ended', () => playNext());
   
    drawHostCanvas();
    playNext();
    console.log("현재 곡이 끝났습니다.");
    playNextSong();  // 오디오만 바뀌고, MediaRecorder는 건드리지 않음

  } catch (error) {
    console.error("음악 목록 로딩 실패:", error);
  }
});

function drawHostCanvas() {
  
  hostCtx.clearRect(0, 0, hostCanvas.width, hostCanvas.height);
  hostCtx.imageSmoothingEnabled = false;
  if (imageLoaded) {
    hostCtx.drawImage(userImage, 0, 0, hostCanvas.width, hostCanvas.height);
  } else {
    hostCtx.fillStyle = "black";
    hostCtx.fillRect(0, 0, hostCanvas.width, hostCanvas.height);
  }
  for (let i = chatBubbles.length - 1; i >= 0; i--) {
    const bubble = chatBubbles[i];
    bubble.y -= bubble.dy;
    bubble.alpha -= 0.001;

    if (bubble.alpha <= 0) {
      chatBubbles.splice(i, 1);
      continue;
    }
    hostCtx.globalAlpha = bubble.alpha;
    hostCtx.fillStyle = "#FFF"; // 완전한 검정
    hostCtx.font = "20px sans-serif";
    hostCtx.fillText(bubble.text, bubble.x, bubble.y);
    hostCtx.globalAlpha = 1.0;
  }

  requestAnimationFrame(drawHostCanvas);
}

startRecordingBtn.addEventListener("click", () => {
  axios.post('/live/update', {
    islive: true,
    playlistName
  }).then(() => {
    startRecordingBtn.style.display = 'none';
    stopRecordingBtn.style.display = 'inline-block';
  });
});

// 녹화 종료 버튼
stopRecordingBtn.addEventListener("click", () => {
  axios.post('/live/update', {
    islive: false,
    playlistName
  }).then(() => {
    console.log('라이브 상태 false로 업데이트됨');
    
  }).catch((err) => {
    console.error('라이브 상태 업데이트 실패:', err);
  });

  startRecordingBtn.style.display = "inline";
  stopRecordingBtn.style.display = "none";

window.addEventListener('beforeunload', () => {
  axios.post('/live/update', {
    islive: false,
    playlistName
  });
});

  mediaRecorder.stop(); 
  socket.emit("endRecording"); 


  showSuccessAlert("녹화가 중지되었습니다");
});

const playNextSong = () => {
  audio.play();
};


playButton.addEventListener('click', () => {
  if (isPlaying) {
    audio.pause();
    playButton.innerHTML = '▶';
  } else {
    audio.play();
    playButton.innerHTML = '⏸';
  }
  isPlaying = !isPlaying;
});

volumeSlider.addEventListener('input', function () {
  audio.volume = this.value / 100;
});

// 채팅
const chatInput = document.querySelector('.chat-input input');
const chatButton = document.querySelector('.chat-input button');
const chatBox = document.getElementById('chat-box');

function sendMessage(data) {
  const message = chatInput.value.trim();
  if (message !== '') {
    socket.emit('sendMessage', { nickname: user.nickname, message }); 
    chatInput.value = '';
  }
}

chatButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendMessage();
});

socket.on('receiveMessage', function (data) {
  const { nickname, message } = data;
  const x = Math.floor(Math.random() * (hostCanvas.width - 100)) + 50;
  const y = hostCanvas.height - 30;
  const dy = 0.5;   
  const alpha = 1;  

  chatBubbles.push({
    text: message,
    x: x,
    y: y,
    dy: dy,
    alpha: alpha,
    timestamp: Date.now()
  });

  if (chatBubbles.length > 5) chatBubbles.shift();

  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message';

  if (nickname === user.nickname) {
    messageElement.className = 'chat-message my-message';
  messageElement.innerHTML = `
  <div class="user-name">나</div>
  <div class="message-text">${message}</div>
    `;
  } else {
  messageElement.className = 'chat-message other-message';
  messageElement.innerHTML = `
  <div class="user-name">${nickname}</div>
  <div class="message-text">${message}</div>
    `;
  }
  console.log('받은 메시지:', message);

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (chatBubbles.length > 10) chatBubbles.shift();
});

socket.on('updateUserList', (userList) => {
  const userListDiv = document.querySelector('.user-list');
  userListDiv.innerHTML = '';
  userList.forEach(user => {
    const userItem = document.createElement('div');
    userItem.textContent = `👤 ${user}`;
    userItem.className = 'user-item';
    userListDiv.appendChild(userItem);
  });
});

const peerConnections = {};
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

let combinedStream;
const userDiv = document.getElementById('user-info');
const user = {
  id: userDiv.dataset.id,
  nickname: userDiv.dataset.nickname
};

startRecordingBtn.onclick = () => {
  const broadcastId = Number(user.id) // 방송 아이디 입력
  console.log("방송 시작하는 유저 ID:", broadcastId);
  // 캔버스 스트림 생성
  const canvasStream = hostCanvas.captureStream(30); // 30fps
  showSuccessAlert("라이브 방송이 시작되었습니다!");
  // 오디오 스트림 생성
  audio.play();
  const audioContext = new AudioContext();
  const source = audioContext.createMediaElementSource(audio);
  const destination = audioContext.createMediaStreamDestination();
  source.connect(destination);
  source.connect(audioContext.destination);
  const audioStream = destination.stream;

  // 비디오와 오디오 트랙 결합
  combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioStream.getAudioTracks()
  ]);

  videoElement.srcObject = combinedStream;



  mediaRecorder = new MediaRecorder(combinedStream, {
  mimeType: "video/webm;codecs=vp9"
  });


  // ✅ 청크 수집
  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      socket.emit("videoChunk", event.data); // 청크 전송!
    }
  };

  mediaRecorder.start(1000); // 1초마다 청크 전송
  socket.emit('broadcaster', broadcastId);
  showSuccessAlert("라이브 방송이 시작되었습니다!");
};

socket.on('watcher', id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;

  combinedStream.getTracks().forEach(track => peerConnection.addTrack(track, combinedStream));

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('candidate', id, event.candidate);
    }
  };

  peerConnection.createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit('offer', id, peerConnection.localDescription);
    });
});

socket.on('answer', (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on('candidate', (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('disconnectPeer', id => {
  if (peerConnections[id]) {
    peerConnections[id].close();
    delete peerConnections[id];
  }
});

// 에러 알림 표시
function showErrorAlert(message) {
  const alertElement = document.createElement('div');
  alertElement.className = 'error-alert';
  alertElement.textContent = message;
  
  document.body.appendChild(alertElement);
  
  setTimeout(() => {
      alertElement.classList.add('show');
  }, 10);
  
  setTimeout(() => {
      alertElement.classList.remove('show');
      setTimeout(() => {
          alertElement.remove();
      }, 300);
  }, 3000);
  }
  
  // 성공 알림 표시
  function showSuccessAlert(message) {
  const alertElement = document.createElement('div');
  alertElement.className = 'error-alert';
  alertElement.style.backgroundColor = '#4CAF50';
  alertElement.textContent = message;
  document.body.appendChild(alertElement);
  
  setTimeout(() => {
      alertElement.classList.add('show');
  }, 10);
  
  setTimeout(() => {
      alertElement.classList.remove('show');
      setTimeout(() => {
          alertElement.remove();
      }, 300);
  }, 3000);
  }