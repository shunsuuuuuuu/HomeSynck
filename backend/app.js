const express = require('express');
const app = express();

app.use(express.static('public'));
const propertyRoutes = require('./routes/propertyRoutes');  // ルートのインポート
app.use('/api/properties', propertyRoutes);  // APIルートの設定

// モデルとコントローラーをインポート
const propertyController = require('./controllers/propertyController');


// ポート番号
const PORT = 3000;

// ルート（"/"）へのリクエストを処理
app.get('/index.html', (req, res) => {
  res.send('Hello, Express!');
});

// サーバーを起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
