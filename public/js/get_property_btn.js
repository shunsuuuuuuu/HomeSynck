document.getElementById('fetchDataBtn').addEventListener('click', async () => {
    const response = await fetch('/api/properties/fetch-and-save');
    const result = await response.json();
    console.log(result);

    if (result.success) {
        alert('物件データが保存されました！');
    } else {
        console.error('エラー:', result.message);
        alert('エラー: ' + result.message); // 詳細なエラーを表示
    }
});
