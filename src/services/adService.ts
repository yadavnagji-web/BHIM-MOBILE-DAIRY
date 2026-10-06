// Google AdMob Configuration & Service
// Banner Ad Unit ID: ca-app-pub-6423718618240244/6735134164
// Interstitial Ad Unit ID: ca-app-pub-6423718618240244/1291235796

export const ADMOB_CONFIG = {
  PUBLISHER_ID: 'ca-app-pub-6423718618240244',
  ADSENSE_CLIENT: 'ca-pub-6423718618240244',
  BANNER_AD_ID: 'ca-app-pub-6423718618240244/6735134164',
  BANNER_SLOT_ID: '6735134164',
  INTERSTITIAL_AD_ID: 'ca-app-pub-6423718618240244/1291235796',
  INTERSTITIAL_SLOT_ID: '1291235796',
  
  // Non-disturbing frequency capping rules:
  INTERSTITIAL_COOLDOWN_MS: 3 * 60 * 1000, // 3 minutes minimum between interstitial ads
  MAX_INTERSTITIAL_PER_SESSION: 4,
};

declare global {
  interface Window {
    adsbygoogle?: any[];
    admob?: any;
  }
}

class AdService {
  private lastInterstitialTime: number = 0;
  private interstitialImpressionsThisSession: number = 0;
  private tabSwitchCount: number = 0;
  private isInterstitialActive: boolean = false;
  private listeners: ((isOpen: boolean, triggerReason?: string) => void)[] = [];

  constructor() {
    // Check if saved timestamp exists in sessionStorage
    const savedLast = sessionStorage.getItem('bhim_last_ad_time');
    if (savedLast) {
      this.lastInterstitialTime = parseInt(savedLast, 10) || 0;
    }
  }

  public subscribe(listener: (isOpen: boolean, triggerReason?: string) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(isOpen: boolean, triggerReason?: string) {
    this.isInterstitialActive = isOpen;
    this.listeners.forEach((l) => l(isOpen, triggerReason));
  }

  public canShowInterstitial(): boolean {
    const now = Date.now();
    if (this.isInterstitialActive) return false;
    if (this.interstitialImpressionsThisSession >= ADMOB_CONFIG.MAX_INTERSTITIAL_PER_SESSION) {
      return false;
    }
    if (now - this.lastInterstitialTime < ADMOB_CONFIG.INTERSTITIAL_COOLDOWN_MS) {
      return false;
    }
    return true;
  }

  /**
   * Safe, non-disturbing interstitial trigger.
   * Only shows if cooldown and session limits pass.
   * @param triggerReason Context where ad is called (e.g., 'after_add_contact', 'tab_switch')
   */
  public triggerInterstitial(triggerReason: string): boolean {
    if (!this.canShowInterstitial()) {
      return false;
    }

    // Check if native AdMob is available in Android WebView / Capacitor / Cordova
    if (typeof window !== 'undefined' && window.admob && window.admob.interstitial) {
      try {
        window.admob.interstitial.show();
        this.markAdShown();
        return true;
      } catch (err) {
        console.warn('Native AdMob show failed, using web overlay fallback', err);
      }
    }

    // Web Interstitial Overlay (Polite & Non-disturbing)
    this.markAdShown();
    this.notify(true, triggerReason);
    return true;
  }

  public onTabSwitch(): void {
    this.tabSwitchCount += 1;
    // Show interstitial gently only every 6 tab switches if cooldown allows
    if (this.tabSwitchCount >= 6 && this.canShowInterstitial()) {
      this.tabSwitchCount = 0;
      this.triggerInterstitial('tab_switch');
    }
  }

  public closeInterstitial(): void {
    this.notify(false);
  }

  private markAdShown(): void {
    const now = Date.now();
    this.lastInterstitialTime = now;
    this.interstitialImpressionsThisSession += 1;
    try {
      sessionStorage.setItem('bhim_last_ad_time', now.toString());
    } catch {
      // ignore storage quota
    }
  }

  public loadGoogleAdsenseTag(): void {
    if (typeof window === 'undefined') return;
    try {
      if (!document.getElementById('google-admob-script')) {
        const script = document.createElement('script');
        script.id = 'google-admob-script';
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADMOB_CONFIG.ADSENSE_CLIENT}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }
    } catch (err) {
      console.warn('Failed to load Google Ad script', err);
    }
  }
}

export const adService = new AdService();
