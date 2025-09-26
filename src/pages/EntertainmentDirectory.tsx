import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music, Mic, Users, MessageCircle, Presentation, Theater, HelpCircle } from "lucide-react";

const EntertainmentDirectory = () => {
  const [entertainmentTypes, setEntertainmentTypes] = useState<any[]>([]);
  const [selectedEntertainmentTypes, setSelectedEntertainmentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock entertainment profiles data
  const mockEntertainmentProfiles = [
    {
      id: 1,
      business_name: "Harmony Music Collective",
      contact_name: "Sarah Johnson",
      email: "sarah@harmonycollective.com",
      contact_phone: "(555) 123-4567",
      type: "musicians",
      price: 2500,
      location: "Los Angeles, CA",
      available_dates: "2024-01-15 to 2024-12-31",
      description: "Professional jazz and classical ensemble for weddings and corporate events"
    },
    {
      id: 2,
      business_name: "Beat Master Productions",
      contact_name: "Mike Chen",
      email: "mike@beatmaster.com",
      contact_phone: "(555) 987-6543",
      type: "dj_music",
      price: 800,
      location: "New York, NY",
      available_dates: "2024-02-01 to 2024-11-30",
      description: "Professional DJ services with state-of-the-art sound equipment"
    },
    {
      id: 3,
      business_name: "Spotlight Entertainment",
      contact_name: "Emma Rodriguez",
      email: "emma@spotlight.com",
      contact_phone: "(555) 456-7890",
      type: "performer",
      price: 1500,
      location: "Miami, FL",
      available_dates: "2024-03-01 to 2024-10-31",
      description: "Dancers, acrobats, and variety performers for all types of events"
    },
    {
      id: 4,
      business_name: "Laugh Track Comedy",
      contact_name: "Dave Wilson",
      email: "dave@laughtrack.com",
      contact_phone: "(555) 321-0987",
      type: "standup_comic",
      price: 1200,
      location: "Chicago, IL",
      available_dates: "2024-01-01 to 2024-12-31",
      description: "Clean comedy for corporate events and private parties"
    },
    {
      id: 5,
      business_name: "TED Speakers Bureau",
      contact_name: "Dr. Lisa Park",
      email: "lisa@tedspeakers.com",
      contact_phone: "(555) 654-3210",
      type: "speaker",
      price: 5000,
      location: "San Francisco, CA",
      available_dates: "2024-04-01 to 2024-09-30",
      description: "Motivational and keynote speakers for conferences and seminars"
    },
    {
      id: 6,
      business_name: "Broadway Dreams Productions",
      contact_name: "Anthony Martinez",
      email: "anthony@broadwaydreams.com",
      contact_phone: "(555) 789-0123",
      type: "stage_production",
      price: 8000,
      location: "Las Vegas, NV",
      available_dates: "2024-05-01 to 2024-08-31",
      description: "Full theatrical productions and musical performances"
    }
  ];

  // Filter profiles based on selected entertainment types
  const filteredProfiles = selectedEntertainmentTypes.length > 0 
    ? mockEntertainmentProfiles.filter(profile => selectedEntertainmentTypes.includes(profile.type))
    : mockEntertainmentProfiles;

  const entertainmentTypeOptions = [
    { value: "musicians", label: "Musicians", icon: Music },
    { value: "dj_music", label: "DJ Music", icon: Music },
    { value: "performer", label: "Performer", icon: Users },
    { value: "standup_comic", label: "Standup Comic", icon: MessageCircle },
    { value: "speaker", label: "Speaker", icon: Presentation },
    { value: "stage_production", label: "Stage Production", icon: Theater },
    { value: "other", label: "Other", icon: HelpCircle }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Entertainment Directory</h1>
        <p className="text-muted-foreground">
          Browse entertainment options for your event
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Entertainment Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Entertainment Types (select all that apply)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {entertainmentTypeOptions.map((option) => {
                const IconComponent = option.icon;
                const isChecked = selectedEntertainmentTypes.includes(option.value);
                return (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEntertainmentTypes([...selectedEntertainmentTypes, option.value]);
                        } else {
                          setSelectedEntertainmentTypes(selectedEntertainmentTypes.filter(type => type !== option.value));
                        }
                      }}
                    />
                    <label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <IconComponent size={16} />
                      {option.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
          
          {selectedEntertainmentTypes.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Entertainment Types:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedEntertainmentTypes.map(type => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {entertainmentTypeOptions.find(opt => opt.value === type)?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={() => setSelectedEntertainmentTypes([])} 
            variant="outline"
            disabled={selectedEntertainmentTypes.length === 0}
          >
            Clear All Selections
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entertainment Profiles ({filteredProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No entertainment profiles match your selected criteria.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => {
                const typeOption = entertainmentTypeOptions.find(opt => opt.value === profile.type);
                const IconComponent = typeOption?.icon || HelpCircle;
                
                return (
                  <Card key={profile.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{profile.business_name}</CardTitle>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {typeOption?.label || 'Other'}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-semibold">{profile.contact_name}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        <p className="text-sm text-muted-foreground">{profile.contact_phone}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm"><strong>Location:</strong> {profile.location}</p>
                        <p className="text-sm"><strong>Price:</strong> ${profile.price.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm"><strong>Available:</strong> {profile.available_dates}</p>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{profile.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EntertainmentDirectory;