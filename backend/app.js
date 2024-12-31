// モジュールのインポート
const express = require('express');
const app = express();
app.use('/css', express.static('public/css'));
app.use('/js', express.static('public/js'));
app.use('/', express.static('public/html'));

// ルートの設定
const propertyRoutes = require('./routes/propertyRoutes');  // ルートのインポート
app.use('/api/properties', propertyRoutes);  // APIルートの設定

// ポート番号
const PORT = 3000;

// ルート（"/"）へのリクエストを処理
app.get('/index.html', (req, res) => { });

// サーバーを起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
