import React, { useState } from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Crown,
  Users,
  Percent,
  Calendar,
  Check,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const PlansManagement: React.FC = () => {
  const { planConfigs, promotions, updatePlanConfig, createPromotion, togglePromotion } = useAdminStore();
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editedPlan, setEditedPlan] = useState<any>({});
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    discountPercent: 0,
    durationDays: 30,
    isActive: true
  });

  const handleEditPlan = (planName: string) => {
    const plan = planConfigs.find(p => p.name === planName);
    if (plan) {
      setEditedPlan({ ...plan });
      setEditingPlan(planName);
    }
  };

  const handleSavePlan = () => {
    if (editingPlan) {
      updatePlanConfig(editingPlan, editedPlan);
      setEditingPlan(null);
      setEditedPlan({});
    }
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setEditedPlan({});
  };

  const handleCreatePromotion = () => {
    if (newPromotion.name.trim()) {
      createPromotion(newPromotion);
      setNewPromotion({
        name: '',
        discountPercent: 0,
        durationDays: 30,
        isActive: true
      });
      setShowPromotionForm(false);
    }
  };

  const addFeature = () => {
    setEditedPlan({
      ...editedPlan,
      features: [...(editedPlan.features || []), '']
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...(editedPlan.features || [])];
    newFeatures[index] = value;
    setEditedPlan({
      ...editedPlan,
      features: newFeatures
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = editedPlan.features.filter((_: any, i: number) => i !== index);
    setEditedPlan({
      ...editedPlan,
      features: newFeatures
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Planos</h2>
          <p className="text-gray-600">
            Configure preços, funcionalidades e promoções
          </p>
        </div>
      </div>

      {/* Plans Configuration */}
      <div className="grid gap-6 lg:grid-cols-2">
        {planConfigs.map((plan) => (
          <Card key={plan.name} className={`${plan.name === 'vip' ? 'ring-2 ring-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {plan.name === 'vip' ? (
                    <Crown className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Users className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="capitalize font-bold">
                    {plan.name === 'free' ? 'Plano Gratuito' : 'Plano VIP'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={plan.isActive}
                    onCheckedChange={(checked) => updatePlanConfig(plan.name, { isActive: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPlan(plan.name)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {editingPlan === plan.name ? (
                <div className="space-y-4">
                  {/* Price Editing */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Preço Mensal</label>
                      <Input
                        type="number"
                        value={editedPlan.monthlyPrice || 0}
                        onChange={(e) => setEditedPlan({
                          ...editedPlan,
                          monthlyPrice: parseFloat(e.target.value) || 0
                        })}
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Preço Anual</label>
                      <Input
                        type="number"
                        value={editedPlan.yearlyPrice || 0}
                        onChange={(e) => setEditedPlan({
                          ...editedPlan,
                          yearlyPrice: parseFloat(e.target.value) || 0
                        })}
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Max Groups */}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Máximo de Grupos (-1 = ilimitado)
                    </label>
                    <Input
                      type="number"
                      value={editedPlan.maxGroups || 0}
                      onChange={(e) => setEditedPlan({
                        ...editedPlan,
                        maxGroups: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>

                  {/* Features Editing */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">Funcionalidades</label>
                      <Button variant="outline" size="sm" onClick={addFeature}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {(editedPlan.features || []).map((feature: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={feature}
                            onChange={(e) => updateFeature(index, e.target.value)}
                            placeholder="Funcionalidade..."
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFeature(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSavePlan} size="sm">
                      <Check className="w-4 h-4 mr-1" />
                      Guardar
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} size="sm">
                      <X className="w-4 h-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Display Mode */}
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-gray-900 mb-1">
                      {plan.monthlyPrice === 0 ? 'Gratuito' : formatCurrency(plan.monthlyPrice)}
                    </div>
                    {plan.monthlyPrice > 0 && (
                      <div className="text-sm text-gray-500">
                        {formatCurrency(plan.yearlyPrice)}/ano (poupança de {formatCurrency((plan.monthlyPrice * 12) - plan.yearlyPrice)})
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Grupos permitidos: </span>
                      <span className={plan.maxGroups === -1 ? 'text-green-600 font-semibold' : ''}>
                        {plan.maxGroups === -1 ? 'Ilimitados' : plan.maxGroups}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Funcionalidades:</h4>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Promotions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Promoções Ativas
            </CardTitle>
            <Button onClick={() => setShowPromotionForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Promoção
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {showPromotionForm && (
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
              <h4 className="font-medium">Criar Nova Promoção</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Promoção</label>
                  <Input
                    value={newPromotion.name}
                    onChange={(e) => setNewPromotion({
                      ...newPromotion,
                      name: e.target.value
                    })}
                    placeholder="Ex: Desconto de Verão"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Desconto (%)</label>
                  <Input
                    type="number"
                    value={newPromotion.discountPercent}
                    onChange={(e) => setNewPromotion({
                      ...newPromotion,
                      discountPercent: parseInt(e.target.value) || 0
                    })}
                    min="1"
                    max="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Duração (dias)</label>
                  <Input
                    type="number"
                    value={newPromotion.durationDays}
                    onChange={(e) => setNewPromotion({
                      ...newPromotion,
                      durationDays: parseInt(e.target.value) || 30
                    })}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch 
                  checked={newPromotion.isActive}
                  onCheckedChange={(checked) => setNewPromotion({
                    ...newPromotion,
                    isActive: checked
                  })}
                />
                <span className="text-sm">Ativar imediatamente</span>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCreatePromotion}>
                  Criar Promoção
                </Button>
                <Button variant="outline" onClick={() => setShowPromotionForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Existing Promotions */}
          <div className="space-y-3">
            {promotions.map((promotion) => (
              <div key={promotion.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-gray-900">{promotion.name}</h4>
                    <Badge variant={promotion.isActive ? "default" : "secondary"}>
                      {promotion.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Badge variant="outline">
                      {promotion.discountPercent}% de desconto
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{promotion.durationDays} dias</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{promotion.usageCount} utilizações</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={promotion.isActive}
                    onCheckedChange={() => togglePromotion(promotion.id)}
                  />
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {promotions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Percent className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma promoção criada ainda</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlansManagement;