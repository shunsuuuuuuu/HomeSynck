# ライブラリ
import os
import sys
import json
import numpy as np
import pickle

def predict(floor_area, floor_num, build_age, distance, ward):
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
    ward_id = tokyo23_wards[ward]

    # 入力データ
    X = np.array([distance, floor_area, build_age, floor_num, ward_id]).reshape(1, -1)

    # 推論
    y_pred = model.predict(X)
    
    return y_pred

def main():
    if len(sys.argv) < 7:
        print("必要な引数を入力されていません")
        sys.exit(1)

    # 引数を取得
    floor_area = float(sys.argv[1])
    floor_num = float(sys.argv[2])
    build_age = float(sys.argv[3])
    distance = float(sys.argv[4])
    ward = sys.argv[5]
    monthly_fee = float(sys.argv[6])

    # 推論実行
    pred = predict(floor_area, floor_num, build_age, distance, ward)

    # 結果を整形
    pred = pred[0]
    gap = monthly_fee - pred
    pred = np.round(pred, 2)
    gap = np.round(gap, 2)

    # 結果をJSON形式で出力
    result = {
        "pred": pred,
        "gap": gap
    }

    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()