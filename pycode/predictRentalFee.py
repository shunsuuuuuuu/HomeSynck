# ライブラリ
import os
import sys
import json
import numpy as np
import pandas as pd
import pickle

# モデルの読み込み
model_path = "pycode/models/model.pickle"
if os.path.exists(model_path):
    with open(model_path, mode="rb") as f:
        model = pickle.load(f)
else :
    print("Model not found")
    exit()

# 区のIDを取得
with open('pycode/tokyo23wards.json', encoding='utf-8') as f:
    tokyo23_wards = json.load(f)["tokyo23_wards"]
        
def predict(properties):

    datasets = pd.DataFrame(properties)

    with open('pycode/tokyo23wards.json', encoding='utf-8') as f:
        tokyo23_wards = json.load(f)["tokyo23_wards"]
    datasets["ward_id"] = [tokyo23_wards[ward] for ward in datasets["ward"]]

    # 説明変数
    exp_cols = ["distance_to_station", "floor_area", "build_age", "floor_num", "ward_id"]
    X = datasets[exp_cols].values

    # 推論実行
    y_pred = model.predict(X)
    
    return y_pred

def main():
    # 標準入力からデータを受け取る
    input_data = sys.stdin.read()
    properties = json.loads(input_data)

    # デバッグ用: JSONファイルからデータを読み込む
    # with open('database.json', encoding='utf-8') as f:
    #     data_dict = json.load(f)
    # properties = pd.DataFrame(data_dict['data'])

    monthly_fee = []
    for item in properties:
        monthly_fee.append(float(item["monthly_fee"]))

    # 推論実行
    preds = predict(properties)

    # 結果を整形
    gaps = np.array(monthly_fee) - np.array(preds)

    # predとgapをjsonに変換 
    preds = [round(pred, 2) for pred in preds]
    gaps = [round(gap, 2) for gap in gaps]
    results = {
        "pred": preds,
        "gap": gaps
    }

    # 結果をJSON形式で出力
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()