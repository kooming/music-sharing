document.querySelectorAll('.playlist-card').forEach(card => { // 플레이리스트 카드 클릭 이벤트
    card.addEventListener('click', async function() {
        //e.stopPropagation(); // 이벤트 전파 방지
        openPlaylistPopup(card)
        
    });
});

async function openPlaylistPopup(card) { // 플레이리스트 팝업 열기
    const playlistName = card.getAttribute('data-playlist-id');
    document.querySelector('.playlist-popup').setAttribute('data-playlist-id', playlistName);
    document.querySelector('.delete-playlist-btn').setAttribute('data-playlist-id', playlistName);
    document.querySelector('.start-streaming-btn').setAttribute('data-playlist-id', playlistName);
    let playlistAndSongs = await axios.get(`/mypage/getPlaylistByName?index=${playlistName}`)
    playlistAndSongs = playlistAndSongs.data.playlist;
    for(let i = 0; i < playlistAndSongs.length; i++) {
            const playlistCreatedDate = playlistAndSongs[0].createdAt.split('T')[0].replace(/-/g, '.')
            document.getElementById('popup-title').textContent = playlistAndSongs[i].playlistName;
            document.getElementById('popup-meta').textContent = `생성일: ${playlistCreatedDate} • ${playlistAndSongs.length}곡`;
            // document.getElementById('popup-cover').src = playlistAndSongs[i].coverImage;
            // document.getElementById('popup-creator').textContent = userNickname;
            
            const songsContainer = document.getElementById('playlist-songs');
            songsContainer.innerHTML = '';
            playlistAndSongs.forEach(song => {
                const songElement = document.createElement('li');
                songElement.className = 'search-song-item';
                songElement.innerHTML = `
                <img class='search-song-img' src="/public/images/musicimages/${song.Music.songImg}" alt="${song.Music.songName}">
                <div class="search-song-name">${song.Music.songName}</div>
                <div class="search-song-artist">${song.Music.artist}</div>
                <div class="song-actions">
                <button class="song-action-btn delete-song-btn" title="곡 삭제">✕</button>
                </div>
                `;
                songsContainer.appendChild(songElement);
            });
            document.getElementById('playlist-popup-overlay').classList.add('active');
    }

    // 플레이리스트 내부 곡 삭제 이벤트
    document.querySelectorAll('.delete-song-btn').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.stopPropagation(); // 이벤트 전파 방지
            const songElement = button.closest('.song-item');
            const music_id = songElement.querySelector('.song-info').getAttribute('data-music-id');
            const playlistName = document.querySelector('.playlist-popup').getAttribute('data-playlist-id');
            const confirmDelete = confirm('정말로 이 곡을 삭제하시겠습니까?');
            // 플레이리스트에 곡이 하나만 남은 경우 플레이리스트 자체가 삭제됨을 알림
            
            if (confirmDelete) {
                if (playlistAndSongs.length === 1) {
                    const deleteLastSong = confirm('남은 한 곡을 삭제할 경우 플레이리스트가 제거됩니다. 진행하시겠습니까?');
                    if (deleteLastSong) {
                        await axios.post('/mypage/deletePlaylist', { playlistId: playlistName })
                        .then(response => {
                            console.log('플레이리스트 삭제 성공:', response.data);
                            location.reload(); // 페이지 새로고침
                        })
                        .catch(error => {
                            console.error('플레이리스트 삭제 실패:', error);
                            alert('플레이리스트 삭제 중 오류가 발생했습니다.');
                        });
                    } else {
                        return; // 삭제 취소
                    }
                }
                await axios.post('/mypage/deleteSongFromPlaylist', { playlistName, music_id })
                .then(response => {
                    console.log('곡 삭제 성공:', response.data);
                    openPlaylistPopup(document.querySelector('.playlist-popup'));
                })
                .catch(error => {
                    console.error('곡 삭제 실패:', error);
                });
            }
        });
    });

    // 플레이리스트 음악 재생 버튼 클릭 이벤트
    // document.querySelectorAll('.song-info').forEach(songInfo => {
    //     songInfo.addEventListener('click', async function() {
    //         const musicId = songInfo.getAttribute('data-music-id');
    //         const response = await axios.get(`/music/${musicId}`);
    //         const { music, liked, musicList: serverMusicList } = response.data;
    //         // console.log(response.data, 'response.data');
    //         updateMusic(music);
    //         audio.addEventListener('ended', function() {
    //             document.getElementById('custom-player').style.visibility = 'hidden';
    //             audio.currentTime = 0; // 음악이 끝나면 처음으로 돌아감
    //             audio.pause();
    //         })
    //     });
    // });

    // 플레이리스트 전체음악 재생 버튼 클릭 이벤트
    document.querySelector('#play_playlist_btn').addEventListener('click', async function () {
        const playlistName = document.querySelector('.playlist-popup').getAttribute('data-playlist-id');
        await axios.get(`/mypage/getPlaylistByName?index=${playlistName}`)
        .then(response => {
            prev_btn.style.display = 'block';
            next_btn.style.display = 'block';
            const playlistAndSongs = response.data.playlist;
            const playerBar = document.getElementById('custom-player');
            playerBar.style.visibility = 'visible';
            playerBar.style.opacity = '1';
            play_pause_btn.innerText = '⏸️'; // 재생 중 표시
            const musicResources = playlistAndSongs.map(song => song.Music.musicResource);
            let currentIndex = 0;
            function playNext() {
                if (currentIndex < musicResources.length) {
                    document.getElementById('player-title').innerText = playlistAndSongs[currentIndex].Music.songName;
                    document.getElementById('player-artist').innerText = playlistAndSongs[currentIndex].Music.artist;
                    document.getElementById('player-img').src = `/public/images/musicimages/${playlistAndSongs[currentIndex].Music.songImg}`;
                    audio.src = `/public/musics/${musicResources[currentIndex]}`;
                    audio.play();
                    currentIndex++;
                } else {
                    currentIndex = 0; // 재생이 끝나면 처음으로 돌아감
                }
            }
            audio.addEventListener('ended', playNext); // 곡이 끝날 때마다 다음 곡 재생
            playNext(); // 첫 곡 재생
            prev_btn.addEventListener('click', function() { // 이전 곡 버튼을 누르면 이전 곡 재생, 현재 곡이 첫 곡일 경우 마지막 곡 재생
                if (currentIndex === 1) {
                    currentIndex = musicResources.length - 1;
                    playNext();
                } else {
                    currentIndex = currentIndex - 2; 
                    playNext();
                }
            })
            next_btn.addEventListener('click', function() { // 다음 곡 버튼을 누르면 다음 곡 재생, 현재 곡이 마지막 곡일 경우 첫 곡 재생
                if (currentIndex === musicResources.length) {
                    currentIndex = 0;
                    playNext();
                } else {
                    playNext();
                }
            })            
        })
        .catch(error => {
            console.error('플레이리스트 재생 실패:', error);
            alert('플레이리스트 재생 중 오류가 발생했습니다.');
        });
    })
}


