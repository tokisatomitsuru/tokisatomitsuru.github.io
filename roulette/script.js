document.addEventListener('DOMContentLoaded', () => {
    const spinButton = document.getElementById('spin-button');
    const inputResultDisplay = document.getElementById('input-result');
    const outputResultDisplay = document.getElementById('output-result');
    const combinedSentenceDisplay = document.getElementById('combined-sentence');
    const languageButton = document.getElementById('language-toggle');

    const inputOptionsJapanese = [
        '筋電センサーによる手の動きの検知', '視線追跡による注視点の移動', '環境光センサーによる明るさの変化', '音声認識による特定の単語', 'ジェスチャー認識による腕の動き', '温度センサーによる皮膚温度の変化', '加速度センサーによる体の傾斜', '心拍センサーによる心拍数の変動', '脳波センサーによる集中度の変化', '圧力センサーによる接触の強さ',
        '匂いセンサーによる特定の香りの検知', '触覚センサーによる表面の質感', '赤外線センサーによる人感検知', 'マイクによる音量の変化', '距離センサーによる物体との距離', '脈拍酸素飽和度センサーによるSpO2値', '皮膚電気反応センサーによる発汗量の変化', '呼吸センサーによる呼吸パターンの変化', '血圧センサーによる血圧の変化', '血糖値センサーによる血糖値の変動',
        '体組成計による体重の変化', '脳磁計による脳活動の変化', '機能的MRIによる特定の脳部位の活動', 'VRコントローラーのボタン入力', 'ARグラスのジェスチャー入力', 'スマートフォンの画面タップ', 'マウスの動き', 'キーボードの特定のキー入力', 'ゲームパッドのボタン入力', 'フットペダルの踏み込み',
        'ウェアラブルデバイスのセンサー入力', '生体認証でログインする', 'デジタルペンの筆圧', '3Dスキャナーによる形状の変化', '深度カメラによる奥行き情報の変化', 'LiDARによる環境のスキャン', 'レーダーによる物体の動きの検知', 'ソナーによる水中での音の変化', '電波センサーによる電波強度の変化', '磁気センサーによる磁力の変化',
        '重力センサーによる傾きの変化', '雨量計による降水量の変化', '風速計による風速の変化', '振動センサーによる振動の検知', 'ノイズセンサーによる騒音レベルの変化', '紫外線センサーによる紫外線量の変化', 'NFCリーダーによるID読み取り', 'RFIDリーダーによるタグ読み取り', 'バーコードリーダーによる情報読み取り', 'QRコードリーダーによる情報読み取り',
        '画像認識AIによる特定のオブジェクトの検出', '物体検出AIによる人物の検出', '感情認識AIによる表情の読み取り', '姿勢推定AIによる体のポーズの認識', '手形状認識AIによる手の形の認識', '視線推定AIによる視線の方向の認識', '音声感情認識AIによる声の感情の読み取り', '自然言語理解AIによるテキストの意図理解', '行動認識AIによる特定の行動の認識', '状況認識AIによる周囲の状況の理解',
        '特定の時間帯の入力', '特定の場所での入力', '特定の行動後の入力', '特定の感情状態での入力', '特定の環境下での入力', '特定のデバイスの操作', '特定のアプリケーションの起動', '特定のウェブサイトへのアクセス', '特定のファイルへのアクセス', '特定の操作の繰り返し回数', '特定の時間内の操作頻度', '特定のパターンでの入力',
        '複合的なセンサー情報の組み合わせ', 'ユーザーによる明示的な選択', 'システムによる自動的な判定'
    ];

    const outputOptionsJapanese = [
        '光の色の変化', '光の強度の変化', '光の点滅', '特定のパターンで光る', '光の照射方向の変化', '特定の音の再生', '音声合成によるメッセージ', '振動',
        '特定の場所への移動 (ロボット)', '特定の動作の実行 (ロボットアーム)', 'デジタルアバターの表情変化', 'デジタルアバターのジェスチャー', '環境照明の変化', '特定の香りの放出', '微量の熱の発生', '微量の冷却', '風の発生', '水滴の噴射',
        'シャボン玉の発生', '煙の発生 (無害な)', '特定の文字の表示', '特定の記号の表示', 'グラフの描画', '図の表示', 'メッセージの通知', 'アラートの表示', 'エラーメッセージの表示', '成功メッセージの表示',
        '特定のウェブサイトへの誘導', '特定のアプリケーションの起動', '他のデバイスへの信号送信', 'クラウドへのデータ保存', 'ソーシャルメディアへの投稿', '電子メールの送信', 'メッセージアプリへの送信', '仮想現実空間の生成', '拡張現実コンテンツの表示', 'ホログラフィック映像の投影',
        '特定のUI要素の表示', '特定のUI要素の非表示', 'アニメーションの再生', '触覚フィードバック', '特定の周波数の音の出力', '特定の音量の変化', '音の定位の変化', '音の反響の変化', '特定の波形の生成',
        '特定の楽器の音色の出力', '特定の言語での音声出力', '特定の感情を込めた音声出力'
    ];

    const inputOptionsEnglish = [
        'EMG sensor detects hand movement', 'Eye tracking detects gaze movement', 'Ambient light sensor detects brightness change', 'Voice recognition detects specific word', 'Gesture recognition detects arm movement', 'Temperature sensor detects skin temperature change', 'Accelerometer detects body tilt', 'Heart rate sensor detects heart rate change', 'EEG sensor detects concentration change', 'Pressure sensor detects contact strength',
        'Smell sensor detects specific scent', 'Tactile sensor detects surface texture', 'Infrared sensor detects human presence', 'Microphone detects volume change', 'Distance sensor detects distance to object', 'Pulse oximeter detects SpO2 level', 'Galvanic skin response sensor detects perspiration change', 'Respiration sensor detects breathing pattern change', 'Blood pressure sensor detects blood pressure change', 'Blood glucose sensor detects blood glucose level change',
        'Body composition monitor detects weight change', 'Magnetoencephalography detects brain activity change', 'Functional MRI detects activity in specific brain regions', 'VR controller button input', 'AR glasses gesture input', 'Smartphone screen tap', 'Mouse movement', 'Keyboard specific key input', 'Gamepad button input', 'Foot pedal press',
        'Wearable device sensor input', 'Login with biometric authentication', 'Digital pen pressure', '3D scanner detects shape change', 'Depth camera detects change in depth information', 'LiDAR scans the environment', 'Radar detects object movement', 'Sonar detects sound change underwater', 'Radio wave sensor detects radio wave intensity change', 'Magnetic sensor detects magnetic force change',
        'Gravity sensor detects tilt change', 'Rain gauge detects precipitation change', 'Anemometer detects wind speed change', 'Vibration sensor detects vibration', 'Noise sensor detects noise level change', 'Ultraviolet sensor detects UV level change', 'NFC reader reads ID', 'RFID reader reads tag', 'Barcode reader reads information', 'QR code reader reads information',
        'Image recognition AI detects specific object', 'Object detection AI detects person', 'Emotion recognition AI reads facial expression', 'Pose estimation AI recognizes body pose', 'Hand shape recognition AI recognizes hand shape', 'Gaze estimation AI recognizes direction of gaze', 'Speech emotion recognition AI reads emotion in voice', 'Natural language understanding AI understands text intent', 'Behavior recognition AI recognizes specific behavior', 'Situation recognition AI understands surrounding situation',
        'Input at specific time', 'Input at specific location', 'Input after specific action', 'Input in specific emotional state', 'Input under specific environmental condition', 'Operation of specific device', 'Launch of specific application', 'Access to specific website', 'Access to specific file', 'Number of repetitions of specific operation', 'Frequency of operation within specific time', 'Input with specific pattern',
        'Combination of multiple sensor information', 'Explicit selection by user', 'Automatic judgment by system'
    ];

    const outputOptionsEnglish = [
        'Light color change', 'Light intensity change', 'Light flashing', 'Lights in specific pattern', 'Change in light irradiation direction', 'Playback of specific sound', 'Speech synthesis message', 'Vibration',
        'Movement to specific location (robot)', 'Execution of specific action (robot arm)', 'Digital avatar\'s facial expression change', 'Digital avatar\'s gesture', 'Ambient lighting change', 'Release of specific fragrance', 'Slight heat generation', 'Slight cooling', 'Wind generation', 'Water spray',
        'Generation of soap bubbles', 'Smoke generation (harmless)', 'Display of specific character', 'Display of specific symbol', 'Graph drawing', 'Diagram display', 'Message notification', 'Alert display', 'Error message display', 'Success message display',
        'Guidance to specific website', 'Launch of specific application', 'Signal transmission to other device', 'Cloud data storage', 'Posting to social media', 'Sending email', 'Sending message app', 'Virtual reality space generation', 'Augmented reality content display', 'Holographic image projection',
        'Display of specific UI element', 'Hiding of specific UI element', 'Animation playback', 'Haptic feedback', 'Output of specific frequency sound', 'Specific volume change', 'Sound localization change', 'Sound reverberation change', 'Specific waveform generation',
        'Output of specific instrument sound', 'Speech output in specific language', 'Speech output with specific emotion'
    ];

    let currentLanguage = 'japanese';

    function updateText(lang) {
        const title = document.querySelector('title');
        const intro = document.querySelector('body > p:first-of-type');
        const taskHeading = document.querySelector('body > p:nth-child(3)');
        const taskJapanese = document.getElementById('task-japanese');
        const taskEnglish = document.getElementById('task-english');
        spinButton.textContent = lang === 'japanese' ? 'スピン！' : 'Spin!';
        const inputLabel = document.querySelector('.result-container > p:first-of-type');
        const outputLabel = document.querySelector('.result-container > p:nth-child(2)');
        languageButton.textContent = lang === 'japanese' ? 'EN' : 'JP';

        title.textContent = lang === 'japanese' ? '身体とテクノロジーのインタラクション' : 'Body and Technology Interaction';
        intro.textContent = lang === 'japanese' ? 'このツールは、身体とテクノロジーのインタラクションの可能性を探るための簡単なルーレットです。' : 'This tool is a simple roulette to explore the possibilities of interaction between the body and technology.';
   
        taskJapanese.style.display = lang === 'japanese' ? 'block' : 'none';
        taskEnglish.style.display = lang === 'english' ? 'block' : 'none';
        inputLabel.textContent = lang === 'japanese' ? '入力:' : 'Input:';
        outputLabel.textContent = lang === 'japanese' ? '出力:' : 'Output:';
    }

    spinButton.addEventListener('click', () => {
        const lang = currentLanguage;
        const inputOptions = lang === 'japanese' ? inputOptionsJapanese : inputOptionsEnglish;
        const outputOptions = lang === 'japanese' ? outputOptionsJapanese : outputOptionsEnglish;

        const inputRandomIndex = Math.floor(Math.random() * inputOptions.length);
        const outputRandomIndex = Math.floor(Math.random() * outputOptions.length);

        const inputResult = inputOptions[inputRandomIndex];
        const outputResult = outputOptions[outputRandomIndex];

        inputResultDisplay.textContent = inputResult;
        outputResultDisplay.textContent = outputResult;
        combinedSentenceDisplay.textContent = lang === 'japanese' ? `「${inputResult}」を入力として、「${outputResult}」が出力されるインタラクション。` : `Interaction where 「${inputResult}」 is input and 「${outputResult}」 is output.`;
        console.log("Input Result:", inputResult);
        console.log("Output Result:", outputResult);
    });

    languageButton.addEventListener('click', () => {
        currentLanguage = currentLanguage === 'japanese' ? 'english' : 'japanese';
        updateText(currentLanguage);
    });

    updateText(currentLanguage);
});