import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useVIPStatus } from '@/hooks/useVIPStatus';
import { CheckCircle, ArrowRight, Crown, Gift, Home } from 'lucide-react';

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isVIP, refreshStatus, loading } = useVIPStatus();
  const [isVerifying, setIsVerifying] = useState(true);

  const sessionId = searchParams.get('session_id');
  const upgrade = searchParams.get('upgrade');

  useEffect(() => {
    const verifyPayment = async () => {
      if (sessionId || upgrade === 'success') {
        // Refresh VIP status to get updated subscription
        await refreshStatus();
        
        // Small delay to allow webhook processing
        setTimeout(() => {
          setIsVerifying(false);
        }, 1500);
      } else {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, upgrade, refreshStatus]);

  const handleContinue = () => {
    if (isVIP) {
      navigate('/app/profile/vip-management');
    } else {
      navigate('/app/wallet');
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mb-6">
            <LoadingSpinner size="lg" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            A verificar pagamento...
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto confirmamos a sua transação
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 text-center">
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          {isVIP && (
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-600" />
            </div>
          )}
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {isVIP ? '🎉 Bem-vindo ao VIP!' : 'Pagamento Confirmado!'}
        </h1>
        
        {isVIP ? (
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Bem-vindo ao KIXIKILA VIP! A sua subscrição foi ativada com sucesso.
            </p>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Crown className="w-4 h-4 mr-1" />
              Status VIP Ativo
            </Badge>
          </div>
        ) : (
          <p className="text-gray-600 mb-6">
            O seu pagamento foi processado com sucesso. Pode acompanhar todas as transações na sua carteira.
          </p>
        )}

        {/* VIP Benefits (if applicable) */}
        {isVIP && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-6 border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2 flex items-center justify-center gap-2">
              <Gift className="w-4 h-4" />
              Benefícios VIP Desbloqueados
            </h3>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>✨ Grupos ilimitados</li>
              <li>📊 Relatórios avançados</li>
              <li>🛡️ Suporte prioritário</li>
              <li>🎨 Personalização avançada</li>
            </ul>
          </div>
        )}

        {/* Transaction Details */}
        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Detalhes da Transação</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>ID da Sessão:</span>
                <span className="font-mono text-xs">{sessionId.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant="secondary" className="text-emerald-600 bg-emerald-100">
                  Concluído
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            onClick={handleContinue}
            disabled={loading}
          >
            {isVIP ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Ver Perfil VIP
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Ver Carteira
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/app/dashboard')}
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 mt-6">
          Receberá um email de confirmação em breve
        </p>
      </Card>
    </div>
  );
};