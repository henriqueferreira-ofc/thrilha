import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';
import { Notification } from '../types/collaboration';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bell, Check } from 'lucide-react';

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao carregar notificações');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) throw error;
            setNotifications(notifications.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            ));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao marcar notificação como lida');
        }
    };

    useEffect(() => {
        loadNotifications();

        // Configurar subscription para notificações em tempo real
        const subscription = supabase
            .channel('notifications')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'notifications' 
            }, () => {
                loadNotifications();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notificações
                    {unreadCount > 0 && (
                        <Badge variant="secondary">{unreadCount}</Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                ) : (
                    notifications.map((notification) => (
                        <div 
                            key={notification.id}
                            className={`p-4 rounded-lg border ${
                                notification.read ? 'bg-muted' : 'bg-background'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-medium">{notification.type}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(notification.created_at).toLocaleString()}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <p className="mt-2 text-sm">
                                {JSON.stringify(notification.content)}
                            </p>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
} 