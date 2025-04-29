
export type GroupRole = 'owner' | 'admin' | 'member';
export type PermissionLevel = 'read' | 'write' | 'admin';

export interface WorkGroup {
    id: string;
    name: string;
    description?: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface GroupMember {
    id: string;
    group_id: string;
    user_id: string;
    role: GroupRole;
    joined_at: string;
}

export interface TaskPermission {
    id: string;
    task_id: string;
    group_id: string;
    permission_level: PermissionLevel;
    created_at: string;
}

export interface Notification {
    id: string;
    user_id: string;
    type: string;
    content: Record<string, any>;
    read: boolean;
    created_at: string;
}

export interface GroupWithMembers extends WorkGroup {
    members: GroupMember[];
}

export interface TaskWithPermissions {
    task_id: string;
    permissions: TaskPermission[];
}

export interface Collaborator {
    id: string;
    owner_id: string;
    collaborator_id: string;
    created_at: string;
    full_name: string;
    email: string; // Added this missing property
}

export interface Invite {
    id: string;
    email: string;
    status: string;
    created_at: string;
    expires_at: string;
    owner_id: string;
    token: string;
}
