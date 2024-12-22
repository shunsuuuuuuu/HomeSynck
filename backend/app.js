const express = require('express');
const app = express();

// ポート番号
const PORT = 3000;

// ルート（"/"）へのリクエストを処理
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// サーバーを起動
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
