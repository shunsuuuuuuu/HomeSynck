const { spawn } = require('child_process');

// ユーザー条件に基づくスコアリング
exports.calculateScores = async (req, res) => {
    try {
        const userCriteria = req.body;

        // Pythonスクリプトを実行
        const python = spawn('python3', ['./scripts/generate_scores.py']);
        python.stdin.write(JSON.stringify(userCriteria));
        python.stdin.end();

        let data = '';
        python.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });

        python.on('close', (code) => {
            if (code === 0) {
                const scores = JSON.parse(data);
                res.status(200).json({ success: true, data: scores });
            } else {
                res.status(500).json({ success: false, message: 'Error in scoring script' });
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 可視化用データの取得
exports.getVisualizationData = async (req, res) => {
    try {
        // ここでMongoDBまたはPythonスクリプトからデータを取得
        res.status(200).json({ success: true, data: { /* 可視化データ */ } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
