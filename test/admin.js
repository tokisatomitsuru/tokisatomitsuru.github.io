let map;
let markersGroup;
let tempMarker = null;
let currentLocations = [];

// DOM要素
const locationForm = document.getElementById("locationForm");
const editIdInput = document.getElementById("editId");
const locNameInput = document.getElementById("locName");
const locLatInput = document.getElementById("locLat");
const locLngInput = document.getElementById("locLng");
const mediaTypeSelect = document.getElementById("mediaType");
const mediaUrlInput = document.getElementById("mediaUrl");
const locDescInput = document.getElementById("locDesc");
const imageUrlInput = document.getElementById("imageUrl");
const triggerDistanceInput = document.getElementById("triggerDistance");

const locationList = document.getElementById("locationList");
const locationCountSpan = document.getElementById("locationCount");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");

// 感度・表示設定関連
let currentSettings = {};
const settingTriggerDistanceInput = document.getElementById("settingTriggerDistance");
const settingTriggerDistanceLabel = document.getElementById("settingTriggerDistanceLabel");
const settingFadeDistanceInput = document.getElementById("settingFadeDistance");
const settingFadeDistanceLabel = document.getElementById("settingFadeDistanceLabel");
const settingBgColorInput = document.getElementById("settingBgColor");
const settingBgColorHex = document.getElementById("settingBgColorHex");

// 読み込み時
document.addEventListener("DOMContentLoaded", () => {
  currentLocations = getLocations();
  initMap();
  renderLocationList();
  initSettingsPanel();

  // イベントリスナー
  locationForm.addEventListener("submit", saveLocation);
  document.getElementById("resetFormBtn").addEventListener("click", resetForm);
  document.getElementById("exportBtn").addEventListener("click", exportData);
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", importData);
  document.getElementById("resetDefaultsBtn").addEventListener("click", resetToDefaults);
});

// 感度・表示設定パネルの初期化
function initSettingsPanel() {
  currentSettings = getSettings();

  settingTriggerDistanceInput.value = currentSettings.defaultTriggerDistance;
  settingTriggerDistanceLabel.textContent = currentSettings.defaultTriggerDistance;
  settingFadeDistanceInput.value = currentSettings.maxFadeDistance;
  settingFadeDistanceLabel.textContent = currentSettings.maxFadeDistance;
  settingBgColorInput.value = currentSettings.approachColor;
  settingBgColorHex.textContent = currentSettings.approachColor;

  settingTriggerDistanceInput.addEventListener("input", () => {
    currentSettings.defaultTriggerDistance = parseInt(settingTriggerDistanceInput.value);
    settingTriggerDistanceLabel.textContent = currentSettings.defaultTriggerDistance;
    saveSettings(currentSettings);
  });

  settingFadeDistanceInput.addEventListener("input", () => {
    currentSettings.maxFadeDistance = parseInt(settingFadeDistanceInput.value);
    settingFadeDistanceLabel.textContent = currentSettings.maxFadeDistance;
    saveSettings(currentSettings);
  });

  settingBgColorInput.addEventListener("input", () => {
    currentSettings.approachColor = settingBgColorInput.value;
    settingBgColorHex.textContent = currentSettings.approachColor;
    saveSettings(currentSettings);
  });

  document.querySelectorAll(".bg-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;
      currentSettings.approachColor = color;
      settingBgColorInput.value = color;
      settingBgColorHex.textContent = color;
      saveSettings(currentSettings);
      showToast("背景色を変更しました");
    });
  });
}

