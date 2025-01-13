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
const { exec } = require('child_process');
exports.fetchPropertyInfo = async (req, res) => {
    const url = req.params.url;
    console.log(`Updating property info from URL : ${url}`);
    try {
        // Pythonスクリプトを実行して物件データを取得
        console.log(`Executing Python script`);
        // Pythonスクリプトを実行
        exec(`python3 pycode/fetchPropertyInfo.py "${url}"`, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error.message}`);
                return res.status(500).json({ success: false, message: 'Pythonスクリプトの実行に失敗しました' });
            }

            if (stderr) {
                console.error(`Python script stderr: ${stderr}`);
                return res.status(500).json({ success: false, message: 'Pythonスクリプトのエラー' });
            }

            // Pythonスクリプトからの標準出力をJSONとしてパース
            const properties = JSON.parse(stdout);

            // 物件データをMongoDBに挿入
            const docs = await Property.insertMany(properties);
            const insertedProperties = await Property.find();
            console.log('Num of properties inserted:', insertedProperties.length);
            res.status(200).json({ success: true, message: '物件データが保存されました！', data: docs });

        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 乗り換え情報を取得
const { spawn } = require('child_process');
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