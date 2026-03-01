import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Plus, X, Calendar, MapPin, Users, DollarSign, Clock } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EventFormData {
  title: string;
  description: string;
  type: string;
  subType?: string;
  venue: string;
  location?: string;
  budget: string;
  expectedAttendees: string;
  theme_id: number;
  start_time?: string;
  end_time?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

interface VenueProfile {
  id: string;
  business_name: string;
  venue_type: string;
  venue_type_id: number;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

const formatVenueLocation = (venue: VenueProfile) => {
  const locationPieces = [venue.city, venue.state].filter(
    (piece): piece is string => Boolean(piece && piece.trim())
  );

  const baseLocation = locationPieces.join(", ");
  const trimmedZip = venue.zip?.trim();

  if (baseLocation && trimmedZip) {
    return `${baseLocation} ${trimmedZip}`;
  }

  if (baseLocation) {
    return baseLocation;
  }

  return trimmedZip ?? "";
};

export default function CreateEvent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [dateError, setDateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<EventFormData>();

  const [eventThemes, setEventThemes] = useState<{ id: number; name: string; premium: boolean }[]>([]);
  const [eventTypes, setEventTypes] = useState<{ id: number; name: string; theme_id: number; parent_id: number | null }[]>([]);
  const [subEventTypes, setSubEventTypes] = useState<{ id: number; name: string; theme_id: number; parent_id: number | null }[]>([]);
  const [venueProfiles, setVenueProfiles] = useState<VenueProfile[]>([]);
  const [venueTypes, setVenueTypes] = useState<{ id: number; name: string }[]>([]);
  const [selectedVenueType, setSelectedVenueType] = useState<number | null>(null);
  const selectedThemeId = watch("theme_id");
  const selectedEventType = watch("type");
  const selectedSubType = watch("subType");
  const selectedVenueName = watch("venue");
  const prevSelectedVenueNameRef = useRef<string | undefined>();

  const [themesLoaded, setThemesLoaded] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');


  useEffect(() => {
    if (!selectedVenueName) {
      prevSelectedVenueNameRef.current = undefined;
      return;
    }

    if (prevSelectedVenueNameRef.current === selectedVenueName) {
      return;
    }

    const selectedProfile = venueProfiles.find(
      (profile) => profile.business_name === selectedVenueName
    );

    if (!selectedProfile) {
      return;
    }

    const locationValue = formatVenueLocation(selectedProfile);
    if (!locationValue) {
      return;
    }

    setValue("location", locationValue);
    prevSelectedVenueNameRef.current = selectedVenueName;
  }, [selectedVenueName, setValue, venueProfiles]);

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
    const fetchVenueData = async () => {
      // Fetch venue types
      const { data: typesData, error: typesError } = await supabase
        .from('venue_types')
        .select('id, name')
        .order('name');

      if (typesError) {
        console.error('Error fetching venue types:', typesError);
        return;
      }

      setVenueTypes(typesData || []);

      // Fetch venues with their types
      const { data: venuesData, error: venuesError } = await supabase
        .from('venue_profiles')
        .select('id, business_name, venue_type_id, city, state, zip, venue_types(name)')
        .order('business_name');

      if (venuesError) {
        console.error('Error fetching venues:', venuesError);
        setVenueProfiles([]);
        return;
      }

      const profiles = venuesData?.map(v => ({
        id: v.id,
        business_name: v.business_name,
        venue_type_id: v.venue_type_id,
        venue_type: v.venue_types?.name || 'Other',
        city: v.city,
        state: v.state,
        zip: v.zip
      })) || [];

      setVenueProfiles(profiles);
    };
    fetchVenueData();
  }, []);

  const [isFormCleared, setIsFormCleared] = useState(false);

  useEffect(() => {
    // Only set theme_id from URL param after themes are loaded and if form wasn't just cleared
    if (!themesLoaded || isFormCleared) {
      if (isFormCleared) setIsFormCleared(false);
      return;
    }
    const themeParam = searchParams.get('theme');

    if (themeParam) {
      const themeId = parseInt(themeParam, 10);
      if (!isNaN(themeId)) {
        setValue('theme_id', themeId);
      }
    }
  }, [themesLoaded, searchParams, setValue, isFormCleared]);

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
      setDateError("Event date is required. Please select a date range.");
      toast({
        title: "Date Required",
        description: "Please select at least a start date for your event.",
        variant: "destructive",
      });
      return;
    }

    // Validate date range
    if (dateRange.to && dateRange.from > dateRange.to) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    // Trial version date restriction
    const trialEnd = new Date('2026-06-30T23:59:59');
    if (dateRange.from > trialEnd) {
      toast({
        title: "Trial Limitation",
        description: "The trial version doesn't allow creating events after June 30th, 2026.",
        variant: "destructive",
      });
      return;
    }

    // Validate budget if provided
    if (data.budget && parseFloat(data.budget) < 0) {
      toast({
        title: "Invalid Budget",
        description: "Budget must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    // Validate attendees if provided
    if (data.expectedAttendees && parseInt(data.expectedAttendees) < 0) {
      toast({
        title: "Invalid Attendee Count",
        description: "Expected attendees must be a positive number.",
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
        location: data.location || null,
        start_date: dateRange.from.toISOString().split('T')[0],
        end_date: dateRange.to ? dateRange.to.toISOString().split('T')[0] : null,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
        budget: data.budget ? parseFloat(data.budget) : null,
        expected_attendees: data.expectedAttendees ? parseInt(data.expectedAttendees) : null,
        theme_id: data.theme_id,
        status: data.status || 'pending',
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

      // Reset form completely
      setIsFormCleared(true);
      reset({
        title: "",
        theme_id: undefined,
        type: "",
        subType: "",
        venue: "",
        location: "",
        budget: "",
        expectedAttendees: "",
        description: "",
        start_time: "",
        end_time: "",
        status: "pending"
      });
      setDateRange(undefined);
      setBudgetInput('');
      setSubEventTypes([]);
      setEventTypes([]);
      setSelectedVenueType(null);

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
                    <Select value={field.value?.toString() || ""} onValueChange={(value) => field.onChange(Number(value))}>
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
                  onDateChange={(range) => {
                    setDateError(null);
                    setDateRange(range);
                  }}
                  className="w-full"
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                />
                {dateError && (
                  <p className="text-sm text-destructive mt-1">{dateError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="start_time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Start Time
                  </Label>
                  <div className="flex gap-1 items-center">
                    <Select
                      value={(() => {
                        const hour24 = parseInt(watch("start_time")?.split(":")[0] || "12");
                        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                        return hour12.toString().padStart(2, "0");
                      })()}
                      onValueChange={(hour12) => {
                        const currentTime = watch("start_time") || "12:00";
                        const [currentHour24] = currentTime.split(":");
                        const minutes = currentTime.split(":")[1] || "00";
                        const isPM = parseInt(currentHour24) >= 12;
                        let hour24 = parseInt(hour12);
                        if (isPM && hour24 !== 12) hour24 += 12;
                        if (!isPM && hour24 === 12) hour24 = 0;
                        setValue("start_time", `${hour24.toString().padStart(2, "0")}:${minutes}`);
                      }}
                    >
                      <SelectTrigger className="w-[65px]">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((hour) => (
                          <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground font-medium">:</span>
                    <Select
                      value={watch("start_time")?.split(":")[1] || "00"}
                      onValueChange={(minute) => {
                        const currentTime = watch("start_time") || "12:00";
                        const hour = currentTime.split(":")[0] || "12";
                        setValue("start_time", `${hour}:${minute}`);
                      }}
                    >
                      <SelectTrigger className="w-[65px]">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {["00", "15", "30", "45"].map((minute) => (
                          <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={parseInt(watch("start_time")?.split(":")[0] || "0") >= 12 ? "PM" : "AM"}
                      onValueChange={(period) => {
                        const currentTime = watch("start_time") || "12:00";
                        let hour24 = parseInt(currentTime.split(":")[0] || "12");
                        const minutes = currentTime.split(":")[1] || "00";
                        if (period === "AM" && hour24 >= 12) {
                          hour24 = hour24 === 12 ? 0 : hour24 - 12;
                        } else if (period === "PM" && hour24 < 12) {
                          hour24 = hour24 === 0 ? 12 : hour24 + 12;
                        }
                        setValue("start_time", `${hour24.toString().padStart(2, "0")}:${minutes}`);
                      }}
                    >
                      <SelectTrigger className="w-[60px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="end_time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    End Time
                  </Label>
                  <div className="flex gap-1 items-center">
                    <Select
                      value={(() => {
                        const hour24 = parseInt(watch("end_time")?.split(":")[0] || "12");
                        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                        return hour12.toString().padStart(2, "0");
                      })()}
                      onValueChange={(hour12) => {
                        const currentTime = watch("end_time") || "12:00";
                        const [currentHour24] = currentTime.split(":");
                        const minutes = currentTime.split(":")[1] || "00";
                        const isPM = parseInt(currentHour24) >= 12;
                        let hour24 = parseInt(hour12);
                        if (isPM && hour24 !== 12) hour24 += 12;
                        if (!isPM && hour24 === 12) hour24 = 0;
                        setValue("end_time", `${hour24.toString().padStart(2, "0")}:${minutes}`);
                      }}
                    >
                      <SelectTrigger className="w-[65px]">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((hour) => (
                          <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground font-medium">:</span>
                    <Select
                      value={watch("end_time")?.split(":")[1] || "00"}
                      onValueChange={(minute) => {
                        const currentTime = watch("end_time") || "12:00";
                        const hour = currentTime.split(":")[0] || "12";
                        setValue("end_time", `${hour}:${minute}`);
                      }}
                    >
                      <SelectTrigger className="w-[65px]">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {["00", "15", "30", "45"].map((minute) => (
                          <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={parseInt(watch("end_time")?.split(":")[0] || "0") >= 12 ? "PM" : "AM"}
                      onValueChange={(period) => {
                        const currentTime = watch("end_time") || "12:00";
                        let hour24 = parseInt(currentTime.split(":")[0] || "12");
                        const minutes = currentTime.split(":")[1] || "00";
                        if (period === "AM" && hour24 >= 12) {
                          hour24 = hour24 === 12 ? 0 : hour24 - 12;
                        } else if (period === "PM" && hour24 < 12) {
                          hour24 = hour24 === 0 ? 12 : hour24 + 12;
                        }
                        setValue("end_time", `${hour24.toString().padStart(2, "0")}:${minutes}`);
                      }}
                    >
                      <SelectTrigger className="w-[60px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
                <Label htmlFor="venueType">Venue Type *</Label>
                <Select
                  value={selectedVenueType?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedVenueType(Number(value));
                    setValue("venue", ""); // Reset venue selection when type changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {venueTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="venue">Venue *</Label>
                <Controller
                  name="venue"
                  control={control}
                  rules={{ required: "Venue is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={!selectedVenueType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedVenueType ? "Select venue profile" : "Select venue type first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {venueProfiles
                          .filter(venue => venue.venue_type_id === selectedVenueType)
                          .map((venue) => (
                            <SelectItem key={venue.id} value={venue.business_name}>
                              {venue.business_name}
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
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="Enter event location/address"
                />
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="budget"
                    className="pl-7"
                    value={budgetInput}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = rawValue.split('.');
                      const sanitized = parts.length > 2 
                        ? parts[0] + '.' + parts.slice(1).join('') 
                        : rawValue;
                      
                      if (sanitized === '' || sanitized === '.') {
                        setBudgetInput('');
                        setValue('budget', '');
                      } else if (sanitized.endsWith('.')) {
                        const intPart = parseInt(sanitized) || 0;
                        setBudgetInput(intPart.toLocaleString('en-US') + '.');
                        setValue('budget', sanitized);
                      } else if (sanitized.includes('.')) {
                        const [intPart, decPart] = sanitized.split('.');
                        const formattedInt = parseInt(intPart || '0').toLocaleString('en-US');
                        setBudgetInput(`${formattedInt}.${decPart.slice(0, 2)}`);
                        setValue('budget', sanitized);
                      } else {
                        const numericValue = parseInt(sanitized) || 0;
                        setBudgetInput(numericValue.toLocaleString('en-US'));
                        setValue('budget', sanitized);
                      }
                    }}
                    onBlur={() => {
                      const numeric = parseFloat(budgetInput.replace(/,/g, '')) || 0;
                      if (numeric > 0) {
                        setBudgetInput(numeric.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }));
                        setValue('budget', numeric.toString());
                      } else {
                        setBudgetInput('');
                        setValue('budget', '');
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button type="button" variant="outline" onClick={() => {
            // Set flag to prevent URL params from repopulating the form
            setIsFormCleared(true);

            // Reset all form fields
            reset({
              title: "",
              theme_id: undefined,
              type: "",
              subType: "",
              venue: "",
              location: "",
              budget: "",
              expectedAttendees: "",
              description: "",
              start_time: "",
              end_time: "",
              status: "pending"
            });
            setDateRange(undefined);
            setBudgetInput('');
            setSubEventTypes([]);
            setEventTypes([]);
            setSelectedVenueType(null);

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
