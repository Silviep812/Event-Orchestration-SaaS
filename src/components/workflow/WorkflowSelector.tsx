import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Coffee, MapPin, Calendar, Palette, CheckCircle2 } from "lucide-react";

interface UserType {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  features: string[];
}

interface WorkflowSelectorProps {
  onSelectUserType: (userType: string) => void;
  selectedUserType?: string;
}

const userTypes: UserType[] = [
  {
    id: "host",
    title: "Host Organizer",
    description: "Plan personal celebrations, parties, and social gatherings",
    icon: Users,
    color: "bg-userType-organizer",
    features: ["Birthday Parties", "Anniversaries", "Family Reunions", "Holiday Celebrations"]
  },
  {
    id: "social-organizer",
    title: "Social Event Organizer",
    description: "Plan personal celebrations, parties, and social gatherings",
    icon: Users,
    color: "bg-userType-organizer",
    features: ["Birthday Parties", "Anniversaries", "Family Reunions", "Holiday Celebrations"]
  },
  {
    id: "professional-planner",
    title: "Professional Event Planner",
    description: "Comprehensive event management for clients and businesses",
    icon: Calendar,
    color: "bg-userType-planner", 
    features: ["Corporate Events", "Weddings", "Conferences", "Product Launches"]
  },
  {
    id: "hospitality-provider",
    title: "Hospitality Provider",
    description: "Manage venue bookings, catering, and hospitality services",
    icon: Coffee,
    color: "bg-userType-hospitality",
    features: ["Catering Services", "Venue Management", "Guest Accommodations", "Service Coordination"]
  },
  {
    id: "venue-owner",
    title: "Venue Owner",
    description: "Optimize venue utilization and manage event bookings",
    icon: MapPin,
    color: "bg-userType-venue",
    features: ["Space Management", "Booking Calendar", "Facility Coordination", "Event Support"]
  }
];

export const WorkflowSelector = ({ onSelectUserType, selectedUserType }: WorkflowSelectorProps) => {
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Palette className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Choose Your Workflow</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select your role to access customized event planning tools, themes, and workflows designed for your specific needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userTypes.map((type) => {
          const IconComponent = type.icon;
          const isSelected = selectedUserType === type.id;
          const isHovered = hoveredType === type.id;
          
          return (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                isSelected 
                  ? 'border-primary shadow-lg' 
                  : isHovered 
                    ? 'border-muted-foreground/30' 
                    : 'border-border'
              }`}
              onMouseEnter={() => setHoveredType(type.id)}
              onMouseLeave={() => setHoveredType(null)}
              onClick={() => onSelectUserType(type.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${type.color}/10 border border-current/20`}>
                    <IconComponent className={`h-6 w-6 text-${type.color.replace('bg-', '')}`} />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <CardTitle className="text-lg">{type.title}</CardTitle>
                <CardDescription className="text-sm">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {type.features.map((feature, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    className="w-full" 
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                  >
                    {isSelected ? "Selected" : "Select Workflow"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};