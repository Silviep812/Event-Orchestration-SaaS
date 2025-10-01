import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Plus, X, Calendar, MapPin, Users, DollarSign } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EventFormData {
  title: string;
  description: string;
  type: string;
  venue: string;
  budget: string;
  expectedAttendees: string;
  theme_id: number;
}

export default function CreateEvent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<EventFormData>();

  const [eventThemes, setEventThemes] = useState<{ id: number; name: string; premium: boolean }[]>([]);
  const [eventTypes, setEventTypes] = useState<{ id: number; name: string; theme_id: number }[]>([]);
  const selectedThemeId = watch("theme_id");

  const [themesLoaded, setThemesLoaded] = useState(false);

  useEffect(() => {
    const fetchThemes = async () => {
      const { data, error } = await supabase
        .from('event_themes')
        .select('id, name, premium')
        .order('name');

      if (error) {
        console.error('Error fetching themes:', error);
        setEventThemes([]);
        setThemesLoaded(true);
        return;
      }
      setEventThemes(data || []);
      setThemesLoaded(true);
    };
    fetchThemes();
  }, []);

useEffect(() => {
  // Only set theme_id from URL param after themes are loaded
  if (!themesLoaded) return;
  const themeParam = searchParams.get('theme');
  if (themeParam) {
    const themeId = parseInt(themeParam, 10);
    if (!isNaN(themeId)) {
      setValue('theme_id', themeId);
    }
  }
}, [themesLoaded, searchParams, setValue]);

  useEffect(() => {
    const fetchEventTypes = async () => {
      if (!selectedThemeId) {
        setEventTypes([]);
        return;
      }

      const { data, error } = await supabase
        .from('event_types')
        .select('id, name, theme_id')
        .eq('theme_id', selectedThemeId)
        .order('name');
      
      if (error) {
        console.error('Error fetching event types:', error);
        setEventTypes([]);
        return;
      }
      
      setEventTypes(data || []);
    };
    
    fetchEventTypes();
    // Reset event type when theme changes
    setValue("type", "");
  }, [selectedThemeId, setValue]);

  const onSubmit = async (data: EventFormData) => {
    if (!dateRange?.from) {
      toast({
        title: "Date Required",
        description: "Please select at least a start date for your event.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create an event.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Prepare event data for the new events table
      const eventData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        type_id: parseInt(data.type),
        venue: data.venue,
        start_date: dateRange.from.toISOString().split('T')[0],
        end_date: dateRange.to ? dateRange.to.toISOString().split('T')[0] : null,
        budget: data.budget ? parseFloat(data.budget) : null,
        expected_attendees: data.expectedAttendees ? parseInt(data.expectedAttendees) : null,
        theme_id: data.theme_id,
      };

      // Save to the new events table
      const { error: insertError } = await supabase
        .from('events')
        .insert([eventData]);

      if (insertError) {
        console.error('Error creating event:', insertError);
        toast({
          title: "Error Creating Event",
          description: "There was an error saving your event. Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Event Created Successfully!",
        description: `Your event "${data.title}" has been created and saved.`,
      });

      // Reset form
      reset();
      setDateRange(undefined);

      // Redirect to manage event page
      navigate('/dashboard/manage-event');

    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error Creating Event",
        description: "There was an unexpected error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
        <p className="text-muted-foreground">
          Fill in the details below to create your event. All fields marked with * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the fundamental details of your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  {...register("title", { required: "Event title is required" })}
                  placeholder="Enter event title"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="theme">Event Theme *</Label>
                <Controller
                  name="theme_id"
                  control={control}
                  rules={{ required: "Event theme is required" }}
                  render={({ field }) => (
                    <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventThemes.filter(theme => theme.premium !== true).map((theme) => (
                          <SelectItem key={theme.id} value={theme.id.toString()}>
                            {theme.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.theme_id && (
                  <p className="text-sm text-destructive mt-1">{errors.theme_id.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Event Type *</Label>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: "Event type is required" }}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={!selectedThemeId}
                    >
                      <SelectTrigger>
                        <SelectValue 
                          placeholder={
                            selectedThemeId 
                              ? "Select event type" 
                              : "Select theme first"
                          } 
                        />
                      </SelectTrigger>
                       <SelectContent>
                         {eventTypes.map((type) => (
                           <SelectItem key={type.id} value={type.id.toString()}>
                             {type.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
                )}
                {!selectedThemeId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Please select an event theme first to see available types.
                  </p>
                )}
              </div>

              <div>
                <Label>Event Dates *</Label>
                <DatePickerWithRange 
                  date={dateRange} 
                  onDateChange={setDateRange}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe your event..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Event Details
              </CardTitle>
              <CardDescription>
                Specify venue, budget, and attendee information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="venue">Venue *</Label>
                <Input
                  id="venue"
                  {...register("venue", { required: "Venue is required" })}
                  placeholder="Enter venue name or address"
                />
                {errors.venue && (
                  <p className="text-sm text-destructive mt-1">{errors.venue.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="expectedAttendees" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Expected Attendees
                </Label>
                <Input
                  id="expectedAttendees"
                  type="number"
                  {...register("expectedAttendees")}
                  placeholder="Number of attendees"
                />
              </div>

              <div>
                <Label htmlFor="budget" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Budget
                </Label>
                <Input
                  id="budget"
                  {...register("budget")}
                  placeholder="Enter budget amount"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button type="button" variant="outline" onClick={() => {
            reset();
            setDateRange(undefined);
          }}>
            Clear Form
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Event..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}