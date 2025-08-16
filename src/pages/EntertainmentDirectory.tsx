import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music, Mic, Users, MessageCircle, Presentation, Theater, HelpCircle } from "lucide-react";

const EntertainmentDirectory = () => {
  const [entertainmentTypes, setEntertainmentTypes] = useState<any[]>([]);
  const [selectedEntertainmentTypes, setSelectedEntertainmentTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntertainmentTypes();
  }, []);

  const fetchEntertainmentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('Entertainment Directory')
        .select('*');
      
      if (error) {
        console.error('Error fetching entertainment types:', error);
      } else {
        setEntertainmentTypes(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <CardTitle>Entertainment Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {loading ? 'Loading entertainment data...' : 'No entertainment profiles found. Add entertainment providers to see them here.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EntertainmentDirectory;