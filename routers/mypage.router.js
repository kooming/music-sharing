const router = require('express').Router();
const PostController = require('../controllers/post.controller');
const playlistController = require('../controllers/playlist.controller');
const userController = require('../controllers/user.controller');
const jwt = require('jsonwebtoken');
const loginCheck = require('./middleware')
const { upload } = require('../scripts/imgUpload')

router.get('/', loginCheck, async (req, res) => {
    const { user } = req;
    const count = await playlistController.getUserLikeCount(user.id);
    // console.log(user, 'user입니다.')
    // const userInfo = await userController.userInfo(user.id)
    const playlistsData = await playlistController.getAllPlaylists(user.id);
    const playlistNames = playlistsData.map((playlist) => playlist.playlistName);
    const uniquePlaylistNames = [...new Set(playlistNames)];
    songsByPlaylist = uniquePlaylistNames.map((playlistName) => {
        return playlistsData.map((playlist) => {
            if (playlist.playlistName === playlistName) {
                return playlist.Music;
            }
        }).filter((song) => song !== undefined);
    });
    playlistAndSongs = uniquePlaylistNames.map((playlistName) => {
        return {
            name: playlistName,
            songs: songsByPlaylist.shift()
        };
    });
    res.render('myPage', { playlistAndSongs, user, count })
});



router.get('/getPlaylistByName', async (req, res) => {
    const playlistName = req.query.index || '';
    const playlist = await playlistController.getPlaylistByName(playlistName);
    // console.log(playlist[0], 'playlist입니다.')
    res.send({ playlist });
})

router.get('/search', async (req, res) => { 
    const searchQuery = req.query.index || '';
    const results = await PostController.selectAll(searchQuery); 
    res.send({ results }); 
});

router.post('/createPlaylist', loginCheck, async (req, res) => {
    const { playlistName, tempNewSongs } = req.body;
    // console.log(req.user);
    const user_id = req.user.id

    try {
        for (let i = 0; i < tempNewSongs.length; i++) {
            await playlistController.createPlaylist(playlistName, tempNewSongs[i].music_id, user_id); // Create a playlist for each song
        }
        res.status(200).send('Playlist created successfully');
    } catch (error) {
        console.error('Error creating playlist:', error);
        res.status(500).send('Error creating playlist');
    }
})

router.post('/deletePlaylist', async (req, res) => {
    const { playlistId } = req.body;
    try {
        await playlistController.deletePlaylist(playlistId);
        res.status(200).send('Playlist deleted successfully');
    } catch (error) {
        console.error('Error deleting playlist:', error);
        res.status(500).send('Error deleting playlist');
    }
})

router.post('/addSongToPlaylist', loginCheck, async (req, res) => {
    const { playlistName, music_id } = req.body;
    const user_id = req.user.id
    console.log("playlistName:", playlistName);
    console.log("music_id:", music_id);
    console.log("user_id:", user_id);
    try {
        await playlistController.createPlaylist(playlistName, music_id, user_id);
        res.status(200).send('Song added to playlist successfully');
    } catch (error) {
        console.error('Error adding song to playlist:', error);
        res.status(500).send('Error adding song to playlist');
    }
})

router.post('/deleteSongFromPlaylist', async (req, res) => {
    const { playlistName, music_id } = req.body;
    try {
        await playlistController.deleteSongFromPlaylist(playlistName, music_id);
        res.status(200).send('Song deleted from playlist successfully');
    } catch (error) {
        console.error('Error deleting song from playlist:', error);
        res.status(500).send('Error deleting song from playlist');
    }
})

router.post('/updateProfile', loginCheck, upload.single('new_profile_image'), async (req, res) => {
    const { nickname } = req.body;
    if(req.file === undefined) {
        path = req.user.properties.profile_image
        // console.log(path, 'path입니다kkkkkkkkkkkkkkk.')
    } else {
        path = req.file.path
    }
    const uid = req.user.id
    const data = await userController.editProf(uid, nickname, path);
    // console.log(data.updatedUser, 'data입니다.')
    if (data.state === 200) {
        const token  = { 
            id : data.updatedUser.uid,
            properties : { 
                nickname : data.updatedUser.nickname,
                profile_image : data.updatedUser.profileImg
            } }
        const jwtToken = jwt.sign(token, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        res.cookie('login_access_token', jwtToken, {
            maxAge: 60 * 60 * 60 * 1000,
            httpOnly: true
        });
        res.json({ state: 200, message: data.message });
    } else {
        res.json({ state: data.state, message: data.message });
    }
})

// router.get('/playSong', async (req, res) => {
//     const { music_id } = req.query;
//     const musicResource = await playlistController.getMusicResource(music_id)
//     res.send({ musicResource })
    
// })

// router.get('/playPlaylist', async (req, res) => {
//     const { playlistName } = req.query;
//     let musicResources = await playlistController.getMusicResources(playlistName)
//     // console.log(musicReources.dataValues.Music.musicReources)
//     musicResources = musicResources.map((music) => {
//         return music.Music.musicResource
//     })
//     res.send({ musicResources })
// })

module.exports = router;