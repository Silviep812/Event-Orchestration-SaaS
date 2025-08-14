import { useState } from "react";
import { EventThemesDirectory } from "@/components/themes/EventThemesDirectory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Palette, Download, Star, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ThemesDirectory() {
  const [selectedTheme, setSelectedTheme] = useState<string>("");
  const navigate = useNavigate();

  const handleThemeSelection = (themeId: string) => {
    setSelectedTheme(themeId);
  };

  const handleUseTheme = () => {
    if (selectedTheme) {
      // Navigate to create event with selected theme
      navigate(`/dashboard/create-event?theme=${selectedTheme}`);
    }
  };

  const stats = [
    {
      title: "Total Themes",
      value: "7",
      description: "Curated event themes",
      icon: Palette,
    },
    {
      title: "Total Uses",
      value: "13.1K",
      description: "Theme installations",
      icon: Download,
    },
    {
      title: "Average Rating",
      value: "4.7",
      description: "User satisfaction",
      icon: Star,
    },
    {
      title: "Active Users",
      value: "2.4K",
      description: "Monthly active users",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Themes Directory</h1>
          <p className="text-muted-foreground">
            Discover and select the perfect theme for your event
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          {selectedTheme && (
            <Button onClick={handleUseTheme}>
              Use Selected Theme
            </Button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Theme Banner */}
      {selectedTheme && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Theme Selected</h3>
                  <p className="text-sm text-muted-foreground">
                    You've selected the <Badge variant="outline" className="mx-1">{selectedTheme}</Badge> theme
                  </p>
                </div>
              </div>
              <Button onClick={handleUseTheme}>
                Use This Theme
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Themes Directory */}
      <EventThemesDirectory 
        onSelectTheme={handleThemeSelection}
        selectedTheme={selectedTheme}
        userType="professional-planner" // This could be dynamic based on user profile
      />
    </div>
  );
}