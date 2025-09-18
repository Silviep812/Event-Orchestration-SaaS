import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Eye,
  Download,
  Palette,
  CheckCircle2,
  Grid3X3,
  List,
  Loader2
} from "lucide-react";

interface ThemeDetails {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: any;
  color: string;
  bgColor: string;
  rating: number;
  usageCount: number;
  pricing: "free" | "premium";
  templates: number;
  vendors: number;
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

// Get premium pricing status
const getPremiumStatus = (themeName: string): "free" | "premium" => {
  const premiumThemes = [
    'award ceremony', 'awards ceremony', 'charity gala', 'conference', 
    'seminar', 'business networking', 'product launch'
  ];
  
  return premiumThemes.some(premium => 
    themeName.toLowerCase().includes(premium.toLowerCase())
  ) ? 'premium' : 'free';
};

// Get category from database column key
const getCategoryFromKey = (key: string): string => {
  const categoryMap: { [key: string]: string } = {
    wedding: "celebration",
    bridal_shower: "celebration", 
    baby_shower: "celebration",
    parties: "celebration",
    special_event: "celebration",
    Celebration: "celebration",
    reunion: "social",
    meet_up: "social",
    Dining: "social",
    sporting: "entertainment",
    Festival: "entertainment",
    market_place: "business",
    retreats: "business",
    health_wellness: "health",
    'health and wellness': "health",
  };
  
  return categoryMap[key] || "social";
};

interface EventThemesDirectoryProps {
  onSelectTheme: (themeId: string) => void;
  selectedTheme?: string;
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

  // Fetch themes from Supabase
  useEffect(() => {
    const fetchThemes = async () => {
      try {
        setLoading(true);
        console.log('Fetching themes from Supabase...');
        const { data, error } = await supabase
          .from('Themes Directory')
          .select('*');

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
        const transformedThemes: ThemeDetails[] = [];
        
        if (data && data.length > 0) {
          const themeRow = data[0]; // Get the first (and only) row
          console.log('Processing theme row:', themeRow);
          
            // Process each column that contains theme data
            Object.entries(themeRow).forEach(([key, value]) => {
              console.log('Processing key-value pair:', key, value);
              if (key === 'created_at' || !value) {
                console.log('Skipping key:', key, 'value:', value);
                return;
              }
              
              // Filter out unwanted themes
              const excludedThemes = ['basketball games', 'football event', 'professional groups'];
              if (Array.isArray(value)) {
                value = value.filter((item: string) => 
                  !excludedThemes.some(excluded => 
                    item.toLowerCase().includes(excluded.toLowerCase())
                  )
                );
                if (value.length === 0) return;
              } else if (typeof value === 'string') {
                if (excludedThemes.some(excluded => 
                  String(value).toLowerCase().includes(excluded.toLowerCase())
                )) {
                  return;
                }
              }
            
            const category = getCategoryFromKey(key);
            const styles = getThemeStyles(category);
            
            // Handle array values (like market_place, meet_up, etc.)
            if (Array.isArray(value)) {
              value.forEach((item: string, index: number) => {
                transformedThemes.push({
                  id: `${key}-${index}`,
                  name: item,
                  description: getThemeDescription(category),
                  category,
                  tags: getThemeTagsForCategory(category),
                  icon: getThemeIcon(item),
                  color: styles.color,
                  bgColor: styles.bgColor,
                  rating: 4.0 + Math.random() * 1.0, // Random rating between 4.0-5.0
                  usageCount: Math.floor(Math.random() * 2000) + 100,
                  pricing: getPremiumStatus(item),
                  templates: Math.floor(Math.random() * 20) + 5,
                  vendors: Math.floor(Math.random() * 15) + 3,
                });
              });
            } else {
              // Handle string values
              transformedThemes.push({
                id: key,
                name: String(value),
                description: getThemeDescription(category),
                category,
                tags: getThemeTagsForCategory(category),
                icon: getThemeIcon(String(value)),
                color: styles.color,
                bgColor: styles.bgColor,
                rating: 4.0 + Math.random() * 1.0,
                usageCount: Math.floor(Math.random() * 2000) + 100,
                pricing: getPremiumStatus(String(value)),
                templates: Math.floor(Math.random() * 20) + 5,
                vendors: Math.floor(Math.random() * 15) + 3,
              });
            }
          });
        }

        console.log('Transformed themes:', transformedThemes);
        
        // Add Health and Wellness theme as it's not in the database yet
        const healthWellnessTheme: ThemeDetails = {
          id: 'health-wellness',
          name: 'Health and Wellness',
          description: 'Perfect for wellness retreats, health seminars, and mindful gatherings',
          category: 'health',
          tags: ['Wellness', 'Mindful', 'Rejuvenating', 'Holistic'],
          icon: Heart,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          rating: 4.5,
          usageCount: 850,
          pricing: 'free',
          templates: 12,
          vendors: 8,
        };
        
        transformedThemes.push(healthWellnessTheme);
        
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
      celebration: "Perfect for special occasions and memorable celebrations",
      social: "Great for community gatherings and social events",
      entertainment: "Ideal for festivals and entertainment events",
      business: "Professional events and corporate gatherings",
      health: "Perfect for wellness retreats, health seminars, and mindful gatherings",
    };
    return descriptions[category] || "Versatile theme for any occasion";
  };

  const getThemeTagsForCategory = (category: string): string[] => {
    const tagMap: { [key: string]: string[] } = {
      celebration: ["Elegant", "Festive", "Memorable", "Special"],
      social: ["Community", "Friendly", "Relaxed", "Inclusive"],
      entertainment: ["Fun", "Energetic", "Dynamic", "Exciting"],
      business: ["Professional", "Corporate", "Strategic", "Networking"],
      health: ["Wellness", "Mindful", "Rejuvenating", "Holistic"],
    };
    return tagMap[category] || ["Versatile", "Custom"];
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
      const matchesPricing = selectedPricing === "all" || theme.pricing === selectedPricing;
      
      return matchesSearch && matchesCategory && matchesPricing;
    });

    // Sort themes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "rating":
          return b.rating - a.rating;
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
      'celebration theme', 'celebration', 'festival theme', 'festival', 'holiday party'
    ];
    
