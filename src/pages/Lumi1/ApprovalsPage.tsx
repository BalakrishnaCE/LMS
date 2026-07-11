
import { CheckSquare, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { useState } from "react";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const { data, isLoading, mutate } = useFrappeGetCall("novel_lms.lumi_backend.api.get_pending_approvals");
  const { call: submitApproval } = useFrappePostCall("novel_lms.lumi_backend.api.submit_approval");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const approvals = data?.message?.data || data?.data || [];

  const handleAction = async (id: string, action: string) => {
    setProcessingId(id);
    try {
      await submitApproval({ approval_id: id, action });
      toast.success(`Approval ${action}d successfully`);
      mutate();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action.toLowerCase()} request`);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col p-6 bg-background space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <CheckSquare className="w-8 h-8 text-primary" />
          Knowledge Approvals
        </h1>
        <p className="text-muted-foreground mt-1">
          Review pending knowledge creation, updates, and deletion requests.
        </p>
      </div>

      <div className="grid gap-4">
        {approvals.length === 0 ? (
          <div className="text-center p-12 bg-muted/20 rounded-2xl border border-dashed">
            <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No pending approvals</h3>
            <p className="text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          approvals.map((item: any) => (
            <div key={item.name} className="bg-card text-card-foreground p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{item.title || "Knowledge Request"}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    item.approval_type === 'Deletion' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.approval_type || 'Creation'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.author} requested to {item.approval_type === 'Deletion' ? 'delete' : 'publish'} this item.
                </p>
                <div className="text-xs text-muted-foreground pt-2">
                  Department: {item.department}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleAction(item.name, 'Reject')}
                  disabled={processingId === item.name}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleAction(item.name, 'Approve')}
                  disabled={processingId === item.name}
                >
                  {processingId === item.name ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                  Approve
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
