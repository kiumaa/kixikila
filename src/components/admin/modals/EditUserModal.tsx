import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/design-system/Avatar';
import { useToast } from '@/hooks/use-toast';
import { useAdminStore } from '@/store/useAdminStore';
import { User, Phone, Mail, Calendar, Shield, CreditCard, Activity, FileText } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { type AdminUser } from '@/store/useAdminStore';

interface EditUserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose }) => {
  const { toast } = useToast();
  const { updateUserData, banUser, unbanUser, updateUserPlan } = useAdminStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    status: user?.status || 'active',
    kycStatus: user?.kycStatus || 'pending',
    isVIP: user?.isVIP || false
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        kycStatus: user.kycStatus,
        isVIP: user.isVIP
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Update user data
      updateUserData(user.id, formData);
      
      // Update VIP plan if changed
      if (formData.isVIP !== user.isVIP) {
        updateUserPlan(user.id, formData.isVIP ? 'vip' : 'free');
      }
      
      toast({
        title: "Utilizador atualizado",
        description: `Os dados de ${user.name} foram atualizados com sucesso.`,
        variant: "default"
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o utilizador.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBanUser = async () => {
    if (!user) return;
    
    const reason = prompt("Motivo do banimento:");
    if (!reason) return;
    
    try {
      banUser(user.id, reason);
      toast({
        title: "Utilizador banido",
        description: `${user.name} foi banido da plataforma.`,
        variant: "destructive"
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao banir o utilizador.",
        variant: "destructive"
      });
    }
  };

  const handleUnbanUser = async () => {
    if (!user) return;
    
    try {
      unbanUser(user.id);
      toast({
        title: "Utilizador reativado",
        description: `${user.name} foi reativado na plataforma.`,
        variant: "default"
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao reativar o utilizador.",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar name={user.avatar} size="md" verified={user.kycStatus === 'verified'} />
            <div>
              <div>Gerir Utilizador</div>
              <div className="text-sm font-normal text-gray-500">{user.name}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="groups">Grupos</TabsTrigger>
            <TabsTrigger value="activity">Atividade</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="banned">Banido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="kycStatus">Estado KYC</Label>
                <Select value={formData.kycStatus} onValueChange={(value) => setFormData({ ...formData, kycStatus: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="verified">Verificado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="vip"
                  checked={formData.isVIP}
                  onCheckedChange={(checked) => setFormData({ ...formData, isVIP: checked })}
                />
                <Label htmlFor="vip">Plano VIP</Label>
              </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{formatCurrency(user.walletBalance)}</div>
                  <div className="text-xs text-gray-500">Saldo</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{user.activeGroups || 0}</div>
                  <div className="text-xs text-gray-500">Grupos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{user.trustScore}%</div>
                  <div className="text-xs text-gray-500">Trust Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{user.completedCycles}</div>
                  <div className="text-xs text-gray-500">Ciclos</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="groups" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Grupos do Utilizador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Lista de grupos será implementada</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Login realizado</p>
                      <p className="text-xs text-gray-500">{formatDateTime(user.lastLogin)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium">Conta criada</p>
                      <p className="text-xs text-gray-500">{formatDateTime(user.joinDate)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end pt-4 border-t">
          {user.status === 'banned' ? (
            <Button
              onClick={handleUnbanUser}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              Reativar Utilizador
            </Button>
          ) : (
            <Button
              onClick={handleBanUser}
              variant="destructive"
            >
              Banir Utilizador
            </Button>
          )}
          
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "A guardar..." : "Guardar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;