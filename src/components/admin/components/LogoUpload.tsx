import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Sun, Moon, X, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoUploadProps {
  logoLight?: string;
  logoDark?: string;
  favicon?: string;
  onLogoLightChange: (url: string) => void;
  onLogoDarkChange: (url: string) => void;
  onFaviconChange: (url: string) => void;
  className?: string;
}

const LogoUpload: React.FC<LogoUploadProps> = ({
  logoLight,
  logoDark,
  favicon,
  onLogoLightChange,
  onLogoDarkChange,
  onFaviconChange,
  className
}) => {
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [isUploading, setIsUploading] = useState({
    logoLight: false,
    logoDark: false,
    favicon: false
  });

  const logoLightRef = useRef<HTMLInputElement>(null);
  const logoDarkRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    file: File,
    type: 'logoLight' | 'logoDark' | 'favicon'
  ) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas ficheiros de imagem.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O ficheiro deve ter menos de 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(prev => ({ ...prev, [type]: true }));

    try {
      // Mock upload - in real implementation, upload to your storage service
      const mockUrl = URL.createObjectURL(file);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      switch (type) {
        case 'logoLight':
          onLogoLightChange(mockUrl);
          break;
        case 'logoDark':
          onLogoDarkChange(mockUrl);
          break;
        case 'favicon':
          onFaviconChange(mockUrl);
          break;
      }

      toast({
        title: "Upload concluído",
        description: `${type === 'logoLight' ? 'Logo claro' : type === 'logoDark' ? 'Logo escuro' : 'Favicon'} carregado com sucesso.`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro de upload",
        description: "Ocorreu um erro ao carregar o ficheiro.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'logoLight' | 'logoDark' | 'favicon'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const removeLogo = (type: 'logoLight' | 'logoDark' | 'favicon') => {
    switch (type) {
      case 'logoLight':
        onLogoLightChange('');
        break;
      case 'logoDark':
        onLogoDarkChange('');
        break;
      case 'favicon':
        onFaviconChange('');
        break;
    }

    toast({
      title: "Imagem removida",
      description: `${type === 'logoLight' ? 'Logo claro' : type === 'logoDark' ? 'Logo escuro' : 'Favicon'} removido com sucesso.`,
      variant: "default"
    });
  };

  const LogoPreviewCard = ({ 
    type, 
    title, 
    icon, 
    url, 
    inputRef, 
    isLoading 
  }: {
    type: 'logoLight' | 'logoDark' | 'favicon';
    title: string;
    icon: React.ReactNode;
    url?: string;
    inputRef: React.RefObject<HTMLInputElement>;
    isLoading: boolean;
  }) => (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Preview Area */}
        <div className={cn(
          "aspect-video border-2 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden",
          url ? "border-green-300 bg-green-50" : "border-gray-300 bg-gray-50",
          type === 'favicon' ? "aspect-square" : "aspect-video"
        )}>
          {url ? (
            <>
              <img 
                src={url} 
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => removeLogo(type)}
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <div className="text-center p-4">
              <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-xs text-gray-500">Nenhuma imagem</p>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="space-y-2">
          <Input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, type)}
            className="hidden"
          />
          
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isLoading ? "A carregar..." : url ? "Substituir" : "Carregar"}
          </Button>

          {type === 'favicon' && (
            <p className="text-xs text-gray-500 text-center">
              Recomendado: 32x32px ou 16x16px
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logos e Imagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preview Mode Toggle */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Switch
                checked={previewMode === 'dark'}
                onCheckedChange={(checked) => setPreviewMode(checked ? 'dark' : 'light')}
              />
              <Label className="flex items-center gap-2">
                {previewMode === 'light' ? (
                  <>
                    <Sun className="w-4 h-4" />
                    Modo Claro
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4" />
                    Modo Escuro
                  </>
                )}
              </Label>
            </div>
          </div>

          {/* Live Preview */}
          <Card className={cn(
            "p-6 transition-colors",
            previewMode === 'dark' ? "bg-gray-900" : "bg-white"
          )}>
            <div className="text-center">
              <div className="mb-4">
                <img 
                  src={previewMode === 'light' ? logoLight : logoDark || logoLight}
                  alt="Logo Preview"
                  className="h-12 mx-auto object-contain"
                  style={{ display: (previewMode === 'light' ? logoLight : logoDark || logoLight) ? 'block' : 'none' }}
                />
                {!(previewMode === 'light' ? logoLight : logoDark || logoLight) && (
                  <div className={cn(
                    "h-12 flex items-center justify-center",
                    previewMode === 'dark' ? "text-white" : "text-gray-900"
                  )}>
                    <span className="font-bold text-xl">KIXIKILA</span>
                  </div>
                )}
              </div>
              <p className={cn(
                "text-sm",
                previewMode === 'dark' ? "text-gray-300" : "text-gray-600"
              )}>
                Pré-visualização do logo no {previewMode === 'light' ? 'modo claro' : 'modo escuro'}
              </p>
            </div>
          </Card>

          {/* Upload Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LogoPreviewCard
              type="logoLight"
              title="Logo Claro"
              icon={<Sun className="w-4 h-4" />}
              url={logoLight}
              inputRef={logoLightRef}
              isLoading={isUploading.logoLight}
            />

            <LogoPreviewCard
              type="logoDark"
              title="Logo Escuro"
              icon={<Moon className="w-4 h-4" />}
              url={logoDark}
              inputRef={logoDarkRef}
              isLoading={isUploading.logoDark}
            />

            <LogoPreviewCard
              type="favicon"
              title="Favicon"
              icon={<Image className="w-4 h-4" />}
              url={favicon}
              inputRef={faviconRef}
              isLoading={isUploading.favicon}
            />
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Logo Claro:</strong> Usado em fundos claros</li>
              <li>• <strong>Logo Escuro:</strong> Usado em fundos escuros</li>
              <li>• <strong>Favicon:</strong> Ícone pequeno mostrado no browser</li>
              <li>• Formatos suportados: PNG, JPG, SVG</li>
              <li>• Tamanho máximo: 5MB por ficheiro</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LogoUpload;