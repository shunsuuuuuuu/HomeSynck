const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// 物件データの取得
router.get('/', propertyController.getAllProperties);

// CSVデータのアップロード (必要に応じて)
router.post('/upload', propertyController.uploadCSV);

// 物件データを取得して保存するルート
router.get('/fetch-and-save', propertyController.fetchAndSavePropertyData);

module.exports = router;
