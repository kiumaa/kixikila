import React, { useRef, useState } from 'react';
import { Camera, User, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useKycProcess } from '@/hooks/useKycProcess';
import { useToast } from '@/hooks/use-toast';

const FaceVerificationStep = () => {
  const { kycData, updateSelfie } = useKycProcess();
  const [isCapturing, setIsCapturing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isOptional = kycData.level === 'basic' || kycData.level === 'standard';

  const handleSelfieCapture = async (file: File) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Formato inválido",
        description: "Por favor, envia apenas imagens (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast({
        title: "Ficheiro muito grande",
        description: "O ficheiro deve ter menos de 10MB.",
        variant: "destructive"
      });
      return;
    }

    setIsCapturing(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    updateSelfie(file);
    setIsCapturing(false);
    
    toast({
      title: "Selfie capturada!",
      description: "A tua foto foi adicionada com sucesso.",
    });
  };

  const removeSelfie = () => {
    updateSelfie(undefined as any);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <h3 className="font-semibold">Verificação Facial</h3>
          {isOptional && (
            <Badge variant="outline" className="text-xs">
              Opcional
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isOptional 
            ? 'Adiciona uma selfie para aumentar a segurança da tua conta.'
            : 'Para completar a verificação premium, precisamos de uma selfie.'
          }
        </p>
      </div>

      <Card className="relative">
        <div className="p-6">
          {kycData.selfieImage ? (
            <div className="space-y-4">
              <div className="w-full h-48 bg-success/10 rounded-lg border border-success/20 flex items-center justify-center relative">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
                  <p className="text-sm text-success font-medium">Selfie capturada</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kycData.selfieImage.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeSelfie}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => inputRef.current?.click()}
                disabled={isCapturing}
              >
                <Camera className="w-4 h-4 mr-2" />
                Capturar Nova Selfie
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">Captura a tua selfie</p>
                  <p className="text-xs text-muted-foreground">
                    Olha diretamente para a câmara
                  </p>
                </div>
              </div>
              
              <Button
                className="w-full"
                onClick={() => inputRef.current?.click()}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    A processar...
                  </div>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Capturar Selfie
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-3">
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-primary mb-1">Instruções para selfie</p>
              <ul className="text-xs text-primary/80 space-y-1">
                <li>• Olha diretamente para a câmara</li>
                <li>• Remove óculos de sol ou chapéu</li>
                <li>• Certifica-te de que o rosto está bem iluminado</li>
                <li>• Evita sombras na cara</li>
              </ul>
            </div>
          </div>
        </div>

        {isOptional && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium mb-1">Passo Opcional</p>
                <p className="text-xs text-muted-foreground">
                  Podes saltar este passo e continuar. A selfie pode ser adicionada mais tarde para aumentar a segurança.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleSelfieCapture(file);
        }}
      />
    </div>
  );
};

export default FaceVerificationStep;