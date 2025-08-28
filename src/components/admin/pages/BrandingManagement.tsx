import React, { useState } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import LogoUpload from '@/components/admin/components/LogoUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Palette, Save, RotateCcw, Eye } from 'lucide-react';

const BrandingManagement: React.FC = () => {
  const { brandingConfig, updateBranding } = useAdminStore();
  const { toast } = useToast();
  const [editedConfig, setEditedConfig] = useState({ 
    ...brandingConfig,
    logoLight: brandingConfig.logo,
    logoDark: null,
    favicon: brandingConfig.favicon 
  });

  const handleSave = () => {
    updateBranding({
      ...editedConfig,
      logo: editedConfig.logoLight
    });
    toast({
      title: "Branding atualizado",
      description: "As configurações de marca foram guardadas com sucesso.",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Branding</h2>
          <p className="text-gray-600">Personalize a identidade visual da plataforma</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Guardar Alterações
        </Button>
      </div>

      {/* Logo Upload Component */}
      <LogoUpload
        logoLight={editedConfig.logoLight || ''}
        logoDark={editedConfig.logoDark || ''}
        favicon={editedConfig.favicon || ''}
        onLogoLightChange={(url) => setEditedConfig({...editedConfig, logoLight: url})}
        onLogoDarkChange={(url) => setEditedConfig({...editedConfig, logoDark: url})}
        onFaviconChange={(url) => setEditedConfig({...editedConfig, favicon: url})}
      />

      {/* Platform Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Informações da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome da Plataforma</label>
              <Input
                value={editedConfig.platformName}
                onChange={(e) => setEditedConfig({...editedConfig, platformName: e.target.value})}
                placeholder="KIXIKILA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cor Primária</label>
              <Input
                type="color"
                value={editedConfig.primaryColor}
                onChange={(e) => setEditedConfig({...editedConfig, primaryColor: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <Textarea
              value={editedConfig.platformDescription}
              onChange={(e) => setEditedConfig({...editedConfig, platformDescription: e.target.value})}
              placeholder="A forma mais inteligente de poupar em grupo"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandingManagement;