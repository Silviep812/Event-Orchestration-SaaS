import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEventFilter } from "@/hooks/useEventFilter";
import {
  DollarSign, Plus, AlertTriangle, Archive, ArchiveRestore,
  Eye, EyeOff, FileEdit, CheckCircle2, XCircle, Bell, Wallet, CreditCard, PiggyBank
} from "lucide-react";
import { format } from "date-fns";

interface BudgetItem {
  id: string;
  category: string;
  item_name: string;
  description?: string;
  estimated_cost?: number;
  actual_cost?: number;
  vendor_name?: string;
  vendor_contact?: string;
  payment_status: string;
  payment_due_date?: string;
  status?: string;
  archived: boolean;
  event_id: string;
  created_at: string;
  updated_at: string;
}

interface ChangeRequest {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  requested_by?: string;
  event_id?: string;
  field_changes?: any;
  created_at: string;
}

interface BudgetTrackerProps {
  eventId?: string;
  selectedEventFilter?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const BUDGET_CATEGORIES = [
  { value: "venue", label: "Venue" },
  { value: "catering", label: "Catering" },
  { value: "entertainment", label: "Entertainment" },
  { value: "decorations", label: "Decorations" },
  { value: "transportation", label: "Transportation" },
  { value: "marketing", label: "Marketing" },
  { value: "supplies", label: "Supplies" },
  { value: "services", label: "Services" },
  { value: "hospitality", label: "Hospitality" },
  { value: "vendors", label: "Vendors" },
  { value: "other", label: "Other" },
];

const STATUS_OPTIONS = [
  { value: "estimated", label: "Estimated" },
  { value: "quoted", label: "Quoted" },
  { value: "paid", label: "Paid" },
];

const categoryColors: Record<string, string> = {
  venue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  catering: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  entertainment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  decorations: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  transportation: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  marketing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  supplies: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  services: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  hospitality: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  vendors: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

const statusBadge: Record<string, string> = {
  estimated: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  quoted: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  partial: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

export function BudgetTracker({ eventId, selectedEventFilter }: BudgetTrackerProps) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [eventBudget, setEventBudget] = useState<number | null>(null);
  const [editingCost, setEditingCost] = useState<Record<string, { estimated?: string; actual?: string }>>({});
  const [changeDialogItem, setChangeDialogItem] = useState<BudgetItem | null>(null);
  const [changeForm, setChangeForm] = useState({ proposed_amount: "", reason: "", impact: "medium" });
  const [pendingChangeRequests, setPendingChangeRequests] = useState<ChangeRequest[]>([]);
  const [newItem, setNewItem] = useState({
    category: "", item_name: "", description: "", estimated_cost: "",
    vendor_name: "", vendor_contact: "", payment_due_date: "", event_id: ""
  });
  const [formErrors, setFormErrors] = useState({ event_id: "", category: "", item_name: "" });
  const { toast } = useToast();
  const { events } = useEventFilter();
  const { user, userRoles } = useAuth();

  const isOwner = userRoles.includes("admin") || userRoles.includes("event_manager");
  const currentEventId = eventId || selectedEventFilter;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!mounted) return;
      setLoading(true);
      await Promise.all([fetchBudgetItems(), fetchEventBudget(), fetchPendingChangeRequests()]);
      if (mounted) setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, [eventId, selectedEventFilter, showArchived]);

