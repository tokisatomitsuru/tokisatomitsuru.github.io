// デフォルトの目的地データ
const DEFAULT_LOCATIONS = [
  {
    id: "hachiko",
    name: "中央公園の真ん中らへん",
    lat: 34.169877,
    lng: 131.466686,
    mediaType: "audio",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    imageUrl: "https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&w=400&q=80",
    description: "中央公園の真ん中らへん",
    triggerDistance: null
  },
  {
    id: "tokyotower",
    name: "アルクの駐車場",
    lat: 34.172108,
    lng: 131.468024,
    mediaType: "video",
    mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80",
    description: "東京のシンボル、東京タワーです。",
    triggerDistance: null
  }
];

// LocalStorage から目的地データを読み込む、無ければデフォルトを使用
function getLocations() {
  const stored = localStorage.getItem("gps_play_locations");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse locations from localStorage", e);
    }
  }
  // 初回アクセス時はデフォルトデータを保存しておく
  saveLocations(DEFAULT_LOCATIONS);
  return DEFAULT_LOCATIONS;
}

// 目的地データを LocalStorage に保存
function saveLocations(locations) {
  localStorage.setItem("gps_play_locations", JSON.stringify(locations));
}

// デフォルトの全体設定 (感度・見た目)
const DEFAULT_SETTINGS = {
  defaultTriggerDistance: 15, // 到達判定距離のデフォルト (m)
  maxFadeDistance: 100,       // フェードイン開始距離 / 感度 (m)
  approachColor: "#1a0a2e"    // 接近時の背景色
};

// LocalStorage から全体設定を読み込む、無ければデフォルトを使用
function getSettings() {
  const stored = localStorage.getItem("gps_play_settings");
  if (stored) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {
      console.error("Failed to parse settings from localStorage", e);
    }
  }
  return { ...DEFAULT_SETTINGS };
}

// 全体設定を LocalStorage に保存
function saveSettings(settings) {
  localStorage.setItem("gps_play_settings", JSON.stringify(settings));
}