function updateMusic(music) {
    document.getElementById('player-title').innerText = music.songName;
    document.getElementById('player-artist').innerText = music.artist;
    document.getElementById('player-img').src = `/public/images/musicimages/${music.songImg}`;

    audio.src = `/public/musics/${music.musicResource}`;
    audio.play();

    const playerBar = document.getElementById('custom-player');
    playerBar.style.visibility = 'visible';
    playerBar.style.opacity = '1';
    prev_btn.style.display = 'none'
    next_btn.style.display = 'none'

    play_pause_btn.innerText = '⏸️'; // 재생 중 표시
}

document.getElementById('play_pause_btn').addEventListener('click', function() {
    if (audio.paused) {
        audio.play();
        this.innerText = '⏸️'; // 재생 중 표시
    } else {
        audio.pause();
        this.innerText = '▶️'; // 일시 정지 표시
    }
});

seek_bar.oninput = () => {
    audio.currentTime = seek_bar.value;
};

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// 🎵 오디오 시간 업데이트
audio.ontimeupdate = () => {
    seek_bar.max = audio.duration || 0;
    seek_bar.value = audio.currentTime || 0;

    current_time.innerText = formatTime(audio.currentTime);
    duration.innerText = formatTime(audio.duration);
};

// 플레이리스트 삭제
document.querySelectorAll('.delete-playlist-btn').forEach(button => {
    button.addEventListener('click', async function(e) {
        e.stopPropagation(); // 이벤트 전파 방지
        const playlistId = button.getAttribute('data-playlist-id');
        const confirmDelete = confirm('정말로 이 플레이리스트를 삭제하시겠습니까?');

        if (confirmDelete) {
            await axios.post('/mypage/deletePlaylist', { playlistId})
            .then(response => {
                console.log('플레이리스트 삭제 성공:', response.data);
                location.reload(); // 페이지 새로고침
            })
            .catch(error => {
                console.error('플레이리스트 삭제 실패:', error);
                alert('플레이리스트 삭제 중 오류가 발생했습니다.');
            });
        }
    })
})



