import json
import random

def generate_test_property_data():
    property_data = {
        "名称": "テスト物件",
        "カテゴリ": "賃貸アパート",
        "アドレス": "東京都渋谷区",
        "アクセス": "渋谷駅 徒歩10分",
        "築年数": random.randint(5, 20),
        "構造": "鉄筋コンクリート",
        "階数": random.randint(3, 10),
        "家賃": random.randint(5, 15) * 10000,  # 家賃は5万円〜15万円の間でランダム
        "管理費": random.randint(1000, 5000),
        "敷金": random.randint(1, 3) * 100000,  # 敷金は1〜3ヶ月分の家賃
        "礼金": random.randint(1, 2) * 100000,  # 礼金も1〜2ヶ月分の家賃
        "間取り": "1LDK",
        "面積": round(random.uniform(20, 50), 2),  # 面積は20㎡〜50㎡の間でランダム
        "URL": "http://example.com/property",
        "distance_to_station": random.randint(5, 20),  # 駅からの距離
        "build_age": random.randint(5, 20),  # 築年数
        "floor_num": random.randint(1, 10),  # 階数
        "rental_fee": random.randint(5, 15) * 10000,
        "service_fee": random.randint(1000, 5000),
        "monthly_fee": random.randint(5, 10) * 10000,
        "deposit": random.randint(1, 3) * 100000,
        "Reward": random.uniform(0.1, 0.5),
        "floor_area": round(random.uniform(20, 50), 2)
    }
    return property_data

# 10件のテスト物件データを生成
test_properties = [generate_test_property_data() for _ in range(10)]

# JSON形式で出力
print(json.dumps(test_properties, indent=2))
