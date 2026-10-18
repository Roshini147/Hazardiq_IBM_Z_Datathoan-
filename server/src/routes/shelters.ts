import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

export const sheltersRouter = Router();

const AllocateSchema = z.object({
  count: z.number().int().positive(),
  affected_zone: z.string(),
  affected_ward: z.string().optional(),
  notes: z.string().optional(),
});

const CheckInSchema = z.object({
  count: z.number().int().positive().default(1),
});

const CheckOutSchema = z.object({
  count: z.number().int().positive().default(1),
});

// Helper to calculate dynamic status
function deriveCapacityStatus(totalCapacity: number, currentOccupancy: number, operationalStatus: string): string {
  if (operationalStatus === 'Closed' || operationalStatus === 'Maintenance') {
    return 'NOT_AVAILABLE';
  }
  const available = totalCapacity - currentOccupancy;
  if (available <= 0 || currentOccupancy >= totalCapacity) {
    return 'FULL';
  }
  if (currentOccupancy / totalCapacity >= 0.90) {
    return 'LIMITED';
  }
  return 'AVAILABLE';
}

// 1. List all shelters with filters
sheltersRouter.get('/', (req, res: Response) => {
  const { zone, ward, status, search } = req.query;
  let sql = 'SELECT * FROM shelters WHERE 1=1';
  const params: any[] = [];

  if (zone) {
    sql += ' AND zone LIKE ?';
    params.push(`%${zone}%`);
  }
  if (ward) {
    sql += ' AND ward LIKE ?';
    params.push(`%${ward}%`);
  }
  if (status) {
    sql += ' AND capacity_status = ?';
    params.push(String(status).toUpperCase());
  }
  if (search) {
    sql += ' AND (name LIKE ? OR address LIKE ? OR area LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY capacity_status ASC, available_capacity DESC';
  const rows = db.prepare(sql).all(...params) as any[];

  // Re-verify derived status on read to ensure 100% data integrity
  const sanitized = rows.map(s => {
    const available = Math.max(0, s.total_capacity - s.current_occupancy);
    const calculatedStatus = deriveCapacityStatus(s.total_capacity, s.current_occupancy, s.operational_status);
    return {
      ...s,
      available_capacity: available,
      capacity_status: calculatedStatus,
      occupancy_rate: s.total_capacity > 0 ? Math.round((s.current_occupancy / s.total_capacity) * 100) : 0
    };
  });

  res.json({ success: true, data: sanitized });
});

// 2. Get specific shelter details
sheltersRouter.get('/:id', (req, res: Response) => {
  const shelter = db.prepare('SELECT * FROM shelters WHERE id = ? OR external_id = ?').get(req.params.id, req.params.id) as any;
  if (!shelter) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shelter not found' } });
    return;
  }

  const available = Math.max(0, shelter.total_capacity - shelter.current_occupancy);
  const calculatedStatus = deriveCapacityStatus(shelter.total_capacity, shelter.current_occupancy, shelter.operational_status);

  res.json({
    success: true,
    data: {
      ...shelter,
      available_capacity: available,
      capacity_status: calculatedStatus,
      occupancy_rate: shelter.total_capacity > 0 ? Math.round((shelter.current_occupancy / shelter.total_capacity) * 100) : 0
    }
  });
});

// 3. Get shelter capacity breakdown
sheltersRouter.get('/:id/capacity', (req, res: Response) => {
  const shelter = db.prepare('SELECT * FROM shelters WHERE id = ? OR external_id = ?').get(req.params.id, req.params.id) as any;
  if (!shelter) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shelter not found' } });
    return;
  }

  const available = Math.max(0, shelter.total_capacity - shelter.current_occupancy);
  const calculatedStatus = deriveCapacityStatus(shelter.total_capacity, shelter.current_occupancy, shelter.operational_status);

  res.json({
    success: true,
    data: {
      shelter_id: shelter.external_id,
      name: shelter.name,
      total_capacity: shelter.total_capacity,
      current_occupancy: shelter.current_occupancy,
      available_capacity: available,
      occupancy_rate: shelter.total_capacity > 0 ? Number((shelter.current_occupancy / shelter.total_capacity).toFixed(2)) : 0,
      capacity_status: calculatedStatus,
      operational_status: shelter.operational_status,
      last_updated: shelter.last_updated
    }
  });
});

