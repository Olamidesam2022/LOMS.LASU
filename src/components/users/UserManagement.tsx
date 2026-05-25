import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Shield, 
  User as UserIcon,
  Mail,
  Building2,
  MoreHorizontal,
  Edit,
  Trash2,
  Key
} from 'lucide-react';
import { User, UserRole } from '@/types/legal';
import { cn } from '@/lib/utils';

interface UserManagementProps {
  users: User[];
  currentUser: User;
  onAddUser?: () => void;
  onEditUser?: (user: User) => void;
  onDeactivateUser?: (user: User) => void;
}

const roleStyles: Record<UserRole, { label: string; color: string }> = {
  superadmin: { label: 'Superadmin', color: 'bg-primary text-primary-foreground' },
  admin: { label: 'Administrator', color: 'bg-accent/20 text-accent-foreground' },
  staff: { label: 'Staff', color: 'bg-info/10 text-info' },
};

export function UserManagement({ users, currentUser, onAddUser, onEditUser, onDeactivateUser }: UserManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">
            Role-based access control (RBAC) administration
          </p>
        </div>
        <button 
          onClick={onAddUser}
          className="gold-button flex items-center gap-2 rounded-lg px-4 py-2.5"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Role Distribution */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="elevated-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/20 p-2.5">
              <Shield className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-muted-foreground">Administrators</p>
            </div>
          </div>
        </div>
        <div className="elevated-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-info/10 p-2.5">
              <UserIcon className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {users.filter(u => u.role === 'staff').length}
              </p>
              <p className="text-sm text-muted-foreground">Staff</p>
            </div>
          </div>
        </div>
        <div className="elevated-card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2.5">
              <Key className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'superadmin', 'admin', 'staff'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                roleFilter === role 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {role === 'all' ? 'All Roles' : roleStyles[role].label}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="clean-list">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem_auto] gap-3 px-4 py-2 text-xs font-bold uppercase text-muted-foreground md:grid">
          <span>User</span>
          <span>Department</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        {filteredUsers.map((user, index) => {
          const isCurrentUser = user.id === currentUser.id;
          
          return (
            <div
              key={user.id}
              className={cn(
                "clean-list-row animate-fade-in md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_9rem_auto] md:items-center",
                isCurrentUser && "bg-primary/5"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h4 className="truncate font-bold text-foreground">
                    {user.name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">(You)</span>
                    )}
                  </h4>
                  <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span className="truncate">{user.department}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("status-pill", roleStyles[user.role].color)}>
                  {roleStyles[user.role].label}
                </span>
                {user.status && (
                  <span className="text-xs text-muted-foreground">{user.status}</span>
                )}
              </div>

              <div className="flex items-center gap-1 md:justify-end">
                <button onClick={() => onEditUser?.(user)} className="icon-button">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => onEditUser?.(user)} className="icon-button">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeactivateUser?.(user)}
                  className={cn(
                    "icon-button",
                    isCurrentUser
                      ? "cursor-not-allowed text-muted-foreground/50"
                      : "hover:bg-destructive/10 hover:text-destructive"
                  )}
                  disabled={isCurrentUser}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="surface-card flex flex-col items-center justify-center border-dashed py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <UserIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-lg font-semibold text-foreground">No users found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      {/* Permissions Info */}
      <div className="surface-card bg-muted/30 p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
          <Shield className="h-5 w-5 text-accent" />
          Role Permissions
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="elevated-card p-4">
            <h4 className="mb-2 font-medium text-foreground">Administrator</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Full access to all modules</li>
              <li>• User management</li>
              <li>• Audit trail access</li>
              <li>• System configuration</li>
            </ul>
          </div>
          <div className="elevated-card p-4">
            <h4 className="mb-2 font-medium text-foreground">Staff</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Case management</li>
              <li>• Advisory workflow</li>
              <li>• Document access</li>
              <li>• No admin functions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
