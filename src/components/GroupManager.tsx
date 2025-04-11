import React, { useState } from 'react';
import { useCollaboration } from '../hooks/useCollaboration';
import { WorkGroup, GroupMember } from '../types/collaboration';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';

export function GroupManager() {
    const { groups, loading, error, createGroup, addMember } = useCollaboration();
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<WorkGroup | null>(null);
    const [newMemberEmail, setNewMemberEmail] = useState('');

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName) return;

        const group = await createGroup(newGroupName, newGroupDescription);
        if (group) {
            setNewGroupName('');
            setNewGroupDescription('');
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup || !newMemberEmail) return;

        // Aqui você precisaria buscar o ID do usuário pelo email
        // Por enquanto, vamos apenas mostrar uma mensagem
        console.log(`Adicionar membro ${newMemberEmail} ao grupo ${selectedGroup.id}`);
        setNewMemberEmail('');
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Criar Novo Grupo</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                        <Input
                            placeholder="Nome do grupo"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                        />
                        <Input
                            placeholder="Descrição (opcional)"
                            value={newGroupDescription}
                            onChange={(e) => setNewGroupDescription(e.target.value)}
                        />
                        <Button type="submit">Criar Grupo</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                    <Card 
                        key={group.id}
                        className={`cursor-pointer ${selectedGroup?.id === group.id ? 'border-primary' : ''}`}
                        onClick={() => setSelectedGroup(group)}
                    >
                        <CardHeader>
                            <CardTitle>{group.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{group.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {selectedGroup && (
                <Card>
                    <CardHeader>
                        <CardTitle>Gerenciar Membros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddMember} className="space-y-4">
                            <Input
                                placeholder="Email do novo membro"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                            />
                            <Button type="submit">Adicionar Membro</Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 