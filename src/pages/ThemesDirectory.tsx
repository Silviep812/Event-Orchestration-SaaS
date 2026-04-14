import { useState } from "react";
import { EventThemesDirectory } from "@/components/themes/EventThemesDirectory";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ThemesDirectory() {
  const [selectedTheme, setSelectedTheme] = useState<{
    id: number;
    name: string;
    subType?: string;
    subTypeId?: number;
  } | undefined>();
  const navigate = useNavigate();

  const handleThemeSelection = (
    themeId: number,
    themeName?: string,
    subType?: string,
    subTypeId?: number,
  ) => {
    setSelectedTheme({
      id: themeId,
      name: themeName || `Theme #${themeId}`,
      subType,
      subTypeId,
    });
  };

  const handleUseTheme = () => {
    if (selectedTheme) {
      const params = new URLSearchParams({ theme: selectedTheme.id.toString() });
      if (selectedTheme.subType) {
        params.append("subType", selectedTheme.subType);
      }
      if (selectedTheme.subTypeId != null) {
        params.append("subTypeId", String(selectedTheme.subTypeId));
      }
      navigate(`/dashboard/create-event?${params.toString()}`);
    }
  };

  const handleClearSelection = () => setSelectedTheme(undefined);

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
              <div className="flex flex-wrap gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleClearSelection}>
                  Clear selection
                </Button>
                <Button type="button" onClick={handleUseTheme}>
                  Use This Theme
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Themes Directory */}
      <EventThemesDirectory
        onSelectTheme={(themeId, themeName, subType, subTypeId) =>
          handleThemeSelection(themeId, themeName, subType, subTypeId)
        }
        selectedTheme={selectedTheme?.id}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}