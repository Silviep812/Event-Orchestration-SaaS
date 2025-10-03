import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { 
  Heart, 
  Building, 
  Cake, 
  Users, 
  Music, 
  Coffee, 
  Network,
  Search,
  Filter,
  Star,
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
  usageCount: number;
  premium: boolean;
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

interface EventThemesDirectoryProps {
  onSelectTheme: (themeId: number, themeName: string, subType?: string) => void;
  selectedTheme?: number;
  userType?: string;
}

export const EventThemesDirectory = ({ onSelectTheme, selectedTheme, userType }: EventThemesDirectoryProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPricing, setSelectedPricing] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("name");
  const [themes, setThemes] = useState<ThemeDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubTypes, setSelectedSubTypes] = useState<Record<number, string>>({});
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
  const [peacefulEventTypes, setPeacefulEventTypes] = useState<{id: number; name: string}[]>([]);
  const [spiritualEventTypes, setSpiritualEventTypes] = useState<{id: number; name: string}[]>([]);

  // Fetch themes from Supabase
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setLoading(true);
        console.log('Fetching themes from event_themes table...');
        const { data, error } = await supabase
          .from('event_themes')
          .select('id, name, description, tags, premium, created_at')
          .order('name');

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Error fetching themes:', error);
          setThemes([]);
          setLoading(false);
          return;
        }

        if (!data || data.length === 0) {
          console.log('No themes found in database');
          setThemes([]);
          setLoading(false);
          return;
        }

        // Transform Supabase data into ThemeDetails format
        const transformedThemes: ThemeDetails[] = data
          .filter(theme => theme.premium !== true)
          .map((theme) => {
            const category = getCategoryFromName(theme.name);
            const styles = getThemeStyles(category);
            console.log('Transforming theme:', theme.name, 'Category:', category, 'Styles:', styles);
            
            return {
              id: theme.id,
              name: theme.name,
              description: theme.description || getThemeDescription(category),
              category,
              tags: theme?.tags || [],
              icon: getThemeIcon(theme.name),
              color: styles.color,
              bgColor: styles.bgColor,
              usageCount: Math.floor(Math.random() * 2000) + 100, // Mock data for usage count
              premium: theme.premium,
            };
          });

        console.log('Transformed themes:', transformedThemes);
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
      // Fetch Holidays (parent_id = 2)
      const { data: holidaysData } = await supabase
        .from('event_types')
        .select('id, name')
        .eq('parent_id', 2)
        .order('name');
      
      // Fetch Personal (parent_id = 3)
      const { data: personalData } = await supabase
        .from('event_types')
        .select('id, name')
        .eq('parent_id', 3)
        .order('name');
      
      // Fetch Cultural - first find the Cultural event type under Festival
      const { data: culturalParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Cultural')
        .eq('theme_id', 4) // Festival theme
        .single();
      
      if (culturalParent) {
        // Then fetch all American cultural groups under Cultural
        const { data: culturalData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', culturalParent.id)
          .order('name');
        
        setCulturalEventTypes(culturalData || []);
        console.log('Cultural event types:', culturalData);
      }
      
      // Fetch Community - first find the Community event type under Festival
      const { data: communityParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Community')
        .eq('theme_id', 4) // Festival theme
        .single();
      
      if (communityParent) {
        // Then fetch all community groups under Community
        const { data: communityData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', communityParent.id)
          .order('name');
        
        setCommunityEventTypes(communityData || []);
        console.log('Community event types:', communityData);
      }
      
      // Fetch Artisans - first find the Artisans event type under Marketplace
      const { data: artisansParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Artisans')
        .eq('theme_id', 11) // Marketplace theme
        .single();
      
      if (artisansParent) {
        // Then fetch all artisan types under Artisans
        const { data: artisansData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', artisansParent.id)
          .order('name');
        
        setArtisanEventTypes(artisansData || []);
        console.log('Artisan event types:', artisansData);
      }
      
      // Fetch Food - first find the Food event type under Marketplace
      const { data: foodParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Food')
        .eq('theme_id', 11) // Marketplace theme
        .single();
      
      if (foodParent) {
        // Then fetch all food types under Food
        const { data: foodData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', foodParent.id)
          .order('name');
        
        setFoodEventTypes(foodData || []);
        console.log('Food event types:', foodData);
      }
      
      // Fetch Vendors - first find the Vendors event type under Marketplace
      const { data: vendorsParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Vendors')
        .eq('theme_id', 11) // Marketplace theme
        .single();
      
      if (vendorsParent) {
        // Then fetch all vendor types under Vendors
        const { data: vendorsData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', vendorsParent.id)
          .order('name');
        
        setVendorEventTypes(vendorsData || []);
        console.log('Vendor event types:', vendorsData);
      }
      
      // Fetch Vintage - first find the Vintage event type under Marketplace
      const { data: vintageParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Vintage')
        .eq('theme_id', 11) // Marketplace theme
        .single();
      
      if (vintageParent) {
        // Then fetch all vintage types under Vintage
        const { data: vintageData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', vintageParent.id)
          .order('name');
        
        setVintageEventTypes(vintageData || []);
        console.log('Vintage event types:', vintageData);
      }
      
      // Fetch Contemporary - first find the Contemporary event type under Dining
      const { data: contemporaryParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Contemporary')
        .eq('theme_id', 7) // Dining theme
        .single();
      
      if (contemporaryParent) {
        // Then fetch all contemporary types under Contemporary
        const { data: contemporaryData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', contemporaryParent.id)
          .order('name');
        
        setContemporaryEventTypes(contemporaryData || []);
        console.log('Contemporary event types:', contemporaryData);
      }
      
      // Fetch Buffet - first find the Buffet event type under Dining
      console.log('Fetching Buffet parent...');
      const { data: buffetParent, error: buffetParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Buffet')
        .eq('theme_id', 7) // Dining theme
        .single();
      
      console.log('Buffet parent result:', { buffetParent, buffetParentError });
      
      if (buffetParent) {
        // Then fetch all buffet types under Buffet
        console.log('Fetching buffet types for parent id:', buffetParent.id);
        const { data: buffetData, error: buffetDataError } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', buffetParent.id)
          .order('name');
        
        console.log('Buffet data result:', { buffetData, buffetDataError });
        setBuffetEventTypes(buffetData || []);
        console.log('Buffet event types set to:', buffetData);
      } else {
        console.error('Buffet parent not found or error:', buffetParentError);
      }

      // Fetch Fine Dining - first find the Fine Dining event type under Dining
      console.log('Fetching Fine Dining parent...');
      const { data: fineDiningParent, error: fineDiningParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Fine Dining')
        .eq('theme_id', 7) // Dining theme
        .single();
      
      console.log('Fine Dining parent result:', { fineDiningParent, fineDiningParentError });
      
      if (fineDiningParent) {
        // Then fetch all fine dining types under Fine Dining
        console.log('Fetching fine dining types for parent id:', fineDiningParent.id);
        const { data: fineDiningData, error: fineDiningDataError } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', fineDiningParent.id)
          .order('name');
        
        console.log('Fine Dining data result:', { fineDiningData, fineDiningDataError });
        setFineDiningEventTypes(fineDiningData || []);
        console.log('Fine Dining event types set to:', fineDiningData);
      } else {
        console.error('Fine Dining parent not found or error:', fineDiningParentError);
      }

      // Fetch Peaceful - first find the Peaceful event type under Health and Wellness
      console.log('Fetching Peaceful parent...');
      const { data: peacefulParent, error: peacefulParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Peaceful')
        .eq('parent_id', 16) // Health & Wellness parent
        .single();
      
      console.log('Peaceful parent result:', { peacefulParent, peacefulParentError });
      
      if (peacefulParent) {
        // Then fetch all peaceful types under Peaceful
        console.log('Fetching peaceful types for parent id:', peacefulParent.id);
        const { data: peacefulData, error: peacefulDataError } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', peacefulParent.id)
          .order('name');
        
        console.log('Peaceful data result:', { peacefulData, peacefulDataError });
        setPeacefulEventTypes(peacefulData || []);
        console.log('Peaceful event types set to:', peacefulData);
      } else {
        console.error('Peaceful parent not found or error:', peacefulParentError);
      }

      // Fetch Spiritual - first find the Spiritual event type under Health and Wellness
      console.log('Fetching Spiritual parent...');
      const { data: spiritualParent, error: spiritualParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Spiritual')
        .eq('parent_id', 16) // Health & Wellness parent
        .single();
      
      console.log('Spiritual parent result:', { spiritualParent, spiritualParentError });
      
      if (spiritualParent) {
        // Then fetch all spiritual types under Spiritual
        console.log('Fetching spiritual types for parent id:', spiritualParent.id);
        const { data: spiritualData, error: spiritualDataError } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', spiritualParent.id)
          .order('name');
        
        console.log('Spiritual data result:', { spiritualData, spiritualDataError });
        setSpiritualEventTypes(spiritualData || []);
        console.log('Spiritual event types set to:', spiritualData);
      } else {
        console.error('Spiritual parent not found or error:', spiritualParentError);
      }
      
      setHolidayEventTypes(holidaysData || []);
      setPersonalEventTypes(personalData || []);
      console.log('Holiday event types:', holidaysData);
      console.log('Personal event types:', personalData);
    };

    fetchEventTypes();
  }, []);

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
    };
    return descriptions[category] || "Versatile theme for any occasion";
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(themes.map(theme => theme.category)));
    return ["all", ...cats];
  }, [themes]);

  const filteredAndSortedThemes = useMemo(() => {
    let filtered = themes.filter(theme => {
      const matchesSearch = theme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           theme.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           theme.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || theme.category === selectedCategory;
      const matchesPricing = selectedPricing === "all" || 
                            (selectedPricing === "free" && (theme.premium === false || theme.premium == null)) ||
                            (selectedPricing === "premium" && theme.premium == true);
      
      return matchesSearch && matchesCategory && matchesPricing;
    });

    // Sort themes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "usage":
          return b.usageCount - a.usageCount;
        default: // popular
          return b.usageCount - a.usageCount;
      }
    });

    return filtered;
  }, [themes, searchTerm, selectedCategory, selectedPricing, sortBy]);

  const recommendedThemes = useMemo(() => {
    if (!userType || themes.length === 0) return [];
    
    // Define recommended themes based on user requirements
    const recommendedThemeNames = [
      'marketplace', 'celebration theme', 'celebration', 'festival theme', 'festival', 'holiday party'
    ];
    
    // Filter themes that match recommended names
    const recommended = themes.filter(theme => 
      recommendedThemeNames.some(recName => 
        theme.name.toLowerCase().includes(recName.toLowerCase()) ||
        theme.id.toString().toLowerCase().includes(recName.toLowerCase())
      )
    );
    
    return recommended.length > 0 ? recommended : themes.slice().sort((a, b) => b.usageCount - a.usageCount).slice(0, 3);
  }, [userType, themes]);

  // Exclude recommended themes from the "All Themes" list to avoid duplicates
  const recommendedIds = useMemo(() => new Set(recommendedThemes.map((t) => t.id)), [recommendedThemes]);
  const nonRecommendedThemes = useMemo(
    () => filteredAndSortedThemes.filter((t) => !recommendedIds.has(t.id)),
    [filteredAndSortedThemes, recommendedIds]
  );

  const ThemeCard = ({ theme, isRecommended = false }: { theme: ThemeDetails; isRecommended?: boolean }) => {
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
                      {isRecommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                      {theme.premium == true && <Badge variant="outline" className="text-xs">Premium</Badge>}
                    </h3>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {theme.tags.map((tag, index) => {
                      // Special handling for Holidays tag in Celebration theme
                      if (theme.name === "Celebration" && tag === "Holidays") {
                        return (
                          <Popover key={index}>
                            <PopoverTrigger asChild>
                              <button className="inline-flex items-center gap-1">
                                <Badge 
                                  variant="outline" 
                                  className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                                >
                                  {tag}
                                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                                </Badge>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 bg-background border shadow-lg z-50 max-h-96 overflow-y-auto">
                              <div className="space-y-1">
                                {holidayEventTypes.map((holiday) => (
                                  <button
                                    key={holiday.id}
                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => {
                                      setSelectedSubTypes(prev => ({ ...prev, [theme.id]: holiday.name }));
                                      onSelectTheme(theme.id, theme.name, holiday.name);
                                      console.log("Selected holiday type:", holiday.name);
                                    }}
                                  >
                                    {holiday.name}
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                      );
                    }

                    // Special handling for Personal tag in Celebration theme
                    if (theme.name === "Celebration" && tag === "Personal") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 bg-background border shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="space-y-1">
                              {personalEventTypes.map((personal) => (
                                <button
                                  key={personal.id}
                                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                  onClick={() => {
                                    setSelectedSubTypes(prev => ({ ...prev, [theme.id]: personal.name }));
                                    onSelectTheme(theme.id, theme.name, personal.name);
                                    console.log("Selected personal type:", personal.name);
                                  }}
                                >
                                  {personal.name}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Cultural tag in Festival theme
                    if (theme.name === "Festival" && tag === "Cultural") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 bg-background border shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="space-y-1">
                              {culturalEventTypes.map((cultural) => (
                                <button
                                  key={cultural.id}
                                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                  onClick={() => {
                                    setSelectedSubTypes(prev => ({ ...prev, [theme.id]: cultural.name }));
                                    onSelectTheme(theme.id, theme.name, cultural.name);
                                    console.log("Selected cultural type:", cultural.name);
                                  }}
                                >
                                  {cultural.name}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Community tag in Festival theme
                    if (theme.name === "Festival" && tag === "Community") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 bg-background border shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="space-y-1">
                              {communityEventTypes.map((community) => (
                                <button
                                  key={community.id}
                                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                  onClick={() => {
                                    setSelectedSubTypes(prev => ({ ...prev, [theme.id]: community.name }));
                                    onSelectTheme(theme.id, theme.name, community.name);
                                    console.log("Selected community type:", community.name);
                                  }}
                                >
                                  {community.name}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Artisans tag in Marketplace theme
                    if (theme.name === "Marketplace" && tag === "Artisans") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 bg-background border shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="space-y-1">
                              {artisanEventTypes.map((artisan) => (
                                <button
                                  key={artisan.id}
                                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                  onClick={() => {
                                    setSelectedSubTypes(prev => ({ ...prev, [theme.id]: artisan.name }));
                                    onSelectTheme(theme.id, theme.name, artisan.name);
                                    console.log("Selected artisan type:", artisan.name);
                                  }}
                                >
                                  {artisan.name}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Food tag in Marketplace theme
                    if (theme.name === "Marketplace" && tag === "Food") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 bg-background border shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="space-y-1">
                              {foodEventTypes.map((food) => (
                                <button
                                  key={food.id}
                                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                  onClick={() => {
                                    setSelectedSubTypes(prev => ({ ...prev, [theme.id]: food.name }));
                                    onSelectTheme(theme.id, theme.name, food.name);
                                    console.log("Selected food type:", food.name);
                                  }}
                                >
                                  {food.name}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Vendors tag in Marketplace theme
                    if (theme.name === "Marketplace" && tag === "Vendors") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 bg-background border shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="space-y-1">
                              {vendorEventTypes.map((vendor) => (
                                <button
                                  key={vendor.id}
                                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                  onClick={() => {
                                    setSelectedSubTypes(prev => ({ ...prev, [theme.id]: vendor.name }));
                                    onSelectTheme(theme.id, theme.name, vendor.name);
                                    console.log("Selected vendor type:", vendor.name);
                                  }}
                                >
                                  {vendor.name}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Vintage tag in Marketplace theme
                    if (theme.name === "Marketplace" && tag === "Vintage") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 bg-background border shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="space-y-1">
                              {vintageEventTypes.map((vintage) => (
                                <button
                                  key={vintage.id}
                                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                  onClick={() => {
                                    setSelectedSubTypes(prev => ({ ...prev, [theme.id]: vintage.name }));
                                    onSelectTheme(theme.id, theme.name, vintage.name);
                                    console.log("Selected vintage type:", vintage.name);
                                  }}
                                >
                                  {vintage.name}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Contemporary tag in Dining theme
                    if (theme.name === "Dining" && tag === "Contemporary") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2 bg-background border shadow-lg z-50 max-h-96 overflow-y-auto">
                            <div className="space-y-1">
                              {contemporaryEventTypes.map((contemporary) => (
                                <button
                                  key={contemporary.id}
                                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                  onClick={() => {
                                    setSelectedSubTypes(prev => ({ ...prev, [theme.id]: contemporary.name }));
                                    onSelectTheme(theme.id, theme.name, contemporary.name);
                                    console.log("Selected contemporary type:", contemporary.name);
                                  }}
                                >
                                  {contemporary.name}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Buffet tag in Dining theme
                    if (theme.name === "Dining" && tag === "Buffet") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-56 p-2 bg-popover border shadow-lg max-h-96 overflow-y-auto"
                            style={{ zIndex: 9999 }}
                            sideOffset={5}
                          >
                            <div className="space-y-1">
                              {buffetEventTypes.length > 0 ? (
                                buffetEventTypes.map((buffet) => (
                                  <button
                                    key={buffet.id}
                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => {
                                      setSelectedSubTypes(prev => ({ ...prev, [theme.id]: buffet.name }));
                                      onSelectTheme(theme.id, theme.name, buffet.name);
                                      console.log("Selected buffet type:", buffet.name);
                                    }}
                                  >
                                    {buffet.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Fine Dining tag in Dining theme
                    if (theme.name === "Dining" && tag === "Fine Dining") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
                                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-56 p-2 bg-popover border shadow-lg max-h-96 overflow-y-auto"
                            style={{ zIndex: 9999 }}
                            sideOffset={5}
                          >
                            <div className="space-y-1">
                              {fineDiningEventTypes.length > 0 ? (
                                fineDiningEventTypes.map((fineDining) => (
                                  <button
                                    key={fineDining.id}
                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => {
                                      setSelectedSubTypes(prev => ({ ...prev, [theme.id]: fineDining.name }));
                                      onSelectTheme(theme.id, theme.name, fineDining.name);
                                      console.log("Selected fine dining type:", fineDining.name);
                                    }}
                                  >
                                    {fineDining.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Peaceful tag in Health and Wellness theme (LIST VIEW)
                    if (theme.name === "Health and Wellness" && tag === "Peaceful") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
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
                              {peacefulEventTypes.length > 0 ? (
                                peacefulEventTypes.map((peaceful) => (
                                  <button
                                    key={peaceful.id}
                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => {
                                      setSelectedSubTypes(prev => ({ ...prev, [theme.id]: peaceful.name }));
                                      onSelectTheme(theme.id, theme.name, peaceful.name);
                                      console.log("Selected peaceful type:", peaceful.name);
                                    }}
                                  >
                                    {peaceful.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }

                    // Special handling for Spiritual tag in Health and Wellness theme (LIST VIEW)
                    if (theme.name === "Health and Wellness" && tag === "Spiritual") {
                      return (
                        <Popover key={index}>
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1">
                              <Badge 
                                variant="outline" 
                                className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                              >
                                {tag}
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
                              {spiritualEventTypes.length > 0 ? (
                                spiritualEventTypes.map((spiritual) => (
                                  <button
                                    key={spiritual.id}
                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                                    onClick={() => {
                                      setSelectedSubTypes(prev => ({ ...prev, [theme.id]: spiritual.name }));
                                      onSelectTheme(theme.id, theme.name, spiritual.name);
                                      console.log("Selected spiritual type:", spiritual.name);
                                    }}
                                  >
                                    {spiritual.name}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      );
                    }
                    
                    return (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    );
            })}
          </div>
          </div>
          </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onSelectTheme(theme.id, theme.name, currentSubType)}
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
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
          
          <div className="space-y-2">
            <CardTitle className="text-lg">{theme.name}</CardTitle>
            <CardDescription className="text-sm">{theme.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <div className="flex flex-wrap gap-1">
          {theme.tags.map((tag, index) => {
            // Special handling for Peaceful tag in Health and Wellness theme (GRID VIEW)
            if (theme.name === "Health and Wellness" && tag === "Peaceful") {
              return (
                <Popover key={index}>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center gap-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                      >
                        {tag}
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
                      {peacefulEventTypes.length > 0 ? (
                        peacefulEventTypes.map((peaceful) => (
                          <button
                            key={peaceful.id}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => {
                              setSelectedSubTypes(prev => ({ ...prev, [theme.id]: peaceful.name }));
                              onSelectTheme(theme.id, theme.name, peaceful.name);
                              console.log("Selected peaceful type:", peaceful.name);
                            }}
                          >
                            {peaceful.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }

            // Special handling for Spiritual tag in Health and Wellness theme (GRID VIEW)
            if (theme.name === "Health and Wellness" && tag === "Spiritual") {
              return (
                <Popover key={index}>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center gap-1">
                      <Badge 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                      >
                        {tag}
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
                      {spiritualEventTypes.length > 0 ? (
                        spiritualEventTypes.map((spiritual) => (
                          <button
                            key={spiritual.id}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => {
                              setSelectedSubTypes(prev => ({ ...prev, [theme.id]: spiritual.name }));
                              onSelectTheme(theme.id, theme.name, spiritual.name);
                              console.log("Selected spiritual type:", spiritual.name);
                            }}
                          >
                            {spiritual.name}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              );
            }
            
            return (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            );
          })}
        </div>
        
        <Button 
          className="w-full"
          variant={isSelected ? "default" : "outline"}
          onClick={() => onSelectTheme(theme.id, theme.name, currentSubType)}
        >
          {isSelected ? "Selected" : "Select Theme"}
        </Button>
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

  // Add debug info
  console.log('Themes loaded:', themes.length);
  console.log('Filtered themes:', filteredAndSortedThemes.length);
  console.log('Loading state:', loading);

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      {themes.length === 0 && !loading && (
        <div className="text-center p-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">Debug: No themes loaded from database. Check console for details.</p>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Palette className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Event Themes Directory</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Browse our comprehensive collection of event themes. Each theme comes with specialized features and styling options.
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search themes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedPricing}
              onChange={(e) => setSelectedPricing(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="all">All Pricing</option>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredAndSortedThemes.length} themes found
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Themes */}
      {recommendedThemes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Recommended for You
          </h3>
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-4"
          }>
            {recommendedThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} isRecommended />
            ))}
          </div>
        </div>
      )}

      {/* All Themes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">All Themes</h3>
        <div className={viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
          : "space-y-4"
        }>
          {nonRecommendedThemes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>
      </div>

      {nonRecommendedThemes.length === 0 && recommendedThemes.length === 0 && (
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
  );
};