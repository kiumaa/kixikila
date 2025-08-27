import React, { useState } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Palette, 
  Upload, 
  Eye, 
  Save, 
  RotateCcw,
  Image,
  Type,
  Moon,
  Sun
} from 'lucide-react';

const BrandingManagement: React.FC = () => {
  const { brandingConfig, updateBranding } = useAdminStore();
  const [editedConfig, setEditedConfig] = useState({ ...brandingConfig });
  const [previewMode, setPreviewMode] = useState(false);

  const handleSave = () => {
    updateBranding(editedConfig);
  };

  const handleReset = () => {
    setEditedConfig({ ...brandingConfig });
  };

  const colorPresets = [
    { name: 'Índigo Roxo (Padrão)', primary: 'hsl(239, 84%, 67%)', secondary: 'hsl(262, 83%, 58%)' },
    { name: 'Verde Esmeralda', primary: 'hsl(142, 76%, 36%)', secondary: 'hsl(158, 64%, 52%)' },
    { name: 'Azul Oceano', primary: 'hsl(217, 91%, 60%)', secondary: 'hsl(212, 100%, 46%)' },
    { name: 'Laranja Vibrante', primary: 'hsl(24, 95%, 53%)', secondary: 'hsl(43, 89%, 58%)' },
    { name: 'Rosa Moderno', primary: 'hsl(322, 65%, 55%)', secondary: 'hsl(289, 71%, 52%)' },
    { name: 'Violeta Real', primary: 'hsl(258, 90%, 66%)', secondary: 'hsl(270, 91%, 65%)' }
  ];

  const handleColorPreset = (preset: typeof colorPresets[0]) => {
    setEditedConfig({
      ...editedConfig,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary
    });
  };

  const handleImageUpload = (field: 'logo' | 'favicon') => {
    // Mock file upload - in real implementation, this would handle actual file upload
    const mockImageUrl = `/mock-${field}-${Date.now()}.png`;
    setEditedConfig({
      ...editedConfig,
      [field]: mockImageUrl
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Branding</h2>
          <p className="text-gray-600">
            Personalize a identidade visual da sua plataforma
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {previewMode ? 'Sair do Preview' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reverter
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Alterações
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Logo and Images */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Logótipos e Imagens
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Logo Principal</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {editedConfig.logo ? (
                  <div className="space-y-3">
                    <div className="w-32 h-16 bg-gray-100 rounded-lg mx-auto flex items-center justify-center">
                      <span className="text-sm text-gray-500">Logo Preview</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleImageUpload('logo')}>
                      Alterar Logo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <div>
                      <Button onClick={() => handleImageUpload('logo')}>
                        Carregar Logo
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG ou SVG. Máx 2MB. Dimensões recomendadas: 300x120px
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Favicon Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Favicon</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {editedConfig.favicon ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs">ICO</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleImageUpload('favicon')}>
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button variant="outline" onClick={() => handleImageUpload('favicon')}>
                      Carregar Favicon
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      32x32px, PNG ou ICO
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Cores da Marca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cor Primária</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={editedConfig.primaryColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/) ? 
                      `#${Math.round(parseInt(editedConfig.primaryColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)![3]) * 2.55).toString(16).padStart(2, '0')}${Math.round(parseInt(editedConfig.primaryColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)![2]) * 2.55).toString(16).padStart(2, '0')}${Math.round(parseInt(editedConfig.primaryColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)![1]) * 2.55).toString(16).padStart(2, '0')}` : '#6366f1'}
                    onChange={(e) => {
                      // Convert hex to HSL (simplified)
                      setEditedConfig({
                        ...editedConfig,
                        primaryColor: `hsl(239, 84%, 67%)` // Mock conversion
                      });
                    }}
                    className="w-12 h-10 rounded border"
                  />
                  <Input
                    value={editedConfig.primaryColor}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      primaryColor: e.target.value
                    })}
                    placeholder="hsl(239, 84%, 67%)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cor Secundária</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value="#8b5cf6"
                    onChange={(e) => {
                      setEditedConfig({
                        ...editedConfig,
                        secondaryColor: `hsl(262, 83%, 58%)`
                      });
                    }}
                    className="w-12 h-10 rounded border"
                  />
                  <Input
                    value={editedConfig.secondaryColor}
                    onChange={(e) => setEditedConfig({
                      ...editedConfig,
                      secondaryColor: e.target.value
                    })}
                    placeholder="hsl(262, 83%, 58%)"
                  />
                </div>
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium mb-3">Paletas Predefinidas</label>
              <div className="grid grid-cols-2 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleColorPreset(preset)}
                    className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-1">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: preset.primary.replace('hsl', '').replace('(', '').replace(')', '').split(',').length === 3 ? '#6366f1' : preset.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: preset.secondary.replace('hsl', '').replace('(', '').replace(')', '').split(',').length === 3 ? '#8b5cf6' : preset.secondary }}
                      />
                    </div>
                    <span className="text-xs text-gray-600">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {editedConfig.isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="text-sm font-medium">Modo Escuro por Padrão</span>
              </div>
              <Switch
                checked={editedConfig.isDarkMode}
                onCheckedChange={(checked) => setEditedConfig({
                  ...editedConfig,
                  isDarkMode: checked
                })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Platform Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Informações da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome da Plataforma</label>
              <Input
                value={editedConfig.platformName}
                onChange={(e) => setEditedConfig({
                  ...editedConfig,
                  platformName: e.target.value
                })}
                placeholder="KIXIKILA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <Input
                value={editedConfig.platformDescription}
                onChange={(e) => setEditedConfig({
                  ...editedConfig,
                  platformDescription: e.target.value
                })}
                placeholder="A forma mais inteligente de poupar em grupo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Texto de Boas-vindas</label>
              <Textarea
                value={editedConfig.welcomeText}
                onChange={(e) => setEditedConfig({
                  ...editedConfig,
                  welcomeText: e.target.value
                })}
                placeholder="Bem-vindo à plataforma..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Legal Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos Legais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Termos e Condições</label>
              <Textarea
                value={editedConfig.termsAndConditions}
                onChange={(e) => setEditedConfig({
                  ...editedConfig,
                  termsAndConditions: e.target.value
                })}
                placeholder="Termos e condições da plataforma..."
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Política de Privacidade</label>
              <Textarea
                value={editedConfig.privacyPolicy}
                onChange={(e) => setEditedConfig({
                  ...editedConfig,
                  privacyPolicy: e.target.value
                })}
                placeholder="Política de privacidade..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {previewMode && (
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <CardTitle>Preview da Aplicação</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="border rounded-lg p-6 bg-gradient-to-r"
              style={{
                background: `linear-gradient(135deg, ${editedConfig.primaryColor}, ${editedConfig.secondaryColor})`
              }}
            >
              <div className="text-white text-center">
                <h1 className="text-2xl font-bold mb-2">{editedConfig.platformName}</h1>
                <p className="text-white/90 mb-4">{editedConfig.platformDescription}</p>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-sm">{editedConfig.welcomeText}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BrandingManagement;