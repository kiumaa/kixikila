import React, { useState, useEffect } from 'react';
import LogoUpload from '@/components/admin/components/LogoUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { brandingService, BrandingConfig, SEOConfig, ThemePreset } from '@/services/brandingService';
import { 
  Palette, 
  Save, 
  RotateCcw, 
  Eye, 
  Download, 
  Upload, 
  Search, 
  Globe, 
  Sparkles,
  Copy,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

const BrandingManagement: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const [previewMode, setPreviewMode] = useState(false);
  
  // Branding state
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null);
  const [editedBranding, setEditedBranding] = useState<Partial<BrandingConfig>>({});
  
  // SEO state
  const [seoConfig, setSeoConfig] = useState<SEOConfig | null>(null);
  const [editedSEO, setEditedSEO] = useState<Partial<SEOConfig>>({});

  // Theme presets
  const [themePresets] = useState<ThemePreset[]>(brandingService.getThemePresets());

  // Load configurations on mount
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      const [branding, seo] = await Promise.all([
        brandingService.getBrandingConfig(),
        brandingService.getSEOConfig()
      ]);
      
      setBrandingConfig(branding);
      setEditedBranding(branding || {});
      setSeoConfig(seo);
      setEditedSEO(seo || {});
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    setLoading(true);
    try {
      const success = await brandingService.updateBrandingConfig(editedBranding);
      if (success) {
        setBrandingConfig({ ...brandingConfig, ...editedBranding } as BrandingConfig);
        toast({
          title: "Sucesso",
          description: "Configurações de branding guardadas com sucesso.",
          variant: "default"
        });
      } else {
        throw new Error('Falha ao guardar');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao guardar configurações de branding.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSEO = async () => {
    setLoading(true);
    try {
      const success = await brandingService.updateSEOConfig(editedSEO);
      if (success) {
        setSeoConfig({ ...seoConfig, ...editedSEO } as SEOConfig);
        toast({
          title: "Sucesso",
          description: "Configurações de SEO guardadas com sucesso.",
          variant: "default"
        });
      } else {
        throw new Error('Falha ao guardar');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao guardar configurações de SEO.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyThemePreset = (preset: ThemePreset) => {
    const updatedBranding = {
      ...editedBranding,
      primary_color: preset.colors.primary,
      secondary_color: preset.colors.secondary,
      accent_color: preset.colors.accent,
      background_color: preset.colors.background,
      text_primary: preset.colors.text_primary,
      text_secondary: preset.colors.text_secondary,
      gradient_primary: preset.gradients.primary,
      gradient_secondary: preset.gradients.secondary
    };
    
    setEditedBranding(updatedBranding);
    
    // Apply preview
    if (previewMode) {
      brandingService.applyThemeToDOM(updatedBranding as BrandingConfig);
    }

    toast({
      title: "Tema aplicado",
      description: `Tema "${preset.name}" aplicado com sucesso.`,
      variant: "default"
    });
  };

  const togglePreview = () => {
    const newPreviewMode = !previewMode;
    setPreviewMode(newPreviewMode);
    
    if (newPreviewMode && editedBranding) {
      brandingService.applyThemeToDOM(editedBranding as BrandingConfig);
    } else if (brandingConfig) {
      brandingService.applyThemeToDOM(brandingConfig);
    }
  };

  const handleExportBranding = () => {
    if (brandingConfig) {
      brandingService.exportBrandingConfig(brandingConfig);
      toast({
        title: "Exportado",
        description: "Configuração exportada com sucesso.",
        variant: "default"
      });
    }
  };

  if (loading && !brandingConfig) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Identidade Visual</h2>
          <p className="text-gray-600">Personalize a identidade visual e SEO da plataforma</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={togglePreview} variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Parar Preview' : 'Preview Live'}
          </Button>
          <Button onClick={handleExportBranding} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={activeTab === 'branding' ? handleSaveBranding : handleSaveSEO} 
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'A guardar...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Preview Mode Indicator */}
      {previewMode && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Modo de Preview Ativo</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                As alterações são aplicadas em tempo real
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding & Tema
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            SEO & Metadados
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          {/* Logo Upload */}
          <LogoUpload
            logoLight={editedBranding.logo_light || ''}
            logoDark={editedBranding.logo_dark || ''}
            favicon={editedBranding.favicon || ''}
            onLogoLightChange={(url) => setEditedBranding({...editedBranding, logo_light: url})}
            onLogoDarkChange={(url) => setEditedBranding({...editedBranding, logo_dark: url})}
            onFaviconChange={(url) => setEditedBranding({...editedBranding, favicon: url})}
          />

          {/* Platform Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Informações da Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platform-name">Nome da Plataforma</Label>
                  <Input
                    id="platform-name"
                    value={editedBranding.platform_name || ''}
                    onChange={(e) => setEditedBranding({...editedBranding, platform_name: e.target.value})}
                    placeholder="KIXIKILA"
                  />
                </div>
                <div>
                  <Label htmlFor="font-family">Fonte Principal</Label>
                  <Select
                    value={editedBranding.font_family || 'Inter, sans-serif'}
                    onValueChange={(value) => setEditedBranding({...editedBranding, font_family: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                      <SelectItem value="Roboto, sans-serif">Roboto</SelectItem>
                      <SelectItem value="Open Sans, sans-serif">Open Sans</SelectItem>
                      <SelectItem value="Poppins, sans-serif">Poppins</SelectItem>
                      <SelectItem value="Montserrat, sans-serif">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="platform-description">Descrição</Label>
                <Textarea
                  id="platform-description"
                  value={editedBranding.platform_description || ''}
                  onChange={(e) => setEditedBranding({...editedBranding, platform_description: e.target.value})}
                  placeholder="A forma mais inteligente de poupar em grupo"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Temas Predefinidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {themePresets.map((preset) => (
                  <Card 
                    key={preset.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => applyThemePreset(preset)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-center">{preset.name}</h4>
                        <div className="flex gap-1 justify-center">
                          {Object.values(preset.colors).slice(0, 4).map((color, idx) => (
                            <div 
                              key={idx}
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          Aplicar Tema
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Palette */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Paleta de Cores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="primary-color">Primária</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={editedBranding.primary_color || '#6366f1'}
                      onChange={(e) => setEditedBranding({...editedBranding, primary_color: e.target.value})}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={editedBranding.primary_color || '#6366f1'}
                      onChange={(e) => setEditedBranding({...editedBranding, primary_color: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary-color">Secundária</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={editedBranding.secondary_color || '#8b5cf6'}
                      onChange={(e) => setEditedBranding({...editedBranding, secondary_color: e.target.value})}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={editedBranding.secondary_color || '#8b5cf6'}
                      onChange={(e) => setEditedBranding({...editedBranding, secondary_color: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accent-color">Destaque</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={editedBranding.accent_color || '#06b6d4'}
                      onChange={(e) => setEditedBranding({...editedBranding, accent_color: e.target.value})}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={editedBranding.accent_color || '#06b6d4'}
                      onChange={(e) => setEditedBranding({...editedBranding, accent_color: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="background-color">Fundo</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={editedBranding.background_color || '#ffffff'}
                      onChange={(e) => setEditedBranding({...editedBranding, background_color: e.target.value})}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={editedBranding.background_color || '#ffffff'}
                      onChange={(e) => setEditedBranding({...editedBranding, background_color: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Tipografia Avançada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="font-size">Tamanho Base (px)</Label>
                  <Input
                    id="font-size"
                    type="number"
                    min="12"
                    max="20"
                    value={editedBranding.font_size_base || 16}
                    onChange={(e) => setEditedBranding({...editedBranding, font_size_base: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="border-radius">Arredondamento (px)</Label>
                  <Input
                    id="border-radius"
                    type="number"
                    min="0"
                    max="24"
                    value={editedBranding.border_radius || 8}
                    onChange={(e) => setEditedBranding({...editedBranding, border_radius: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="text-primary">Texto Primário</Label>
                  <Input
                    id="text-primary"
                    type="color"
                    value={editedBranding.text_primary || '#111827'}
                    onChange={(e) => setEditedBranding({...editedBranding, text_primary: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          {/* Basic SEO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                SEO Básico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seo-title">Título (SEO Title)</Label>
                <Input
                  id="seo-title"
                  value={editedSEO.title || ''}
                  onChange={(e) => setEditedSEO({...editedSEO, title: e.target.value})}
                  placeholder="KIXIKILA - Poupança Colaborativa"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(editedSEO.title || '').length}/60 caracteres
                </p>
              </div>
              <div>
                <Label htmlFor="seo-description">Descrição (Meta Description)</Label>
                <Textarea
                  id="seo-description"
                  value={editedSEO.description || ''}
                  onChange={(e) => setEditedSEO({...editedSEO, description: e.target.value})}
                  placeholder="A forma mais inteligente de poupar em grupo. Junte-se a grupos de poupança e alcance seus objetivos financeiros."
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(editedSEO.description || '').length}/160 caracteres
                </p>
              </div>
              <div>
                <Label htmlFor="seo-keywords">Palavras-chave</Label>
                <Input
                  id="seo-keywords"
                  value={editedSEO.keywords || ''}
                  onChange={(e) => setEditedSEO({...editedSEO, keywords: e.target.value})}
                  placeholder="poupança, grupos, fintech, portugal"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separe as palavras-chave com vírgulas
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Open Graph */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Open Graph (Redes Sociais)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="og-title">Título (OG Title)</Label>
                <Input
                  id="og-title"
                  value={editedSEO.og_title || ''}
                  onChange={(e) => setEditedSEO({...editedSEO, og_title: e.target.value})}
                  placeholder="KIXIKILA - A forma mais inteligente de poupar em grupo"
                />
              </div>
              <div>
                <Label htmlFor="og-description">Descrição (OG Description)</Label>
                <Textarea
                  id="og-description"
                  value={editedSEO.og_description || ''}
                  onChange={(e) => setEditedSEO({...editedSEO, og_description: e.target.value})}
                  placeholder="Junte-se a grupos de poupança e alcance seus objetivos financeiros de forma colaborativa e inteligente."
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="og-image">Imagem de Partilha (URL)</Label>
                <Input
                  id="og-image"
                  value={editedSEO.og_image || ''}
                  onChange={(e) => setEditedSEO({...editedSEO, og_image: e.target.value})}
                  placeholder="https://kixikila.pro/og-image.png"
                />
                {editedSEO.og_image && (
                  <div className="mt-2 border rounded-lg p-2 bg-gray-50">
                    <img 
                      src={editedSEO.og_image} 
                      alt="Preview OG" 
                      className="max-w-full h-32 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Twitter Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Twitter Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="twitter-card">Tipo de Card</Label>
                  <Select
                    value={editedSEO.twitter_card_type || 'summary_large_image'}
                    onValueChange={(value) => setEditedSEO({...editedSEO, twitter_card_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="twitter-site">Site Twitter (@)</Label>
                  <Input
                    id="twitter-site"
                    value={editedSEO.twitter_site || ''}
                    onChange={(e) => setEditedSEO({...editedSEO, twitter_site: e.target.value})}
                    placeholder="@kixikila"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrandingManagement;