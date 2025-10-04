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
  const [rejuvenatingEventTypes, setRejuvenatingEventTypes] = useState<{id: number; name: string}[]>([]);
  const [holisticEventTypes, setHolisticEventTypes] = useState<{id: number; name: string}[]>([]);
  const [meetupCommunityEventTypes, setMeetupCommunityEventTypes] = useState<{id: number; name: string}[]>([]);
  const [meetupInclusiveEventTypes, setMeetupInclusiveEventTypes] = useState<{id: number; name: string}[]>([]);

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

        const transformedThemes: ThemeDetails[] = data
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
              usageCount: Math.floor(Math.random() * 2000) + 100,
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
      const { data: holidaysData } = await supabase
        .from('event_types')
        .select('id, name')
        .eq('parent_id', 2)
        .order('name');
      
      const { data: personalData } = await supabase
        .from('event_types')
        .select('id, name')
        .eq('parent_id', 3)
        .order('name');
      
      const { data: culturalParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Cultural')
        .eq('theme_id', 4)
        .single();
      
      if (culturalParent) {
        const { data: culturalData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', culturalParent.id)
          .order('name');
        
        setCulturalEventTypes(culturalData || []);
        console.log('Cultural event types:', culturalData);
      }
      
      const { data: communityParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Community')
        .eq('theme_id', 4)
        .single();
      
      if (communityParent) {
        const { data: communityData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', communityParent.id)
          .order('name');
        
        setCommunityEventTypes(communityData || []);
        console.log('Community event types:', communityData);
      }
      
      const { data: artisansParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Artisans')
        .eq('theme_id', 11)
        .single();
      
      if (artisansParent) {
        const { data: artisansData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', artisansParent.id)
          .order('name');
        
        setArtisanEventTypes(artisansData || []);
        console.log('Artisan event types:', artisansData);
      }
      
      const { data: foodParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Food')
        .eq('theme_id', 11)
        .single();
      
      if (foodParent) {
        const { data: foodData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', foodParent.id)
          .order('name');
        
        setFoodEventTypes(foodData || []);
        console.log('Food event types:', foodData);
      }
      
      const { data: vendorsParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Vendors')
        .eq('theme_id', 11)
        .single();
      
      if (vendorsParent) {
        const { data: vendorsData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', vendorsParent.id)
          .order('name');
        
        setVendorEventTypes(vendorsData || []);
        console.log('Vendor event types:', vendorsData);
      }
      
      const { data: vintageParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Vintage')
        .eq('theme_id', 11)
        .single();
      
      if (vintageParent) {
        const { data: vintageData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', vintageParent.id)
          .order('name');
        
        setVintageEventTypes(vintageData || []);
        console.log('Vintage event types:', vintageData);
      }
      
      const { data: contemporaryParent } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Contemporary')
        .eq('theme_id', 7)
        .single();
      
      if (contemporaryParent) {
        const { data: contemporaryData } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', contemporaryParent.id)
          .order('name');
        
        setContemporaryEventTypes(contemporaryData || []);
        console.log('Contemporary event types:', contemporaryData);
      }
      
      console.log('Fetching Buffet parent...');
      const { data: buffetParent, error: buffetParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Buffet')
        .eq('theme_id', 7)
        .single();
      
      console.log('Buffet parent result:', { buffetParent, buffetParentError });
      
      if (buffetParent) {
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

      console.log('Fetching Fine Dining parent...');
      const { data: fineDiningParent, error: fineDiningParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Fine Dining')
        .eq('theme_id', 7)
        .single();
      
      console.log('Fine Dining parent result:', { fineDiningParent, fineDiningParentError });
      
      if (fineDiningParent) {
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

      console.log('Fetching Peaceful parent...');
      const { data: peacefulParent, error: peacefulParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Peaceful')
        .eq('parent_id', 16)
        .eq('theme_id', 8)
        .single();
      
      console.log('Peaceful parent result:', { peacefulParent, peacefulParentError });
      
      if (peacefulParent) {
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

      console.log('Fetching Spiritual parent...');
      const { data: spiritualParent, error: spiritualParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Spiritual')
        .eq('parent_id', 16)
        .eq('theme_id', 8)
        .single();
      
      console.log('Spiritual parent result:', { spiritualParent, spiritualParentError });
      
      if (spiritualParent) {
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

      console.log('Fetching Rejuvenating parent...');
      const { data: rejuvenatingParent, error: rejuvenatingParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Rejuvenating')
        .eq('parent_id', 16)
        .eq('theme_id', 8)
        .single();
      
      console.log('Rejuvenating parent result:', { rejuvenatingParent, rejuvenatingParentError });
      
      if (rejuvenatingParent) {
        console.log('Fetching rejuvenating types for parent id:', rejuvenatingParent.id);
        const { data: rejuvenatingData, error: rejuvenatingDataError } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', rejuvenatingParent.id)
          .order('name');
        
        console.log('Rejuvenating data result:', { rejuvenatingData, rejuvenatingDataError });
        setRejuvenatingEventTypes(rejuvenatingData || []);
        console.log('Rejuvenating event types set to:', rejuvenatingData);
      } else {
        console.error('Rejuvenating parent not found or error:', rejuvenatingParentError);
      }

      console.log('Fetching Holistic parent...');
      const { data: holisticParent, error: holisticParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Holistic')
        .eq('parent_id', 16)
        .eq('theme_id', 8)
        .single();
      
      console.log('Holistic parent result:', { holisticParent, holisticParentError });
      
      if (holisticParent) {
        console.log('Fetching holistic types for parent id:', holisticParent.id);
        const { data: holisticData, error: holisticDataError } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', holisticParent.id)
          .order('name');
        
        console.log('Holistic data result:', { holisticData, holisticDataError });
        setHolisticEventTypes(holisticData || []);
        console.log('Holistic event types set to:', holisticData);
      } else {
        console.error('Holistic parent not found or error:', holisticParentError);
      }

      console.log('Fetching Meetup Community parent...');
      const { data: meetupCommunityParent, error: meetupCommunityParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Community')
        .eq('theme_id', 1)
        .is('parent_id', null)
        .single();
      
      console.log('Meetup Community parent result:', { meetupCommunityParent, meetupCommunityParentError });
      
      if (meetupCommunityParent) {
        console.log('Fetching meetup community types for parent id:', meetupCommunityParent.id);
        const { data: meetupCommunityData, error: meetupCommunityDataError } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', meetupCommunityParent.id)
          .order('name');
        
        console.log('Meetup Community data result:', { meetupCommunityData, meetupCommunityDataError });
        setMeetupCommunityEventTypes(meetupCommunityData || []);
        console.log('Meetup Community event types set to:', meetupCommunityData);
      } else {
        console.error('Meetup Community parent not found or error:', meetupCommunityParentError);
      }

      console.log('Fetching Meetup Inclusive parent...');
      const { data: meetupInclusiveParent, error: meetupInclusiveParentError } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', 'Inclusive')
        .eq('theme_id', 1)
        .is('parent_id', null)
        .single();
      
      console.log('Meetup Inclusive parent result:', { meetupInclusiveParent, meetupInclusiveParentError });
      
      if (meetupInclusiveParent) {
        console.log('Fetching meetup inclusive types for parent id:', meetupInclusiveParent.id);
        const { data: meetupInclusiveData, error: meetupInclusiveDataError } = await supabase
          .from('event_types')
          .select('id, name')
          .eq('parent_id', meetupInclusiveParent.id)
          .order('name');
        
        console.log('Meetup Inclusive data result:', { meetupInclusiveData, meetupInclusiveDataError });
        setMeetupInclusiveEventTypes(meetupInclusiveData || []);
        console.log('Meetup Inclusive event types set to:', meetupInclusiveData);
      } else {
        console.error('Meetup Inclusive parent not found or error:', meetupInclusiveParentError);
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
                           theme.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || theme.category === selectedCategory;
      const matchesPricing = selectedPricing === "all" || 
                            (selectedPricing === "free" && !theme.premium) ||
                            (selectedPricing === "premium" && theme.premium);
      
      return matchesSearch && matchesCategory && matchesPricing;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.usageCount - a.usageCount;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [themes, searchTerm, selectedCategory, selectedPricing, sortBy]);

  const recommendedThemes = useMemo(() => {
    // Hardcode recommended themes: Celebration, Festival, Marketplace
    const recommendedNames = ['Celebration', 'Festival', 'Marketplace'];
    return themes.filter(theme => 
      recommendedNames.some(name => theme.name.toLowerCase() === name.toLowerCase())
    );
  }, [themes]);

  const allThemes = useMemo(() => {
    // Show all non-recommended themes in All Themes section
    const recommendedNames = ['Celebration', 'Festival', 'Marketplace'];
    return filteredAndSortedThemes.filter(theme => 
      !recommendedNames.some(name => theme.name.toLowerCase() === name.toLowerCase())
    );
  }, [filteredAndSortedThemes]);

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
      'Health and Wellness-Peaceful': { types: peacefulEventTypes, themeName: 'Health and Wellness', tagName: 'Peaceful' },
      'Health and Wellness-Spiritual': { types: spiritualEventTypes, themeName: 'Health and Wellness', tagName: 'Spiritual' },
      'Health and Wellness-Rejuvenating': { types: rejuvenatingEventTypes, themeName: 'Health and Wellness', tagName: 'Rejuvenating' },
      'Health and Wellness-Holistic': { types: holisticEventTypes, themeName: 'Health and Wellness', tagName: 'Holistic' },
      'Meetup-Community': { types: meetupCommunityEventTypes, themeName: 'Meetup', tagName: 'Community' },
      'Meetup-Inclusive': { types: meetupInclusiveEventTypes, themeName: 'Meetup', tagName: 'Inclusive' },
    };

    const configKey = `${theme.name}-${tag}`;
    const config = dropdownConfig[configKey];

    if (config) {
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
              {config.types.length > 0 ? (
                config.types.map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => {
                      setSelectedSubTypes(prev => ({ ...prev, [theme.id]: item.name }));
                      onSelectTheme(theme.id, theme.name, item.name);
                      console.log(`Selected ${tag} type:`, item.name);
                    }}
                  >
                    {item.name}
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
  };

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
                    {theme.tags.map((tag, index) => renderTagDropdown(theme, tag, index))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onSelectTheme(theme.id, theme.name, currentSubType)}
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
                {isRecommended && <Badge variant="secondary" className="text-xs h-5 flex items-center">Recommended</Badge>}
                {theme.premium == true && <Badge variant="outline" className="text-xs h-5 flex items-center">Premium</Badge>}
              </div>
              <CardDescription className="text-sm">{theme.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          <div className="flex flex-wrap gap-1">
            {theme.tags.map((tag, index) => renderTagDropdown(theme, tag, index))}
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

  console.log('Themes loaded:', themes.length);
  console.log('Filtered themes:', filteredAndSortedThemes.length);
  console.log('Loading state:', loading);

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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search themes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 bg-background border shadow-lg z-50">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Category</h4>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Pricing</h4>
                      <select
                        value={selectedPricing}
                        onChange={(e) => setSelectedPricing(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="all">All Themes</option>
                        <option value="free">Free Only</option>
                        <option value="premium">Premium Only</option>
                      </select>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Sort By</h4>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full p-2 border rounded-md bg-background"
                      >
                        <option value="name">Name</option>
                        <option value="popular">Most Popular</option>
                      </select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

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
          </div>
        </CardContent>
      </Card>

      {recommendedThemes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-2xl font-bold">Recommended for You</h2>
          </div>
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
            {recommendedThemes.map((theme) => (
              <ThemeCard key={theme.id} theme={theme} isRecommended={true} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">All Themes</h2>
        {allThemes.length > 0 ? (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
            {allThemes.map((theme) => (
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
