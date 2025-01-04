const Property = require('../schema/propertyModel');

// MongoDB接続
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://localhost:27017/property';
mongoose.connect(MONGO_URI).then(() => {
    console.log('MongoDBに接続しました');
}).catch(err => {
    console.error('MongoDB接続エラー:', err);
});

// DBから全ての物件データの取得
exports.getAllProperties = async (req, res) => {
    try {
        console.log('Fetching all properties from MongoDB...');
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
        res.status(200).json({ success: true, message: 'All properties deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 物件データを取得してDBに保存
const { exec } = require('child_process');
exports.fetchAndSavePropertyData = async (req, res) => {
    try {
        // Pythonスクリプトを実行して物件データを取得
        exec('python3 ./pycode/test.py', async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing Python script: ${error.message}`);
                return res.status(500).json({ success: false, message: 'Pythonスクリプトの実行に失敗しました' });
            }

            if (stderr) {
                console.error(`Python script stderr: ${stderr}`);
                return res.status(500).json({ success: false, message: 'Pythonスクリプトのエラー' });
            }

            try {
                // // Pythonスクリプトからの標準出力をJSONとしてパース
                const properties = JSON.parse(stdout);

                // 物件データをMongoDBに挿入
                const docs = await Property.insertMany(properties);
                const insertedProperties = await Property.find();
                console.log('Num of properties inserted:', insertedProperties.length);
                res.status(200).json({ success: true, message: '物件データが保存されました！', data: docs });
            } catch (err) {
                res.status(500).json({ success: false, message: 'MongoDBへのデータ保存に失敗しました' });
            }

        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 乗り換え情報を取得
const { spawn } = require('child_process');
exports.getTransferInfo = async (req, res) => {
    try {
        const id = decodeURIComponent(req.params.id);
        const address = decodeURIComponent(req.params.address);
        const destStation = decodeURIComponent(req.params.destStation);
        console.log(`Searching transfer info for address: ${address}, destination station: ${destStation}`);
        const pythonProcess = spawn('python3', ['./pycode/yahoo_transfer.py', address, destStation]);
        let output = '';
        let errorOutput = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        pythonProcess.on('close', async (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    res.json({ success: true, data: result });
                    // transfer_timeをMongoDBに追加
                    const property = await Property.findOne({ id: id });
                    if (property) {
                        property.transfer_time = result.ridetime;
                        property.transfer_fare = result.fare;
                        property.transfer_count = result.count;
                        await property.save();
                    }
                    console.log('transfer_timeがMongoDBに追加されました');

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
