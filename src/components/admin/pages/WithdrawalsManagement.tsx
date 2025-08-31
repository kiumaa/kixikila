import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  DollarSign,
  User,
  Calendar,
  CreditCard
} from 'lucide-react';

interface WithdrawalAdmin {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  method: string;
  admin_notes?: string;
  failure_reason?: string;
  created_at: string;
  processed_at?: string;
  users: {
    full_name: string;
    email: string;
  } | null;
  payout_accounts: {
    iban: string;
    account_holder_name: string;
    bank_name?: string;
  } | null;
}

export const WithdrawalsManagement: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalAdmin | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          users (
            full_name,
            email
          ),
          payout_accounts (
            iban,
            account_holder_name,
            bank_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setWithdrawals((data as unknown as WithdrawalAdmin[]) || []);
    } catch (err: any) {
      console.error('Error fetching withdrawals:', err);
      toast({
        title: "Erro",
        description: "Erro ao carregar levantamentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateWithdrawalStatus = async (
    withdrawalId: string, 
    newStatus: 'paid' | 'failed', 
    notes?: string
  ) => {
    setProcessing(true);
    try {
      const updates: any = {
        status: newStatus,
        admin_notes: notes || adminNotes,
        processed_at: new Date().toISOString(),
        processed_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (newStatus === 'failed' && notes) {
        updates.failure_reason = notes;
      }

      const { error } = await supabase
        .from('withdrawals')
        .update(updates)
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({
        title: newStatus === 'paid' ? "✅ Levantamento aprovado" : "❌ Levantamento rejeitado",
        description: `O levantamento foi ${newStatus === 'paid' ? 'marcado como pago' : 'rejeitado'}`
      });

      // Refresh list and close modal
      await fetchWithdrawals();
      setSelectedWithdrawal(null);
      setAdminNotes('');
    } catch (err: any) {
      console.error('Error updating withdrawal:', err);
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();

    // Set up real-time subscription
    const channel = supabase
      .channel('withdrawals_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals'
        },
        () => {
          console.log('Withdrawal change detected');
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Processando</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Pago</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Falhado</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{pendingWithdrawals.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Pendente</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPendingAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Levantamentos</p>
                <p className="text-2xl font-bold">{withdrawals.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawals List */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Levantamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div 
                key={withdrawal.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-semibold">{withdrawal.users?.full_name || 'Utilizador não encontrado'}</p>
                      <p className="text-sm text-muted-foreground">{withdrawal.users?.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold">{formatCurrency(withdrawal.amount)}</span>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(withdrawal.created_at)}
                  </div>
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    {withdrawal.method}
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {withdrawal.payout_accounts?.account_holder_name || 'N/A'}
                  </div>
                  <div>
                    IBAN: ****{withdrawal.payout_accounts?.iban?.slice(-4) || '****'}
                  </div>
                </div>

                {withdrawal.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => setSelectedWithdrawal(withdrawal)}
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateWithdrawalStatus(withdrawal.id, 'paid')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt('Motivo da rejeição:');
                        if (reason) {
                          updateWithdrawalStatus(withdrawal.id, 'failed', reason);
                        }
                      }}
                      disabled={processing}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {withdrawals.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum levantamento encontrado</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Details Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Detalhes do Levantamento</h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-medium">Utilizador:</span> {selectedWithdrawal.users?.full_name || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {selectedWithdrawal.users?.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Valor:</span> {formatCurrency(selectedWithdrawal.amount)}
              </div>
              <div>
                <span className="font-medium">IBAN:</span> {selectedWithdrawal.payout_accounts?.iban || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Titular:</span> {selectedWithdrawal.payout_accounts?.account_holder_name || 'N/A'}
              </div>
              {selectedWithdrawal.payout_accounts?.bank_name && (
                <div>
                  <span className="font-medium">Banco:</span> {selectedWithdrawal.payout_accounts.bank_name}
                </div>
              )}
              <div>
                <span className="font-medium">Data:</span> {formatDate(selectedWithdrawal.created_at)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Notas administrativas
              </label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicionar notas sobre este levantamento..."
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => updateWithdrawalStatus(selectedWithdrawal.id, 'paid')}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {processing ? <LoadingSpinner size="sm" className="mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                Marcar como Pago
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  const reason = prompt('Motivo da rejeição:') || adminNotes;
                  if (reason) {
                    updateWithdrawalStatus(selectedWithdrawal.id, 'failed', reason);
                  }
                }}
                disabled={processing}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Rejeitar
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSelectedWithdrawal(null);
                setAdminNotes('');
              }}
              className="w-full mt-3"
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalsManagement;