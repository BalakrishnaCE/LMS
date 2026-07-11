import { useState } from "react";
import { BookOpen, Search, Filter, Loader2, Plus, Trash2, RefreshCw, FileText, MoreVertical, Edit, Clock, CheckCircle, AlertCircle, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import KnowledgeUploadModal from "@/components/Lumi1/KnowledgeUploadModal";
import KnowledgeEditModal from "@/components/Lumi1/KnowledgeEditModal";
import { useFrappeGetCall, useFrappePostCall, useFrappeGetDocList } from "frappe-react-sdk";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

function BulkEditDeptModal({ selectedItems, onUpdate, children }: { selectedItems: string[], onUpdate: () => void, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  
  const { data: departmentDocs } = useFrappeGetDocList("Department", { limit: 1000 });
  const departmentOptions = departmentDocs?.map((d: any) => ({ value: d.name, label: d.name })) || [];
  const { call: updateDepartments, loading } = useFrappePostCall("novel_lms.lumi_backend.api.update_knowledge_departments");

  const handleSave = async () => {
    try {
      await updateDepartments({
        item_names: JSON.stringify(selectedItems),
        departments: JSON.stringify(selectedDepartments)
      });
      toast.success("Departments updated successfully");
      setOpen(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update departments");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Edit Departments</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            Select departments to assign to {selectedItems.length} selected knowledge item(s). This will replace their existing departments.
          </p>
          <MultiSelect
            options={departmentOptions}
            selected={selectedDepartments}
            onSelect={setSelectedDepartments}
            placeholder="Select departments..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Apply to {selectedItems.length} Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function KnowledgePage() {
  const { data: knowledgeData, isLoading: isLoadingKnowledge, mutate: mutateKnowledge } = useFrappeGetCall("novel_lms.lumi_backend.api.get_knowledge_feed");
  const { data: sourceData, isLoading: isLoadingSources, mutate: mutateSources } = useFrappeGetCall("novel_lms.lumi_backend.api.get_data_sources");
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  const knowledgeItems = knowledgeData?.message?.data || knowledgeData?.data || [];
  const dataSources = sourceData?.message?.data || sourceData?.data || [];
  
  const { call: deleteItem } = useFrappePostCall("novel_lms.lumi_backend.api.request_deletion");

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item? This will also remove its context from the Graph Database.")) return;
    
    try {
      const res = await deleteItem({ item_id: itemId });
      toast.success(res.message?.message || res.message || "Deletion requested.");
      mutateKnowledge();
    } catch (err) {
      toast.error("Failed to delete item.");
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === knowledgeItems.length && knowledgeItems.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(knowledgeItems.map((item: any) => item.name));
    }
  };

  const toggleItem = (name: string) => {
    setSelectedItems(prev => prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} selected items?`)) return;
    
    toast.loading(`Deleting ${selectedItems.length} items...`, { id: "bulk-delete" });
    let successCount = 0;
    for (const itemId of selectedItems) {
      try {
        await deleteItem({ item_id: itemId });
        successCount++;
      } catch (err) {
        console.error("Failed to delete", itemId);
      }
    }
    toast.success(`Deleted ${successCount}/${selectedItems.length} items.`, { id: "bulk-delete" });
    setSelectedItems([]);
    mutateKnowledge();
  };

  const refreshAll = () => {
    mutateSources();
    mutateKnowledge();
    toast.success("Refreshed status.");
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Completed' || status === 'Published') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'Failed' || status === 'Rejected') return <AlertCircle className="w-4 h-4 text-red-600" />;
    return <Clock className="w-4 h-4 text-yellow-600 animate-pulse" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'Completed' || status === 'Published') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'Failed' || status === 'Rejected') return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-background space-y-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-primary" />
            Lumi Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI knowledge graph and document ingestion pipeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={refreshAll} title="Refresh Status">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <KnowledgeUploadModal>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Upload Data Source
            </Button>
          </KnowledgeUploadModal>
        </div>
      </div>

      {/* Data Sources Tracker Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Server className="w-5 h-5 text-muted-foreground" />
            Active Ingestions
          </h2>
        </div>
        
        {isLoadingSources ? (
          <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : dataSources.length === 0 ? (
          <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg border border-dashed text-center">
            No active data source uploads.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {dataSources.slice(0, 4).map((source: any) => (
              <div key={source.name} className="bg-card p-4 rounded-xl border shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium line-clamp-1 flex-1 mr-2" title={source.title}>{source.title}</h3>
                  {getStatusIcon(source.status)}
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium inline-flex w-fit border ${getStatusColor(source.status)}`}>
                  {source.status}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Uploaded by {source.author}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-border" />

      {/* Knowledge Cards Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          Knowledge Items
        </h2>

        <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search AI knowledge topics..." 
              className="pl-9 bg-background border-none focus-visible:ring-0 shadow-none"
            />
          </div>
          {selectedItems.length > 0 && (
            <>
              <Button variant="destructive" size="sm" className="flex items-center gap-2 h-8" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedItems.length})
              </Button>
              <BulkEditDeptModal selectedItems={selectedItems} onUpdate={() => { setSelectedItems([]); mutateKnowledge(); }}>
                <Button variant="secondary" size="sm" className="flex items-center gap-2 h-8 bg-muted text-muted-foreground hover:bg-muted/80">
                  <Edit className="w-4 h-4" />
                  Bulk Edit Dept
                </Button>
              </BulkEditDeptModal>
            </>
          )}
          <Button variant="outline" size="sm" className="flex items-center gap-2 h-8" onClick={handleSelectAll}>
            <Checkbox 
              checked={knowledgeItems.length > 0 && selectedItems.length === knowledgeItems.length} 
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium ml-1">Select All</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2 h-8">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {isLoadingKnowledge ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {knowledgeItems.length === 0 ? (
              <div className="col-span-full text-center p-12 bg-muted/20 rounded-2xl border border-dashed">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No knowledge items yet</h3>
                <p className="text-muted-foreground mt-1">Upload documents to start segregating knowledge.</p>
              </div>
            ) : (
              knowledgeItems.map((item: any) => (
                <div key={item.name} className="bg-card text-card-foreground p-5 rounded-2xl border shadow-sm flex flex-col hover:border-primary/50 transition-colors group relative">
                  
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <Checkbox 
                      checked={selectedItems.includes(item.name)} 
                      onCheckedChange={() => toggleItem(item.name)}
                      className="bg-background/80"
                    />
                  </div>

                  <div className="flex justify-between items-start mb-3 mt-4">
                    <div className="flex flex-wrap gap-1.5 flex-1 mr-2">
                      {item.departments && item.departments.length > 0 ? (
                        item.departments.map((dept: string) => (
                          <span key={dept} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider">
                            {dept}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold uppercase tracking-wider">
                          General
                        </span>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <KnowledgeEditModal item={item} onUpdate={mutateKnowledge}>
                          <DropdownMenuItem className="cursor-pointer" onSelect={(e) => e.preventDefault()}>
                            <Edit className="w-4 h-4 mr-2" /> View / Edit
                          </DropdownMenuItem>
                        </KnowledgeEditModal>
                        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => handleDelete(item.name)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{item.title}</h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1 mb-4">
                    {item.content ? item.content : 'Document attachment pending extraction...'}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className={`text-xs font-medium ${
                        item.status === 'Published' ? 'text-green-700' :
                        item.status?.includes('Pending') ? 'text-yellow-700' :
                        'text-gray-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.author}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
