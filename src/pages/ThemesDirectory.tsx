import { useState } from "react";
import { EventThemesDirectory } from "@/components/themes/EventThemesDirectory";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Palette, Download, Star, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ThemesDirectory() {
  const [selectedTheme, setSelectedTheme] = useState<{ id: number; name: string; subType?: string } | undefined>();
  const navigate = useNavigate();

  const handleThemeSelection = (themeId: number, themeName?: string, subType?: string) => {
    setSelectedTheme({ id: themeId, name: themeName || `Theme #${themeId}`, subType });
  };

  const handleUseTheme = () => {
    if (selectedTheme) {
      // Navigate to create event with selected theme and sub-type
      const params = new URLSearchParams({ theme: selectedTheme.id.toString() });
      if (selectedTheme.subType) {
        params.append('subType', selectedTheme.subType);
      }
      navigate(`/dashboard/create-event?${params.toString()}`);
    }
  };

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
        </div>
      </div>

      {/* Selected Theme Banner */}
      {selectedTheme && (
        <Card key={`${selectedTheme.id}-${selectedTheme.subType || 'none'}`} className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Theme Selected</h3>
                  <div className="text-sm text-muted-foreground flex items-center flex-wrap gap-1">
                    <span>You've selected theme</span>
                    <Badge variant="outline">{selectedTheme.name}</Badge>
                    {selectedTheme.subType && (
                      <>
                        <span>-</span>
                        <Badge variant="secondary">{selectedTheme.subType}</Badge>
                      </>
                    )}
                  </div>
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
        onSelectTheme={(themeId, themeName, subType) => handleThemeSelection(themeId, themeName, subType)}
        selectedTheme={selectedTheme?.id}
        userType="professional-planner" // This could be dynamic based on user profile
      />
    </div>
  );
}