// 팝업 닫기 버튼 이벤트
document.getElementById('close-popup').addEventListener('click', function() {
    closePlaylistPopup();
});
document.getElementById('playlist-popup-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closePlaylistPopup();
    }
});

// 곡 추가 폼 토글 버튼
document.getElementById('add-songs-toggle').addEventListener('click', function() {
    // const songsContainer = document.getElementById('playlist-songs');
    // songsContainer.innerHTML = '';
    const form = document.getElementById('add-song-form');
    form.classList.toggle('active');
    this.textContent = form.classList.contains('active') ? '- 취소' : '+ 곡 추가';
});

// 라이브 스트리밍 시작 버튼 이벤트
document.querySelector('.start-streaming-btn').addEventListener('click', function() {
    const PlaylistId = document.querySelector('.start-streaming-btn').getAttribute('data-playlist-id');
        window.location.href = `/live?playlistName=${PlaylistId}`;
});

// 플레이리스트 팝업 닫기 함수
function closePlaylistPopup() {
    document.getElementById('playlist-popup-overlay').classList.remove('active');
    document.body.style.overflow = '';
    // 곡 추가 폼 닫기
    document.getElementById('add-song-form').classList.remove('active');
    document.getElementById('add-songs-toggle').textContent = '+ 곡 추가';
}

// --------------------------------------------------------새 플레이리스트 생성 관련 기능

// 새 플레이리스트 버튼 이벤트 연결
document.querySelector('.createPlaylistBtn').addEventListener('click', function() {
    openCreatePlaylistPopup();
});

// 새 플레이리스트 팝업 열기
function openCreatePlaylistPopup() {
    document.getElementById('create-playlist-overlay').classList.add('active');
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    
    // 폼 초기화
    document.getElementById('new-playlist-name').value = '';
    document.getElementById('create-playlist-songs').innerHTML = '';
    document.getElementById('create-playlist-btn').disabled = true;
    updateEmptySongsMessage();
    
    tempNewSongs = [];
}

// 새 플레이리스트 팝업 닫기
function closeCreatePlaylistPopup() {
    document.getElementById('create-playlist-overlay').classList.remove('active');
    document.body.style.overflow = ''; // 배경 스크롤 복원
    // 곡 추가 폼 닫기
    document.getElementById('add-song-to-new-form').classList.remove('active');
    document.getElementById('add-song-to-new-toggle').textContent = '+ 곡 추가';
}

// 임시 저장용 배열
let tempNewSongs = [];

// 곡 추가 폼 토글
document.getElementById('add-song-to-new-toggle').addEventListener('click', function() {
    const form = document.getElementById('add-song-to-new-form');
    form.classList.toggle('active');
    this.textContent = form.classList.contains('active') ? '- 취소하기' : '+ 곡 추가';
});

function updateEmptySongsMessage() { // 비어있는 곡 메시지 업데이트
    const songsContainer = document.getElementById('create-playlist-songs');
    const emptyMessage = document.querySelector('.empty-songs-message');

    if (tempNewSongs.length === 0) {
        if (!emptyMessage) {
            const message = document.createElement('div');
            message.className = 'empty-songs-message';
            message.textContent = '아직 추가된 곡이 없습니다. 곡을 추가해주세요.';
            songsContainer.appendChild(message);
        }
    } else {
        if (emptyMessage) {
            emptyMessage.remove();
        }
    }
}

