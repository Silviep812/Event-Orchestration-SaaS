import { z } from 'zod';

// RSVP Validation Schema
export const rsvpSchema = z.object({
  guest_name: z.string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  guest_email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  response_type: z.enum(["attending", "not-attending", "maybe"], {
    required_error: "Please select your response",
  }),
  guest_count: z.number()
    .int()
    .min(1, { message: "At least 1 guest required" })
    .max(10, { message: "Maximum 10 guests allowed" })
    .optional(),
  special_requests: z.string()
    .trim()
    .max(1000, { message: "Special requests must be less than 1000 characters" })
    .optional(),
});

// Confirmation Validation Schema
export const confirmationSchema = z.object({
  confirmation_number: z.string()
    .trim()
    .min(3, { message: "Confirmation number must be at least 3 characters" })
    .max(50, { message: "Confirmation number must be less than 50 characters" }),
  name: z.string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  phone: z.string()
    .trim()
    .regex(/^[\d\s\-\(\)]+$/, { message: "Invalid phone number format" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional(),
  notes: z.string()
    .trim()
    .max(1000, { message: "Notes must be less than 1000 characters" })
    .optional(),
});

// Reservation Validation Schema
export const reservationSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  phone: z.string()
    .trim()
    .regex(/^[\d\s\-\(\)]+$/, { message: "Invalid phone number format" })
    .max(20, { message: "Phone number must be less than 20 characters" }),
  party_size: z.number()
    .int()
    .min(1, { message: "At least 1 person required" })
    .max(50, { message: "Maximum 50 people allowed" }),
  preferred_date: z.string()
    .min(1, { message: "Preferred date is required" }),
  preferred_time: z.string()
    .min(1, { message: "Preferred time is required" }),
  special_requests: z.string()
    .trim()
    .max(1000, { message: "Special requests must be less than 1000 characters" })
    .optional(),
});

// Registry Validation Schema
export const registrySchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(100, { message: "Name must be less than 100 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  phone: z.string()
    .trim()
    .regex(/^[\d\s\-\(\)]+$/, { message: "Invalid phone number format" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional(),
  selected_items: z.array(z.string())
    .min(1, { message: "Please select at least one item" }),
  total_amount: z.number()
    .min(0, { message: "Invalid total amount" }),
  message: z.string()
    .trim()
    .max(500, { message: "Message must be less than 500 characters" })
    .optional(),
});

// QR Code Validation Schema
export const qrCodeSchema = z.object({
  event_name: z.string()
    .trim()
    .min(2, { message: "Event name must be at least 2 characters" })
    .max(150, { message: "Event name must be less than 150 characters" }),
  ticket_number: z.string()
    .trim()
    .min(5, { message: "Ticket number must be at least 5 characters" })
    .max(50, { message: "Ticket number must be less than 50 characters" }),
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  phone: z.string()
    .trim()
    .regex(/^[\d\s\-\(\)]+$/, { message: "Invalid phone number format" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional(),
  notes: z.string()
    .trim()
    .max(1000, { message: "Notes must be less than 1000 characters" })
    .optional(),
});

// Export types
export type RSVPFormData = z.infer<typeof rsvpSchema>;
export type ConfirmationFormData = z.infer<typeof confirmationSchema>;
export type ReservationFormData = z.infer<typeof reservationSchema>;
export type RegistryFormData = z.infer<typeof registrySchema>;
export type QRCodeFormData = z.infer<typeof qrCodeSchema>;
