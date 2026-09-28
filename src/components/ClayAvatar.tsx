import React, { useEffect, useState } from 'react';
import { GENDER_DATA, WALLET_ICON_URL } from '../constants/walletData';
import { UserProfile } from '../types/wallet';

const WALLET_SVG_FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <rect x="8" y="8" width="104" height="104" rx="28" fill="#635bff"/>
  <path d="M38 36 L54 16 L88 26 L78 44 Z" fill="#62fae3"/>
  <rect x="24" y="34" width="72" height="58" rx="16" fill="#ffffff"/>
  <rect x="64" y="52" width="34" height="22" rx="8" fill="#f0f4f8" stroke="#c3c0ff" stroke-width="2"/>
  <circle cx="84" cy="63" r="5" fill="#635bff"/>
</svg>
`)}`;

interface UserAvatarProps {
  profile: UserProfile;
  sizeClass?: string;
  showBadge?: boolean;
  animateTrigger?: string;
}

export const UserClayAvatar: React.FC<UserAvatarProps> = ({
  profile,
  sizeClass = 'w-16 h-16',
  showBadge = true,
  animateTrigger,
}) => {
  const [imgError, setImgError] = useState(false);
  const [animating, setAnimating] = useState(false);

  const genderInfo = GENDER_DATA[profile.gender] || GENDER_DATA.hombre;
  const activeSrc =
    profile.useCustomAvatar && profile.customAvatarImg
      ? profile.customAvatarImg
      : genderInfo.img;

  useEffect(() => {
    setImgError(false);
    setAnimating(true);
    const timer = setTimeout(() => setAnimating(false), 160);
    return () => clearTimeout(timer);
  }, [activeSrc, profile.gender, profile.useCustomAvatar, animateTrigger]);

  const resolvedSrc = imgError ? genderInfo.fallbackSvg : activeSrc;

  return (
    <div
      className={`relative ${sizeClass} shrink-0 rounded-full p-1 bg-gradient-to-tr from-[#e2dfff] via-white to-[#62fae3] shadow-[0_6px_16px_rgba(99,91,255,0.22),inset_2px_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center`}
    >
      <img
        src={resolvedSrc}
        alt={`Avatar de ${profile.name}`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`w-full h-full rounded-full object-cover object-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] transition-all duration-200 ${
          animating ? 'scale-90 opacity-60' : 'scale-100 opacity-100 hover:scale-105'
        }`}
      />
      {showBadge && (
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#62fae3] text-[#00201c] flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-slate-900">
          <span className="material-symbols-outlined text-[12px] font-bold">check</span>
        </div>
      )}
    </div>
  );
};

export const WalletClayLogo: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'lg' }) => {
  const [imgError, setImgError] = useState(false);

  if (size === 'sm') {
    return (
      <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#e2dfff] to-[#f0f4f8] dark:from-[#321ed2]/40 dark:to-slate-800 shadow-[0_6px_14px_-4px_rgba(99,91,255,0.35),inset_2px_2px_4px_rgba(255,255,255,0.85)] transform -rotate-2" />
        <img
          src={imgError ? WALLET_SVG_FALLBACK : WALLET_ICON_URL}
          alt="FlickWallet Icon"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="relative z-10 w-7 h-7 object-contain drop-shadow-[0_4px_6px_rgba(73,62,229,0.25)]"
        />
      </div>
    );
  }

  return (
    <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
      <div className="absolute inset-0 rounded-[2.25rem] bg-gradient-to-br from-[#e2dfff] to-[#f0f4f8] dark:from-[#321ed2]/50 dark:to-[#1e2433] shadow-[0_18px_32px_-8px_rgba(99,91,255,0.28),inset_4px_4px_8px_rgba(255,255,255,0.9),inset_-4px_-4px_8px_rgba(15,23,42,0.06)] dark:shadow-[0_18px_32px_-8px_rgba(99,91,255,0.4),inset_2px_2px_6px_rgba(255,255,255,0.15)] transform -rotate-2" />
      <div className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center p-1.5 transition-transform duration-300 hover:scale-105 active:scale-95">
        <img
          alt="FlickWallet 3D Claymorphic Wallet Icon"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(73,62,229,0.25)]"
          src={imgError ? WALLET_SVG_FALLBACK : WALLET_ICON_URL}
        />
      </div>
    </div>
  );
};
