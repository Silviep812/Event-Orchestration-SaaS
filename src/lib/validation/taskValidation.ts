import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: "Task title is required" })
    .max(200, { message: "Task title must be less than 200 characters" }),
  description: z.string()
    .trim()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional(),
  selected_event_id: z.string()
    .min(1, { message: "Please select a project/event" }),
  assigned_user_id: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimated_hours: z.string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      { message: "Estimated hours must be a positive number" }
    ),
  due_date: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  assignment_type: z.string()
    .min(1, { message: "Assignment type is required" }),
  assigned_coordinator_name: z.string()
    .trim()
    .min(1, { message: "Collaborator name is required" })
    .max(100, { message: "Coordinator name must be less than 100 characters" })
});

export const updateTaskSchema = z.object({
  title: z.string()
    .trim()
    .min(1, { message: "Task title is required" })
    .max(200, { message: "Task title must be less than 200 characters" }),
  description: z.string()
    .trim()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimated_hours: z.number()
    .min(0, { message: "Estimated hours must be positive" })
    .optional(),
  due_date: z.string().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
