import { query } from '../../db/connection.js';

export interface AuditLogRecord {
  id: string;
  admin_id?: string;
  admin_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export class PostgresAuditRepository {
  async recordLog(data: {
    adminId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      const id = `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await query(
        `INSERT INTO audit_logs (
          id, admin_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          data.adminId || null,
          data.action,
          data.entityType,
          data.entityId || null,
          data.oldValues ? JSON.stringify(data.oldValues) : null,
          data.newValues ? JSON.stringify(data.newValues) : null,
          data.ipAddress || null,
          data.userAgent || null
        ]
      );
    } catch (err: any) {
      console.error('[AuditLog] Error recording audit log:', err.message);
    }
  }

  async getRecentLogs(limit = 100): Promise<AuditLogRecord[]> {
    const res = await query<AuditLogRecord>(
      `SELECT a.*, u.name as admin_name
       FROM audit_logs a
       LEFT JOIN users u ON a.admin_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}

export const auditRepository = new PostgresAuditRepository();
