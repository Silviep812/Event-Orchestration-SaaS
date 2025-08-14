import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, DollarSign, Clock, Users, Calendar } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Analytics = () => {
  const eventData = [
    { month: "Jan", events: 8, completed: 7 },
    { month: "Feb", events: 12, completed: 10 },
    { month: "Mar", events: 15, completed: 14 },
    { month: "Apr", events: 18, completed: 16 },
    { month: "May", events: 22, completed: 20 },
    { month: "Jun", events: 25, completed: 23 },
  ];

  const budgetData = [
    { category: "Venue", budget: 15000, spent: 12000 },
    { category: "Catering", budget: 8000, spent: 7500 },
    { category: "Entertainment", budget: 5000, spent: 4200 },
    { category: "Decorations", budget: 3000, spent: 2800 },
    { category: "Other", budget: 2000, spent: 1800 },
  ];

  const taskStatusData = [
    { name: "Completed", value: 68, color: "hsl(var(--primary))" },
    { name: "In Progress", value: 22, color: "hsl(var(--secondary))" },
    { name: "Not Started", value: 10, color: "hsl(var(--muted))" },
  ];

  const kpiData = [
    {
      title: "Event Success Rate",
      value: "94%",
      change: "+2.1%",
      icon: TrendingUp,
      description: "Events completed successfully"
    },
    {
      title: "Average Budget Utilization",
      value: "87%",
      change: "-1.2%",
      icon: DollarSign,
      description: "Budget efficiency"
    },
    {
      title: "Task Completion Rate",
      value: "92%",
      change: "+5.3%",
      icon: Clock,
      description: "Tasks completed on time"
    },
    {
      title: "Team Utilization",
      value: "76%",
      change: "+3.4%",
      icon: Users,
      description: "Team member engagement"
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Track your event management performance and metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={kpi.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {kpi.change}
                </span>{' '}
                from last month
              </p>
              <div className="text-xs text-muted-foreground mt-1">{kpi.description}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Trends</CardTitle>
                <CardDescription>Monthly event completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={eventData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="events" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Total Events"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
                <CardDescription>Current task completion status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {taskStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Event Performance</CardTitle>
              <CardDescription>Monthly event planning and completion metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={eventData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="events" fill="hsl(var(--primary))" name="Total Events" />
                  <Bar dataKey="completed" fill="hsl(var(--secondary))" name="Completed Events" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget Analysis</CardTitle>
                <CardDescription>Budget allocation and spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="budget" fill="hsl(var(--muted))" name="Budget" />
                    <Bar dataKey="spent" fill="hsl(var(--primary))" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgetData.map((item, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{item.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Spent: ${item.spent.toLocaleString()}</span>
                        <span>Budget: ${item.budget.toLocaleString()}</span>
                      </div>
                      <Progress value={(item.spent / item.budget) * 100} />
                      <div className="text-xs text-muted-foreground">
                        {Math.round((item.spent / item.budget) * 100)}% utilized
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion Trends</CardTitle>
                <CardDescription>Task completion over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Venue Booking", "Catering Setup", "Guest Management", "Equipment Setup"].map((task, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{task}</span>
                        <span>{85 + index * 3}%</span>
                      </div>
                      <Progress value={85 + index * 3} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Individual team member task completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Sarah Johnson", "Mike Chen", "Emily Davis", "Alex Rodriguez"].map((member, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{member}</span>
                        <span>{92 - index * 2}%</span>
                      </div>
                      <Progress value={92 - index * 2} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;