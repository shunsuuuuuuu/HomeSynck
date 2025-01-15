// DOMContentLoadedイベントで呼び出し
document.addEventListener('DOMContentLoaded', () => {
    displayAllProperties();
    const fetchDataBtn = document.getElementById('fetchDataBtn');
    const filterBtn = document.getElementById('filterBtn');
    const transferBtn = document.getElementById('calcDistanceBtn');
    const predictBtn = document.getElementById('predictRentBtn');
    const scoringBtn = document.getElementById('scoringBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    // ボタンクリックで物件データを更新する処理
    fetchDataBtn.addEventListener('click', async (event) => {
        event.preventDefault()

        // 物件データを削除
        await fetch('/api/properties/delete-all-properties', {
            method: 'DELETE',
        });
        displayAllProperties();

        // 物件データを取得
        const loadingMessage = document.getElementById('loadingMessage');
        loadingMessage.style.display = 'block';
        loadingMessage.textContent = '物件データを取得しています...';
        try {
            const url = document.getElementById('urlInput').value;
            console.log('URL:', url);
            const encodedUrl = encodeURIComponent(url);

            const fetchResponse = await fetch(`/api/properties/fetch-property-info/${encodedUrl}`);
            const fetchResult = await fetchResponse.json();

            if (!fetchResult.success) {
                console.error('エラー:', fetchResult.message);
                alert('エラー: ' + fetchResult.message); // 詳細なエラーを表示
            }

            displayAllProperties();
        }
        finally {
            // ローディングメッセージの非表示
            loadingMessage.style.display = 'none';
        }
    });

    // ボタンクリックで物件データをフィルタリングする処理
    filterBtn.addEventListener('click', () => {
        displayFilteredProperties();
    });

    // ボタンクリックで乗り換え情報を取得する処理
    transferBtn.addEventListener('click', async () => {
        const loadingMessage = document.getElementById('transferLoadingMessage');
        loadingMessage.style.display = 'block';
        loadingMessage.textContent = '乗り換え情報を更新しています...';

        const destStation = document.getElementById('destinationInput').value;

        if (!destStation) {
            alert('目的駅を入力してください');
            return;
        }

        const filteredProperties = await getFilteredProperties();
        await searchTransferInfo(filteredProperties, destStation);
        displayFilteredProperties();
        loadingMessage.style.display = 'none';
    });

    // ボタンクリックで家賃を予測する処理
    predictBtn.addEventListener('click', async () => {
        const loadingMessage = document.getElementById('predictLoadingMessage');
        loadingMessage.style.display = 'block';
        loadingMessage.textContent = '予測を実行しています...';

        const filteredProperties = await getFilteredProperties();
        await predictRentalFee(filteredProperties);
        displayFilteredProperties();
        loadingMessage.style.display = 'none';
    });

    // ボタンクリックでスコアリングを実行する処理
    scoringBtn.addEventListener('click', async () => {
        const loadingMessage = document.getElementById('scoringLoadingMessage');
        loadingMessage.style.display = 'block';
        loadingMessage.textContent = 'スコアリングを実行しています...';

        const weights = {
            rental_fee: document.getElementById('weight-fee').value,
            monthly_fee_gap: document.getElementById('weight-fee-gap').value,
            floor_area: document.getElementById('weight-area').value,
            build_age: document.getElementById('weight-age').value,
            distance_to_station: document.getElementById('weight-distance').value,
            transfer_time: document.getElementById('weight-commute').value
        };

        const filteredProperties = await getFilteredProperties();
        await scoring(filteredProperties, weights);
        displaySortedProperties();
        loadingMessage.style.display = 'none';
    });

    // ボタンクリックで物件データを削除する処理
    deleteBtn.addEventListener('click', async () => {
        const response = await fetch('/api/properties/delete-all-properties', {
            method: 'DELETE',
        });
        const result = await response.json();
        if (result.success) {
            displayAllProperties();
        } else {
            console.error('エラー:', result.message);
        }
    });
});

// 乗り換え情報を取得し、データベースを更新する関数
export async function searchTransferInfo(properties, destStation) {
    for (const property of properties) {
        const id = property.id;
        const address = property.address;
        try {
            const response = await fetch(`/api/properties/get-transfer-info/${id}/${address}/${destStation}`);
            if (response.ok) {
                const result = await response.json();
                console.log(`物件ID: ${id}, 目的駅: ${destStation} 乗り換え情報: ${result.data.ridetime}分, ${result.data.count}回`);
                displayFilteredProperties();
            } else {
                console.error(`物件ID: ${id}, エラー: ${result ? result.message : '不明なエラー'}`);
            }
        } catch (error) {
            console.error(`物件ID: ${id}, 処理中にエラーが発生しました:`, error);
        }
    }
}

// 家賃の予測を実行する関数
async function predictRentalFee(properties) {
    const response = await fetch('/api/properties/predict-rental-fee', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(properties)
    });
    if (response.ok) {
        // const result = await response.json();
        // console.log(`-> 予測: ${result.data.pred}, 差分: ${result.data.gap}`);
    }
    else {
        throw new Error(`家賃の予測に失敗しました: ${response.statusText}`);
    }
}