  const fetchEventBudget = async () => {
    try {
      if (!currentEventId) { setEventBudget(null); return; }
      if (currentEventId === "all") {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u) { setEventBudget(null); return; }
        const { data } = await supabase.from('events').select('budget').eq('user_id', u.id);
        const total = data?.reduce((s, e) => s + (e.budget || 0), 0) || 0;
        setEventBudget(total > 0 ? total : null);
        return;
      }
      const { data } = await supabase.from('events').select('budget').eq('id', currentEventId).maybeSingle();
      setEventBudget(data?.budget ?? null);
    } catch { setEventBudget(null); }
  };

  const fetchBudgetItems = async () => {
    try {
      let query = supabase.from('budget_items').select('*').order('created_at', { ascending: false });
      if (eventId) query = query.eq('event_id', eventId);
      else if (selectedEventFilter && selectedEventFilter !== "all") query = query.eq('event_id', selectedEventFilter);
      query = query.eq('archived', showArchived);
      const { data, error } = await query;
      if (error) throw error;
      setBudgetItems(data || []);
    } catch {
      toast({ title: "Error fetching budget items", description: "Failed to load.", variant: "destructive" });
    }
  };

  const fetchPendingChangeRequests = async () => {
    try {
      let query = supabase.from('change_requests').select('*')
        .eq('status', 'pending')
        .eq('change_type', 'budget')
        .order('created_at', { ascending: false });
      if (currentEventId && currentEventId !== 'all') query = query.eq('event_id', currentEventId);
      const { data } = await query;
      setPendingChangeRequests(data || []);
    } catch { setPendingChangeRequests([]); }
  };

  const validateForm = () => {
    const errors = { event_id: "", category: "", item_name: "" };
    const resolved = newItem.event_id || currentEventId || "";
    if (!resolved.trim() || resolved === 'all') errors.event_id = "Project is required";
    if (!newItem.category.trim()) errors.category = "Category is required";
    if (!newItem.item_name.trim()) errors.item_name = "Item name is required";
    setFormErrors(errors);
    return !errors.event_id && !errors.category && !errors.item_name;
  };

  const createBudgetItem = async () => {
    if (!validateForm()) return;
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) throw new Error('Not authenticated');
      const resolvedId = newItem.event_id || currentEventId;
      if (!resolvedId || resolvedId === 'all') {
        toast({ title: "Event required", description: "Please select a specific event.", variant: "destructive" });
        return;
      }
      const { error } = await supabase.from('budget_items').insert({
        category: newItem.category as any,
        item_name: newItem.item_name,
        description: newItem.description || null,
        estimated_cost: newItem.estimated_cost ? parseFloat(newItem.estimated_cost) : null,
        vendor_name: newItem.vendor_name || null,
        vendor_contact: newItem.vendor_contact || null,
        payment_due_date: newItem.payment_due_date || null,
        event_id: resolvedId,
        created_by: u.id,
        status: 'estimated'
      });
      if (error) throw error;
      toast({ title: "Budget item created", description: "New budget item added." });
      setNewItem({ category: "", item_name: "", description: "", estimated_cost: "", vendor_name: "", vendor_contact: "", payment_due_date: "", event_id: "" });
      setFormErrors({ event_id: "", category: "", item_name: "" });
      setIsCreateDialogOpen(false);
      fetchBudgetItems();
    } catch {
      toast({ title: "Error", description: "Failed to create budget item.", variant: "destructive" });
    }
  };

  const updateField = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase.from('budget_items').update({ [field]: value }).eq('id', id);
      if (error) throw error;
      setBudgetItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    } catch {
      toast({ title: "Error", description: `Failed to update ${field}.`, variant: "destructive" });
    }
  };

  const archiveBudgetItem = async (id: string, archived: boolean) => {
    try {
      const { error } = await supabase.from('budget_items').update({ archived }).eq('id', id);
      if (error) throw error;
      toast({ title: archived ? "Item archived" : "Item restored" });
      fetchBudgetItems();
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  const submitChangeRequest = async () => {
    if (!changeDialogItem || !changeForm.proposed_amount || !changeForm.reason) {
      toast({ title: "Required fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from('change_requests').insert({
        title: `Budget Change: ${changeDialogItem.item_name}`,
        description: changeForm.reason,
        event_id: changeDialogItem.event_id,
        change_type: 'budget' as any,
        priority: changeForm.impact as any,
        status: 'pending' as any,
        requested_by: user?.id,
        field_changes: {
          estimated_cost: {
            oldValue: String(changeDialogItem.estimated_cost || 0),
            newValue: changeForm.proposed_amount
          },
          budget_item_id: changeDialogItem.id,
          impact_level: changeForm.impact
        }
      });
      if (error) throw error;
      toast({ title: "Change request submitted", description: "Your request is pending approval." });
      setChangeDialogItem(null);
      setChangeForm({ proposed_amount: "", reason: "", impact: "medium" });
      fetchPendingChangeRequests();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to submit change request.", variant: "destructive" });
    }
  };

  const handleApprove = async (crId: string) => {
    try {
      const { error } = await supabase.rpc('approve_change_request', { p_change_request_id: crId });
      if (error) throw error;
      toast({ title: "Approved", description: "Change request approved." });
      fetchPendingChangeRequests();
    } catch {
      toast({ title: "Error", description: "Failed to approve.", variant: "destructive" });
    }
  };

  const handleDecline = async (crId: string) => {
    try {
      const { error } = await supabase.rpc('reject_change_request', {
        p_change_request_id: crId,
        p_rejection_reason: 'Declined by event owner'
      });
      if (error) throw error;
      toast({ title: "Declined", description: "Change request declined." });
      fetchPendingChangeRequests();
    } catch {
      toast({ title: "Error", description: "Failed to decline.", variant: "destructive" });
    }
  };

  // Calculations
  const totalBudget = eventBudget ?? 0;
  const totalSpent = budgetItems.reduce((s, i) => s + (i.actual_cost || 0), 0);
  const totalEstimated = budgetItems.reduce((s, i) => s + (i.estimated_cost || 0), 0);
  const remaining = totalBudget - totalSpent;
  const isOverBudget = totalBudget > 0 && totalSpent > totalBudget;
  const spentPercent = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  if (loading) {
    return <div className="flex justify-center py-8">Loading budget...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">Budget Tracking</h2>
          <Button variant="outline" size="sm" onClick={() => setShowArchived(!showArchived)} className="flex items-center gap-2">
            {showArchived ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="hidden sm:inline">{showArchived ? "Hide Archived" : "Show Archived"}</span>
          </Button>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Budget Item</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Budget Item</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Project *</Label>
                  <Select value={newItem.event_id} onValueChange={v => setNewItem({ ...newItem, event_id: v })}>
                    <SelectTrigger className={formErrors.event_id ? "border-destructive" : ""}><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {events.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.title} {e.start_date && `(${format(new Date(e.start_date), 'MMM d, yyyy')})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.event_id && <p className="text-sm text-destructive">{formErrors.event_id}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={newItem.category} onValueChange={v => setNewItem({ ...newItem, category: v })}>
                    <SelectTrigger className={formErrors.category ? "border-destructive" : ""}><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {BUDGET_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {formErrors.category && <p className="text-sm text-destructive">{formErrors.category}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Item Name *</Label>
                  <Input placeholder="Enter item name" value={newItem.item_name}
                    onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                    className={formErrors.item_name ? "border-destructive" : ""} />
                  {formErrors.item_name && <p className="text-sm text-destructive">{formErrors.item_name}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Estimated Cost</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={newItem.estimated_cost}
                    onChange={e => setNewItem({ ...newItem, estimated_cost: e.target.value })} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Enter description" value={newItem.description}
                    onChange={e => setNewItem({ ...newItem, description: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Vendor Name</Label>
                  <Input placeholder="Enter vendor name" value={newItem.vendor_name}
                    onChange={e => setNewItem({ ...newItem, vendor_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Due Date</Label>
                  <Input type="date" value={newItem.payment_due_date}
                    onChange={e => setNewItem({ ...newItem, payment_due_date: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button onClick={createBudgetItem} className="w-full">Add Budget Item</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ====== BUDGET SUMMARY DASHBOARD ====== */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {/* Total Budget */}
            <div className="p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Budget</p>
                <p className="text-2xl font-bold">{totalBudget > 0 ? fmt(totalBudget) : "Not set"}</p>
              </div>
            </div>
            {/* Total Spent */}
            <div className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-full ${isOverBudget ? "bg-destructive/10" : "bg-orange-500/10"}`}>
                <CreditCard className={`h-5 w-5 ${isOverBudget ? "text-destructive" : "text-orange-500"}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Spent</p>
                <p className={`text-2xl font-bold ${isOverBudget ? "text-destructive" : ""}`}>{fmt(totalSpent)}</p>
              </div>
            </div>
            {/* Remaining */}
            <div className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-full ${remaining < 0 ? "bg-destructive/10" : "bg-emerald-500/10"}`}>
                <PiggyBank className={`h-5 w-5 ${remaining < 0 ? "text-destructive" : "text-emerald-500"}`} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Remaining</p>
                <p className={`text-2xl font-bold ${remaining < 0 ? "text-destructive" : "text-emerald-600"}`}>
                  {totalBudget > 0 ? fmt(remaining) : "—"}
                </p>
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          {totalBudget > 0 && (
            <div className="px-5 pb-4 pt-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{spentPercent.toFixed(0)}% spent</span>
                {isOverBudget && (
                  <span className="text-destructive font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Over budget by {fmt(totalSpent - totalBudget)}
                  </span>
                )}
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all ${isOverBudget ? "bg-destructive" : "bg-primary"}`}
                  style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== OWNER: PENDING CHANGE REQUESTS ====== */}
      {isOwner && pendingChangeRequests.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-sm">Pending Change Requests ({pendingChangeRequests.length})</h3>
            </div>
            <div className="space-y-2">
              {pendingChangeRequests.map(cr => {
                const fields = cr.field_changes as any;
                return (
                  <div key={cr.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-background">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cr.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{cr.description}</p>
                      {fields?.estimated_cost && (
                        <p className="text-xs mt-0.5">
                          <span className="text-muted-foreground">Amount: </span>
                          <span className="line-through text-muted-foreground">{fmt(parseFloat(fields.estimated_cost.oldValue || "0"))}</span>
                          {" → "}
                          <span className="font-medium">{fmt(parseFloat(fields.estimated_cost.newValue || "0"))}</span>
                        </p>
                      )}
                      <Badge variant="outline" className="mt-1 text-[10px]">{cr.priority} impact</Badge>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => handleApprove(cr.id)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5"
                        onClick={() => handleDecline(cr.id)}>
                        <XCircle className="h-3.5 w-3.5 mr-1" />Decline
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== BUDGET ITEMS ====== */}
      <div className="space-y-4">
        {budgetItems.map(item => (
          <Card key={item.id}>
            <CardContent className="p-4 sm:p-6">
              {/* Top row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-semibold">{item.item_name}</h3>
                    <Badge className={categoryColors[item.category] || categoryColors.other}>{item.category}</Badge>
                    <Badge className={statusBadge[item.status || "estimated"] || statusBadge.estimated}>
                      {item.status || "estimated"}
                    </Badge>
                    <Badge className={paymentStatusColors[item.payment_status] || paymentStatusColors.pending}>
                      {item.payment_status}
                    </Badge>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground mb-1">{item.description}</p>}
                  {item.vendor_name && <p className="text-sm text-muted-foreground">Vendor: {item.vendor_name}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => { setChangeDialogItem(item); setChangeForm({ proposed_amount: "", reason: "", impact: "medium" }); }}>
                    <FileEdit className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden sm:inline">Request Change</span>
                    <span className="sm:hidden">Change</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => archiveBudgetItem(item.id, !item.archived)}>
                    {item.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Fields grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Estimated Cost */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Estimated Cost</Label>
                  <Input type="number" step="0.01" placeholder="0.00"
                    value={editingCost[item.id]?.estimated !== undefined ? editingCost[item.id]?.estimated : (item.estimated_cost != null ? Number(item.estimated_cost).toFixed(2) : '')}
                    onChange={e => setEditingCost(p => ({ ...p, [item.id]: { ...p[item.id], estimated: e.target.value } }))}
                    onBlur={e => {
                      const v = e.target.value;
                      if (v) { const f = parseFloat(v).toFixed(2); setEditingCost(p => ({ ...p, [item.id]: { ...p[item.id], estimated: f } })); updateField(item.id, 'estimated_cost', parseFloat(f)); }
                      else { updateField(item.id, 'estimated_cost', 0); setEditingCost(p => ({ ...p, [item.id]: { ...p[item.id], estimated: '' } })); }
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </div>
                {/* Actual Cost */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Actual Cost</Label>
                  <Input type="number" step="0.01" placeholder="0.00"
                    value={editingCost[item.id]?.actual !== undefined ? editingCost[item.id]?.actual : (item.actual_cost != null ? Number(item.actual_cost).toFixed(2) : '')}
                    onChange={e => setEditingCost(p => ({ ...p, [item.id]: { ...p[item.id], actual: e.target.value } }))}
                    onBlur={e => {
                      const v = e.target.value;
                      if (v) { const f = parseFloat(v).toFixed(2); setEditingCost(p => ({ ...p, [item.id]: { ...p[item.id], actual: f } })); updateField(item.id, 'actual_cost', parseFloat(f)); }
                      else { updateField(item.id, 'actual_cost', 0); setEditingCost(p => ({ ...p, [item.id]: { ...p[item.id], actual: '' } })); }
                    }}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </div>
                {/* Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={item.status || "estimated"} onValueChange={v => updateField(item.id, 'status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {/* Payment Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Status</Label>
                  <Select value={item.payment_status} onValueChange={v => updateField(item.id, 'payment_status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Per-item progress bar */}
              {item.estimated_cost && item.actual_cost ? (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Budget Usage</span>
                    <span className={item.actual_cost > item.estimated_cost ? "text-destructive font-medium" : ""}>
                      {((item.actual_cost / item.estimated_cost) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all ${item.actual_cost > item.estimated_cost ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${Math.min((item.actual_cost / item.estimated_cost) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {budgetItems.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">{showArchived ? "No archived budget items" : "No budget items yet"}</h3>
          <p className="text-muted-foreground mb-4">
            {showArchived ? "You haven't archived any budget items yet." : "Add your first budget item to start tracking expenses."}
          </p>
        </div>
      )}

      {/* ====== CHANGE REQUEST DIALOG ====== */}
      <Dialog open={!!changeDialogItem} onOpenChange={open => { if (!open) setChangeDialogItem(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Request Budget Change</DialogTitle>
          </DialogHeader>
          {changeDialogItem && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="text-sm font-medium">{changeDialogItem.item_name}</p>
                <p className="text-xs text-muted-foreground">
                  Current: {fmt(changeDialogItem.estimated_cost || 0)} · Category: {changeDialogItem.category}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Proposed New Amount *</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={changeForm.proposed_amount}
                  onChange={e => setChangeForm(p => ({ ...p, proposed_amount: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Reason for Change *</Label>
                <Textarea placeholder="Explain why this change is needed..." value={changeForm.reason}
                  onChange={e => setChangeForm(p => ({ ...p, reason: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Impact Level</Label>
                <Select value={changeForm.impact} onValueChange={v => setChangeForm(p => ({ ...p, impact: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={submitChangeRequest} className="w-full">Submit Change Request</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
