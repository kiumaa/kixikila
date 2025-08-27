import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  Download, 
  Eye, 
  Settings, 
  Palette,
  Clock,
  X,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PWADownloadPopupProps {
  config: {
    enabled: boolean;
    title: string;
    message: string;
    buttonText: string;
    showAfterSeconds: number;
    showOnPages: string[];
    theme: 'light' | 'dark' | 'auto';
    position: 'top' | 'bottom' | 'center';
    dismissible: boolean;
    showOnce: boolean;
  };
  onChange: (config: any) => void;
  className?: string;
}

const PWADownloadPopup: React.FC<PWADownloadPopupProps> = ({
  config,
  onChange,
  className
}) => {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  const handleConfigChange = (key: string, value: any) => {
    onChange({
      ...config,
      [key]: value
    });
  };

  const handleArrayChange = (value: string, action: 'add' | 'remove') => {
    const pages = config.showOnPages || [];
    if (action === 'add' && value && !pages.includes(value)) {
      handleConfigChange('showOnPages', [...pages, value]);
    } else if (action === 'remove') {
      handleConfigChange('showOnPages', pages.filter(page => page !== value));
    }
  };

  const testPopup = () => {
    setShowPreview(true);
    toast({
      title: "Preview ativo",
      description: "O popup está sendo mostrado no modo de pré-visualização.",
      variant: "default"
    });
  };

  const PopupPreview = () => {
    const themeClasses = {
      light: "bg-white border-gray-200 text-gray-900",
      dark: "bg-gray-900 border-gray-700 text-white"
    };

    const buttonClasses = {
      light: "bg-indigo-600 hover:bg-indigo-700 text-white",
      dark: "bg-indigo-500 hover:bg-indigo-600 text-white"
    };

    return (
      <div className={cn(
        "fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4",
        config.position === 'top' && "items-start pt-20",
        config.position === 'bottom' && "items-end pb-20"
      )}>
        <div className={cn(
          "max-w-sm w-full p-6 rounded-2xl border shadow-2xl animate-in slide-in-from-bottom-4",
          themeClasses[previewTheme]
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{config.title}</h3>
              </div>
            </div>
            {config.dismissible && (
              <button
                onClick={() => setShowPreview(false)}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  previewTheme === 'light' ? "hover:bg-gray-100" : "hover:bg-gray-800"
                )}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className={cn(
            "text-sm mb-6",
            previewTheme === 'light' ? "text-gray-600" : "text-gray-300"
          )}>
            {config.message}
          </p>

          <div className="flex gap-2">
            <Button 
              className={cn("flex-1", buttonClasses[previewTheme])}
              onClick={() => setShowPreview(false)}
            >
              <Download className="w-4 h-4 mr-2" />
              {config.buttonText}
            </Button>
            {config.dismissible && (
              <Button 
                variant="ghost" 
                onClick={() => setShowPreview(false)}
                className={cn(
                  previewTheme === 'light' ? "text-gray-600 hover:bg-gray-100" : "text-gray-300 hover:bg-gray-800"
                )}
              >
                Mais tarde
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Popup "Download the App"
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Settings */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="popup-title">Título do Popup</Label>
              <Input
                id="popup-title"
                value={config.title}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                placeholder="Baixe o nosso App!"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="popup-message">Mensagem</Label>
              <Textarea
                id="popup-message"
                value={config.message}
                onChange={(e) => handleConfigChange('message', e.target.value)}
                placeholder="Instale o app KIXIKILA para uma melhor experiência."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="popup-button">Texto do Botão</Label>
              <Input
                id="popup-button"
                value={config.buttonText}
                onChange={(e) => handleConfigChange('buttonText', e.target.value)}
                placeholder="Instalar App"
                className="mt-1"
              />
            </div>
          </div>

          {/* Behavior Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Comportamento
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="show-after">Mostrar após (segundos)</Label>
                <Input
                  id="show-after"
                  type="number"
                  value={config.showAfterSeconds}
                  onChange={(e) => handleConfigChange('showAfterSeconds', parseInt(e.target.value) || 0)}
                  min="0"
                  max="60"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="position">Posição na Tela</Label>
                <Select value={config.position} onValueChange={(value) => handleConfigChange('position', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Topo</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                    <SelectItem value="bottom">Fundo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.dismissible}
                  onCheckedChange={(checked) => handleConfigChange('dismissible', checked)}
                />
                <Label>Pode ser dispensado</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.showOnce}
                  onCheckedChange={(checked) => handleConfigChange('showOnce', checked)}
                />
                <Label>Mostrar apenas uma vez</Label>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Aparência
            </h4>

            <div>
              <Label>Tema</Label>
              <Select value={config.theme} onValueChange={(value) => handleConfigChange('theme', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pages Configuration */}
          <div className="space-y-4">
            <div>
              <Label>Mostrar nas Páginas</Label>
              <div className="mt-2 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: /, /dashboard, /groups"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleArrayChange(e.currentTarget.value, 'add');
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="Ex: /"]') as HTMLInputElement;
                      if (input?.value) {
                        handleArrayChange(input.value, 'add');
                        input.value = '';
                      }
                    }}
                  >
                    Adicionar
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {config.showOnPages.map((page) => (
                    <Badge key={page} variant="secondary" className="gap-1">
                      {page}
                      <button
                        onClick={() => handleArrayChange(page, 'remove')}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {config.showOnPages.length === 0 && (
                    <span className="text-sm text-gray-500">Nenhuma página configurada (mostra em todas)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Controls */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Pré-visualização
              </h4>
              
              <div className="flex items-center gap-2">
                <Select value={previewTheme} onValueChange={(value) => setPreviewTheme(value as 'light' | 'dark')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  onClick={testPopup}
                  variant="outline"
                  disabled={!config.enabled}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Testar Popup
                </Button>
              </div>
            </div>

            {!config.enabled && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                O popup está desativado. Active para testar a pré-visualização.
              </div>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={cn(
              "w-3 h-3 rounded-full",
              config.enabled ? "bg-green-500 animate-pulse" : "bg-gray-400"
            )} />
            <span className={config.enabled ? "text-green-700" : "text-gray-500"}>
              {config.enabled ? "Popup ativo" : "Popup desativado"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && <PopupPreview />}
    </div>
  );
};

export default PWADownloadPopup;