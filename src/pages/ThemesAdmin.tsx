import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Database,
  ExternalLink,
  Eye,
  Settings
} from "lucide-react";

interface ThemeData {
  [key: string]: string | string[];
}

export default function ThemesAdmin() {
  const [themesData, setThemesData] = useState<ThemeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchThemes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Themes Directory')
        .select('*');

      if (error) {
        console.error('Error fetching themes:', error);
        toast({
          title: "Error",
          description: "Failed to fetch themes data.",
          variant: "destructive",
        });
        return;
      }

      setThemesData(data || []);
    } catch (error) {
      console.error('Error in fetchThemes:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAllThemes = async () => {
    if (!confirm("Are you sure you want to delete ALL theme entries? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      const { error } = await supabase
        .from('Themes Directory')
        .delete()
        .neq('baby_shower', ''); // Delete all rows

      if (error) {
        console.error('Error deleting themes:', error);
        toast({
          title: "Error",
          description: "Failed to delete themes data.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "All theme entries have been deleted.",
      });

      await fetchThemes(); // Refresh the data
    } catch (error) {
      console.error('Error in clearAllThemes:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const renderThemeValue = (key: string, value: string | string[]) => {
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          <span className="font-medium text-sm">{key}:</span>
          <div className="flex flex-wrap gap-1">
            {value.map((item, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{key}:</span>
          <Badge variant="secondary" className="text-xs">{value}</Badge>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading themes data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Themes Directory Admin
          </h1>
          <p className="text-muted-foreground">
            Manage and clean up automatically generated theme entries
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchThemes}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open('https://supabase.com/dashboard/project/wyujrpuafpatkolwyspu/editor', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Supabase Dashboard
          </Button>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{themesData.length}</div>
            <p className="text-xs text-muted-foreground">Theme directory rows</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Theme Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {themesData.length > 0 ? Object.keys(themesData[0]).filter(k => k !== 'created_at').length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Different categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive"
              onClick={clearAllThemes}
              disabled={deleting || themesData.length === 0}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? "Deleting..." : "Clear All Themes"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> The themes shown below are auto-generated entries. 
          You can safely delete them if you want to start with a clean slate or manage themes manually.
          Deleting these won't affect your application functionality - fallback themes will be used.
        </AlertDescription>
      </Alert>

      {/* Current Data */}
      <Card>
        <CardHeader>
          <CardTitle>Current Themes Data</CardTitle>
          <CardDescription>
            Auto-generated theme entries currently in your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {themesData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No theme entries found in the database.</p>
              <p className="text-sm">The application will use fallback themes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {themesData.map((themeRow, index) => (
                <Card key={index} className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Theme Row #{index + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(themeRow)
                        .filter(([key]) => key !== 'created_at')
                        .map(([key, value]) => (
                          <div key={key}>
                            {renderThemeValue(key, value)}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Option 1: Clear Database Themes</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Use the "Clear All Themes" button above to remove all auto-generated entries. 
              Your app will use the built-in fallback themes instead.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Option 2: Manage in Supabase</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Click "Supabase Dashboard" to directly edit the database table and selectively remove or modify entries.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Option 3: Custom Theme Management</h4>
            <p className="text-sm text-muted-foreground">
              After clearing, you can build a custom theme creation interface or manually add only the themes you need.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}