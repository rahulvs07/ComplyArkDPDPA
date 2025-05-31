import { 
  users, industries, organizations, templates, notices, translatedNotices,
  requestStatuses, dpRequests, dpRequestHistory, grievances, grievanceHistory, complianceDocuments,
  notificationLogs, emailSettings, emailTemplates, otpVerifications,
  type User, type InsertUser, 
  type Industry, type InsertIndustry,
  type Organization, type InsertOrganization,
  type Template, type InsertTemplate,
  type Notice, type InsertNotice,
  type TranslatedNotice, type InsertTranslatedNotice,
  type RequestStatus, type InsertRequestStatus,
  type DPRequest, type InsertDPRequest,
  type DPRequestHistory, type InsertDPRequestHistory,
  type Grievance, type InsertGrievance,
  type GrievanceHistory, type InsertGrievanceHistory,
  type ComplianceDocument, type InsertComplianceDocument,
  type NotificationLog, type InsertNotificationLog,
  type EmailSetting, type InsertEmailSetting,
  type EmailTemplate, type InsertEmailTemplate,
  type OtpVerification, type InsertOtpVerification
} from "@shared/schema";
import crypto from 'crypto';

// Interface for all storage operations
export interface IStorage {
  // OTP Verification operations
  createOtpVerification(data: InsertOtpVerification): Promise<OtpVerification>;
  getOtpVerificationByToken(token: string): Promise<OtpVerification | undefined>;
  getOtpVerificationsByEmail(email: string): Promise<OtpVerification[]>;
  markOtpAsVerified(token: string): Promise<boolean>;
  cleanupExpiredOtps(): Promise<number>;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(organizationId?: number): Promise<User[]>;
  getOrgAdmin(organizationId: number): Promise<User | undefined>;
  getOrganizationUsers(organizationId: number): Promise<User[]>;
  
  // Notification operations
  getNotifications(organizationId: number, limit: number, offset: number): Promise<any[]>;
  getNotificationById(notificationId: number): Promise<any | undefined>;
  createNotification(notification: any): Promise<any>;
  markNotificationsAsRead(userId: number, notificationIds?: number[]): Promise<number>;
  getUnreadNotificationCount(organizationId: number): Promise<number>;
  
  // Organization operations
  getOrganization(id: number): Promise<Organization | undefined>;
  getOrganizationByToken(token: string): Promise<Organization | undefined>;
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, organization: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: number): Promise<boolean>;
  listOrganizations(): Promise<Organization[]>;
  
  // Industry operations
  getIndustry(id: number): Promise<Industry | undefined>;
  createIndustry(industry: InsertIndustry): Promise<Industry>;
  updateIndustry(id: number, industry: Partial<InsertIndustry>): Promise<Industry | undefined>;
  deleteIndustry(id: number): Promise<boolean>;
  listIndustries(): Promise<Industry[]>;
  
  // Template operations
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  listTemplates(industryId?: number): Promise<Template[]>;
  
  // Notice operations
  getNotice(id: number): Promise<Notice | undefined>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(id: number, notice: Partial<InsertNotice>): Promise<Notice | undefined>;
  deleteNotice(id: number): Promise<boolean>;
  listNotices(organizationId: number): Promise<Notice[]>;
  
  // Translated Notice operations
  getTranslatedNotice(id: number): Promise<TranslatedNotice | undefined>;
  createTranslatedNotice(notice: InsertTranslatedNotice): Promise<TranslatedNotice>;
  listTranslatedNotices(noticeId: number): Promise<TranslatedNotice[]>;
  
  // Request Status operations
  getRequestStatus(id: number): Promise<RequestStatus | undefined>;
  createRequestStatus(status: InsertRequestStatus): Promise<RequestStatus>;
  updateRequestStatus(id: number, status: Partial<InsertRequestStatus>): Promise<RequestStatus | undefined>;
  deleteRequestStatus(id: number): Promise<boolean>;
  listRequestStatuses(): Promise<RequestStatus[]>;
  
  // Data Protection Request operations
  getDPRequest(id: number): Promise<DPRequest | undefined>;
  createDPRequest(request: Partial<InsertDPRequest> & { organizationId: number; statusId: number }): Promise<DPRequest>;
  updateDPRequest(id: number, request: Partial<InsertDPRequest>): Promise<DPRequest | undefined>;
  listDPRequests(organizationId?: number): Promise<DPRequest[]>;
  
  // DP Request History operations
  createDPRequestHistory(history: InsertDPRequestHistory): Promise<DPRequestHistory>;
  listDPRequestHistory(requestId: number): Promise<DPRequestHistory[]>;
  
  // Grievance operations
  getGrievance(id: number): Promise<Grievance | undefined>;
  createGrievance(grievance: Partial<InsertGrievance> & { organizationId: number; statusId: number }): Promise<Grievance>;
  updateGrievance(id: number, grievance: Partial<InsertGrievance>): Promise<Grievance | undefined>;
  listGrievances(organizationId?: number): Promise<Grievance[]>;
  
  // Grievance History operations
  createGrievanceHistory(history: InsertGrievanceHistory): Promise<GrievanceHistory>;
  listGrievanceHistory(grievanceId: number): Promise<GrievanceHistory[]>;
  
  // Compliance Document operations
  getComplianceDocument(id: number): Promise<ComplianceDocument | undefined>;
  createComplianceDocument(document: InsertComplianceDocument): Promise<ComplianceDocument>;
  updateComplianceDocument(id: number, document: Partial<InsertComplianceDocument>): Promise<ComplianceDocument | undefined>;
  deleteComplianceDocument(id: number): Promise<boolean>;
  listComplianceDocuments(organizationId: number, path?: string): Promise<ComplianceDocument[]>;
  
  // Translated Notice operations
  getTranslatedNotice(id: number): Promise<TranslatedNotice | undefined>;
  createTranslatedNotice(translatedNotice: InsertTranslatedNotice): Promise<TranslatedNotice>;
  deleteTranslatedNotice(id: number): Promise<boolean>;
  listTranslatedNotices(noticeId: number): Promise<TranslatedNotice[]>;
  
  // Request Status operations
  getRequestStatus(id: number): Promise<RequestStatus | undefined>;
  createRequestStatus(status: InsertRequestStatus): Promise<RequestStatus>;
  updateRequestStatus(id: number, status: Partial<InsertRequestStatus>): Promise<RequestStatus | undefined>;
  deleteRequestStatus(id: number): Promise<boolean>;
  listRequestStatuses(): Promise<RequestStatus[]>;
  
  // DP Request operations
  getDPRequest(id: number): Promise<DPRequest | undefined>;
  createDPRequest(request: InsertDPRequest): Promise<DPRequest>;
  updateDPRequest(id: number, request: Partial<InsertDPRequest>): Promise<DPRequest | undefined>;
  deleteDPRequest(id: number): Promise<boolean>;
  listDPRequests(organizationId: number, statusId?: number): Promise<DPRequest[]>;
  
  // DP Request History operations
  createDPRequestHistory(history: InsertDPRequestHistory): Promise<DPRequestHistory>;
  listDPRequestHistory(requestId: number): Promise<DPRequestHistory[]>;
  
  // Grievance operations
  getGrievance(id: number): Promise<Grievance | undefined>;
  createGrievance(grievance: InsertGrievance): Promise<Grievance>;
  updateGrievance(id: number, grievance: Partial<InsertGrievance>): Promise<Grievance | undefined>;
  deleteGrievance(id: number): Promise<boolean>;
  listGrievances(organizationId: number, statusId?: number): Promise<Grievance[]>;
  
  // Grievance History operations
  createGrievanceHistory(history: InsertGrievanceHistory): Promise<GrievanceHistory>;
  listGrievanceHistory(grievanceId: number): Promise<GrievanceHistory[]>;
  
  // Compliance Document operations
  getComplianceDocument(id: number): Promise<ComplianceDocument | undefined>;
  createComplianceDocument(document: InsertComplianceDocument): Promise<ComplianceDocument>;
  updateComplianceDocument(id: number, document: Partial<InsertComplianceDocument>): Promise<ComplianceDocument | undefined>;
  deleteComplianceDocument(id: number): Promise<boolean>;
  listComplianceDocuments(organizationId: number, folderPath?: string): Promise<ComplianceDocument[]>;
  
  // Dashboard operations
  getDashboardStats(organizationId: number): Promise<any>;
  getRecentActivities(organizationId: number): Promise<any[]>;
  getRecentRequests(organizationId: number): Promise<any[]>;
  
  // Email Settings operations
  getEmailSettings(): Promise<EmailSetting | undefined>;
  updateEmailSettings(settings: InsertEmailSetting): Promise<EmailSetting>;
  
  // Email Template operations
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  listEmailTemplates(): Promise<EmailTemplate[]>;
}

