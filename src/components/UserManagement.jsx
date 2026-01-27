import React, { useState, useEffect } from 'react';
import { Users, Shield, Eye, Edit3, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRole } from '../hooks/useRole';

const styles = {
  container: { padding: '24px 32px' },
  header: { marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 600, color: '#1E293B', marginBottom: '8px' },
  subtitle: { fontSize: '14px', color: '#64748B' },
  userList: { backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' },
  userRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' },
  userRowLast: { borderBottom: 'none' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontWeight: 600, fontSize: '14px' },
  userName: { fontWeight: 500, color: '#1E293B', marginBottom: '2px' },
  userEmail: { fontSize: '13px', color: '#64748B' },
  roleSelector: { display: 'flex', alignItems: 'center', gap: '8px' },
  roleButton: { padding: '6px 12px', fontSize: '12px', fontWeight: 500, border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' },
  roleButtonActive: { backgroundColor: '#1E293B', color: '#FFFFFF', borderColor: '#1E293B' },
  roleButtonInactive: { backgroundColor: '#FFFFFF', color: '#64748B' },
  roleBadge: { display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 500 },
  adminBadge: { backgroundColor: '#FEE2E2', color: '#DC2626' },
  editorBadge: { backgroundColor: '#DBEAFE', color: '#2563EB' },
  viewerBadge: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  emptyState: { padding: '40px', textAlign: 'center', color: '#64748B' },
  loading: { padding: '40px', textAlign: 'center', color: '#64748B' },
  saveButton: { padding: '6px 12px', fontSize: '12px', fontWeight: 500, backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  cancelButton: { padding: '6px 12px', fontSize: '12px', fontWeight: 500, backgroundColor: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  actionButtons: { display: 'flex', gap: '8px' },
  sensitiveSection: { marginTop: '32px', backgroundColor: '#FEF3C7', borderRadius: '12px', padding: '20px', border: '1px solid #F59E0B' },
  sensitiveTitle: { fontSize: '16px', fontWeight: 600, color: '#92400E', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' },
  sensitiveDescription: { fontSize: '13px', color: '#92400E', marginBottom: '16px' },
  checkboxGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1E293B', cursor: 'pointer' },
  checkbox: { width: '16px', height: '16px', cursor: 'pointer' },
};

const ROLES = [
  { id: 'admin', label: 'Admin', icon: Shield, description: 'Full access to all features' },
  { id: 'editor', label: 'Editor', icon: Edit3, description: 'Can view and edit data' },
  { id: 'viewer', label: 'Viewer', icon: Eye, description: 'View only access' },
];

export default function UserManagement() {
  const { isAdmin } = useRole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [pendingRole, setPendingRole] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role. Please try again.');
    } else {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setEditingUser(null);
      setPendingRole(null);
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin': return { ...styles.roleBadge, ...styles.adminBadge };
      case 'editor': return { ...styles.roleBadge, ...styles.editorBadge };
      default: return { ...styles.roleBadge, ...styles.viewerBadge };
    }
  };

  const getInitials = (user) => {
    if (user.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <Shield size={48} color="#E2E8F0" style={{ marginBottom: '16px' }} />
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>User Management</h2>
        <p style={styles.subtitle}>Manage user roles and permissions</p>
      </div>

      <div style={styles.userList}>
        {loading ? (
          <div style={styles.loading}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={styles.emptyState}>No users found</div>
        ) : (
          users.map((user, index) => (
            <div
              key={user.id}
              style={{
                ...styles.userRow,
                ...(index === users.length - 1 ? styles.userRowLast : {})
              }}
            >
              <div style={styles.userInfo}>
                <div style={styles.avatar}>{getInitials(user)}</div>
                <div>
                  <div style={styles.userName}>{user.full_name || 'No name'}</div>
                  <div style={styles.userEmail}>{user.email}</div>
                </div>
              </div>

              {editingUser === user.id ? (
                <div style={styles.roleSelector}>
                  {ROLES.map(role => (
                    <button
                      key={role.id}
                      style={{
                        ...styles.roleButton,
                        ...(pendingRole === role.id ? styles.roleButtonActive : styles.roleButtonInactive),
                      }}
                      onClick={() => setPendingRole(role.id)}
                    >
                      {role.label}
                    </button>
                  ))}
                  <div style={styles.actionButtons}>
                    <button
                      style={styles.saveButton}
                      onClick={() => updateUserRole(user.id, pendingRole)}
                    >
                      <Check size={14} /> Save
                    </button>
                    <button
                      style={styles.cancelButton}
                      onClick={() => { setEditingUser(null); setPendingRole(null); }}
                    >
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.roleSelector}>
                  <span style={getRoleBadgeStyle(user.role)}>
                    {ROLES.find(r => r.id === user.role)?.icon &&
                      React.createElement(ROLES.find(r => r.id === user.role).icon, { size: 12 })}
                    {user.role || 'viewer'}
                  </span>
                  <button
                    style={{ ...styles.roleButton, ...styles.roleButtonInactive }}
                    onClick={() => { setEditingUser(user.id); setPendingRole(user.role || 'viewer'); }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={styles.sensitiveSection}>
        <h3 style={styles.sensitiveTitle}>
          <Eye size={18} />
          Sensitive Data Settings
        </h3>
        <p style={styles.sensitiveDescription}>
          Configure which metrics are hidden from viewers. These settings apply to all viewer-role users.
        </p>
        <div style={styles.checkboxGroup}>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Hide cash/financial metrics from viewers
          </label>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" style={styles.checkbox} defaultChecked />
            Hide burn rate and runway from viewers
          </label>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" style={styles.checkbox} />
            Hide revenue breakdown from viewers
          </label>
        </div>
      </div>
    </div>
  );
}
