import React, { useState } from 'react';
import { 
  Users, Shield, Wallet, Sparkles, ArrowLeft, Lock, Plus, Home, User, PlusCircle, Bell, 
  Eye, EyeOff, Upload, Download, History, Crown, Check, Calendar, Phone, Mail, 
  Settings, LogOut, Search, ChevronRight, TrendingUp, Clock, AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { Avatar } from '@/components/design-system/Avatar';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { ThemeToggle } from '@/components/design-system/ThemeToggle';
import { 
  mockUser, 
  mockGroups, 
  mockTransactions, 
  mockNotifications, 
  formatCurrency, 
  formatDate,
  type Group,
  type Transaction,
  type Notification
} from '@/data/mockData';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [groupFilter, setGroupFilter] = useState('all');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const { toast } = useToast();
  const { theme } = useDarkMode();

  // Onboarding Features
  const features = [
    {
      icon: <Users className="w-16 h-16 text-primary" />,
      title: "Poupança Colaborativa",
      description: "Junte-se a grupos de poupança e alcance os seus objetivos financeiros mais rapidamente com total transparência"
    },
    {
      icon: <Shield className="w-16 h-16 text-success" />,
      title: "100% Seguro",
      description: "Transações protegidas com Stripe, verificação KYC e tecnologia bancária para máxima segurança dos seus fundos"
    },
    {
      icon: <Wallet className="w-16 h-16 text-warning" />,
      title: "Carteira Digital",
      description: "Gerencie os seus fundos facilmente com depósitos instantâneos, levantamentos rápidos e histórico completo"
    }
  ];

  // Onboarding Screen
  const OnboardingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {step < 3 ? (
          <Card className="ios-card p-8 text-center animate-fade-in">
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-center">
                {features[step].icon}
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold font-system text-foreground">
                  {features[step].title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {features[step].description}
                </p>
              </div>
              
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === step ? 'w-8 bg-primary' : 'w-2 bg-muted'
                    }`}
                  />
                ))}
              </div>
              
              <Button 
                size="lg" 
                className="w-full ios-button bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
                onClick={() => setStep(step + 1)}
              >
                Continuar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="ios-card p-8 text-center animate-bounce-in">
            <CardContent className="pt-6 space-y-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-primary-hover rounded-3xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-12 h-12 text-primary-foreground" />
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl font-bold font-system bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                  KIXIKILA
                </h1>
                <p className="text-lg text-muted-foreground">
                  A forma mais inteligente de poupar em grupo
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full ios-button bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
                  onClick={() => setCurrentScreen('login')}
                >
                  Entrar
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full ios-button font-semibold"
                  onClick={() => setCurrentScreen('register')}
                >
                  Criar Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  // Login Screen
  const LoginScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <Card className="w-full max-w-md ios-card animate-slide-up">
        <CardContent className="p-8 space-y-8">
          <Button 
            onClick={() => setCurrentScreen('onboarding')} 
            variant="ghost" 
            className="mb-4 ios-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary-hover rounded-3xl flex items-center justify-center shadow-lg">
              <Lock className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-system text-foreground mb-2">
                Bem-vindo de volta
              </h1>
              <p className="text-muted-foreground">
                Entre na sua conta KIXIKILA
              </p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium font-system text-foreground">
                Número de Telemóvel
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="912 345 678"
                  className="ios-input pl-12 font-system"
                />
              </div>
            </div>
            
            <Button
              size="lg"
              className="w-full ios-button bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
              onClick={() => {
                setIsLoggedIn(true);
                setCurrentScreen('dashboard');
                toast({
                  title: "Login realizado!",
                  description: "Bem-vindo de volta ao KIXIKILA"
                });
              }}
            >
              Entrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Dashboard Screen
  const DashboardScreen = () => {
    const filteredGroups = groupFilter === 'all' 
      ? mockGroups 
      : mockGroups.filter(g => g.status === groupFilter);

    return (
      <div className="min-h-screen bg-surface pb-24 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-32">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold font-system text-primary-foreground mb-1">
                Olá, {mockUser.name.split(' ')[0]} 👋
              </h1>
              <p className="text-primary-foreground/80 text-sm">
                {new Date().toLocaleDateString('pt-PT', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <ThemeToggle className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" />
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 relative ios-button"
                onClick={() => setCurrentScreen('notifications')}
              >
                <Bell className="w-5 h-5" />
                {mockNotifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                    {mockNotifications.filter(n => !n.read).length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Wallet Card */}
          <Card className="glass text-primary-foreground border-primary-foreground/20">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium font-system">Saldo da Carteira</span>
                </div>
                <Button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground/60 hover:text-primary-foreground ios-button"
                >
                  {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
              
              <div className="text-4xl font-bold font-system">
                {balanceVisible ? formatCurrency(mockUser.walletBalance) : '••••••'}
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <Button
                  size="sm"
                  className="ios-button bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                  onClick={() => setCurrentScreen('deposit')}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Depositar
                </Button>
                <Button
                  size="sm"
                  className="ios-button bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                  onClick={() => setCurrentScreen('withdraw')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Levantar
                </Button>
                <Button
                  size="sm"
                  className="ios-button bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                  onClick={() => setCurrentScreen('wallet')}
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
            <Card className="ios-card p-4 text-center">
              <CardContent className="pt-4 space-y-2">
                <div className="text-2xl font-bold font-system text-foreground">
                  {mockUser.activeGroups}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Grupos Ativos
                </div>
              </CardContent>
            </Card>
            
            <Card className="ios-card p-4 text-center">
              <CardContent className="pt-4 space-y-2">
                <div className="text-2xl font-bold font-system text-success">
                  +24%
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Rentabilidade
                </div>
              </CardContent>
            </Card>
            
            <Card className="ios-card p-4 text-center">
              <CardContent className="pt-4 space-y-2">
                <div className="text-2xl font-bold font-system text-primary">
                  {mockUser.trustScore}%
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  Trust Score
                </div>
              </CardContent>
            </Card>
          </div>

          {/* VIP Banner */}
          {!mockUser.isVIP && (
            <Card className="ios-card bg-gradient-to-r from-warning-subtle to-warning-subtle/50 border-warning/20 p-4">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning rounded-xl flex items-center justify-center">
                      <Crown className="w-5 h-5 text-warning-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold font-system text-warning">
                        Upgrade para VIP
                      </h3>
                      <p className="text-xs text-warning/80">
                        Grupos ilimitados e benefícios exclusivos
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="ios-button bg-warning hover:bg-warning/90 text-warning-foreground">
                    Ver mais
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Groups Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold font-system text-foreground">
                Os Meus Grupos
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="ios-button"
                  onClick={() => setCurrentScreen('explore')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Procurar
                </Button>
                <Button
                  size="sm"
                  className="ios-button bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Criar
                </Button>
              </div>
            </div>

            {/* Group Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'active', label: 'Ativos' },
                { key: 'ready_for_draw', label: 'Prontos' },
                { key: 'completed', label: 'Concluídos' }
              ].map((filter) => (
                <Button
                  key={filter.key}
                  size="sm"
                  variant={groupFilter === filter.key ? 'default' : 'outline'}
                  className={`whitespace-nowrap ios-button ${
                    groupFilter === filter.key
                      ? 'bg-primary text-primary-foreground'
                      : ''
                  }`}
                  onClick={() => setGroupFilter(filter.key)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            {/* Groups List */}
            <div className="space-y-4">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => {
                  const paidMembers = group.members.filter(m => m.paid).length;
                  const progress = (paidMembers / group.currentMembers) * 100;
                  
                  return (
                    <Card
                      key={group.id}
                      className="ios-card p-5 cursor-pointer"
                      onClick={() => {
                        setSelectedGroup(group);
                        setCurrentScreen('groupDetails');
                      }}
                    >
                      <CardContent className="pt-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold font-system text-foreground text-lg">
                                {group.name}
                              </h3>
                              <StatusBadge
                                status={group.groupType === 'lottery' ? 'info' : 'success'}
                                size="sm"
                                showIcon={false}
                              >
                                {group.groupType === 'lottery' ? 'Sorteio' : 'Ordem'}
                              </StatusBadge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {group.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold text-primary">
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
                            <div className="text-xs text-muted-foreground">
                              valor total
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-muted-foreground">
                              Progresso do ciclo
                            </span>
                            <span className="text-xs font-bold text-foreground">
                              {Math.round(progress)}%
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
                            {group.members.slice(0, 4).map((member) => (
                              <Avatar
                                key={member.id}
                                name={member.name}
                                size="sm"
                                online={member.paid}
                                className="ring-2 ring-background"
                              />
                            ))}
                            {group.members.length > 4 && (
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-semibold text-muted-foreground ring-2 ring-background">
                                +{group.members.length - 4}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {formatDate(group.nextPaymentDate)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="ios-card">
                  <CardContent className="p-8 text-center space-y-4">
                    <Users className="w-12 h-12 text-muted mx-auto" />
                    <div>
                      <p className="text-muted-foreground font-medium">
                        Ainda não tem grupos
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Crie o seu primeiro grupo de poupança
                      </p>
                    </div>
                    <Button className="ios-button bg-primary hover:bg-primary-hover text-primary-foreground">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Grupo
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Wallet Screen
  const WalletScreen = () => {
    const filteredTransactions = transactionFilter === 'all'
      ? mockTransactions
      : mockTransactions.filter(t => t.type === transactionFilter);

    return (
      <div className="min-h-screen bg-surface pb-24 animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-24">
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={() => setCurrentScreen('dashboard')}
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold font-system text-primary-foreground">
              Carteira Digital
            </h1>
          </div>

          {/* Balance Card */}
          <Card className="glass text-primary-foreground border-primary-foreground/20">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-primary-foreground/80 mb-2">
                    Saldo Disponível
                  </div>
                  <div className="text-4xl font-bold font-system">
                    {balanceVisible ? formatCurrency(mockUser.walletBalance) : '••••••'}
                  </div>
                </div>
                <Button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground/60 hover:text-primary-foreground ios-button"
                >
                  {balanceVisible ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs text-primary-foreground/60 mb-1">
                    Total Poupado
                  </div>
                  <div className="font-semibold font-system">
                    {formatCurrency(mockUser.totalSaved)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-primary-foreground/60 mb-1">
                    Total Ganho
                  </div>
                  <div className="font-semibold font-system text-success">
                    +{formatCurrency(mockUser.totalEarned)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-primary-foreground/60 mb-1">
                    Levantamentos
                  </div>
                  <div className="font-semibold font-system">
                    {formatCurrency(mockUser.totalWithdrawn)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="sm"
                  className="ios-button bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Depositar
                </Button>
                <Button
                  size="sm"
                  className="ios-button bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Levantar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <div className="px-6 -mt-8">
          <Card className="ios-card">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold font-system text-foreground">
                  Transações
                </h3>
                <Button size="sm" variant="outline" className="ios-button">
                  Exportar PDF
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { key: 'all', label: 'Todas' },
                  { key: 'deposit', label: 'Depósitos' },
                  { key: 'payment', label: 'Pagamentos' },
                  { key: 'reward', label: 'Prémios' },
                  { key: 'withdrawal', label: 'Levantamentos' }
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    size="sm"
                    variant={transactionFilter === filter.key ? 'default' : 'outline'}
                    className={`whitespace-nowrap ios-button text-xs ${
                      transactionFilter === filter.key
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    }`}
                    onClick={() => setTransactionFilter(filter.key)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                {filteredTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer smooth-transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        transaction.type === 'deposit' ? 'bg-success-subtle' :
                        transaction.type === 'withdrawal' ? 'bg-destructive-subtle' :
                        transaction.type === 'payment' ? 'bg-primary-subtle' :
                        'bg-warning-subtle'
                      }`}>
                        {transaction.type === 'deposit' && <Upload className="w-5 h-5 text-success" />}
                        {transaction.type === 'withdrawal' && <Download className="w-5 h-5 text-destructive" />}
                        {transaction.type === 'payment' && <TrendingUp className="w-5 h-5 text-primary" />}
                        {transaction.type === 'reward' && <Crown className="w-5 h-5 text-warning" />}
                      </div>
                      <div>
                        <p className="font-medium font-system text-foreground text-sm">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`font-bold font-system ${
                        transaction.amount > 0 ? 'text-success' : 'text-foreground'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                      <StatusBadge
                        status={transaction.status === 'completed' ? 'success' : 'pending'}
                        size="sm"
                        showIcon={false}
                      >
                        {transaction.status === 'completed' ? 'Concluída' : 'Processando'}
                      </StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Profile Screen
  const ProfileScreen = () => (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-24">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => setCurrentScreen('dashboard')}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-system text-primary-foreground">
            Perfil
          </h1>
        </div>

        {/* Profile Card */}
        <div className="text-center">
          <Avatar
            name={mockUser.name}
            size="2xl"
            className="mx-auto mb-4"
            verified={mockUser.kycStatus === 'verified'}
            vip={mockUser.isVIP}
          />
          <h2 className="text-2xl font-bold font-system text-primary-foreground mb-1">
            {mockUser.name}
          </h2>
          <p className="text-primary-foreground/80 mb-4">
            {mockUser.email}
          </p>
          
          <div className="flex justify-center gap-2">
            {mockUser.isVIP && (
              <StatusBadge status="vip" showIcon={true}>
                VIP
              </StatusBadge>
            )}
            {mockUser.kycStatus === 'verified' && (
              <StatusBadge status="success" showIcon={true}>
                Verificado
              </StatusBadge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 space-y-4">
        {/* Stats Card */}
        <Card className="ios-card">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold font-system text-foreground">
              Estatísticas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Trust Score
                </div>
                <div className="text-xl font-bold font-system text-primary">
                  {mockUser.trustScore}%
                </div>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Grupos Ativos
                </div>
                <div className="text-xl font-bold font-system text-foreground">
                  {mockUser.activeGroups}
                </div>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Ciclos Completos
                </div>
                <div className="text-xl font-bold font-system text-foreground">
                  {mockUser.completedCycles}
                </div>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Poupado
                </div>
                <div className="text-xl font-bold font-system text-success">
                  {formatCurrency(mockUser.totalSaved)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VIP Status Card */}
        {mockUser.isVIP ? (
          <Card className="ios-card bg-gradient-to-r from-warning-subtle to-warning-subtle/50 border-warning/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-warning-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-system text-warning">
                      Plano VIP
                    </h3>
                    <p className="text-xs text-warning/80">
                      Válido até {formatDate(mockUser.vipExpiry!)}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="ios-button">
                  Gerir
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-warning">
                  <Check className="w-4 h-4" />
                  <span>Grupos ilimitados</span>
                </div>
                <div className="flex items-center gap-2 text-warning">
                  <Check className="w-4 h-4" />
                  <span>Relatórios avançados</span>
                </div>
                <div className="flex items-center gap-2 text-warning">
                  <Check className="w-4 h-4" />
                  <span>Suporte prioritário</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="ios-card bg-gradient-to-r from-muted to-muted/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold font-system text-foreground">
                    Plano Gratuito
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Limitado a 2 grupos
                  </p>
                </div>
                <Button size="sm" className="ios-button bg-primary hover:bg-primary-hover text-primary-foreground">
                  Upgrade VIP
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Items */}
        <Card className="ios-card">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[
                { icon: User, label: 'Dados Pessoais' },
                { icon: Shield, label: 'Verificação KYC' },
                { icon: Bell, label: 'Notificações' },
                { icon: Lock, label: 'Segurança' },
                { icon: Settings, label: 'Definições' },
                { icon: LogOut, label: 'Terminar Sessão', danger: true }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (item.label === 'Terminar Sessão') {
                      setIsLoggedIn(false);
                      setCurrentScreen('onboarding');
                      toast({
                        title: "Sessão terminada",
                        description: "Até breve!"
                      });
                    }
                  }}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 smooth-transition ios-button"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${item.danger ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <span className={`font-medium font-system ${item.danger ? 'text-destructive' : 'text-foreground'}`}>
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Bottom Navigation
  const BottomNavigation = () => {
    const navItems = [
      { key: 'dashboard', icon: Home, label: 'Início', screen: 'dashboard' },
      { key: 'wallet', icon: Wallet, label: 'Carteira', screen: 'wallet' },
      { key: 'create', icon: PlusCircle, label: 'Criar' },
      { key: 'profile', icon: User, label: 'Perfil', screen: 'profile' }
    ];

    if (!['dashboard', 'wallet', 'profile'].includes(currentScreen)) {
      return null;
    }

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="max-w-md mx-auto px-6 py-3">
          <div className="flex justify-around items-center">
            {navItems.map((item) => (
              <Button
                key={item.key}
                onClick={() => item.screen && setCurrentScreen(item.screen)}
                variant="ghost"
                className={`flex flex-col items-center gap-1 py-2 px-3 h-auto ios-button ${
                  currentScreen === item.screen 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium font-system">
                  {item.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Main App Render
  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative font-system">
      {/* Screens */}
      {currentScreen === 'onboarding' && <OnboardingScreen />}
      {currentScreen === 'login' && <LoginScreen />}
      {isLoggedIn && currentScreen === 'dashboard' && <DashboardScreen />}
      {isLoggedIn && currentScreen === 'wallet' && <WalletScreen />}
      {isLoggedIn && currentScreen === 'profile' && <ProfileScreen />}
      
      {/* Bottom Navigation */}
      {isLoggedIn && <BottomNavigation />}
    </div>
  );
};

export default Index;