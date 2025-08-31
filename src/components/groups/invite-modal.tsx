'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { X, Mail, Plus, Trash2, Send, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface InviteModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
}

export function InviteModal({ isOpen, onClose, groupId, groupName }: InviteModalProps) {
  const [emails, setEmails] = useState([''])
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const addEmailField = () => {
    setEmails([...emails, ''])
  }

  const removeEmailField = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails]
    newEmails[index] = value
    setEmails(newEmails)
  }

  const handleSendInvites = async () => {
    const validEmails = emails.filter(email => email.trim() && isValidEmail(email.trim()))
    
    if (validEmails.length === 0) {
      toast.error('Por favor, adicione pelo menos um email válido')
      return
    }

    try {
      setIsSubmitting(true)

      const { data, error } = await supabase.functions.invoke('send-group-invitation', {
        body: {
          groupId,
          emails: validEmails,
          message: message.trim()
        }
      })

      if (error) throw error

      const successCount = data.results.filter((r: any) => r.success).length
      toast.success(`${successCount} convites enviados com sucesso!`)
      
      // Reset form
      setEmails([''])
      setMessage('')
      onClose()

    } catch (error: any) {
      console.error('Error sending invites:', error)
      toast.error('Erro ao enviar convites: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validEmailsCount = emails.filter(email => email.trim() && isValidEmail(email.trim())).length

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Convidar Membros</h2>
              <p className="text-sm text-muted-foreground">{groupName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Email Fields */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Emails dos Convidados
            </label>
            <div className="space-y-3">
              {emails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    className={`flex-1 ${
                      email.trim() && !isValidEmail(email.trim()) 
                        ? 'border-red-300 focus:ring-red-500' 
                        : ''
                    }`}
                  />
                  {emails.length > 1 && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => removeEmailField(index)}
                      className="px-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            <Button
              variant="secondary"
              size="sm"
              onClick={addEmailField}
              className="mt-3"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Email
            </Button>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Mensagem Personalizada (Opcional)
            </label>
            <textarea
              placeholder="Adicione uma mensagem pessoal ao convite..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/500 caracteres
            </p>
          </div>

          {/* Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Pré-visualização
            </h4>
            <div className="text-sm space-y-2">
              <p>
                <strong>Assunto:</strong> Convite para o grupo "{groupName}" - KIXIKILA
              </p>
              <p>
                <strong>Convidados:</strong> {validEmailsCount} pessoa{validEmailsCount !== 1 ? 's' : ''}
              </p>
              {message.trim() && (
                <div>
                  <strong>Mensagem:</strong>
                  <div className="bg-primary/10 rounded p-2 mt-1 text-xs">
                    {message.trim()}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendInvites}
              disabled={validEmailsCount === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar {validEmailsCount > 0 && `(${validEmailsCount})`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}