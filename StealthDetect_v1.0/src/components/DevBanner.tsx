import React from 'react';
import { isNative, isIOS, isAndroid, isWeb } from '../utils/native';

/**
 * Development banner showing the current platform
 * Only shows in development mode
 */
export function DevBanner() {
  // Don't show in production
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return null;
  }

  const getPlatformInfo = () => {
    if (isIOS()) return { label: '📱 iOS Native', color: 'bg-blue-600' };
    if (isAndroid()) return { label: '🤖 Android Native', color: 'bg-green-600' };
    if (isWeb() && !isNative()) return { label: '🌐 Web Preview', color: 'bg-purple-600' };
    return { label: '🌐 Web', color: 'bg-gray-600' };
  };

  const platform = getPlatformInfo();

  return (
    <div className={`${platform.color} text-white text-xs py-1 px-3 text-center fixed top-0 left-0 right-0 z-50 opacity-75`}>
      {platform.label} | StealthDetect
      {isWeb() && !isNative() && (
        <span className="ml-2">
          • To build iOS app, see <strong>QUICK_START.md</strong>
        </span>
      )}
    </div>
  );
}
