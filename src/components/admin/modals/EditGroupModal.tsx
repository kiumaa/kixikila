import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/design-system/Avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAdminStore } from '@/store/useAdminStore';
import { Users, Calendar, Euro, Settings, Trash2, Pause, Play } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface EditGroupModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditGroupModal: React.FC<EditGroupModalProps> = ({ group, isOpen, onClose }) => {
  const { toast } = useToast();
  const { updateGroup, deleteGroup, freezeGroup } = useAdminStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    contributionAmount: group?.contributionAmount || 0,
    maxMembers: group?.maxMembers || 0,
    frequency: group?.frequency || 'mensal',
    category: group?.category || 'family',
    privacy: group?.privacy || 'public',
    status: group?.status || 'active'
  });

  React.useEffect(() => {
    if (group) {
      setFormData({
        name: group.name,
        description: group.description,
        contributionAmount: group.contributionAmount,
        maxMembers: group.maxMembers,
        frequency: group.frequency,
        category: group.category,
        privacy: group.privacy,
        status: group.status
      });
    }
  }, [group]);

  const handleSave = async () => {
    if (!group) return;
    
    setIsSubmitting(true);
    
    try {
      updateGroup(group.id, formData as Partial<Group>);
      
      toast({
        title: "Grupo atualizado",
        description: `O grupo "${group.name}" foi atualizado com sucesso.`,
        variant: "default"
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar o grupo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = () => {
    if (!group) return;
    
    const confirmed = window.confirm(
      `Tem a certeza que deseja eliminar o grupo "${group.name}"? Esta ação não pode ser revertida e todos os dados serão perdidos.`
    );
    
    if (confirmed) {
      try {
        deleteGroup(group.id);
        toast({
          title: "Grupo eliminado",
          description: `O grupo "${group.name}" foi eliminado permanentemente.`,
          variant: "destructive"
        });
        onClose();
      } catch (error) {
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao eliminar o grupo.",
          variant: "destructive"
        });
      }
    }
  };

  const handleFreezeGroup = () => {
    if (!group) return;
    
    const action = group.status === 'active' ? 'congelar' : 'reativar';
    const confirmed = window.confirm(
      `Tem a certeza que deseja ${action} o grupo "${group.name}"?`
    );
    
    if (confirmed) {
      try {
        freezeGroup(group.id);
        toast({
          title: `Grupo ${group.status === 'active' ? 'congelado' : 'reativado'}`,
          description: `O grupo "${group.name}" foi ${group.status === 'active' ? 'congelado' : 'reativado'}.`,
          variant: "default"
        });
        onClose();
      } catch (error) {
        toast({
          title: "Erro",
          description: `Ocorreu um erro ao ${action} o grupo.`,
          variant: "destructive"
        });
      }
    }
  };

  if (!group) return null;

  const paidMembers = group.members?.filter(m => m.paid).length || 0;
  const totalMembers = group.members?.length || 0;
  const progress = totalMembers > 0 ? (paidMembers / totalMembers) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Users className="w-6 h-6" />
            <div>
              <div>Gerir Grupo</div>
              <div className="text-sm font-normal text-gray-500">{group.name}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Grupo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Família</SelectItem>
                    <SelectItem value="travel">Viagens</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                    <SelectItem value="hobby">Hobby</SelectItem>
                    <SelectItem value="emergency">Emergência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="contribution">Valor de Contribuição (€)</Label>
                <Input
                  id="contribution"
                  type="number"
                  value={formData.contributionAmount}
                  onChange={(e) => setFormData({ ...formData, contributionAmount: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="maxMembers">Máximo de Membros</Label>
                <Input
                  id="maxMembers"
                  type="number"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="frequency">Frequência</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="privacy">Privacidade</Label>
                <Select value={formData.privacy} onValueChange={(value) => setFormData({ ...formData, privacy: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="invite_only">Apenas por Convite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Group Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{formatCurrency(group.totalPool)}</div>
                  <div className="text-xs text-gray-500">Valor Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{group.cycle || 1}º</div>
                  <div className="text-xs text-gray-500">Ciclo Atual</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{totalMembers}</div>
                  <div className="text-xs text-gray-500">Membros</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
                  <div className="text-xs text-gray-500">Pagamentos</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Membros do Grupo ({totalMembers})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.members?.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.avatar} size="sm" />
                        <div>
                          <p className="font-medium">{member.name}</p>
                          {member.isAdmin && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.position && (
                          <Badge variant="outline">#{member.position}</Badge>
                        )}
                        <Badge variant={member.paid ? "default" : "secondary"}>
                          {member.paid ? "Pago" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum membro encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Histórico de Ciclos</CardTitle>
              </CardHeader>
              <CardContent>
                {group.history && group.history.length > 0 ? (
                  <div className="space-y-3">
                    {group.history.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">Ciclo {item.cycle}</p>
                          <p className="text-sm text-gray-600">Contemplado: {item.winner}</p>
                          <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(item.amount)}</p>
                          <Badge variant="outline">Concluído</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Ainda não há histórico de ciclos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            onClick={handleDeleteGroup}
            variant="destructive"
            className="mr-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar Grupo
          </Button>
          
          <Button
            onClick={handleFreezeGroup}
            variant="outline"
            className={group.status === 'pending' ? 'text-green-600' : 'text-yellow-600'}
          >
            {group.status === 'pending' ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Reativar
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Congelar
              </>
            )}
          </Button>
          
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

export default EditGroupModal;