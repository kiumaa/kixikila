import React, { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Calendar, Crown, Users, Settings, CreditCard, Share2, Trophy, Clock, Check, AlertCircle, Sparkles, Euro, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/design-system/Avatar';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { useToast } from '@/hooks/use-toast';
import { type Group, formatCurrency, formatDate } from '@/data/mockData';
import { useMemoizedGroupProgress } from '@/lib/performance';

interface GroupDetailsScreenProps {
  group: Group;
  onBack: () => void;
  onPay: () => void;
  onInvite: () => void;
  currentUserId: number;
}

export const GroupDetailsScreen: React.FC<GroupDetailsScreenProps> = React.memo(({
  group,
  onBack,
  onPay,
  onInvite,
  currentUserId
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  // Memoized calculations
  const { paidMembers, progress } = useMemoizedGroupProgress(group.members);
  const isAdmin = useMemo(() => group.adminId === currentUserId, [group.adminId, currentUserId]);
  const canDraw = useMemo(() => progress === 100 && group.groupType === 'lottery', [progress, group.groupType]);

  const handleDraw = useCallback(() => {
    const unpaidMembers = group.members.filter(m => !m.paid && !m.isWinner);
    if (unpaidMembers.length === 0) return;
    
    const winner = unpaidMembers[Math.floor(Math.random() * unpaidMembers.length)];
    setShowConfetti(true);
    
    toast({
      title: "🎉 Sorteio realizado!",
      description: `${winner.name} foi contemplado(a) com ${formatCurrency(group.totalPool)}!`
    });

    setTimeout(() => setShowConfetti(false), 3000);
  }, [group.members, group.totalPool, toast]);

  const tabs = useMemo(() => [
    { key: 'overview', label: 'Visão Geral' },
    { key: 'members', label: 'Membros' },
    { key: 'history', label: 'Histórico' },
    { key: 'rules', label: 'Regras' }
  ], []);

  const handleTabChange = useCallback((tabKey: string) => {
    setActiveTab(tabKey);
  }, []);

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 animate-bounce-in">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/20 to-success/20 animate-pulse" />
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-warning rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold font-system text-primary-foreground">
              {group.name}
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              {group.description}
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-background/90 backdrop-blur-sm border-border text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold font-system text-foreground">
                {formatCurrency(group.totalPool)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Valor Total
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/90 backdrop-blur-sm border-border text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold font-system text-foreground">
                {group.cycle}º
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Ciclo Atual
              </div>
            </CardContent>
          </Card>
          <Card className="bg-background/90 backdrop-blur-sm border-border text-center">
            <CardContent className="p-4">
              <div className="text-2xl font-bold font-system text-foreground">
                {paidMembers}/{group.members.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Pagamentos
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8">
        {/* Action Card */}
        {canDraw ? (
          <Card className="ios-card mb-6 bg-gradient-to-r from-success-subtle to-success-subtle/50 border-success/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold font-system text-success mb-1">
                    ✨ Pronto para sorteio!
                  </h3>
                  <p className="text-sm text-success/80">
                    Todos os membros pagaram. Pode realizar o sorteio.
                  </p>
                </div>
                {isAdmin && (
                  <Button
                    onClick={handleDraw}
                    className="ios-button bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Sortear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="ios-card mb-6 bg-gradient-to-r from-warning-subtle to-warning-subtle/50 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold font-system text-warning mb-1">
                    ⏳ Aguardando pagamentos
                  </h3>
                  <p className="text-sm text-warning/80">
                    Faltam {group.members.length - paidMembers} pagamentos para completar o ciclo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 mb-6 bg-muted rounded-xl p-1">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              variant="ghost"
              size="sm"
              className={`ios-button font-medium ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Progress Card */}
            <Card className="ios-card">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold font-system text-foreground">
                  Progresso do Ciclo
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Pagamentos realizados
                      </span>
                      <span className="font-bold font-system text-foreground">
                        {paidMembers}/{group.members.length}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        Contribuição
                      </div>
                      <div className="font-semibold font-system text-foreground">
                        {formatCurrency(group.contributionAmount)}
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-xs text-muted-foreground mb-1">
                        Próximo pagamento
                      </div>
                      <div className="font-semibold font-system text-foreground">
                        {formatDate(group.nextPaymentDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Winner Card (for order groups) */}
            {group.groupType === 'order' && group.nextReceiver && (
              <Card className="ios-card bg-gradient-to-r from-info-subtle to-info-subtle/50 border-info/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold font-system text-info mb-3">
                    🎯 Próximo Contemplado
                  </h3>
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={group.nextReceiver.name}
                      size="lg"
                    />
                    <div>
                      <div className="font-semibold font-system text-foreground">
                        {group.nextReceiver.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Posição #{group.nextReceiver.position}
                      </div>
                      <div className="text-sm font-semibold text-info mt-1">
                        Receberá {formatCurrency(group.contributionAmount * group.members.length)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={onPay}
                className="ios-button bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                Pagar Agora
              </Button>
              <Button
                onClick={onInvite}
                variant="outline"
                className="ios-button"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Convidar
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-3">
            {group.members.map((member) => (
              <Card key={member.id} className="ios-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={member.name}
                        size="md"
                        verified={member.isAdmin}
                        online={member.paid}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold font-system text-foreground">
                            {member.name}
                          </span>
                          {member.isAdmin && (
                            <StatusBadge status="info" size="sm" showIcon={false}>
                              Admin
                            </StatusBadge>
                          )}
                        </div>
                        {member.position && (
                          <div className="text-sm text-muted-foreground">
                            Posição #{member.position}
                          </div>
                        )}
                        {member.isWinner && (
                          <div className="text-sm font-medium text-warning mt-1">
                            👑 Último contemplado
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <StatusBadge
                      status={member.paid ? 'success' : 'pending'}
                      showIcon={true}
                    >
                      {member.paid ? 'Pago' : 'Pendente'}
                    </StatusBadge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {group.history && group.history.length > 0 ? (
              group.history.map((item, idx) => (
                <Card key={idx} className="ios-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold font-system text-foreground">
                          Ciclo {item.cycle}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Contemplado: {item.winner}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(item.date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-system text-success">
                          {formatCurrency(item.amount)}
                        </div>
                        <StatusBadge status="success" size="sm" showIcon={false}>
                          Concluído
                        </StatusBadge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="ios-card">
                <CardContent className="p-8 text-center space-y-4">
                  <Clock className="w-12 h-12 text-muted mx-auto" />
                  <div>
                    <p className="text-muted-foreground font-medium">
                      Ainda não há histórico
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      O histórico aparecerá após o primeiro ciclo
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'rules' && (
          <Card className="ios-card">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold font-system text-foreground">
                Regras do Grupo
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-subtle rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium font-system text-foreground">
                      Frequência
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Pagamentos {group.frequency}, sempre no dia 15
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-success-subtle rounded-lg flex items-center justify-center flex-shrink-0">
                    <Euro className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <div className="font-medium font-system text-foreground">
                      Valor
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(group.contributionAmount)} por membro, por ciclo
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-info-subtle rounded-lg flex items-center justify-center flex-shrink-0">
                    {group.groupType === 'lottery' ? (
                      <Sparkles className="w-4 h-4 text-info" />
                    ) : (
                      <Target className="w-4 h-4 text-info" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium font-system text-foreground">
                      Tipo de Seleção
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {group.groupType === 'lottery' 
                        ? 'Sorteio aleatório a cada ciclo'
                        : 'Ordem predefinida pelos membros'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-destructive-subtle rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <div className="font-medium font-system text-foreground">
                      Penalizações
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Atraso no pagamento resulta em exclusão do sorteio atual
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});