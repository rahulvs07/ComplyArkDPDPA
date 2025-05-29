// MSSQL Storage Implementation for Windows
import { getConnection, sql } from './mssql-db';

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  organizationId: number;
  isActive: boolean;
  createdAt: Date;
  canEdit: boolean;
  canDelete: boolean;
}

export interface Organization {
  id: number;
  businessName: string;
  businessAddress: string;
  industryId: number;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  noOfUsers: number;
  remarks?: string;
  requestPageUrlToken?: string;
}

export interface DPRequest {
  requestId: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  requestType: string;
  requestComment: string;
  statusId: number;
  assignedToUserId?: number;
  createdAt: Date;
  lastUpdatedAt: Date;
  completionDate?: string;
  completedOnTime?: boolean;
  closedDateTime?: Date;
  closureComments?: string;
}

export interface Grievance {
  grievanceId: number;
  organizationId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  statusId: number;
  grievanceComment: string;
  assignedToUserId?: number;
  createdAt: Date;
  lastUpdatedAt: Date;
  completionDate?: string;
  completedOnTime?: boolean;
  closedDateTime?: Date;
  closureComments?: string;
}

export interface RequestStatus {
  statusId: number;
  statusName: string;
  description?: string;
  isActive: boolean;
}

export interface ExceptionLog {
  id?: number;
  pageName: string;
  functionName: string;
  errorMessage: string;
  userId?: number;
  additionalDetails?: string;
  severity: string;
  isResolved: boolean;
  createdAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: number;
}

export class MSSQLStorage {
  async getUserByUsername(username: string): Promise<User | undefined> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM users WHERE username = @username AND isActive = 1');
    
