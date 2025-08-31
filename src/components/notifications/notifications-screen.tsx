'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Bell, CreditCard, Users, Trophy, Crown, Check, X } from 'lucide-react'

interface Notification {
  id: string
  type: 'payment' | 'invite' | 'draw' | 'vip'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'payment',
    title: 'Pagamento Pendente',
    message: 'Próximo pagamento do grupo "Família Santos" vence em 2 dias',
    timestamp: '2024-01-15T10:30:00Z',
    read: false
  },
  {
    id: '2',
    type: 'draw',
    title: 'Sorteio Realizado',
    message: 'Maria João foi contemplada no grupo "Família Santos" - €800',
    timestamp: '2024-01-14T18:45:00Z',
    read: false
  },
  {
    id: '3',
    type: 'invite',
    title: 'Convite Aceite',
    message: 'Pedro Costa aceitou o seu convite para o grupo "Tech Founders"',
    timestamp: '2024-01-14T15:20:00Z',
    read: true
  },
  {
    id: '4',
    type: 'vip',
    title: 'VIP Atribuído',
    message: 'Parabéns! Ganhou 1 mês VIP por convidar um amigo',
    timestamp: '2024-01-13T12:10:00Z',
    read: true
  },
  {
    id: '5',
    type: 'payment',
    title: 'Depósito Confirmado',
    message: 'Depósito de €500 processado com sucesso via Stripe',
    timestamp: '2024-01-12T09:15:00Z',
    read: true
  }
]

export function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-5 h-5 text-blue-600" />
      case 'invite':
        return <Users className="w-5 h-5 text-green-600" />
      case 'draw':
        return <Trophy className="w-5 h-5 text-purple-600" />
      case 'vip':
        return <Crown className="w-5 h-5 text-yellow-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Agora mesmo'
    if (diffInHours < 24) return `há ${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `há ${diffInDays}d`
    
    return date.toLocaleDateString('pt-PT')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-6 pt-14 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 bg-card/20 backdrop-blur-sm rounded-xl hover:bg-card/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary-foreground">Notificações</h1>
            {unreadCount > 0 && (
              <p className="text-primary-foreground/80 text-sm">{unreadCount} não lida{unreadCount !== 1 ? 's' : ''}</p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllAsRead}
              className="bg-card/20 hover:bg-card/30 text-primary-foreground border-0"
            >
              Marcar todas
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Sem notificações</h3>
            <p className="text-sm text-muted-foreground">
              Quando tiver notificações importantes, elas aparecerão aqui
            </p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-4 transition-all ${
                notification.read ? 'bg-background' : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  notification.type === 'payment' ? 'bg-blue-100' :
                  notification.type === 'invite' ? 'bg-green-100' :
                  notification.type === 'draw' ? 'bg-purple-100' :
                  notification.type === 'vip' ? 'bg-yellow-100' :
                  'bg-gray-100'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-semibold text-sm ${
                      notification.read ? 'text-foreground' : 'text-foreground'
                    }`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <Badge variant="secondary" className="bg-primary text-primary-foreground text-xs px-2 py-0.5">
                        Nova
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    
                    <div className="flex gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Marcar como lida"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}