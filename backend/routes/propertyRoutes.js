const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// 物件データの取得
router.get('/get-all-properties', propertyController.getAllProperties);

// 物件データの削除
router.delete('/delete-all-properties', propertyController.deleteAllProperties);

// 物件データを取得して保存するルート
router.get('/fetch-property-info/:url', propertyController.fetchPropertyInfo);

// 乗り換え情報を取得
router.get('/get-transfer-info/:id/:address/:destStation', propertyController.getTransferInfo);

module.exports = router;
