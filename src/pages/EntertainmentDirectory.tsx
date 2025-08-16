import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Music, Mic, Users, Sparkles, Volume2, Star } from "lucide-react";

const entertainmentTypes = [
  { value: "musicians", label: "Musicians", icon: Music },
  { value: "dj", label: "DJ Music", icon: Volume2 },
  { value: "performer", label: "Performer", icon: Sparkles },
  { value: "standup", label: "Standup Comic", icon: Mic },
  { value: "speaker", label: "Speaker", icon: Users },
  { value: "stage", label: "Stage Production", icon: Star },
];

export default function EntertainmentDirectory() {
  const [selectedType, setSelectedType] = useState<string>("");

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Entertainment Directory</h1>
        <p className="text-muted-foreground">
          Browse and discover entertainment options for your events
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Entertainment Type Selection
          </CardTitle>
          <CardDescription>
            Choose the type of entertainment you're looking for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select entertainment type..." />
            </SelectTrigger>
            <SelectContent>
              {entertainmentTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedType && (
            <div className="mt-4">
              <Badge variant="secondary" className="mb-4">
                Selected: {entertainmentTypes.find(t => t.value === selectedType)?.label}
              </Badge>
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Entertainment profiles for {entertainmentTypes.find(t => t.value === selectedType)?.label} will be displayed here.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}