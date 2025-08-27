import React, { useState } from 'react';
import { 
  Bell, Wallet, Upload, Download, History, Eye, EyeOff, Crown, 
  Plus, Search, Calendar, Lock, Sparkles, Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { Avatar } from '@/components/design-system/Avatar';
import { SkeletonCard } from '@/components/design-system/SkeletonCard';
import { mockUser, mockGroups, formatCurrency, formatDate, type Group } from '@/data/mockData';

interface DashboardScreenProps {
  onOpenNotifications: () => void;
  onOpenWallet: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onSelectGroup: (group: Group) => void;
  notifications: any[];
  isLoading?: boolean;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onOpenNotifications,
  onOpenWallet,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onSelectGroup,
  notifications,
  isLoading = false
}) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface pb-24">
        <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-32">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-2">
              <div className="h-8 w-32 bg-primary-foreground/20 rounded animate-pulse" />
              <div className="h-4 w-48 bg-primary-foreground/20 rounded animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-primary-foreground/20 rounded-xl animate-pulse" />
          </div>
          <div className="h-32 bg-primary-foreground/20 rounded-2xl animate-pulse" />
        </div>
        <div className="px-6 -mt-16 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-32">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold font-system text-primary-foreground mb-1">
              Olá, {mockUser.name.split(' ')[0]} 👋
            </h1>
            <p className="text-primary-foreground/80">
              {new Date().toLocaleDateString('pt-PT', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onOpenNotifications}
              className="relative p-2.5 bg-primary-foreground/20 backdrop-blur-sm rounded-xl hover:bg-primary-foreground/30 transition-colors ios-button"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5 text-primary-foreground" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce-in">
                  {unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <Card className="bg-primary-foreground/10 backdrop-blur-md border-0 text-primary-foreground ios-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/80 font-medium font-system">
                  Saldo da Carteira
                </span>
              </div>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-primary-foreground/60 hover:text-primary-foreground transition-colors ios-button"
                aria-label={balanceVisible ? "Ocultar saldo" : "Mostrar saldo"}
              >
                {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="text-4xl font-bold font-system mb-6">
              {balanceVisible ? formatCurrency(mockUser.walletBalance) : '••••••'}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0 ios-button"
                onClick={onOpenDeposit}
              >
                <Upload className="w-4 h-4 mr-2" />
                Depositar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0 ios-button"
                onClick={onOpenWithdraw}
              >
                <Download className="w-4 h-4 mr-2" />
                Levantar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0 ios-button"
                onClick={onOpenWallet}
              >
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="ios-card p-4 text-center hover:shadow-md hover:scale-105 transition-all duration-base cursor-pointer">
            <CardContent className="p-0">
              <div className="text-2xl font-bold font-system text-foreground">
                {mockUser.activeGroups}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Grupos Ativos</div>
            </CardContent>
          </Card>
          <Card className="ios-card p-4 text-center hover:shadow-md hover:scale-105 transition-all duration-base cursor-pointer">
            <CardContent className="p-0">
              <div className="text-2xl font-bold font-system text-success">+24%</div>
              <div className="text-xs text-muted-foreground mt-1">Rentabilidade</div>
            </CardContent>
          </Card>
          <Card className="ios-card p-4 text-center hover:shadow-md hover:scale-105 transition-all duration-base cursor-pointer">
            <CardContent className="p-0">
              <div className="text-2xl font-bold font-system text-primary">
                {mockUser.trustScore}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Trust Score</div>
            </CardContent>
          </Card>
        </div>

        {/* VIP Banner */}
        {!mockUser.isVIP && (
          <Card className="ios-card bg-gradient-to-r from-warning-subtle to-warning-subtle/50 border-warning/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-system text-warning-foreground">
                      Upgrade para VIP
                    </h3>
                    <p className="text-xs text-warning-foreground/70">
                      Grupos ilimitados e benefícios exclusivos
                    </p>
                  </div>
                </div>
                <Button variant="default" size="sm" className="ios-button">
                  Ver mais
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold font-system text-foreground">
              Os Meus Grupos
            </h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onOpenJoinGroup}
                className="ios-button"
              >
                <Search className="w-4 h-4 mr-2" />
                Procurar
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={onOpenCreateGroup}
                className="ios-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar
              </Button>
            </div>
          </div>

          {/* Group Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'active', label: 'Ativos' },
              { key: 'pending', label: 'Pendentes' },
              { key: 'completed', label: 'Concluídos' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium font-system transition-all whitespace-nowrap ${
                  activeTab === tab.key 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-card text-muted-foreground hover:bg-card-hover'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Groups List */}
          <div className="space-y-4">
            {mockGroups.filter((group) => {
              if (activeTab === 'all') return true;
              if (activeTab === 'active') return group.status === 'active' || group.status === 'ready_for_draw';
              if (activeTab === 'pending') return group.status === 'pending';
              if (activeTab === 'completed') return group.status === 'completed';
              return true;
            }).map((group) => {
              const paidMembers = group.members.filter(m => m.paid).length;
              const totalMembers = group.members.length;
              const progress = (paidMembers / totalMembers) * 100;
              
              return (
                <Card 
                  key={group.id} 
                  className="ios-card p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-base cursor-pointer"
                  onClick={() => onSelectGroup(group)}
                >
                  <CardContent className="p-0">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold font-system text-foreground text-lg">
                            {group.name}
                          </h3>
                          {group.groupType === 'lottery' && (
                            <StatusBadge status="winner" size="xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Sorteio
                            </StatusBadge>
                          )}
                          {group.privacy === 'private' && (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                          {group.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-semibold font-system text-primary">
                            {formatCurrency(group.contributionAmount)}/mês
                          </span>
                          <span className="text-muted-foreground">
                            {group.currentMembers}/{group.maxMembers} membros
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold font-system text-foreground">
                          {formatCurrency(group.totalPool)}
                        </div>
                        <div className="text-xs text-muted-foreground">valor total</div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium font-system text-muted-foreground">
                          Progresso do ciclo
                        </span>
                        <span className="text-xs font-bold font-system text-foreground">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {group.members.slice(0, 5).map((member) => (
                          <Avatar 
                            key={member.id} 
                            name={member.avatar} 
                            size="sm" 
                            online={member.paid}
                            className="ring-2 ring-background hover:scale-110 transition-transform"
                          />
                        ))}
                        {group.members.length > 5 && (
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-semibold font-system text-muted-foreground ring-2 ring-background">
                            +{group.members.length - 5}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground font-system">
                          Próximo: {formatDate(group.nextPaymentDate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};