import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChecklistTemplate {
  id: number;
  category_name: string;
  sort_order: number;
  label: string;
}

export function useChecklistTemplates() {
  return useQuery({
    queryKey: ["checklist-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .order("category_name")
        .order("sort_order");
      if (error) throw error;
      return data as ChecklistTemplate[];
    },
    staleTime: 1000 * 60 * 30, // cache for 30 min since templates rarely change
  });
}

/** Group templates by category_name */
export function groupTemplatesByCategory(
  templates: ChecklistTemplate[]
): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const t of templates) {
    if (!map[t.category_name]) map[t.category_name] = [];
    map[t.category_name].push(t.label);
  }
  return map;
}
