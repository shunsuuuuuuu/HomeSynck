import os
import numpy as np
import pandas as pd
import json
import matplotlib.pyplot as plt

# 機械学習
import lightgbm as lgb  # LightGBM
from sklearn.svm import SVR
import pickle
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error
from math import sqrt
from sklearn.metrics import r2_score

# データ読み込み
with open('database.json', encoding='utf-8') as f:
    data_dict = json.load(f)
datasets = pd.DataFrame(data_dict['data'])

with open('pycode/tokyo23wards.json', encoding='utf-8') as f:
    tokyo23_wards = json.load(f)["tokyo23_wards"]

datasets["ward_id"] = [tokyo23_wards[ward] for ward in datasets["ward"]]


# 説明変数,目的変数
tag_col = ["monthly_fee"]
exp_cols = ["distance_to_station", "floor_area", "build_age", "floor_num", "ward_id"]

# トレーニングデータ,テストデータの分割
test_size = 0.2
test_index = list(datasets.sample(frac=test_size).index)
train_index = list(set(datasets.index) ^ set(test_index))
X_test = datasets.loc[test_index, :][exp_cols].values
X_train = datasets.loc[train_index, :][exp_cols].values
y_test = np.array((datasets.loc[test_index, :][tag_col].values)).reshape(
    len(test_index),
)
y_train = np.array((datasets.loc[train_index, :][tag_col].values)).reshape(
    len(train_index),
)

# 学習モデルの作成

# モデルの学習
# model = LinearRegression() #Linear
# model = SVR(kernel='linear', C=1, epsilon=0.1, gamma='auto') #SVR
model = RandomForestRegressor()
# model = lgb.LGBMRegressor() # LightGBM

print("Creating model...")
model.fit(X_train, y_train)
with open("model.pickle", mode="wb") as f:
    pickle.dump(model, f)

# テストデータの予測
y_pred = model.predict(X_test)

# 真値と予測値の表示
df_pred = pd.DataFrame({"monthly_fee": y_test, "monthly_fee_pred": y_pred})

# 散布図を描画(真値 vs 予測値)
plt.plot(
    y_test, y_test, color="red", label="x=y"
)  # 直線y = x (真値と予測値が同じ場合は直線状に点がプロットされる)
plt.scatter(y_pred, y_test)
plt.xlabel("y_test")
plt.ylabel("y_pred")
plt.title("y vs y_pred")
plt.savefig("result/fee_prediction.png")

rmse = sqrt(mean_squared_error(y_test, y_pred))
print("RMSE", rmse)
result = model.score(X_test, y_test)
print("R2", result)