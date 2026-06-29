import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CaseStatus, LitigationCase, ProceduralStage, User } from '@/types/legal';
import { toast } from 'sonner';

interface AddCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCase?: (input: {
    title: string;
    description?: string;
    suitNumber?: string;
    adversaryParty?: string;
    proceduralStage?: string;
    assignedCounsel?: string;
    assignedTo?: string;
    assignedUserIds?: string[];
    court?: string;
    nextHearing?: string;
    filingDeadline?: string;
    status?: string;
  }) => Promise<void>;
  caseItem?: LitigationCase | null;
  users?: User[];
  canAssignCase?: boolean;
}

export function AddCaseDialog({
  open,
  onOpenChange,
  onCreateCase,
  caseItem,
  users = [],
  canAssignCase = false,
}: AddCaseDialogProps) {
  const [formData, setFormData] = useState({
    suitNumber: '',
    caseTitle: '',
    adversaryParty: '',
    proceduralStage: '' as ProceduralStage | '',
    assignedCounsel: '',
    assignedTo: '',
    assignedUserIds: [] as string[],
    court: '',
    nextHearing: '',
    filingDeadline: '',
    status: 'Active' as CaseStatus,
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const assignableUsers = useMemo(
    () =>
      users
        .filter((user) => user.status === "approved" && user.role === "staff")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  );

  useEffect(() => {
    if (!open) return;

    if (caseItem) {
      let meta: { filingDeadline?: string | null } = {};
      try {
        meta = caseItem.description ? JSON.parse(caseItem.description) : {};
      } catch {
        meta = {};
      }

      setFormData({
        suitNumber: caseItem.suitNumber === "Unassigned" ? "" : caseItem.suitNumber,
        caseTitle: caseItem.caseTitle,
        adversaryParty: caseItem.adversaryParty === "Unspecified" ? "" : caseItem.adversaryParty,
        proceduralStage: caseItem.proceduralStage,
        assignedCounsel: caseItem.assignedCounsel === "Unassigned" ? "" : caseItem.assignedCounsel,
        assignedTo: caseItem.assignedTo || '',
        assignedUserIds: caseItem.assignedUserIds?.length
          ? caseItem.assignedUserIds
          : caseItem.assignedTo
            ? [caseItem.assignedTo]
            : [],
        court: caseItem.court === "Unspecified" ? "" : caseItem.court,
        nextHearing: caseItem.nextHearing.toISOString().slice(0, 10),
        filingDeadline: meta.filingDeadline || '',
        status: caseItem.status,
        description: caseItem.description,
      });
    } else {
      setFormData({
        suitNumber: '',
        caseTitle: '',
        adversaryParty: '',
        proceduralStage: '',
        assignedCounsel: '',
        assignedTo: '',
        assignedUserIds: [],
        court: '',
        nextHearing: '',
        filingDeadline: '',
        status: 'Active',
        description: '',
      });
    }
  }, [caseItem, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.suitNumber || !formData.caseTitle || !formData.adversaryParty) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await onCreateCase?.({
        title: formData.caseTitle,
        description: formData.description,
        suitNumber: formData.suitNumber,
        adversaryParty: formData.adversaryParty,
        proceduralStage: formData.proceduralStage || "Mention",
        assignedCounsel: formData.assignedCounsel,
        assignedTo: canAssignCase ? formData.assignedTo : undefined,
        assignedUserIds: canAssignCase ? formData.assignedUserIds : undefined,
        court: formData.court,
        nextHearing: formData.nextHearing,
        filingDeadline: formData.filingDeadline,
        status: formData.status,
      });

      toast.success(
        caseItem
          ? 'Case updated successfully'
          : `Case ${formData.suitNumber} registered successfully.`,
        {
          description: `Case ${formData.suitNumber || formData.caseTitle} has been saved.`,
          action: !caseItem
            ? {
                label: "Copy",
                onClick: () => navigator.clipboard?.writeText(formData.suitNumber),
              }
            : undefined,
        },
      );
      
      setFormData({
        suitNumber: '',
        caseTitle: '',
        adversaryParty: '',
        proceduralStage: '',
        assignedCounsel: '',
        assignedTo: '',
        assignedUserIds: [],
        court: '',
        nextHearing: '',
        filingDeadline: '',
        status: 'Active',
        description: '',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to create case', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignedUserToggle = (userId: string) => {
    setFormData((prev) => {
      const assignedUserIds = prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter((id) => id !== userId)
        : [...prev.assignedUserIds, userId];
      const selectedUsers = assignableUsers.filter((account) =>
        assignedUserIds.includes(account.id),
      );

      return {
        ...prev,
        assignedTo: selectedUsers[0]?.id || "",
        assignedUserIds,
        assignedCounsel: selectedUsers.map((account) => account.name).join(", "),
      };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{caseItem ? "Edit Case" : "Add New Case"}</DialogTitle>
          <DialogDescription>
            Enter the details for the new litigation case.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="suitNumber">Suit Number *</Label>
              <Input
                id="suitNumber"
                placeholder="e.g., FHC/L/CS/001/2024"
                value={formData.suitNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, suitNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="court">Court</Label>
              <Input
                id="court"
                placeholder="e.g., Federal High Court Lagos"
                value={formData.court}
                onChange={(e) => setFormData(prev => ({ ...prev, court: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseTitle">Case Title *</Label>
            <Input
              id="caseTitle"
              placeholder="e.g., NNPC vs ABC Corporation"
              value={formData.caseTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, caseTitle: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adversaryParty">Adversary Party *</Label>
            <Input
              id="adversaryParty"
              placeholder="Name of opposing party"
              value={formData.adversaryParty}
              onChange={(e) => setFormData(prev => ({ ...prev, adversaryParty: e.target.value }))}
            />
          </div>

          {canAssignCase && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="space-y-2">
                <Label>Assign case to accounts</Label>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-card">
                  {assignableUsers.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">
                      No approved legal user accounts available
                    </p>
                  ) : (
                    assignableUsers.map((account) => (
                      <label
                        key={account.id}
                        className="flex cursor-pointer items-start gap-3 border-b border-border p-3 text-sm last:border-0 hover:bg-muted/50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.assignedUserIds.includes(account.id)}
                          onChange={() => handleAssignedUserToggle(account.id)}
                          className="mt-1 h-4 w-4"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-foreground">
                            {account.name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {account.email} - {account.role}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Every selected account will automatically see this case after it is saved.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proceduralStage">Procedural Stage</Label>
              <Select
                value={formData.proceduralStage}
                onValueChange={(value) => setFormData(prev => ({ ...prev, proceduralStage: value as ProceduralStage }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mention">Mention</SelectItem>
                  <SelectItem value="Interlocutory">Interlocutory</SelectItem>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Judgment">Judgment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Case Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as CaseStatus }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignedCounsel">Assigned Counsel</Label>
              <Input
                id="assignedCounsel"
                placeholder={canAssignCase ? "Filled from assigned account" : "e.g., Barr. Adamu Johnson"}
                value={formData.assignedCounsel}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedCounsel: e.target.value }))}
                readOnly={canAssignCase && Boolean(formData.assignedTo)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextHearing">Next Date</Label>
              <Input
                id="nextHearing"
                type="date"
                value={formData.nextHearing}
                onChange={(e) => setFormData(prev => ({ ...prev, nextHearing: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filingDeadline">Filing Date</Label>
            <Input
              id="filingDeadline"
              type="date"
              value={formData.filingDeadline}
              onChange={(e) => setFormData(prev => ({ ...prev, filingDeadline: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Case Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the case..."
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : caseItem ? 'Save Case' : 'Create Case'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
