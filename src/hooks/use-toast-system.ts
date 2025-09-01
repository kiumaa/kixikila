'use client'

import { toast } from 'sonner'
import { useActionFeedback } from '@/hooks/use-haptic-feedback'

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface ToastOptions {
  title?: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  haptic?: boolean
}

export function useToastSystem() {
  const { success, error: errorHaptic, buttonPress } = useActionFeedback()

  const showToast = (type: ToastType, message: string, options: ToastOptions = {}) => {
    const { 
      title, 
      description = message, 
      duration, 
      action, 
      haptic = true 
    } = options

    // Haptic feedback based on toast type
    if (haptic) {
      switch (type) {
        case 'success':
          success()
          break
        case 'error':
          errorHaptic()
          break
        case 'warning':
          buttonPress()
          break
        case 'info':
          buttonPress()
          break
      }
    }

    const toastOptions = {
      duration: duration || (type === 'error' ? 6000 : 4000),
      action: action ? {
        label: action.label,
        onClick: () => {
          buttonPress()
          action.onClick()
        }
      } : undefined
    }

    switch (type) {
      case 'success':
        return toast.success(title || description, toastOptions)
      case 'error':
        return toast.error(title || description, toastOptions)
      case 'warning':
        return toast.warning(title || description, toastOptions)
      case 'info':
        return toast.info(title || description, toastOptions)
      case 'loading':
        return toast.loading(title || description, { duration: Infinity })
    }
  }

  // Predefined toast patterns for common scenarios
  const toasts = {
    // Authentication
    loginSuccess: () => showToast('success', 'Sessão iniciada com sucesso!'),
    loginError: (message?: string) => showToast('error', message || 'Erro ao iniciar sessão'),
    logoutSuccess: () => showToast('success', 'Sessão terminada com sucesso'),
    
    // Groups
    groupCreated: (groupName: string) => showToast('success', `Grupo "${groupName}" criado com sucesso!`),
    groupJoined: (groupName: string) => showToast('success', `Entrou no grupo "${groupName}" com sucesso!`),
    groupError: (message?: string) => showToast('error', message || 'Erro ao processar operação do grupo'),
    
    // Payments
    paymentSuccess: (amount: string) => showToast('success', `Pagamento de ${amount} realizado com sucesso!`),
    paymentPending: (amount: string) => showToast('info', `Pagamento de ${amount} está a ser processado...`),
    paymentError: (message?: string) => showToast('error', message || 'Erro ao processar pagamento'),
    
    // Wallet
    depositSuccess: (amount: string) => showToast('success', `Depósito de ${amount} confirmado!`),
    withdrawalSuccess: (amount: string) => showToast('success', `Levantamento de ${amount} solicitado!`),
    withdrawalPending: () => showToast('info', 'Levantamento a ser processado...'),
    insufficientFunds: () => showToast('error', 'Saldo insuficiente para esta operação'),
    
    // Network & Sync
    connectionRestored: () => showToast('success', 'Conexão restaurada! A sincronizar dados...'),
    offlineMode: () => showToast('warning', 'Sem conexão. Dados serão sincronizados quando voltar online.'),
    syncComplete: () => showToast('success', 'Dados sincronizados com sucesso!'),
    syncError: () => showToast('error', 'Erro na sincronização. A tentar novamente...'),
    
    // General
    saveSuccess: () => showToast('success', 'Dados guardados com sucesso!'),
    saveError: () => showToast('error', 'Erro ao guardar dados. Tente novamente.'),
    copySuccess: (item?: string) => showToast('success', `${item || 'Conteúdo'} copiado para a área de transferência!`),
    
    // Form validation
    requiredFields: () => showToast('warning', 'Preencha todos os campos obrigatórios'),
    invalidFormat: (field: string) => showToast('error', `Formato inválido para ${field}`),
    
    // Custom toast with action
    withAction: (message: string, actionLabel: string, actionCallback: () => void) => 
      showToast('info', message, {
        action: {
          label: actionLabel,
          onClick: actionCallback
        }
      }),
    
    // Loading states
    loading: (message: string) => showToast('loading', message),
    dismiss: toast.dismiss
  }

  return toasts
}