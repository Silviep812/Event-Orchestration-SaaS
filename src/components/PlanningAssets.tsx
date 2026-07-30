import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, Copy, Edit, ArrowLeft, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { eventSelectLifecycleLabel } from "@/lib/eventStatus";
import { STARTER_TEMPLATE_DEFS, type TemplateKind } from "@/lib/starterTemplates";

const KIND_LABEL: Record<TemplateKind, string> = {
  manage_event: "Manage Event (Host)",
  project_management: "Project Management (Planner)",
};

const PlanningAssets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    template_kind: "project_management" as TemplateKind,
  });
  const [templates, setTemplates] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const ensureStarterTemplates = useCallback(async () => {
    if (!user?.id) return;
    const { data: existing } = await supabase
      .from("templates")
      .select("id, name, template_kind")
      .eq("user_id", user.id);

    const names = new Set((existing || []).map((t) => t.name));
    for (const def of STARTER_TEMPLATE_DEFS) {
      if (names.has(def.name)) continue;
      const { data: created, error } = await supabase
        .from("templates")
        .insert({
          user_id: user.id,
          name: def.name,
          description: def.description,
          template_kind: def.template_kind,
        })
        .select("id")
        .maybeSingle();
      if (error || !created?.id) {
        console.warn("starter template insert:", error);
        continue;
      }
      if (def.tasks.length) {
        await supabase.from("template_tasks").insert(
          def.tasks.map((t) => ({
            template_id: created.id,
            user_id: user.id,
            title: t.title,
            description: t.description,
          })),
        );
      }
      if (def.budgetItems.length) {
        await (supabase as any).from("template_budget_items").insert(
          def.budgetItems.map((b) => ({
            template_id: created.id,
            user_id: user.id,
            category: b.category,
            item_name: b.item_name,
            estimated_cost: b.estimated_cost,
          })),
        );
      }
    }
  }, [user?.id]);

  const loadTemplates = useCallback(async () => {
    if (!user?.id) return;
    try {
      await ensureStarterTemplates();
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({ title: "Error", description: "Failed to load templates", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user?.id, ensureStarterTemplates, toast]);

  useEffect(() => {
    if (user?.id) void loadTemplates();
  }, [user?.id, loadTemplates]);

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast({ title: "Error", description: "Template name is required", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("templates").insert({
        user_id: user?.id,
        name: newTemplate.name.trim(),
        description: newTemplate.description,
        template_kind: newTemplate.template_kind,
      });
      if (error) throw error;
      toast({ title: "Template Created", description: `${newTemplate.name} has been added.` });
      setNewTemplate({ name: "", description: "", template_kind: "project_management" });
      setIsDialogOpen(false);
      void loadTemplates();
    } catch (error) {
      console.error("Error creating template:", error);
      toast({ title: "Error", description: "Failed to create template", variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (templateId: string, name: string) => {
    if (!window.confirm(`Delete template “${name}”? This cannot be undone.`)) return;
    const { error } = await supabase.from("templates").delete().eq("id", templateId).eq("user_id", user?.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Deleted", description: `${name} removed.` });
    void loadTemplates();
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, start_date, end_date, status, archived")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
      toast({ title: "Error", description: "Failed to load events", variant: "destructive" });
    } finally {
      setEventsLoading(false);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setSelectedEventId(null);
    void loadEvents();
    setUseTemplateDialogOpen(true);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId || !selectedEventId || !user?.id) {
      toast({ title: "Error", description: "Please select an event", variant: "destructive" });
      return;
    }
    try {
      const { data: templateTasks, error: fetchError } = await supabase
        .from("template_tasks")
        .select("*")
        .eq("template_id", selectedTemplateId)
        .eq("user_id", user.id);
      if (fetchError) throw fetchError;

      if (templateTasks?.length) {
        const { error: insertError } = await supabase.from("tasks").insert(
          templateTasks.map((task) => ({
            event_id: selectedEventId,
            title: task.title,
            description: task.description,
            status: "not_started" as const,
            assigned_to: user.id,
            created_by: user.id,
          })),
        );
        if (insertError) throw insertError;
      }

      const budgetQuery = await (supabase as any)
        .from("template_budget_items")
        .select("category, item_name, estimated_cost")
        .eq("template_id", selectedTemplateId)
        .eq("user_id", user.id);
      const budgetRows = (budgetQuery.data || []) as {
        category: string;
        item_name: string;
        estimated_cost: number | null;
      }[];

      if (budgetRows.length) {
        await supabase.from("budget_items").insert(
          budgetRows.map((b) => ({
            event_id: selectedEventId,
            category: (b.category || "other") as
              | "venue"
              | "catering"
              | "hospitality"
              | "entertainment"
              | "decorations"
              | "transportation"
              | "marketing"
              | "supplies"
              | "services"
              | "vendors"
              | "misc"
              | "other",
            item_name: b.item_name,
            estimated_cost: b.estimated_cost ?? 0,
            created_by: user.id,
          })),
        );
      }

      const tmpl = templates.find((t) => t.id === selectedTemplateId);
      const goManage = tmpl?.template_kind === "manage_event";

      toast({
        title: "Template Applied",
        description: `${templateTasks?.length ?? 0} task(s) and ${budgetRows?.length ?? 0} budget line(s) copied.`,
      });
      setUseTemplateDialogOpen(false);
      setSelectedTemplateId(null);
      setSelectedEventId(null);
      navigate(
        goManage
          ? `/dashboard/manage-event?eventId=${selectedEventId}`
          : `/dashboard/project-management?eventId=${selectedEventId}&tab=budget`,
      );
    } catch (error) {
      console.error("Error applying template:", error);
      toast({ title: "Error", description: "Failed to apply template", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 min-w-0">
          <Button type="button" variant="outline" size="sm" className="shrink-0 w-fit" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Planning Assets</h2>
            <p className="text-muted-foreground">
              Reusable templates for Manage Event (Host) and Project Management (Planner) workflows
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Template name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
              <Textarea
                placeholder="Description"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              />
              <div className="space-y-2">
                <Label>Workflow</Label>
                <Select
                  value={newTemplate.template_kind}
                  onValueChange={(v) =>
                    setNewTemplate({ ...newTemplate, template_kind: v as TemplateKind })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manage_event">{KIND_LABEL.manage_event}</SelectItem>
                    <SelectItem value="project_management">{KIND_LABEL.project_management}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" onClick={handleCreateTemplate} className="w-full">
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground text-center max-w-md">
              You don&apos;t have any saved templates yet. Starter templates will appear after the database migration
              is applied, or create your own.
            </p>
            <Button type="button" onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 shrink-0" />
                    {template.name}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {KIND_LABEL[(template.template_kind as TemplateKind) || "project_management"] ||
                      template.template_kind ||
                      "Template"}
                  </Badge>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/dashboard/planning-assets/${template.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUseTemplate(template.id)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Use
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${template.name}`}
                    onClick={() => void handleDeleteTemplate(template.id, template.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={useTemplateDialogOpen} onOpenChange={setUseTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Event for Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {eventsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You don&apos;t have any events yet. Create an event first to use this template.
                </p>
                <Button type="button" onClick={() => navigate("/dashboard/themes")}>
                  Browse Themes
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {events.map((event) => (
                      <Card
                        key={event.id}
                        className={`cursor-pointer transition-colors ${
                          selectedEventId === event.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedEventId(event.id)}
                      >
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">{event.title}</CardTitle>
                          <CardDescription className="space-y-0.5">
                            {event.start_date ? (
                              <span>{new Date(event.start_date).toLocaleDateString()}</span>
                            ) : null}
                            <span className="block text-muted-foreground">
                              {eventSelectLifecycleLabel(event)}
                            </span>
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setUseTemplateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleApplyTemplate} disabled={!selectedEventId}>
                    Apply Template
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanningAssets;
