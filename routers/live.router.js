const router = require('express').Router();
const {liveController}  = require('../controllers');

router.get('/', async (req, res) => {
  const { user } = req;
  const { playlistName } = req.query;
  if (playlistName) {
    try {
      const recordedVideos = await liveController.getRecordedVideos();
      const formattedVideos = recordedVideos.map(video => {
        const raw = video.toJSON();
        const date = new Date(video.createdAt);
        const year = date.getFullYear();
        const time = date.toTimeString().split(' ')[0];
        return {
          ...raw,
          formattedDate: `${year} ${time}`
        };
      });

      res.render('liveStreaming', {
        user,
        recordedVideos: formattedVideos,
        playlistName
      });
    } catch (err) {
      console.error(" 녹화된 영상 정보 가져오기 실패:", err);
      res.status(500).send('서버 에러');
    }
  } else {
    res.status(400).send('Missing playlistName');
  }
});


router.get('/viewers', async (req, res) => {
  const { user } = req;
  const { playlistName } = req.query;
  if (playlistName) {
    try {
      const recordedVideos = await liveController.getRecordedVideos();
      res.render('viewers', { user, recordedVideos, playlistName });
    } catch (err) {
      console.error("❌ 녹화된 영상 정보 가져오기 실패:", err);
      res.status(500).send('서버 에러');
    }
  } else {
    res.status(400).send('Missing playlistName');
  }
});


router.get('/replay/:videoId', async (req, res) => {
  const { user } = req;
  const { videoId } = req.params;

  console.log("replay 라우터에서 videoId:", videoId);  // videoId가 제대로 전달되는지 확인

  try {
    const video = await liveController.getVideoById(videoId);

    console.log("viasdasdasddasddeo:", video);  // video 객체가 제대로 반환되는지 확인

    if (video) {
      const createdAt = new Date(video.createdAt);
      const year = createdAt.getFullYear();
      const time = createdAt.toTimeString().split(' ')[0]; // HH:MM:SS
      video.formattedDate = `${year} ${time}`;
      res.render('replay', { user, video });
    } else {
      res.status(404).send('비디오를 찾을 수 없습니다.');
    }
  } catch (err) {
    console.error('❌ 비디오 조회 실패:', err);
    res.status(500).send('서버 에러');
  }
});

  router.get('/api/musiclist/:playlistName', liveController.getPlaylistMusic);

  router.post("/update", liveController.updateLiveStatus);


  
router.get('/viewers', (req,res) => {
  const { user } = req;
  res.render('viewers', { user })
})
  
module.exports = router;
