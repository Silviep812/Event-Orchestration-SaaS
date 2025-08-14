import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BarChart3, Plus, Settings, Palette, CheckSquare } from "lucide-react";

const DashboardHome = () => {
  const stats = [
    {
      title: "Total Events",
      value: "12",
      description: "Active events this month",
      icon: Calendar,
    },
    {
      title: "Team Members",
      value: "8",
      description: "Collaborators across projects",
      icon: Users,
    },
    {
      title: "Completion Rate",
      value: "94%",
      description: "Average event success rate",
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your event management activities.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/workflow'}>
            <Settings className="h-4 w-4 mr-2" />
            Setup Workflow
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/themes'}>
            <Palette className="h-4 w-4 mr-2" />
            Browse Themes
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/project-management'}>
            <CheckSquare className="h-4 w-4 mr-2" />
            Manage Projects
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const gradients = ['bg-gradient-primary', 'bg-gradient-secondary', 'bg-gradient-accent'];
          const shadows = ['shadow-primary', 'shadow-secondary', 'shadow-accent'];
          return (
            <Card key={index} className={`relative overflow-hidden ${shadows[index]} hover:scale-105 transition-all duration-300`}>
              <div className={`absolute inset-0 ${gradients[index]} opacity-10`} />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${gradients[index]}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden shadow-secondary hover:shadow-accent transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-success opacity-5" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-success"></div>
              Recent Events
            </CardTitle>
            <CardDescription>
              Your latest event activities
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-success bg-opacity-10">
                <div>
                  <p className="font-medium">Annual Conference 2024</p>
                  <p className="text-sm text-muted-foreground">In progress</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-gradient-success text-white">85% complete</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-info bg-opacity-10">
                <div>
                  <p className="font-medium">Team Building Workshop</p>
                  <p className="text-sm text-muted-foreground">Planning</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-gradient-info text-white">25% complete</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-primary bg-opacity-10">
                <div>
                  <p className="font-medium">Product Launch Event</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-gradient-primary text-white">100% complete</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-primary hover:shadow-glow transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-accent opacity-5" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-accent"></div>
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <Button variant="outline" className="w-full justify-start bg-gradient-primary bg-opacity-10 border-primary/20 hover:bg-gradient-primary hover:text-white transition-all duration-300">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule New Event
            </Button>
            <Button variant="outline" className="w-full justify-start bg-gradient-secondary bg-opacity-10 border-secondary/20 hover:bg-gradient-secondary hover:text-white transition-all duration-300">
              <Users className="mr-2 h-4 w-4" />
              Invite Team Members
            </Button>
            <Button variant="outline" className="w-full justify-start bg-gradient-accent bg-opacity-10 border-accent/20 hover:bg-gradient-accent hover:text-white transition-all duration-300">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;