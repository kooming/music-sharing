const musicInfo = document.querySelectorAll('.music-info');
const addToPlayListBtn = document.getElementById('add-to-playlist-btn')
const likeButton = document.getElementById('like-button');
const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('play-pause-btn');
const seekBar = document.getElementById('seek-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const nextButton = document.getElementById('next-btn');
const prevButton = document.getElementById('prev-btn');
const volumeBar = document.getElementById('volume-bar');
const plusBtn = document.getElementById('plus-button');
const playlistModal = document.getElementById('playlist-modal');
const modalContent = document.getElementById('modal-content');
const createPlaylistBtn =document.getElementById('create-playlist-btn')
const cancelCreateBtn =document.getElementById('cancel-create-btn')
const selectAllCheckbox = document.querySelector('.music-header input[type="checkbox"]');
const musicCheckboxes = document.querySelectorAll('.music-checkbox');


let musicList = [];            
let currentMusicId = null;     
let currentMusicIndex = null;  
let history = [];              
let currentHistoryIndex = -1;  


function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

audio.volume = 0.5;

volumeBar.oninput = () => {
    audio.volume = volumeBar.value;
};


function updateMusic(music) {
    document.getElementById('player-title').innerText = music.artist;
    document.getElementById('player-artist').innerText = music.songName;
    document.getElementById('player-img').src = `public/images/musicimages/${music.songImg}`;
    audio.src = `/public/musics/${music.musicResource}`;
    audio.play();

    const playerBar = document.getElementById('custom-player');
    playerBar.style.visibility = 'visible';
    playerBar.style.opacity = '1';

    playPauseBtn.innerText = '⏸️'; 
}
musicInfo.forEach((info) => {
    info.onclick =  async (e) => {
        const id = e.currentTarget.dataset.id;

        try {
            const response = await axios.get(`/music/${id}`);
            const { music, liked, musicList: serverMusicList } = response.data;

            updateMusic(music);
            musicList = serverMusicList;
            currentMusicId = id;

            
            const foundIndex = musicList.findIndex(item => item.id === music.id);
            currentMusicIndex = foundIndex;

            history = [];
            history.push(currentMusicIndex);
            currentHistoryIndex = 0;

            if (liked) {
                likeButton.innerText = '❤️';
            } else {
                likeButton.innerText = '🤍';
            }
        } catch (error) {
            console.error('음악 가져오기 실패:', error);
        }
    };
});

likeButton.onclick = async () => {
    try {
        const response = await axios.post(`/music/${currentMusicId}/like`);
        const result = response.data;

        if (result.state === 200) {
            if (result.message === "좋아요 완료") {
                likeButton.innerText = '❤️';
                showSuccessAlert("좋아요 완료")
            } else if (result.message === "좋아요 삭제") {
                likeButton.innerText = '🤍';
                showSuccessAlert("좋아요 삭제")
            }
        }
    } catch (error) {
        console.error('좋아요 실패:', error);
        window.location.href = '/login'
    }
};


playPauseBtn.onclick = () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.innerText = '⏸️';
    } else {
        audio.pause();
        playPauseBtn.innerText = '▶️';
    }
};


seekBar.oninput = () => {
    audio.currentTime = seekBar.value;
};


audio.ontimeupdate = () => {
    seekBar.max = audio.duration || 0;
    seekBar.value = audio.currentTime || 0;

    currentTimeEl.innerText = formatTime(audio.currentTime);
    durationEl.innerText = formatTime(audio.duration);
};


audio.onended = () => {
    playRandomNext();
};


nextButton.onclick = () => {
    playRandomNext();
};


prevButton.onclick = async () => {
    if (currentHistoryIndex > 0) {
        currentHistoryIndex -= 1;
        const prevIndex = history[currentHistoryIndex];
        const prevMusic = musicList[prevIndex];
        updateMusic(prevMusic);

        try {
            
            const response = await axios.get(`/music/${prevMusic.id}/likecheck`);
            const { liked } = response.data;

            currentMusicId = prevMusic.id; 
            if (liked) {
                likeButton.innerText = '❤️';
            } else {
                likeButton.innerText = '🤍';
            }
        } catch (error) {
            console.error('이전 곡 좋아요 상태 조회 실패:', error);
        }

    } else {
        showErrorAlert('처음 곡입니다. 더 이상 이전 곡이 없습니다.');
    }
};



