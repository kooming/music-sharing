const router = require('express').Router()
const {musicController,likeController,playlistController} = require('../controllers');


router.get('/:id', async (req, res) => {
    try {
        const { id: musicId } = req.params;
        const { musicFind } = await musicController.musicSelectOne(musicId);
        const { musicList } = await musicController.musicSelectAll();

        if (musicFind) {
            let liked = null;
            if(req.user){
                const { id: userId } = req.user;
                const musicLikeResult = await likeController.likeUserMusic(musicId, userId);

                liked = musicLikeResult.likeCheckMusic.length > 0;
            }
            
            res.json({
                music: musicFind,
                liked, 
                musicList
            });
        } else {
            res.status(404).json({ message: '음악을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류' });
    }
});

router.post('/:id/like', async (req,res)=> {
    try {
        const { id : userId } = req.user
        const { id : musicId} = req.params;
        const result = await likeController.likeClick(musicId,userId)

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '좋아요 처리 실패' });
    }
})

router.get('/:id/likecheck', async (req, res) => {
  try {
    const { id } = req.params;
    const  { id :uid}  = req.user || {}; 
    if (!uid) {
      return res.json({ liked: false }); 
    }

    const { likeCheckMusic } = await likeController.likeUserMusic(id, uid);

    const liked = likeCheckMusic && likeCheckMusic.length > 0;
    
    res.json({ liked });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '좋아요 조회 실패' });
  }
});
router.get('/playlist/list', async (req,res)=> {
    if(!req.user) {
        return res.json("로그인 필요");
    }
    const {user} = req
    try {
        const result = await playlistController.getAllPlaylists(user.id)
        console.log(result);
        return res.json(result)
    } catch (error) {
        return console.log(error)
    }
})


module.exports=router