// トースト通知を表示
function showToast(message) {
  toastMsg.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// 地図の初期化
function initMap() {
  // デフォルト位置 (日本周辺の中心付近)
  const defaultCenter = [35.65858, 139.745433];
  
  // もし目的地が登録されているなら、1つ目の目的地の位置を初期位置にする
  const initialCenter = currentLocations.length > 0 
    ? [currentLocations[0].lat, currentLocations[0].lng] 
    : defaultCenter;

  map = L.map("map").setView(initialCenter, 14);

  // ダークテーマ用の地図タイルレイヤー
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  markersGroup = L.layerGroup().addTo(map);

  // 地図クリックで緯度経度取得
  map.on("click", (e) => {
    const lat = parseFloat(e.latlng.lat.toFixed(6));
    const lng = parseFloat(e.latlng.lng.toFixed(6));
    
    locLatInput.value = lat;
    locLngInput.value = lng;
    
    // 一時ピンを更新
    if (tempMarker) {
      tempMarker.setLatLng(e.latlng);
    } else {
      tempMarker = L.marker(e.latlng, { 
        draggable: true,
        icon: L.divIcon({
          className: "temp-map-marker",
          html: `<i class="fa-solid fa-location-dot" style="color: #3b82f6; font-size: 24px; text-shadow: 0 0 8px rgba(59,130,246,0.6);"></i>`,
          iconSize: [24, 24],
          iconAnchor: [12, 24]
        })
      }).addTo(map);
      
      // ドラッグ完了イベント
      tempMarker.on("dragend", (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        locLatInput.value = parseFloat(position.lat.toFixed(6));
        locLngInput.value = parseFloat(position.lng.toFixed(6));
      });
    }
    
    showToast(`位置を選択しました (緯度: ${lat}, 経度: ${lng})`);
  });
  
  updateMapMarkers();
}

// 地図のピンを全更新
function updateMapMarkers() {
  markersGroup.clearLayers();
  
  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }

  currentLocations.forEach(loc => {
    const isAudio = loc.mediaType === "audio";
    const markerColor = isAudio ? "#10b981" : "#ec4899"; // 音声＝緑, 動画＝ピンク
    const markerIcon = isAudio ? "fa-volume-high" : "fa-video";
    
    const icon = L.divIcon({
      className: "custom-map-marker",
      html: `<i class="fa-solid ${markerIcon}" style="background-color: ${markerColor}; color: white; padding: 8px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.4); font-size: 12px;"></i>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([loc.lat, loc.lng], { icon: icon })
      .bindPopup(`<b>${loc.name}</b><br><span style="font-size:0.8rem;color:#777;">${loc.mediaType === "audio" ? "音声" : "動画"}</span>`)
      .addTo(markersGroup);
  });
}

// 目的地リストを画面に描画
function renderLocationList() {
  locationList.innerHTML = "";
  locationCountSpan.textContent = `${currentLocations.length}箇所`;

  if (currentLocations.length === 0) {
    locationList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <i class="fa-regular fa-folder-open" style="font-size: 2.5rem; margin-bottom: 12px; display: block;"></i>
        目的地が登録されていません。<br>地図をクリックするか手動入力で追加してください。
      </div>
    `;
    return;
  }

  currentLocations.forEach(loc => {
    const item = document.createElement("div");
    item.className = "location-item";
    
    const isAudio = loc.mediaType === "audio";
    const mediaIcon = isAudio ? '<i class="fa-solid fa-volume-high" style="color: #10b981;"></i>' : '<i class="fa-solid fa-video" style="color: #ec4899;"></i>';
    
    item.innerHTML = `
      <div class="location-item-info">
        <h4>${mediaIcon} ${loc.name}</h4>
        <p>
          <span><i class="fa-solid fa-location-dot"></i> ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</span>
          <span><i class="fa-solid fa-bullseye"></i> ${loc.triggerDistance != null ? loc.triggerDistance + 'm' : 'デフォルト'}</span>
        </p>
      </div>
      <div class="action-btn-group">
        <button class="icon-btn edit-btn" title="編集"><i class="fa-solid fa-pen"></i></button>
        <button class="icon-btn icon-btn-danger delete-btn" title="削除"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    // イベント
    item.querySelector(".edit-btn").addEventListener("click", () => editLocation(loc.id));
    item.querySelector(".delete-btn").addEventListener("click", () => deleteLocation(loc.id));
    
    // リストクリックでその座標に地図をジャンプ
    item.addEventListener("click", (e) => {
      // ボタン自体のクリック時は除外
      if (e.target.closest(".icon-btn")) return;
      map.setView([loc.lat, loc.lng], 16);
    });

    locationList.appendChild(item);
  });
}

// 目的地を保存・更新する
function saveLocation(e) {
  e.preventDefault();
  
  const id = editIdInput.value || "loc_" + Date.now();
  const name = locNameInput.value.trim();
  const lat = parseFloat(locLatInput.value);
  const lng = parseFloat(locLngInput.value);
  const mediaType = mediaTypeSelect.value;
  const mediaUrl = mediaUrlInput.value.trim();
  const imageUrl = imageUrlInput.value.trim();
  const description = locDescInput.value.trim();
  const triggerDistVal = triggerDistanceInput.value.trim();
  const triggerDistance = triggerDistVal !== "" ? parseFloat(triggerDistVal) : null;

  if (!name || isNaN(lat) || isNaN(lng) || !mediaUrl) {
    showToast("入力値が正しくありません");
    return;
  }

  const newLocation = { id, name, lat, lng, mediaType, mediaUrl, imageUrl, description, triggerDistance };

  const existingIndex = currentLocations.findIndex(loc => loc.id === id);
  if (existingIndex > -1) {
    // 既存の編集更新
    currentLocations[existingIndex] = newLocation;
    showToast(`「${name}」を更新しました`);
  } else {
    // 新規登録
    currentLocations.push(newLocation);
    showToast(`「${name}」を追加しました`);
  }

  saveLocations(currentLocations);
  renderLocationList();
  updateMapMarkers();
  resetForm();
}

// 編集モードにする
function editLocation(id) {
  const loc = currentLocations.find(l => l.id === id);
  if (!loc) return;

  editIdInput.value = loc.id;
  locNameInput.value = loc.name;
  locLatInput.value = loc.lat;
  locLngInput.value = loc.lng;
  mediaTypeSelect.value = loc.mediaType;
  mediaUrlInput.value = loc.mediaUrl;
  imageUrlInput.value = loc.imageUrl || "";
  locDescInput.value = loc.description || "";
  triggerDistanceInput.value = loc.triggerDistance != null ? loc.triggerDistance : "";

  document.getElementById("saveBtn").innerHTML = '<i class="fa-solid fa-floppy-disk"></i> 更新する';
  
  // 地図をその場所へスクロールしてポップアップ
  map.setView([loc.lat, loc.lng], 16);
  
  showToast(`「${loc.name}」の編集モードを開始しました`);
}

// 目的地を削除する
function deleteLocation(id) {
  const index = currentLocations.findIndex(l => l.id === id);
  if (index === -1) return;

  const locName = currentLocations[index].name;
  if (confirm(`「${locName}」を削除してもよろしいですか？`)) {
    currentLocations.splice(index, 1);
    saveLocations(currentLocations);
    renderLocationList();
    updateMapMarkers();
    showToast(`「${locName}」を削除しました`);
    
    // 削除対象が編集中の場合はフォームもリセットする
    if (editIdInput.value === id) {
      resetForm();
    }
  }
}

// フォームをリセットする
function resetForm() {
  locationForm.reset();
  editIdInput.value = "";
  if (triggerDistanceInput) triggerDistanceInput.value = "";
  document.getElementById("saveBtn").innerHTML = '<i class="fa-solid fa-plus"></i> 登録・更新';
  
  if (tempMarker) {
    map.removeLayer(tempMarker);
    tempMarker = null;
  }
}

// データをエクスポート (JSONダウンロード)
function exportData() {
  if (currentLocations.length === 0) {
    showToast("エクスポートするデータがありません");
    return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentLocations, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "gps_locations_backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  
  showToast("設定データをエクスポートしました");
}

// データをインポート (JSONアップロード)
function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (Array.isArray(imported)) {
        // 簡易バリデーション
        const isValid = imported.every(loc => loc.id && loc.name && typeof loc.lat === "number" && typeof loc.lng === "number" && loc.mediaType && loc.mediaUrl);
        if (!isValid) {
          showToast("インポートしたファイルの形式が正しくありません");
          return;
        }
        
        if (confirm(`登録済みの${currentLocations.length}箇所のデータを上書きし、インポートした${imported.length}箇所の目的地を適用しますか？`)) {
          currentLocations = imported;
          saveLocations(currentLocations);
          renderLocationList();
          updateMapMarkers();
          showToast("データをインポートしました");
        }
      } else {
        showToast("インポートしたデータが配列ではありません");
      }
    } catch (err) {
      showToast("ファイルの解析に失敗しました");
      console.error(err);
    }
  };
  reader.readAsText(file);
  
  // 同じファイル選択でも発火するようにリセット
  e.target.value = "";
}

// サンプルデータに戻す
function resetToDefaults() {
  if (confirm("全ての変更が上書きされ、初期のサンプルデータ（ハチ公、東京タワーなど）に戻ります。よろしいですか？")) {
    localStorage.removeItem("gps_play_locations");
    currentLocations = getLocations();
    renderLocationList();
    updateMapMarkers();
    resetForm();
    showToast("サンプルデータにリセットしました");
  }
}