async function playRandomNext() {
    
    
    let nextIndex;
    do {
        nextIndex = Math.floor(Math.random() * musicList.length);
    } while (history.length && nextIndex === history[currentHistoryIndex]);
    
    const nextMusic = musicList[nextIndex];
    updateMusic(nextMusic);
    
    history = history.slice(0, currentHistoryIndex + 1);
    history.push(nextIndex);
    currentHistoryIndex = history.length - 1;
    
    try {
        
        const response = await axios.get(`/music/${nextMusic.id}/likecheck`);
        const { liked } = response.data;

        
        
        currentMusicId = nextMusic.id; 
        if (liked) {
            likeButton.innerText = '❤️';
        } else {
            likeButton.innerText = '🤍';
        }
    } catch (error) {
        console.error('다음 곡 좋아요 상태 조회 실패:', error);
    }
}

plusBtn.onclick = async () => {
    try {
        const response = await axios.get('/music/playlist/list', {
            withCredentials: true
        });
        const rawPlaylists = response.data;

        const groupedPlaylists = {};
        rawPlaylists.forEach(item => {
            if (!groupedPlaylists[item.playlistName]) {
                groupedPlaylists[item.playlistName] = {
                    playlistName: item.playlistName,
                    songs: []
                };
            }
            groupedPlaylists[item.playlistName].songs.push(item);
        });

        const playlists = Object.values(groupedPlaylists); 

        playlistModal.style.display = 'flex';
        modalContent.innerHTML = '';

        
        const header = document.createElement('div');
        header.classList.add('modal-header');

        const title = document.createElement('h2');
        title.innerText = '플레이 리스트 선택';
        title.classList.add('modal-title');
        header.appendChild(title);

        const closeButton = document.createElement('button');
        closeButton.innerText = '✖';
        closeButton.classList.add('close-button');
        closeButton.onclick = () => {
            playlistModal.style.display = 'none';
        };
        header.appendChild(closeButton);

        modalContent.appendChild(header);

        playlists.forEach(playlist => {
            const item = document.createElement('div');
            item.innerText = playlist.playlistName;
            item.classList.add('playlist-item');

            
            item.onclick = async () => {
                try {
                  const musicIds = window.selectedMusicIds || (currentMusicId ? [currentMusicId] : []);
              
                  if (musicIds.length === 0) {
                    showErrorAlert('플레이리스트에 담을 곡이 없습니다!');
                    return;
                  }
              
                  
                  const checkRes = await axios.get(`/music/playlist/list`, {
                    withCredentials: true
                  });
              
                  const alreadyInPlaylist = checkRes.data.filter(
                    (item) => item.playlistName === playlist.playlistName
                  ).map((item) => item.music_id);
              
                  
                  const filtered = musicIds.filter(id => !alreadyInPlaylist.includes(Number(id)));
              
                  if (filtered.length === 0) {
                    showErrorAlert('이미 해당 재생목록에 추가된 곡입니다!');
                    return;
                  }
              
                  const tempNewSongs = filtered.map(id => ({ music_id: id }));
              
                  await axios.post('/mypage/createPlaylist', {
                    playlistName: playlist.playlistName,
                    tempNewSongs
                  }, {
                    withCredentials: true
                  });
              
                  showSuccessAlert('선택한 곡들이 플레이리스트에 담겼습니다!');
                  
                  playlistModal.style.display = 'none';
                  document.querySelectorAll('.music-checkbox:checked').forEach(cb => cb.checked = false);
                } catch (error) {
                  console.error('플레이 리스트 담기 실패:', error);
                }
              };                

            modalContent.appendChild(item);
        });

        
        const createNewPlaylistBtn = document.createElement('div');
        createNewPlaylistBtn.innerText = '+ 새 플레이 리스트 추가';
        createNewPlaylistBtn.classList.add('create-playlist-button');
        createNewPlaylistBtn.onclick = () => {
            document.getElementById('playlist-modal').style.display = 'none';
            document.getElementById('new-playlist-modal').style.display = 'flex';
        };
        modalContent.appendChild(createNewPlaylistBtn);

    } catch (error) {
        console.error('플레이 리스트 가져오기 실패:', error);
        window.location.href = "/login"
    }
};


