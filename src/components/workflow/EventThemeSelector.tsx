import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
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
  
  return "social";
};

const getThemeDescription = (category: string): string => {
  const descriptions: { [key: string]: string } = {
    celebration: "Holidays and Personal",
    social: "Great for community gatherings and social events",
    entertainment: "Ideal for festivals and entertainment events",
    business: "Professional events and corporate gatherings",
    health: "Perfect for wellness retreats, health seminars, and mindful gatherings",
  };
  return descriptions[category] || "Versatile theme for any occasion";
};

export const EventThemeSelector = ({ userType, onSelectTheme, selectedTheme }: EventThemeSelectorProps) => {
  const navigate = useNavigate();
  const [hoveredTheme, setHoveredTheme] = useState<number | null>(null);
  const [themes, setThemes] = useState<EventTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCelebrationCategories, setShowCelebrationCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [celebrationThemeId, setCelebrationThemeId] = useState<number | null>(null);

  // Fetch themes from Supabase
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('event_themes')
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

  // Fetch event types when category is selected
  useEffect(() => {
    const fetchEventTypes = async () => {
      if (!selectedCategory || !celebrationThemeId) return;

      // First, fetch the parent category ID (Holidays or Personal)
      const categoryName = selectedCategory === 'holidays' ? 'Holidays' : 'Personal';
      const { data: parentData, error: parentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('theme_id', celebrationThemeId)
        .eq('name', categoryName)
        .is('parent_id', null)
        .single();

      if (parentError || !parentData) {
        console.error('Error fetching parent category:', parentError);
        return;
      }

      // Then fetch the child event types
      const { data, error } = await supabase
        .from('event_types')
        .select('id, name, theme_id, parent_id')
        .eq('parent_id', parentData.id)
        .order('name');

      if (error) {
        console.error('Error fetching event types:', error);
        return;
      }

      console.log('Category:', categoryName, 'Parent ID:', parentData.id);
      console.log('Fetched event types:', data);
      console.log('Number of event types:', data?.length);
      setEventTypes(data || []);
    };

    fetchEventTypes();
  }, [selectedCategory, celebrationThemeId]);

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
    return themes.filter(theme => userCategories.includes(theme.category));
  };

  const relevantThemes = getRecommendedThemes();
  const otherThemes = themes.filter(theme => !relevantThemes.some(rt => rt.id === theme.id));

  const handleThemeClick = (theme: EventTheme) => {
    if (theme.name === "Celebration") {
      setCelebrationThemeId(theme.id);
      setShowCelebrationCategories(true);
    } else {
      onSelectTheme(theme.id, theme.name);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleEventTypeClick = (eventType: any) => {
    // Navigate to create event with pre-filled theme and sub-type
    navigate(`/dashboard/create-event?theme=${celebrationThemeId}&subType=${eventType.name}`);
  };

  const handleBack = () => {
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

  // Show event types when category is selected
  if (selectedCategory && eventTypes.length > 0) {
    console.log('Rendering event types, count:', eventTypes.length);
    console.log('Event types:', eventTypes);
    
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
          <h2 className="text-2xl font-bold">Choose Event Theme</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Select an event theme to unlock specialized templates, vendor recommendations, and workflow optimizations.
        </p>
      </div>

      {themes.length === 0 && !loading && (
        <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">No themes available. Please check your database configuration.</p>
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
          <p className="text-muted-foreground">
            Please add some event themes to the database to get started.
          </p>
        </div>
      )}
    </div>
  );
};