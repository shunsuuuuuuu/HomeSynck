import sys
import json
import re
from retry import retry
import requests
from bs4 import BeautifulSoup
import pandas as pd 
import argparse

@retry(tries=3, delay=10, backoff=2)
def get_html(url):
    r = requests.get(url)
    soup = BeautifulSoup(r.content, "html.parser")
    return soup

def main():
    if len(sys.argv) < 2:
        print("Usage: fetchPropatyInfo.py <property_address>")
        sys.exit(1)

    # 引数を取得
    base_url = sys.argv[1]
    soup = get_html(base_url) # Used to get the number of pages
    max_page = int(soup.select_one('ol.pagination-parts').text.strip().split()[-1])

    max_page = 1

    # TODO: 関数化
    all_data = []
    for page in range(1, max_page+1):
        # url per page 
        url = base_url + '&page={page}'.format(page=page)
        
        # get html
        soup = get_html(url)
        
        # extract all items
        items = soup.findAll("div", {"class": "cassetteitem"})
        # process each item
        for item in items:
            # process each station 
            base_data = {}

            # collect base information
            img_tag = item.find("img", {"class": "js-noContextMenu"})
            rel_value = img_tag['rel']
            id_value = rel_value.split('/')[-2]  # URLからID部分を抽出
            base_data["id"] = id_value
            base_data["name"] = item.find("div", {"class": "cassetteitem_content-title"}).getText().strip()
            base_data["category"] = item.find("div", {"class": "cassetteitem_content-label"}).getText().strip()
            base_data["address"] = item.find("li", {"class": "cassetteitem_detail-col1"}).getText().strip()
            base_data["築年数"] = item.find("li", {"class": "cassetteitem_detail-col3"}).findAll("div")[0].getText().strip()
            base_data["structure"] = item.find("li", {"class": "cassetteitem_detail-col3"}).findAll("div")[1].getText().strip()
            walk_time = 1000
            stations = item.findAll("div", {"class": "cassetteitem_detail-text"})
            for station in stations:
                access_info = station.getText().strip()
                isWalkable = '歩' in access_info
                useBus = 'バス' in access_info
                if isWalkable and not useBus:
                    walk_time_temp = int(access_info.split('歩')[1].split('分')[0])
                    if walk_time_temp < walk_time:
                        walk_time = walk_time_temp
                        base_data["access"] = access_info
                        base_data["distance_to_station"] = walk_time

            # get each room's propaty 
            tbodys = item.find("table", {"class": "cassetteitem_other"}).findAll("tbody")
            
            for tbody in tbodys:
                data = base_data.copy()

                data["階数"] = tbody.findAll("td")[2].getText().strip()

                data["家賃"] = tbody.findAll("td")[3].findAll("li")[0].getText().strip()
                data["管理費"] = tbody.findAll("td")[3].findAll("li")[1].getText().strip()

                data["敷金"] = tbody.findAll("td")[4].findAll("li")[0].getText().strip()
                data["礼金"] = tbody.findAll("td")[4].findAll("li")[1].getText().strip()

                data["layout"] = tbody.findAll("td")[5].findAll("li")[0].getText().strip()
                data["面積"] = tbody.findAll("td")[5].findAll("li")[1].getText().strip()
                
                data["url"] = "https://suumo.jp" + tbody.findAll("td")[8].find("a").get("href")
                
                all_data.append(data)    

    df = pd.DataFrame(all_data)

    df_numeric = df.copy()

    # 築年数を数値に変換
    df_numeric['築年数'] = [i.replace('新築','築0年') for i in df_numeric['築年数']]
    df_numeric['build_age'] = [int(re.sub(r"\D", "", i)) for i in df_numeric['築年数']]

    # 建物の階数を数値に変換
    ## ハイフンのみが表記されている行を削除
    df_numeric = df_numeric[~df_numeric['階数'].str.contains('-$')]
    floor_num = df_numeric['階数'].str.extract(r'(\d+)[^\d]*$').astype(float)
    df_numeric['floor_num'] = floor_num

    # 家賃を数値に変換
    df_numeric['rental_fee'] = [float(i.split('万円')[0]) for i in df_numeric['家賃']]

    # 管理費を数値に変換
    df_numeric['管理費'] = [i.replace('-','0') for i in df_numeric['管理費']]
    df_numeric['service_fee'] = [int(i.split('円')[0])/10000 for i in df_numeric['管理費']]

    # 家賃+管理費を計算
    df_numeric['monthly_fee'] = df_numeric['rental_fee'] + df_numeric['service_fee']

    # 敷金と礼金を数値に変換
    df_numeric['敷金'] = [i.replace('-','0') for i in df_numeric['敷金']]
    df_numeric['deposit_fee'] = [float(i.split('万円')[0]) for i in df_numeric['敷金']]
    df_numeric['礼金'] = [i.replace('-','0') for i in df_numeric['礼金']]
    df_numeric['reward_fee'] = [float(i.split('万円')[0]) for i in df_numeric['礼金']]

    # 部屋面積を数値に変換
    df_numeric['floor_area'] = [float(i.split('m2')[0]) for i in df_numeric['面積']]

    # 家賃と面積が同じ物件は一つだけ残して削除する
    df_numeric = df_numeric.drop_duplicates(subset=['rental_fee', 'floor_area'])

    # 住所から区を抽出
    df_numeric['section'] = [(i.split('区')[0]).replace('東京都', '') for i in df_numeric['address']]

    # DataFrameを辞書に変換
    data_dict = df_numeric.to_dict(orient='records')

    # 辞書をJSONにシリアライズ
    print(json.dumps(data_dict, ensure_ascii=False))

if __name__ == "__main__":
    main()