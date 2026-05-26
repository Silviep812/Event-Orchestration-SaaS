import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import {
  dedupeSportThemesForPicker,
  fetchMeetupTopLevelBranch,
  fetchThemedChildren,
  filterSportishTags,
  isSportThemeName,
  loadHealthWellnessEventTypeGroups,
  loadRetreatsEventTypeGroups,
  loadEventTypesByParentTag,
  loadReunionEventTypesByParentTag,
  loadSportingDirectoryCategoryTypes,
  type SportingCategoryGroup,
  SPORTING_THEME_V4_DESCRIPTION,
  sportingTypeUiLabel,
  sportingUiName,
} from "@/lib/themeEventTypeHierarchy";
import { plannerToolsCopy } from "@/lib/nudges";
import { 
  Heart, 
  Building, 
  Cake, 
  Users, 
  Music, 
  Coffee, 
  Network,
  Search,
  Palette,
  CheckCircle2,
  Grid3X3,
  List,
  Loader2,
  Trophy,
  PersonStanding,
  Utensils,
  Store,
  Calendar1,
  ChevronDown
} from "lucide-react";

interface ThemeDetails {
  id: number;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: any;
  color: string;
  bgColor: string;
  premium: boolean;
}

/** Coerce API values that may not be strict booleans */
function normalizePremium(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "t";
  }
  return false;
}

function themeIsPremium(theme: ThemeDetails): boolean {
  return theme.premium === true;
}

// Theme icon mapping
const getThemeIcon = (themeName: string) => {
  const iconMap: { [key: string]: any } = {
    wedding: Heart,
    'bridal shower': Heart,
    corporate: Building,
    business: Building,
    birthday: Cake,
    celebration: Cake,
    conference: Users,
    summit: Users,
    festival: Music,
    entertainment: Music,
    social: Coffee,
    community: Coffee,
    networking: Network,
    mixer: Network,
    health: Heart,
    wellness: Heart,
    meetup: PersonStanding,
    sporting: Trophy,
    reunion: PersonStanding,
    dining: Utensils,
    retreat: Heart,
    marketplace: Store,
    'special event': Calendar1,
    'health and wellness': Heart,
  };
  
  const key = Object.keys(iconMap).find(k => 
    themeName.toLowerCase().includes(k)
  );
  return iconMap[key] || Palette;
};

// Get theme styling based on category
const getThemeStyles = (category: string) => {
  const styleMap: { [key: string]: { color: string; bgColor: string } } = {
    celebration: { color: "text-pink-600", bgColor: "bg-pink-50" },
    business: { color: "text-blue-600", bgColor: "bg-blue-50" },
    entertainment: { color: "text-purple-600", bgColor: "bg-purple-50" },
    social: { color: "text-green-600", bgColor: "bg-green-50" },
    conference: { color: "text-indigo-600", bgColor: "bg-indigo-50" },
    health: { color: "text-emerald-600", bgColor: "bg-emerald-50" },
    retreat: { color: "text-teal-700", bgColor: "bg-teal-50" },
  };
  
  return styleMap[category] || { color: "text-gray-600", bgColor: "bg-gray-50" };
};

// Get category from theme name (drives filter chips + card styling; keep aligned with Browse filters)
const getCategoryFromName = (themeName: string): string => {
  const name = themeName.toLowerCase();

  if (name.includes("wedding") || name.includes("bridal") || name.includes("baby shower") ||
      name.includes("birthday") || name.includes("party") || name.includes("celebration")) {
    return "celebration";
  }
  if (name.includes("market") || name.includes("marketplace") || name.includes("vendor fair")) {
    return "business";
  }
  if (name.includes("business") || name.includes("corporate") || name.includes("conference") ||
      name.includes("seminar") || name.includes("networking")) {
    return "business";
  }
  if (isSportThemeName(themeName)) {
    return "entertainment";
  }
  if (name.includes("festival") || name.includes("music") || name.includes("entertainment") ||
      name.includes("concert") || name.includes("show") || name.includes("sporting")) {
    return "entertainment";
  }
  if (name.includes("health") || name.includes("wellness") || name.includes("fitness") ||
      name.includes("yoga") || name.includes("spa")) {
    return "health";
  }
  if (name.includes("retreat")) {
    return "retreat";
  }
  if (name.includes("dining") || name.includes("culinary") || name.includes("banquet") || name.includes("gala")) {
    return "social";
  }
  if (name.includes("meetup") || (name.includes("meet") && name.includes("up")) || name.includes("mixer")) {
    return "social";
  }

  return "social";
};

