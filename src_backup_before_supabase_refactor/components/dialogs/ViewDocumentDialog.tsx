import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LegalDocument } from '@/types/legal';
import { Calendar, User, FileText, Download, Tag, History } from 'lucide-react';
import { toast } from 'sonner';

interface ViewDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: LegalDocument | null;
}

const typeColors = {
  'MoU': 'bg-info/10 text-info border-info/20',
  'Court Process': 'bg-warning/10 text-warning border-warning/20',
  'Legal Opinion': 'bg-success/10 text-success border-success/20',
  'Contract': 'bg-accent/20 text-accent-foreground border-accent/20',
  'Correspondence': 'bg-muted text-muted-foreground border-border',
};

const statusColors = {
  Draft: 'bg-warning/10 text-warning',
  Final: 'bg-success/10 text-success',
  Archived: 'bg-muted text-muted-foreground',
};

export function ViewDocumentDialog({ open, onOpenChange, document }: ViewDocumentDialogProps) {
  if (!document) return null;

  const handleDownload = () => {
    toast.success(`Downloading: ${document.name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{document.name}</DialogTitle>
              <DialogDescription className="mt-1">
                Document details and metadata
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={typeColors[document.type]}>
              {document.type}
            </Badge>
            <Badge variant="outline" className={statusColors[document.status]}>
              {document.status}
            </Badge>
            <Badge variant="outline" className="bg-muted text-muted-foreground">
              Version {document.version}
            </Badge>
          </div>

          {/* Document Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Uploaded By</span>
              </div>
              <p className="font-medium text-foreground">{document.uploadedBy}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                <span>File Size</span>
              </div>
              <p className="font-medium text-foreground">{document.size}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Upload Date</span>
              </div>
              <p className="font-medium text-foreground">
                {document.uploadedAt.toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <History className="h-4 w-4" />
                <span>Last Modified</span>
              </div>
              <p className="font-medium text-foreground">
                {document.lastModified.toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {document.caseId && (
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Related Case</span>
                </div>
                <p className="font-medium text-foreground">{document.caseId}</p>
              </div>
            )}
          </div>

          {/* Download Button */}
          <Button onClick={handleDownload} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download Document
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}