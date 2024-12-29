document.getElementById('fetchDataBtn').addEventListener('click', async () => {
    const response = await fetch('/api/properties/fetch-and-save');
    const result = await response.json();

    if (result.success) {
        alert('物件データが保存されました！');
    } else {
        console.error('エラー:', result.message);
        alert('エラー: ' + result.message); // 詳細なエラーを表示
    }
});

// DOMContentLoadedイベントで呼び出し
document.addEventListener('DOMContentLoaded', () => {
    displayProperties();
});

document.getElementById('showPropertiesBtn').addEventListener('click', () => {
    displayProperties();
});

// 物件データを表示する関数
async function displayProperties() {
    const response = await fetch('/api/properties/get-all-properties');
    const result = await response.json();

    if (result.success) {
        const properties = result.data;
        console.log('物件データ:', properties);
        const propertiesList = document.getElementById('propertiesList');
        propertiesList.innerHTML = '';

        properties.forEach(property => {
            const propertyElement = document.createElement('div');

            propertyElement.className = 'property-item';
            propertyElement.innerHTML = `
                <h3>${property.name || '物件名なし'}</h3>
                <p>家賃: ${property.rental_fee || '-'}万円</p>
                <p>アクセス: ${property.access || '-'}</p>
                <p>築年数: ${property.build_age || '-'}年</p>
                <p>面積: ${property.floor_area || '-'}m²</p>
            `;
            propertiesList.appendChild(propertyElement);
        });
    }
}