import { supabase } from '@/integrations/supabase/client';

export interface PWAConfig {
  id?: string;
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  scope: string;
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  orientation: 'any' | 'natural' | 'landscape' | 'portrait';
  theme_color: string;
  background_color: string;
  icon_192: string;
  icon_512: string;
  categories: string[];
  language: string;
  prefer_related_applications: boolean;
  related_applications?: RelatedApplication[];
  screenshots?: Screenshot[];
  shortcuts?: Shortcut[];
  download_popup: DownloadPopupConfig;
  service_worker_enabled: boolean;
  offline_enabled: boolean;
  push_notifications_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DownloadPopupConfig {
  enabled: boolean;
  title: string;
  message: string;
  button_text: string;
  show_after_seconds: number;
  dismissible: boolean;
  show_once: boolean;
  theme: 'light' | 'dark' | 'auto';
  position: 'top' | 'bottom' | 'center';
  show_on_pages: string[];
  icons: {
    light: string;
    dark: string;
  };
  animation: 'slide' | 'fade' | 'bounce';
  auto_hide_after_seconds?: number;
}

export interface RelatedApplication {
  platform: string;
  url: string;
  id?: string;
}

export interface Screenshot {
  src: string;
  sizes: string;
  type: string;
  form_factor?: 'narrow' | 'wide';
  label?: string;
}

export interface Shortcut {
  name: string;
  short_name?: string;
  description?: string;
  url: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}

export interface PWAInstallationStats {
  total_installs: number;
  daily_installs: number;
  weekly_installs: number;
  monthly_installs: number;
  browsers: Record<string, number>;
  platforms: Record<string, number>;
  countries: Record<string, number>;
}

class PWAService {
  // Get PWA configuration
  async getPWAConfig(): Promise<PWAConfig | null> {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('config_value')
        .eq('config_key', 'pwa')
        .eq('config_type', 'pwa')
        .single();

      if (error) {
        console.error('Error fetching PWA config:', error);
        return this.getDefaultPWAConfig();
      }

      return data?.config_value ? (data.config_value as unknown as PWAConfig) : this.getDefaultPWAConfig();
    } catch (error) {
      console.error('Error in getPWAConfig:', error);
      return this.getDefaultPWAConfig();
    }
  }

  // Update PWA configuration
  async updatePWAConfig(config: Partial<PWAConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getPWAConfig();
      const updatedConfig = { ...currentConfig, ...config, updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          config_key: 'pwa',
          config_type: 'pwa',
          config_value: updatedConfig as any,
          description: 'Configuração da Progressive Web App'
        });

      if (error) {
        console.error('Error updating PWA config:', error);
        return false;
      }

      // Update manifest and service worker
      this.updateManifest(updatedConfig);
      
      return true;
    } catch (error) {
      console.error('Error in updatePWAConfig:', error);
      return false;
    }
  }

  // Generate manifest.json
  generateManifest(config: PWAConfig): any {
    return {
      name: config.name,
      short_name: config.short_name,
      description: config.description,
      start_url: config.start_url,
      scope: config.scope,
      display: config.display,
      orientation: config.orientation,
      theme_color: config.theme_color,
      background_color: config.background_color,
      lang: config.language,
      prefer_related_applications: config.prefer_related_applications,
      categories: config.categories,
      icons: [
        {
          src: config.icon_192,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: config.icon_512,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      screenshots: config.screenshots || [],
      shortcuts: config.shortcuts || [],
      related_applications: config.related_applications || []
    };
  }

  // Update manifest in DOM
  updateManifest(config: PWAConfig): void {
    const manifest = this.generateManifest(config);
    const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    // Update manifest link
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestUrl;

    // Update theme-color meta tag
    let themeColorMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = config.theme_color;

    // Update apple-mobile-web-app tags
    this.updateAppleTags(config);
  }

  // Update Apple-specific PWA tags
  private updateAppleTags(config: PWAConfig): void {
    // Apple mobile web app capable
    let appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement;
    if (!appleCapable) {
      appleCapable = document.createElement('meta');
      appleCapable.name = 'apple-mobile-web-app-capable';
      document.head.appendChild(appleCapable);
    }
    appleCapable.content = 'yes';

    // Apple status bar style
    let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
    if (!appleStatusBar) {
      appleStatusBar = document.createElement('meta');
      appleStatusBar.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(appleStatusBar);
    }
    appleStatusBar.content = 'default';

    // Apple touch icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = config.icon_192;
  }

  // Check PWA installation capability
  isPWAInstallable(): boolean {
    return 'serviceWorker' in navigator && window.matchMedia('(display-mode: browser)').matches;
  }

  // Get PWA installation stats (mock)
  async getPWAStats(): Promise<PWAInstallationStats> {
    // Mock data - in real implementation, track these metrics
    return {
      total_installs: 1247,
      daily_installs: 23,
      weekly_installs: 156,
      monthly_installs: 678,
      browsers: {
        'Chrome': 45,
        'Safari': 30,
        'Firefox': 15,
        'Edge': 10
      },
      platforms: {
        'Android': 55,
        'iOS': 35,
        'Desktop': 10
      },
      countries: {
        'Portugal': 60,
        'Brasil': 25,
        'Angola': 10,
        'Outros': 5
      }
    };
  }

  // Install service worker
  async installServiceWorker(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registrado:', registration);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return false;
    }
  }

  // Check service worker status
  async getServiceWorkerStatus(): Promise<'active' | 'installing' | 'waiting' | 'redundant' | 'not-supported'> {
    if (!('serviceWorker' in navigator)) {
      return 'not-supported';
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return 'redundant';
      
      if (registration.active) return 'active';
      if (registration.installing) return 'installing';
      if (registration.waiting) return 'waiting';
      
      return 'redundant';
    } catch (error) {
      console.error('Erro ao verificar Service Worker:', error);
      return 'redundant';
    }
  }

  // Show PWA install prompt
  async showInstallPrompt(): Promise<boolean> {
    try {
      // This would be triggered by the beforeinstallprompt event
      // For now, we'll return true to simulate success
      return true;
    } catch (error) {
      console.error('Erro ao mostrar prompt de instalação:', error);
      return false;
    }
  }

  // Check if PWA is installed
  isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Export PWA configuration
  exportPWAConfig(config: PWAConfig): void {
    const exportData = {
      pwa: config,
      manifest: this.generateManifest(config),
      exported_at: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'kixikila-pwa-config.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Get default PWA configuration
  private getDefaultPWAConfig(): PWAConfig {
    return {
      name: 'KIXIKILA - Poupança Colaborativa',
      short_name: 'Kixikila',
      description: 'A forma mais inteligente de poupar em grupo',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'any',
      theme_color: '#6366f1',
      background_color: '#ffffff',
      icon_192: '/icon-192x192.png',
      icon_512: '/icon-512x512.png',
      categories: ['finance', 'productivity', 'social'],
      language: 'pt-PT',
      prefer_related_applications: false,
      download_popup: {
        enabled: true,
        title: 'Instalar KIXIKILA',
        message: 'Instale o app KIXIKILA para uma melhor experiência e acesso offline.',
        button_text: 'Instalar App',
        show_after_seconds: 5,
        dismissible: true,
        show_once: false,
        theme: 'auto',
        position: 'bottom',
        show_on_pages: ['/', '/dashboard'],
        icons: {
          light: '/icon-192x192.png',
          dark: '/icon-192x192.png'
        },
        animation: 'slide',
        auto_hide_after_seconds: 30
      },
      service_worker_enabled: true,
      offline_enabled: true,
      push_notifications_enabled: true
    };
  }
}

export const pwaService = new PWAService();