export // This is the memory storage implementation
// Use this for reference when implementing database storage
class MemStorage {
  private usersData: Map<number, User>;
  private organizationsData: Map<number, Organization>;
  private industriesData: Map<number, Industry>;
  private templatesData: Map<number, Template>;
  private noticesData: Map<number, Notice>;
  private translatedNoticesData: Map<number, TranslatedNotice>;
  private requestStatusesData: Map<number, RequestStatus>;
  private dpRequestsData: Map<number, DPRequest>;
  private dpRequestHistoryData: Map<number, DPRequestHistory>;
  
  private currentUserId: number;
  private currentOrganizationId: number;
  private currentIndustryId: number;
  private currentTemplateId: number;
  private currentNoticeId: number;
  private currentTranslatedNoticeId: number;
  private currentRequestStatusId: number;
  private currentDPRequestId: number;
  private currentDPRequestHistoryId: number;

  constructor() {
    this.usersData = new Map();
    this.organizationsData = new Map();
    this.industriesData = new Map();
    this.templatesData = new Map();
    this.noticesData = new Map();
    this.translatedNoticesData = new Map();
    this.requestStatusesData = new Map();
    this.dpRequestsData = new Map();
    this.dpRequestHistoryData = new Map();
    
    this.currentUserId = 1;
    this.currentOrganizationId = 1;
    this.currentIndustryId = 1;
    this.currentTemplateId = 1;
    this.currentNoticeId = 1;
    this.currentTranslatedNoticeId = 1;
    this.currentRequestStatusId = 1;
    this.currentDPRequestId = 1;
    this.currentDPRequestHistoryId = 1;
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default industries
    const industryIds = [
      this.createIndustry({ industryName: "E-commerce" }).industryId,
      this.createIndustry({ industryName: "Healthcare" }).industryId,
      this.createIndustry({ industryName: "Online Gaming" }).industryId,
      this.createIndustry({ industryName: "Social Media" }).industryId,
      this.createIndustry({ industryName: "Educational Institution" }).industryId
    ];
    
    // Create default request statuses
    this.createRequestStatus({ statusName: "Submitted", slaDays: 7 });
    this.createRequestStatus({ statusName: "In Progress", slaDays: 5 });
    this.createRequestStatus({ statusName: "Completed", slaDays: 0 });
    this.createRequestStatus({ statusName: "Closed", slaDays: 0 });
    this.createRequestStatus({ statusName: "Overdue", slaDays: 0 });
    
    // Create default admin organization with token
    const token = crypto.randomBytes(16).toString('hex');
    const adminOrg = this.createOrganization({
      businessName: "ComplyArk Admin",
      businessAddress: "Admin Building, 123 Admin Street, Admin City",
      industryId: industryIds[0],
      contactPersonName: "Admin User",
      contactEmail: "admin@complyark.com",
      contactPhone: "123-456-7890",
      noOfUsers: 1,
      remarks: "System admin organization",
      requestPageUrlToken: token
    });
    
    // Create default admin user
    this.createUser({
      username: "complyarkadmin",
      password: "complyarkadmin", // In a real app, this would be hashed
      firstName: "Admin",
      lastName: "User",
      email: "admin@complyark.com",
      phone: "123-456-7890",
      role: "admin",
      organizationId: adminOrg.id,
      isActive: true,
      canEdit: true,
      canDelete: true
    });
    
    // Create a sample organization with token
    const orgToken = crypto.randomBytes(16).toString('hex');
    const sampleOrg = this.createOrganization({
      businessName: "TechCorp Solutions",
      businessAddress: "456 Tech Street, Innovation City, TC 12345",
      industryId: industryIds[0],
      contactPersonName: "John Smith",
      contactEmail: "john@techcorp.com",
      contactPhone: "987-654-3210",
      noOfUsers: 5,
      remarks: "Sample organization for testing",
      requestPageUrlToken: orgToken
    });
    
    // Create sample user for TechCorp
    this.createUser({
      username: "user",
      password: "password", // In a real app, this would be hashed
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@techcorp.com",
      phone: "555-123-4567",
      role: "user",
      organizationId: sampleOrg.id,
      isActive: true,
      canEdit: false,
      canDelete: false
    });

    // Add a test DPR request for organization 33 to test update functionality
    this.createDPRequest({
      organizationId: 33,
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "1234567890",
      requestType: "Access",
      requestComment: "Test request for update functionality testing",
      statusId: 35, // Submitted
      assignedToUserId: null,
      createdAt: new Date(),
      lastUpdatedAt: new Date(),
      completionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completedOnTime: null,
      closedDateTime: null,
      closureComments: null
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id, createdAt };
    this.usersData.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersData.delete(id);
  }

  async listUsers(organizationId?: number): Promise<User[]> {
    const users = Array.from(this.usersData.values());
    if (organizationId) {
      return users.filter(user => user.organizationId === organizationId);
    }
    return users;
  }

  async getOrgAdmin(organizationId: number): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      user => user.organizationId === organizationId && user.role === 'admin'
    );
  }

  async getOrganizationUsers(organizationId: number): Promise<User[]> {
    return Array.from(this.usersData.values()).filter(
      user => user.organizationId === organizationId
    );
  }

  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizationsData.get(id);
  }
  
  async getOrganizationByToken(token: string): Promise<Organization | undefined> {
    return Array.from(this.organizationsData.values()).find(
      org => org.requestPageUrlToken === token
    );
  }

  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    const id = this.currentOrganizationId++;
    const organization: Organization = { ...insertOrganization, id };
    this.organizationsData.set(id, organization);
    return organization;
  }

  async updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const organization = this.organizationsData.get(id);
    if (!organization) return undefined;
    
    const updatedOrganization = { ...organization, ...updates };
    this.organizationsData.set(id, updatedOrganization);
    return updatedOrganization;
  }

  async deleteOrganization(id: number): Promise<boolean> {
    return this.organizationsData.delete(id);
  }

  async listOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizationsData.values());
  }

  // Industry operations
  async getIndustry(id: number): Promise<Industry | undefined> {
    return this.industriesData.get(id);
  }

  async createIndustry(insertIndustry: InsertIndustry): Promise<Industry> {
    const industryId = this.currentIndustryId++;
    const industry: Industry = { ...insertIndustry, industryId };
    this.industriesData.set(industryId, industry);
    return industry;
  }

  async updateIndustry(id: number, updates: Partial<InsertIndustry>): Promise<Industry | undefined> {
    const industry = this.industriesData.get(id);
    if (!industry) return undefined;
    
    const updatedIndustry = { ...industry, ...updates };
    this.industriesData.set(id, updatedIndustry);
    return updatedIndustry;
  }

  async deleteIndustry(id: number): Promise<boolean> {
    return this.industriesData.delete(id);
  }

  async listIndustries(): Promise<Industry[]> {
    return Array.from(this.industriesData.values());
  }

  // Template operations
  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templatesData.get(id);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const templateId = this.currentTemplateId++;
    const template: Template = { ...insertTemplate, templateId };
    this.templatesData.set(templateId, template);
    return template;
  }

  async updateTemplate(id: number, updates: Partial<InsertTemplate>): Promise<Template | undefined> {
    const template = this.templatesData.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...updates };
    this.templatesData.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.templatesData.delete(id);
  }

  async listTemplates(industryId?: number): Promise<Template[]> {
    const templates = Array.from(this.templatesData.values());
    if (industryId) {
      return templates.filter(template => template.industryId === industryId);
    }
    return templates;
  }

  // Notice operations
  async getNotice(id: number): Promise<Notice | undefined> {
    return this.noticesData.get(id);
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const noticeId = this.currentNoticeId++;
    const createdOn = new Date();
    const notice: Notice = { ...insertNotice, noticeId, createdOn };
    this.noticesData.set(noticeId, notice);
    return notice;
  }

  async updateNotice(id: number, updates: Partial<InsertNotice>): Promise<Notice | undefined> {
    const notice = this.noticesData.get(id);
    if (!notice) return undefined;
    
    const updatedNotice = { ...notice, ...updates };
    this.noticesData.set(id, updatedNotice);
    return updatedNotice;
  }

  async deleteNotice(id: number): Promise<boolean> {
    return this.noticesData.delete(id);
  }

  async listNotices(organizationId: number): Promise<Notice[]> {
    const notices = Array.from(this.noticesData.values());
    return notices.filter(notice => notice.organizationId === organizationId);
  }

  // Translated Notice operations
  async getTranslatedNotice(id: number): Promise<TranslatedNotice | undefined> {
    return this.translatedNoticesData.get(id);
  }

  async createTranslatedNotice(insertTranslatedNotice: InsertTranslatedNotice): Promise<TranslatedNotice> {
    const id = this.currentTranslatedNoticeId++;
    const createdOn = new Date();
    const translatedNotice: TranslatedNotice = { ...insertTranslatedNotice, id, createdOn };
    this.translatedNoticesData.set(id, translatedNotice);
    return translatedNotice;
  }

  async deleteTranslatedNotice(id: number): Promise<boolean> {
    return this.translatedNoticesData.delete(id);
  }

  async listTranslatedNotices(noticeId: number): Promise<TranslatedNotice[]> {
    const translatedNotices = Array.from(this.translatedNoticesData.values());
    return translatedNotices.filter(tn => tn.noticeId === noticeId);
  }

  // Request Status operations
  async getRequestStatus(id: number): Promise<RequestStatus | undefined> {
    return this.requestStatusesData.get(id);
  }

  async createRequestStatus(insertStatus: InsertRequestStatus): Promise<RequestStatus> {
    const statusId = this.currentRequestStatusId++;
    const status: RequestStatus = { ...insertStatus, statusId };
    this.requestStatusesData.set(statusId, status);
    return status;
  }

  async listRequestStatuses(): Promise<RequestStatus[]> {
    return Array.from(this.requestStatusesData.values());
  }

  // DP Request operations (Database implementation)
  async getDPRequest(id: number): Promise<DPRequest | undefined> {
    const [request] = await db
      .select()
      .from(dpRequests)
      .where(eq(dpRequests.requestId, id));
    return request;
  }

  async createDPRequest(insertRequest: InsertDPRequest): Promise<DPRequest> {
    const [request] = await db
      .insert(dpRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async updateDPRequest(id: number, updates: Partial<InsertDPRequest>): Promise<DPRequest | undefined> {
    const [request] = await db
      .update(dpRequests)
      .set({
        ...updates,
        lastUpdatedAt: new Date(),
      })
      .where(eq(dpRequests.requestId, id))
      .returning();
    return request;
  }

  async deleteDPRequest(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(dpRequests)
        .where(eq(dpRequests.requestId, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting DP request:", error);
      return false;
    }
  }

  async listDPRequests(organizationId: number, statusId?: number): Promise<DPRequest[]> {
    let query = db
      .select()
      .from(dpRequests)
      .where(eq(dpRequests.organizationId, organizationId));
    
    if (statusId) {
      query = query.where(eq(dpRequests.statusId, statusId));
    }
    
    return query.orderBy(desc(dpRequests.createdAt));
  }

  // DP Request History operations (Memory implementation)
  async createDPRequestHistory(history: InsertDPRequestHistory): Promise<DPRequestHistory> {
    const historyId = this.currentDPRequestHistoryId++;
    const changeDate = new Date();
    const newHistory: DPRequestHistory = { ...history, historyId, changeDate };
    this.dpRequestHistoryData.set(historyId, newHistory);
    return newHistory;
  }

  async getDPRequestHistory(requestId: number): Promise<DPRequestHistory[]> {
    return Array.from(this.dpRequestHistoryData.values())
      .filter(history => history.requestId === requestId)
      .sort((a, b) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime());
  }

  async listDPRequestHistory(requestId: number): Promise<DPRequestHistory[]> {
    return db
      .select()
      .from(dpRequestHistory)
      .where(eq(dpRequestHistory.requestId, requestId))
      .orderBy(desc(dpRequestHistory.changeDate));
  }

  // Dashboard operations
  async getDashboardStats(organizationId: number): Promise<any> {
    // Get all DP requests for this organization
    const requests = Array.from(this.dpRequestsData.values())
      .filter(req => req.organizationId === organizationId);
    
    // Get all statuses
    const statuses = Array.from(this.requestStatusesData.values());
    
    // Count requests by status
    const submitStatus = statuses.find(s => s.statusName === "Submitted");
    const inProgressStatus = statuses.find(s => s.statusName === "In Progress");
    const completedStatus = statuses.find(s => s.statusName === "Completed");
    const overdueStatus = statuses.find(s => s.statusName === "Overdue");
    
    const pending = submitStatus ? requests.filter(r => r.statusId === submitStatus.statusId).length : 0;
    const inProgress = inProgressStatus ? requests.filter(r => r.statusId === inProgressStatus.statusId).length : 0;
    const completed = completedStatus ? requests.filter(r => r.statusId === completedStatus.statusId).length : 0;
    const overdue = overdueStatus ? requests.filter(r => r.statusId === overdueStatus.statusId).length : 0;
    
    return {
      pending: {
        count: pending,
        trend: { value: "8% from last week", isPositive: false }
      },
      inProgress: {
        count: inProgress,
        trend: { value: "5% from last week", isPositive: true }
      },
      completed: {
        count: completed,
        trend: { value: "12% from last week", isPositive: true }
      },
      overdue: {
        count: overdue,
        trend: { value: "2% from last week", isPositive: false }
      }
    };
  }

  async getRecentActivities(organizationId: number): Promise<any[]> {
    // Return default activities
    return [
      {
        id: 1,
        type: "new_request",
        message: "New data request submitted by Sarah Johnson",
        timeAgo: "10 minutes ago",
        icon: "assignment",
        iconClass: "bg-primary-50 text-primary-500"
      },
      {
        id: 2,
        type: "completed",
        message: "Request #1243 marked as complete",
        timeAgo: "1 hour ago",
        icon: "task_alt",
        iconClass: "bg-success-50 text-success-500"
      },
      {
        id: 3,
        type: "overdue",
        message: "Request #1242 is overdue",
        timeAgo: "2 hours ago",
        icon: "report_problem",
        iconClass: "bg-error-50 text-error-500"
      },
      {
        id: 4,
        type: "new_template",
        message: "New notice template added by Admin",
        timeAgo: "Yesterday",
        icon: "description",
        iconClass: "bg-warning-50 text-warning-500"
      }
    ];
  }

  async getRecentRequests(organizationId: number): Promise<any[]> {
    try {
      const requests = await this.listDPRequests(organizationId);
      const recentRequests = requests
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(request => ({
          id: `#${request.requestId}`,
          name: `${request.firstName} ${request.lastName}`,
          requestType: request.requestType,
          status: this.getStatusNameById(request.statusId),
          assignedTo: request.assignedToUserId ? "Assigned" : "Unassigned",
          dueDate: request.completionDate ? new Date(request.completionDate).toLocaleDateString() : "N/A"
        }));
      
      return recentRequests;
    } catch (error) {
      console.error('Error retrieving recent requests:', error);
      return [];
    }
  }
  
  // Dashboard helper methods
  
  // Get status name from status ID
  getStatusNameById(statusId: number): string {
    try {
      const status = this.statusCache.find((s: any) => s.statusId === statusId);
      return status ? status.statusName : "Unknown";
    } catch (error) {
      console.error('Error getting status name:', error);
      return "Unknown";
    }
  }
  
  // Alias method to support dashboard controller
  async listRequests(organizationId: number): Promise<DPRequest[]> {
    return this.listDPRequests(organizationId);
  }
  
  // Retrieve all grievances for an organization
  async listGrievances(organizationId: number): Promise<any[]> {
    try {
      // Return existing grievances or query from database when implemented
      const grievances = await db.query(`
        SELECT g.*, 
          s.status_name as status_name,
          u.first_name || ' ' || u.last_name as assigned_to_name
        FROM grievances g
        LEFT JOIN dpr_request_statuses s ON g.status_id = s.status_id
        LEFT JOIN users u ON g.assigned_to_user_id = u.id
        WHERE g.organization_id = $1
        ORDER BY g.created_at DESC
      `, [organizationId]);
      
      return grievances.rows || [];
    } catch (error) {
      console.error('Error retrieving grievances:', error);
      return [];
    }
  }
  
  // Retrieve grievance history for a specific grievance
  async listGrievanceHistory(grievanceId: number): Promise<any[]> {
    try {
      const history = await db.query(`
        SELECT h.*, 
          os.status_name as old_status_name, 
          ns.status_name as new_status_name,
          ou.first_name || ' ' || ou.last_name as old_assigned_to_name,
          nu.first_name || ' ' || nu.last_name as new_assigned_to_name,
          u.first_name || ' ' || u.last_name as changed_by_name
        FROM grievance_history h
        LEFT JOIN dpr_request_statuses os ON h.old_status_id = os.status_id
        LEFT JOIN dpr_request_statuses ns ON h.new_status_id = ns.status_id
        LEFT JOIN users ou ON h.old_assigned_to_user_id = ou.id
        LEFT JOIN users nu ON h.new_assigned_to_user_id = nu.id
        LEFT JOIN users u ON h.changed_by_user_id = u.id
        WHERE h.grievance_id = $1
        ORDER BY h.change_date DESC
      `, [grievanceId]);
      
      return history.rows || [];
    } catch (error) {
      console.error('Error retrieving grievance history:', error);
      return [];
    }
  }
}

import { db } from "./db";
import { eq, and, desc, sql, count, isNull, like, inArray } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  // OTP Verification operations
  async createOtpVerification(data: InsertOtpVerification): Promise<OtpVerification> {
    const [result] = await db.insert(otpVerifications)
      .values({
        ...data,
        createdAt: new Date()
      })
      .returning();
    
    return result;
  }

  async getOtpVerificationByToken(token: string): Promise<OtpVerification | undefined> {
    const results = await db.select().from(otpVerifications).where(sql`token = ${token}`).limit(1);
    return results.length > 0 ? results[0] : undefined;
  }
  
  async getOtpVerificationsByEmail(email: string): Promise<OtpVerification[]> {
    const results = await db.select()
      .from(otpVerifications)
      .where(sql`email = ${email}`)
      .orderBy(desc(otpVerifications.createdAt))
      .limit(5);
    return results;
  }

  async markOtpAsVerified(token: string): Promise<boolean> {
    const result = await db.update(otpVerifications)
      .set({
        verified: true,
        verifiedAt: new Date()
      })
      .where(sql`token = ${token}`);
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async cleanupExpiredOtps(): Promise<number> {
    const result = await db.delete(otpVerifications)
      .where(sql`expires_at < ${new Date()}`);
    
    return result.rowCount !== null ? result.rowCount : 0;
  }

  // Email Settings operations
  async getEmailSettings(): Promise<EmailSetting | undefined> {
    const settings = await db.select().from(emailSettings).limit(1);
    return settings.length > 0 ? settings[0] : undefined;
  }

  async updateEmailSettings(settings: InsertEmailSetting): Promise<EmailSetting> {
    // Check if settings already exist
    const existingSettings = await db.select().from(emailSettings).limit(1);
    
    if (existingSettings.length > 0) {
      await db.update(emailSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(sql`id = ${existingSettings[0].id}`);
      
      return {
        ...existingSettings[0],
        ...settings,
        updatedAt: new Date()
      };
    } else {
      const [result] = await db.insert(emailSettings)
        .values({
          ...settings,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result;
    }
  }

  // Email Template operations
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const templates = await db.select().from(emailTemplates).where(sql`id = ${id}`).limit(1);
    return templates.length > 0 ? templates[0] : undefined;
  }

  async getEmailTemplateByName(name: string): Promise<EmailTemplate | undefined> {
    const templates = await db.select().from(emailTemplates).where(sql`name = ${name}`).limit(1);
    return templates.length > 0 ? templates[0] : undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [result] = await db.insert(emailTemplates)
      .values({
        ...template,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return result;
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const existingTemplate = await this.getEmailTemplate(id);
    
    if (!existingTemplate) {
      return undefined;
    }
    
    await db.update(emailTemplates)
      .set({
        ...template,
        updatedAt: new Date()
      })
      .where(sql`id = ${id}`);
    
    return {
      ...existingTemplate,
      ...template,
      updatedAt: new Date()
    };
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    const result = await db.delete(emailTemplates).where(sql`id = ${id}`);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async listEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(sql`name`);
  }

  
  // Notification operations
  async getNotifications(organizationId: number, limit: number = 5, offset: number = 0): Promise<any[]> {
    try {
      const notifications = await db
        .select({
          notificationId: notificationLogs.notificationId,
          userId: notificationLogs.userId,
          organizationId: notificationLogs.organizationId,
          module: notificationLogs.module,
          action: notificationLogs.action,
          actionType: notificationLogs.actionType,
          timestamp: notificationLogs.timestamp,
          status: notificationLogs.status,
          initiator: notificationLogs.initiator,
          message: notificationLogs.message,
          isRead: notificationLogs.isRead,
          relatedItemId: notificationLogs.relatedItemId,
          relatedItemType: notificationLogs.relatedItemType
        })
        .from(notificationLogs)
        .where(eq(notificationLogs.organizationId, organizationId))
        .orderBy(desc(notificationLogs.timestamp))
        .limit(limit)
        .offset(offset);
      
      // Add user name to each notification
      const results = [];
      for (const notification of notifications) {
        const user = await this.getUser(notification.userId);
        results.push({
          ...notification,
          userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
          minutesAgo: Math.floor((Date.now() - new Date(notification.timestamp).getTime()) / 60000)
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async getNotificationById(notificationId: number): Promise<any | undefined> {
    try {
      const [notification] = await db
        .select()
        .from(notificationLogs)
        .where(eq(notificationLogs.notificationId, notificationId));
      
      if (!notification) return undefined;
      
      const user = await this.getUser(notification.userId);
      return {
        ...notification,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        minutesAgo: Math.floor((Date.now() - new Date(notification.timestamp).getTime()) / 60000)
      };
    } catch (error) {
      console.error('Error getting notification by ID:', error);
      return undefined;
    }
  }

  async createNotification(notification: InsertNotificationLog): Promise<NotificationLog> {
    try {
      const [result] = await db
        .insert(notificationLogs)
        .values(notification)
        .returning();
      
      return result;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async markNotificationsAsRead(userId: number, notificationIds?: number[]): Promise<number> {
    try {
      if (notificationIds && notificationIds.length > 0) {
        // Mark specific notifications as read
        const updateResult = await db
          .update(notificationLogs)
          .set({ isRead: true })
          .where(
            and(
              eq(notificationLogs.userId, userId),
              eq(notificationLogs.isRead, false),
              inArray(notificationLogs.notificationId, notificationIds)
            )
          );
        
        return updateResult.rowCount || 0;
      } else {
        // Mark all notifications for this user as read
        const updateResult = await db
          .update(notificationLogs)
          .set({ isRead: true })
          .where(
            and(
              eq(notificationLogs.userId, userId),
              eq(notificationLogs.isRead, false)
            )
          );
        
        return updateResult.rowCount || 0;
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return 0;
    }
  }

  async getUnreadNotificationCount(organizationId: number): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(notificationLogs)
        .where(
          and(
            eq(notificationLogs.organizationId, organizationId),
            eq(notificationLogs.isRead, false)
          )
        );
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }
  // RequestStatus operations
  async updateRequestStatus(id: number, updates: Partial<InsertRequestStatus>): Promise<RequestStatus | undefined> {
    const [updatedStatus] = await db
      .update(requestStatuses)
      .set(updates)
      .where(eq(requestStatuses.statusId, id))
      .returning();
    return updatedStatus;
  }
  
  async deleteRequestStatus(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(requestStatuses)
        .where(eq(requestStatuses.statusId, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting request status:", error);
      return false;
    }
  }
  
  // Grievance operations
  async getGrievance(id: number): Promise<Grievance | undefined> {
    const [grievance] = await db
      .select()
      .from(grievances)
      .where(eq(grievances.grievanceId, id));
    return grievance;
  }
  
  async createGrievance(insertGrievance: InsertGrievance): Promise<Grievance> {
    const [grievance] = await db
      .insert(grievances)
      .values(insertGrievance)
      .returning();
    return grievance;
  }
  
  async updateGrievance(id: number, updates: Partial<InsertGrievance>): Promise<Grievance | undefined> {
    const [updatedGrievance] = await db
      .update(grievances)
      .set({
        ...updates,
        lastUpdatedAt: new Date()
      })
      .where(eq(grievances.grievanceId, id))
      .returning();
    return updatedGrievance;
  }
  
  async deleteGrievance(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(grievances)
        .where(eq(grievances.grievanceId, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting grievance:", error);
      return false;
    }
  }
  
  async listGrievances(organizationId: number, statusId?: number): Promise<Grievance[]> {
    let query = db
      .select()
      .from(grievances)
      .where(eq(grievances.organizationId, organizationId));
    
    if (statusId) {
      query = query.where(eq(grievances.statusId, statusId));
    }
    
    return query.orderBy(desc(grievances.createdAt));
  }
  
  // Grievance History operations
  async createGrievanceHistory(history: InsertGrievanceHistory): Promise<GrievanceHistory> {
    const [newHistory] = await db
      .insert(grievanceHistory)
      .values(history)
      .returning();
    return newHistory;
  }
  
  async getGrievanceHistory(grievanceId: number): Promise<GrievanceHistory[]> {
    return db
      .select()
      .from(grievanceHistory)
      .where(eq(grievanceHistory.grievanceId, grievanceId))
      .orderBy(desc(grievanceHistory.changeDate));
  }

  async listGrievanceHistory(grievanceId: number): Promise<GrievanceHistory[]> {
    return this.getGrievanceHistory(grievanceId);
  }
  
  // Compliance Document operations
  async getComplianceDocument(id: number): Promise<ComplianceDocument | undefined> {
    const [document] = await db
      .select()
      .from(complianceDocuments)
      .where(eq(complianceDocuments.documentId, id));
    return document;
  }
  
  async createComplianceDocument(document: InsertComplianceDocument): Promise<ComplianceDocument> {
    const [createdDocument] = await db
      .insert(complianceDocuments)
      .values(document)
      .returning();
    return createdDocument;
  }
  
  async updateComplianceDocument(id: number, updates: Partial<InsertComplianceDocument>): Promise<ComplianceDocument | undefined> {
    const [updatedDocument] = await db
      .update(complianceDocuments)
      .set(updates)
      .where(eq(complianceDocuments.documentId, id))
      .returning();
    return updatedDocument;
  }
  
  async listComplianceDocuments(organizationId: number, folderPath: string = '/'): Promise<ComplianceDocument[]> {
    try {
      // Normalize folder path
      if (!folderPath) folderPath = '/';
      
      console.log(`Fetching documents for organizationId=${organizationId}, folderPath=${folderPath}`);
      
      // First, check if we have any documents
      const existing = await db
        .select()
        .from(complianceDocuments)
        .where(
          and(
            eq(complianceDocuments.organizationId, organizationId),
            eq(complianceDocuments.folderPath, folderPath)
          )
        );
      
      console.log(`Found ${existing.length} documents in the database`);
      
      // If we're at the root and no documents exist, create default folders
      if (folderPath === '/' && existing.length === 0) {
        console.log('Creating default folders');
        
        const defaultFolders = [
          {
            documentName: 'Notices',
            documentType: 'folder',
            documentPath: '',
            folderPath: '/',
            organizationId,
            uploadedBy: 1, // System user
            uploadedAt: new Date()
          },
          {
            documentName: 'Translated Notices',
            documentType: 'folder',
            documentPath: '',
            folderPath: '/',
            organizationId,
            uploadedBy: 1, // System user
            uploadedAt: new Date()
          },
          {
            documentName: 'Other Templates',
            documentType: 'folder',
            documentPath: '',
            folderPath: '/',
            organizationId,
            uploadedBy: 1, // System user
            uploadedAt: new Date()
          }
        ];
        
        for (const folder of defaultFolders) {
          await db.insert(complianceDocuments).values(folder);
        }
        
        // Fetch again after creating default folders
        return db
          .select()
          .from(complianceDocuments)
          .where(
            and(
              eq(complianceDocuments.organizationId, organizationId),
              eq(complianceDocuments.folderPath, folderPath)
            )
          )
          .orderBy(
            sql`CASE WHEN ${complianceDocuments.documentType} = 'folder' THEN 1 ELSE 0 END DESC`,
            complianceDocuments.documentName
          );
      }
      
      // Return documents sorted with folders first
      return existing.sort((a, b) => {
        // Folders come first
        if (a.documentType === 'folder' && b.documentType !== 'folder') return -1;
        if (a.documentType !== 'folder' && b.documentType === 'folder') return 1;
        
        // Then sort alphabetically by name
        return a.documentName.localeCompare(b.documentName);
      });
    } catch (error) {
      console.error('Error fetching compliance documents:', error);
      return [];
    }
  }
  
  async deleteComplianceDocument(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(complianceDocuments)
        .where(eq(complianceDocuments.documentId, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting compliance document:", error);
      return false;
    }
  }
  
  async listComplianceDocuments(organizationId: number, folderPath: string = '/'): Promise<ComplianceDocument[]> {
    try {
      console.log(`Executing SQL to get documents for org: ${organizationId}, path: '${folderPath}'`);
      
      // First, check if the table exists to avoid errors
      const tableExists = await db.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'complianceDocuments'
        );
      `);
      
      if (!tableExists.rows[0].exists) {
        console.log("Table 'complianceDocuments' does not exist yet");
        return [];
      }
      
      // Get the documents
      const { rows } = await db.execute(`
        SELECT * FROM "complianceDocuments" 
        WHERE "organizationId" = $1 AND "folderPath" = $2
        ORDER BY 
          CASE WHEN "documentType" = 'folder' THEN 0 ELSE 1 END, 
          "documentName" ASC
      `, [organizationId, folderPath]);
      
      console.log(`SQL query returned ${rows.length} documents for org ${organizationId} in path ${folderPath}`);
      
      // If we got no documents, check if we should create default folders
      if (rows.length === 0 && folderPath === '/') {
        console.log("Creating default folders for organization");
        await this.createDefaultFolders(organizationId);
        
        // Fetch again after creating defaults
        const { rows: newRows } = await db.execute(`
          SELECT * FROM "complianceDocuments" 
          WHERE "organizationId" = $1 AND "folderPath" = $2
          ORDER BY "documentName" ASC
        `, [organizationId, folderPath]);
        
        return newRows.map(this.mapRowToComplianceDocument);
      }
      
      return rows.map(this.mapRowToComplianceDocument);
    } catch (error) {
      console.error("Error in listComplianceDocuments:", error);
      return [];
    }
  }
  
  // Helper method to create default folders for an organization
  private async createDefaultFolders(organizationId: number): Promise<void> {
    try {
      const defaultFolders = ['Notices', 'Translated Notices', 'Other Templates'];
      const currentUser = 999; // System admin ID for default folders
      
      for (const folderName of defaultFolders) {
        await db.execute(`
          INSERT INTO "complianceDocuments" 
          ("organizationId", "documentName", "documentType", "documentPath", "folderPath", "uploadedBy", "uploadedAt")
          VALUES ($1, $2, 'folder', '', '/', $3, NOW())
          ON CONFLICT DO NOTHING
        `, [organizationId, folderName, currentUser]);
      }
      
      console.log(`Created default folders for organization ${organizationId}`);
    } catch (error) {
      console.error("Error creating default folders:", error);
    }
  }
  
  // Helper method to map database row to ComplianceDocument type
  private mapRowToComplianceDocument(row: any): ComplianceDocument {
    return {
      documentId: row.documentId,
      documentName: row.documentName,
      documentType: row.documentType,
      documentPath: row.documentPath || '',
      uploadedBy: row.uploadedBy,
      uploadedAt: new Date(row.uploadedAt),
      organizationId: row.organizationId,
      folderPath: row.folderPath
    };
  }
  // Get org admin (first admin user in the organization)
  async getOrgAdmin(organizationId: number): Promise<User | undefined> {
    const [admin] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.organizationId, organizationId),
          eq(users.role, "admin")
        )
      )
      .limit(1);
    return admin || undefined;
  }
  
  // Get organization by token
  async getOrganizationByToken(token: string): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.requestPageUrlToken, token));
    return organization || undefined;
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async listUsers(organizationId?: number): Promise<User[]> {
    if (organizationId) {
      return db.select().from(users).where(eq(users.organizationId, organizationId));
    }
    return db.select().from(users);
  }

  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    const [organization] = await db.select().from(organizations).where(eq(organizations.id, id));
    return organization;
  }
  
  async getOrganizationByToken(token: string): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.requestPageUrlToken, token));
    return organization;
  }

  async createOrganization(organization: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(organization).returning();
    return org;
  }

  async updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [organization] = await db
      .update(organizations)
      .set(updates)
      .where(eq(organizations.id, id))
      .returning();
    return organization;
  }

  async deleteOrganization(id: number): Promise<boolean> {
    const result = await db.delete(organizations).where(eq(organizations.id, id));
    return result.rowCount > 0;
  }

  async listOrganizations(): Promise<Organization[]> {
    return db.select().from(organizations);
  }

  // Industry operations
  async getIndustry(id: number): Promise<Industry | undefined> {
    const [industry] = await db.select().from(industries).where(eq(industries.industryId, id));
    return industry;
  }

  async createIndustry(industry: InsertIndustry): Promise<Industry> {
    const [newIndustry] = await db.insert(industries).values(industry).returning();
    return newIndustry;
  }

  async updateIndustry(id: number, updates: Partial<InsertIndustry>): Promise<Industry | undefined> {
    const [industry] = await db
      .update(industries)
      .set(updates)
      .where(eq(industries.industryId, id))
      .returning();
    return industry;
  }

  async deleteIndustry(id: number): Promise<boolean> {
    const result = await db.delete(industries).where(eq(industries.industryId, id));
    return result.rowCount > 0;
  }

  async listIndustries(): Promise<Industry[]> {
    return db.select().from(industries);
  }

  // Template operations
  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.templateId, id));
    return template;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async updateTemplate(id: number, updates: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [template] = await db
      .update(templates)
      .set(updates)
      .where(eq(templates.templateId, id))
      .returning();
    return template;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.templateId, id));
    return result.rowCount > 0;
  }

  async listTemplates(industryId?: number): Promise<Template[]> {
    if (industryId) {
      return db.select().from(templates).where(eq(templates.industryId, industryId));
    }
    return db.select().from(templates);
  }

  // Notice operations
  async getNotice(id: number): Promise<Notice | undefined> {
    const [notice] = await db.select().from(notices).where(eq(notices.noticeId, id));
    return notice;
  }

  async createNotice(notice: InsertNotice): Promise<Notice> {
    const [newNotice] = await db.insert(notices).values(notice).returning();
    return newNotice;
  }

  async updateNotice(id: number, updates: Partial<InsertNotice>): Promise<Notice | undefined> {
    const [notice] = await db
      .update(notices)
      .set(updates)
      .where(eq(notices.noticeId, id))
      .returning();
    return notice;
  }

  async deleteNotice(id: number): Promise<boolean> {
    const result = await db.delete(notices).where(eq(notices.noticeId, id));
    return result.rowCount > 0;
  }

  async listNotices(organizationId: number): Promise<Notice[]> {
    return db
      .select()
      .from(notices)
      .where(eq(notices.organizationId, organizationId));
  }

  // Translated Notice operations
  async getTranslatedNotice(id: number): Promise<TranslatedNotice | undefined> {
    const [translatedNotice] = await db
      .select()
      .from(translatedNotices)
      .where(eq(translatedNotices.id, id));
    return translatedNotice;
  }

  async createTranslatedNotice(translatedNotice: InsertTranslatedNotice): Promise<TranslatedNotice> {
    const [newTranslatedNotice] = await db
      .insert(translatedNotices)
      .values(translatedNotice)
      .returning();
    return newTranslatedNotice;
  }

  async deleteTranslatedNotice(id: number): Promise<boolean> {
    const result = await db
      .delete(translatedNotices)
      .where(eq(translatedNotices.id, id));
    return result.rowCount > 0;
  }

  async listTranslatedNotices(noticeId: number): Promise<TranslatedNotice[]> {
    return db
      .select()
      .from(translatedNotices)
      .where(eq(translatedNotices.noticeId, noticeId));
  }

  // Request Status operations
  async getRequestStatus(id: number): Promise<RequestStatus | undefined> {
    const [status] = await db
      .select()
      .from(requestStatuses)
      .where(eq(requestStatuses.statusId, id));
    return status;
  }

  async createRequestStatus(status: InsertRequestStatus): Promise<RequestStatus> {
    const [newStatus] = await db
      .insert(requestStatuses)
      .values(status)
      .returning();
    return newStatus;
  }

  async listRequestStatuses(): Promise<RequestStatus[]> {
    return db.select().from(requestStatuses);
  }

  // DP Request operations
  async getDPRequest(id: number): Promise<DPRequest | undefined> {
    const [request] = await db
      .select()
      .from(dpRequests)
      .where(eq(dpRequests.requestId, id));
    return request;
  }

  async createDPRequest(request: InsertDPRequest): Promise<DPRequest> {
    const [newRequest] = await db
      .insert(dpRequests)
      .values({
        ...request,
        lastUpdatedAt: new Date(),
      })
      .returning();
    return newRequest;
  }

  async updateDPRequest(id: number, updates: Partial<InsertDPRequest>): Promise<DPRequest | undefined> {
    const [request] = await db
      .update(dpRequests)
      .set({
        ...updates,
        lastUpdatedAt: new Date(),
      })
      .where(eq(dpRequests.requestId, id))
      .returning();
    return request;
  }

  async deleteDPRequest(id: number): Promise<boolean> {
    const result = await db
      .delete(dpRequests)
      .where(eq(dpRequests.requestId, id));
    return result.rowCount > 0;
  }

  async listDPRequests(organizationId: number, statusId?: number): Promise<DPRequest[]> {
    if (statusId) {
      return db
        .select()
        .from(dpRequests)
        .where(
          and(
            eq(dpRequests.organizationId, organizationId),
            eq(dpRequests.statusId, statusId)
          )
        );
    }
    return db
      .select()
      .from(dpRequests)
      .where(eq(dpRequests.organizationId, organizationId));
  }

  // DP Request History operations
  async createDPRequestHistory(history: InsertDPRequestHistory): Promise<DPRequestHistory> {
    const [newHistory] = await db
      .insert(dpRequestHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  async listDPRequestHistory(requestId: number): Promise<DPRequestHistory[]> {
    return db
      .select()
      .from(dpRequestHistory)
      .where(eq(dpRequestHistory.requestId, requestId))
      .orderBy(desc(dpRequestHistory.changeDate));
  }

  // Dashboard operations
  async getDashboardStats(organizationId: number): Promise<any> {
    // Get all statuses
    const statuses = await db.select().from(requestStatuses);
    
    // Find status IDs
    const submitStatus = statuses.find(s => s.statusName === "Submitted");
    const inProgressStatus = statuses.find(s => s.statusName === "In Progress");
    const completedStatus = statuses.find(s => s.statusName === "Completed");
    const overdueStatus = statuses.find(s => s.statusName === "Overdue");
    
    // Count requests by status
    const pendingCount = submitStatus 
      ? await db.select({ count: count() }).from(dpRequests)
          .where(and(
            eq(dpRequests.organizationId, organizationId),
            eq(dpRequests.statusId, submitStatus.statusId)
          ))
          .then(result => result[0].count)
      : 0;
    
    const inProgressCount = inProgressStatus
      ? await db.select({ count: count() }).from(dpRequests)
          .where(and(
            eq(dpRequests.organizationId, organizationId),
            eq(dpRequests.statusId, inProgressStatus.statusId)
          ))
          .then(result => result[0].count)
      : 0;
    
    const completedCount = completedStatus
      ? await db.select({ count: count() }).from(dpRequests)
          .where(and(
            eq(dpRequests.organizationId, organizationId),
            eq(dpRequests.statusId, completedStatus.statusId)
          ))
          .then(result => result[0].count)
      : 0;
    
    const overdueCount = overdueStatus
      ? await db.select({ count: count() }).from(dpRequests)
          .where(and(
            eq(dpRequests.organizationId, organizationId),
            eq(dpRequests.statusId, overdueStatus.statusId)
          ))
          .then(result => result[0].count)
      : 0;
    
    return {
      pending: {
        count: pendingCount,
        trend: { value: "8% from last week", isPositive: false }
      },
      inProgress: {
        count: inProgressCount,
        trend: { value: "5% from last week", isPositive: true }
      },
      completed: {
        count: completedCount,
        trend: { value: "12% from last week", isPositive: true }
      },
      overdue: {
        count: overdueCount,
        trend: { value: "2% from last week", isPositive: false }
      }
    };
  }

  async getRecentActivities(organizationId: number): Promise<any[]> {
    // Join request history with users, requests, and statuses
    const activityLimit = 5;
    const activities = await db
      .select({
        historyId: dpRequestHistory.historyId,
        requestId: dpRequestHistory.requestId,
        changeDate: dpRequestHistory.changeDate,
        changedByFirstName: users.firstName,
        changedByLastName: users.lastName,
        oldStatusName: sql<string>`old_status.statusName`.mapWith(String),
        newStatusName: sql<string>`new_status.statusName`.mapWith(String),
        comments: dpRequestHistory.comments,
        requestType: dpRequests.requestType,
        requesterFirstName: dpRequests.firstName,
        requesterLastName: dpRequests.lastName
      })
      .from(dpRequestHistory)
      .innerJoin(users, eq(dpRequestHistory.changedByUserId, users.id))
      .innerJoin(dpRequests, eq(dpRequestHistory.requestId, dpRequests.requestId))
      .leftJoin(
        requestStatuses.as("old_status"), 
        eq(dpRequestHistory.oldStatusId, sql`old_status.statusId`)
      )
      .leftJoin(
        requestStatuses.as("new_status"), 
        eq(dpRequestHistory.newStatusId, sql`new_status.statusId`)
      )
      .where(eq(dpRequests.organizationId, organizationId))
      .orderBy(desc(dpRequestHistory.changeDate))
      .limit(activityLimit);

    // Transform to the expected format
    return activities.map(activity => {
      const timeAgo = this.getTimeAgo(activity.changeDate);
      let type = "status_change";
      let message = `Request from ${activity.requesterFirstName} ${activity.requesterLastName} status changed`;
      
      if (activity.oldStatusName && activity.newStatusName) {
        message = `Request from ${activity.requesterFirstName} ${activity.requesterLastName} status changed from ${activity.oldStatusName} to ${activity.newStatusName}`;
      }
      
      return {
        id: activity.historyId,
        type,
        message,
        timeAgo,
        icon: "assignment",
        iconClass: "bg-primary-50 text-primary-500"
      };
    });
  }

  async getRecentRequests(organizationId: number): Promise<any[]> {
    const requestLimit = 5;
    const requests = await db
      .select({
        requestId: dpRequests.requestId,
        firstName: dpRequests.firstName,
        lastName: dpRequests.lastName,
        requestType: dpRequests.requestType,
        createdAt: dpRequests.createdAt,
        statusName: requestStatuses.statusName
      })
      .from(dpRequests)
      .leftJoin(requestStatuses, eq(dpRequests.statusId, requestStatuses.statusId))
      .where(eq(dpRequests.organizationId, organizationId))
      .orderBy(desc(dpRequests.createdAt))
      .limit(requestLimit);

    return requests.map(request => {
      const timeAgo = this.getTimeAgo(request.createdAt);
      return {
        id: request.requestId,
        requesterName: `${request.firstName} ${request.lastName}`,
        requestType: request.requestType,
        status: request.statusName,
        timeAgo,
        statusClass: this.getStatusClass(request.statusName || "")
      };
    });
  }

  // Helper function to calculate time ago
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);
    
    if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    } else if (diffHr < 24) {
      return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    } else {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
  }

  // Helper function to get status CSS class
  private getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
}

// Initialize the database with default values if empty
async function initializeDatabase() {
  // Check if we have any industries
  const industryCount = await db.select({ count: count() }).from(industries);
  if (industryCount[0].count === 0) {
    // Create default industries
    await db.insert(industries).values([
      { industryName: "E-commerce" },
      { industryName: "Healthcare" },
      { industryName: "Online Gaming" },
      { industryName: "Social Media" },
      { industryName: "Educational Institution" }
    ]);
  }

  // Check if we have any request statuses
  const statusCount = await db.select({ count: count() }).from(requestStatuses);
  if (statusCount[0].count === 0) {
    // Create default request statuses
    await db.insert(requestStatuses).values([
      { statusName: "Submitted", slaDays: 7 },
      { statusName: "In Progress", slaDays: 5 },
      { statusName: "Completed", slaDays: 0 },
      { statusName: "Closed", slaDays: 0 },
      { statusName: "Overdue", slaDays: 0 }
    ]);
  }

  // Check if we have any organizations
  const orgCount = await db.select({ count: count() }).from(organizations);
  if (orgCount[0].count === 0) {
    // Get the first industry id
    const [firstIndustry] = await db.select().from(industries).limit(1);
    
    if (firstIndustry) {
      // Create admin organization
      const token = crypto.randomBytes(16).toString('hex');
      const [adminOrg] = await db.insert(organizations).values({
        businessName: "ComplyArk Admin",
        businessAddress: "Admin Building, 123 Admin Street, Admin City",
        industryId: firstIndustry.industryId,
        contactPersonName: "Admin User",
        contactEmail: "admin@complyark.com",
        contactPhone: "123-456-7890",
        noOfUsers: 1,
        remarks: "System admin organization",
        requestPageUrlToken: token
      }).returning();

      // Create a sample organization
      const orgToken = crypto.randomBytes(16).toString('hex');
      const [sampleOrg] = await db.insert(organizations).values({
        businessName: "TechCorp Solutions",
        businessAddress: "456 Tech Street, Innovation City, TC 12345",
        industryId: firstIndustry.industryId,
        contactPersonName: "John Smith",
        contactEmail: "john@techcorp.com",
        contactPhone: "987-654-3210",
        noOfUsers: 5,
        remarks: "Sample organization for testing",
        requestPageUrlToken: orgToken
      }).returning();

      // Check if we have any users
      const userCount = await db.select({ count: count() }).from(users);
      if (userCount[0].count === 0 && adminOrg && sampleOrg) {
        // Create admin user
        await db.insert(users).values({
          username: "complyarkadmin",
          password: "complyarkadmin", // In a real app, this would be hashed
          firstName: "Admin",
          lastName: "User",
          email: "admin@complyark.com",
          phone: "123-456-7890",
          role: "admin",
          organizationId: adminOrg.id,
          isActive: true,
          canEdit: true,
          canDelete: true
        });

        // Create sample user
        await db.insert(users).values({
          username: "user",
          password: "password", // In a real app, this would be hashed
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@techcorp.com",
          phone: "555-123-4567",
          role: "user",
          organizationId: sampleOrg.id,
          isActive: true,
          canEdit: false,
          canDelete: false
        });
      }
    }
  }
}

// Initialize the database and export the storage instance
initializeDatabase().catch(console.error);
export const storage = new DatabaseStorage();
