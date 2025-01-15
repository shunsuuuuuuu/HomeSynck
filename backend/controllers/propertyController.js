const Property = require('../schema/propertyModel');

// MongoDB接続
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://localhost:27017/property';
mongoose.connect(MONGO_URI).then(() => {
    console.log('Successfully connected to MongoDB.');
}).catch(err => {
    console.error('MongoDB接続エラー:', err);
});

// DBから全ての物件データの取得
exports.getAllProperties = async (req, res) => {
    try {
        const properties = await Property.find();
        res.status(200).json({ success: true, data: properties });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DBから物件データを削除
exports.deleteAllProperties = async (req, res) => {
    try {
        console.log('Deleting all properties from MongoDB...');
        await Property.deleteMany();
        res.status(200).json({ success: true, message: 'Successfully all properties are deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 物件データを取得してDBに保存
const { spawn } = require('child_process');
exports.fetchPropertyInfo = async (req, res) => {
    const url = req.params.url;
    console.log(`Updating property info from URL: ${url}`);

    try {
        console.log(`Executing Python script`);

        // Pythonスクリプトの実行
        const pythonProcess = spawn('python3', ['pycode/fetchPropertyInfo.py', url]);

        let outputData = '';
        let errorData = '';

        // 標準出力を収集
        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        // 標準エラー出力を収集
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        // スクリプト終了時の処理
        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}`);
                return res.status(500).json({ success: false, message: 'Pythonスクリプトが異常終了しました' });
            }

            if (errorData) {
                console.error(`Python script stderr: ${errorData}`);
                return res.status(500).json({ success: false, message: 'Pythonスクリプトのエラー' });
            }

            try {
                // Pythonスクリプトからの標準出力をJSONとしてパース
                const properties = JSON.parse(outputData);

                // 物件データをMongoDBに挿入
                const docs = await Property.insertMany(properties);
                const insertedProperties = await Property.find();
                console.log('Num of properties inserted:', insertedProperties.length);
                res.status(200).json({ success: true, message: '物件データが保存されました！', data: docs });

            } catch (parseError) {
                console.error(`Error parsing JSON: ${parseError.message}`);
                res.status(500).json({ success: false, message: 'Pythonスクリプト出力のパースに失敗しました' });
            }
        });

    } catch (error) {
        console.error(`Unexpected error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 乗り換え情報を取得
prev_address = '';
prev_result = '';
exports.getTransferInfo = async (req, res) => {
    try {
        const id = decodeURIComponent(req.params.id);
        const address = decodeURIComponent(req.params.address);
        const destStation = decodeURIComponent(req.params.destStation);
        if (address === prev_address) {
            // 乗り換え情報をMongoDBに追加
            const property = await Property.findOne({ id: id });
            if (property) {
                property.transfer_time = prev_result.ridetime;
                property.transfer_fare = prev_result.fare;
                property.transfer_count = prev_result.count;
                await property.save();
            }
            return res.json({ success: true, data: prev_result });
        }

        console.log(`Search for transfer info from ${address} to ${destStation}`);
        const pythonProcess = spawn('python3', ['./pycode/yahoo_transfer.py', address, destStation]);

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        let errorOutput = '';
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code === 0) {
                try {
                    // 乗り換え情報をMongoDBに追加
                    const result = JSON.parse(output);
                    const property = await Property.findOne({ id: id });
                    if (property) {
                        property.transfer_time = result.ridetime;
                        property.transfer_fare = result.fare;
                        property.transfer_count = result.count;
                        await property.save();
                    }
                    prev_result = result;
                    prev_address = address;
                    res.json({ success: true, data: result });
                }
                catch (err) {
                    res.status(500).json({ success: false, message: 'JSONパースエラー' });
                }
            }
            else {
                res.status(500).json({ success: false, message: 'Pythonスクリプトのエラー' });
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

// 家賃の予測
exports.predictRentalFee = async (req, res) => {
    console.log("Predict rental fee.");
    try {
        // Pythonスクリプトを実行して家賃を予測
        const properties = req.body;
        const pythonProcess = spawn('python3', ['./pycode/predictRentalFee.py']);
        pythonProcess.stdin.write(JSON.stringify(properties));
        pythonProcess.stdin.end();

        // Pythonスクリプトの出力を処理
        let output = '';
        let errorOutput = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error("Python error:", data.toString());
            errorOutput += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code === 0) {
                try {
                    // 家賃予測をMongoDBに追加
                    const results = JSON.parse(output);
                    const { pred, gap } = results;
                    for (let i = 0; i < properties.length; i++) {
                        const property = await Property.findOne({ id: properties[i].id });
                        if (property && !property.monthly_fee_pred) {
                            console.log(`Update rental fee predictin for: ${property.name}`);
                            // 予測値とギャップを保存
                            property.monthly_fee_pred = pred[i];
                            property.monthly_fee_gap = gap[i];
                            await property.save();
                        }
                    }
                    res.json({ success: true, data: results });
                }
                catch (err) {
                    res.status(500).json({ success: false, message: 'JSONパースエラー' });
                }
            }
            else {
                res.status(500).json({ success: false, message: 'Pythonスクリプトのエラー' });
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: '家賃予測に失敗しました。' });
    }
    finally {
        console.log("Rental fee prediction completed.");
    }
};

// スコアリング
exports.scoring = async (req, res) => {
    const { properties, weights } = req.body;
    console.log("Calculate Score with weight:", JSON.stringify(weights, null, 2));
    try {
        // Pythonスクリプトを実行してスコアリング
        const pythonProcess = spawn('python3', ['./pycode/calcScore.py']);
        pythonProcess.stdin.write(JSON.stringify(req.body));
        pythonProcess.stdin.end();

        // Pythonスクリプトの出力を処理
        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        let errorOutput = '';
        pythonProcess.stderr.on('data', (data) => {
            console.error("Python error:", data.toString());
            errorOutput += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code === 0) {
                try {
                    // スコアリング結果をMongoDBに追加
                    const results = JSON.parse(output);
                    for (let i = 0; i < properties.length; i++) {
                        const property = await Property.findOne({ id: properties[i].id });
                        if (property) {
                            console.log(`Update score of: ${property.name}`);
                            property.score = results[i]["Total_score"];
                            await property.save();
                        }
                    }
                    res.json({ success: true, data: results });
                }
                catch (err) {
                    res.status(500).json({ success: false, message: 'JSONパースエラー' });
                }
            }
            else {
                res.status(500).json({ success: false, message: 'Pythonスクリプトのエラー' });
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'スコアリングに失敗しました。' });
    }
};