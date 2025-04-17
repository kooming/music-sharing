const db = require('../models/config');

const liveController = {
  async getUserPlaylist(req, res) {
    try {
      const user = await db.User.findOne({
        where: { uid: 'user123' }
      });

      if (!user) {
        return res.status(404).send('User not found');
      }

      const playlists = await db.Playlist.findAll({
        where: { user_id: 'user123' },
        include: [{
          model: db.Music,
          required: false
        }]
      });

      res.render('mypage', {
        user,
        playlists
      });
    } catch (err) {
      console.error('Error in getUserPlaylist:', err);
      res.status(500).send('Server error');
    }
  },

  async getPlaylistMusic(req, res) {
    try {
      const { playlistName } = req.params;

      const playlist = await db.Playlist.findAll({
        where: { playlistName },
        include: [{ model: db.Music }]
      });

      if (!playlist || playlist.length === 0) {
        return res.status(404).send('Playlist not found');
      }

      const musicData = playlist.map(p => p.Music).flat();
      res.json(musicData);
    } catch (err) {
      console.error('Error in getPlaylistMusic:', err);
      res.status(500).send('Server error');
    }
  },

  async updateLiveStatus(req, res) {
    const { islive, playlistName } = req.body;

    console.log("요청된 islive:", islive);
    console.log("요청된 playlistName:", playlistName);

    if (!playlistName) {
      return res.status(400).json({ success: false, message: "playlistName이 필요합니다." });
    }

    try {
      await db.Playlist.update(
        { isLive: islive },
        { where: { playlistName } }
      );

      res.json({ success: true });
    } catch (error) {
      console.error("라이브 상태 업데이트 실패:", error);
      res.status(500).json({ success: false });
    }
  },

  async getLiveStatus() {
    try {
      const liveStatus = await db.Playlist.findAll({
        where: { isLive: true },
        attributes: ['playlistName', 'isLive'],
      });

      if (!liveStatus || liveStatus.length === 0) {
        console.log('현재 라이브 중인 항목이 없습니다.');
        return [];
      }

      const uniqueLiveStatus = Array.from(new Set(liveStatus.map(p => p.playlistName)))
        .map(name => liveStatus.find(p => p.playlistName === name));

      return uniqueLiveStatus;
    } catch (error) {
      console.error("라이브 상태 조회 실패:", error);
      return [];
    }
  },

  async getRecordedVideos() {
    try {
      const recordedVideos = await db.Live.findAll({
        order: [['createdAt', 'DESC']],
      });
      return recordedVideos;
    } catch (err) {
      console.error("❌ 녹화된 영상 정보 가져오기 실패:", err);
      throw err;
    }
  },

  async getVideoById(videoId) {
    try {
      const video = await db.Live.findOne({
        where: { id: videoId },
      });

      if (!video) {
        console.log("해당 videoId로 비디오를 찾을 수 없습니다:", videoId);
      } else {
        console.log("찾은 비디오:", video);
      }

      return video;
    } catch (err) {
      console.error("❌ 비디오 조회 실패:", err);
      throw err;
    }
  }
};

module.exports = liveController;
