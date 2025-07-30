import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BarChart3, Plus } from "lucide-react";

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
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              Your latest event activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Annual Conference 2024</p>
                  <p className="text-sm text-muted-foreground">In progress</p>
                </div>
                <span className="text-sm text-green-600">85% complete</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Team Building Workshop</p>
                  <p className="text-sm text-muted-foreground">Planning</p>
                </div>
                <span className="text-sm text-blue-600">25% complete</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Product Launch Event</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <span className="text-sm text-gray-600">100% complete</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule New Event
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Invite Team Members
            </Button>
            <Button variant="outline" className="w-full justify-start">
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