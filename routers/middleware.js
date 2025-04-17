const jwt = require('jsonwebtoken');

const loginCheck = async (req,res,next) => {
    try {
        const {login_access_token} = req.cookies
        console.log('login_access_tokennnnnnnnnnnnn:', login_access_token)
        if(login_access_token){
            const userData = jwt.verify(login_access_token, process.env.JWT_SECRET_KEY)
            if(userData){
                req.user = userData;
            }
        }
        next();
    } catch (error) {
        console.error('Error in loginCheck middlesssssssssware:', error);
        next();
    }
}
module.exports = loginCheck