// 새 플레이리스트 노래 목록 렌더링
function renderNewPlaylistSongs() {
    const songsContainer = document.getElementById('create-playlist-songs');
    
    // 목록 초기화
    songsContainer.innerHTML = '';
    
    // 노래 목록 생성
    tempNewSongs.forEach(song => {
        const songElement = document.createElement('li');
        songElement.className = 'song-item';
        songElement.innerHTML = `
            <div class="song-number">${song.number}</div>
            <div class="song-info">
                <div class="song-title">${song.songName}</div>
                <div class="song-artist">${song.artist}</div>
            </div>
            <div class="song-actions">
                <button class="song-action-btn remove-song-btn" title="제거">✕</button>
            </div>
        `;
        songsContainer.appendChild(songElement);
        
        // 노래 제거 버튼 이벤트
        songElement.querySelector('.remove-song-btn').addEventListener('click', function() {
            const index = tempNewSongs.findIndex(s => s.songName === song.songName && s.artist === song.artist);
            if (index !== -1) {
                tempNewSongs.splice(index, 1);
                
                // 번호 재설정
                tempNewSongs.forEach((s, i) => { s.number = i + 1; });
                
                // 목록 다시 렌더링
                renderNewPlaylistSongs();
                
                // 비어있으면 생성 버튼 비활성화
                if (tempNewSongs.length === 0) {
                    document.getElementById('create-playlist-btn').disabled = true;
                }
                
                // 곡 없음 메시지 업데이트
                updateEmptySongsMessage();
            }
        });
    });
}

// 플레이리스트 생성 버튼 클릭
document.getElementById('create-playlist-btn').addEventListener('click', async function() {
    const playlistName = document.getElementById('new-playlist-name').value.trim();
    if (!playlistName) {showErrorAlert('플레이리스트 이름을 입력해주세요.');return;}
    if (tempNewSongs.length === 0) {showErrorAlert('플레이리스트에는 최소 한 개의 곡이 필요합니다.');return;}
    
    // user_id는 로그인한 유저의 쿠키에서 가져옴
    await axios.post('/mypage/createPlaylist', {
        playlistName,
        tempNewSongs
    })
    .then(response => {
        console.log('플레이리스트 생성 성공:', response.data);
    })
    .catch(error => {
        console.error('플레이리스트 생성 실패:', error);
        showErrorAlert('플레이리스트 생성 중 오류가 발생했습니다.');
    });

    closeCreatePlaylistPopup();
    location.reload();
    // showSuccessAlert(`'${playlistName}' 플레이리스트가 생성되었습니다!`);
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

// 팝업 닫기 버튼 이벤트
document.getElementById('close-create-popup').addEventListener('click', function() {
    closeCreatePlaylistPopup()
    }
);

// 팝업 외부 클릭 시 닫기
document.getElementById('create-playlist-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeCreatePlaylistPopup();
    }
});
 

// 추가할 곡 검색 기능
document.getElementById("search-bar").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        const searchQuery = document.getElementById("new-song-title").value;
        console.log(searchQuery);
        axios.get(`mypage/search?index=${searchQuery}`)
        .then(response => {
            const results = response.data.results;
            const songsContainer = document.getElementById("create-playlist-songs");
            songsContainer.innerHTML = ''; // 기존 결과 초기화

            if (results.length > 0) { 
                results.forEach(music => { 
                    const songImg = document.createElement("img");
                    songImg.className = "search-song-img";
                    songImg.src = `/public/images/musicimages/`+music.songImg;
                    const songName = document.createElement("div");
                    songName.className = "search-song-name";
                    songName.innerHTML = music.songName;
                    const artist = document.createElement("div");
                    artist.className = "search-song-artist";
                    artist.innerHTML = music.artist;
                    const addButton = document.createElement("button");
                    addButton.className = "search-song-add-btn";
                    addButton.innerHTML = "추가";
                    const songItem = document.createElement("li");
                    songItem.className = "search-song-item";
                    songItem.append(songImg, songName, artist, addButton);
                    songsContainer.appendChild(songItem);

                    addButton.onclick = () => {
                        const newSong = {
                            number: tempNewSongs.length + 1,
                            songName: music.songName,
                            artist: music.artist,
                            liked: false,
                            music_id: music.id,
                        };               
                        // 임시 배열에 노래 추가
                        tempNewSongs.push(newSong);              
                        // 목록 다시 렌더링
                        renderNewPlaylistSongs();                
                        // 폼 초기화 및 닫기
                        document.getElementById('add-song-to-new-form').classList.remove('active');
                        document.getElementById('add-song-to-new-toggle').textContent = '+ 곡 추가';
                        document.getElementById('new-song-title').value = '';                
                        // 생성 버튼 활성화
                        document.getElementById('create-playlist-btn').disabled = false;                 
                        // 곡 없음 메시지 업데이트
                        updateEmptySongsMessage();
                    }

                });
            } else { 
                const emptyMessage = document.createElement("div");
                emptyMessage.innerHTML = "검색 결과가 없습니다.";
                songsContainer.appendChild(emptyMessage);
            } 
        })
        .catch(error => {
            console.error("검색 오류:", error);
            showErrorAlert('검색 중 오류가 발생했습니다.');
        });
    }
});





