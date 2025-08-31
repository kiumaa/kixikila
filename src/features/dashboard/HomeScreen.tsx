import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/design-system/Avatar';
import { Wallet, Users, Plus, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { groupsAPI, walletAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Group } from '@/lib/mockData';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [recommendedGroups, setRecommendedGroups] = useState<Group[]>([]);
  const [walletData, setWalletData] = useState<any>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [groupsRes, recommendedRes, walletRes] = await Promise.all([
          groupsAPI.getMyGroups(),
          groupsAPI.getRecommendedGroups(), 
          walletAPI.getBalance()
        ]);
        
        setMyGroups(groupsRes);
        setRecommendedGroups(recommendedRes);
        setWalletData(walletRes);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Fallback to empty states
        setMyGroups([]);
        setRecommendedGroups([]);
        setWalletData({ balance: user?.wallet_balance || 0 });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="h-24 skeleton rounded-2xl" />
        <div className="space-y-3">
          <div className="h-24 skeleton rounded-xl" />
          <div className="h-24 skeleton rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance Card */}
      <div className="bg-gradient-to-br from-primary via-primary-hover to-primary text-primary-foreground mx-4 rounded-2xl shadow-lg">
        <Card className="bg-transparent border-0 text-inherit">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-primary-foreground/80" />
                <span className="text-primary-foreground/80 font-medium">Saldo da Carteira</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/20 p-2"
              >
                {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            
            <div className="text-4xl font-bold mb-6">
              {balanceVisible ? formatCurrency(walletData?.balance || 0) : '••••••'}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1"
                onClick={() => navigate('/app/wallet?action=deposit')}
              >
                Depositar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1"
                onClick={() => navigate('/app/wallet?action=withdraw')}
              >
                Levantar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1"
                onClick={() => navigate('/app/wallet')}
              >
                Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mx-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{myGroups.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Grupos Ativos</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-success">+24%</div>
          <div className="text-xs text-muted-foreground mt-1">Rentabilidade</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{user?.trust_score || 98}%</div>
          <div className="text-xs text-muted-foreground mt-1">Trust Score</div>
        </Card>
      </div>

      {/* My Groups */}
      <div className="mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Os Meus Grupos</h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/app/groups/create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar
          </Button>
        </div>

        <div className="space-y-3">
          {myGroups.map((group) => (
            <Card 
              key={group.id}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => navigate(`/app/groups/${group.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{group.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatCurrency(group.contribution_amount)}/{group.contribution_frequency}</span>
                      <span>{group.current_members}/{group.max_members} membros</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 4).map((member) => (
                      <Avatar 
                        key={member.user_id}
                        name={member.name}
                        image={member.avatar_url}
                        size="sm"
                        className="ring-2 ring-background"
                      />
                    ))}
                    {group.members.length > 4 && (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-medium ring-2 ring-background">
                        +{group.members.length - 4}
                      </div>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {formatCurrency(group.total_pool)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommended Groups */}
      <div className="mx-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Grupos Recomendados</h2>
        <div className="space-y-3">
          {recommendedGroups.map((group) => (
            <Card key={group.id} className="cursor-pointer hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {formatCurrency(group.contribution_amount)}/{group.contribution_frequency}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {group.current_members}/{group.max_members} vagas
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver mais
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};