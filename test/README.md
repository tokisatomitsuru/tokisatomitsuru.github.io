# GPS連動型 インタラクティブ体験アプリ

このアプリケーションは、GPS位置情報と連動して特定の場所に近づくと背景色が変化し、目的地に到達した際に指定された音声や動画が自動的に再生されるWebアプリケーションです。

---

## ファイル構成
* [index.html](file:///C:/Users/ycam/Documents/GPSplayVideoandAudio/index.html) - 体験者のメイン画面
* [admin.html](file:///C:/Users/ycam/Documents/GPSplayVideoandAudio/admin.html) - 目的地の設定・管理画面
* [style.css](file:///C:/Users/ycam/Documents/GPSplayVideoandAudio/style.css) - スタイルシート（ダークモード・ガラスモフィズム）
* [config.js](file:///C:/Users/ycam/Documents/GPSplayVideoandAudio/config.js) - 初期設定（サンプル目的地データ）
* [app.js](file:///C:/Users/ycam/Documents/GPSplayVideoandAudio/app.js) - メイン画面のGPS・距離計算ロジック
* [admin.js](file:///C:/Users/ycam/Documents/GPSplayVideoandAudio/admin.js) - 管理画面の地図ピン追加・保存ロジック
* [assets/](file:///C:/Users/ycam/Documents/GPSplayVideoandAudio/assets/) - 自作の音声や動画の置き場所

---

## 起動方法

ブラウザのセキュリティ制限（Geolocation API や LocalStorage の制限）のため、`file://` スキーム（ファイルを直接ダブルクリックして開く）ではなく、**ローカルウェブサーバー**を立ち上げてアクセスすることを強く推奨します。

### 方法 1: VS Code の拡張機能を使う場合 (推奨)
1. VS Code で本フォルダを開きます。
2. 拡張機能「**Live Server**」をインストールします。
3. 画面右下の「**Go Live**」ボタンを押してサーバーを起動します。

### 方法 2: Python を使う場合 (ターミナルコマンド)
ターミナルやコマンドプロンプトで本フォルダに移動し、以下のコマンドを実行します。
```bash
python -m http.server 8000
```
その後、ブラウザで `http://localhost:8000` を開きます。

---

## 動作テスト方法 (PCでのデバッグ)

外に出て歩かなくても、PCの画面上で全ての機能がテストできる**「シミュレータ」**が内蔵されています。

1. [index.html](file:///C:/Users/ycam/Documents/GPSplayVideoandAudio/index.html) を開きます。
2. 「**体験を開始する**」をクリック（位置情報の許可ダイアログが出たら許可してください）。
3. 画面右下の「**シミュレータ**」ボタンを押してパネルを開きます。
4. シミュレータモードを「**仮想GPS (デバッグ)**」に切り替えます。
5. **テスト方法 A (スライダーを使う)**:
   * スライダーを右方向（到達 0m）にドラッグします。
   * **距離が近づくにつれて、背景の色が青から紫、そして赤・ピンクへと滑らかに変化します。**
   * 到達（15m以内）すると、自動的に音声または動画がポップアップ再生されます。
6. **テスト方法 B (地図上でワープする)**:
   * 右側の地図上を**ダブルクリック**すると、その場所に「現在地ピン」が瞬時にワープします。
   * 目的地（緑やピンクのピン）の近くをダブルクリックして接近させ、挙動を確認できます。

---

## 自作の音声や動画への差し替え方法 (移行手順)

ご自身で制作した音声（BGM、ナレーションなど）や動画を適用する手順です。

### 手順 1: アセットの配置
制作した音声ファイル（.mp3 など）や動画ファイル（.mp4 など）を、[assets/](file:///C:/Users/ycam/Documents/GPSplayVideoandAudio/assets/) フォルダの中にコピーします。

### 手順 2: 管理画面から登録する
1. アプリのヘッダーにある「**管理者設定**」をクリックして [admin.html](file:///C:/Users/ycam/Documents/GPSplayVideoandAudio/admin.html) を開きます。
2. **位置の指定**:
   * 地図上で目的地にしたい場所をクリックすると、緯度と経度が自動入力されます。
   * もしくは、緯度経度の入力欄に直接数値を入力します。
3. **メディアの指定**:
   * メディアタイプで「音声」または「動画」を選択します。
   * メディアURL欄に、配置したファイルのパスを記述します。
     * 例: `assets/my-audio.mp3` または `assets/my-video.mp4`
4. **保存**:
   * 「**登録・更新**」ボタンを押します。これで LocalStorage に保存され、体験画面に即座に反映されます。

### 手順 3: 設定の書き出し (別の端末で使う場合)
スマホ等の別端末で体験する場合、PCで作成した目的地データを移行できます。
1. 管理画面の左下にある「**エクスポート**」ボタンを押すと、`gps_locations_backup.json` がダウンロードされます。
2. スマホで管理画面を開き、「**インポート**」ボタンを押して上記 JSON ファイルを読み込みます。これで同じ目的地がスマホ上でも設定されます。
