import React, { useState } from 'react';
import { ArrowLeft, Shield, Upload, Check, AlertTriangle, FileText, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { mockUser, formatCurrency } from '@/data/mockData';

interface KYCScreenProps {
  onBack: () => void;
}

export const KYCScreen: React.FC<KYCScreenProps> = ({
  onBack
}) => {
  const [documents, setDocuments] = useState({
    idCard: { uploaded: true, status: 'approved', name: 'Cartão de Cidadão.pdf' },
    addressProof: { uploaded: true, status: 'approved', name: 'Comprovativo Morada.pdf' },
    photo: { uploaded: false, status: 'pending', name: null }
  });
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (docType: string) => {
    setIsUploading(true);
    
    // Simulate file upload
    setTimeout(() => {
      setDocuments(prev => ({
        ...prev,
        [docType]: {
          uploaded: true,
          status: 'pending',
          name: `Documento_${Date.now()}.pdf`
        }
      }));
      setIsUploading(false);
      toast({
        title: "Documento carregado",
        description: "O documento foi carregado e está a ser analisado."
      });
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <StatusBadge status="success">Aprovado</StatusBadge>;
      case 'pending':
        return <StatusBadge status="pending">Em análise</StatusBadge>;
      case 'rejected':
        return <StatusBadge status="error">Rejeitado</StatusBadge>;
      default:
        return <StatusBadge status="pending">Pendente</StatusBadge>;
    }
  };

  const documentTypes = [
    {
      key: 'idCard',
      title: 'Documento de Identificação',
      description: 'Cartão de Cidadão, Passaporte ou BI',
      icon: FileText,
      required: true
    },
    {
      key: 'addressProof',
      title: 'Comprovativo de Morada',
      description: 'Conta de serviços ou declaração bancária',
      icon: FileText,
      required: true
    },
    {
      key: 'photo',
      title: 'Fotografia (Selfie)',
      description: 'Foto sua segurando o documento',
      icon: Camera,
      required: false
    }
  ];

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-system text-primary-foreground">
            Verificação KYC
          </h1>
        </div>

        {/* Status Card */}
        <Card className="glass text-primary-foreground border-primary-foreground/20">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold font-system mb-2">
              {mockUser.kycStatus === 'verified' ? 'Verificação Concluída' : 'Verificação Pendente'}
            </h2>
            <p className="text-primary-foreground/80 text-sm mb-4">
              {mockUser.kycStatus === 'verified' 
                ? 'A sua identidade foi verificada com sucesso'
                : 'Complete a verificação para usar todas as funcionalidades'}
            </p>
            {getStatusBadge(mockUser.kycStatus)}
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 space-y-6">
        {/* Why KYC */}
        <Card className="ios-card bg-gradient-to-r from-info-subtle to-info-subtle/50 border-info/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-info" />
              </div>
              <div>
                <h3 className="font-semibold font-system text-info mb-2">
                  Porquê verificar a identidade?
                </h3>
                <ul className="text-sm text-info/80 space-y-1 font-system">
                  <li>• Proteger a sua conta e transações</li>
                  <li>• Cumprir regulamentações financeiras</li>
                  <li>• Prevenir fraudes e atividades suspeitas</li>
                  <li>• Permitir levantamentos superiores a {formatCurrency(500)}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          <h3 className="font-semibold font-system text-foreground">
            Documentos Necessários
          </h3>
          
          {documentTypes.map((docType) => {
            const doc = documents[docType.key as keyof typeof documents];
            return (
              <Card key={docType.key} className="ios-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <docType.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold font-system text-foreground">
                            {docType.title}
                          </h4>
                          {docType.required && (
                            <span className="text-xs text-destructive font-medium">
                              Obrigatório
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground font-system">
                          {docType.description}
                        </p>
                        {doc.name && (
                          <p className="text-xs text-muted-foreground mt-1 font-system">
                            {doc.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(doc.status)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      {doc.uploaded ? (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success" />
                          <span className="text-sm font-system text-success">
                            Documento carregado
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-warning" />
                          <span className="text-sm font-system text-warning">
                            Documento em falta
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handleFileUpload(docType.key)}
                      disabled={isUploading}
                      size="sm"
                      variant={doc.uploaded ? "outline" : "default"}
                      className="ios-button"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'A carregar...' : doc.uploaded ? 'Substituir' : 'Carregar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help */}
        <Card className="ios-card">
          <CardContent className="p-6">
            <h3 className="font-semibold font-system text-foreground mb-3">
              Precisa de ajuda?
            </h3>
            <p className="text-sm text-muted-foreground mb-4 font-system">
              Se tiver dúvidas sobre o processo de verificação, contacte o nosso suporte.
            </p>
            <Button variant="outline" className="ios-button">
              Contactar Suporte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};