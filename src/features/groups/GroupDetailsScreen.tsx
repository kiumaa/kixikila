import React, { useState } from 'react';
import { ArrowLeft, Users, Calendar, Euro, Settings, Crown, Trophy, Clock, Check, Share2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/design-system/Avatar';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Group } from '@/lib/mockData';

interface GroupDetailsScreenProps {
  group: Group;
  userId: number;
  onBack: () => void;
  onPay: () => void;
  onInvite: () => void;
  onDrawWinner: () => void;
}

export const GroupDetailsScreen: React.FC<GroupDetailsScreenProps> = ({
  group,
  userId,
  onBack,
  onPay,
  onInvite,
  onDrawWinner
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const paidMembers = group.members.filter(m => m.paid).length;
  const totalMembers = group.members.length;
  const progress = (paidMembers / totalMembers) * 100;
  const isAdmin = group.adminId === userId;
  const currentUserMember = group.members.find(m => m.id === userId);
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-14 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-primary-foreground hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary-foreground">{group.name}</h1>
            <p className="text-primary-foreground/80 text-sm">{group.description}</p>
          </div>
          {isAdmin && (
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary-foreground hover:bg-white/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white/10 backdrop-blur-sm border-0 p-4 text-center">
            <div className="text-2xl font-bold text-primary-foreground">
              {formatCurrency(group.totalPool)}
            </div>
            <div className="text-xs text-primary-foreground/80 mt-1">Valor Total</div>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-0 p-4 text-center">
            <div className="text-2xl font-bold text-primary-foreground">
              {group.cycle}º
            </div>
            <div className="text-xs text-primary-foreground/80 mt-1">Ciclo Atual</div>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-0 p-4 text-center">
            <div className="text-2xl font-bold text-primary-foreground">
              {paidMembers}/{totalMembers}
            </div>
            <div className="text-xs text-primary-foreground/80 mt-1">Pagamentos</div>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8">
        {/* Action Card */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 dark:from-emerald-950 dark:to-green-950 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                {progress === 100 ? '✨ Pronto para sorteio!' : '⏳ Aguardando pagamentos'}
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-200">
                {progress === 100 
                  ? 'Todos os membros pagaram. Pode realizar o sorteio.'
                  : `Faltam ${totalMembers - paidMembers} pagamentos para completar o ciclo`}
              </p>
            </div>
            {progress === 100 && isAdmin && (
              <Button 
                onClick={onDrawWinner}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Sortear
              </Button>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Progress Card */}
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Progresso do Ciclo</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Pagamentos realizados</span>
                    <span className="font-bold text-foreground">{paidMembers}/{totalMembers}</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Contribuição</div>
                    <div className="font-semibold text-foreground">
                      {formatCurrency(group.contributionAmount)}
                    </div>
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Próximo pagamento</div>
                    <div className="font-semibold text-foreground">
                      {formatDate(group.nextPaymentDate)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Next Winner Card (for order groups) */}
            {group.groupType === 'order' && group.nextReceiver && (
              <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950 dark:to-pink-950 dark:border-purple-800">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">🎯 Próximo Contemplado</h3>
                <div className="flex items-center gap-3">
                  <Avatar name={group.nextReceiver.name} size="lg" />
                  <div>
                    <div className="font-semibold text-foreground">{group.nextReceiver.name}</div>
                    <div className="text-sm text-muted-foreground">Posição #{group.nextReceiver.position}</div>
                    <div className="text-sm font-semibold text-purple-600 dark:text-purple-400 mt-1">
                      Receberá {formatCurrency(group.contributionAmount * totalMembers)}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={onPay}
                disabled={currentUserMember?.paid}
                className="w-full"
              >
                <CreditCard className="w-5 h-5 mr-2" />
                {currentUserMember?.paid ? 'Já Pago' : 'Pagar Agora'}
              </Button>
              <Button 
                variant="secondary"
                onClick={onInvite}
                className="w-full"
              >
                <Share2 className="w-5 h-5 mr-2" />
                Convidar
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-3 mt-4">
            {group.members.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{member.name}</span>
                        {member.isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      {member.position && (
                        <div className="text-sm text-muted-foreground">Posição #{member.position}</div>
                      )}
                      {member.isWinner && (
                        <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-1">
                          👑 Último contemplado
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant={member.paid ? 'default' : 'secondary'}>
                    {member.paid ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Pago
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Pendente
                      </>
                    )}
                  </Badge>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-3 mt-4">
            {group.history.length > 0 ? (
              group.history.map((item, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Ciclo {item.cycle}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Contemplado: {item.winner}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(item.date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">
                        {formatCurrency(item.amount)}
                      </div>
                      <Badge className="text-xs">
                        Concluído
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Ainda não há histórico</p>
                <p className="text-sm text-muted-foreground mt-1">
                  O histórico aparecerá após o primeiro ciclo
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rules" className="mt-4">
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Regras do Grupo</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Frequência</div>
                    <div className="text-sm text-muted-foreground">Pagamentos mensais, sempre no dia 15</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Euro className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Valor</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(group.contributionAmount)} por membro, por ciclo
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Tipo de Seleção</div>
                    <div className="text-sm text-muted-foreground">
                      {group.groupType === 'lottery' 
                        ? 'Sorteio aleatório a cada ciclo'
                        : 'Ordem predefinida pelos membros'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};