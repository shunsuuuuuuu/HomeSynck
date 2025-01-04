// 乗り換え情報を取得し、データベースを更新する関数
export async function searchTransferInfo(properties, destStation) {
    for (const property of properties) {
        const id = property.id;
        const address = property.address;
        try {
            const result = await fetchTransferInfo(id, address, destStation);
            if (result && result.success) {
                console.log(`物件ID: ${id}, 目的駅: ${destStation} 乗り換え情報: ${result.data.ridetime}分, ${result.data.count}回`);
            } else {
                console.error(`物件ID: ${id}, エラー: ${result ? result.message : '不明なエラー'}`);
            }
        } catch (error) {
            console.error(`物件ID: ${id}, 処理中にエラーが発生しました:`, error);
        }
    }
}

async function fetchTransferInfo(id, address, destStation) {
    const response = await fetch(`/api/properties/get-transfer-info/${id}/${address}/${destStation}`);
    if (!response.ok) {
        throw new Error(`乗り換え情報の取得に失敗しました: ${response.statusText}`);
    }
    const result = await response.json();
    return result;
}