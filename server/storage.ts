import { 
  users, industries, organizations, templates, notices, translatedNotices,
  requestStatuses, dpRequests, dpRequestHistory,
  type User, type InsertUser, 
  type Industry, type InsertIndustry,
  type Organization, type InsertOrganization,
  type Template, type InsertTemplate,
  type Notice, type InsertNotice,
  type TranslatedNotice, type InsertTranslatedNotice,
  type RequestStatus, type InsertRequestStatus,
  type DPRequest, type InsertDPRequest,
  type DPRequestHistory, type InsertDPRequestHistory
} from "@shared/schema";
import crypto from 'crypto';

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(organizationId?: number): Promise<User[]>;
  
  // Organization operations
  getOrganization(id: number): Promise<Organization | undefined>;
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
  createTranslatedNotice(translatedNotice: InsertTranslatedNotice): Promise<TranslatedNotice>;
  deleteTranslatedNotice(id: number): Promise<boolean>;
  listTranslatedNotices(noticeId: number): Promise<TranslatedNotice[]>;
  
  // Request Status operations
  getRequestStatus(id: number): Promise<RequestStatus | undefined>;
  createRequestStatus(status: InsertRequestStatus): Promise<RequestStatus>;
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
  
  // Dashboard operations
  getDashboardStats(organizationId: number): Promise<any>;
  getRecentActivities(organizationId: number): Promise<any[]>;
  getRecentRequests(organizationId: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
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

  // Organization operations
  async getOrganization(id: number): Promise<Organization | undefined> {
    return this.organizationsData.get(id);
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

  // DP Request operations
  async getDPRequest(id: number): Promise<DPRequest | undefined> {
    return this.dpRequestsData.get(id);
  }

  async createDPRequest(insertRequest: InsertDPRequest): Promise<DPRequest> {
    const requestId = this.currentDPRequestId++;
    const createdAt = new Date();
    const request: DPRequest = { 
      ...insertRequest, 
      requestId, 
      createdAt, 
      lastUpdatedAt: createdAt,
      completedOnTime: null,
      closedDateTime: null
    };
    this.dpRequestsData.set(requestId, request);
    return request;
  }

  async updateDPRequest(id: number, updates: Partial<InsertDPRequest>): Promise<DPRequest | undefined> {
    const request = this.dpRequestsData.get(id);
    if (!request) return undefined;
    
    const lastUpdatedAt = new Date();
    const updatedRequest = { ...request, ...updates, lastUpdatedAt };
    this.dpRequestsData.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteDPRequest(id: number): Promise<boolean> {
    return this.dpRequestsData.delete(id);
  }

  async listDPRequests(organizationId: number, statusId?: number): Promise<DPRequest[]> {
    const requests = Array.from(this.dpRequestsData.values());
    if (statusId) {
      return requests.filter(req => req.organizationId === organizationId && req.statusId === statusId);
    }
    return requests.filter(req => req.organizationId === organizationId);
  }

  // DP Request History operations
  async createDPRequestHistory(insertHistory: InsertDPRequestHistory): Promise<DPRequestHistory> {
    const historyId = this.currentDPRequestHistoryId++;
    const changeDate = new Date();
    const history: DPRequestHistory = { ...insertHistory, historyId, changeDate };
    this.dpRequestHistoryData.set(historyId, history);
    return history;
  }

  async listDPRequestHistory(requestId: number): Promise<DPRequestHistory[]> {
    const history = Array.from(this.dpRequestHistoryData.values());
    return history.filter(h => h.requestId === requestId);
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
    // Return default requests
    return [
      {
        id: "#1248",
        name: "Sarah Johnson",
        requestType: "Access",
        status: "In Progress",
        assignedTo: "John Doe",
        dueDate: "Jul 29, 2023"
      },
      {
        id: "#1247",
        name: "Michael Brown",
        requestType: "Correction",
        status: "Completed",
        assignedTo: "Emma Wilson",
        dueDate: "Jul 28, 2023"
      },
      {
        id: "#1246",
        name: "Lisa Chen",
        requestType: "Erasure",
        status: "Submitted",
        assignedTo: "Unassigned",
        dueDate: "Jul 31, 2023"
      },
      {
        id: "#1245",
        name: "Robert Davis",
        requestType: "Nomination",
        status: "Overdue",
        assignedTo: "John Doe",
        dueDate: "Jul 25, 2023"
      }
    ];
  }
}

export const storage = new MemStorage();