// 4. Transactional Relocation Allocation (Authority Only)
sheltersRouter.post('/:id/allocate', authenticateToken, requireRole(['OPERATOR', 'ANALYST', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = AllocateSchema.parse(req.body);
    const shelterIdParam = req.params.id;

    // Begin atomic transaction
    db.exec('BEGIN TRANSACTION;');

    try {
      const shelter = db.prepare('SELECT * FROM shelters WHERE id = ? OR external_id = ?').get(shelterIdParam, shelterIdParam) as any;
      if (!shelter) {
        db.exec('ROLLBACK;');
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shelter not found' } });
        return;
      }

      const available = shelter.total_capacity - shelter.current_occupancy;

      // CRITICAL CHECK: Reject over-allocation with exact required wording
      if (data.count > available) {
        db.exec('ROLLBACK;');
        res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_CAPACITY',
            message: `Insufficient capacity. Only ${available} places remain available.`
          }
        });
        return;
      }

      const newOccupancy = shelter.current_occupancy + data.count;
      const newAvailable = shelter.total_capacity - newOccupancy;
      const newStatus = deriveCapacityStatus(shelter.total_capacity, newOccupancy, shelter.operational_status);

      // Update shelter
      db.prepare(`
        UPDATE shelters
        SET current_occupancy = ?, available_capacity = ?, capacity_status = ?, last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newOccupancy, newAvailable, newStatus, shelter.id);

      // Record relocation allocation
      const allocResult = db.prepare(`
        INSERT INTO relocation_allocations (
          shelter_id, affected_zone, affected_ward, allocated_count, authorized_by_id, status, notes
        ) VALUES (?, ?, ?, ?, ?, 'ALLOCATED', ?)
      `).run(shelter.id, data.affected_zone, data.affected_ward || null, data.count, req.user?.id, data.notes || null);

      // Record in audit log
      db.prepare(`
        INSERT INTO audit_logs (user_id, username, role, action, entity, entity_id, details)
        VALUES (?, ?, ?, 'RELOCATION_ALLOCATION', 'SHELTER', ?, ?)
      `).run(
        req.user?.id,
        req.user?.username,
        req.user?.role,
        String(shelter.id),
        `Allocated ${data.count} evacuees from ${data.affected_zone} to ${shelter.name}. New occupancy: ${newOccupancy}/${shelter.total_capacity} (Status: ${newStatus}).`
      );

      db.exec('COMMIT;');

      res.status(200).json({
        success: true,
        data: {
          allocation_id: Number(allocResult.lastInsertRowid),
          shelter_id: shelter.id,
          name: shelter.name,
          total_capacity: shelter.total_capacity,
          current_occupancy: newOccupancy,
          available_capacity: newAvailable,
          capacity_status: newStatus,
          message: `Successfully allocated ${data.count} evacuees to ${shelter.name}.`
        }
      });
    } catch (txError: any) {
      db.exec('ROLLBACK;');
      throw txError;
    }
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.errors ? err.errors[0].message : err.message }
    });
  }
});

// 5. Shelter Check-in (Authority Only)
sheltersRouter.post('/:id/check-in', authenticateToken, requireRole(['OPERATOR', 'ANALYST', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = CheckInSchema.parse(req.body);
    const shelter = db.prepare('SELECT * FROM shelters WHERE id = ? OR external_id = ?').get(req.params.id, req.params.id) as any;
    if (!shelter) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shelter not found' } });
      return;
    }

    const available = shelter.total_capacity - shelter.current_occupancy;
    if (data.count > available) {
      res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_CAPACITY', message: `Insufficient capacity. Only ${available} places remain available.` }
      });
      return;
    }

    const newOccupancy = shelter.current_occupancy + data.count;
    const newAvailable = shelter.total_capacity - newOccupancy;
    const newStatus = deriveCapacityStatus(shelter.total_capacity, newOccupancy, shelter.operational_status);

    db.prepare(`
      UPDATE shelters
      SET current_occupancy = ?, available_capacity = ?, capacity_status = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newOccupancy, newAvailable, newStatus, shelter.id);

    db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, entity, entity_id, details)
      VALUES (?, ?, ?, 'SHELTER_CHECK_IN', 'SHELTER', ?, ?)
    `).run(req.user?.id, req.user?.username, req.user?.role, String(shelter.id), `Checked in ${data.count} persons. Occupancy: ${newOccupancy}/${shelter.total_capacity}.`);

    res.json({
      success: true,
      data: {
        shelter_id: shelter.id,
        current_occupancy: newOccupancy,
        available_capacity: newAvailable,
        capacity_status: newStatus
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'ERROR', message: err.message } });
  }
});

// 6. Shelter Check-out (Authority Only)
sheltersRouter.post('/:id/check-out', authenticateToken, requireRole(['OPERATOR', 'ANALYST', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = CheckOutSchema.parse(req.body);
    const shelter = db.prepare('SELECT * FROM shelters WHERE id = ? OR external_id = ?').get(req.params.id, req.params.id) as any;
    if (!shelter) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shelter not found' } });
      return;
    }

    const newOccupancy = Math.max(0, shelter.current_occupancy - data.count);
    const newAvailable = shelter.total_capacity - newOccupancy;
    const newStatus = deriveCapacityStatus(shelter.total_capacity, newOccupancy, shelter.operational_status);

    db.prepare(`
      UPDATE shelters
      SET current_occupancy = ?, available_capacity = ?, capacity_status = ?, last_updated = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newOccupancy, newAvailable, newStatus, shelter.id);

    db.prepare(`
      INSERT INTO audit_logs (user_id, username, role, action, entity, entity_id, details)
      VALUES (?, ?, ?, 'SHELTER_CHECK_OUT', 'SHELTER', ?, ?)
    `).run(req.user?.id, req.user?.username, req.user?.role, String(shelter.id), `Checked out ${data.count} persons. New occupancy: ${newOccupancy}/${shelter.total_capacity} (Status: ${newStatus}).`);

    res.json({
      success: true,
      data: {
        shelter_id: shelter.id,
        current_occupancy: newOccupancy,
        available_capacity: newAvailable,
        capacity_status: newStatus
      }
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'ERROR', message: err.message } });
  }
});