    // Filter themes that match recommended names
    const recommended = themes.filter(theme => 
      recommendedThemeNames.some(recName => 
        theme.name.toLowerCase().includes(recName.toLowerCase()) ||
        theme.id.toLowerCase().includes(recName.toLowerCase())
      )
    );
    
    return recommended.length > 0 ? recommended : themes.slice().sort((a, b) => b.rating - a.rating).slice(0, 3);
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
                      {theme.pricing === "premium" && <Badge variant="outline" className="text-xs">Premium</Badge>}
                    </h3>
                    <p className="text-sm text-muted-foreground">{theme.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{theme.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{theme.usageCount} uses</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {theme.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onSelectTheme(theme.id)}
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
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
        isSelected ? 'border-primary shadow-lg' : 'border-border'
      } ${isRecommended ? 'ring-2 ring-primary/20' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg ${theme.bgColor}/10 border border-current/20`}>
              <IconComponent className={`h-6 w-6 ${theme.color}`} />
            </div>
            <div className="flex flex-col items-end gap-1">
              {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
              {isRecommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
              {theme.pricing === "premium" && <Badge variant="outline" className="text-xs">Premium</Badge>}
            </div>
          </div>
          
          <div className="space-y-2">
            <CardTitle className="text-lg">{theme.name}</CardTitle>
            <CardDescription className="text-sm">{theme.description}</CardDescription>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{theme.rating}</span>
              </div>
              <span>{theme.usageCount} uses</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          <div className="flex flex-wrap gap-1">
            {theme.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span>{theme.templates} templates</span>
            <span>{theme.vendors} vendors</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1"
              variant={isSelected ? "default" : "outline"}
              onClick={() => onSelectTheme(theme.id)}
            >
              {isSelected ? "Selected" : "Select"}
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
          Browse our comprehensive collection of event themes. Each theme includes templates, vendor networks, and specialized features.
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="popular">Most Popular</option>
              <option value="name">Name</option>
              <option value="rating">Highest Rated</option>
              <option value="usage">Most Used</option>
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
            Recommended for Your Role
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