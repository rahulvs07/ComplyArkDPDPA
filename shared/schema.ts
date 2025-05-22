import { pgTable, text, serial, integer, boolean, date, timestamp, unique, foreignKey } from "drizzle-orm/pg-core";
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
