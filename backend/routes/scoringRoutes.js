const express = require('express');
const router = express.Router();
const scoringController = require('../controllers/scoringController');

// スコアリング結果を取得
router.post('/score', scoringController.calculateScores);

// 可視化用データを取得
router.get('/visualize', scoringController.getVisualizationData);

module.exports = router;
