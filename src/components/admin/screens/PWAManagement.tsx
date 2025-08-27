import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Download } from 'lucide-react';

const PWAManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações PWA</h2>
        <p className="text-gray-600">Configure as definições da aplicação web progressiva</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Configuração PWA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome Curto</label>
            <Input placeholder="Kixikila" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Cor de Fundo</label>
            <Input placeholder="#ffffff" />
          </div>
          
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar Manifest.json
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAManagement;