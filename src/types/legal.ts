export type UserRole = "superadmin" | "admin" | "staff";

export type ProceduralStage =
  | "Mention"
  | "Interlocutory"
  | "Trial"
  | "Judgment";

export type CaseStatus =
  | "Active"
  | "In Progress"
  | "Pending"
  | "Closed"
  | "Urgent"
  | "Archived";

export type AdvisoryStatus = "Pending" | "In Progress" | "Completed" | "Urgent";

export type DocumentType =
  | "MoU"
  | "Court Process"
  | "Legal Opinion"
  | "Contract"
  | "Correspondence";

export interface LitigationCase {
  id: string;
  suitNumber: string;
  caseTitle: string;
  adversaryParty: string;
  proceduralStage: ProceduralStage;
  assignedCounsel: string;
  status: CaseStatus;
  nextHearing: Date;
  court: string;
  filedDate: Date;
  description: string;
  createdBy?: string;
  creatorEmail?: string;
  enteredBy?: string;
  assignedTo?: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

export interface AdvisoryRequest {
  id: string;
  requestNumber: string;
  title: string;
  requestedBy: string;
  department: string;
  dateReceived: Date;
  dueDate: Date;
  status: AdvisoryStatus;
  assignedTo: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  description: string;
}

export interface LegalDocument {
  id: string;
  name: string;
  type: DocumentType;
  caseId?: string;
  storagePath?: string;
  mimeType?: string;
  version: string;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  size: string;
  status: "Draft" | "Final" | "Archived";
  createdBy?: string;
  enteredBy?: string;
  canDelete?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  timestamp: Date;
  ipAddress: string;
  details: string;
}

export type CaseTaskStatus = "open" | "in_progress" | "completed";
export type CaseTaskPriority = "low" | "normal" | "high" | "urgent";

export interface CaseNote {
  id: string;
  caseId: string;
  content: string;
  createdBy?: string;
  authorName: string;
  isPrivate: boolean;
  noteType: string;
  createdAt: Date;
}

export interface CaseTask {
  id: string;
  caseId: string;
  title: string;
  description?: string;
  status: CaseTaskStatus;
  priority: CaseTaskPriority;
  dueDate?: Date;
  assignedTo?: string;
  assigneeName: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: "pending" | "approved" | "rejected";
  department: string;
  avatar?: string;
}

export interface DashboardMetrics {
  activeLitigation: number;
  urgentHearings: number;
  winRate: number;
  totalCases: number;
}
