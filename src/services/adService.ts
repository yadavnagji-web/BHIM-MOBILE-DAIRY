// Ad Service with Master ON/OFF and Admin Configuration
export const ADMOB_CONFIG = {
  PUBLISHER_ID: 'ca-app-pub-6423718618240244',
  ADSENSE_CLIENT: 'ca-pub-6423718618240244',
  BANNER_AD_ID: 'ca-app-pub-6423718618240244/6735134164',
  BANNER_SLOT_ID: '6735134164',
  INTERSTITIAL_AD_ID: 'ca-app-pub-6423718618240244/1291235796',
  INTERSTITIAL_SLOT_ID: '1291235796',
  INTERSTITIAL_COOLDOWN_MS: 3 * 60 * 1000,
  MAX_INTERSTITIAL_PER_SESSION: 4,
};

export interface AdSettings {
  adsMasterEnabled: boolean;
  bannerAdEnabled: boolean;
  interstitialAdEnabled: boolean;
  bannerAdUnit: string;
  interstitialAdUnit: string;
  sponsorTitle?: string;
  sponsorContact?: string;
  sponsorTagline?: string;
  sponsorAdEnabled?: boolean;
  bannerImageUrl?: string;
  bannerTargetUrl?: string;
  interstitialImageUrl?: string;
  interstitialTargetUrl?: string;
}

const DEFAULT_AD_SETTINGS: AdSettings = {
  adsMasterEnabled: true,
  bannerAdEnabled: true,
  interstitialAdEnabled: true,
  bannerAdUnit: 'ca-app-pub-6423718618240244/6735134164',
  interstitialAdUnit: 'ca-app-pub-6423718618240244/1291235796',
  sponsorTitle: 'जलद प्रिंटर्स एवं स्टेशनर्स (सकोदरा/सागवाड़ा)',
  sponsorContact: '9530482812',
  sponsorTagline: 'शादी कार्ड, फ्लेक्स बैनर, पम्पलेट व सभी प्रकार की छपाई हेतु संपर्क करें',
  sponsorAdEnabled: true,
  bannerImageUrl: '',
  bannerTargetUrl: '',
  interstitialImageUrl: '',
  interstitialTargetUrl: '',
};

const STORAGE_KEY = 'yadav_samaj_ad_settings';

declare global {
  interface Window {
    adsbygoogle?: any[];
    admob?: any;
  }
}

class AdService {
  private settings: AdSettings = DEFAULT_AD_SETTINGS;
  private lastInterstitialTime: number = 0;
  private interstitialImpressionsThisSession: number = 0;
  private tabSwitchCount: number = 0;
  private isInterstitialActive: boolean = false;
  private listeners: ((isOpen: boolean, triggerReason?: string) => void)[] = [];
  private settingsListeners: ((settings: AdSettings) => void)[] = [];

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.settings = { ...DEFAULT_AD_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      this.settings = DEFAULT_AD_SETTINGS;
    }
  }

  public getSettings(): AdSettings {
    return { ...this.settings };
  }

  public updateSettings(newSettings: Partial<AdSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {}
    this.settingsListeners.forEach((l) => l(this.settings));
  }

  public subscribeSettings(listener: (settings: AdSettings) => void) {
    this.settingsListeners.push(listener);
    listener(this.settings);
    return () => {
      this.settingsListeners = this.settingsListeners.filter((l) => l !== listener);
    };
  }

  public isAdsEnabled(): boolean {
    return this.settings.adsMasterEnabled;
  }

  public isBannerEnabled(): boolean {
    return this.settings.adsMasterEnabled && this.settings.bannerAdEnabled;
  }

  public isInterstitialEnabled(): boolean {
    return this.settings.adsMasterEnabled && this.settings.interstitialAdEnabled;
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
    if (!this.isInterstitialEnabled()) return false;
    if (this.isInterstitialActive) return false;
    if (this.interstitialImpressionsThisSession >= 4) return false;
    const now = Date.now();
    if (now - this.lastInterstitialTime < 2 * 60 * 1000) return false;
    return true;
  }

  public triggerInterstitial(triggerReason: string): boolean {
    if (!this.canShowInterstitial()) {
      return false;
    }

    if (typeof window !== 'undefined' && window.admob && window.admob.interstitial) {
      try {
        window.admob.interstitial.show();
        this.markAdShown();
        return true;
      } catch {}
    }

    this.markAdShown();
    this.notify(true, triggerReason);
    return true;
  }

  public onTabSwitch(): void {
    if (!this.isInterstitialEnabled()) return;
    this.tabSwitchCount += 1;
    if (this.tabSwitchCount >= 5 && this.canShowInterstitial()) {
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
