// 乗り換え情報を取得し、データベースを更新する関数
export async function searchTransferInfo() {
    try {
        const destStation = document.getElementById('destinationInput').value;

        if (!destStation) {
            alert('目的駅を入力してください');
            return;
        }

        const properties = await fetchProperties();
        await processTransferInfo(properties, destStation);
    } catch (error) {
        console.error('全体の処理中にエラーが発生しました:', error);
    }
}

async function fetchProperties() {
    try {
        const response = await fetch('/api/properties/get-all-properties');
        if (!response.ok) {
            throw new Error(`物件情報の取得に失敗しました: ${response.statusText}`);
        }
        const result = await response.json();
        return result.data || [];
    } catch (error) {
        console.error('物件情報取得中にエラーが発生しました:', error);
        return [];
    }
}

async function fetchTransferInfo(id, address, destStation) {
    try {
        const response = await fetch(`/api/properties/get-transfer-info/${id}/${address}/${destStation}`);
        if (!response.ok) {
            throw new Error(`乗り換え情報の取得に失敗しました: ${response.statusText}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`乗り換え情報取得中にエラーが発生しました (住所: ${address}):`, error);
        return null;
    }
}

async function processTransferInfo(properties, destStation) {
    for (const property of properties) {
        const id = property.id;
        const address = property.address;
        try {
            console.log(`物件ID: ${id}, 住所: ${address}, 目的駅: ${destStation}`);
            const result = await fetchTransferInfo(id, address, destStation);
            if (result && result.success) {
                console.log(`物件ID: ${id}, 乗り換え情報: ${result.data.ridetime}分, ${result.data.count}回`);
            } else {
                console.error(`物件ID: ${id}, エラー: ${result ? result.message : '不明なエラー'}`);
            }
        } catch (error) {
            console.error(`物件ID: ${id}, 処理中にエラーが発生しました:`, error);
        }
    }
}
