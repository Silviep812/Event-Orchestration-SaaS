import { useState, useEffect, useMemo } from "react";
import { useForm, Controller, FieldErrors, FieldError } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { Calendar, MapPin, Users, DollarSign, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DateRange } from "react-day-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import {
  dedupeSportThemesForPicker,
  isHealthWellnessThemeName,
  isRetreatsThemeName,
  isSportThemeName,
  loadHealthWellnessEventTypeGroups,
  loadRetreatsEventTypeGroups,
  loadSportingDirectoryCategoryTypes,
  type SportingCategoryGroup,
  sportThemeRootCategoryDisplayLabel,
  sportingTypeUiLabel,
  sportingUiName,
} from "@/lib/themeEventTypeHierarchy";
import {
  commentsPlannerCopy,
  plannerSafeErrorToastDescription,
  plannerToolsCopy,
} from "@/lib/nudges";

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
}

export default function CreateEvent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
    setFocus,
    clearErrors,
  } = useForm<EventFormData>({
    defaultValues: {
      title: "",
      description: "",
      type: "",
      subType: "",
      venue: "",
      location: "",
      budget: "",
      expectedAttendees: "",
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
  const [customSubTypeName, setCustomSubTypeName] = useState("");

  const selectedThemeId = watch("theme_id");
  const selectedEventType = watch("type");
  const selectedSubType = watch("subType");
  const venueName = watch("venue");
  const selectedVenueDetail = venueProfiles.find((v) => v.business_name === venueName);

  const [themesLoaded, setThemesLoaded] = useState(false);
  const [entertainmentTypes, setEntertainmentTypes] = useState<{ id: number; name: string }[]>([]);
  const [entertainmentProfiles, setEntertainmentProfiles] = useState<
    { id: string; business_name: string; ent_type_id: number | null }[]
  >([]);
  const [selectedEntTypeId, setSelectedEntTypeId] = useState<number | null>(null);
  /** External Vendor directory: procurement (`suppliers`), not rental equipment (`vendor`). */
  const [supplierCategories, setSupplierCategories] = useState<{ id: number; name: string }[]>([]);
  const [externalSupplierProfiles, setExternalSupplierProfiles] = useState<
    { id: string; business_name: string; category_id: number | null }[]
  >([]);
  const [selectedSupplierCategoryId, setSelectedSupplierCategoryId] = useState<number | null>(null);
  const [supplierTypeSelection, setSupplierTypeSelection] = useState<string>("__all__");
  const [supplierTypeManual, setSupplierTypeManual] = useState<string>("");
  const [selectedEntertainmentIds, setSelectedEntertainmentIds] = useState<string[]>([]);
  const [selectedExternalSupplierIds, setSelectedExternalSupplierIds] = useState<string[]>([]);


  /** Same directory > category > type hierarchy as Browse Event Themes (Health & Wellness + Retreats). */
  const [hwHierarchy, setHwHierarchy] = useState<Awaited<
    ReturnType<typeof loadHealthWellnessEventTypeGroups>
  > | null>(null);
  const [retreatHierarchy, setRetreatHierarchy] = useState<Awaited<
    ReturnType<typeof loadRetreatsEventTypeGroups>
  > | null>(null);
  const [hwCategoryKey, setHwCategoryKey] = useState<string>("");
  const [retreatBranchLabel, setRetreatBranchLabel] = useState("");
  const [sportingDirectory, setSportingDirectory] = useState<Record<
    string,
    SportingCategoryGroup
  > | null>(null);
  /** DB category row name under Sporting root (matches `sportingDirectory` keys). */
  const [sportingCategoryKey, setSportingCategoryKey] = useState("");

  const watchedTitle = watch("title");
  const watchedTheme = watch("theme_id");
  const watchedType = watch("type");
  const watchedSubType = watch("subType");
  const watchedVenue = watch("venue");
  const watchedBudget = watch("budget");
  const watchedAttendees = watch("expectedAttendees");

  const selectedThemeName = useMemo(
    () => eventThemes.find((t) => t.id === selectedThemeId)?.name ?? "",
    [eventThemes, selectedThemeId],
  );

  const themeHierarchyMode = useMemo((): "default" | "hw" | "retreats" | "sporting" => {
    if (!selectedThemeName) return "default";
    if (isHealthWellnessThemeName(selectedThemeName)) return "hw";
    if (isRetreatsThemeName(selectedThemeName)) return "retreats";
    if (isSportThemeName(selectedThemeName)) return "sporting";
    return "default";
  }, [selectedThemeName]);

  const eventTypeSelectionOk = useMemo(() => {
    if (themeHierarchyMode === "hw") {
      const pid = hwCategoryKey ? hwHierarchy?.parentIds[hwCategoryKey] : undefined;
      return Boolean(pid && watchedSubType);
    }
    if (themeHierarchyMode === "retreats") {
      const rid = retreatBranchLabel ? retreatHierarchy?.rootIdByBranch[retreatBranchLabel] : undefined;
      return Boolean(rid && watchedSubType);
    }
    if (themeHierarchyMode === "sporting") {
      const grp = sportingCategoryKey ? sportingDirectory?.[sportingCategoryKey] : undefined;
      return Boolean(sportingCategoryKey && grp && watchedSubType?.trim());
    }
    if (subEventTypes.length > 0) return Boolean(watchedSubType);
    return Boolean(watchedType);
  }, [
    themeHierarchyMode,
    hwCategoryKey,
    hwHierarchy,
    retreatBranchLabel,
    retreatHierarchy,
    sportingCategoryKey,
    sportingDirectory,
    watchedSubType,
    watchedType,
    subEventTypes.length,
  ]);

  const budgetOk =
    watchedBudget != null &&
    String(watchedBudget).trim() !== "" &&
    !Number.isNaN(parseFloat(String(watchedBudget))) &&
    parseFloat(String(watchedBudget)) > 0;

  const attendeesOk =
    watchedAttendees != null &&
    String(watchedAttendees).trim() !== "" &&
    /^\d+$/.test(String(watchedAttendees).trim()) &&
    parseInt(String(watchedAttendees).trim(), 10) > 0;

  const createEventReady = Boolean(
    watchedTitle?.trim() &&
    watchedTheme != null &&
    eventTypeSelectionOk &&
    watchedVenue?.trim() &&
    selectedVenueType != null &&
    dateRange?.from &&
    budgetOk &&
    attendeesOk
  );

  const wizardStep = useMemo(() => {
    if (!watchedTitle?.trim() || watchedTheme == null) return 1;
    if (!eventTypeSelectionOk || !dateRange?.from) return 2;
    if (!watchedVenue?.trim() || selectedVenueType == null) return 3;
    if (!budgetOk || !attendeesOk) return 3;
    return 4;
  }, [
    watchedTitle,
    watchedTheme,
    eventTypeSelectionOk,
    dateRange?.from,
    watchedVenue,
    selectedVenueType,
    budgetOk,
    attendeesOk,
  ]);

  const wizardLabels = ["Basics", "Venue & directories", "Budget & extras", "Ready"];

  useEffect(() => {
    const fetchThemes = async () => {
      const { data, error } = await supabase
        .from('Themes Directory Catalog')
        .select('id, name, premium')
        .order('name');

      if (error) {
        console.error('Error fetching themes:', error);
        setEventThemes([]);
        setThemesLoaded(true);
        return;
      }
      setEventThemes(dedupeSportThemesForPicker(data || []) as any);
      setThemesLoaded(true);
    };
    fetchThemes();
  }, []);

  // Dedupe can drop a duplicate sport-themed row; Radix Select shows placeholder if value is missing from items.
  useEffect(() => {
    if (!themesLoaded || eventThemes.length === 0 || selectedThemeId == null) return;
    if (eventThemes.some((t) => t.id === selectedThemeId)) return;
    const sport = eventThemes.find((t) => isSportThemeName(t.name));
    if (sport) setValue("theme_id", sport.id, { shouldValidate: true });
  }, [themesLoaded, eventThemes, selectedThemeId, setValue]);

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
    const loadEntAndSuppliers = async () => {
      const [{ data: entTypes, error: e1 }, { data: entProfs, error: e2 }] = await Promise.all([
        supabase.from("entertainment_types").select("id, name").order("name"),
        supabase.from("entertainments").select("id, business_name, ent_type_id"),
      ]);
      if (!e1) setEntertainmentTypes(entTypes || []);
      if (!e2) setEntertainmentProfiles(entProfs || []);

      const [{ data: catData, error: s1 }, { data: supProfs, error: s2 }] = await Promise.all([
        supabase.from("supplier_categories").select("id, name").order("name"),
        supabase.from("suppliers").select("id, business_name, category_id").order("business_name"),
      ]);
      if (!s1) setSupplierCategories(catData || []);
      if (!s2) setExternalSupplierProfiles(supProfs || []);
    };
    loadEntAndSuppliers();
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
    if (!selectedThemeId) {
      setHwHierarchy(null);
      setRetreatHierarchy(null);
      setSportingDirectory(null);
      setHwCategoryKey("");
      setRetreatBranchLabel("");
      setSportingCategoryKey("");
      return;
    }
    const name = eventThemes.find((t) => t.id === selectedThemeId)?.name ?? "";
    if (isHealthWellnessThemeName(name)) {
      loadHealthWellnessEventTypeGroups().then(setHwHierarchy);
      setRetreatHierarchy(null);
      setSportingDirectory(null);
      setRetreatBranchLabel("");
      setSportingCategoryKey("");
      setHwCategoryKey("");
      setValue("type", "");
      setValue("subType", "");
    } else if (isRetreatsThemeName(name)) {
      loadRetreatsEventTypeGroups().then(setRetreatHierarchy);
      setHwHierarchy(null);
      setSportingDirectory(null);
      setHwCategoryKey("");
      setSportingCategoryKey("");
      setRetreatBranchLabel("");
      setValue("type", "");
      setValue("subType", "");
    } else if (isSportThemeName(name)) {
      setHwHierarchy(null);
      setRetreatHierarchy(null);
      setHwCategoryKey("");
      setRetreatBranchLabel("");
      setSportingCategoryKey("");
      setValue("type", "");
      setValue("subType", "");
      void loadSportingDirectoryCategoryTypes(selectedThemeId)
        .then(setSportingDirectory)
        .catch((e) => {
          console.error("loadSportingDirectoryCategoryTypes:", e);
          setSportingDirectory({});
          toast({
            title: "Could not load Sporting categories",
            description: plannerSafeErrorToastDescription(e, commentsPlannerCopy.toastGeneric),
            variant: "destructive",
          });
        });
    } else {
      setHwHierarchy(null);
      setRetreatHierarchy(null);
      setSportingDirectory(null);
      setHwCategoryKey("");
      setRetreatBranchLabel("");
      setSportingCategoryKey("");
    }
  }, [selectedThemeId, eventThemes, setValue, toast]);

  // Pre-fill from ?subTypeId= (stable) or ?subType= name (browse themes).
  useEffect(() => {
    const subTypeIdParam = searchParams.get("subTypeId");
    if (!subTypeIdParam || !selectedThemeId) return;
    const leafId = parseInt(subTypeIdParam, 10);
    if (Number.isNaN(leafId)) return;

    let cancelled = false;
    void (async () => {
      const { data: leaf } = await supabase
        .from("event_types")
        .select("id, name, parent_id, theme_id")
        .eq("id", leafId)
        .maybeSingle();
      if (cancelled || !leaf || leaf.theme_id !== selectedThemeId) return;

      const tname = eventThemes.find((x) => x.id === selectedThemeId)?.name ?? "";

      if (isHealthWellnessThemeName(tname) && hwHierarchy) {
        for (const k of hwHierarchy.orderedCategoryKeys) {
          const rows = hwHierarchy.groups[k] ?? [];
          if (rows.some((r) => r.id === leaf.id)) {
            setHwCategoryKey(k);
            const pid = hwHierarchy.parentIds[k];
            if (pid) setValue("type", String(pid));
            setValue("subType", String(leaf.id));
            return;
          }
        }
      }
      if (isRetreatsThemeName(tname) && retreatHierarchy) {
        for (const branch of Object.keys(retreatHierarchy.typesByBranch)) {
          const rows = retreatHierarchy.typesByBranch[branch] ?? [];
          if (rows.some((r) => r.id === leaf.id)) {
            setRetreatBranchLabel(branch);
            const rid = retreatHierarchy.rootIdByBranch[branch];
            if (rid) setValue("type", String(rid));
            setValue("subType", String(leaf.id));
            return;
          }
        }
      }
      if (isSportThemeName(tname) && sportingDirectory) {
        for (const key of Object.keys(sportingDirectory)) {
          const grp = sportingDirectory[key];
          if (!grp) continue;
          if (grp.types.some((r) => r.id === leaf.id)) {
            setSportingCategoryKey(key);
            setValue("type", String(grp.categoryId), { shouldValidate: true });
            setValue("subType", String(leaf.id), { shouldValidate: true });
            return;
          }
        }
      }
      if (
        !isHealthWellnessThemeName(tname) &&
        !isRetreatsThemeName(tname) &&
        !isSportThemeName(tname) &&
        leaf.parent_id
      ) {
        const { data: siblings } = await supabase
          .from("event_types")
          .select("id, name, theme_id, parent_id")
          .eq("parent_id", leaf.parent_id)
          .order("name");
        if (cancelled) return;
        setSubEventTypes(siblings ?? []);
        setValue("type", String(leaf.parent_id), { shouldValidate: true });
        setValue("subType", String(leaf.id), { shouldValidate: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    selectedThemeId,
    eventThemes,
    hwHierarchy,
    retreatHierarchy,
    sportingDirectory,
    setValue,
  ]);

  useEffect(() => {
    if (searchParams.get("subTypeId")) return;
    const subName = searchParams.get("subType");
    if (!subName || !selectedThemeId) return;

    const tname = eventThemes.find((x) => x.id === selectedThemeId)?.name ?? "";
    if (isHealthWellnessThemeName(tname) && hwHierarchy) {
      for (const k of hwHierarchy.orderedCategoryKeys) {
        const leaf = (hwHierarchy.groups[k] ?? []).find((x) => x.name === subName);
        const pid = hwHierarchy.parentIds[k];
        if (leaf && pid) {
          setHwCategoryKey(k);
          setValue("type", String(pid));
          setValue("subType", String(leaf.id));
          return;
        }
      }
    }
    if (isRetreatsThemeName(tname) && retreatHierarchy) {
      for (const branch of Object.keys(retreatHierarchy.typesByBranch)) {
        const leaf = (retreatHierarchy.typesByBranch[branch] ?? []).find((x) => x.name === subName);
        const rid = retreatHierarchy.rootIdByBranch[branch];
        if (leaf && rid) {
          setRetreatBranchLabel(branch);
          setValue("type", String(rid));
          setValue("subType", String(leaf.id));
          return;
        }
      }
    }
    if (isSportThemeName(tname) && sportingDirectory) {
      for (const key of Object.keys(sportingDirectory)) {
        const grp = sportingDirectory[key];
        if (!grp) continue;
        const leaf = (grp.types ?? []).find((x) => x.name === subName);
        if (leaf) {
          setSportingCategoryKey(key);
          setValue("type", String(grp.categoryId));
          setValue("subType", String(leaf.id));
          return;
        }
      }
    }
  }, [
    searchParams,
    selectedThemeId,
    eventThemes,
    hwHierarchy,
    retreatHierarchy,
    sportingDirectory,
    setValue,
  ]);

  useEffect(() => {
    const fetchEventTypes = async () => {
      if (!selectedThemeId) {
        setEventTypes([]);
        setSubEventTypes([]);
        return;
      }

      const tname = eventThemes.find((x) => x.id === selectedThemeId)?.name ?? "";
      if (isHealthWellnessThemeName(tname) || isRetreatsThemeName(tname) || isSportThemeName(tname)) {
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

      let categories = data || [];

      // Single-root-wrapper themes (e.g. Special Event): the only top-level row is a wrapper
      // around the real category rows. Unwrap it so Category dropdown shows real categories,
      // not the wrapper name, and Type dropdown gets leaf types.
      if (categories.length === 1) {
        const root = categories[0];
        const { data: children } = await supabase
          .from('event_types')
          .select('id, name, theme_id, parent_id')
          .eq('parent_id', root.id)
          .order('name');
        const childList = children ?? [];
        if (childList.length > 0) {
          // Check at least one child has grandchildren — confirms wrapper structure.
          const childIds = childList.map((c) => c.id);
          const { count: grandCount } = await supabase
            .from('event_types')
            .select('id', { count: 'exact', head: true })
            .in('parent_id', childIds);
          if ((grandCount ?? 0) > 0) {
            categories = childList;
          }
        }
      }

      setEventTypes(categories);

      if (searchParams.get("subTypeId")) {
        return;
      }

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
  }, [selectedThemeId, searchParams, setValue, eventThemes]);

  // Fetch sub-types when a parent event type is selected (only if not from URL)
  useEffect(() => {
    const fetchSubEventTypes = async () => {
      const tname = eventThemes.find((x) => x.id === selectedThemeId)?.name ?? "";
      if (isHealthWellnessThemeName(tname) || isRetreatsThemeName(tname) || isSportThemeName(tname)) {
        return;
      }

      if (searchParams.get("subTypeId")) {
        return;
      }

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
  }, [selectedEventType, searchParams, subEventTypes.length, selectedThemeId, eventThemes]);

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
        : "Check fields marked with * — budget and expected attendees are required.";

    toast({
      title: "Complete required fields",
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

    const budgetNum = parseFloat(String(data.budget).trim());
    if (Number.isNaN(budgetNum) || budgetNum <= 0) {
      toast({
        title: "Budget required",
        description: "Enter a budget greater than zero.",
        variant: "destructive",
      });
      return;
    }

    const attendeesNum = parseInt(String(data.expectedAttendees).trim(), 10);
    if (Number.isNaN(attendeesNum) || attendeesNum < 1) {
      toast({
        title: "Attendees required",
        description: "Number of attendees is required. Events depend on attendee count for planning.",
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

      const themeNum = Number(data.theme_id);
      if (!Number.isFinite(themeNum) || themeNum < 1) {
        toast({
          title: "Theme required",
          description: "Select an event theme before creating the event.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Resolve manual entry: insert a new event_type under the selected category
      let resolvedSubType = data.subType?.trim() || "";
      if (resolvedSubType === "__other__") {
        const customName = customSubTypeName.trim();
        if (!customName) {
          toast({
            title: "Event type required",
            description: "Enter your custom event type or pick one from the list.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        const parentCategoryId = parseInt(data.type?.trim() || "", 10);
        const parentRow = subEventTypes[0];
        const themeIdForInsert = parentRow?.theme_id ?? Number(data.theme_id);
        const parentIdForInsert = Number.isFinite(parentCategoryId) && parentCategoryId > 0
          ? parentCategoryId
          : parentRow?.parent_id ?? null;
        const { data: inserted, error: insertErr } = await supabase
          .from("event_types")
          .insert({ name: customName, parent_id: parentIdForInsert, theme_id: themeIdForInsert } as any)
          .select("id")
          .single();
        if (insertErr || !inserted?.id) {
          toast({
            title: "Could not save custom type",
            description: insertErr?.message || "Please try again.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
        resolvedSubType = String(inserted.id);
      }

      // Prepare event data for the new events table — subType (leaf) when set, else type
      const typeStr = (resolvedSubType || data.type?.trim() || "").trim();
      const typeId = parseInt(typeStr, 10);
      if (!Number.isFinite(typeId) || typeId < 1) {
        toast({
          title: "Event type required",
          description: "Select a category and event type (or sub-type) so we can save your plan.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      
      const entIds = selectedEntertainmentIds;
      const extSupplierIds = selectedExternalSupplierIds;
      const primaryEnt = entIds[0] ?? null;

      const eventData = {
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        type_id: typeId,
        venue: data.venue,
        location: data.location?.trim() || null,
        start_date: dateRange.from.toISOString().split('T')[0],
        end_date: dateRange.to ? dateRange.to.toISOString().split('T')[0] : null,
        budget: budgetNum,
        expected_attendees: attendeesNum,
        theme_id: themeNum,
        entertainment_id: primaryEnt,
        entertainment_ids: entIds.length ? entIds : null,
        external_supplier_ids: extSupplierIds.length ? extSupplierIds : null,
        service_vendor_id: null,
        service_vendor_ids: null,
      };

      const { data: insertedRow, error: insertError } = await supabase
        .from("events")
        .insert([eventData])
        .select("id")
        .single();

      if (insertError) {
        console.error("Error creating event:", insertError);
        toast({
          title: "Error Creating Event",
          description: plannerSafeErrorToastDescription(
            insertError,
            commentsPlannerCopy.toastGeneric,
          ),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      toast({
        title: "Event Created Successfully!",
        description: `Your event "${data.title}" has been created and saved.`,
      });

      trackEvent("event_created", { event_id: insertedRow?.id, theme_id: data.theme_id });

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
        budget: "",
        expectedAttendees: "",
        description: ""
      });
      setDateRange(undefined);
      setSubEventTypes([]);
      setEventTypes([]);
      setSelectedVenueType(null);
      setSelectedEntTypeId(null);
      setSelectedSupplierCategoryId(null);
      setSelectedEntertainmentIds([]);
      setSelectedExternalSupplierIds([]);

      // After save, everyone lands on Event Management (manage event) to review the new event — not on Browse Themes.
      navigate('/dashboard/manage-event');

    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Could not create event",
        description: plannerSafeErrorToastDescription(
          error,
          "Something went wrong while saving. Please try again, or refresh the page if this keeps happening.",
        ),
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
                    <Select
                      value={field.value != null ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select event theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventThemes.map((theme) => (
                          <SelectItem key={theme.id} value={theme.id.toString()}>
                            {sportingUiName(theme.name)}
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

              {themeHierarchyMode === "hw" && hwHierarchy && (
                <>
                  <div>
                    <Label>Category (Health &amp; Wellness) *</Label>
                    <Select
                      value={hwCategoryKey || undefined}
                      onValueChange={(k) => {
                        setHwCategoryKey(k);
                        setValue("subType", "", { shouldValidate: false });
                        clearErrors("subType");
                        const pid = hwHierarchy.parentIds[k];
                        if (pid) setValue("type", String(pid));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {hwHierarchy.orderedCategoryKeys.map((k) => {
                          const pid = hwHierarchy.parentIds[k];
                          if (!pid) return null;
                          const label = hwHierarchy.keyLabel[k] ?? k;
                          return (
                            <SelectItem key={k} value={k}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  {hwCategoryKey ? (
                    <div>
                      <Label htmlFor="subType-hw">Event type *</Label>
                      <Controller
                        name="subType"
                        control={control}
                        rules={{ required: "Event type is required" }}
                        render={({ field }) => (
                          <Select
                            value={
                              field.value != null && String(field.value).trim() !== ""
                                ? String(field.value)
                                : undefined
                            }
                            onValueChange={(id) => {
                              field.onChange(id);
                              clearErrors("subType");
                            }}
                          >
                            <SelectTrigger id="subType-hw">
                              <SelectValue placeholder="Select specific event type" />
                            </SelectTrigger>
                            <SelectContent>
                              {(hwHierarchy.groups[hwCategoryKey] ?? []).map((row) => (
                                <SelectItem key={row.id} value={String(row.id)}>
                                  {row.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  ) : null}
                </>
              )}

              {themeHierarchyMode === "retreats" && retreatHierarchy && (
                <>
                  <div>
                    <Label>Retreat branch *</Label>
                    <Select
                      value={retreatBranchLabel}
                      onValueChange={(b) => {
                        setRetreatBranchLabel(b);
                        setValue("subType", "", { shouldValidate: false });
                        clearErrors("subType");
                        const rid = retreatHierarchy.rootIdByBranch[b];
                        if (rid) setValue("type", String(rid));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(retreatHierarchy.typesByBranch).map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {retreatBranchLabel ? (
                    <div>
                      <Label htmlFor="subType-retreat">Event type *</Label>
                      <Controller
                        name="subType"
                        control={control}
                        rules={{ required: "Event type is required" }}
                        render={({ field }) => (
                          <Select
                            value={
                              field.value != null && String(field.value).trim() !== ""
                                ? String(field.value)
                                : undefined
                            }
                            onValueChange={(id) => {
                              field.onChange(id);
                              clearErrors("subType");
                            }}
                          >
                            <SelectTrigger id="subType-retreat">
                              <SelectValue placeholder="Select specific event type" />
                            </SelectTrigger>
                            <SelectContent>
                              {(retreatHierarchy.typesByBranch[retreatBranchLabel] ?? []).map((row) => (
                                <SelectItem key={row.id} value={String(row.id)}>
                                  {row.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  ) : null}
                </>
              )}

              {themeHierarchyMode === "sporting" && (
                <>
                  {sportingDirectory == null ? (
                    <p className="text-sm text-muted-foreground">Loading event categories…</p>
                  ) : (
                    <>
                      <div>
                        <Label>Event category (Sporting) *</Label>
                        <Select
                          value={sportingCategoryKey || undefined}
                          onValueChange={(key) => {
                            setSportingCategoryKey(key);
                            // Do not validate empty subType here — Radix Select would show a false
                            // "Event type is required" until the user picks the type row.
                            setValue("subType", "", { shouldValidate: false });
                            clearErrors("subType");
                            const grp = sportingDirectory[key];
                            if (grp?.categoryId != null) {
                              setValue("type", String(grp.categoryId), { shouldValidate: true });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select sporting category" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(sportingDirectory)
                              .sort((a, b) => a.localeCompare(b))
                              .map((key) => (
                                <SelectItem key={key} value={key}>
                                  {sportingTypeUiLabel(key) || key}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {sportingCategoryKey ? (
                        <div>
                          <Label htmlFor="subType-sporting">Event type *</Label>
                          <Controller
                            name="subType"
                            control={control}
                            rules={{ required: "Event type is required" }}
                            render={({ field }) => (
                              <Select
                                value={
                                  field.value != null && String(field.value).trim() !== ""
                                    ? String(field.value)
                                    : undefined
                                }
                                onValueChange={(id) => {
                                  field.onChange(id);
                                  clearErrors("subType");
                                  const grp = sportingDirectory[sportingCategoryKey];
                                  if (grp?.categoryId != null) {
                                    setValue("type", String(grp.categoryId), { shouldValidate: true });
                                  }
                                }}
                              >
                                <SelectTrigger id="subType-sporting">
                                  <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(sportingDirectory[sportingCategoryKey]?.types ?? []).map((row) => (
                                    <SelectItem key={row.id} value={String(row.id)}>
                                      {sportingTypeUiLabel(row.name) || row.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.subType && (
                            <p className="text-sm text-destructive mt-1">{errors.subType.message}</p>
                          )}
                        </div>
                      ) : null}
                      {selectedThemeId && Object.keys(sportingDirectory).length === 0 ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          {plannerToolsCopy.sportingTypesUnavailable}
                        </p>
                      ) : null}
                    </>
                  )}
                </>
              )}

              {themeHierarchyMode === "default" && (
                <>
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
                                selectedThemeId ? "Select event category" : "Select theme first"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {eventTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {sportThemeRootCategoryDisplayLabel(selectedThemeName, type.name)}
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
                    <div className="space-y-2">
                      <Label htmlFor="subType">Event Type *</Label>
                      <Controller
                        name="subType"
                        control={control}
                        rules={{ required: "Event type is required" }}
                        render={({ field }) => (
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              if (val !== "__other__") setCustomSubTypeName("");
                            }}
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
                              <SelectItem value="__other__">Other (specify)…</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {selectedSubType === "__other__" && (
                        <Input
                          placeholder="Enter your event type"
                          value={customSubTypeName}
                          onChange={(e) => setCustomSubTypeName(e.target.value)}
                          maxLength={100}
                        />
                      )}
                    </div>
                  )}

                </>
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

              {/* Entertainment and External Vendor selection moved to Manage Event / Project Management */}




              <div>
                <Label htmlFor="expectedAttendees" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of attendees *
                </Label>
                <Input
                  id="expectedAttendees"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={errors.expectedAttendees ? "true" : "false"}
                  className={errors.expectedAttendees ? "border-destructive focus-visible:ring-destructive" : ""}
                  {...register("expectedAttendees", {
                    required: "Number of attendees is required. Events depend on attendee count for planning.",
                    validate: (v) =>
                      /^\d+$/.test(String(v).trim()) && parseInt(String(v).trim(), 10) > 0
                        ? true
                        : "Number of attendees is required. Events depend on attendee count for planning.",
                  })}
                  placeholder="Number of people attending"
                />
                {errors.expectedAttendees && (
                  <p className="text-sm text-destructive mt-1">{errors.expectedAttendees.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Number of attendees is required. Events depend on attendee count for planning.
                </p>
              </div>

              <div>
                <Label htmlFor="budget" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Budget amount *
                </Label>
                <Input
                  id="budget"
                  {...register("budget", {
                    required: "Budget is required",
                    validate: (v) => {
                      const n = parseFloat(String(v).trim());
                      return (!Number.isNaN(n) && n > 0) || "Enter a budget greater than zero";
                    },
                  })}
                  onBlur={(e) => {
                    const raw = e.target.value.trim();
                    if (raw && !Number.isNaN(parseFloat(raw))) {
                      const formatted = parseFloat(raw).toFixed(2);
                      setValue("budget", formatted, { shouldValidate: true });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="Enter budget amount"
                />
                {errors.budget && (
                  <p className="text-sm text-destructive mt-1">{errors.budget.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Required: a positive budget must be set before the event can be created.
                </p>
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
              description: ""
            });
            setDateRange(undefined);
            setSubEventTypes([]);
            setEventTypes([]);
            setSelectedVenueType(null);
            setSelectedEntTypeId(null);
            setSelectedSupplierCategoryId(null);
            setSelectedEntertainmentIds([]);
            setSelectedExternalSupplierIds([]);
            
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