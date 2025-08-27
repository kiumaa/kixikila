import React from 'react';
import { Crown, AlertCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/use-toast';

interface PlanLimitNoticeProps {
  onUpgrade?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  className?: string;
}

export const PlanLimitNotice: React.FC<PlanLimitNoticeProps> = ({ 
  onUpgrade, 
  showCloseButton = false,
  onClose,
  className = ""
}) => {
  const { userPlan, getGroupCount, canCreateGroup } = useAppStore();
  const groupCount = getGroupCount();
  const isAtLimit = !canCreateGroup();

  if (userPlan === 'vip') return null;

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "O upgrade para VIP estará disponível em breve!",
      });
    }
  };

  return (
    <Card className={`bg-gradient-to-r from-warning/10 to-primary/10 border-warning/20 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center flex-shrink-0">
              {isAtLimit ? (
                <AlertCircle className="w-5 h-5 text-warning" />
              ) : (
                <Crown className="w-5 h-5 text-warning" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm">
                  {isAtLimit ? 'Limite Atingido' : 'Plano Gratuito'}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {groupCount}/2 grupos
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAtLimit 
                  ? 'Atingiu o limite de 2 grupos. Liberta todo o potencial do KIXIKILA com o plano VIP!'
                  : 'Desbloqueia grupos ilimitados, relatórios avançados e suporte prioritário.'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-3">
            <Button 
              variant="default" 
              size="sm"
              className="text-xs px-3 py-1.5 h-auto"
              onClick={handleUpgradeClick}
            >
              Assinar VIP
            </Button>
            {showCloseButton && onClose && (
              <Button
                variant="ghost"
                size="sm" 
                className="w-6 h-6 p-0"
                onClick={onClose}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};