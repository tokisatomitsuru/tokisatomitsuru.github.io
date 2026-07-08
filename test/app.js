// グローバル状態
let map;
let userMarker = null;
let targetCircles = [];
let locations = [];
let watchId = null;
let currentCoords = null; // { lat, lng }

// シミュレータ用状態
let isSimMode = false;
let closestLocation = null;

// コンパス方位 (0=北, 時計回り)。センサー未取得時は null (北基準にフォールバック)
let deviceHeading = null;

// 到達トリガーの履歴管理
const triggeredLocations = new Set();

// === グローバル設定値 (スライダーで変更可能) ===
let DEFAULT_TRIGGER_DISTANCE = 15; // 各目的地にtriggerDistanceが未設定の場合のデフォルト
let MAX_FADE_DISTANCE = 100;       // フェードイン開始距離 (メートル)
let APPROACH_COLOR = { r: 26, g: 10, b: 46 }; // 接近時の背景色 (16進数 #1a0a2e)

// DOM要素
const trackingStatus = document.getElementById("trackingStatus");
const distanceVal = document.getElementById("distanceVal");
const targetName = document.getElementById("targetName");
const targetDesc = document.getElementById("targetDesc");
const gpsAccuracy = document.getElementById("gpsAccuracy");

// フェードイン表示用要素
const targetImageContainer = document.getElementById("targetImageContainer");
const targetImage = document.getElementById("targetImage");
const proximityFadeContent = document.getElementById("proximityFadeContent");

// 方向インジケーター (常時フル表示・フェードなし)
const directionHud = document.getElementById("directionHud");
const directionArrow = document.getElementById("directionArrow");

// シミュレータ関連
const simToggleBtn = document.getElementById("simToggleBtn");
const simPanel = document.getElementById("simPanel");
const simCloseBtn = document.getElementById("simCloseBtn");
const simModeSelect = document.getElementById("simMode");
const simControls = document.getElementById("simControls");
const distanceSlider = document.getElementById("distanceSlider");
const simLatInput = document.getElementById("simLat");
const simLngInput = document.getElementById("simLng");

// メディアモーダル関連
const mediaModal = document.getElementById("mediaModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalTargetName = document.getElementById("modalTargetName");
const modalTargetDesc = document.getElementById("modalTargetDesc");
const playerVideo = document.getElementById("playerVideo");
const playerAudio = document.getElementById("playerAudio");
const audioVisuals = document.getElementById("audioVisuals");

// トースト通知
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");

// バックグラウンド音声コントローラー用DOM
const bgAudioController = document.getElementById("bgAudioController");
const bgAudioName = document.getElementById("bgAudioName");
const bgAudioPlayBtn = document.getElementById("bgAudioPlayBtn");

// 現在バックグラウンド再生中の目的地ID
let playingAudioLocationId = null;

// ラジオ風フェード用の状態
let audioTargetVolume = 1;
let audioVolumeRAF = null;

// 起動初期化
document.addEventListener("DOMContentLoaded", () => {
  locations = getLocations();

  // 管理画面で設定された感度・見た目を反映
  const settings = getSettings();
  DEFAULT_TRIGGER_DISTANCE = settings.defaultTriggerDistance;
  MAX_FADE_DISTANCE = settings.maxFadeDistance;
  APPROACH_COLOR = hexToRgb(settings.approachColor);

  // イベント登録
  simToggleBtn.addEventListener("click", () => simPanel.classList.toggle("active"));
  simCloseBtn.addEventListener("click", () => simPanel.classList.remove("active"));
  simModeSelect.addEventListener("change", handleSimModeChange);
  distanceSlider.addEventListener("input", handleSimSliderInput);
  closeModalBtn.addEventListener("click", closeMediaModal);
  bgAudioPlayBtn.addEventListener("click", toggleBgAudio);

  // モーダル外クリックで閉じる
  mediaModal.addEventListener("click", (e) => {
    if (e.target === mediaModal) closeMediaModal();
  });

  // 初回タップでメディア再生と方位センサーを事前にアンロックしておく
  // (これにより、目的地到達時にタップなしで自動再生できる)
  document.addEventListener("pointerdown", primeInteraction, { once: true });

  // 即座にGPS開始（スタートオーバーレイなし）
  initMap();
  startTracking();
});

// 初回タップ時の下準備: 自動再生の解禁 + 方位センサーの許可・購読開始
function primeInteraction() {
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    // iOS: ユーザー操作の文脈でのみ許可ダイアログを出せる
    DeviceOrientationEvent.requestPermission()
      .then(state => {
        if (state === "granted") startCompass();
      })
      .catch(err => console.warn("方位センサーの許可取得に失敗", err));
  } else {
    startCompass();
  }

  unlockMediaAutoplay(playerAudio);
  unlockMediaAutoplay(playerVideo);
}

