const { Op } = require('sequelize');
const { Music } = require('../models/config');

const postController = {
    async selectAll(searchQuery, limit, offset) {
        try {
            const results = await Music.findAll({
                where: {
                    [Op.or]: [
                        { artist: { [Op.like]: `%${searchQuery}%` } },
                        { songName: { [Op.like]: `%${searchQuery}%` } }
                    ]
                },
                limit,
                offset
            });
            return results;
        } catch (error) {
            console.error("검색 오류:", error);
            return [];
        }
    },
    // 총 페이지 갯수를 셀려고 
    async countAll(searchQuery) {
        try {
            const count = await Music.count({
                where: {
                    [Op.or]: [
                        { artist: { [Op.like]: `%${searchQuery}%` } },
                        { songName: { [Op.like]: `%${searchQuery}%` } }
                    ]
                }
            });
            return count;
        } catch (error) {
            console.error("카운트 오류:", error);
            return 0;
        }
    }
};

module.exports = postController;




