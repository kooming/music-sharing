const {User} =require('../models/config')

const userController = {
    async signup(uid,nickname,profileImg) {
        try {
           const duplicationUser = await User.findOne({where : {uid}})
           if(duplicationUser){
            return {state : 400, message : "중복 회원가입"}
           }else{
               await User.create({uid,nickname,profileImg})
               return {state : 200, message : "회원가입 성공"}
            }
        } catch (error) {
            console.error(error);
          return {state : 500, message : "회원가입 실패"}
        }
    },

    // 유저 정보 수정
    async editProf(uid, nickname, profileImg) {
        try {
            if(profileImg === undefined) {
                await User.update({nickname}, {where : {uid}})
            } else {
                await User.update({nickname, profileImg}, {where : {uid}})
            }
            const updatedUser = await User.findOne({where : {uid}})

            return {state : 200, message : "유저 정보 수정 성공", updatedUser: updatedUser.dataValues}
        } catch (error) {
            console.error(error);
            return {state : 500, message : "유저 정보 수정 실패"}
        }
    },

    // 유저 정보 조회
    async userInfo(uid) {
        try {
            const user = await User.findOne({where : {uid}})
            if(!user) return {state : 400, message : "유저 정보 없음"}
            return {state : 200, message : "유저 정보 조회 성공", data : user}
        } catch (error) {
            console.error(error);
            return {state : 500, message : "유저 정보 조회 실패"}
        }
    }
}
module.exports = userController