// メディア要素を一度ミュート再生→即停止し、以降タップなしで自動再生できるようにする
function unlockMediaAutoplay(mediaEl) {
  try {
    const wasMuted = mediaEl.muted;
    mediaEl.muted = true;
    const playPromise = mediaEl.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => {
          mediaEl.pause();
          mediaEl.muted = wasMuted;
        })
        .catch(() => {
          mediaEl.muted = wasMuted;
        });
    } else {
      mediaEl.muted = wasMuted;
    }
  } catch (e) {
    console.warn("メディアのアンロックに失敗", e);
  }
}

// 方位センサーの購読を開始
function startCompass() {
  const handler = (event) => {
    let heading;
    if (typeof event.webkitCompassHeading === "number") {
      heading = event.webkitCompassHeading; // iOS: 既に真北基準・時計回り
    } else if (event.alpha != null) {
      heading = 360 - event.alpha; // Android等: 反時計回りのalphaを時計回りに変換
    } else {
      return;
    }
    deviceHeading = (heading + 360) % 360;
  };

  if ("ondeviceorientationabsolute" in window) {
    window.addEventListener("deviceorientationabsolute", handler, true);
  } else {
    window.addEventListener("deviceorientation", handler, true);
  }
}

function showToast(message) {
  toastMsg.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// 地図の初期化 (非表示で計算のみ)
function initMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer || mapContainer.style.display === "none") {
    console.log("Map is hidden. Running in headless tracking mode.");
    map = null;
    return;
  }

  const defaultCenter = [35.65858, 139.745433];
  const initialCenter = locations.length > 0 
    ? [locations[0].lat, locations[0].lng] 
    : defaultCenter;

  map = L.map("map").setView(initialCenter, 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  drawTargetCircles();

  map.on("dblclick", (e) => {
    if (!isSimMode) return;
    updateUserPosition(e.latlng.lat, e.latlng.lng, 5);
  });
  
  map.doubleClickZoom.disable();
}

