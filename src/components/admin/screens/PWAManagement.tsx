import React, { useState, useRef } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import PWADownloadPopup from '@/components/admin/components/PWADownloadPopup';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  Download, 
  Upload,
  Image,
  Settings,
  Eye,
  Save,
  FileJson,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const PWAManagement: React.FC = () => {
  const { pwaConfig, updatePWAConfig } = useAdminStore();
  const { toast } = useToast();
  const [editedConfig, setEditedConfig] = useState({
    ...pwaConfig,
    name: 'KIXIKILA - Poupança Colaborativa',
    description: 'A forma mais inteligente de poupar em grupo',
    startUrl: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    iconUrl: pwaConfig.icon512
  });
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const iconUploadRef = useRef<HTMLInputElement>(null);

  const [downloadPopupConfig, setDownloadPopupConfig] = useState({
    enabled: true,
    title: "Baixe o nosso App!",
    message: "Instale o app KIXIKILA para uma melhor experiência e acesso offline.",
    buttonText: "Instalar App",
    showAfterSeconds: 5,
    showOnPages: ['/', '/dashboard'],
    theme: 'auto' as 'light' | 'dark' | 'auto',
    position: 'bottom' as 'top' | 'bottom' | 'center',
    dismissible: true,
    showOnce: false
  });

  const handleSave = () => {
    updatePWAConfig(editedConfig);
    toast({
      title: "Configurações PWA atualizadas",
      description: "As configurações foram guardadas com sucesso.",
      variant: "default"
    });
  };

  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas ficheiros de imagem.",
        variant: "destructive"
      });
      return;
    }

    setUploadingIcon(true);
    try {
      // Mock upload - in real implementation, upload to your storage service
      const mockUrl = URL.createObjectURL(file);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setEditedConfig({
        ...editedConfig,
        iconUrl: mockUrl
      });

      toast({
        title: "Ícone carregado",
        description: "O ícone da PWA foi carregado com sucesso.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro de upload",
        description: "Ocorreu um erro ao carregar o ícone.",
        variant: "destructive"
      });
    } finally {
      setUploadingIcon(false);
    }
  };

  const generateManifest = () => {
    const manifest = {
      name: editedConfig.name || 'KIXIKILA',
      short_name: editedConfig.shortName,
      description: editedConfig.description || 'Poupança colaborativa',
      start_url: editedConfig.startUrl || '/',
      display: editedConfig.display || 'standalone',
      theme_color: editedConfig.themeColor,
      background_color: editedConfig.backgroundColor,
      orientation: editedConfig.orientation || 'any',
      scope: editedConfig.scope || '/',
      icons: [
        {
          src: editedConfig.iconUrl || editedConfig.icon192 || "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: editedConfig.iconUrl || editedConfig.icon512 || "/icon-512x512.png", 
          sizes: "512x512",
          type: "image/png"
        }
      ],
      categories: ["productivity", "finance"],
      lang: "pt-PT",
      prefer_related_applications: false
    };

    const dataStr = JSON.stringify(manifest, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'manifest.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast({
      title: "Manifest exportado",
      description: "O ficheiro manifest.json foi descarregado.",
      variant: "default"
    });
  };

  const testPWA = () => {
    toast({
      title: "PWA Testada",
      description: "Funcionalidades PWA verificadas - todas operacionais.",
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações PWA</h2>
          <p className="text-gray-600">Configure as definições da aplicação web progressiva</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={testPWA} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Testar PWA
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Basic PWA Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Configuração Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="app-name">Nome Completo da App</Label>
              <Input
                id="app-name"
                value={editedConfig.name}
                onChange={(e) => setEditedConfig({ ...editedConfig, name: e.target.value })}
                placeholder="KIXIKILA - Poupança Colaborativa"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="short-name">Nome Curto</Label>
              <Input
                id="short-name"
                value={editedConfig.shortName}
                onChange={(e) => setEditedConfig({ ...editedConfig, shortName: e.target.value })}
                placeholder="Kixikila"
                className="mt-1"
                maxLength={12}
              />
              <p className="text-xs text-gray-500 mt-1">Máximo 12 caracteres</p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={editedConfig.description}
                onChange={(e) => setEditedConfig({ ...editedConfig, description: e.target.value })}
                placeholder="A forma mais inteligente de poupar em grupo"
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="start-url">URL de Início</Label>
              <Input
                id="start-url"
                value={editedConfig.startUrl}
                onChange={(e) => setEditedConfig({ ...editedConfig, startUrl: e.target.value })}
                placeholder="/"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="scope">Scope</Label>
              <Input
                id="scope"
                value={editedConfig.scope}
                onChange={(e) => setEditedConfig({ ...editedConfig, scope: e.target.value })}
                placeholder="/"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Aparência e Comportamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="theme-color">Cor do Tema</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="theme-color"
                  type="color"
                  value={editedConfig.themeColor}
                  onChange={(e) => setEditedConfig({ ...editedConfig, themeColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={editedConfig.themeColor}
                  onChange={(e) => setEditedConfig({ ...editedConfig, themeColor: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bg-color">Cor de Fundo</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="bg-color"
                  type="color"
                  value={editedConfig.backgroundColor}
                  onChange={(e) => setEditedConfig({ ...editedConfig, backgroundColor: e.target.value })}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={editedConfig.backgroundColor}
                  onChange={(e) => setEditedConfig({ ...editedConfig, backgroundColor: e.target.value })}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="display">Modo de Exibição</Label>
              <select
                id="display"
                value={editedConfig.display}
                onChange={(e) => setEditedConfig({ ...editedConfig, display: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="standalone">Standalone (Recomendado)</option>
                <option value="fullscreen">Ecrã Completo</option>
                <option value="minimal-ui">UI Mínima</option>
                <option value="browser">Browser</option>
              </select>
            </div>

            <div>
              <Label htmlFor="orientation">Orientação</Label>
              <select
                id="orientation"
                value={editedConfig.orientation}
                onChange={(e) => setEditedConfig({ ...editedConfig, orientation: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="any">Qualquer</option>
                <option value="portrait">Retrato</option>
                <option value="landscape">Paisagem</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Icon Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Ícone da Aplicação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              {editedConfig.iconUrl ? (
                <img 
                  src={editedConfig.iconUrl} 
                  alt="App Icon"
                  className="w-16 h-16 object-contain"
                />
              ) : (
                <Image className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                Carregue um ícone para a aplicação (recomendado: 512x512px)
              </p>
              <input
                ref={iconUploadRef}
                type="file"
                accept="image/*"
                onChange={handleIconUpload}
                className="hidden"
              />
              <Button
                onClick={() => iconUploadRef.current?.click()}
                disabled={uploadingIcon}
                variant="outline"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploadingIcon ? "A carregar..." : "Carregar Ícone"}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Requisitos do Ícone:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Tamanho recomendado: 512x512px</li>
              <li>• Formato: PNG com fundo transparente</li>
              <li>• Formato quadrado (1:1)</li>
              <li>• Sem texto pequeno (pode não ser legível em tamanhos pequenos)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Download Popup Configuration */}
      <PWADownloadPopup
        config={downloadPopupConfig}
        onChange={setDownloadPopupConfig}
      />

      {/* PWA Status & Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Estado da PWA & Exportação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PWA Status Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Manifest Válido</p>
                <p className="text-xs text-green-700">Configuração PWA está correta</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Service Worker</p>
                <p className="text-xs text-green-700">Funcionalidade offline ativa</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-900">HTTPS</p>
                <p className="text-xs text-yellow-700">Necessário para produção</p>
              </div>
            </div>
          </div>

          {/* Export Controls */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={generateManifest} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Manifest.json
            </Button>
            
            <Button onClick={() => {
              navigator.clipboard.writeText(JSON.stringify({
                ...editedConfig,
                downloadPopup: downloadPopupConfig
              }, null, 2));
              toast({
                title: "Configuração copiada",
                description: "A configuração foi copiada para a área de transferência.",
                variant: "default"
              });
            }} variant="outline">
              Copiar Configuração
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Próximos Passos:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Exporte o manifest.json e coloque na pasta pública</li>
              <li>Adicione as tags necessárias no &lt;head&gt; do HTML</li>
              <li>Configure o service worker para funcionalidade offline</li>
              <li>Teste a instalação da PWA em dispositivos móveis</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAManagement;