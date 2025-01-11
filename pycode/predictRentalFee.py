# ライブラリ
import os
import json
import pandas as pd
import numpy as np
import argparse
import pickle

parser = argparse.ArgumentParser(description="Command line argument parser")
parser.add_argument("--dest_station", "-st", help="Destination station used when commuting")
parser.add_argument("--monthly_fee", "-p", help="Acceptable rent fee")
parser.add_argument("--build_age", "-a", help="Acceptable building age")
parser.add_argument("--floor_area", "-s", help="Minimum floor area")
parser.add_argument("--walk_time", "-t", help="Acceptable walk time from nearest station")
args = parser.parse_args()

# JSONファイルからデータを読み込む
with open('database.json', encoding='utf-8') as f:
    data_dict = json.load(f)
datasets = pd.DataFrame(data_dict['data'])

with open('pycode/tokyo23wards.json', encoding='utf-8') as f:
    tokyo23_wards = json.load(f)["tokyo23_wards"]

datasets["ward_id"] = [tokyo23_wards[ward] for ward in datasets["ward"]]

# 説明変数,目的変数
tag_col = ["monthly_fee"]
exp_cols = ["distance_to_station", "floor_area", "build_age", "floor_num", "ward_id"]

X = datasets[exp_cols].values
y_true = datasets[tag_col].values.flatten()

# モデルの学習
model_path = "pycode/models/model.pickle"
if os.path.exists(model_path):
    with open(model_path, mode="rb") as f:
        model = pickle.load(f)
else :
    print("Model not found")
    exit()

# テストデータの予測
y_pred = model.predict(X)
y_market_gap = y_true - y_pred

# 予測値との差分を評価
datasets["monthly_fee_pred"] = np.round(y_pred, 2)
datasets["market_gap"] = np.round(y_market_gap, 2)
