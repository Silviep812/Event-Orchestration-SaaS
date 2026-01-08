import { useState } from "react";
import { EventThemesDirectory } from "@/components/themes/EventThemesDirectory";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";

type SelectedTheme = {
  id: number;
  name: string;
  subType?: string;
};

export default function ThemesDirectory() {
  const [selectedTheme, setSelectedTheme] = useState<SelectedTheme | undefined>(
    undefined
  );

  const navigate = useNavigate();

  const handleThemeSelection = (
    themeId: number,
    themeName?: string,
    subType?: string
  ) => {
    if (
      selectedTheme?.id === themeId &&
      selectedTheme?.subType === subType
    ) {
      // Deselect
      setSelectedTheme(undefined);
      return;
    }

    // Select new theme
    setSelectedTheme({
      id: themeId,
      name: themeName || `Theme #${themeId}`,
      subType,
    });
  };

  const handleUseTheme = () => {
    if (!selectedTheme) return;

    const params = new URLSearchParams({
      theme: selectedTheme.id.toString(),
    });

    if (selectedTheme.subType) {
      params.append("subType", selectedTheme.subType);
    }

    navigate(`/dashboard/create-event?${params.toString()}`);
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

        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Selected Theme Banner */}
      {selectedTheme && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Theme Selected
                  </h3>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
                    <span>You selected</span>
                    <Badge variant="outline">
                      {selectedTheme.name}
                    </Badge>

                    {selectedTheme.subType && (
                      <>
                        <span>-</span>
                        <Badge variant="secondary">
                          {selectedTheme.subType}
                        </Badge>
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
        onSelectTheme={handleThemeSelection}
        selectedTheme={selectedTheme?.id}
        userType="professional-planner"
      />
    </div>
  );
}
