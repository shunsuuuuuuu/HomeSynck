const Property = require('../schema/propertyModel');

// 物件データの取得
exports.getAllProperties = async (req, res) => {
    try {
        const properties = await Property.find();
        res.status(200).json({ success: true, data: properties });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// CSVデータのアップロード
exports.uploadCSV = async (req, res) => {
    try {
        // CSVデータを処理してMongoDBに保存
        res.status(201).json({ success: true, message: 'CSV data uploaded successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


const { exec } = require('child_process');

// 物件データを取得してDBに保存
exports.fetchAndSavePropertyData = async (req, res) => {
    try {
        // Pythonスクリプトを実行して物件データを取得
        const python = exec('python3 ./pycode/test.py', (error, stdout, stderr) => {
            console.log("Run python")
            // if (error) {
            //     console.error(`Error executing Python script: ${error.message}`);
            //     return res.status(500).json({ success: false, message: 'Pythonスクリプトの実行に失敗しました' });
            // }

            // if (stderr) {
            //     console.error(`Python script stderr: ${stderr}`);
            //     return res.status(500).json({ success: false, message: 'Pythonスクリプトのエラー' });
            // }

            // // Pythonスクリプトからの標準出力をJSONとしてパース
            const properties = JSON.parse(stdout);

            console.log(properties)
            
            // // 物件データをMongoDBに挿入
            // Property.insertMany(properties, (err, docs) => {
            //     if (err) {
            //         console.error('MongoDBにデータの保存に失敗しました', err);
            //         return res.status(500).json({ success: false, message: 'MongoDBへのデータ保存に失敗しました' });
            //     }

            //     res.status(200).json({ success: true, message: '物件データが保存されました！', data: docs });
            // });
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};