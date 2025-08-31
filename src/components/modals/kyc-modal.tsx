'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Shield, CheckCircle, X, Upload, FileText } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

interface KYCModalProps {
  isOpen: boolean
  onClose: () => void
}

export function KYCModal({ isOpen, onClose }: KYCModalProps) {
  const { completedKYC } = useAuth()
  const [step, setStep] = useState<'welcome' | 'form' | 'documents' | 'success'>('welcome')
  const [formData, setFormData] = useState({
    documentType: 'cc',
    documentNumber: '',
    fullName: '',
    dateOfBirth: '',
    address: '',
    city: '',
    postalCode: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleFormSubmit = () => {
    if (!formData.documentNumber || !formData.fullName || !formData.dateOfBirth) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    setStep('documents')
  }

  const handleDocumentsSubmit = async () => {
    setIsLoading(true)
    
    // Simulate document upload and verification
    setTimeout(() => {
      setStep('success')
      setIsLoading(false)
      
      // Complete KYC and close modal after success
      setTimeout(() => {
        completedKYC()
        onClose()
        toast.success('Verificação KYC concluída!')
      }, 2000)
    }, 2000)
  }

  const handleSkip = () => {
    completedKYC()
    onClose()
    toast.info('Pode completar a verificação KYC mais tarde no seu perfil')
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        {step === 'welcome' && (
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div></div>
              <button
                onClick={handleSkip}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Verificação KYC
              </h2>
              <p className="text-muted-foreground text-sm">
                Para proteger a sua conta e cumprir regulamentações, precisamos verificar a sua identidade
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Rápido e Seguro</h3>
                  <p className="text-xs text-muted-foreground">Processo automatizado em poucos minutos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Dados Protegidos</h3>
                  <p className="text-xs text-muted-foreground">Informações encriptadas e armazenadas com segurança</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setStep('form')}
                size="lg"
                className="w-full"
              >
                Começar Verificação
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                size="lg"
                className="w-full"
              >
                Fazer mais tarde
              </Button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Dados Pessoais
              </h2>
              <p className="text-sm text-muted-foreground">
                Preencha os seus dados conforme o documento de identificação
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tipo de Documento
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="cc">Cartão de Cidadão</option>
                  <option value="passport">Passaporte</option>
                  <option value="bi">Bilhete de Identidade</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Número do Documento *
                </label>
                <input
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  placeholder="12345678 9 ZZ0"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome Completo *
                </label>
                <input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Nome conforme documento"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Morada
                </label>
                <input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, andar"
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Cidade
                  </label>
                  <input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Lisboa"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Código Postal
                  </label>
                  <input
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="1000-001"
                    className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setStep('welcome')}
                size="lg"
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleFormSubmit}
                size="lg"
                className="flex-1"
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'documents' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Upload de Documentos
              </h2>
              <p className="text-sm text-muted-foreground">
                Carregue fotos claras do seu documento de identificação
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium text-foreground mb-1">Frente do Documento</p>
                <p className="text-xs text-muted-foreground">Clique para carregar ou arraste aqui</p>
              </div>
              
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium text-foreground mb-1">Verso do Documento</p>
                <p className="text-xs text-muted-foreground">Clique para carregar ou arraste aqui</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Dicas para melhores fotos:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Certifique-se que o documento está bem iluminado</li>
                <li>• Evite reflexos e sombras</li>
                <li>• Mantenha o documento plano e inteiro na foto</li>
                <li>• Use fundo neutro</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setStep('form')}
                size="lg"
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleDocumentsSubmit}
                disabled={isLoading}
                size="lg"
                className="flex-1"
              >
                {isLoading ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Verificação Enviada!
            </h2>
            <p className="text-muted-foreground mb-6">
              Os seus documentos foram enviados com sucesso. Iremos analisar e contactá-lo em breve.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800">
                <strong>Próximos passos:</strong> A verificação demora normalmente 1-2 dias úteis. Receberá uma notificação quando estiver concluída.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}