// 기존 플레이리스트에서 한 곡씩 추가하기 위한 검색 기능
document.getElementById("search-bar2").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        const searchQuery = document.getElementById("new-song-title2").value;
        axios.get(`mypage/search?index=${searchQuery}`)
        .then(response => {
            const results = response.data.results;
            const songsContainer = document.getElementById("playlist-songs");
            const searchContainer = document.getElementById("add-song-form");
            console.log(results, 'results');
            if (results.length > 0) { 
                results.forEach(music => { 
                    const songImg = document.createElement("img");
                    songImg.className = "search-song-img";
                    songImg.src = `/public/images/musicimages/`+music.songImg;
                    const songName = document.createElement("div");
                    songName.className = "search-song-name";
                    songName.innerHTML = music.songName;
                    const artist = document.createElement("div");
                    artist.className = "search-song-artist";
                    artist.innerHTML = music.artist;
                    const addButton = document.createElement("button");
                    addButton.className = "search-song-add-btn";
                    addButton.innerHTML = "추가";
                    const songItem = document.createElement("li");
                    songItem.className = "search-song-item";
                    songItem.append(songImg, songName, artist, addButton);
                    searchContainer.appendChild(songItem);

                    addButton.onclick = async () => {
                        await axios.post('/mypage/addSongToPlaylist', {
                            playlistName: document.querySelector('.start-streaming-btn').getAttribute('data-playlist-id'),
                            music_id: music.id
                        })
                        .then(response => {
                            console.log('곡 추가 성공:', response.data);
                            showSuccessAlert('플레이리스트에 곡이 추가되었습니다.');
                        })
                        .catch(error => {
                            console.error('곡 추가 실패:', error);
                            showErrorAlert('플레이리스트에 동일한 곡이 이미 존재합니다.');
                        });

                        // 폼 초기화 및 닫기
                        document.getElementById('add-song-form').classList.remove('active');
                        document.getElementById('add-songs-toggle').textContent = '+ 곡 추가';
                        document.getElementById('new-song-title2').value = '';    

                        openPlaylistPopup(document.querySelector('.playlist-popup'));
                    }
                });
            } else { 
                showErrorAlert('검색 결과가 없습니다.');
            } 
        })
        .catch(error => {
            console.error("검색 오류:", error);
            showErrorAlert('검색 중 오류가 발생했습니다.');
        });
    }
});



// ---------------------------------------------------------프로필 수정 관련 기능    

  
// 프로필 수정 팝업 열기
document.querySelector('.edit-profile').addEventListener('click', function(e) {
    e.preventDefault();
    openEditProfilePopup();
    profile.onchange = function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.querySelector('#preview_image').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
});
function openEditProfilePopup() {
    document.getElementById('edit-profile-overlay').classList.add('active');
    document.body.style.overflow = 'hidden'; 
}
function closeEditProfilePopup() {
    document.getElementById('edit-profile-overlay').classList.remove('active');
    document.body.style.overflow = ''; 
}


editProf.onsubmit = async (e) => { // 프로필 수정 폼 제출 이벤트
    e.preventDefault();
    const { new_nickname, new_profile_image } = e.target;
    const form = new FormData();
    form.append('nickname', new_nickname.value);
    form.append('new_profile_image', new_profile_image.files[0]);
    try {
        await axios.post('/mypage/updateProfile', form, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
       
        closeEditProfilePopup();
        document.querySelector('h1').textContent = new_nickname.value;
        if (new_profile_image.files[0]) {
            document.querySelector('.profile-image').src = URL.createObjectURL(new_profile_image.files[0]);
        }
        showSuccessAlert('프로필이 성공적으로 업데이트되었습니다!');
    } catch (error) {
        console.error('프로필 업데이트 실패:', error);
        showErrorAlert('프로필 업데이트 중 오류가 발생했습니다.');
    }
}

// 팝업 닫기 버튼 이벤트
document.getElementById('close-edit-popup').addEventListener('click', function() {
    closeEditProfilePopup();
});
document.getElementById('edit-profile-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeEditProfilePopup();
    }
});

