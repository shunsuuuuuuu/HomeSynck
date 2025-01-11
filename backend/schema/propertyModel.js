const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    id: { type: String, required: true }, // 物件ID
    name: { type: String, required: true }, // 名称
    category: { type: String, required: true }, // カテゴリ
    address: { type: String, required: true }, // アドレス
    ward: { type: String, required: true }, // アドレス
    access: { type: String, required: true }, // アクセス
    structure: { type: String, required: true }, // 構造
    layout: { type: String, required: true }, // 間取り
    url: { type: String, required: true }, // 物件URL
    distance_to_station: { type: Number, required: true }, // 駅までの距離 (分)
    build_age: { type: Number, required: true }, // 築年数
    floor_num: { type: Number, required: true }, // 階数
    rental_fee: { type: Number, required: true }, // 家賃
    service_fee: { type: Number, required: true }, // 管理費 (サービス費)
    monthly_fee: { type: Number, required: true }, // 月額費用
    deposit_fee: { type: Number, required: true }, // 敷金
    reward_fee: { type: Number, required: true }, // 礼金
    floor_area: { type: Number, required: true }, // 面積
    // 乗り換え情報
    transfer_time: { type: Number, required: false }, // 所要時間 (分)
    transfer_fare: { type: Number, required: false }, // 運賃
    transfer_count: { type: Number, required: false } // 乗り換え回数
});

module.exports = mongoose.model('Property', propertySchema);