    return result.recordset[0] || undefined;
  }

  async getUser(id: number): Promise<User | undefined> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM users WHERE id = @id');
    
    return result.recordset[0] || undefined;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('username', sql.NVarChar, userData.username)
      .input('password', sql.NVarChar, userData.password)
      .input('firstName', sql.NVarChar, userData.firstName)
      .input('lastName', sql.NVarChar, userData.lastName)
      .input('email', sql.NVarChar, userData.email)
      .input('phone', sql.NVarChar, userData.phone)
      .input('role', sql.NVarChar, userData.role)
      .input('organizationId', sql.Int, userData.organizationId)
      .input('isActive', sql.Bit, userData.isActive)
      .input('canEdit', sql.Bit, userData.canEdit)
      .input('canDelete', sql.Bit, userData.canDelete)
      .query(`
        INSERT INTO users (username, password, firstName, lastName, email, phone, role, organizationId, isActive, canEdit, canDelete)
        OUTPUT INSERTED.*
        VALUES (@username, @password, @firstName, @lastName, @email, @phone, @role, @organizationId, @isActive, @canEdit, @canDelete)
      `);
    
    return result.recordset[0];
  }

  async listOrganizations(): Promise<Organization[]> {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM organizations ORDER BY businessName');
    
    return result.recordset;
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM organizations WHERE id = @id');
    
    return result.recordset[0] || undefined;
  }

  async listDPRequests(organizationId?: number): Promise<DPRequest[]> {
    const pool = await getConnection();
    const query = organizationId 
      ? 'SELECT * FROM dpr_requests WHERE organizationId = @organizationId ORDER BY createdAt DESC'
      : 'SELECT * FROM dpr_requests ORDER BY createdAt DESC';
    
    const request = pool.request();
    if (organizationId) {
      request.input('organizationId', sql.Int, organizationId);
    }
    
    const result = await request.query(query);
    return result.recordset;
  }

  async getDPRequest(requestId: number): Promise<DPRequest | undefined> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('requestId', sql.Int, requestId)
      .query('SELECT * FROM dpr_requests WHERE requestId = @requestId');
    
    return result.recordset[0] || undefined;
  }

  async updateDPRequest(requestId: number, updateData: Partial<DPRequest>): Promise<DPRequest | undefined> {
    const pool = await getConnection();
    
    // Build dynamic update query
    const setParts: string[] = [];
    const request = pool.request();
    request.input('requestId', sql.Int, requestId);
    
    if (updateData.statusId !== undefined) {
      setParts.push('statusId = @statusId');
      request.input('statusId', sql.Int, updateData.statusId);
    }
    
    if (updateData.assignedToUserId !== undefined) {
      setParts.push('assignedToUserId = @assignedToUserId');
      request.input('assignedToUserId', sql.Int, updateData.assignedToUserId);
    }
    
    if (updateData.closureComments !== undefined) {
      setParts.push('closureComments = @closureComments');
      request.input('closureComments', sql.NVarChar, updateData.closureComments);
    }
    
    if (updateData.lastUpdatedAt !== undefined) {
      setParts.push('lastUpdatedAt = @lastUpdatedAt');
      request.input('lastUpdatedAt', sql.DateTime2, updateData.lastUpdatedAt);
    }
    
    if (setParts.length === 0) {
      return this.getDPRequest(requestId);
    }
    
    const query = `
      UPDATE dpr_requests 
      SET ${setParts.join(', ')}
      OUTPUT INSERTED.*
      WHERE requestId = @requestId
    `;
    
    const result = await request.query(query);
    return result.recordset[0] || undefined;
  }

  async createDPRequestHistory(historyData: any): Promise<void> {
    const pool = await getConnection();
    await pool.request()
      .input('requestId', sql.Int, historyData.requestId)
      .input('changedByUserId', sql.Int, historyData.changedByUserId)
      .input('oldStatusId', sql.Int, historyData.oldStatusId)
      .input('newStatusId', sql.Int, historyData.newStatusId)
      .input('oldAssignedToUserId', sql.Int, historyData.oldAssignedToUserId)
      .input('newAssignedToUserId', sql.Int, historyData.newAssignedToUserId)
      .input('comments', sql.NVarChar, historyData.comments)
      .input('changeDate', sql.DateTime2, historyData.changeDate)
      .query(`
        INSERT INTO dpr_request_history 
        (requestId, changedByUserId, oldStatusId, newStatusId, oldAssignedToUserId, newAssignedToUserId, comments, changeDate)
        VALUES (@requestId, @changedByUserId, @oldStatusId, @newStatusId, @oldAssignedToUserId, @newAssignedToUserId, @comments, @changeDate)
      `);
  }

  async listRequestStatuses(): Promise<RequestStatus[]> {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM request_statuses WHERE isActive = 1 ORDER BY statusName');
    
    return result.recordset;
  }

  async getRequestStatus(statusId: number): Promise<RequestStatus | undefined> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('statusId', sql.Int, statusId)
      .query('SELECT * FROM request_statuses WHERE statusId = @statusId');
    
    return result.recordset[0] || undefined;
  }

  async createExceptionLog(logData: Omit<ExceptionLog, 'id' | 'createdAt'>): Promise<void> {
    const pool = await getConnection();
    await pool.request()
      .input('pageName', sql.NVarChar, logData.pageName)
      .input('functionName', sql.NVarChar, logData.functionName)
      .input('errorMessage', sql.NVarChar, logData.errorMessage)
      .input('userId', sql.Int, logData.userId)
      .input('additionalDetails', sql.NVarChar, logData.additionalDetails)
      .input('severity', sql.NVarChar, logData.severity)
      .input('isResolved', sql.Bit, logData.isResolved)
      .query(`
        INSERT INTO exception_logs 
        (pageName, functionName, errorMessage, userId, additionalDetails, severity, isResolved)
        VALUES (@pageName, @functionName, @errorMessage, @userId, @additionalDetails, @severity, @isResolved)
      `);
  }

  // Grievance methods
  async listGrievances(organizationId?: number): Promise<Grievance[]> {
    const pool = await getConnection();
    const query = organizationId 
      ? 'SELECT * FROM grievances WHERE organizationId = @organizationId ORDER BY createdAt DESC'
      : 'SELECT * FROM grievances ORDER BY createdAt DESC';
    
    const request = pool.request();
    if (organizationId) {
      request.input('organizationId', sql.Int, organizationId);
    }
    
    const result = await request.query(query);
    return result.recordset;
  }

  async getGrievance(grievanceId: number): Promise<Grievance | undefined> {
    const pool = await getConnection();
    const result = await pool.request()
      .input('grievanceId', sql.Int, grievanceId)
      .query('SELECT * FROM grievances WHERE grievanceId = @grievanceId');
    
    return result.recordset[0] || undefined;
  }

  async updateGrievance(grievanceId: number, updateData: Partial<Grievance>): Promise<Grievance | undefined> {
    const pool = await getConnection();
    
    const setParts: string[] = [];
    const request = pool.request();
    request.input('grievanceId', sql.Int, grievanceId);
    
    if (updateData.statusId !== undefined) {
      setParts.push('statusId = @statusId');
      request.input('statusId', sql.Int, updateData.statusId);
    }
    
    if (updateData.assignedToUserId !== undefined) {
      setParts.push('assignedToUserId = @assignedToUserId');
      request.input('assignedToUserId', sql.Int, updateData.assignedToUserId);
    }
    
    if (updateData.lastUpdatedAt !== undefined) {
      setParts.push('lastUpdatedAt = @lastUpdatedAt');
      request.input('lastUpdatedAt', sql.DateTime2, updateData.lastUpdatedAt);
    }
    
    if (setParts.length === 0) {
      return this.getGrievance(grievanceId);
    }
    
    const query = `
      UPDATE grievances 
      SET ${setParts.join(', ')}
      OUTPUT INSERTED.*
      WHERE grievanceId = @grievanceId
    `;
    
    const result = await request.query(query);
    return result.recordset[0] || undefined;
  }

  async createGrievanceHistory(historyData: any): Promise<void> {
    const pool = await getConnection();
    await pool.request()
      .input('grievanceId', sql.Int, historyData.grievanceId)
      .input('changedByUserId', sql.Int, historyData.changedByUserId)
      .input('oldStatusId', sql.Int, historyData.oldStatusId)
      .input('newStatusId', sql.Int, historyData.newStatusId)
      .input('oldAssignedToUserId', sql.Int, historyData.oldAssignedToUserId)
      .input('newAssignedToUserId', sql.Int, historyData.newAssignedToUserId)
      .input('comments', sql.NVarChar, historyData.comments)
      .input('changeDate', sql.DateTime2, historyData.changeDate)
      .query(`
        INSERT INTO grievance_history 
        (grievanceId, changedByUserId, oldStatusId, newStatusId, oldAssignedToUserId, newAssignedToUserId, comments, changeDate)
        VALUES (@grievanceId, @changedByUserId, @oldStatusId, @newStatusId, @oldAssignedToUserId, @newAssignedToUserId, @comments, @changeDate)
      `);
  }
}

export const storage = new MSSQLStorage();