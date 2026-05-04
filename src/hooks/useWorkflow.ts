import { useCallback, useState, useEffect } from 'react';
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
  serv_vendor_id?: string;
  service_rental_buy_id?: string;
  event_id: string; // Now required due to NOT NULL constraint
  created_at?: string;
  updated_at?: string;
}

const sanitizeWorkflowUpdates = (
  updates: Partial<Omit<WorkflowData, 'user_id' | 'event_id'>> & { event_id?: string }
) =>
  Object.fromEntries(
    Object.entries(updates).filter(([, v]) => v !== undefined)
  ) as typeof updates;

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
      case 'hospitality-provider': return 3;
      case 'venue-owner': return 4;
      case 'host': return 5;
      default: return 1;
    }
  };

  /**
   * Persist workflow type (role) for the workflow being edited in the wizard.
   * Pass `targetWorkflowId` (e.g. page state `workflowIdForEvent`) so we never
   * update the wrong row — "most recent workflow" is wrong when multiple events exist.
   */
  const saveWorkflowType = async (
    userType: string,
    targetWorkflowId?: string | null
  ) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      const workflow_type_id = getUserTypeId(userType);

      let resolvedId = targetWorkflowId || workflowId;

      if (!resolvedId) {
        const { data: row } = await supabase
          .from('workflows')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        resolvedId = row?.id ?? null;
      }

      if (!resolvedId) {
        toast({
          title: "Error",
          description: "No workflow found. Please select an event first.",
          variant: "destructive"
        });
        return null;
      }

      const { data: existingWorkflow, error: fetchErr } = await supabase
        .from('workflows')
        .select('id, workflow_type_id')
        .eq('id', resolvedId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchErr || !existingWorkflow) {
        toast({
          title: "Error",
          description: "Workflow not found. Go back and select an event again.",
          variant: "destructive"
        });
        return null;
      }

      const { data, error } = await supabase
        .from('workflows')
        .update({ workflow_type_id })
        .eq('id', existingWorkflow.id)
        .select()
        .single();

      setWorkflowId(existingWorkflow.id);

      if (error) {
        console.error('saveWorkflowType:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to save workflow type",
          variant: "destructive"
        });
        return null;
      }

      // Log the workflow type change
      if (data) {
        await supabase.rpc('log_change', {
          p_entity_type: 'workflow',
          p_entity_id: existingWorkflow.id,
          p_action: existingWorkflow.workflow_type_id ? 'updated' : 'created',
          p_field_name: 'workflow_type_id',
          p_old_value: existingWorkflow.workflow_type_id?.toString() || null,
          p_new_value: workflow_type_id.toString(),
          p_description: `Workflow type ${existingWorkflow.workflow_type_id ? 'changed' : 'set'} to ${userType}`
        });
      }

      return data?.id;
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

  const updateWorkflowSelections = async (
    updates: Partial<Omit<WorkflowData, 'user_id' | 'event_id'>> & { event_id?: string },
    targetWorkflowId?: string
  ) => {
    if (!user?.id) return false;

    const effectiveWorkflowId = targetWorkflowId || workflowId;

    setLoading(true);
    try {
      // If no workflow exists and we have event_id, create one
      if (!effectiveWorkflowId) {
        if (!updates.event_id) {
          toast({
            title: "Error",
            description: "Cannot create workflow without an event",
            variant: "destructive"
          });
          return false;
        }

        const payload = sanitizeWorkflowUpdates({
          ...updates,
          event_id: updates.event_id!,
        });

        const { data, error } = await supabase
          .from('workflows')
          .insert({ ...payload, user_id: user.id } as any)
          .select()
          .single();

        if (error) {
          console.error('create workflow:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to create workflow",
            variant: "destructive"
          });
          return false;
        }

        if (data) {
          setWorkflowId(data.id);
          
          // Log workflow creation
          await supabase.rpc('log_change', {
            p_entity_type: 'workflow',
            p_entity_id: data.id,
            p_action: 'created',
            p_field_name: null,
            p_old_value: null,
            p_new_value: null,
            p_description: 'New workflow created'
          });
        }
        return true;
      }

      // Fetch current workflow data to compare changes
      const { data: currentWorkflow } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', effectiveWorkflowId)
        .single();

      const cleanUpdates = sanitizeWorkflowUpdates(updates);

      const { error } = await supabase
        .from('workflows')
        .update(cleanUpdates)
        .eq('id', effectiveWorkflowId)
        .eq('user_id', user.id);

      if (error) {
        console.error('updateWorkflowSelections:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to save workflow selections",
          variant: "destructive"
        });
        return false;
      }

      // Log changes for each updated field
      if (currentWorkflow) {
        const fieldLabels: Record<string, string> = {
          theme_id: 'Event Theme',
          hospitality_id: 'Hospitality Selection',
          venue_id: 'Venue Selection',
          supplier_id: 'External vendor selection',
          serv_vendor_id: 'Service Vendor Selection',
          service_rental_buy_id: 'Service Rental Selection',
          event_id: 'Event Selection',
        };

        for (const [key, newValue] of Object.entries(updates)) {
          const oldValue = currentWorkflow[key as keyof typeof currentWorkflow];
          if (oldValue !== newValue && key !== 'updated_at') {
            await supabase.rpc('log_change', {
              p_entity_type: 'workflow',
              p_entity_id: effectiveWorkflowId,
              p_action: 'updated',
              p_field_name: key,
              p_old_value: oldValue?.toString() || null,
              p_new_value: newValue?.toString() || null,
              p_description: `${fieldLabels[key] || key} ${oldValue ? 'changed' : 'set'}`
            });
          }
        }
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

  // Load most recent workflow on mount
  useEffect(() => {
    const loadWorkflow = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from('workflows')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setWorkflowId(data.id);
      }
    };

    loadWorkflow();
  }, [user?.id]);

  const getAllWorkflows = useCallback(async (): Promise<WorkflowData[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('workflows')
        .select(`
          id,
          workflow_type_id,
          user_id,
          theme_id,
          hospitality_id,
          venue_id,
          supplier_id,
          serv_vendor_id,
          service_rental_buy_id,
          event_id,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workflows:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching workflows:', error);
      return [];
    }
  }, [user?.id]);

  const getWorkflowById = useCallback(async (workflowId: string): Promise<WorkflowData | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .select(`
          id,
          workflow_type_id,
          user_id,
          theme_id,
          hospitality_id,
          venue_id,
          supplier_id,
          serv_vendor_id,
          service_rental_buy_id,
          event_id,
          created_at,
          updated_at
        `)
        .eq('id', workflowId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching workflow:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      return null;
    }
  }, [user?.id]);

  const getWorkflowData = useCallback(async (): Promise<WorkflowData | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .select(`
          id,
          workflow_type_id,
          user_id,
          theme_id,
          hospitality_id,
          venue_id,
          supplier_id,
          serv_vendor_id,
          service_rental_buy_id,
          event_id,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching workflow data:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error fetching workflow data:', error);
      return null;
    }
  }, [user?.id]);

  return {
    workflowId,
    loading,
    saveWorkflowType,
    updateWorkflowSelections,
    getWorkflowData,
    getAllWorkflows,
    getWorkflowById
  };
};