createPlaylistBtn.onclick = async () => {
    const playlistName = document.getElementById('new-playlist-name').value.trim();
    const regex = /^[a-zA-Z0-9\s가-힣ㄱ-ㅎㅏ-ㅣ]+$/;
    if(!regex.test(playlistName)) return showErrorAlert('특수문자를 제외해주세요.')
    document.getElementById('new-playlist-name').value = ""
    if (!playlistName) {
      showErrorAlert('플레이 리스트 이름을 입력하세요.');
      return;
    }
  
    
    const checkboxes = document.querySelectorAll('.music-checkbox:checked');
    const selectedIds = Array.from(checkboxes)
    .map(cb => cb.dataset.musicId)
    .filter(id => id); 
  
    const validIds = selectedIds.length > 0
      ? selectedIds
      : (currentMusicId ? [currentMusicId] : []);
  
    if (validIds.length === 0) {
      showErrorAlert('플레이리스트에 담을 곡이 없습니다!');
      return;
    }
  
    const tempNewSongs = validIds
    .map(id => parseInt(id))
    .filter(id => !isNaN(id)) 
    .map(id => ({ music_id: id }));
  
    try {
      await axios.post('/mypage/createPlaylist', {
        playlistName,
        tempNewSongs
            }, {
        withCredentials: true
            });
  
      showSuccessAlert('재생목록이 생성되었습니다.');
      document.getElementById('new-playlist-modal').style.display = 'none';
      playlistModal.style.display = 'none';
      document.querySelectorAll('.music-checkbox:checked').forEach(cb => cb.checked = false);
      selectAllCheckbox.checked = false;
    } catch (error) {
      console.error('생성 실패:', error);
      showErrorAlert('플레이 리스트 이름이 너무 깁니다.');
    }
};
  

cancelCreateBtn.onclick = () => {
  document.getElementById('new-playlist-name').value = ""
  document.getElementById('new-playlist-modal').style.display = 'none';
};

addToPlayListBtn.onclick = async () => {
    const checked = document.querySelectorAll('.music-checkbox:checked');
    const selectedIds = Array.from(checked).map(cb => cb.dataset.musicId);
  
    if (selectedIds.length === 0) {
      showErrorAlert('플레이리스트에 담을 곡을 선택해주세요!');
      return;
    } 

    try {
      const response = await axios.get('/music/playlist/list', {
        withCredentials: true
      });
      if(response.data === "로그인 필요"){
        window.location.href = '/login'
      }
      const rawPlaylists = response.data;
      
      window.selectedMusicIds = selectedIds;
      playlistModal.style.display = 'flex';

      const groupedPlaylists = {};
      rawPlaylists.forEach(item => {
        if (!groupedPlaylists[item.playlistName]) {
          groupedPlaylists[item.playlistName] = {
            playlistName: item.playlistName,
            songs: []
          };
        }
        groupedPlaylists[item.playlistName].songs.push(item);
      });
  
      const playlists = Object.values(groupedPlaylists);
      modalContent.innerHTML = '';
  
      const header = document.createElement('div');
      header.classList.add('modal-header');
      header.innerHTML = `
        <h2 class="modal-title">플레이 리스트 선택</h2>
        <button class="close-button">✖</button>
      `;
      header.querySelector('.close-button').onclick = () => {
        playlistModal.style.display = 'none';
      };
      modalContent.appendChild(header);
  
      playlists.forEach(playlist => {
        const item = document.createElement('div');
        item.innerText = playlist.playlistName;
        item.classList.add('playlist-item');
        item.onclick = async () => {
          try {
            const tempNewSongs = window.selectedMusicIds.map(id => ({ music_id: id }));
            await axios.post('/mypage/createPlaylist', {
              playlistName: playlist.playlistName,
              tempNewSongs
            }, {
              withCredentials: true
            });
  
            showSuccessAlert('선택한 곡들이 플레이리스트에 담겼습니다!');
            playlistModal.style.display = 'none';
            document.querySelectorAll('.music-checkbox:checked').forEach(cb => cb.checked = false);
          } catch (err) {
            console.error('추가 실패!', err);
            showErrorAlert('플레이 리스트에 중복노래가 존재합니다.')
          }
        };
        modalContent.appendChild(item);
      });
  
    const createNewPlaylistBtn = document.createElement('div');
    createNewPlaylistBtn.innerText = '+ 새 플레이 리스트 추가';
    createNewPlaylistBtn.classList.add('create-playlist-button');
    createNewPlaylistBtn.onclick = () => {
        playlistModal.style.display = 'none';
        document.getElementById('new-playlist-modal').style.display = 'flex';
      };
    modalContent.appendChild(createNewPlaylistBtn);
    } catch (error) {
      console.error('플레이 리스트 가져오기 실패:', error);
    }
};




selectAllCheckbox.addEventListener('change', () => {
  const checked = selectAllCheckbox.checked;
  musicCheckboxes.forEach(cb => cb.checked = checked);
});


musicCheckboxes.forEach(cb => {
  cb.addEventListener('change', () => {
    const allChecked = Array.from(musicCheckboxes).every(cb => cb.checked);
    selectAllCheckbox.checked = allChecked;
  });
});

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
