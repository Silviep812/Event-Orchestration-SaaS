import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface WorkflowData {
  id?: string;
  workflow_type_id?: number;
  user_id: string;
  theme_id?: number;
  hospitality_id?: string;
  venue_id?: string;
  supplier_id?: string;
  serv_vendor_sup_id?: string;
  serv_vendor_rent_id?: string;
  // Legacy JSONB fields (to be deprecated)
  theme_name?: string;
  hospitality_selection?: any;
  venue_selection?: any;
  vendor_selection?: any;
  service_selection?: any;
  supplier_selection?: any;
}

export const useWorkflow = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Map user type strings to workflow_type_ids
  const getUserTypeId = (userType: string): number => {
    switch (userType) {
      case 'social-organizer': return 1;
      case 'professional-planner': return 2;
      case 'hospitality-owner': return 3;
      case 'venue-owner': return 4;
      default: return 1;
    }
  };

  const saveWorkflowType = async (userType: string) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      const workflow_type_id = getUserTypeId(userType);
      
      // Check if workflow already exists for this user
      const { data: existingWorkflow } = await supabase
        .from('workflows')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      if (existingWorkflow) {
        // Update existing workflow
        result = await supabase
          .from('workflows')
          .update({ workflow_type_id })
          .eq('id', existingWorkflow.id)
          .select()
          .single();
        
        setWorkflowId(existingWorkflow.id);
      } else {
        // Create new workflow
        result = await supabase
          .from('workflows')
          .insert({ 
            user_id: user.id,
            workflow_type_id 
          })
          .select()
          .single();
        
        if (result.data) {
          setWorkflowId(result.data.id);
        }
      }

      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to save workflow type",
          variant: "destructive"
        });
        return null;
      }

      return result.data?.id;
    } catch (error) {
      console.error('Error saving workflow type:', error);
      toast({
        title: "Error",
        description: "Failed to save workflow type",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflowSelections = async (updates: Partial<WorkflowData>) => {
    if (!workflowId || !user?.id) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('workflows')
        .update(updates)
        .eq('id', workflowId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save workflow selections",
          variant: "destructive"
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating workflow selections:', error);
      toast({
        title: "Error", 
        description: "Failed to save workflow selections",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load existing workflow on mount
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from('workflows')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setWorkflowId(data.id);
      }
    };

    loadWorkflow();
  }, [user?.id]);

  return {
    workflowId,
    loading,
    saveWorkflowType,
    updateWorkflowSelections
  };
};