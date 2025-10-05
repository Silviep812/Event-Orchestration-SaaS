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
  subType?: string;
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
  const [eventTypes, setEventTypes] = useState<{ id: number; name: string; theme_id: number; parent_id: number | null }[]>([]);
  const [subEventTypes, setSubEventTypes] = useState<{ id: number; name: string; theme_id: number; parent_id: number | null }[]>([]);
  const [venueProfiles, setVenueProfiles] = useState<{ id: string; ven_biz_name: string }[]>([]);
  const selectedThemeId = watch("theme_id");
  const selectedEventType = watch("type");
  const selectedSubType = watch("subType");

  const [themesLoaded, setThemesLoaded] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

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
    const fetchVenueProfiles = async () => {
      const { data, error } = await supabase
        .from('Venue Profile')
        .select('venue_type_id, ven_biz_name')
        .order('ven_biz_name');

      if (error) {
        console.error('Error fetching venue profiles:', error);
        setVenueProfiles([]);
        return;
      }
      setVenueProfiles(data?.map(v => ({ id: v.venue_type_id, ven_biz_name: v.ven_biz_name })) || []);
    };
    fetchVenueProfiles();
  }, []);

useEffect(() => {
  // Only set theme_id from URL param after themes are loaded
  if (!themesLoaded) return;
  const themeParam = searchParams.get('theme');
  const subTypeParam = searchParams.get('subType');
  
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
        setSubEventTypes([]);
        return;
      }

      // Fetch parent event types (categories like Holidays, Personal)
      const { data, error } = await supabase
        .from('event_types')
        .select('id, name, theme_id, parent_id')
        .eq('theme_id', selectedThemeId)
        .is('parent_id', null)
        .order('name');
      
      if (error) {
        console.error('Error fetching event types:', error);
        setEventTypes([]);
        return;
      }
      
      setEventTypes(data || []);

      // If we have a subType from URL, find and select the parent category
      const subTypeParam = searchParams.get('subType');
      if (subTypeParam && data && data.length > 0) {
        // Search through all parent categories to find which one contains this subType
        for (const parentType of data) {
          const { data: subTypes, error: subError } = await supabase
            .from('event_types')
            .select('id, name')
            .eq('parent_id', parentType.id)
            .eq('name', subTypeParam);

          if (!subError && subTypes && subTypes.length > 0) {
            // Found the matching subType
            // First, load the sub-types for this parent
            const { data: allSubTypes } = await supabase
              .from('event_types')
              .select('id, name, theme_id, parent_id')
              .eq('parent_id', parentType.id)
              .order('name');
            
            setSubEventTypes(allSubTypes || []);
            
            // Then set both values
            setValue("type", parentType.id.toString(), { shouldValidate: true });
            setValue("subType", subTypes[0].id.toString(), { shouldValidate: true });
            break;
          }
        }
      }
    };
    
    fetchEventTypes();
  }, [selectedThemeId, searchParams, setValue]);

  // Fetch sub-types when a parent event type is selected (only if not from URL)
  useEffect(() => {
    const fetchSubEventTypes = async () => {
      // Don't refetch if we already loaded from URL params
      const subTypeParam = searchParams.get('subType');
      if (subTypeParam && subEventTypes.length > 0) {
        return;
      }

      if (!selectedEventType) {
        setSubEventTypes([]);
        return;
      }

      const parentId = parseInt(selectedEventType);
      if (isNaN(parentId)) {
        setSubEventTypes([]);
        return;
      }

      const { data, error } = await supabase
        .from('event_types')
        .select('id, name, theme_id, parent_id')
        .eq('parent_id', parentId)
        .order('name');
      
      if (error) {
        console.error('Error fetching sub event types:', error);
        setSubEventTypes([]);
        return;
      }
      
      setSubEventTypes(data || []);
    };
    
    fetchSubEventTypes();
  }, [selectedEventType, searchParams, subEventTypes.length]);

  // Sync budget input with react-hook-form
  useEffect(() => {
    const sub = watch((value, { name }) => {
      if (name === 'budget') {
        setBudgetInput(value.budget ?? '');
      }
    });
    return () => sub.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: EventFormData) => {
    if (!dateRange?.from) {
      toast({
        title: "Date Required",
        description: "Please select at least a start date for your event.",
        variant: "destructive",
      });
      return;
    }

    // Trial version date restriction
    const trialEnd = new Date('2025-12-31T23:59:59');
    if (dateRange.from > trialEnd) {
      toast({
        title: "Trial Limitation",
        description: "The trial version doesn't allow creating events after December 31st, 2025.",
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
      // Use subType if available, otherwise use type
      const typeId = data.subType ? parseInt(data.subType) : parseInt(data.type);
      
      const eventData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        type_id: typeId,
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
                <Label htmlFor="type">Event Category *</Label>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: subEventTypes.length > 0 ? false : "Event category is required" }}
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
                              ? "Select event category" 
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
                {errors.type && subEventTypes.length === 0 && (
                  <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
                )}
                {!selectedThemeId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Please select an event theme first to see available categories.
                  </p>
                )}
              </div>

              {subEventTypes.length > 0 && (
                <div>
                  <Label htmlFor="subType">Event Type *</Label>
                  <Controller
                    name="subType"
                    control={control}
                    rules={{ required: "Event type is required" }}
                    render={({ field }) => (
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specific event type" />
                        </SelectTrigger>
                        <SelectContent>
                          {subEventTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

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
                <Controller
                  name="venue"
                  control={control}
                  rules={{ required: "Venue is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select venue profile" />
                      </SelectTrigger>
                      <SelectContent>
                        {venueProfiles.map((venue) => (
                          <SelectItem key={venue.id} value={venue.ven_biz_name}>
                            {venue.ven_biz_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                  value={budgetInput}
                  onChange={e => {
                    setBudgetInput(e.target.value);
                    setValue('budget', e.target.value);
                  }}
                  onBlur={() => {
                    if (budgetInput) {
                      const formatted = parseFloat(budgetInput).toFixed(2);
                      setBudgetInput(formatted);
                      setValue('budget', formatted);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
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
            setBudgetInput('');
            setSubEventTypes([]);
            // Clear URL parameters to prevent form repopulation
            navigate('/dashboard/create-event', { replace: true });
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