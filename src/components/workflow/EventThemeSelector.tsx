import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  isHealthWellnessThemeName,
  isRetreatsThemeName,
  loadHealthWellnessEventTypeGroups,
  loadRetreatsEventTypeGroups,
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
  Palette,
  CheckCircle2,
  Loader2,
  Trophy,
  PersonStanding,
  Utensils,
  Store,
  Calendar1,
  ArrowLeft
} from "lucide-react";

interface EventTheme {
  id: number;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  tags: string[];
  category: string;
  premium: boolean;
}

interface EventThemeSelectorProps {
  userType: string;
  onSelectTheme: (themeId: number, themeName: string) => void;
  selectedTheme?: number;
  /** When set (workflow wizard), links to Manage Event for full theme, category, and type editing. */
  eventId?: string;
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

// Get category from theme name
const getCategoryFromName = (themeName: string): string => {
  const name = themeName.toLowerCase();
  
  if (name.includes('wedding') || name.includes('bridal') || name.includes('baby shower') || 
      name.includes('birthday') || name.includes('party') || name.includes('celebration')) {
    return "celebration";
  }
  if (name.includes('business') || name.includes('corporate') || name.includes('conference') || 
      name.includes('seminar') || name.includes('networking')) {
    return "business";
  }
  if (name.includes('festival') || name.includes('music') || name.includes('entertainment') || 
      name.includes('concert') || name.includes('show')) {
    return "entertainment";
  }
  if (name.includes('health') || name.includes('wellness') || name.includes('fitness') || 
      name.includes('yoga') || name.includes('spa')) {
    return "health";
  }
  if (name.includes('retreat')) {
    return "retreat";
  }
  
  return "social";
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

export const EventThemeSelector = ({ userType, onSelectTheme, selectedTheme, eventId }: EventThemeSelectorProps) => {
  const navigate = useNavigate();
  const [hoveredTheme, setHoveredTheme] = useState<number | null>(null);
  const [themes, setThemes] = useState<EventTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCelebrationCategories, setShowCelebrationCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [celebrationThemeId, setCelebrationThemeId] = useState<number | null>(null);

  const [showHwFlow, setShowHwFlow] = useState(false);
  const [hwThemeId, setHwThemeId] = useState<number | null>(null);
  const [hwHierarchy, setHwHierarchy] = useState<Awaited<
    ReturnType<typeof loadHealthWellnessEventTypeGroups>
  > | null>(null);
  const [hwPhase, setHwPhase] = useState<"cats" | "types">("cats");
  const [hwCategoryKey, setHwCategoryKey] = useState<string>("");

  const [showRetreatFlow, setShowRetreatFlow] = useState(false);
  const [retreatThemeId, setRetreatThemeId] = useState<number | null>(null);
  const [retreatHierarchy, setRetreatHierarchy] = useState<Awaited<
    ReturnType<typeof loadRetreatsEventTypeGroups>
  > | null>(null);
  const [retreatPhase, setRetreatPhase] = useState<"branch" | "types">("branch");
  const [retreatBranch, setRetreatBranch] = useState("");
  const [retreatBranchLabels, setRetreatBranchLabels] = useState<string[]>([]);

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
          return;
        }

        if (!data || data.length === 0) {
          setThemes([]);
          return;
        }

        // Transform Supabase data into EventTheme format
        const transformedThemes: EventTheme[] = data
          .filter(theme => theme.premium !== true)
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
              premium: theme.premium,
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

  // Holiday name allow-list — used to split Celebration event_types into Holidays vs Personal,
  // because the database stores them as flat rows under theme_id with parent_id = null.
  const HOLIDAY_NAMES = useMemo(
    () =>
      new Set([
        "Christmas",
        "Easter",
        "Halloween",
        "Independence Day",
        "Labor Day",
        "Martin Luther King Jr. Day",
        "Memorial Day",
        "New Year's Day",
        "Presidents' Day",
        "Thanksgiving",
        "Valentine's Day",
        "Kwanzaa",
        "Hanukkah",
      ]),
    [],
  );

  // Fetch ALL Celebration event types once the theme is opened, then partition in-memory.
  useEffect(() => {
    const fetchEventTypes = async () => {
      if (!celebrationThemeId) {
        setEventTypes([]);
        return;
      }

      const { data, error } = await supabase
        .from('event_types')
        .select('id, name, theme_id, parent_id')
        .eq('theme_id', celebrationThemeId)
        .order('name');

      if (error) {
        setEventTypes([]);
        return;
      }

      setEventTypes(data || []);
    };

    fetchEventTypes();
  }, [celebrationThemeId]);

  const celebrationTypesForCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return eventTypes.filter((t) =>
      selectedCategory === 'holidays'
        ? HOLIDAY_NAMES.has(t.name)
        : !HOLIDAY_NAMES.has(t.name),
    );
  }, [eventTypes, selectedCategory, HOLIDAY_NAMES]);


  useEffect(() => {
    loadRetreatsEventTypeGroups().then((r) => {
      setRetreatBranchLabels(Object.keys(r.typesByBranch));
    });
  }, []);

  const displayThemes = useMemo(() => {
    return themes.map((t) => {
      const tags = [...(t.tags ?? [])];
      if (isHealthWellnessThemeName(t.name)) {
        ["Peaceful", "Spiritual", "Rejuvenating", "Holistic"].forEach((x) => {
          if (!tags.includes(x)) tags.push(x);
        });
      }
      if (isRetreatsThemeName(t.name) && retreatBranchLabels.length) {
        retreatBranchLabels.forEach((b) => {
          if (!tags.includes(b)) tags.push(b);
        });
      }
      return { ...t, tags };
    });
  }, [themes, retreatBranchLabels]);

  // Define recommended themes based on user type
  const getRecommendedThemes = () => {
    const recommendedCategories: { [key: string]: string[] } = {
      'host': ['business', 'celebration'],
      'professional-planner': ['business', 'celebration'],
      'venue-owner': ['celebration', 'entertainment'],
      'hospitality-provider': ['business', 'social'],
      'social-organizer': ['social', 'celebration'],
    };
    
    const userCategories = recommendedCategories[userType] || [];
    return displayThemes.filter(theme => userCategories.includes(theme.category));
  };

  const relevantThemes = getRecommendedThemes();
  const otherThemes = displayThemes.filter(theme => !relevantThemes.some(rt => rt.id === theme.id));

  const handleThemeClick = (theme: EventTheme) => {
    if (theme.name === "Celebration") {
      setCelebrationThemeId(theme.id);
      setShowCelebrationCategories(true);
    } else if (isHealthWellnessThemeName(theme.name)) {
      setHwThemeId(theme.id);
      setShowHwFlow(true);
      setHwPhase("cats");
      setHwCategoryKey("");
      loadHealthWellnessEventTypeGroups().then(setHwHierarchy);
    } else if (isRetreatsThemeName(theme.name)) {
      setRetreatThemeId(theme.id);
      setShowRetreatFlow(true);
      setRetreatPhase("branch");
      setRetreatBranch("");
      loadRetreatsEventTypeGroups().then(setRetreatHierarchy);
    } else {
      onSelectTheme(theme.id, theme.name);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleEventTypeClick = (eventType: { id: number; name: string }) => {
    navigate(
      `/dashboard/create-event?theme=${celebrationThemeId}&subType=${encodeURIComponent(eventType.name)}&subTypeId=${eventType.id}`,
    );
  };

  const handleBack = () => {
    if (showHwFlow) {
      if (hwPhase === "types") {
        setHwPhase("cats");
        setHwCategoryKey("");
      } else {
        setShowHwFlow(false);
        setHwThemeId(null);
        setHwHierarchy(null);
      }
      return;
    }
    if (showRetreatFlow) {
      if (retreatPhase === "types") {
        setRetreatPhase("branch");
        setRetreatBranch("");
      } else {
        setShowRetreatFlow(false);
        setRetreatThemeId(null);
        setRetreatHierarchy(null);
      }
      return;
    }
    if (selectedCategory) {
      setSelectedCategory(null);
      setEventTypes([]);
    } else if (showCelebrationCategories) {
      setShowCelebrationCategories(false);
      setCelebrationThemeId(null);
    }
  };

  const ThemeCard = ({ theme, isRecommended = false }: { theme: EventTheme; isRecommended?: boolean }) => {
    const IconComponent = theme.icon;
    const isSelected = selectedTheme === theme.id;
    const isHovered = hoveredTheme === theme.id;

    return (
      <Card 
        key={theme.id}
        className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
          isSelected 
            ? 'border-primary shadow-lg' 
            : isHovered 
              ? 'border-muted-foreground/30' 
              : 'border-border'
        } ${isRecommended ? 'ring-2 ring-primary/20' : ''}`}
        onMouseEnter={() => setHoveredTheme(theme.id)}
        onMouseLeave={() => setHoveredTheme(null)}
        onClick={() => handleThemeClick(theme)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg ${theme.bgColor}/10 border border-current/20`}>
              <IconComponent className={`h-6 w-6 ${theme.color}`} />
            </div>
            <div className="flex flex-col items-end gap-1">
              {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
              {isRecommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
              {theme.premium && <Badge variant="outline" className="text-xs">Premium</Badge>}
            </div>
          </div>
          <CardTitle className="text-lg">{theme.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{theme.description}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {theme.tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <Button 
              className="w-full" 
              variant={isSelected ? "default" : "outline"}
              size="sm"
            >
              {isSelected ? "Selected" : "Select Theme"}
            </Button>
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

  if (showHwFlow && hwPhase === "types" && hwCategoryKey && hwHierarchy && hwThemeId != null) {
    const hwTypes = hwHierarchy.groups[hwCategoryKey] ?? [];
    const label = hwHierarchy.keyLabel[hwCategoryKey] ?? hwCategoryKey;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold">Health &amp; Wellness — {label}</h2>
            <p className="text-sm text-muted-foreground mt-2">Choose an event type (same structure as Browse Event Themes)</p>
          </div>
        </div>
        {hwTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">{plannerToolsCopy.workflowHwTypesEmpty}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {hwTypes.map((type) => (
              <Card
                key={type.id}
                className="cursor-pointer transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
                onClick={() =>
                  navigate(
                    `/dashboard/create-event?theme=${hwThemeId}&subType=${encodeURIComponent(type.name)}&subTypeId=${type.id}`,
                  )
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" size="sm">
                    Select &amp; Create Event
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (showHwFlow && hwPhase === "cats") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Themes
          </Button>
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold">Health &amp; Wellness — category</h2>
            <p className="text-sm text-muted-foreground mt-2">Directory → category → type</p>
          </div>
        </div>
        {!hwHierarchy ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {hwHierarchy.orderedCategoryKeys.map((k) => {
              const pid = hwHierarchy.parentIds[k];
              if (!pid) return null;
              const label = hwHierarchy.keyLabel[k] ?? k;
              return (
                <Card
                  key={k}
                  className="cursor-pointer transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
                  onClick={() => {
                    setHwCategoryKey(k);
                    setHwPhase("types");
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-xl text-center">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      Choose types
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (showRetreatFlow && retreatPhase === "branch" && !retreatHierarchy) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading retreat branches…</span>
      </div>
    );
  }

  if (showRetreatFlow && retreatPhase === "types" && retreatBranch && retreatHierarchy && retreatThemeId != null) {
    const rTypes = retreatHierarchy.typesByBranch[retreatBranch] ?? [];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold">Retreats — {retreatBranch}</h2>
            <p className="text-sm text-muted-foreground mt-2">Choose an event type</p>
          </div>
        </div>
        {rTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">{plannerToolsCopy.workflowRetreatTypesEmpty}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {rTypes.map((type) => (
              <Card
                key={type.id}
                className="cursor-pointer transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
                onClick={() =>
                  navigate(
                    `/dashboard/create-event?theme=${retreatThemeId}&subType=${encodeURIComponent(type.name)}&subTypeId=${type.id}`,
                  )
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline" size="sm">
                    Select &amp; Create Event
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (showRetreatFlow && retreatPhase === "branch" && retreatHierarchy) {
    const branches = Object.keys(retreatHierarchy.typesByBranch);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Themes
          </Button>
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold">Retreats — choose branch</h2>
            <p className="text-sm text-muted-foreground mt-2">Directory → category → type</p>
          </div>
        </div>
        {branches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">{plannerToolsCopy.workflowRetreatBranchesEmpty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {branches.map((b) => (
              <Card
                key={b}
                className="cursor-pointer transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
                onClick={() => {
                  setRetreatBranch(b);
                  setRetreatPhase("types");
                }}
              >
                <CardHeader>
                  <CardTitle className="text-xl text-center">{b}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    View types
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show event types when category is selected
  if (selectedCategory && eventTypes.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold">
              Select {selectedCategory === 'holidays' ? 'Holiday' : 'Personal'} Event
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {eventTypes.length} events available
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
          {eventTypes.map((type) => (
            <Card 
              key={type.id}
              className="cursor-pointer transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
              onClick={() => handleEventTypeClick(type)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{type.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" size="sm">
                  Select & Create Event
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show event-type grid once a Celebration sub-category has been picked.
  if (showCelebrationCategories && selectedCategory) {
    const categoryLabel = selectedCategory === 'holidays' ? 'Holidays' : 'Personal';
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold">Choose a {categoryLabel} Event</h2>
          </div>
        </div>

        {celebrationTypesForCategory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No event types found for {categoryLabel}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {celebrationTypesForCategory.map((t) => (
              <Card
                key={t.id}
                className="cursor-pointer transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
                onClick={() => handleEventTypeClick({ id: t.id, name: t.name })}
              >
                <CardHeader>
                  <CardTitle className="text-lg text-center">{t.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Select & Create Event
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show categories when Celebration theme is selected
  if (showCelebrationCategories) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Themes
          </Button>
          <div className="text-center flex-1">
            <h2 className="text-2xl font-bold">Choose Celebration Category</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card 
            className="cursor-pointer transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
            onClick={() => handleCategoryClick('holidays')}
          >
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <Calendar1 className="h-12 w-12 text-pink-600" />
              </div>
              <CardTitle className="text-xl text-center">Holidays</CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                National holidays and special occasions
              </p>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Holiday Events
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
            onClick={() => handleCategoryClick('personal')}
          >
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <Cake className="h-12 w-12 text-pink-600" />
              </div>
              <CardTitle className="text-xl text-center">Personal</CardTitle>
              <p className="text-sm text-muted-foreground text-center">
                Birthdays, anniversaries, and personal celebrations
              </p>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Personal Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Palette className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Manage Event — theme &amp; category</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Pick a starting theme for this workflow. For full event details, category, type, and vendor selections, use{" "}
          {eventId ? (
            <Link
              to={`/dashboard/manage-event?eventId=${eventId}`}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Manage Event
            </Link>
          ) : (
            <span className="font-medium text-foreground">Manage Event</span>
          )}{" "}
          (Details tab) anytime.
        </p>
      </div>

      {themes.length === 0 && !loading && (
        <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">{plannerToolsCopy.workflowThemesUnavailable}</p>
        </div>
      )}

      {relevantThemes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Recommended for You
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relevantThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} isRecommended />
            ))}
          </div>
        </div>
      )}

      {otherThemes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">All Event Themes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
          </div>
        </div>
      )}

      {themes.length === 0 && !loading && (
        <div className="text-center py-8">
          <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No themes found</h3>
          <p className="text-muted-foreground">{plannerToolsCopy.workflowThemesEmptyHint}</p>
        </div>
      )}
    </div>
  );
};