// スコア算出する関数
async function scoring(properties, weights) {
    const requestBody = {
        properties: properties,
        weights: weights
    };
    const response = await fetch(`/api/properties/scoring`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });
    if (response.ok) {
        // const result = await response.json();
        // console.log(`-> スコア: ${result.data.score}`);
    }
    else {
        throw new Error(`スコアの算出に失敗しました: ${response.statusText}`);
    }
}

// 物件データを表示する関数
async function displayAllProperties() {
    const response = await fetch('/api/properties/get-all-properties');
    const properties = await response.json()
    displayPropertyList(properties.data);
    const propertyCountElement = document.getElementById('propertyCount');
    const propatyCount = properties.data.length;
    propertyCountElement.textContent = "物件一覧 (" + propatyCount + "件)";
}

// フィルタリングされた物件データを表示する関数
export async function displayFilteredProperties() {
    const filteredProperties = await getFilteredProperties();
    displayPropertyList(filteredProperties);

    // 物件数を計上
    const propertyCountElement = document.getElementById('propertyCount');
    const propatyCount = filteredProperties.length;
    propertyCountElement.textContent = "物件一覧 (" + propatyCount + "件)";
}

// フィルタリングされた物件データをスコアでソートして表示する関数
export async function displaySortedProperties() {
    const filteredProperties = await getFilteredProperties();
    // scoreが高い順にソート
    const sortedProperties = filteredProperties.sort((a, b) => b.score - a.score);
    displayPropertyList(sortedProperties);

    // 物件数を計上
    const propertyCountElement = document.getElementById('propertyCount');
    const propatyCount = sortedProperties.length;
    propertyCountElement.textContent = "物件一覧 (" + propatyCount + "件)";
}

// 表示する物件データを抽出する関数
async function getFilteredProperties() {
    const response = await fetch('/api/properties/get-all-properties');
    const result = await response.json();
    const properties = await result.data;
    const maxRent = Number(document.getElementById('maxRent').value) || Infinity;
    const maxDistance = Number(document.getElementById('maxDistance').value) || Infinity;
    const minArea = Number(document.getElementById('minArea').value) || 0;
    const maxAge = Number(document.getElementById('maxAge').value) || Infinity;

    return properties.filter(property => {
        const meetsRentCriteria = property.rental_fee <= maxRent;
        const meetsDistanceCriteria = property.distance_to_station <= maxDistance;
        const meetsAreaCriteria = property.floor_area >= minArea;
        const meetsAgeCriteria = property.build_age <= maxAge;

        return meetsRentCriteria && meetsDistanceCriteria && meetsAreaCriteria && meetsAgeCriteria;
    });
};

function displayPropertyList(properties) {
    properties = properties.slice(0, 100);
    const propertiesList = document.getElementById('propertiesList');
    propertiesList.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'property-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
            <tr>
                <th>物件名</th>
                <th>家賃 (万円)</th>
                <th>住所</th>
                <th>アクセス</th>
                <th>築年数 (年)</th>
                <th>面積 (m²)</th>
                <th class="highlight1-header">通勤時間</th>
                <th class="highlight1-header">乗り換え回数</th>
                <th class="highlight2-header">予測家賃(万円)</th>
                <th class="highlight2-header">差分(万円)</th>
                <th class="highlight3-header">スコア</th>
            </tr>
        `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    properties.forEach(property => {
        const row = document.createElement('tr');
        row.innerHTML = `
                <td><a href="${property.url || '#'}" target="_blank">${property.name || '物件名なし'}</a></td>
                <td>${property.monthly_fee || '-'}</td>
                <td>${property.address || '-'}</td>
                <td>${property.access || '-'}</td>
                <td>${property.build_age === 0 ? 0 : property.build_age || '-'}</td>
                <td>${property.floor_area || '-'}</td>
                <td class="highlight1">${property.transfer_time || '-'}</td>
                <td class="highlight1">${property.transfer_count === 0 ? 0 : property.transfer_count || '-'}</td>
                <td class="highlight2">${property.monthly_fee_pred || '-'}</td>
                <td class="highlight2">${property.monthly_fee_gap === 0 ? 0 : property.monthly_fee_gap || '-'}</td>
                <td class="highlight3">${property.score === 0 ? 0 : property.score || '-'}</td>
            `;
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    propertiesList.appendChild(table);
}