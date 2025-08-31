import React from 'react';
import { CheckCircle, Clock, XCircle, ArrowLeft, RefreshCw, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useKycProcess, KycStatus } from '@/hooks/useKycProcess';

interface KycStatusScreenProps {
  onBack: () => void;
  onRetry?: () => void;
}

const KycStatusScreen = ({ onBack, onRetry }: KycStatusScreenProps) => {
  const { kycData, resetKyc } = useKycProcess();
  
  const getStatusInfo = (status: KycStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          title: 'Análise em Progresso',
          description: 'Os teus documentos estão a ser analisados pela nossa equipa.',
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          badge: 'Em Análise'
        };
      case 'in_review':
        return {
          icon: RefreshCw,
          title: 'Revisão Manual',
          description: 'A tua submissão está numa revisão mais detalhada. Isto pode demorar até 24 horas.',
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          borderColor: 'border-primary/20',
          badge: 'Em Revisão'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          title: 'Verificação Aprovada!',
          description: 'Parabéns! A tua identidade foi verificada com sucesso.',
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          badge: 'Aprovado'
        };
      case 'rejected':
        return {
          icon: XCircle,
          title: 'Verificação Rejeitada',
          description: 'Não foi possível verificar os teus documentos. Verifica os detalhes abaixo.',
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
          badge: 'Rejeitado'
        };
      default:
        return {
          icon: Clock,
          title: 'Estado Desconhecido',
          description: 'Não foi possível determinar o estado da verificação.',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/10',
          borderColor: 'border-muted/20',
          badge: 'Pendente'
        };
    }
  };

  const statusInfo = getStatusInfo(kycData.status);
  const StatusIcon = statusInfo.icon;

  const getTimelineProgress = () => {
    switch (kycData.status) {
      case 'pending':
        return 25;
      case 'in_review':
        return 50;
      case 'approved':
        return 100;
      case 'rejected':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary px-6 py-4 text-primary-foreground">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold">Estado da Verificação</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Card */}
        <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 ${statusInfo.bgColor} rounded-2xl flex items-center justify-center`}>
                <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-lg font-bold">{statusInfo.title}</h2>
                  <Badge variant="outline" className={`${statusInfo.color} border-current`}>
                    {statusInfo.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {statusInfo.description}
                </p>
                
                {kycData.status !== 'approved' && kycData.status !== 'rejected' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{getTimelineProgress()}%</span>
                    </div>
                    <Progress value={getTimelineProgress()} />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico da Verificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {kycData.submittedAt && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Documentos Submetidos</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(kycData.submittedAt).toLocaleString('pt-PT')}
                    </p>
                  </div>
                </div>
              )}
              
              {kycData.reviewedAt && (
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    kycData.status === 'approved' ? 'bg-success' : 'bg-destructive'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {kycData.status === 'approved' ? 'Verificação Aprovada' : 'Verificação Rejeitada'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(kycData.reviewedAt).toLocaleString('pt-PT')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rejection Details */}
        {kycData.status === 'rejected' && kycData.rejectionReason && (
          <Card className="bg-destructive/5 border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-destructive mb-2">Motivo da Rejeição</h3>
                  <p className="text-sm text-destructive/80 mb-4">
                    {kycData.rejectionReason}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetKyc();
                        onRetry?.();
                      }}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Benefits Card (for approved status) */}
        {kycData.status === 'approved' && (
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-success mb-3">Benefícios Desbloqueados</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Limites de transação aumentados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Acesso a grupos premium</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Conta totalmente verificada</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack}>
            Voltar ao Início
          </Button>
          
          {(kycData.status === 'pending' || kycData.status === 'in_review') && (
            <Button 
              variant="ghost" 
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KycStatusScreen;