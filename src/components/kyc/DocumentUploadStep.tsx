import React, { useRef, useState } from 'react';
import { FileText, Upload, Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useKycProcess, DocumentInfo } from '@/hooks/useKycProcess';
import { useToast } from '@/hooks/use-toast';

const DocumentUploadStep = () => {
  const { kycData, updateDocument } = useKycProcess();
  const { document } = kycData;
  const [isUploading, setIsUploading] = useState(false);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const documentTypes = [
    { value: 'id_card', label: 'Cartão de Cidadão', needsBack: true },
    { value: 'passport', label: 'Passaporte', needsBack: false },
    { value: 'driving_license', label: 'Carta de Condução', needsBack: true }
  ];

  const selectedDocType = documentTypes.find(d => d.value === document.type);

  const handleFileUpload = async (file: File, side: 'front' | 'back') => {
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

    setIsUploading(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateDocument({
      [side === 'front' ? 'frontImage' : 'backImage']: file
    });

    setIsUploading(false);
    
    toast({
      title: "Imagem carregada!",
      description: `${side === 'front' ? 'Frente' : 'Verso'} do documento adicionado com sucesso.`,
    });
  };

  const removeImage = (side: 'front' | 'back') => {
    updateDocument({
      [side === 'front' ? 'frontImage' : 'backImage']: undefined
    });
  };

  const ImageUploadCard = ({ 
    side, 
    title, 
    image, 
    inputRef 
  }: { 
    side: 'front' | 'back';
    title: string;
    image?: File;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => (
    <Card className="relative">
      <div className="p-4">
        <h4 className="font-semibold text-sm mb-3">{title}</h4>
        
        {image ? (
          <div className="relative">
            <div className="w-full h-32 bg-success/10 rounded-lg border border-success/20 flex items-center justify-center">
              <div className="text-center">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-sm text-success font-medium">Imagem carregada</p>
                <p className="text-xs text-muted-foreground">{image.name}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
              onClick={() => removeImage(side)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Toca para adicionar
            </p>
          </div>
        )}
        
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Galeria
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            <Camera className="w-4 h-4 mr-2" />
            Câmara
          </Button>
        </div>
        
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, side);
          }}
        />
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Envia fotos claras do teu documento de identificação.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de Documento *</Label>
          <Select
            value={document.type}
            onValueChange={(value: DocumentInfo['type']) => updateDocument({ type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleciona o tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="docNumber">Número do Documento *</Label>
          <Input
            id="docNumber"
            value={document.number}
            onChange={(e) => updateDocument({ number: e.target.value })}
            placeholder={
              document.type === 'id_card' ? '12345678' :
              document.type === 'passport' ? 'P123456' :
              'D1234567'
            }
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiryDate">Data de Validade *</Label>
          <Input
            id="expiryDate"
            type="date"
            value={document.expiryDate}
            onChange={(e) => updateDocument({ expiryDate: e.target.value })}
            min={new Date().toISOString().split('T')[0]}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-4">
        <ImageUploadCard
          side="front"
          title="Frente do Documento *"
          image={document.frontImage}
          inputRef={frontInputRef}
        />
        
        {selectedDocType?.needsBack && (
          <ImageUploadCard
            side="back"
            title="Verso do Documento *"
            image={document.backImage}
            inputRef={backInputRef}
          />
        )}
      </div>

      <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-warning mb-1">Dicas importantes</p>
            <ul className="text-xs text-warning/80 space-y-1">
              <li>• Certifica-te de que o documento está bem iluminado</li>
              <li>• Evita reflexos ou sombras</li>
              <li>• Todos os cantos do documento devem ser visíveis</li>
              <li>• Texto deve estar legível e nítido</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadStep;