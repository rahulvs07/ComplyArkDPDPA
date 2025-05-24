import { pgTable, text, serial, integer, boolean, date, timestamp, unique, foreignKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Industries Table
export const industries = pgTable("industries", {
  industryId: serial("industryId").primaryKey(),
  industryName: text("industryName").notNull().unique(),
});

// Organizations Table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  businessName: text("businessName").notNull(),
  businessAddress: text("businessAddress").notNull(),
  industryId: integer("industryId").notNull().references(() => industries.industryId),
  contactPersonName: text("contactPersonName").notNull(),
  contactEmail: text("contactEmail").notNull(),
  contactPhone: text("contactPhone").notNull(),
  noOfUsers: integer("noOfUsers").notNull(),
  remarks: text("remarks"),
  requestPageUrlToken: text("requestPageUrlToken"),
});

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  canEdit: boolean("canEdit").notNull().default(false),
  canDelete: boolean("canDelete").notNull().default(false),
});

// Templates Table
export const templates = pgTable("templates", {
  templateId: serial("templateId").primaryKey(),
  templateName: text("templateName").notNull(),
  templateBody: text("templateBody").notNull(),
  industryId: integer("industryId").notNull().references(() => industries.industryId),
  templatePath: text("templatePath"),
});

// Notices Table
export const notices = pgTable("notices", {
  noticeId: serial("noticeId").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  noticeName: text("noticeName").notNull(),
  noticeBody: text("noticeBody").notNull(),
  createdBy: integer("createdBy").notNull().references(() => users.id),
  createdOn: timestamp("createdOn").notNull().defaultNow(),
  noticeType: text("noticeType"),
  version: text("version"),
  folderLocation: text("folderLocation"),
});

// TranslatedNotices Table
export const translatedNotices = pgTable("translatedNotices", {
  id: serial("id").primaryKey(),
  noticeId: integer("noticeId").notNull().references(() => notices.noticeId),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  language: text("language").notNull(),
  translatedBody: text("translatedBody").notNull(),
  filePath: text("filePath"),
  createdOn: timestamp("createdOn").notNull().defaultNow(),
});

// RequestStatus Table
export const requestStatuses = pgTable("requestStatuses", {
  statusId: serial("statusId").primaryKey(),
  statusName: text("statusName").notNull(),
  slaDays: integer("slaDays").notNull(),
  isActive: boolean("isActive").notNull().default(true),
});

