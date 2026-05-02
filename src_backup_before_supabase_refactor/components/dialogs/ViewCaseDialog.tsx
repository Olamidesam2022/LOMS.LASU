import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { LitigationCase } from '@/types/legal';
import { Calendar, MapPin, User, FileText, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseItem: LitigationCase | null;
}

const stageColors = {
  Mention: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Interlocutory: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Trial: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Judgment: 'bg-green-500/10 text-green-600 border-green-500/20',
};

const statusColors = {
  Active: 'bg-success/10 text-success',
  Pending: 'bg-warning/10 text-warning',
  Closed: 'bg-muted text-muted-foreground',
  Urgent: 'bg-destructive/10 text-destructive',
};

export function ViewCaseDialog({ open, onOpenChange, caseItem }: ViewCaseDialogProps) {
  if (!caseItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{caseItem.suitNumber}</DialogTitle>
              <DialogDescription className="mt-1">
                {caseItem.caseTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={stageColors[caseItem.proceduralStage]}>
              {caseItem.proceduralStage}
            </Badge>
            <Badge variant="outline" className={statusColors[caseItem.status]}>
              {caseItem.status}
            </Badge>
          </div>

          {/* Case Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Scale className="h-4 w-4" />
                <span>Adversary Party</span>
              </div>
              <p className="font-medium text-foreground">{caseItem.adversaryParty}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Assigned Counsel</span>
              </div>
              <p className="font-medium text-foreground">{caseItem.assignedCounsel}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Court</span>
              </div>
              <p className="font-medium text-foreground">{caseItem.court}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Next Hearing</span>
              </div>
              <p className="font-medium text-foreground">
                {caseItem.nextHearing.toLocaleDateString('en-NG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Filed Date</span>
              </div>
              <p className="font-medium text-foreground">
                {caseItem.filedDate.toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Description */}
          {caseItem.description && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Case Description</h4>
              <p className="text-foreground">{caseItem.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}