import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useEventFilter } from "@/hooks/useEventFilter";
import { DollarSign, Plus, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Archive, ArchiveRestore, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { eventSelectLifecycleLabel } from "@/lib/eventStatus";

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
  archived: boolean;
  created_at: string;
  updated_at: string;
}

interface BudgetTrackerProps {
  eventId?: string;
  selectedEventFilter?: string;
}

const categoryColors = {
  venue: "bg-blue-100 text-blue-800",
  catering: "bg-green-100 text-green-800",
  entertainment: "bg-purple-100 text-purple-800",
  decorations: "bg-pink-100 text-pink-800",
  transportation: "bg-yellow-100 text-yellow-800",
  marketing: "bg-orange-100 text-orange-800",
  supplies: "bg-indigo-100 text-indigo-800",
  services: "bg-cyan-100 text-cyan-800",
  vendors: "bg-teal-100 text-teal-800",
  misc: "bg-gray-100 text-gray-800",
  other: "bg-gray-100 text-gray-800"
};

const paymentStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  partial: "bg-orange-100 text-orange-800"
};

export function BudgetTracker({ eventId, selectedEventFilter }: BudgetTrackerProps) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [eventBudget, setEventBudget] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({
    category: "",
    item_name: "",
    description: "",
    estimated_cost: "",
    vendor_name: "",
    vendor_contact: "",
    payment_due_date: "",
    event_id: ""
  });
  const [formErrors, setFormErrors] = useState({
    event_id: "",
    category: "",
    item_name: ""
  });
  const { toast } = useToast();
  const { events } = useEventFilter();

  // Local state for editing cost fields
  const [editingCost, setEditingCost] = useState<{ [id: string]: { estimated?: string; actual?: string } }>({});
  const [budgetAddInput, setBudgetAddInput] = useState("");

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      setLoading(true);
      await fetchBudgetItems();
      if (!isMounted) return;
      await fetchEventBudget();
      if (isMounted) setLoading(false);
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [eventId, selectedEventFilter, showArchived]);

  const fetchEventBudget = async () => {
    try {
      const currentEventId = eventId || selectedEventFilter;
      
      console.log('Fetching budget for event:', currentEventId);
      
      if (!currentEventId) {
        setEventBudget(null);
        return;
      }

      // If "all" is selected, sum all event budgets for the user
      if (currentEventId === "all") {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setEventBudget(null);
          return;
        }

        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('budget')
          .eq('user_id', user.id);

        if (eventsError) {
          console.error('Error fetching all event budgets:', eventsError);
          setEventBudget(null);
          return;
        }

        // Sum all budgets
        const totalBudget = eventsData?.reduce((sum, event) => sum + (event.budget || 0), 0) || 0;
        console.log('Total budget for all events:', totalBudget);
        setEventBudget(totalBudget > 0 ? totalBudget : null);
        return;
      }

      // Fetch budget for specific event
      const { data, error } = await supabase
        .from('events')
        .select('budget')
        .eq('id', currentEventId)
        .maybeSingle();

      console.log('Budget fetch result:', { data, error, eventId: currentEventId });

      if (error) {
        console.error('Error fetching event budget:', error);
        setEventBudget(null);
        return;
      }
      
      // Set the budget from the event, or null if not set
      setEventBudget(data?.budget ?? null);
    } catch (error) {
      console.error('Error in fetchEventBudget:', error);
      setEventBudget(null);
    }
  };

  const fetchBudgetItems = async () => {
    try {
      let query = supabase.from('budget_items').select('*').order('created_at', { ascending: false });
      
      // Apply event filter
      if (eventId) {
        query = query.eq('event_id', eventId);
      } else if (selectedEventFilter && selectedEventFilter !== "all") {
        query = query.eq('event_id', selectedEventFilter);
      }
      
      // Filter by archived status
      query = query.eq('archived', showArchived);
      
      const { data, error } = await query;
      if (error) throw error;
      
      setBudgetItems(data || []);
    } catch (error) {
      toast({
        title: "Error fetching budget items",
        description: "Failed to load budget items. Please try again.",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    const errors = {
      event_id: "",
      category: "",
      item_name: ""
    };

    if (!newItem.event_id.trim()) {
      errors.event_id = "Project is required";
    }
    if (!newItem.category.trim()) {
      errors.category = "Category is required";
    }
    if (!newItem.item_name.trim()) {
      errors.item_name = "Item name is required";
    }

    setFormErrors(errors);
    return !errors.event_id && !errors.category && !errors.item_name;
  };

  const createBudgetItem = async () => {
    if (!validateForm()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const itemData = {
        category: newItem.category as any,
        item_name: newItem.item_name,
        description: newItem.description || null,
        estimated_cost: newItem.estimated_cost ? parseFloat(newItem.estimated_cost) : null,
        vendor_name: newItem.vendor_name || null,
        vendor_contact: newItem.vendor_contact || null,
        payment_due_date: newItem.payment_due_date || null,
        event_id: newItem.event_id || eventId || null,
        created_by: user.id
      };

      const { error } = await supabase.from('budget_items').insert(itemData);
      if (error) throw error;

      toast({
        title: "Budget item created",
        description: "New budget item has been added successfully.",
      });

      setNewItem({
        category: "",
        item_name: "",
        description: "",
        estimated_cost: "",
        vendor_name: "",
        vendor_contact: "",
        payment_due_date: "",
        event_id: ""
      });
      setFormErrors({
        event_id: "",
        category: "",
        item_name: ""
      });
      setIsCreateDialogOpen(false);
      fetchBudgetItems();
    } catch (error) {
      toast({
        title: "Error creating budget item",
        description: "Failed to create budget item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateEstimatedCost = async (itemId: string, estimatedCost: number) => {
    try {
      const { error } = await supabase
        .from('budget_items')
        .update({ estimated_cost: estimatedCost })
        .eq('id', itemId);

      if (error) throw error;

      setBudgetItems(budgetItems.map(item => 
        item.id === itemId ? { ...item, estimated_cost: estimatedCost } : item
      ));

      toast({
        title: "Estimated cost updated",
        description: "Estimated cost has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error updating estimated cost",
        description: "Failed to update estimated cost.",
        variant: "destructive",
      });
    }
  };

  const updateActualCost = async (itemId: string, actualCost: number) => {
    try {
      const { error } = await supabase
        .from('budget_items')
        .update({ actual_cost: actualCost })
        .eq('id', itemId);

      if (error) throw error;

      setBudgetItems(budgetItems.map(item => 
        item.id === itemId ? { ...item, actual_cost: actualCost } : item
      ));

      toast({
        title: "Cost updated",
        description: "Actual cost has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error updating cost",
        description: "Failed to update actual cost.",
        variant: "destructive",
      });
    }
  };

  const updatePaymentStatus = async (itemId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('budget_items')
        .update({ payment_status: status })
        .eq('id', itemId);

      if (error) throw error;

      setBudgetItems(budgetItems.map(item => 
        item.id === itemId ? { ...item, payment_status: status } : item
      ));

      toast({
        title: "Payment status updated",
        description: "Payment status has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error updating payment status",
        description: "Failed to update payment status.",
        variant: "destructive",
      });
    }
  };

  const archiveBudgetItem = async (itemId: string, archived: boolean) => {
    try {
      const { error } = await supabase
        .from('budget_items')
        .update({ archived })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: archived ? "Item archived" : "Item restored",
        description: archived ? "Budget item has been archived." : "Budget item has been restored.",
      });

      fetchBudgetItems();
    } catch (error) {
      toast({
        title: "Error updating item",
        description: "Failed to update budget item.",
        variant: "destructive",
      });
    }
  };

  const addToEventBudget = async () => {
    const currentEventId = eventId || selectedEventFilter;
    if (!currentEventId || currentEventId === "all") {
      toast({
        title: "Select an event",
        description: "Choose a single event in the filter before adding to its budget.",
        variant: "destructive",
      });
      return;
    }
    const amt = parseFloat(budgetAddInput);
    if (Number.isNaN(amt) || amt === 0) {
      toast({
        title: "Invalid amount",
        description: "Enter a positive or negative number to adjust the event budget.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { data: row, error: fetchErr } = await supabase
        .from("events")
        .select("budget")
        .eq("id", currentEventId)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      const next = (row?.budget ?? 0) + amt;
      const { error } = await supabase
        .from("events")
        .update({ budget: next })
        .eq("id", currentEventId);
      if (error) throw error;
      setBudgetAddInput("");
      await fetchEventBudget();
      toast({
        title: "Budget updated",
        description: `Event budget is now $${next.toFixed(2)}.`,
      });
    } catch (e) {
      toast({
        title: "Error",
        description: "Could not update event budget.",
        variant: "destructive",
      });
    }
  };

  const calculateTotals = () => {
    // Start with the event budget
    const totalBudget = eventBudget ?? 0;
    
    // Sum all paid items (estimated cost for paid items)
    const totalPaid = budgetItems
      .filter(item => item.payment_status === 'paid')
      .reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
    
    // Estimated total is budget minus paid items
    const totalEstimated = totalBudget - totalPaid;
    
    const totalActual = budgetItems.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
    const variance = totalActual - totalEstimated;
    const variancePercentage = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    return { totalEstimated, totalActual, variance, variancePercentage };
  };

  const { totalEstimated, totalActual, variance, variancePercentage } = calculateTotals();

  if (loading) {
    return <div className="flex justify-center py-8">Loading budget...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Budget Tracking</h2>
          {/* Archive Filter */}
          <Button
            variant="outline"
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2"
          >
            {showArchived ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4 justify-end">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Amount"
              className="w-32"
              value={budgetAddInput}
              onChange={(e) => setBudgetAddInput(e.target.value)}
            />
            <Button type="button" variant="secondary" onClick={addToEventBudget} className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden />
              Add amount to budget
            </Button>
          </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Budget Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="project">Project *</Label>
                <Select value={newItem.event_id} onValueChange={(value) => setNewItem({ ...newItem, event_id: value })}>
                  <SelectTrigger className={formErrors.event_id ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                        {event.start_date &&
                          ` (${format(new Date(event.start_date), "MMM d, yyyy")})`}
                        <span className="text-muted-foreground">{` · ${eventSelectLifecycleLabel(event)}`}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.event_id && (
                  <p className="text-sm text-destructive">{formErrors.event_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger className={formErrors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="catering">Catering</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="decorations">Decorations</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="vendors">Vendors</SelectItem>
                    <SelectItem value="misc">Miscellaneous</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-sm text-destructive">{formErrors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_name">Item Name *</Label>
                <Input
                  id="item_name"
                  placeholder="Enter item name"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  className={formErrors.item_name ? "border-destructive" : ""}
                />
                {formErrors.item_name && (
                  <p className="text-sm text-destructive">{formErrors.item_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Estimated Cost</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newItem.estimated_cost}
                  onChange={(e) => setNewItem({ ...newItem, estimated_cost: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_name">Vendor Name</Label>
                <Input
                  id="vendor_name"
                  placeholder="Enter vendor name"
                  value={newItem.vendor_name}
                  onChange={(e) => setNewItem({ ...newItem, vendor_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor_contact">Vendor contact</Label>
                <Input
                  id="vendor_contact"
                  placeholder="Email"
                  value={newItem.vendor_contact}
                  onChange={(e) => setNewItem({ ...newItem, vendor_contact: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_due_date">Payment Due Date</Label>
                <Input
                  id="payment_due_date"
                  type="date"
                  value={newItem.payment_due_date}
                  onChange={(e) => setNewItem({ ...newItem, payment_due_date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Button onClick={createBudgetItem} className="flex-1">
                Add Budget Item
              </Button>
              <Button
                variant="secondary"
                onClick={async () => {
                  await createBudgetItem();
                }}
                className="flex-1"
              >
                Save and Exit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold">
                  {eventBudget !== null ? `$${totalEstimated.toFixed(2)}` : 'No budget set'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {eventBudget !== null ? 'From event budget' : 'Set budget in Create Event'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actual Total</p>
                <p className="text-2xl font-bold">${totalActual.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Variance</p>
                <p className={`text-2xl font-bold ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${Math.abs(variance).toFixed(2)}
                </p>
              </div>
              {variance >= 0 ? 
                <TrendingUp className="h-8 w-8 text-red-600" /> : 
                <TrendingDown className="h-8 w-8 text-green-600" />
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Variance %</p>
                <p className={`text-2xl font-bold ${variancePercentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {variancePercentage >= 0 ? '+' : ''}{variancePercentage.toFixed(1)}%
                </p>
              </div>
              {Math.abs(variancePercentage) > 10 ? 
                <AlertTriangle className="h-8 w-8 text-yellow-600" /> : 
                <CheckCircle className="h-8 w-8 text-green-600" />
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Items */}
      <div className="space-y-4">
        {budgetItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{item.item_name}</h3>
                    <Badge className={categoryColors[item.category as keyof typeof categoryColors]}>
                      {item.category}
                    </Badge>
                    <Badge className={paymentStatusColors[item.payment_status as keyof typeof paymentStatusColors]}>
                      {item.payment_status}
                    </Badge>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  )}
                  {item.vendor_name && (
                    <p className="text-sm text-muted-foreground">Vendor: {item.vendor_name}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => archiveBudgetItem(item.id, !item.archived)}
                  className="flex items-center gap-2"
                >
                  {item.archived ? (
                    <>
                      <ArchiveRestore className="h-4 w-4" />
                      Restore
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      Archive
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`estimated-${item.id}`}>Estimated Cost</Label>
                  <Input
                    id={`estimated-${item.id}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={
                      editingCost[item.id]?.estimated !== undefined
                        ? editingCost[item.id]?.estimated
                        : (item.estimated_cost !== undefined && item.estimated_cost !== null
                            ? Number(item.estimated_cost).toFixed(2)
                            : '')
                    }
                    onChange={e => {
                      setEditingCost(prev => ({
                        ...prev,
                        [item.id]: {
                          ...prev[item.id],
                          estimated: e.target.value
                        }
                      }));
                    }}
                    onBlur={e => {
                      const val = e.target.value;
                      if (val) {
                        const formatted = parseFloat(val).toFixed(2);
                        setEditingCost(prev => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], estimated: formatted }
                        }));
                        updateEstimatedCost(item.id, parseFloat(formatted));
                      } else {
                        updateEstimatedCost(item.id, 0);
                        setEditingCost(prev => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], estimated: '' }
                        }));
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`actual-${item.id}`}>Actual Cost</Label>
                  <Input
                    id={`actual-${item.id}`}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={
                      editingCost[item.id]?.actual !== undefined
                        ? editingCost[item.id]?.actual
                        : (item.actual_cost !== undefined && item.actual_cost !== null
                            ? Number(item.actual_cost).toFixed(2)
                            : '')
                    }
                    onChange={e => {
                      setEditingCost(prev => ({
                        ...prev,
                        [item.id]: {
                          ...prev[item.id],
                          actual: e.target.value
                        }
                      }));
                    }}
                    onBlur={e => {
                      const val = e.target.value;
                      if (val) {
                        const formatted = parseFloat(val).toFixed(2);
                        setEditingCost(prev => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], actual: formatted }
                        }));
                        updateActualCost(item.id, parseFloat(formatted));
                      } else {
                        updateActualCost(item.id, 0);
                        setEditingCost(prev => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], actual: '' }
                        }));
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={item.payment_status} onValueChange={(value) => updatePaymentStatus(item.id, value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {item.estimated_cost && item.actual_cost && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Budget Usage</span>
                    <span>{((item.actual_cost / item.estimated_cost) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min((item.actual_cost / item.estimated_cost) * 100, 100)} 
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {budgetItems.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {showArchived ? "No archived budget items" : "No budget items yet"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {showArchived 
              ? "You haven't archived any budget items yet." 
              : "Add your first budget item to start tracking expenses."
            }
          </p>
        </div>
      )}
    </div>
  );
}