// DPRequests Table
export const dpRequests = pgTable("dpRequests", {
  requestId: serial("requestId").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  requestType: text("requestType", { enum: ["Access", "Correction", "Nomination", "Erasure"] }).notNull(),
  requestComment: text("requestComment"),
  statusId: integer("statusId").notNull().references(() => requestStatuses.statusId),
  assignedToUserId: integer("assignedToUserId").references(() => users.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  lastUpdatedAt: timestamp("lastUpdatedAt"),
  completionDate: date("completionDate"),
  completedOnTime: boolean("completedOnTime"),
  closedDateTime: timestamp("closedDateTime"),
  closureComments: text("closureComments"),
});

// DPRequestHistory Table
export const dpRequestHistory = pgTable("dpRequestHistory", {
  historyId: serial("historyId").primaryKey(),
  requestId: integer("requestId").notNull().references(() => dpRequests.requestId),
  changeDate: timestamp("changeDate").notNull().defaultNow(),
  changedByUserId: integer("changedByUserId").notNull().references(() => users.id),
  oldStatusId: integer("oldStatusId").references(() => requestStatuses.statusId),
  newStatusId: integer("newStatusId").references(() => requestStatuses.statusId),
  oldAssignedToUserId: integer("oldAssignedToUserId").references(() => users.id),
  newAssignedToUserId: integer("newAssignedToUserId").references(() => users.id),
  comments: text("comments"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({ 
  id: true 
});

export const insertIndustrySchema = createInsertSchema(industries).omit({ 
  industryId: true 
});

export const insertTemplateSchema = createInsertSchema(templates).omit({ 
  templateId: true 
});

export const insertNoticeSchema = createInsertSchema(notices).omit({ 
  noticeId: true, 
  createdOn: true 
});

export const insertTranslatedNoticeSchema = createInsertSchema(translatedNotices).omit({ 
  id: true, 
  createdOn: true 
});

export const insertRequestStatusSchema = createInsertSchema(requestStatuses).omit({ 
  statusId: true 
});

export const insertDPRequestSchema = createInsertSchema(dpRequests).omit({ 
  requestId: true, 
  createdAt: true, 
  lastUpdatedAt: true, 
  completedOnTime: true, 
  closedDateTime: true 
});

export const insertDPRequestHistorySchema = createInsertSchema(dpRequestHistory).omit({ 
  historyId: true, 
  changeDate: true 
});

// Grievances Table
export const grievances = pgTable("grievances", {
  grievanceId: serial("grievanceId").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  grievanceComment: text("grievanceComment").notNull(),
  statusId: integer("statusId").notNull().references(() => requestStatuses.statusId),
  assignedToUserId: integer("assignedToUserId").references(() => users.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  lastUpdatedAt: timestamp("lastUpdatedAt"),
  completionDate: date("completionDate"),
  completedOnTime: boolean("completedOnTime"),
  closedDateTime: timestamp("closedDateTime"),
  closureComments: text("closureComments"),
});

// GrievanceHistory Table
export const grievanceHistory = pgTable("grievanceHistory", {
  historyId: serial("historyId").primaryKey(),
  grievanceId: integer("grievanceId").notNull().references(() => grievances.grievanceId),
  changeDate: timestamp("changeDate").notNull().defaultNow(),
  changedByUserId: integer("changedByUserId").notNull().references(() => users.id),
  oldStatusId: integer("oldStatusId").references(() => requestStatuses.statusId),
  newStatusId: integer("newStatusId").references(() => requestStatuses.statusId),
  oldAssignedToUserId: integer("oldAssignedToUserId").references(() => users.id),
  newAssignedToUserId: integer("newAssignedToUserId").references(() => users.id),
  comments: text("comments"),
});

// Compliance Documents Table for Module 4
export const complianceDocuments = pgTable("complianceDocuments", {
  documentId: serial("documentId").primaryKey(),
  documentName: text("documentName").notNull(),
  documentPath: text("documentPath").notNull(),
  documentType: text("documentType").notNull(),
  uploadedBy: integer("uploadedBy").notNull().references(() => users.id),
  uploadedAt: timestamp("uploadedAt").notNull().defaultNow(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  folderPath: text("folderPath").notNull(),
});

// Insert schemas for the new tables
export const insertGrievanceSchema = createInsertSchema(grievances).omit({ 
  grievanceId: true, 
  createdAt: true, 
  lastUpdatedAt: true, 
  completedOnTime: true, 
  closedDateTime: true 
});

export const insertGrievanceHistorySchema = createInsertSchema(grievanceHistory).omit({ 
  historyId: true, 
  changeDate: true 
});

export const insertComplianceDocumentSchema = createInsertSchema(complianceDocuments).omit({ 
  documentId: true, 
  uploadedAt: true 
});

// Notification Logs Table
export const notificationLogs = pgTable("notification_logs", {
  notificationId: serial("notification_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  module: text("module", { enum: ["DPR", "Grievance", "Notice", "Document", "Admin"] }).notNull(),
  action: text("action").notNull(),
  actionType: text("action_type", { 
    enum: ["created", "reassigned", "updated", "escalated", "translated", "closed", "viewed"] 
  }).notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status").notNull().default("active"),
  initiator: text("initiator").notNull().default("user"),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  relatedItemId: integer("related_item_id"),
  relatedItemType: text("related_item_type"),
});

// Insert schema for notification logs
export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({
  notificationId: true,
  timestamp: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type Industry = typeof industries.$inferSelect;
export type InsertIndustry = z.infer<typeof insertIndustrySchema>;

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;

export type Notice = typeof notices.$inferSelect;
export type InsertNotice = z.infer<typeof insertNoticeSchema>;

export type TranslatedNotice = typeof translatedNotices.$inferSelect;
export type InsertTranslatedNotice = z.infer<typeof insertTranslatedNoticeSchema>;

export type RequestStatus = typeof requestStatuses.$inferSelect;
export type InsertRequestStatus = z.infer<typeof insertRequestStatusSchema>;

export type DPRequest = typeof dpRequests.$inferSelect;
export type InsertDPRequest = z.infer<typeof insertDPRequestSchema>;

export type DPRequestHistory = typeof dpRequestHistory.$inferSelect;
export type InsertDPRequestHistory = z.infer<typeof insertDPRequestHistorySchema>;

export type Grievance = typeof grievances.$inferSelect;
export type InsertGrievance = z.infer<typeof insertGrievanceSchema>;

export type GrievanceHistory = typeof grievanceHistory.$inferSelect;
export type InsertGrievanceHistory = z.infer<typeof insertGrievanceHistorySchema>;

export type ComplianceDocument = typeof complianceDocuments.$inferSelect;
export type InsertComplianceDocument = z.infer<typeof insertComplianceDocumentSchema>;

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;

// Email Settings Table
export const emailSettings = pgTable("emailSettings", {
  id: serial("id").primaryKey(),
  provider: text("provider", { enum: ["smtp", "sendgrid"] }).notNull().default("smtp"),
  fromEmail: text("fromEmail").notNull(),
  fromName: text("fromName").notNull(),
  // SMTP-specific fields
  smtpHost: text("smtpHost"),
  smtpPort: integer("smtpPort"),
  smtpUsername: text("smtpUsername"),
  smtpPassword: text("smtpPassword"),
  useTLS: boolean("useTLS").default(true),
  // SendGrid-specific fields
  sendgridApiKey: text("sendgridApiKey"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Email Templates Table
export const emailTemplates = pgTable("emailTemplates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Insert schemas for email
export const insertEmailSettingsSchema = createInsertSchema(emailSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types for email
export type EmailSetting = typeof emailSettings.$inferSelect;
export type InsertEmailSetting = z.infer<typeof insertEmailSettingsSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// OTP Verification Table
export const otpVerifications = pgTable("otpVerifications", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  otp: text("otp").notNull(),
  email: text("email").notNull(),
  organizationId: integer("organizationId").references(() => organizations.id),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verifiedAt"),
});

// Insert schema for OTP verification
export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
  verified: true,
  verifiedAt: true
});

// Types for OTP verification
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;

// Exception Logging Table
export const exceptionLogs = pgTable("exceptionLogs", {
  id: serial("id").primaryKey(),
  pageName: text("pageName").notNull(),
  functionName: text("functionName").notNull(),
  errorMessage: text("errorMessage").notNull(),
  stackTrace: text("stackTrace"),
  userId: integer("userId").references(() => users.id),
  organizationId: integer("organizationId").references(() => organizations.id),
  browserInfo: text("browserInfo"),
  url: text("url"),
  additionalInfo: text("additionalInfo"),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull().default("medium"),
  status: text("status", { enum: ["new", "in_progress", "resolved", "ignored"] }).notNull().default("new"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  resolvedAt: timestamp("resolvedAt"),
});

// Insert schema for exception logs
export const insertExceptionLogSchema = createInsertSchema(exceptionLogs).omit({
  id: true,
  createdAt: true,
  resolvedAt: true
});

// Types for exception logs
export type ExceptionLog = typeof exceptionLogs.$inferSelect;
export type InsertExceptionLog = z.infer<typeof insertExceptionLogSchema>;
