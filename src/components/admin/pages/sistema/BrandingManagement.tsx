import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAdminStore } from '@/store/useAdminStore';
import { useToast } from '@/hooks/use-toast';

const BrandingManagement: React.FC = () => {
  const { brandingConfig } = useAdminStore();
  const { toast } = useToast();
  
  const [config, setConfig] = useState({
    platformName: brandingConfig.platformName || 'KIXIKILA',
    primaryColor: brandingConfig.primaryColor || '#6366f1',
    description: 'A forma mais inteligente de poupar em grupo'
  });

  const handleSave = () => {
    toast({
      title: 'Sucesso',
      description: 'Configurações de marca atualizadas com sucesso'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Marca</h2>
          <p className="text-gray-600">
            Configure a identidade visual da plataforma
          </p>
        </div>
        
        <Button onClick={handleSave}>
          Salvar Alterações
        </Button>
      </div>

      {/* Platform Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome da Plataforma</label>
            <Input
              value={config.platformName}
              onChange={(e) => setConfig(prev => ({ ...prev, platformName: e.target.value }))}
              placeholder="Nome da plataforma"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cor Primária</label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={config.primaryColor}
                onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-20"
              />
              <Input
                value={config.primaryColor}
                onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                placeholder="#6366f1"
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <Textarea
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição da plataforma"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandingManagement;