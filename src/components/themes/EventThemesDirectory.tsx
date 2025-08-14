import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  List
} from "lucide-react";

interface ThemeDetails {
  id: string;
  name: string;
  description: string;
  detailedDescription: string;
  icon: any;
  category: string;
  color: string;
  bgColor: string;
  tags: string[];
  popularWith: string[];
  features: string[];
  colorPalette: string[];
  pricing: "free" | "premium";
  rating: number;
  usageCount: number;
  imageUrl?: string;
  templates: number;
  vendors: number;
}

const themeDirectory: ThemeDetails[] = [
  {
    id: "wedding",
    name: "Wedding & Romance",
    description: "Elegant celebrations of love and commitment",
    detailedDescription: "Create unforgettable romantic celebrations with our comprehensive wedding theme package. Features elegant color schemes, romantic decorations, and sophisticated vendor partnerships.",
    icon: Heart,
    category: "celebration",
    color: "text-theme-wedding",
    bgColor: "bg-theme-wedding",
    tags: ["Elegant", "Romantic", "Formal", "Traditional", "Luxurious"],
    popularWith: ["professional-planner", "venue-owner"],
    features: ["Bridal Suites", "Ceremony Layouts", "Reception Planning", "Vendor Network"],
    colorPalette: ["#FFE4E1", "#FFC0CB", "#DDA0DD", "#B19CD9"],
    pricing: "premium",
    rating: 4.9,
    usageCount: 2847,
    templates: 25,
    vendors: 156
  },
  {
    id: "corporate",
    name: "Corporate & Business",
    description: "Professional networking and business events",
    detailedDescription: "Streamline your corporate events with professional themes designed for business excellence. Includes networking layouts, presentation setups, and executive catering options.",
    icon: Building,
    category: "business",
    color: "text-theme-corporate", 
    bgColor: "bg-theme-corporate",
    tags: ["Professional", "Networking", "Formal", "Strategic", "Executive"],
    popularWith: ["professional-planner", "hospitality-owner"],
    features: ["Conference Rooms", "Networking Spaces", "AV Integration", "Corporate Catering"],
    colorPalette: ["#4A90E2", "#7B8794", "#2C3E50", "#34495E"],
    pricing: "free",
    rating: 4.7,
    usageCount: 1923,
    templates: 18,
    vendors: 89
  },
  {
    id: "birthday",
    name: "Birthday & Celebrations",
    description: "Personal milestones and joyful celebrations",
    detailedDescription: "Make every birthday magical with our vibrant celebration themes. Perfect for all ages with customizable decorations, entertainment options, and memorable experiences.",
    icon: Cake,
    category: "celebration",
    color: "text-theme-birthday",
    bgColor: "bg-theme-birthday",
    tags: ["Fun", "Personal", "Colorful", "Memorable", "Festive"],
    popularWith: ["social-organizer", "venue-owner"],
    features: ["Age-Specific Themes", "Entertainment Packages", "Custom Decorations", "Photo Booths"],
    colorPalette: ["#FFD700", "#FF69B4", "#00CED1", "#32CD32"],
    pricing: "free",
    rating: 4.8,
    usageCount: 3156,
    templates: 32,
    vendors: 78
  },
  {
    id: "conference",
    name: "Conference & Summit",
    description: "Educational and industry-focused gatherings",
    detailedDescription: "Host impactful conferences and summits with our comprehensive event management theme. Includes speaker management, breakout sessions, and educational resource coordination.",
    icon: Users,
    category: "business",
    color: "text-theme-conference",
    bgColor: "bg-theme-conference",
    tags: ["Educational", "Professional", "Informative", "Strategic", "Knowledge"],
    popularWith: ["professional-planner", "hospitality-owner"],
    features: ["Speaker Management", "Breakout Rooms", "Live Streaming", "Educational Materials"],
    colorPalette: ["#2E4A62", "#5D737E", "#8B9DC3", "#DFE3EE"],
    pricing: "premium",
    rating: 4.6,
    usageCount: 892,
    templates: 15,
    vendors: 45
  },
  {
    id: "festival",
    name: "Festival & Entertainment",
    description: "Large-scale entertainment and cultural events",
    detailedDescription: "Create spectacular festivals and entertainment events with our dynamic theme package. Features stage management, vendor coordination, and crowd control solutions.",
    icon: Music,
    category: "entertainment",
    color: "text-theme-festival",
    bgColor: "bg-theme-festival",
    tags: ["Energetic", "Cultural", "Entertainment", "Large-scale", "Dynamic"],
    popularWith: ["professional-planner", "venue-owner"],
    features: ["Stage Management", "Vendor Villages", "Security Planning", "Crowd Control"],
    colorPalette: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"],
    pricing: "premium",
    rating: 4.5,
    usageCount: 567,
    templates: 12,
    vendors: 234
  },
  {
    id: "social",
    name: "Social & Community",
    description: "Community gatherings and social meetups",
    detailedDescription: "Foster community connections with our welcoming social event themes. Perfect for meetups, community gatherings, and inclusive social events.",
    icon: Coffee,
    category: "social",
    color: "text-theme-social",
    bgColor: "bg-theme-social",
    tags: ["Community", "Casual", "Friendly", "Inclusive", "Relaxed"],
    popularWith: ["social-organizer", "hospitality-owner"],
    features: ["Community Spaces", "Casual Dining", "Activity Areas", "Inclusive Design"],
    colorPalette: ["#8BC34A", "#FFC107", "#FF9800", "#795548"],
    pricing: "free",
    rating: 4.7,
    usageCount: 2234,
    templates: 22,
    vendors: 67
  },
  {
    id: "networking",
    name: "Networking & Mixers",
    description: "Professional connections and industry mixers",
    detailedDescription: "Maximize professional networking opportunities with our specialized mixer themes. Features connection facilitation, industry-specific setups, and relationship building tools.",
    icon: Network,
    category: "business",
    color: "text-theme-networking",
    bgColor: "bg-theme-networking",
    tags: ["Professional", "Connections", "Interactive", "Growth", "Industry"],
    popularWith: ["professional-planner", "hospitality-owner"],
    features: ["Connection Tools", "Industry Setups", "Interactive Spaces", "Contact Exchange"],
    colorPalette: ["#17A2B8", "#6F42C1", "#E83E8C", "#20C997"],
    pricing: "free",
    rating: 4.4,
    usageCount: 1445,
    templates: 19,
    vendors: 92
  }
];

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
  const [sortBy, setSortBy] = useState("popular");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(themeDirectory.map(theme => theme.category)));
    return ["all", ...cats];
  }, []);

  const filteredAndSortedThemes = useMemo(() => {
    let filtered = themeDirectory.filter(theme => {
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
  }, [searchTerm, selectedCategory, selectedPricing, sortBy]);

  const recommendedThemes = useMemo(() => {
    if (!userType) return [];
    return themeDirectory.filter(theme => theme.popularWith.includes(userType));
  }, [userType]);

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
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
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

  return (
    <div className="space-y-6">
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
          {filteredAndSortedThemes.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>
      </div>

      {filteredAndSortedThemes.length === 0 && (
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