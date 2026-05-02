import { useState, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, File, X } from 'lucide-react';
import { DocumentType } from '@/types/legal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDocumentDialog({ open, onOpenChange }: UploadDocumentDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '' as DocumentType | '',
    relatedCase: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!formData.name) {
      setFormData(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !formData.name || !formData.type) {
      toast.error('Please select a file and fill in required fields');
      return;
    }

    toast.success('Document uploaded successfully', {
      description: `"${formData.name}" has been added to the vault.`,
    });
    
    setFormData({ name: '', type: '', relatedCase: '' });
    setSelectedFile(null);
    onOpenChange(false);
  };

  const resetForm = () => {
    setFormData({ name: '', type: '', relatedCase: '' });
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document to the secure vault.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground",
              selectedFile && "border-success bg-success/5"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
            
            {selectedFile ? (
              <div className="flex items-center gap-3">
                <File className="h-8 w-8 text-success" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium text-foreground">
                  Drag and drop your file here
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  or click to browse
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="docName">Document Name *</Label>
            <Input
              id="docName"
              placeholder="Enter document name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="docType">Document Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as DocumentType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MoU">Memorandum of Understanding</SelectItem>
                <SelectItem value="Court Process">Court Process</SelectItem>
                <SelectItem value="Legal Opinion">Legal Opinion</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Correspondence">Correspondence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="relatedCase">Related Case (Optional)</Label>
            <Input
              id="relatedCase"
              placeholder="e.g., FHC/L/CS/001/2024"
              value={formData.relatedCase}
              onChange={(e) => setFormData(prev => ({ ...prev, relatedCase: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFile}>
              Upload Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}