// 目的地のサークルを描く
function drawTargetCircles() {
  if (!map) return;
  
  targetCircles.forEach(c => map.removeLayer(c));
  targetCircles = [];

  locations.forEach(loc => {
    const color = loc.mediaType === "audio" ? "#10b981" : "#ec4899";
    
    const markerIcon = loc.mediaType === "audio" ? "fa-volume-high" : "fa-video";
    const customIcon = L.divIcon({
      className: "custom-map-marker",
      html: `<i class="fa-solid ${markerIcon}" style="background-color: ${color}; color: white; padding: 6px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 10px;"></i>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    const marker = L.marker([loc.lat, loc.lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`<b>${loc.name}</b><br>${loc.description || ""}`);
    targetCircles.push(marker);

    const innerCircle = L.circle([loc.lat, loc.lng], {
      color: color,
      fillColor: color,
      fillOpacity: 0.15,
      radius: TRIGGER_DISTANCE,
      weight: 1,
      dashArray: "4, 4"
    }).addTo(map);
    targetCircles.push(innerCircle);

    const outerCircle = L.circle([loc.lat, loc.lng], {
      color: color,
      fillColor: color,
      fillOpacity: 0.02,
      radius: MAX_COLOR_DISTANCE,
      weight: 1,
      opacity: 0.3
    }).addTo(map);
    targetCircles.push(outerCircle);
  });
}

// GPS監視の開始
function startTracking() {
  if (!navigator.geolocation) {
    trackingStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> GPS未対応ブラウザです`;
    gpsAccuracy.textContent = "未対応";
    return;
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      if (isSimMode) return;
      
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      
      gpsAccuracy.textContent = `精度: ±${Math.round(accuracy)}m`;
      updateUserPosition(lat, lng, accuracy);
    },
    (error) => {
      console.error("GPS Error:", error);
      if (!isSimMode) {
        trackingStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> GPS取得エラー`;
        showToast("GPS情報の取得に失敗しました。GPSを有効にしてください。");
      }
    },
    options
  );
}

// ユーザー現在地更新ロジック
function updateUserPosition(lat, lng, accuracy) {
  currentCoords = { lat, lng };

  if (simLatInput) simLatInput.value = lat.toFixed(6);
  if (simLngInput) simLngInput.value = lng.toFixed(6);

  if (map) {
    if (userMarker) {
      userMarker.setLatLng([lat, lng]);
    } else {
      const userIcon = L.divIcon({
        className: "user-map-marker",
        html: `<div style="position: relative; width: 14px; height: 14px; background-color: #3b82f6; border: 2px solid white; border-radius: 50;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
    }

    if (!isSimMode) {
      map.setView([lat, lng]);
    }
  }

  processDistances(lat, lng);
}

// 2地点間の距離計算 (ハバーシン公式)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 2地点間の方位角を計算 (0=北, 時計回り)
function computeBearing(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);

  return (theta * 180 / Math.PI + 360) % 360;
}

// 方向インジケーターの矢印回転・表示制御
function updateDirectionIndicator(userLat, userLng, target, distance) {
  if (!directionHud || !directionArrow) return;

  if (!target) {
    directionHud.classList.remove("visible");
    return;
  }

  const bearing = computeBearing(userLat, userLng, target.lat, target.lng);
  const heading = deviceHeading != null ? deviceHeading : 0; // センサー未取得時は北基準にフォールバック
  // fa-location-arrow は既定で右上(45度)を指す形状のため、-45度分補正する
  const rotation = (bearing - heading + 360) % 360 - 45;
  directionArrow.style.transform = `rotate(${rotation}deg)`;

  if (distance <= MAX_FADE_DISTANCE) {
    directionHud.classList.add("visible");
  } else {
    directionHud.classList.remove("visible");
  }
}

// 全ての目的地との距離判定とUI制御
function processDistances(userLat, userLng) {
  if (locations.length === 0) {
    if (targetName) targetName.textContent = "目的地がありません";
    if (targetDesc) targetDesc.textContent = "管理画面から追加してください。";
    if (distanceVal) distanceVal.textContent = "--";
    return;
  }

  let minDistance = Infinity;
  let nearestLoc = null;

  locations.forEach(loc => {
    const dist = getDistance(userLat, userLng, loc.lat, loc.lng);
    loc.currentDistance = dist;
    
    if (dist < minDistance) {
      minDistance = dist;
      nearestLoc = loc;
    }

    // 各目的地の再トリガー距離 (到達判定距離の2倍)
    const locTrigger = (loc.triggerDistance != null) ? loc.triggerDistance : DEFAULT_TRIGGER_DISTANCE;
    const locReset = locTrigger * 2;

    if (dist > locReset && triggeredLocations.has(loc.id)) {
      triggeredLocations.delete(loc.id);
      console.log(`Reset trigger for ${loc.name} (離れました: ${Math.round(dist)}m)`);
      
      if (playingAudioLocationId === loc.id) {
        stopBgAudio();
      }
    }
  });

  closestLocation = nearestLoc;
  const distance = Math.round(minDistance);

  // 距離表示
  if (distanceVal) {
    if (distance >= 1000) {
      distanceVal.textContent = `${(distance / 1000).toFixed(1)} km`;
    } else {
      distanceVal.textContent = `${distance} m`;
    }
  }

  // ターゲット情報
  if (targetName) targetName.textContent = nearestLoc.name;
  if (targetDesc) targetDesc.textContent = nearestLoc.description || "近くまで歩いてみましょう。";

  // 画像
  if (nearestLoc.imageUrl) {
    targetImage.src = nearestLoc.imageUrl;
    targetImageContainer.style.display = "block";
  } else {
    targetImageContainer.style.display = "none";
  }

  // フェードイン効果
  updateProximityEffects(distance);

  // 方向インジケーター (フェードなし・近づいたら表示)
  updateDirectionIndicator(userLat, userLng, nearestLoc, distance);

  // 各目的地の到達判定距離 (個別設定 > デフォルト)
  const triggerDist = (nearestLoc.triggerDistance != null)
    ? nearestLoc.triggerDistance
    : DEFAULT_TRIGGER_DISTANCE;
  const resetDist = triggerDist * 2;

  // 到達トリガー判定
  if (distance <= triggerDist && !triggeredLocations.has(nearestLoc.id)) {
    triggeredLocations.add(nearestLoc.id);
    triggerMediaPlayback(nearestLoc);
  }

  // 再生中のバックグラウンド音声を、距離に応じてラジオのチューニングのように音量調整
  updateBgAudioVolumeTarget();
}

// 距離に基づく音量 (0〜1) を計算。近いほど大きく、MAX_FADE_DISTANCE以遠は無音
function computeVolumeForDistance(distance) {
  const ratio = Math.min(Math.max(distance / MAX_FADE_DISTANCE, 0), 1);
  return 1 - ratio;
}

// 再生中の目的地との距離から目標音量を更新する
function updateBgAudioVolumeTarget() {
  if (!playingAudioLocationId) return;

  const playingLoc = locations.find(l => l.id === playingAudioLocationId);
  if (!playingLoc || playingLoc.currentDistance == null) return;

  audioTargetVolume = computeVolumeForDistance(playingLoc.currentDistance);
  startAudioVolumeFadeLoop();
}

// 現在の音量を目標音量へ滑らかに近づけ続けるループ (ラジオのチューニング感)
function startAudioVolumeFadeLoop() {
  if (audioVolumeRAF) return;

  const tick = () => {
    if (!playingAudioLocationId) {
      audioVolumeRAF = null;
      return;
    }

    const diff = audioTargetVolume - playerAudio.volume;
    if (Math.abs(diff) > 0.003) {
      playerAudio.volume = Math.min(1, Math.max(0, playerAudio.volume + diff * 0.06));
      audioVolumeRAF = requestAnimationFrame(tick);
    } else {
      playerAudio.volume = audioTargetVolume;
      audioVolumeRAF = null;
    }
  };

  audioVolumeRAF = requestAnimationFrame(tick);
}

// 距離に基づいたフェードイン調整 (単色背景色変化)
function updateProximityEffects(distance) {
  const ratio = Math.min(Math.max(distance / MAX_FADE_DISTANCE, 0), 1);

  const root = document.documentElement;
  
  // コンテンツのフェードイン
  const contentOpacity = 1 - ratio;
  const contentTranslate = ratio * 12;
  root.style.setProperty("--content-opacity", contentOpacity);
  root.style.setProperty("--content-translate", `${contentTranslate}px`);

  // 背景色补間: #000000 → APPROACH_COLOR (単色)
  const r = Math.round(APPROACH_COLOR.r * (1 - ratio));
  const g = Math.round(APPROACH_COLOR.g * (1 - ratio));
  const b = Math.round(APPROACH_COLOR.b * (1 - ratio));
  document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;

  // ステータステキスト更新
  const triggerDist = closestLocation
    ? (closestLocation.triggerDistance != null ? closestLocation.triggerDistance : DEFAULT_TRIGGER_DISTANCE)
    : DEFAULT_TRIGGER_DISTANCE;

  if (distance <= triggerDist) {
    trackingStatus.innerHTML = `<i class="fa-solid fa-circle-check"></i> 到達`;
  } else if (distance < MAX_FADE_DISTANCE * 0.3) {
    trackingStatus.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> まもなく到達`;
  } else if (distance < MAX_FADE_DISTANCE) {
    trackingStatus.innerHTML = `<i class="fa-solid fa-location-arrow"></i> 接近中`;
  } else {
    trackingStatus.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> 探索中`;
  }
}

// 16進数カラーをRGBに変換
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// メディア再生をトリガー
function triggerMediaPlayback(location) {
  console.log(`Triggering media: ${location.name} (${location.mediaType})`);
  
  playerVideo.style.display = "none";
  playerVideo.src = "";

  if (location.mediaType === "video") {
    stopBgAudio();

    modalTargetName.textContent = location.name;
    modalTargetDesc.textContent = location.description || "";
    playerVideo.src = location.mediaUrl;
    playerVideo.style.display = "block";
    
    mediaModal.classList.add("active");
    
    playerVideo.play()
      .then(() => showToast("動画の再生を開始しました"))
      .catch(err => {
        console.warn("Auto-play failed", err);
        showToast("画面をタップして動画を再生してください");
      });
  } else {
    // バックグラウンド音声
    playingAudioLocationId = location.id;
    bgAudioName.textContent = location.name;
    bgAudioController.style.display = "";
    bgAudioController.classList.add("active");
    
    bgAudioPlayBtn.innerHTML = '<i class="fa-solid fa-pause" style="font-size: 0.75rem;"></i>';

    // ラジオのスイッチを入れたように、無音からふわっと立ち上げる
    playerAudio.volume = 0;
    audioTargetVolume = computeVolumeForDistance(location.currentDistance != null ? location.currentDistance : 0);
    playerAudio.src = location.mediaUrl;
    playerAudio.play()
      .then(() => {
        showToast(`「${location.name}」を再生中`);
        startAudioVolumeFadeLoop();
      })
      .catch(err => {
        console.warn("Auto-play failed", err);
        showToast("画面をタップして音声を再生してください");
      });
  }
}

// メディアモーダルを閉じる
function closeMediaModal() {
  mediaModal.classList.remove("active");
  playerVideo.pause();
  playerVideo.src = "";
}

// バックグラウンド音声を停止
function stopBgAudio() {
  playerAudio.pause();
  playerAudio.src = "";
  playingAudioLocationId = null;
  bgAudioController.classList.remove("active");

  if (audioVolumeRAF) {
    cancelAnimationFrame(audioVolumeRAF);
    audioVolumeRAF = null;
  }
}

// バックグラウンド音声の再生・一時停止
function toggleBgAudio() {
  if (playerAudio.paused) {
    // 再開時もラジオのスイッチを入れたようにふわっと立ち上げる
    playerAudio.volume = 0;
    playerAudio.play()
      .then(() => {
        bgAudioPlayBtn.innerHTML = '<i class="fa-solid fa-pause" style="font-size: 0.75rem;"></i>';
        showToast("音声を再生しました");
        startAudioVolumeFadeLoop();
      })
      .catch(() => showToast("再生に失敗しました"));
  } else {
    playerAudio.pause();
    bgAudioPlayBtn.innerHTML = '<i class="fa-solid fa-play" style="font-size: 0.75rem;"></i>';
    showToast("音声を一時停止しました");
  }
}

// シミュレータモードのON/OFF切り替え
function handleSimModeChange(e) {
  isSimMode = e.target.value === "sim";
  
  if (isSimMode) {
    simControls.style.display = "block";
    gpsAccuracy.textContent = "シミュレーション中";
    showToast("シミュレータモードを有効にしました");
    
    if (!currentCoords && locations.length > 0) {
      const loc = locations[0];
      updateUserPosition(loc.lat + 0.0005, loc.lng + 0.0005, 5);
    }
  } else {
    simControls.style.display = "none";
    showToast("リアルGPSモードに戻りました");
    startTracking();
  }
}

// シミュレータのスライダー操作
function handleSimSliderInput(e) {
  if (!isSimMode || !closestLocation) return;

  const sliderPercent = parseInt(e.target.value);
  const maxOffset = 0.0009;
  const factor = sliderPercent / 100;
  
  const targetLat = closestLocation.lat + (maxOffset * factor);
  const targetLng = closestLocation.lng + (maxOffset * factor);
  
  updateUserPosition(targetLat, targetLng, 5);
  if (map) {
    map.setView([targetLat, targetLng]);
  }
}
