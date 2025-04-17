const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const {userController,musicController, liveController, playlistController} = require('../controllers')


router.get('/',async (req,res)=> {
    const broadcasters = req.app.locals.broadcasters || {};
    const liveIds = Object.keys(broadcasters); 
        
    const {user} = req
    console.log("메인페이지 유저:", user); 
    if(user){
        user.likeCount = await playlistController.getUserLikeCount(user.id);
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
        user.playListCount = uniquePlaylistNames.map((playlistName) => {
            return {
                name: playlistName,
                songs: songsByPlaylist.shift()
            };
        }).length;
    }
    
    const {musicList} = await musicController.musicSelectAll()
    const chatList = await musicController.getPopularMusics()
    const plainChatList = chatList.map(music => music.toJSON());
    const livePlaylists = await liveController.getLiveStatus();
    const arr = []
    for (let i = 0; i < 12; i++) {
        const music = Math.floor(Math.random() * musicList.length)
        arr.push(musicList[music]);
        musicList.splice(music, 1)
    }
    res.render('main',{user,musicList: arr, livePlaylists, liveIds ,plainChatList});
});

router.get("/login", (req,res) => {
    const kakaoAuth = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URL}`
    res.redirect(kakaoAuth);
})

router.get('/logout', (req,res)=> {
    res.clearCookie("login_access_token");
    res.redirect('/');
})

router.get('/kakao/callback', async (req,res)=> {
    const {code} = req.query;

    const tokenUrl = `https://kauth.kakao.com/oauth/token`

    const data = new URLSearchParams({
        grant_type : 'authorization_code',
        client_id : process.env.KAKAO_CLIENT_ID,
        redirect_uri : process.env.REDIRECT_URL,
        code,
        client_secret : process.env.KAKAO_CLIENT_SECRET_KEY
    })
    const response = await axios.post(tokenUrl, data, {
        headers : {
            'Content-Type' : 'application/x-www-form-urlencoded'
        }
    })
    

    const { access_token } = response.data;

    const {data : userData} = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers : {
            Authorization: `Bearer ${access_token}`
        }   
    })
    const {id, properties} = userData;

    const userdata = await userController.userInfo(id)
   
    if(userdata.state === 200) {
        const token  = { 
                    id : userdata.data.dataValues.uid,
                    properties : { 
                        nickname : userdata.data.dataValues.nickname,
                        profile_image : userdata.data.dataValues.profileImg
                    } }

        const jwtToken = jwt.sign(token, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        res.cookie("login_access_token", jwtToken, {httpOnly : true, maxAge : 60 * 60 * 60 * 1000});
        res.redirect('/');
    } else {
        userController.signup(id,properties.nickname,properties.profile_image)
    
        const token = jwt.sign({id,properties}, process.env.JWT_SECRET_KEY, { expiresIn : "1h"} );
        res.cookie("login_access_token", token, {httpOnly : true, maxAge : 60 * 60 * 60 * 1000});
        res.redirect('/');
    }
})

router.post("/updateLiveStatus", liveController.updateLiveStatus);

module.exports = router
