import { TaskManager } from "@/components/TaskManager";
import { BudgetTracker } from "@/components/BudgetTracker";
import { RoleManager } from "@/components/RoleManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, DollarSign, Users } from "lucide-react";

export default function ProjectManagement() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Management</h1>
          <p className="text-muted-foreground">
            Manage tasks, track budgets, and assign roles for your events
          </p>
        </div>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Budget
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <TaskManager />
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <BudgetTracker />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <RoleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}