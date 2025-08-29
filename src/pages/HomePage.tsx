import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Shield, Users, Wallet, ArrowRight, Sparkles, TrendingUp, Clock, Star, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoleBasedRedirect from '@/components/auth/RoleBasedRedirect';
const HomePage = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated
  } = useAuthStore();

  // Redirect authenticated users based on their role
  if (isAuthenticated) {
    return <RoleBasedRedirect />;
  }
  return <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="mb-8">
              <div className="\n">
                <img src="/src/assets/kixikila-logomain.png" alt="KIXIKILA" className="h-12 w-auto" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-8 animate-fade-in">
              A forma mais{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                inteligente
              </span>
              <br />
              de poupar em grupo
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in">
              Junte-se a grupos de poupança colaborativa e alcance os seus objetivos financeiros 
              mais rapidamente com total segurança e transparência.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in">
              <Button size="lg" className="bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-primary-foreground px-10 py-6 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 animate-hover-scale" onClick={() => navigate('/entrar?type=register')}>
                <Zap className="mr-3 h-6 w-6" />
                Começar Agora
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button size="lg" variant="outline" className="px-10 py-6 text-xl font-semibold border-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300" onClick={() => navigate('/entrar?type=login')}>
                Já tenho conta
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Como Funciona o KIXIKILA
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simples, seguro e transparente. Três passos para começar a poupar em grupo.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8 hover:shadow-xl transition-shadow">
              <CardContent>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">1. Junte-se a um Grupo</h3>
                <p className="text-muted-foreground">
                  Crie ou entre num grupo de poupança com amigos, família ou colegas. 
                  Defina o valor mensal e objetivos.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-xl transition-shadow">
              <CardContent>
                <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Wallet className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">2. Contribua Mensalmente</h3>
                <p className="text-muted-foreground">
                  Todos os membros contribuem com o valor acordado através da carteira digital segura.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-8 hover:shadow-xl transition-shadow">
              <CardContent>
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-4">3. Receba o Montante</h3>
                <p className="text-muted-foreground">
                  Por sorteio ou ordem, cada membro recebe o montante total acumulado para realizar seus objetivos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Porquê Escolher o KIXIKILA?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A plataforma mais segura e moderna para poupança colaborativa em Portugal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">100% Seguro</h3>
              <p className="text-sm text-muted-foreground">Tecnologia Stripe e verificação KYC</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Rápido e Fácil</h3>
              <p className="text-sm text-muted-foreground">Configure um grupo em minutos</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Transparente</h3>
              <p className="text-sm text-muted-foreground">Todas as transações são auditáveis</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Planos VIP</h3>
              <p className="text-sm text-muted-foreground">Recursos avançados disponíveis</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Pronto para Começar a Poupar?
          </h2>
          <p className="text-xl mb-10 opacity-90 max-w-2xl mx-auto">
            Junte-se a milhares de portugueses que já descobriram uma forma mais inteligente de poupar.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" variant="secondary" className="px-10 py-6 text-xl font-semibold bg-white text-primary hover:bg-gray-100" onClick={() => navigate('/entrar?type=register')}>
              <Crown className="mr-3 h-6 w-6" />
              Criar Conta Grátis
            </Button>
          </div>
        </div>
      </div>
    </div>;
};
export default HomePage;