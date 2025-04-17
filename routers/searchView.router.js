const router = require('express').Router();
const {musicController ,postController} = require('../controllers')


router.get('/', async (req, res) => {
    const { user } = req;
    const { musicList } = await musicController.musicSelectAll();
  
    const searchQuery = req.query.index || '';
    const page = parseInt(req.query.page) || 1; // 현재 페이지
    const limit = 7; // 한 페이지당 개수
    const offset = (page - 1) * limit;
  
    // 전체 결과 개수 가져오기
    const totalCount = await postController.countAll(searchQuery);
  
    // 해당 페이지 결과만 가져오기
    const results = await postController.selectAll(searchQuery, limit, offset);
  
    const totalPages = Math.ceil(totalCount / limit);
  
    console.log("검색 결과:", results);
  
    res.render('searchResult', { 
      results, 
      user, 
      musicList, 
      currentPage: page,
      totalPages,
      searchQuery
    });
  });

module.exports = router;