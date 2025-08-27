import React, { useState } from 'react';
import { Users, Target, Sparkles, ArrowLeft, ArrowRight, Euro, Calendar, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Modal } from '@/components/design-system/Modal';
import { Card, CardContent } from '@/components/ui/card';
import { PlanLimitNotice } from '@/components/common/PlanLimitNotice';
import { useToast } from '@/hooks/use-toast';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency } from '@/data/mockData';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVIP?: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onNavigateToVIP
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    groupType: '',
    name: '',
    description: '',
    contributionAmount: '',
    maxMembers: '',
    frequency: 'monthly',
    privacy: 'public'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { canCreateGroup, userPlan, addGroup } = useAppStore();

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    // Check group limit before proceeding
    if (!canCreateGroup()) {
      toast({
        title: "Limite Atingido",
        description: "Plano gratuito permite até 2 grupos. Torna-te VIP para criar mais.",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Add mock group to store
      const newGroup = {
        id: Date.now(),
        name: formData.name,
        description: formData.description,
        contributionAmount: parseFloat(formData.contributionAmount),
        frequency: 'mensal' as const,
        maxMembers: parseInt(formData.maxMembers),
        currentMembers: 1,
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active' as const,
        adminId: 1,
        cycle: 1,
        groupType: formData.groupType as 'lottery' | 'order',
        totalPool: parseFloat(formData.contributionAmount),
        startDate: new Date().toISOString().split('T')[0],
        privacy: formData.privacy as 'public' | 'private',
        category: 'family' as const,
        members: [{
          id: 1,
          name: "Ana Santos",
          avatar: "AS",
          paid: false,
          isWinner: false,
          isAdmin: true
        }],
        history: []
      };

      addGroup(newGroup);
      
      setIsLoading(false);
      onClose();
      setStep(1);
      setFormData({
        groupType: '',
        name: '',
        description: '',
        contributionAmount: '',
        maxMembers: '',
        frequency: 'monthly',
        privacy: 'public'
      });
      
      toast({
        title: "✅ Grupo criado com sucesso!",
        description: `O grupo "${formData.name}" foi criado. Convide os seus amigos!`
      });
    }, 2000);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.groupType !== '';
      case 2:
        return formData.name.trim() !== '' && formData.description.trim() !== '';
      case 3:
        return formData.contributionAmount !== '' && formData.maxMembers !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  const totalAmount = formData.contributionAmount && formData.maxMembers
    ? parseFloat(formData.contributionAmount) * parseInt(formData.maxMembers)
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Criar Novo Grupo - Passo ${step} de 4`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Plan Limit Notice for Free Users */}
        {userPlan === 'free' && (
          <PlanLimitNotice showCloseButton={false} onNavigateToVIP={onNavigateToVIP} />
        )}

        {/* Progress Bar */}
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((num) => (
            <div
              key={num}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                num <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Group Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold font-system text-foreground mb-2">
                Escolha o tipo de grupo
              </h3>
              <p className="text-muted-foreground text-sm">
                Selecione como será definido o próximo contemplado
              </p>
            </div>

            <div className="grid gap-4">
              <Card
                className={`cursor-pointer ios-card transition-all ${
                  formData.groupType === 'lottery'
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setFormData({ ...formData, groupType: 'lottery' })}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <Sparkles className="w-12 h-12 text-primary mx-auto" />
                  <div>
                    <h4 className="font-semibold font-system text-foreground">
                      Grupo por Sorteio
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      O próximo contemplado é escolhido por sorteio aleatório
                    </p>
                  </div>
                  {formData.groupType === 'lottery' && (
                    <div className="flex items-center justify-center gap-1 text-primary text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Selecionado
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer ios-card transition-all ${
                  formData.groupType === 'order'
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setFormData({ ...formData, groupType: 'order' })}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <Target className="w-12 h-12 text-success mx-auto" />
                  <div>
                    <h4 className="font-semibold font-system text-foreground">
                      Grupo por Ordem
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Os membros definem a ordem de quem recebe primeiro
                    </p>
                  </div>
                  {formData.groupType === 'order' && (
                    <div className="flex items-center justify-center gap-1 text-primary text-sm font-medium">
                      <Check className="w-4 h-4" />
                      Selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold font-system text-foreground mb-2">
                Informações básicas
              </h3>
              <p className="text-muted-foreground text-sm">
                Defina o nome e descrição do seu grupo
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Nome do grupo
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Família Santos"
                  className="ios-input mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium text-foreground">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Poupança familiar para férias de verão"
                  className="ios-input mt-2 min-h-[80px]"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">
                  Privacidade
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    type="button"
                    variant={formData.privacy === 'public' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, privacy: 'public' })}
                    className="ios-button text-xs py-2"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Público
                  </Button>
                  <Button
                    type="button"
                    variant={formData.privacy === 'private' ? 'default' : 'outline'}
                    onClick={() => setFormData({ ...formData, privacy: 'private' })}
                    className="ios-button text-xs py-2"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Privado
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Financial Details */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold font-system text-foreground mb-2">
                Configurações financeiras
              </h3>
              <p className="text-muted-foreground text-sm">
                Defina o valor e número de participantes
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                  Valor da contribuição mensal
                </Label>
                <div className="relative mt-2">
                  <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    id="amount"
                    type="number"
                    value={formData.contributionAmount}
                    onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                    placeholder="100.00"
                    className="ios-input pl-12"
                    min="10"
                    max="5000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="members" className="text-sm font-medium text-foreground">
                  Número máximo de membros
                </Label>
                <Input
                  id="members"
                  type="number"
                  value={formData.maxMembers}
                  onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                  placeholder="8"
                  className="ios-input mt-2"
                  min="3"
                  max="20"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">
                  Frequência dos pagamentos
                </Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <Button
                    type="button"
                    variant="default"
                    className="ios-button justify-start text-xs py-2"
                    disabled
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Mensal (dia 15)
                  </Button>
                </div>
              </div>

              {totalAmount > 0 && (
                <Card className="ios-card bg-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      Valor total do grupo por ciclo
                    </div>
                    <div className="text-xl font-bold font-system text-primary">
                      {formatCurrency(totalAmount)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Summary & Confirmation */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold font-system text-foreground mb-2">
                Confirmar criação
              </h3>
              <p className="text-muted-foreground text-sm">
                Revise as informações do seu grupo
              </p>
            </div>

            <Card className="ios-card">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  {formData.groupType === 'lottery' ? (
                    <Sparkles className="w-8 h-8 text-primary" />
                  ) : (
                    <Target className="w-8 h-8 text-success" />
                  )}
                  <div>
                    <h4 className="font-semibold font-system text-foreground">
                      {formData.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formData.groupType === 'lottery' ? 'Grupo por Sorteio' : 'Grupo por Ordem'}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  {formData.description}
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Contribuição:</span>
                    <div className="font-semibold text-foreground">
                      {formatCurrency(parseFloat(formData.contributionAmount || '0'))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Máx. membros:</span>
                    <div className="font-semibold text-foreground">
                      {formData.maxMembers}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total por ciclo:</span>
                    <div className="font-semibold text-primary">
                      {formatCurrency(totalAmount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Privacidade:</span>
                    <div className="font-semibold text-foreground">
                      {formData.privacy === 'public' ? 'Público' : 'Privado'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1 ios-button text-xs py-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          
          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 ios-button text-xs py-2"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !canCreateGroup()}
              className="flex-1 ios-button text-xs py-2"
            >
              {isLoading ? 'Criando...' : !canCreateGroup() ? 'Limite Atingido' : 'Criar Grupo'}
              {!isLoading && canCreateGroup() && <Check className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};