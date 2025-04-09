const {Like} = require('../models/config');

const likeController = {
    async likeClick(music_id,user_id){
        try {
          const userIdFind = await Like.findOne({where:{user_id}})
          if(userIdFind){
            await Like.destroy({where: {user_id}})
         return {state:200, message:"좋아요 삭제"}
          }else{
            await Like.create({music_id,user_id})
            return {state:200, message:"좋아요 완료"}
          }
        } catch (error) {
            return console.error(error)
        }
    }
}
module.exports = likeController