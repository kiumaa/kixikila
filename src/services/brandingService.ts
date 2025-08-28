import { supabase } from '@/integrations/supabase/client';

export interface BrandingConfig {
  id?: string;
  platform_name: string;
  platform_description: string;
  logo_light?: string;
  logo_dark?: string;
  favicon?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_primary: string;
  text_secondary: string;
  font_family: string;
  font_size_base: number;
  border_radius: number;
  shadow_color: string;
  gradient_primary?: string;
  gradient_secondary?: string;
  custom_css?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_card_type: string;
  twitter_site?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_card_type: string;
  twitter_site: string;
  canonical_url?: string;
  robots?: string;
  author?: string;
  language: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text_primary: string;
    text_secondary: string;
  };
  gradients: {
    primary: string;
    secondary: string;
  };
}

class BrandingService {
  // Get current branding configuration
  async getBrandingConfig(): Promise<BrandingConfig | null> {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('config_value')
        .eq('config_key', 'branding')
        .eq('config_type', 'branding')
        .single();

      if (error) {
        console.error('Error fetching branding config:', error);
        return this.getDefaultBrandingConfig();
      }

      return data?.config_value ? (data.config_value as unknown as BrandingConfig) : this.getDefaultBrandingConfig();
    } catch (error) {
      console.error('Error in getBrandingConfig:', error);
      return this.getDefaultBrandingConfig();
    }
  }

  // Update branding configuration
  async updateBrandingConfig(config: Partial<BrandingConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getBrandingConfig();
      const updatedConfig = { ...currentConfig, ...config, updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          config_key: 'branding',
          config_type: 'branding',
          config_value: updatedConfig,
          description: 'Configuração de branding e identidade visual da plataforma'
        });

      if (error) {
        console.error('Error updating branding config:', error);
        return false;
      }

      // Apply theme changes immediately
      this.applyThemeToDOM(updatedConfig);
      
      return true;
    } catch (error) {
      console.error('Error in updateBrandingConfig:', error);
      return false;
    }
  }

  // Upload file to storage (mock implementation)
  async uploadFile(file: File, type: 'logo_light' | 'logo_dark' | 'favicon' | 'og_image'): Promise<string | null> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Apenas ficheiros de imagem são permitidos');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('O ficheiro deve ter menos de 5MB');
      }

      // Mock upload - in real implementation, use Supabase Storage
      const mockUrl = URL.createObjectURL(file);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return mockUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  }

  // Apply theme to DOM in real-time
  applyThemeToDOM(config: BrandingConfig): void {
    const root = document.documentElement;
    
    root.style.setProperty('--color-primary', config.primary_color);
    root.style.setProperty('--color-secondary', config.secondary_color);
    root.style.setProperty('--color-accent', config.accent_color);
    root.style.setProperty('--color-background', config.background_color);
    root.style.setProperty('--color-text-primary', config.text_primary);
    root.style.setProperty('--color-text-secondary', config.text_secondary);
    root.style.setProperty('--font-family-base', config.font_family);
    root.style.setProperty('--font-size-base', `${config.font_size_base}px`);
    root.style.setProperty('--border-radius-base', `${config.border_radius}px`);
    
    if (config.gradient_primary) {
      root.style.setProperty('--gradient-primary', config.gradient_primary);
    }
    
    if (config.gradient_secondary) {
      root.style.setProperty('--gradient-secondary', config.gradient_secondary);
    }

    // Update favicon if exists
    if (config.favicon) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = config.favicon;
      }
    }

    // Update page title if exists
    if (config.platform_name) {
      document.title = config.platform_name;
    }
  }

  // Get SEO configuration
  async getSEOConfig(): Promise<SEOConfig | null> {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('config_value')
        .eq('config_key', 'seo')
        .eq('config_type', 'seo')
        .single();

      if (error) {
        console.error('Error fetching SEO config:', error);
        return this.getDefaultSEOConfig();
      }

      return data?.config_value ? (data.config_value as unknown as SEOConfig) : this.getDefaultSEOConfig();
    } catch (error) {
      console.error('Error in getSEOConfig:', error);
      return this.getDefaultSEOConfig();
    }
  }

  // Update SEO configuration
  async updateSEOConfig(config: Partial<SEOConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getSEOConfig();
      const updatedConfig = { ...currentConfig, ...config };

      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          config_key: 'seo',
          config_type: 'seo',
          config_value: updatedConfig,
          description: 'Configuração de SEO e metadados da plataforma'
        });

      if (error) {
        console.error('Error updating SEO config:', error);
        return false;
      }

      // Apply SEO changes to DOM
      this.applySEOToDOM(updatedConfig);
      
      return true;
    } catch (error) {
      console.error('Error in updateSEOConfig:', error);
      return false;
    }
  }

  // Apply SEO to DOM
  applySEOToDOM(config: SEOConfig): void {
    // Update title
    document.title = config.title;

    // Update or create meta tags
    this.updateMetaTag('description', config.description);
    this.updateMetaTag('keywords', config.keywords);
    this.updateMetaTag('author', config.author || 'KIXIKILA');
    this.updateMetaTag('robots', config.robots || 'index,follow');
    
    // Open Graph tags
    this.updateMetaTag('og:title', config.og_title, 'property');
    this.updateMetaTag('og:description', config.og_description, 'property');
    this.updateMetaTag('og:image', config.og_image, 'property');
    this.updateMetaTag('og:type', 'website', 'property');
    
    // Twitter tags
    this.updateMetaTag('twitter:card', config.twitter_card_type, 'name');
    this.updateMetaTag('twitter:site', config.twitter_site, 'name');
    this.updateMetaTag('twitter:title', config.og_title, 'name');
    this.updateMetaTag('twitter:description', config.og_description, 'name');
    this.updateMetaTag('twitter:image', config.og_image, 'name');

    // Canonical URL
    if (config.canonical_url) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = config.canonical_url;
    }
  }

  private updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name'): void {
    if (!content) return;
    
    let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }
    meta.content = content;
  }

  // Get default branding configuration
  private getDefaultBrandingConfig(): BrandingConfig {
    return {
      platform_name: 'KIXIKILA',
      platform_description: 'A forma mais inteligente de poupar em grupo',
      primary_color: '#6366f1',
      secondary_color: '#8b5cf6',
      accent_color: '#06b6d4',
      background_color: '#ffffff',
      text_primary: '#111827',
      text_secondary: '#6b7280',
      font_family: 'Inter, system-ui, sans-serif',
      font_size_base: 16,
      border_radius: 8,
      shadow_color: 'rgba(0, 0, 0, 0.1)',
      gradient_primary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      gradient_secondary: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      twitter_card_type: 'summary_large_image',
      seo_title: 'KIXIKILA - Poupança Colaborativa',
      seo_description: 'A forma mais inteligente de poupar em grupo. Junte-se a grupos de poupança e alcance seus objetivos financeiros.'
    };
  }

  // Get default SEO configuration
  private getDefaultSEOConfig(): SEOConfig {
    return {
      title: 'KIXIKILA - Poupança Colaborativa',
      description: 'A forma mais inteligente de poupar em grupo. Junte-se a grupos de poupança e alcance seus objetivos financeiros.',
      keywords: 'poupança, poupança colaborativa, grupos, fintech, portugal',
      og_title: 'KIXIKILA - Poupança Colaborativa',
      og_description: 'A forma mais inteligente de poupar em grupo. Junte-se a grupos de poupança e alcance seus objetivos financeiros.',
      og_image: 'https://kixikila.pro/og-image.png',
      twitter_card_type: 'summary_large_image',
      twitter_site: '@kixikila',
      language: 'pt-PT',
      robots: 'index,follow',
      author: 'KIXIKILA'
    };
  }

  // Get predefined theme presets
  getThemePresets(): ThemePreset[] {
    return [
      {
        id: 'default',
        name: 'KIXIKILA Original',
        colors: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          background: '#ffffff',
          text_primary: '#111827',
          text_secondary: '#6b7280'
        },
        gradients: {
          primary: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          secondary: 'linear-gradient(135deg, #06b6d4, #0891b2)'
        }
      },
      {
        id: 'emerald',
        name: 'Emerald Green',
        colors: {
          primary: '#059669',
          secondary: '#0d9488',
          accent: '#0891b2',
          background: '#ffffff',
          text_primary: '#111827',
          text_secondary: '#6b7280'
        },
        gradients: {
          primary: 'linear-gradient(135deg, #059669, #0d9488)',
          secondary: 'linear-gradient(135deg, #0891b2, #0e7490)'
        }
      },
      {
        id: 'sunset',
        name: 'Sunset Orange',
        colors: {
          primary: '#ea580c',
          secondary: '#dc2626',
          accent: '#c2410c',
          background: '#ffffff',
          text_primary: '#111827',
          text_secondary: '#6b7280'
        },
        gradients: {
          primary: 'linear-gradient(135deg, #ea580c, #dc2626)',
          secondary: 'linear-gradient(135deg, #c2410c, #b91c1c)'
        }
      },
      {
        id: 'midnight',
        name: 'Midnight Blue',
        colors: {
          primary: '#1e40af',
          secondary: '#1e3a8a',
          accent: '#3730a3',
          background: '#ffffff',
          text_primary: '#111827',
          text_secondary: '#6b7280'
        },
        gradients: {
          primary: 'linear-gradient(135deg, #1e40af, #1e3a8a)',
          secondary: 'linear-gradient(135deg, #3730a3, #312e81)'
        }
      }
    ];
  }

  // Export branding configuration
  exportBrandingConfig(config: BrandingConfig): void {
    const exportData = {
      branding: config,
      exported_at: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'kixikila-branding-config.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Import branding configuration
  async importBrandingConfig(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (importData.branding) {
        return await this.updateBrandingConfig(importData.branding);
      }
      
      return false;
    } catch (error) {
      console.error('Error importing branding config:', error);
      return false;
    }
  }
}

export const brandingService = new BrandingService();