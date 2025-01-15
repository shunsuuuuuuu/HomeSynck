# %% ライブラリ ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
import sys
import json
import pandas as pd
import numpy as np

# %% スコアリング 
import statistics as stat

def calc_score(data, weights):

    target_cols = list(weights.keys())
    target_weights = list(weights.values())
    inverter = [1, -1, -1, 1, 1, 1]  # 1:低いほうが良い変数, -1:高いほうが良い変数

    # 対象の項目ごとにスコアを算出
    target_cols_score = []
    for tag_col, inv, w in zip(target_cols, inverter, target_weights):
        ave_ = stat.mean(data[tag_col])
        std_ = stat.stdev(data[tag_col])
        # 全体平均に対してどれだけ高いか低いか（差分）を評価する
        # 差分は標準偏差で割って正規化することで、Total Scoreを算出できるようにする
        data[tag_col + "_score"] = [
            round((inv * float(w) * (ave_ - val) / (std_ + 0.001)), 3) for val in data[tag_col]
        ]
        target_cols_score.append(tag_col + "_score")

    data["Total_score"] = data[target_cols_score].sum(axis=1).round(3)
    data.sort_values("Total_score", ascending=False)
    result = data[
        ["id"]
        + target_cols_score
        + ["Total_score"]
    ]

    return result


def main():
    # 標準入力からデータを受け取る
    input_data = sys.stdin.read()
    data = json.loads(input_data)
    properties = data['properties']
    weights = data['weights']
    properties = pd.DataFrame(properties)

    # # デバッグ用: JSONファイルからデータを読み込む
    # with open('database.json', encoding='utf-8') as f:
    #     data_dict = json.load(f)
    # properties = pd.DataFrame(data_dict['data'])

    scored_data = calc_score(properties, weights)

    # スコアリング結果を標準出力に出力
    print(scored_data.to_json(orient="records", indent=2))

if __name__ == "__main__":
    main()