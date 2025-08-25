import React, { useState } from 'react';
import { Users, Shield, Wallet, Sparkles, ArrowLeft, Lock, Plus, Home, User, PlusCircle, Bell, Eye, EyeOff, Upload, Download, History, Crown, Check, Calendar, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const { toast } = useToast();

  const mockUser = {
    name: "Ana Santos",
    walletBalance: 1250.50,
    activeGroups: 3,
    trustScore: 98
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const features = [
    {
      icon: <Users className="w-12 h-12 text-indigo-500" />,
      title: "Poupança Colaborativa",
      description: "Junte-se a grupos de poupança e alcance seus objetivos financeiros mais rapidamente"
    },
    {
      icon: <Shield className="w-12 h-12 text-emerald-500" />,
      title: "100% Seguro",
      description: "Transações protegidas via Stripe e verificação KYC para máxima segurança"
    },
    {
      icon: <Wallet className="w-12 h-12 text-purple-500" />,
      title: "Carteira Digital",
      description: "Gerencie seus fundos facilmente com depósitos e levantamentos instantâneos"
    }
  ];

  const OnboardingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-background to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {step < 3 ? (
          <Card className="p-8 text-center">
            <CardContent className="pt-6">
              <div className="mb-6">{features[step].icon}</div>
              <h2 className="text-2xl font-bold mb-3">{features[step].title}</h2>
              <p className="text-muted-foreground mb-8">{features[step].description}</p>
              <div className="flex justify-center gap-2 mb-8">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`h-2 rounded-full transition-all ${i === step ? 'w-8 bg-primary' : 'w-2 bg-muted'}`} />
                ))}
              </div>
              <Button size="lg" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500" onClick={() => setStep(step + 1)}>
                Continuar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <CardContent className="pt-6">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-3">KIXIKILA</h1>
              <p className="text-muted-foreground mb-8 text-lg">A forma mais inteligente de poupar em grupo</p>
              <div className="space-y-3">
                <Button size="lg" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500" onClick={() => setCurrentScreen('login')}>
                  Entrar
                </Button>
                <Button variant="outline" size="lg" className="w-full" onClick={() => setCurrentScreen('register')}>
                  Criar Conta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const LoginScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-background to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <CardContent className="pt-6">
          <Button onClick={() => setCurrentScreen('onboarding')} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />Voltar
          </Button>
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Bem-vindo de volta</h1>
            <p className="text-muted-foreground">Entre na sua conta KIXIKILA</p>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Número de Telemóvel</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="912 345 678" className="pl-10" />
              </div>
            </div>
            <Button size="lg" className="w-full bg-gradient-to-r from-indigo-500 to-purple-500" onClick={() => { setIsLoggedIn(true); setCurrentScreen('dashboard'); toast({ title: "Login realizado!", description: "Bem-vindo de volta" }); }}>
              Entrar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const DashboardScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 pt-14 pb-32">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Olá, {mockUser.name.split(' ')[0]} 👋</h1>
            <p className="text-indigo-100">{new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
          </Button>
        </div>
        <Card className="bg-white/10 backdrop-blur-md border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5" />
                <span className="font-medium">Saldo da Carteira</span>
              </div>
              <Button onClick={() => setBalanceVisible(!balanceVisible)} variant="ghost" size="sm" className="text-white/60 hover:text-white">
                {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
            <div className="text-4xl font-bold mb-6">{balanceVisible ? formatCurrency(mockUser.walletBalance) : '••••••'}</div>
            <div className="flex gap-3">
              <Button size="sm" className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0">
                <Upload className="w-4 h-4 mr-2" />Depositar
              </Button>
              <Button size="sm" className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0">
                <Download className="w-4 h-4 mr-2" />Levantar
              </Button>
              <Button size="sm" className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0" onClick={() => setCurrentScreen('wallet')}>
                <History className="w-4 h-4 mr-2" />Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="px-6 -mt-16 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{mockUser.activeGroups}</div>
              <div className="text-xs text-muted-foreground mt-1">Grupos Ativos</div>
            </CardContent>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-500">+24%</div>
              <div className="text-xs text-muted-foreground mt-1">Rentabilidade</div>
            </CardContent>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-indigo-500">{mockUser.trustScore}%</div>
              <div className="text-xs text-muted-foreground mt-1">Trust Score</div>
            </CardContent>
          </Card>
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Os Meus Grupos</h2>
            <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500">
              <Plus className="w-4 h-4 mr-2" />Criar
            </Button>
          </div>
          <Card className="p-5">
            <CardContent className="pt-5">
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">Ainda não tem grupos</p>
                <p className="text-sm text-muted-foreground mt-1">Crie o seu primeiro grupo de poupança</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const WalletScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 pt-14 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={() => setCurrentScreen('dashboard')} variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Carteira Digital</h1>
        </div>
      </div>
      <div className="px-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold mb-2">{formatCurrency(mockUser.walletBalance)}</div>
            <p className="text-muted-foreground">Saldo disponível</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ProfileScreen = () => (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 pt-14 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={() => setCurrentScreen('dashboard')} variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">Perfil</h1>
        </div>
      </div>
      <div className="px-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
              AS
            </div>
            <h2 className="text-xl font-bold mb-1">{mockUser.name}</h2>
            <p className="text-muted-foreground">ana.santos@email.pt</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const BottomNavigation = () => {
    if (!['dashboard', 'wallet', 'profile'].includes(currentScreen)) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="max-w-md mx-auto px-6 py-3">
          <div className="flex justify-around items-center">
            {[
              { key: 'dashboard', icon: Home, label: 'Início', screen: 'dashboard' },
              { key: 'wallet', icon: Wallet, label: 'Carteira', screen: 'wallet' },
              { key: 'create', icon: PlusCircle, label: 'Criar' },
              { key: 'profile', icon: User, label: 'Perfil', screen: 'profile' }
            ].map((item) => (
              <Button key={item.key} onClick={() => item.screen && setCurrentScreen(item.screen)} variant="ghost" className={`flex flex-col items-center gap-1 py-2 px-3 h-auto ${currentScreen === item.screen ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      {currentScreen === 'onboarding' && <OnboardingScreen />}
      {currentScreen === 'login' && <LoginScreen />}
      {isLoggedIn && currentScreen === 'dashboard' && <DashboardScreen />}
      {isLoggedIn && currentScreen === 'wallet' && <WalletScreen />}
      {isLoggedIn && currentScreen === 'profile' && <ProfileScreen />}
      {isLoggedIn && <BottomNavigation />}
    </div>
  );
};

export default Index;
