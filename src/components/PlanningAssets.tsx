import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, CheckSquare, Package, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PlanningAssets = () => {
  const { toast } = useToast();
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", type: "checklist" });

  const templates = [
    {
      id: 1,
      name: "Corporate Event Checklist",
      type: "checklist",
      description: "Complete checklist for corporate events",
      items: ["Book venue", "Arrange catering", "Send invitations", "Setup AV equipment", "Prepare welcome materials"]
    },
    {
      id: 2,
      name: "Wedding Planning Template",
      type: "template",
      description: "Comprehensive wedding planning template",
      items: ["Venue selection", "Photography", "Flowers", "Music", "Catering"]
    },
    {
      id: 3,
      name: "Birthday Party Assets",
      type: "assets",
      description: "Reusable assets for birthday celebrations",
      items: ["Decoration themes", "Entertainment options", "Cake designs", "Party favors"]
    }
  ];

  const handleCreateTemplate = () => {
    toast({
      title: "Template Created",
      description: `${newTemplate.name} has been added to your planning assets.`,
    });
    setNewTemplate({ name: "", description: "", type: "checklist" });
  };

  const handleCopyTemplate = (templateName: string) => {
    toast({
      title: "Template Copied",
      description: `${templateName} has been copied to your current event.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Planning Assets</h2>
          <p className="text-muted-foreground">Reusable templates for your events</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
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
              <Button onClick={handleCreateTemplate} className="w-full">
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.filter(t => t.type === "template").map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {template.name}
              </CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>        
  );
};

export default PlanningAssets;