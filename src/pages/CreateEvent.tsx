import { useState, useEffect, useMemo } from "react";
import { useForm, Controller, FieldErrors, FieldError } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Plus, X, Calendar, MapPin, Users, DollarSign, ArrowLeft } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { assertCanCreateEvent } from "@/lib/trialLimits";

interface EventFormData {
  title: string;
  description: string;
  type: string;
  subType?: string;
  venue: string;
  location: string;
  budget: string;
  expectedAttendees: string;
  theme_id: number;
  entertainment_id: string;
  serv_vendor_rental_id: string;
}

export default function CreateEvent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue, setFocus } = useForm<EventFormData>({
    defaultValues: {
      title: "",
      description: "",
      type: "",
      subType: "",
      venue: "",
      location: "",
      budget: "",
      expectedAttendees: "",
      entertainment_id: "",
      serv_vendor_rental_id: "",
    },
  });

  const [eventThemes, setEventThemes] = useState<{ id: number; name: string; premium: boolean }[]>([]);
  const [eventTypes, setEventTypes] = useState<{ id: number; name: string; theme_id: number; parent_id: number | null }[]>([]);
  const [subEventTypes, setSubEventTypes] = useState<{ id: number; name: string; theme_id: number; parent_id: number | null }[]>([]);
  const [venueProfiles, setVenueProfiles] = useState<
    {
      id: string;
      business_name: string;
      venue_type: string;
      venue_type_id: number;
      city?: string | null;
      state?: string | null;
      zip?: string | null;
    }[]
  >([]);
  const [venueTypes, setVenueTypes] = useState<{ id: number; name: string }[]>([]);
  const [selectedVenueType, setSelectedVenueType] = useState<number | null>(null);
  const selectedThemeId = watch("theme_id");
  const selectedEventType = watch("type");
  const selectedSubType = watch("subType");
  const venueName = watch("venue");
  const selectedVenueDetail = venueProfiles.find((v) => v.business_name === venueName);

  const [themesLoaded, setThemesLoaded] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [entertainmentTypes, setEntertainmentTypes] = useState<{ id: number; name: string }[]>([]);
  const [entertainmentProfiles, setEntertainmentProfiles] = useState<
    { id: string; business_name: string; ent_type_id: number | null }[]
  >([]);
  const [selectedEntTypeId, setSelectedEntTypeId] = useState<number | null>(null);
  const [vendorRentalTypes, setVendorRentalTypes] = useState<{ id: number; name: string }[]>([]);
  const [rentalProfiles, setRentalProfiles] = useState<
    {
      id: string;
      business_name: string;
      serv_vendor_rental_assignments?: { vendor_rental_types: { id: number; name: string } | null }[];
    }[]
  >([]);
  const [selectedRentalTypeId, setSelectedRentalTypeId] = useState<number | null>(null);

  const watchedTitle = watch("title");
  const watchedTheme = watch("theme_id");
  const watchedType = watch("type");
  const watchedSubType = watch("subType");
  const watchedVenue = watch("venue");

  const eventTypeSelectionOk =
    subEventTypes.length > 0 ? Boolean(watchedSubType) : Boolean(watchedType);

  const createEventReady = Boolean(
    watchedTitle?.trim() &&
    watchedTheme != null &&
    eventTypeSelectionOk &&
    watchedVenue?.trim() &&
    selectedVenueType != null &&
    dateRange?.from
  );

  const wizardStep = useMemo(() => {
    if (!watchedTitle?.trim() || watchedTheme == null) return 1;
    if (!eventTypeSelectionOk || !dateRange?.from) return 2;
    if (!watchedVenue?.trim() || selectedVenueType == null) return 3;
    return 4;
  }, [
    watchedTitle,
    watchedTheme,
    eventTypeSelectionOk,
    dateRange?.from,
    watchedVenue,
    selectedVenueType,
  ]);

  const wizardLabels = ["Basics", "Venue & directories", "Budget & extras", "Ready"];

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
        .from('venues')
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

  useEffect(() => {
    const loadEntAndRental = async () => {
      const [{ data: entTypes, error: e1 }, { data: entProfs, error: e2 }] = await Promise.all([
        supabase.from("entertainment_types").select("id, name").order("name"),
        supabase.from("entertainments").select("id, business_name, ent_type_id"),
      ]);
      if (!e1) setEntertainmentTypes(entTypes || []);
      if (!e2) setEntertainmentProfiles(entProfs || []);

      const [{ data: vrTypes, error: r1 }, { data: vrProfs, error: r2 }] = await Promise.all([
        supabase.from("vendor_rental_types").select("id, name").order("name"),
        supabase.from("serv_vendor_rentals").select(
          `id, business_name, serv_vendor_rental_assignments(vendor_rental_types(id, name))`
        ),
      ]);
      if (!r1) setVendorRentalTypes(vrTypes || []);
      if (!r2) setRentalProfiles(vrProfs || []);
    };
    loadEntAndRental();
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

  const collectErrorMessages = (errs: FieldErrors<EventFormData>): string[] => {
    const msgs: string[] = [];
    const visit = (node: unknown): void => {
      if (!node || typeof node !== "object") return;
      const fe = node as FieldError;
      if (typeof fe.message === "string" && fe.message) {
        msgs.push(fe.message);
        return;
      }
      for (const v of Object.values(node)) {
        visit(v);
      }
    };
    visit(errs);
    return msgs;
  };

  const onInvalid = (errs: FieldErrors<EventFormData>) => {
    const messages = collectErrorMessages(errs);
    const keys = Object.keys(errs) as (keyof EventFormData)[];
    const description =
      messages.length > 0
        ? messages.join(" ")
        : "Check fields marked with * (attendees and budget are optional).";

    toast({
      title: "Fix the issues below",
      description,
      variant: "destructive",
    });
    const first = keys[0];
    if (first) {
      setFocus(first);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (isSubmitting) return;
    if (!dateRange?.from) {
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
    const trialEnd = new Date('2026-04-30T23:59:59');
    if (dateRange.from > trialEnd) {
      toast({
        title: "Trial Limitation",
        description: "The trial version doesn't allow creating events after April 30th, 2026.",
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

      const trial = await assertCanCreateEvent(user.id, supabase);
      if (!trial.ok) {
        toast({
          title: "Trial limit",
          description: trial.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Prepare event data for the new events table
      // Use subType if available, otherwise use type
      const typeId = data.subType ? parseInt(data.subType) : parseInt(data.type);
      
      const entId = data.entertainment_id?.trim() || null;
      const rentalId = data.serv_vendor_rental_id?.trim() || null;

      // Core row only: optional FK columns need migration 20260327120000 on Supabase.
      // Insert succeeds without them; profile links are applied in a follow-up update.
      const eventData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        type_id: typeId,
        venue: data.venue,
        location: data.location?.trim() || null,
        start_date: dateRange.from.toISOString().split('T')[0],
        end_date: dateRange.to ? dateRange.to.toISOString().split('T')[0] : null,
        budget: data.budget ? parseFloat(data.budget) : null,
        expected_attendees: data.expectedAttendees ? parseInt(data.expectedAttendees) : null,
        theme_id: data.theme_id,
      };

      const { data: insertedRow, error: insertError } = await supabase
        .from("events")
        .insert([eventData])
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating event:", insertError);
        const detail =
          insertError.message ||
          "There was an error saving your event. Please try again.";
        toast({
          title: "Error Creating Event",
          description: detail,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      let profileLinkFailed = false;
      if (insertedRow?.id && (entId || rentalId)) {
        const { error: linkError } = await supabase
          .from("events")
          .update({
            ...(entId ? { entertainment_id: entId } : {}),
            ...(rentalId ? { serv_vendor_rental_id: rentalId } : {}),
          })
          .eq("id", insertedRow.id);
        if (linkError) {
          console.warn("Optional profile links not saved:", linkError);
          profileLinkFailed = true;
        }
      }

      toast({
        title: "Event Created Successfully!",
        description: profileLinkFailed
          ? `Your event "${data.title}" was saved. Entertainment or rental profile links were not stored (run the Supabase migration deliverable1_events_tasks or set profiles in Manage Event).`
          : `Your event "${data.title}" has been created and saved.`,
      });

      if (insertedRow?.id && user.email) {
        void supabase.functions.invoke("send-event-notification", {
          body: {
            kind: "event_created",
            eventTitle: data.title,
            eventId: insertedRow.id,
            userEmail: user.email,
            userId: user.id,
          },
        });
      }

      // Reset form completely
      setIsFormCleared(true);
      reset({
        title: "",
        theme_id: undefined,
        type: "",
        subType: "",
        venue: "",
        location: "",
        entertainment_id: "",
        serv_vendor_rental_id: "",
        budget: "",
        expectedAttendees: "",
        description: ""
      });
      setDateRange(undefined);
      setBudgetInput('');
      setSubEventTypes([]);
      setEventTypes([]);
      setSelectedVenueType(null);
      setSelectedEntTypeId(null);
      setSelectedRentalTypeId(null);

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
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 w-fit"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Create event</h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Required fields are marked with <span className="text-foreground font-medium">*</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4" aria-label="Creation steps">
        {wizardLabels.map((label, i) => {
          const n = i + 1;
          const active = wizardStep === n;
          const done = wizardStep > n;
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium border-2 ${
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : active
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className={`text-xs sm:text-sm ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {label}
              </span>
              {i < wizardLabels.length - 1 ? (
                <span className="hidden sm:inline text-muted-foreground/50 px-1">→</span>
              ) : null}
            </div>
          );
        })}
      </div>

      <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Basic Information
              </CardTitle>
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
                        {eventThemes.map((theme) => (
                          <SelectItem key={theme.id} value={theme.id.toString()}>
                            {theme.name}
                            {theme.premium ? " (Premium)" : ""}
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
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Venue: Type → Profile → Location autofill */}
              <div>
                <Label htmlFor="venueType">Venue Type *</Label>
                <Select
                  value={selectedVenueType?.toString() || ""}
                  onValueChange={(value) => {
                    setSelectedVenueType(Number(value));
                    setValue("venue", "");
                    setValue("location", "");
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
                <Label htmlFor="venue">Venue Profile *</Label>
                <Controller
                  name="venue"
                  control={control}
                  rules={{ required: "Venue profile is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const profile = venueProfiles.find(v => v.business_name === value);
                        if (profile) {
                          const loc = [profile.city, profile.state, profile.zip]
                            .filter(Boolean)
                            .join(", ");
                          setValue("location", loc);
                        }
                      }}
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
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="City, State, ZIP"
                />
                {selectedVenueDetail &&
                  (selectedVenueDetail.city || selectedVenueDetail.state || selectedVenueDetail.zip) && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {[selectedVenueDetail.city, selectedVenueDetail.state, selectedVenueDetail.zip]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
              </div>

              {/* Entertainment: Type → Profile */}
              <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                <Label className="text-sm font-medium">Entertainment (optional)</Label>
                <div>
                  <Label htmlFor="entType" className="text-xs text-muted-foreground">Entertainment Type</Label>
                  <Select
                    value={selectedEntTypeId === null ? "__all__" : String(selectedEntTypeId)}
                    onValueChange={(v) => {
                      setSelectedEntTypeId(v === "__all__" ? null : Number(v));
                      setValue("entertainment_id", "");
                    }}
                  >
                    <SelectTrigger id="entType">
                      <SelectValue placeholder="Select entertainment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All types</SelectItem>
                      {entertainmentTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="entProfile" className="text-xs text-muted-foreground">Entertainment Profile</Label>
                  <Controller
                    name="entertainment_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? field.value : "__none__"}
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger id="entProfile">
                          <SelectValue placeholder="Select entertainment profile" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {entertainmentProfiles
                            .filter((p) =>
                              selectedEntTypeId == null || p.ent_type_id === selectedEntTypeId
                            )
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.business_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* External Vendor: Type → Profile */}
              <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                <Label className="text-sm font-medium">External Vendor (optional)</Label>
                <div>
                  <Label htmlFor="vendorType" className="text-xs text-muted-foreground">External Vendor Type</Label>
                  <Select
                    value={selectedRentalTypeId === null ? "__all__" : String(selectedRentalTypeId)}
                    onValueChange={(v) => {
                      setSelectedRentalTypeId(v === "__all__" ? null : Number(v));
                      setValue("serv_vendor_rental_id", "");
                    }}
                  >
                    <SelectTrigger id="vendorType">
                      <SelectValue placeholder="Select vendor type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All types</SelectItem>
                      {vendorRentalTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vendorProfile" className="text-xs text-muted-foreground">External Vendor Profile</Label>
                  <Controller
                    name="serv_vendor_rental_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? field.value : "__none__"}
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger id="vendorProfile">
                          <SelectValue placeholder="Select vendor profile" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {rentalProfiles
                            .filter((p) => {
                              if (selectedRentalTypeId == null) return true;
                              return p.serv_vendor_rental_assignments?.some(
                                (a: { vendor_rental_types?: { id: number } | null }) =>
                                  a.vendor_rental_types?.id === selectedRentalTypeId
                              );
                            })
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.business_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="expectedAttendees" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of Attendees
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="expectedAttendees"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  {...register("expectedAttendees", {
                    validate: (v) =>
                      v === "" || v === undefined || /^\d+$/.test(String(v).trim()) || "Enter a whole number or leave blank",
                  })}
                  placeholder="Number of people attending"
                />
              </div>

              <div>
                <Label htmlFor="budget" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Budget Amount
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
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
              entertainment_id: "",
              serv_vendor_rental_id: "",
              budget: "",
              expectedAttendees: "",
              description: ""
            });
            setDateRange(undefined);
            setBudgetInput('');
            setSubEventTypes([]);
            setEventTypes([]);
            setSelectedVenueType(null);
            setSelectedEntTypeId(null);
            setSelectedRentalTypeId(null);
            
            // Clear URL parameters to prevent form repopulation
            navigate('/dashboard/create-event', { replace: true });
          }}>
            Clear Form
          </Button>
          <Button type="submit" disabled={!createEventReady || isSubmitting}>
            {isSubmitting ? "Creating Event…" : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}