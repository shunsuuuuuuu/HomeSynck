const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    name: { type: String, required: true }, // 名称
    category: { type: String, required: true }, // カテゴリ
    address: { type: String, required: true }, // アドレス
    access: { type: String, required: true }, // アクセス
    build_year: { type: String, required: true }, // 築年数
    structure: { type: String, required: true }, // 構造
    floors: { type: String, required: true }, // 階数
    rent: { type: Number, required: true }, // 家賃
    management_fee: { type: Number, required: true }, // 管理費
    deposit: { type: Number, required: true }, // 敷金
    reward: { type: Number, required: true }, // 礼金
    layout: { type: String, required: true }, // 間取り
    area: { type: Number, required: true }, // 面積
    url: { type: String, required: true }, // 物件URL
    distance_to_station: { type: Number, required: true }, // 駅までの距離 (分)
    build_age: { type: Number, required: true }, // 築年数
    floor_num: { type: Number, required: true }, // 階数
    rental_fee: { type: Number, required: true }, // 家賃
    service_fee: { type: Number, required: true }, // 管理費 (サービス費)
    monthly_fee: { type: Number, required: true }, // 月額費用
    deposit_fee: { type: Number, required: true }, // 敷金
    reward_fee: { type: Number, required: true }, // 礼金
    floor_area: { type: Number, required: true } // 面積
});

module.exports = mongoose.model('Property', propertySchema);
