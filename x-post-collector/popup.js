let collectedPosts = [];
let isCollecting = false;

// UI要素取得
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const downloadJsonBtn = document.getElementById('download-json-btn');
const downloadImagesBtn = document.getElementById('download-images-btn');
const accountNameEl = document.getElementById('account-name');
const countEl = document.getElementById('count');
const statusEl = document.getElementById('status');
const progressBar = document.getElementById('progress-bar');

// ストレージから状態を復元
chrome.storage.local.get(['collectedPosts', 'accountName'], (result) => {
  if (result.collectedPosts) {
    collectedPosts = result.collectedPosts;
    countEl.textContent = collectedPosts.length;
    downloadJsonBtn.disabled = collectedPosts.length === 0;
    downloadImagesBtn.disabled = collectedPosts.length === 0;
  }
  if (result.accountName) {
    accountNameEl.textContent = result.accountName;
  }
});

// 収集開始
startBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // XまたはTwitterのURLか確認
  if (!tab.url.includes('x.com') && !tab.url.includes('twitter.com')) {
    alert('XまたはTwitterのページで実行してください');
    return;
  }

  isCollecting = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  statusEl.textContent = '収集中...';

  // content scriptにメッセージ送信
  chrome.tabs.sendMessage(tab.id, { action: 'startCollecting' });
});

// 停止
stopBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  isCollecting = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  statusEl.textContent = '停止しました';

  chrome.tabs.sendMessage(tab.id, { action: 'stopCollecting' });
});

// JSONダウンロード
downloadJsonBtn.addEventListener('click', () => {
  if (collectedPosts.length === 0) {
    alert('収集されたデータがありません');
    return;
  }

  const data = {
    account: collectedPosts[0]?.account || '',
    account_name: collectedPosts[0]?.account_name || '',
    collected_at: new Date().toISOString(),
    posts: collectedPosts
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `x-posts-${data.account}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// 画像ダウンロード
downloadImagesBtn.addEventListener('click', async () => {
  if (collectedPosts.length === 0) {
    alert('収集されたデータがありません');
    return;
  }

  // すべての画像URLを抽出
  const imageUrls = [];
  collectedPosts.forEach(post => {
    if (post.images && post.images.length > 0) {
      imageUrls.push(...post.images);
    }
  });

  if (imageUrls.length === 0) {
    alert('画像が見つかりませんでした');
    return;
  }

  statusEl.textContent = `画像ダウンロード中... (${imageUrls.length}枚)`;

  // 画像を順次ダウンロード
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const filename = `image-${Date.now()}-${i}.jpg`;

    try {
      await chrome.downloads.download({
        url: url,
        filename: `x-images/${filename}`,
        saveAs: false
      });
    } catch (error) {
      console.error('ダウンロードエラー:', error);
    }

    // 進捗更新
    progressBar.style.width = `${((i + 1) / imageUrls.length) * 100}%`;
  }

  statusEl.textContent = `画像ダウンロード完了！ (${imageUrls.length}枚)`;
  setTimeout(() => {
    progressBar.style.width = '0%';
  }, 2000);
});

// content scriptからのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateProgress') {
    collectedPosts = message.posts;
    countEl.textContent = collectedPosts.length;
    accountNameEl.textContent = message.accountName || '-';

    // ストレージに保存
    chrome.storage.local.set({
      collectedPosts: collectedPosts,
      accountName: message.accountName
    });

    downloadJsonBtn.disabled = false;
    downloadImagesBtn.disabled = collectedPosts.length === 0;
  }

  if (message.action === 'collectingComplete') {
    isCollecting = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusEl.textContent = '収集完了！';
  }
});
