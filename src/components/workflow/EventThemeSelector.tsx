import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Building, 
  Cake, 
  Users, 
  Music, 
  Coffee, 
  Network,
  Palette,
  CheckCircle2 
} from "lucide-react";

interface EventTheme {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  tags: string[];
  popularWith: string[];
}

interface EventThemeSelectorProps {
  userType: string;
  onSelectTheme: (theme: string) => void;
  selectedTheme?: string;
}

const eventThemes: EventTheme[] = [
  {
    id: "wedding",
    name: "Wedding & Romance",
    description: "Elegant celebrations of love and commitment",
    icon: Heart,
    color: "text-theme-wedding",
    bgColor: "bg-theme-wedding",
    tags: ["Elegant", "Romantic", "Formal", "Traditional"],
    popularWith: ["professional-planner", "venue-owner"]
  },
  {
    id: "corporate",
    name: "Corporate & Business",
    description: "Professional networking and business events",
    icon: Building,
    color: "text-theme-corporate", 
    bgColor: "bg-theme-corporate",
    tags: ["Professional", "Networking", "Formal", "Strategic"],
    popularWith: ["professional-planner", "hospitality-owner"]
  },
  {
    id: "birthday",
    name: "Birthday & Celebrations",
    description: "Personal milestones and joyful celebrations",
    icon: Cake,
    color: "text-theme-birthday",
    bgColor: "bg-theme-birthday",
    tags: ["Fun", "Personal", "Colorful", "Memorable"],
    popularWith: ["social-organizer", "venue-owner"]
  },
  {
    id: "conference",
    name: "Conference & Summit",
    description: "Educational and industry-focused gatherings",
    icon: Users,
    color: "text-theme-conference",
    bgColor: "bg-theme-conference",
    tags: ["Educational", "Professional", "Informative", "Strategic"],
    popularWith: ["professional-planner", "hospitality-owner"]
  },
  {
    id: "festival",
    name: "Festival & Entertainment",
    description: "Large-scale entertainment and cultural events",
    icon: Music,
    color: "text-theme-festival",
    bgColor: "bg-theme-festival",
    tags: ["Energetic", "Cultural", "Entertainment", "Large-scale"],
    popularWith: ["professional-planner", "venue-owner"]
  },
  {
    id: "social",
    name: "Social & Community",
    description: "Community gatherings and social meetups",
    icon: Coffee,
    color: "text-theme-social",
    bgColor: "bg-theme-social",
    tags: ["Community", "Casual", "Friendly", "Inclusive"],
    popularWith: ["social-organizer", "hospitality-owner"]
  },
  {
    id: "networking",
    name: "Networking & Mixers",
    description: "Professional connections and industry mixers",
    icon: Network,
    color: "text-theme-networking",
    bgColor: "bg-theme-networking",
    tags: ["Professional", "Connections", "Interactive", "Growth"],
    popularWith: ["professional-planner", "hospitality-owner"]
  }
];

export const EventThemeSelector = ({ userType, onSelectTheme, selectedTheme }: EventThemeSelectorProps) => {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  // Filter themes based on user type popularity
  const relevantThemes = eventThemes.filter(theme => 
    theme.popularWith.includes(userType)
  );
  
  const otherThemes = eventThemes.filter(theme => 
    !theme.popularWith.includes(userType)
  );

  const ThemeCard = ({ theme, isRecommended = false }: { theme: EventTheme; isRecommended?: boolean }) => {
    const IconComponent = theme.icon;
    const isSelected = selectedTheme === theme.id;
    const isHovered = hoveredTheme === theme.id;

    return (
      <Card 
        key={theme.id}
        className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
          isSelected 
            ? 'border-primary shadow-lg' 
            : isHovered 
              ? 'border-muted-foreground/30' 
              : 'border-border'
        } ${isRecommended ? 'ring-2 ring-primary/20' : ''}`}
        onMouseEnter={() => setHoveredTheme(theme.id)}
        onMouseLeave={() => setHoveredTheme(null)}
        onClick={() => onSelectTheme(theme.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg ${theme.bgColor}/10 border border-current/20`}>
              <IconComponent className={`h-6 w-6 ${theme.color}`} />
            </div>
            <div className="flex flex-col items-end gap-1">
              {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
              {isRecommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
            </div>
          </div>
          <CardTitle className="text-lg">{theme.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{theme.description}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {theme.tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <Button 
              className="w-full" 
              variant={isSelected ? "default" : "outline"}
              size="sm"
            >
              {isSelected ? "Selected" : "Select Theme"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Palette className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Choose Event Theme</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select an event theme to unlock specialized templates, vendor recommendations, and workflow optimizations.
        </p>
      </div>

      {relevantThemes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Recommended for Your Role
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relevantThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} isRecommended />
            ))}
          </div>
        </div>
      )}

      {otherThemes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">All Event Themes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};