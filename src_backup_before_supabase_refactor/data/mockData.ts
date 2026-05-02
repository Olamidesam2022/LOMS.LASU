import { 
  LitigationCase, 
  AdvisoryRequest, 
  LegalDocument, 
  AuditLog, 
  User,
  DashboardMetrics 
} from '@/types/legal';

// Empty arrays - all data will be created by users
export const mockUsers: User[] = [];

export const mockCases: LitigationCase[] = [];

export const mockAdvisoryRequests: AdvisoryRequest[] = [];

export const mockDocuments: LegalDocument[] = [];

export const mockAuditLogs: AuditLog[] = [];

export const mockMetrics: DashboardMetrics = {
  activeLitigation: 0,
  advisoryBacklog: 0,
  urgentHearings: 0,
  winRate: 0,
  totalCases: 0,
  pendingAdvisory: 0,
};
