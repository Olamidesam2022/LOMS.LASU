import { useState } from 'react';
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
import { ProceduralStage, CaseStatus } from '@/types/legal';
import { toast } from 'sonner';

interface AddCaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCaseDialog({ open, onOpenChange }: AddCaseDialogProps) {
  const [formData, setFormData] = useState({
    suitNumber: '',
    caseTitle: '',
    adversaryParty: '',
    proceduralStage: '' as ProceduralStage | '',
    assignedCounsel: '',
    court: '',
    nextHearing: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.suitNumber || !formData.caseTitle || !formData.adversaryParty) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Here you would typically save to the database
    toast.success('Case created successfully', {
      description: `Case ${formData.suitNumber} has been added to the registry.`,
    });
    
    // Reset form and close
    setFormData({
      suitNumber: '',
      caseTitle: '',
      adversaryParty: '',
      proceduralStage: '',
      assignedCounsel: '',
      court: '',
      nextHearing: '',
      description: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Case</DialogTitle>
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
              <Label htmlFor="assignedCounsel">Assigned Counsel</Label>
              <Input
                id="assignedCounsel"
                placeholder="e.g., Barr. Adamu Johnson"
                value={formData.assignedCounsel}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedCounsel: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextHearing">Next Hearing Date</Label>
            <Input
              id="nextHearing"
              type="date"
              value={formData.nextHearing}
              onChange={(e) => setFormData(prev => ({ ...prev, nextHearing: e.target.value }))}
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
            <Button type="submit">Create Case</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}