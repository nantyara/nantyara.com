let isCollecting = false;
let collectedPosts = [];
let accountInfo = {
  account: '',
  account_name: ''
};

// メッセージリスナー
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCollecting') {
    startCollecting();
  } else if (message.action === 'stopCollecting') {
    stopCollecting();
  }
});

// アカウント情報を取得
function getAccountInfo() {
  const url = window.location.href;
  const match = url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/);

  if (match) {
    accountInfo.account = '@' + match[1];
  }

  // アカウント名を取得（プロフィール表示名）
  const nameEl = document.querySelector('[data-testid="UserName"]') ||
                 document.querySelector('div[dir="ltr"] span span');

  if (nameEl) {
    accountInfo.account_name = nameEl.textContent.trim();
  }
}

// 投稿データを抽出
function extractPostData(article) {
  try {
    const postData = {
      id: '',
      text: '',
      created_at: '',
      url: '',
      images: [],
      videos: [],
      likes: 0,
      retweets: 0,
      replies: 0
    };

    // 投稿URLとIDを取得
    const linkEl = article.querySelector('a[href*="/status/"]');
    if (linkEl) {
      const href = linkEl.getAttribute('href');
      postData.url = 'https://x.com' + href;
      const idMatch = href.match(/status\/(\d+)/);
      if (idMatch) {
        postData.id = idMatch[1];
      }
    }

    // 重複チェック
    if (collectedPosts.some(p => p.id === postData.id)) {
      return null;
    }

    // 投稿テキストを取得
    const textEl = article.querySelector('[data-testid="tweetText"]') ||
                   article.querySelector('div[lang]');
    if (textEl) {
      postData.text = textEl.textContent.trim();
    }

    // 日時を取得
    const timeEl = article.querySelector('time');
    if (timeEl) {
      const datetime = timeEl.getAttribute('datetime');
      if (datetime) {
        postData.created_at = datetime;
      }
    }

    // 画像URLを取得
    const imageEls = article.querySelectorAll('img[src*="pbs.twimg.com/media"]');
    imageEls.forEach(img => {
      let src = img.getAttribute('src');
      // 元画像のURLに変換（?format=jpgなどのパラメータを保持しつつ、name=largeに変更）
      if (src && src.includes('pbs.twimg.com')) {
        src = src.split('?')[0] + '?format=jpg&name=large';
        postData.images.push(src);
      }
    });

    // エンゲージメント数を取得
    const engagementEls = article.querySelectorAll('[role="group"] button');
    engagementEls.forEach(btn => {
      const ariaLabel = btn.getAttribute('aria-label');
      if (!ariaLabel) return;

      // 数値を抽出
      const numMatch = ariaLabel.match(/(\d+)/);
      const num = numMatch ? parseInt(numMatch[1]) : 0;

      if (ariaLabel.includes('返信') || ariaLabel.includes('Repl')) {
        postData.replies = num;
      } else if (ariaLabel.includes('リツイート') || ariaLabel.includes('Retweet')) {
        postData.retweets = num;
      } else if (ariaLabel.includes('いいね') || ariaLabel.includes('Like')) {
        postData.likes = num;
      }
    });

    // 必須データがあるかチェック
    if (postData.id && postData.url) {
      return postData;
    }

    return null;
  } catch (error) {
    console.error('投稿データ抽出エラー:', error);
    return null;
  }
}

// ページをスクロール
function scrollPage() {
  return new Promise((resolve) => {
    const scrollHeight = document.documentElement.scrollHeight;
    window.scrollTo(0, scrollHeight);
    setTimeout(resolve, 1500); // スクロール後に待機
  });
}

// 投稿を収集
async function collectPosts() {
  const articles = document.querySelectorAll('article[data-testid="tweet"]');

  articles.forEach(article => {
    const postData = extractPostData(article);
    if (postData) {
      collectedPosts.push(postData);
      console.log('収集:', postData.id, postData.text.substring(0, 30));
    }
  });

  // 進捗を送信
  chrome.runtime.sendMessage({
    action: 'updateProgress',
    posts: collectedPosts,
    accountName: accountInfo.account_name
  });
}

// 収集開始
async function startCollecting() {
  if (isCollecting) return;

  isCollecting = true;
  collectedPosts = [];

  // アカウント情報を取得
  getAccountInfo();

  console.log('収集開始:', accountInfo.account);

  let noNewPostsCount = 0;
  const maxNoNewPosts = 5; // 新規投稿がない回数の閾値

  while (isCollecting && noNewPostsCount < maxNoNewPosts) {
    const beforeCount = collectedPosts.length;

    // 投稿を収集
    await collectPosts();

    // スクロール
    await scrollPage();

    const afterCount = collectedPosts.length;

    // 新規投稿がなかったらカウント
    if (beforeCount === afterCount) {
      noNewPostsCount++;
      console.log(`新規投稿なし (${noNewPostsCount}/${maxNoNewPosts})`);
    } else {
      noNewPostsCount = 0; // リセット
      console.log(`収集数: ${afterCount}`);
    }

    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 収集完了
  isCollecting = false;
  console.log('収集完了:', collectedPosts.length, '件');

  chrome.runtime.sendMessage({
    action: 'collectingComplete',
    posts: collectedPosts,
    accountName: accountInfo.account_name
  });
}

// 停止
function stopCollecting() {
  isCollecting = false;
  console.log('収集停止');
}

// ページ読み込み時にアカウント情報を取得
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', getAccountInfo);
} else {
  getAccountInfo();
}
