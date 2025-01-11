import { searchTransferInfo } from './search_transfer_info.js';

// DOMContentLoadedイベントで呼び出し
document.addEventListener('DOMContentLoaded', () => {
    displayAllProperties();
    const fetchDataBtn = document.getElementById('fetchDataBtn');
    const filterBtn = document.getElementById('filterBtn');
    const transferBtn = document.getElementById('calcDistanceBtn');

    // ボタンクリック時で物件データを更新する処理
    fetchDataBtn.addEventListener('click', async (event) => {
        event.preventDefault()
        const url = document.getElementById('urlInput').value;
        console.log('URL:', url);
        const encodedUrl = encodeURIComponent(url);
        const response = await fetch(`/api/properties/fetch-property-info/${encodedUrl}`);
        const result = await response.json();

        if (!result.success) {
            console.error('エラー:', result.message);
            alert('エラー: ' + result.message); // 詳細なエラーを表示
        }
        
            displayAllProperties();
    });

    // ボタンクリック時で物件データをフィルタリングする処理
    filterBtn.addEventListener('click', () => {
        displayFilteredProperties();
    });

    // ボタンクリック時で乗り換え情報を取得する処理
    transferBtn.addEventListener('click', async () => {
        const destStation = document.getElementById('destinationInput').value;

        if (!destStation) {
            alert('目的駅を入力してください');
            return;
        }
        
        const filteredProperties = await getFilteredProperties();
        searchTransferInfo(filteredProperties, destStation);
        displayFilteredProperties();
    });

    // 物件データを表示する関数
    async function displayAllProperties() {
        const response = await fetch('/api/properties/get-all-properties');
        const properties = await response.json()
        displayPropertyList(properties.data);
    }

    // フィルタリングされた物件データを表示する関数
    async function displayFilteredProperties() {
        const filteredProperties = await getFilteredProperties();
        displayPropertyList(filteredProperties);
    }

    // 表示する物件データを抽出する関数
    async function getFilteredProperties() {
        const response = await fetch('/api/properties/get-all-properties');
        const result = await response.json();
        const properties = await result.data;
        const minRent = Number(document.getElementById('minRent').value) || 0;
        const maxRent = Number(document.getElementById('maxRent').value) || Infinity;
        const maxDistance = Number(document.getElementById('maxDistance').value) || Infinity;
        const minArea = Number(document.getElementById('minArea').value) || 0;
        const maxArea = Number(document.getElementById('maxArea').value) || Infinity;
        const maxAge = Number(document.getElementById('maxAge').value) || Infinity;

        return properties.filter(property => {
            const meetsRentCriteria = property.rental_fee >= minRent && property.rental_fee <= maxRent;
            const meetsDistanceCriteria = property.distance_to_station <= maxDistance;
            const meetsAreaCriteria = property.floor_area >= minArea && property.floor_area <= maxArea;
            const meetsAgeCriteria = property.build_age <= maxAge;

            return meetsRentCriteria && meetsDistanceCriteria && meetsAreaCriteria && meetsAgeCriteria;
        });
    };

    function displayPropertyList(properties) {
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
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        properties.forEach(property => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${property.name || '物件名なし'}</td>
                <td>${property.rental_fee || '-'}</td>
                <td>${property.address || '-'}</td>
                <td>${property.access || '-'}</td>
                <td>${property.build_age || '-'}</td>
                <td>${property.floor_area || '-'}</td>
                <td class="highlight1">${property.transfer_time || '-'}</td>
                <td class="highlight1">${property.transfer_count === 0 ? 0 : property.transfer_count || '-'}</td>
            `;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        propertiesList.appendChild(table);
    }
});