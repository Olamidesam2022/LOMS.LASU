export type UserRole = "superadmin" | "admin" | "staff";

export type ProceduralStage =
  | "Mention"
  | "Interlocutory"
  | "Trial"
  | "Judgment";

export type CaseStatus = "Active" | "Pending" | "Closed" | "Urgent";

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
  version: string;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  size: string;
  status: "Draft" | "Final" | "Archived";
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
  advisoryBacklog: number;
  urgentHearings: number;
  winRate: number;
  totalCases: number;
  pendingAdvisory: number;
}