interface EventThemesDirectoryProps {
  onSelectTheme: (themeId: number, themeName: string, subType?: string, subTypeId?: number) => void;
  selectedTheme?: number;
  /** Clears the current theme selection (parent should reset `selectedTheme`). */
  onClearSelection?: () => void;
}

export const EventThemesDirectory = ({ onSelectTheme, selectedTheme, onClearSelection }: EventThemesDirectoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [themes, setThemes] = useState<ThemeDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubTypes, setSelectedSubTypes] = useState<Record<number, string>>({});
  const [selectedSubTypeIds, setSelectedSubTypeIds] = useState<Record<number, number>>({});
  const [holidayEventTypes, setHolidayEventTypes] = useState<{id: number; name: string}[]>([]);
  const [personalEventTypes, setPersonalEventTypes] = useState<{id: number; name: string}[]>([]);
  const [culturalEventTypes, setCulturalEventTypes] = useState<{id: number; name: string}[]>([]);
  const [communityEventTypes, setCommunityEventTypes] = useState<{id: number; name: string}[]>([]);
  const [artisanEventTypes, setArtisanEventTypes] = useState<{id: number; name: string}[]>([]);
  const [foodEventTypes, setFoodEventTypes] = useState<{id: number; name: string}[]>([]);
  const [vendorEventTypes, setVendorEventTypes] = useState<{id: number; name: string}[]>([]);
  const [vintageEventTypes, setVintageEventTypes] = useState<{id: number; name: string}[]>([]);
  const [contemporaryEventTypes, setContemporaryEventTypes] = useState<{id: number; name: string}[]>([]);
  const [buffetEventTypes, setBuffetEventTypes] = useState<{id: number; name: string}[]>([]);
  const [fineDiningEventTypes, setFineDiningEventTypes] = useState<{id: number; name: string}[]>([]);
  const [meetupCommunityEventTypes, setMeetupCommunityEventTypes] = useState<{id: number; name: string}[]>([]);
  const [meetupInclusiveEventTypes, setMeetupInclusiveEventTypes] = useState<{id: number; name: string}[]>([]);
  const [retreatBranchTypes, setRetreatBranchTypes] = useState<Record<string, { id: number; name: string }[]>>({});
  const [browseHwHierarchy, setBrowseHwHierarchy] = useState<Awaited<
    ReturnType<typeof loadHealthWellnessEventTypeGroups>
  > | null>(null);
  const [dynamicHierarchyByThemeId, setDynamicHierarchyByThemeId] = useState<
    Record<number, Record<string, { id: number; name: string }[] | SportingCategoryGroup>>
  >({});

  const dynEntryTypes = (
    entry: { id: number; name: string }[] | SportingCategoryGroup | undefined,
  ): { id: number; name: string }[] => {
    if (!entry) return [];
    return Array.isArray(entry) ? entry : entry.types;
  };

  useEffect(() => {
    if (selectedTheme == null) {
      setSelectedSubTypes({});
      setSelectedSubTypeIds({});
    }
  }, [selectedTheme]);

  // Fetch themes from Supabase
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('Themes Directory Catalog')
          .select('id, name, description, tags, premium, created_at')
          .order('name');

        if (error) {
          console.error('Error fetching themes:', error);
          setThemes([]);
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          setThemes([]);
          setLoading(false);
          return;
        }

        const keptIds = new Set(
          dedupeSportThemesForPicker(
            data.map((t) => ({ id: t.id, name: t.name ?? "", premium: t.premium })),
          ).map((t) => t.id),
        );
        const uniqueData = data.filter((t) => keptIds.has(t.id));

        const transformedThemes: ThemeDetails[] = uniqueData
          .map((theme) => {
            const category = getCategoryFromName(theme.name);
            const styles = getThemeStyles(category);
            return {
              id: theme.id,
              name: theme.name,
              description: theme.description || getThemeDescription(category),
              category,
              tags: theme?.tags || [],
              icon: getThemeIcon(theme.name),
              color: styles.color,
              bgColor: styles.bgColor,
              premium: normalizePremium(theme.premium),
            };
          });

        setThemes(transformedThemes);
      } catch (error) {
        console.error('Error in fetchThemes:', error);
        setThemes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchThemes();
  }, []);

  // Fetch holiday, personal, cultural, and community event types
  useEffect(() => {
    const fetchEventTypes = async () => {
      const festivalMatchers = [
        (n: string) => /festival/i.test(n),
        (n: string) => /celebration|party|special/i.test(n),
      ];
      const marketplaceMatchers = [
        (n: string) => /market/i.test(n),
        (n: string) => /marketplace|vendor fair/i.test(n),
      ];
      const diningMatchers = [
        (n: string) => /dining/i.test(n),
        (n: string) => /culinary|banquet|gala|food service/i.test(n),
      ];
      const meetupMatchers = [
        (n: string) => /meet\s*up|meetup/i.test(n),
        (n: string) => /mixer|gathering|social/i.test(n),
      ];

      const [
        holidaysRes,
        personalRes,
        culturalData,
        communityData,
        artisansData,
        foodData,
        vendorsData,
        vintageData,
        contemporaryData,
        buffetData,
        fineDiningData,
        meetupCommunityData,
        meetupInclusiveData,
        hwGroups,
        retreatGroups,
      ] = await Promise.all([
        supabase.from("event_types").select("id, name").eq("parent_id", 2).order("name"),
        supabase.from("event_types").select("id, name").eq("parent_id", 3).order("name"),
        fetchThemedChildren(festivalMatchers, 4, "Cultural"),
        fetchThemedChildren(festivalMatchers, 4, "Community"),
        fetchThemedChildren(marketplaceMatchers, 11, "Artisans"),
        fetchThemedChildren(marketplaceMatchers, 11, "Food"),
        fetchThemedChildren(marketplaceMatchers, 11, "Vendors"),
        fetchThemedChildren(marketplaceMatchers, 11, "Vintage"),
        fetchThemedChildren(diningMatchers, 7, "Contemporary"),
        fetchThemedChildren(diningMatchers, 7, "Buffet"),
        fetchThemedChildren(diningMatchers, 7, "Fine Dining"),
        fetchMeetupTopLevelBranch(meetupMatchers, 1, "Community"),
        fetchMeetupTopLevelBranch(meetupMatchers, 1, "Inclusive"),
        loadHealthWellnessEventTypeGroups(),
        loadRetreatsEventTypeGroups(),
      ]);

      setHolidayEventTypes(holidaysRes.data || []);
      setPersonalEventTypes(personalRes.data || []);
      setCulturalEventTypes(culturalData);
      setCommunityEventTypes(communityData);
      setArtisanEventTypes(artisansData);
      setFoodEventTypes(foodData);
      setVendorEventTypes(vendorsData);
      setVintageEventTypes(vintageData);
      setContemporaryEventTypes(contemporaryData);
      setBuffetEventTypes(buffetData);
      setFineDiningEventTypes(fineDiningData);
      setMeetupCommunityEventTypes(meetupCommunityData);
      setMeetupInclusiveEventTypes(meetupInclusiveData);
      setBrowseHwHierarchy(hwGroups);
      setRetreatBranchTypes(retreatGroups.typesByBranch);
    };

    fetchEventTypes();
  }, []);

  useEffect(() => {
    if (themes.length === 0) return;
    let cancelled = false;
    void (async () => {
      const next: Record<number, Record<string, any>> = {};
      for (const t of themes) {
        const n = t.name.toLowerCase();
        if (/reunion/i.test(n)) {
          next[t.id] = await loadReunionEventTypesByParentTag(t.id);
        } else if (/special event/i.test(n)) {
          next[t.id] = await loadEventTypesByParentTag(t.id);
        } else if (isSportThemeName(t.name)) {
          try {
            next[t.id] = await loadSportingDirectoryCategoryTypes(t.id);
          } catch (e) {
            console.warn("loadSportingDirectoryCategoryTypes (browse):", t.id, e);
            next[t.id] = {};
          }
        }
      }
      if (!cancelled) setDynamicHierarchyByThemeId(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [themes]);

  // Helper functions to extract theme data
  const getCategoryFromTheme = (theme: any): string => {
    if (theme.wedding) return "celebration";
    if (theme.parties) return "celebration";
    if (theme.special_event) return "celebration";
    if (theme.bridal_shower) return "celebration";
    if (theme.baby_shower) return "celebration";
    if (theme.reunion) return "social";
    if (theme.meet_up) return "social";
    if (theme.sporting) return "entertainment";
    if (theme.Festival) return "entertainment";
    if (theme.market_place) return "business";
    if (theme.Dining) return "social";
    if (theme.retreats) return "business";
    return "social";
  };

  const getThemeName = (theme: any): string => {
    const fields = ['wedding', 'parties', 'special_event', 'bridal_shower', 'baby_shower', 
                   'reunion', 'meet_up', 'sporting', 'Festival', 'market_place', 'Dining', 'retreats'];
    
    for (const field of fields) {
      if (theme[field] && theme[field] !== '') {
        return field.split('_').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    return "Custom Theme";
  };

  const getThemeDescription = (category: string): string => {
    const descriptions: { [key: string]: string } = {
      celebration: "Holidays and Personal",
      social: "Great for community gatherings and social events",
      entertainment: "Ideal for festivals and entertainment events",
      business: "Professional events and corporate gatherings",
      health: "Perfect for wellness retreats, health seminars, and mindful gatherings",
      retreat: "Corporate retreats, team building, and focused off-site experiences",
    };
    return descriptions[category] || "Versatile theme for any occasion";
  };

  /** Tags + captions for directory → category → type (Health & Wellness, Retreats, Reunion, Meetup, Sporting). */
  const displayThemes = useMemo(() => {
    return themes.map((t) => {
      const name = t.name ?? "";
      const trimmed = name.trim();
      const lower = name.toLowerCase();
      const sportTheme = isSportThemeName(name);

      let description = t.description;
      if (/reunion/i.test(lower)) {
        description = "Great for reconnecting with family and friends";
      }
      if (/meet\s*up|meetup/i.test(lower)) {
        description = "Perfect to meet like minded people for a community experience";
      }
      if (/^retreats?$/i.test(trimmed) || /^retreat\b/i.test(trimmed)) {
        description =
          "Perfect for building and strengthening personal, workplace and community relationships.";
      }
      if (/health/i.test(lower) && /wellness/i.test(lower)) {
        description = "Practice holistic health and exercises with like minded people";
      }
      if (sportTheme) {
        description = SPORTING_THEME_V4_DESCRIPTION;
      }
      if (/special event/i.test(lower)) {
        description = "Tailored gatherings that need a clear category and type";
      }

      let tags = [...(t.tags ?? [])];
      if (/health/i.test(name) && /wellness/i.test(name) && browseHwHierarchy) {
        const hwTags = browseHwHierarchy.orderedCategoryKeys.map((k) => browseHwHierarchy.keyLabel[k] ?? k);
        tags = [...new Set([...tags, ...hwTags])];
      }
      if (/^retreats?$/i.test(trimmed) || /^retreat\b/i.test(trimmed)) {
        const keys = Object.keys(retreatBranchTypes);
        if (keys.length) {
          tags = [...new Set([...tags, ...keys])];
        }
      }
      // Sporting: same category → type chip pattern as other themes (data from `dynamicHierarchyByThemeId`).
      if (sportTheme) {
        tags = filterSportishTags(tags);
      }

      const displayName = sportingUiName(t.name);

      const dynamicTags = Object.keys(dynamicHierarchyByThemeId[t.id] ?? {});
      if (/reunion|special event/i.test(lower) && dynamicTags.length > 0) {
        tags = [...new Set([...tags, ...dynamicTags])];
      }
      if (sportTheme && dynamicTags.length > 0) {
        tags = [...new Set([...tags, ...dynamicTags])];
      }

      return {
        ...t,
        name: displayName,
        description,
        tags,
        icon: getThemeIcon(displayName),
      };
    });
  }, [themes, retreatBranchTypes, browseHwHierarchy, dynamicHierarchyByThemeId]);

  const filteredAndSortedThemes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const filtered = displayThemes.filter((theme) => {
      const dyn = dynamicHierarchyByThemeId[theme.id];
      const matchesDynTypes =
        !!dyn &&
        Object.values(dyn).some((entry) =>
          dynEntryTypes(entry).some((item) => String(item.name).toLowerCase().includes(q)),
        );
      const matchesSearch =
        !q ||
        theme.name.toLowerCase().includes(q) ||
        theme.description.toLowerCase().includes(q) ||
        theme.category.toLowerCase().includes(q) ||
        (theme.tags ?? []).some((tag) => tag.toLowerCase().includes(q)) ||
        (theme.tags ?? []).some((tag) => sportingTypeUiLabel(tag).toLowerCase().includes(q)) ||
        matchesDynTypes;
      return matchesSearch;
    });
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [displayThemes, searchTerm, dynamicHierarchyByThemeId]);

  // Helper function to render dropdown for specific tags
  const renderTagDropdown = (theme: ThemeDetails, tag: string, index: number) => {
    const dropdownConfig: Record<string, { types: {id: number; name: string}[]; themeName: string; tagName: string }> = {
      'Celebration-Holidays': { types: holidayEventTypes, themeName: 'Celebration', tagName: 'Holidays' },
      'Celebration-Personal': { types: personalEventTypes, themeName: 'Celebration', tagName: 'Personal' },
      'Festival-Cultural': { types: culturalEventTypes, themeName: 'Festival', tagName: 'Cultural' },
      'Festival-Community': { types: communityEventTypes, themeName: 'Festival', tagName: 'Community' },
      'Marketplace-Artisans': { types: artisanEventTypes, themeName: 'Marketplace', tagName: 'Artisans' },
      'Marketplace-Food': { types: foodEventTypes, themeName: 'Marketplace', tagName: 'Food' },
      'Marketplace-Vendors': { types: vendorEventTypes, themeName: 'Marketplace', tagName: 'Vendors' },
      'Marketplace-Vintage': { types: vintageEventTypes, themeName: 'Marketplace', tagName: 'Vintage' },
      'Dining-Contemporary': { types: contemporaryEventTypes, themeName: 'Dining', tagName: 'Contemporary' },
      'Dining-Buffet': { types: buffetEventTypes, themeName: 'Dining', tagName: 'Buffet' },
      'Dining-Fine Dining': { types: fineDiningEventTypes, themeName: 'Dining', tagName: 'Fine Dining' },
      'Meetup-Community': { types: meetupCommunityEventTypes, themeName: 'Meetup', tagName: 'Community' },
      'Meetup-Inclusive': { types: meetupInclusiveEventTypes, themeName: 'Meetup', tagName: 'Inclusive' },
    };

    let config: { types: { id: number; name: string }[]; themeName: string; tagName: string } | undefined;

    if (
      browseHwHierarchy &&
      /health/i.test(theme.name) &&
      /wellness/i.test(theme.name)
    ) {
      const slug = browseHwHierarchy.orderedCategoryKeys.find(
        (k) => (browseHwHierarchy.keyLabel[k] ?? k) === tag,
      );
      if (slug && (browseHwHierarchy.groups[slug] ?? []).length > 0) {
        config = { types: browseHwHierarchy.groups[slug] ?? [], themeName: theme.name, tagName: tag };
      }
    }

    if (!config && /retreat/i.test(theme.name) && Object.prototype.hasOwnProperty.call(retreatBranchTypes, tag)) {
      config = { types: retreatBranchTypes[tag] ?? [], themeName: theme.name, tagName: tag };
    }

    const dyn = dynamicHierarchyByThemeId[theme.id];
    const dynTypes = dyn ? dynEntryTypes(dyn[tag]) : [];
    if (!config && dynTypes.length > 0) {
      config = { types: dynTypes, themeName: theme.name, tagName: tag };
    }

    if (!config) {
      const configKey = `${theme.name}-${tag}`;
      config = dropdownConfig[configKey];
    }

    const tagBadgeLabel =
      isSportThemeName(theme.name) ? sportingTypeUiLabel(tag) || tag : tag;

    if (config) {
      return (
        <Popover key={index}>
          <PopoverTrigger asChild>
            <button className="inline-flex items-center gap-1">
              <Badge 
                variant="outline" 
                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
              >
                {tagBadgeLabel}
                <ChevronDown className="h-4 w-4 text-foreground ml-1 flex-shrink-0" />
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-56 p-2 bg-popover border shadow-lg max-h-96 overflow-y-auto"
            style={{ zIndex: 9999 }}
            sideOffset={5}
          >
            <div className="space-y-1">
              {config.types.length > 0 ? (
                config.types.map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => {
                      setSelectedSubTypes((prev) => ({ ...prev, [theme.id]: item.name }));
                      setSelectedSubTypeIds((prev) => ({ ...prev, [theme.id]: item.id }));
                      onSelectTheme(theme.id, theme.name, item.name, item.id);
                    }}
                  >
                    {isSportThemeName(theme.name)
                      ? sportingTypeUiLabel(item.name) || item.name
                      : item.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground leading-snug">
                  {plannerToolsCopy.themeBrowseCategoryTypesEmpty}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Badge key={index} variant="outline" className="text-xs">
        {tagBadgeLabel}
      </Badge>
    );
  };

  const ThemeCard = ({ theme }: { theme: ThemeDetails }) => {
    const IconComponent = theme.icon;
    const isSelected = selectedTheme === theme.id;
    const currentSubType = selectedSubTypes[theme.id];

    if (viewMode === "list") {
      return (
        <Card className={`cursor-pointer transition-all duration-300 hover:shadow-md border-2 ${
          isSelected ? 'border-primary shadow-lg' : 'border-border'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${theme.bgColor}/10 border border-current/20`}>
                <IconComponent className={`h-8 w-8 ${theme.color}`} />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {theme.name}
                      {themeIsPremium(theme) && (
                        <Badge className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-100">
                          Premium
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {theme.tags.map((tag, index) => renderTagDropdown(theme, tag, index))}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() =>
                        onSelectTheme(theme.id, theme.name, currentSubType, selectedSubTypeIds[theme.id])
                      }
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Selected
                        </>
                      ) : (
                        "Select Theme"
                      )}
                    </Button>
                    {isSelected && onClearSelection ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => onClearSelection()}>
                        Clear selection
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Grid view
    return (
      <Card className={`cursor-pointer transition-all duration-300 hover:shadow-md border-2 ${
        isSelected ? 'border-primary shadow-lg' : 'border-border'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${theme.bgColor} border border-current/20`}>
              <IconComponent className={`h-6 w-6 ${theme.color}`} />
            </div>
            
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg leading-none">{theme.name}</CardTitle>
                {themeIsPremium(theme) && (
                  <Badge className="text-[10px] uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-100">
                    Premium
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm">{theme.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          <div className="flex flex-wrap gap-1">
            {theme.tags.map((tag, index) => renderTagDropdown(theme, tag, index))}
          </div>
          <div className="space-y-2">
            <Button
              type="button"
              className="w-full"
              variant={isSelected ? "default" : "outline"}
              onClick={() =>
                onSelectTheme(theme.id, theme.name, currentSubType, selectedSubTypeIds[theme.id])
              }
            >
              {isSelected ? "Selected" : "Select Theme"}
            </Button>
            {isSelected && onClearSelection ? (
              <Button
                type="button"
                className="w-full"
                variant="outline"
                size="sm"
                onClick={() => onClearSelection()}
              >
                Clear selection
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading themes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Browse Event Themes</CardTitle>
          <CardDescription>
            Select from our curated collection of event themes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search themes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Themes</h2>
        {filteredAndSortedThemes.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
            {filteredAndSortedThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No themes found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or browse all themes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
