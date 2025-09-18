import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
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
  theme_id: string;
}

export default function CreateEvent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<EventFormData>();

  const [eventThemes, setEventThemes] = useState<{ id: string; name: string }[]>([]);
  
  useEffect(() => {
    const fetchThemes = async () => {
      const { data, error } = await supabase
        .from('event_themes')
        .select('id, name')
        .order('name');
      
      if (error) {
        console.error('Error fetching themes:', error);
        setEventThemes([]);
        return;
      }
      
      setEventThemes(data || []);
    };
    fetchThemes();
  }, []);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

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
        event_type: data.type,
        venue: data.venue,
        start_date: dateRange.from.toISOString().split('T')[0],
        end_date: dateRange.to ? dateRange.to.toISOString().split('T')[0] : null,
        budget: data.budget ? parseFloat(data.budget) : null,
        expected_attendees: data.expectedAttendees ? parseInt(data.expectedAttendees) : null,
        tags: tags.length > 0 ? tags : null,
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
      setTags([]);

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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventThemes.map((theme) => (
                          <SelectItem key={theme.id} value={theme.id}>
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="party">Party</SelectItem>
                        <SelectItem value="wedding">Wedding</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
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

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} size="icon" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button type="button" variant="outline" onClick={() => {
            reset();
            setDateRange(undefined);
            setTags([]);
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