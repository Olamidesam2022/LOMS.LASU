import { useState } from 'react';
import { 
  Search, 
  Plus, 
  Clock, 
  User, 
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { AdvisoryRequest, AdvisoryStatus } from '@/types/legal';
import { cn } from '@/lib/utils';

interface AdvisoryWorkflowProps {
  requests: AdvisoryRequest[];
  onAddRequest?: () => void;
  onViewRequest?: (request: AdvisoryRequest) => void;
}

const statusConfig: Record<AdvisoryStatus, { icon: React.ElementType; color: string; bgColor: string }> = {
  Pending: { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10' },
  'In Progress': { icon: Loader2, color: 'text-info', bgColor: 'bg-info/10' },
  Completed: { icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10' },
  Urgent: { icon: AlertCircle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
};

const priorityColors = {
  Low: 'bg-muted text-muted-foreground',
  Medium: 'bg-info/10 text-info',
  High: 'bg-warning/10 text-warning',
  Critical: 'bg-destructive/10 text-destructive',
};

export function AdvisoryWorkflow({ requests, onAddRequest, onViewRequest }: AdvisoryWorkflowProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdvisoryStatus | 'all'>('all');

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const groupedRequests = {
    Urgent: filteredRequests.filter(r => r.status === 'Urgent'),
    Pending: filteredRequests.filter(r => r.status === 'Pending'),
    'In Progress': filteredRequests.filter(r => r.status === 'In Progress'),
    Completed: filteredRequests.filter(r => r.status === 'Completed'),
  };

  const getDaysRemaining = (dueDate: Date) => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return days;
  };

  return (
    <div className="space-y-4 p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Advisory Workflow</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Track legal advice requests from VC Office and Registry
          </p>
        </div>
        <button 
          onClick={onAddRequest}
          className="gold-button flex items-center justify-center gap-2 rounded-lg px-4 py-2 sm:py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Request</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input w-full pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {(['all', 'Urgent', 'Pending', 'In Progress', 'Completed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "flex-shrink-0 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap",
                statusFilter === status 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban-style View */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.entries(groupedRequests) as [AdvisoryStatus, AdvisoryRequest[]][]).map(([status, items]) => {
          const { icon: StatusIcon, color, bgColor } = statusConfig[status];
          
          return (
            <div key={status} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Column Header */}
              <div className={cn("flex items-center gap-2 border-b border-border p-3 sm:p-4", bgColor)}>
                <StatusIcon className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0", color, status === 'In Progress' && "animate-spin")} />
                <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{status}</h3>
                <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground flex-shrink-0">
                  {items.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="max-h-[50vh] sm:max-h-[60vh] space-y-2 sm:space-y-3 overflow-y-auto p-2 sm:p-3 scrollbar-thin">
                {items.map((request, index) => {
                  const daysRemaining = getDaysRemaining(request.dueDate);
                  
                  return (
                    <div
                      key={request.id}
                      onClick={() => onViewRequest?.(request)}
                      className="animate-fade-in cursor-pointer rounded-lg border border-border bg-background p-2 sm:p-3 transition-all hover:border-accent/50 hover:shadow-md overflow-hidden"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">
                          {request.requestNumber}
                        </span>
                        <span className={cn("status-pill text-[10px] sm:text-xs flex-shrink-0", priorityColors[request.priority])}>
                          {request.priority}
                        </span>
                      </div>
                      
                      <h4 className="mb-2 line-clamp-2 text-xs sm:text-sm font-medium text-foreground">
                        {request.title}
                      </h4>
                      
                      <div className="space-y-1 text-[10px] sm:text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{request.department}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{request.requestedBy}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className={cn(
                            daysRemaining <= 1 && status !== 'Completed' && "text-destructive font-medium"
                          )}>
                            {status === 'Completed' 
                              ? 'Completed'
                              : daysRemaining < 0 
                                ? `Overdue ${Math.abs(daysRemaining)}d`
                                : daysRemaining === 0 
                                  ? 'Due today'
                                  : `${daysRemaining}d left`
                            }
                          </span>
                        </div>
                      </div>

                      {request.assignedTo && (
                        <div className="mt-2 sm:mt-3 flex items-center justify-between border-t border-border pt-2">
                          <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {request.assignedTo.split(' ').slice(-1)[0]}
                          </span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="py-6 sm:py-8 text-center text-xs sm:text-sm text-muted-foreground">
                    No requests
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
