// サイト共通のナビゲーション定義
// Header（デスクトップナビ）・HamburgerMenu・Layout（フッター）で共有する

export interface NavItem {
  href: string;
  label: string;
  /** Font Awesome のクラス名 */
  icon: string;
}

export const navItems: NavItem[] = [
  { href: '/', label: 'ライブ予定', icon: 'fa-solid fa-calendar-days' },
  { href: '/releases', label: '音源', icon: 'fa-solid fa-compact-disc' },
  { href: '/members', label: 'メンバー', icon: 'fa-solid fa-users' },
  // 準備中のページはコンテンツができたらここに戻す
  // { href: '/history', label: '沿革', icon: 'fa-solid fa-book-open' },
  // { href: '/gallery', label: 'ギャラリー', icon: 'fa-solid fa-camera' },
  { href: '/links', label: 'リンク', icon: 'fa-solid fa-link' },
  { href: '/contact', label: 'お問い合わせ', icon: 'fa-solid fa-envelope' },
];

export interface SnsLink {
  href: string;
  label: string;
  icon: string;
}

export const snsLinks: SnsLink[] = [
  { href: 'https://x.com/nantyaraidol', label: 'X（公式）', icon: 'fa-brands fa-x-twitter' },
  { href: 'https://www.youtube.com/@nagaokatasuku', label: 'YouTube', icon: 'fa-brands fa-youtube' },
  { href: 'https://podcast.nantyara.com', label: 'Podcast', icon: 'fa-solid fa-podcast' },
  { href: 'https://nantyara.thebase.in/', label: 'グッズ', icon: 'fa-solid fa-cart-shopping' },
];
