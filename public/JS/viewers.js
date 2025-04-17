const socket = io();
const remoteVideo = document.getElementById('main-stream');

let peerConnection;
let broadcasterId;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const userDiv = document.getElementById('user-info');
const user = {
  id: userDiv.dataset.id,
  nickname: userDiv.dataset.nickname
};
const init = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const broadcastId = Number(urlParams.get('broadcastId'));
  console.log("시청자 방송 입장:", broadcastId);
  if (!broadcastId) {
    return;
  }

  peerConnection = new RTCPeerConnection(config);

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('candidate', broadcasterId, event.candidate);
    }
  };

  socket.emit('watcher', broadcastId);
}
init()

socket.on('offer', (id, description) => {
  console.log(123);
  broadcasterId = id;
  peerConnection.setRemoteDescription(description)
    .then(() => peerConnection.createAnswer())
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit('answer', id, peerConnection.localDescription);
    });
});

socket.on('candidate', (id, candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on('broadcaster_closed', (broadcastId) => {
  if (broadcastId === broadcastId.value.trim()) {
    alert('방송이 종료되었습니다.');
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    remoteVideo.srcObject = null;
  }
});

socket.on("broadcastEnded", ({ message }) => {
  showSuccessAlert('방송이 종료되었습니다.(5초 뒤에 메인으로 돌아갑니다.')

  setTimeout(() => {
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    remoteVideo.srcObject = null;

    window.location.href = "/";
  }, 5000); 
});


window.onunload = window.onbeforeunload = () => {
  socket.close();
};

const chatInput = document.querySelector('.chat-input input');
const chatButton = document.querySelector('.chat-input button');
const chatBox = document.getElementById('chat-box');

function sendMessage(data) {
const message = chatInput.value.trim();
if (message !== '') {
socket.emit('sendMessage', { nickname: user.nickname, message }); // '나'는 고정된 사용자명
chatInput.value = '';
}
}

chatButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', e => {
if (e.key === 'Enter') sendMessage();
});

socket.on('receiveMessage', function (data) {
const { nickname, message } = data;
const chatBox = document.getElementById('chat-box');

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

// 메시지 박스를 채팅 박스에 추가하고 스크롤을 맨 아래로 이동
chatBox.appendChild(messageElement);
chatBox.scrollTop = chatBox.scrollHeight;
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