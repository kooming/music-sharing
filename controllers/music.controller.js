const {Music,Like,sequelize} = require('../models/config');

const musicController = {
    async musicSelectAll() {
        try {
          const musics =  await Music.findAll()
          const musicList = musics.map(music => music.dataValues); 
            return {state:200, message :"전체 조회 성공",musicList}
        } catch (error) {
            return {state:400, message :"전체 조회 실패"}
            
        }
    },
    async musicSelectOne(id) {
        try {
            const music = await Music.findOne({where : {id}})
            return {state:200, message : "낱개 조회성공", musicFind: music}
        } catch (error) {
            return {state:400, message : "낱개 조회실패"}
        }
    }, async getPopularMusics() {
        try {

          const popularLikes = await Like.findAll({
            attributes: ['music_id', [sequelize.fn('COUNT', sequelize.col('music_id')), 'likeCount']],
            group: ['music_id'],
            order: [[sequelize.literal('likeCount'), 'DESC']],
            limit: 10
          });
    
          const popularMusicIds = popularLikes.map(like => like.music_id);
    
          const musics = await Music.findAll({
            where: {
              id: popularMusicIds
            }
          });
    
          return musics; // 
        } catch (error) {
          console.error('인기차트 조회 실패:', error);
        }
      }
}
module.exports= musicController