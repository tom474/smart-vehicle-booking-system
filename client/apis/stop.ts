import { z } from "zod/v4";
import { LocationSchema } from "@/apis/location";
import { TripTicketSchema } from "@/apis/trip-ticket";
import { UserSchema } from "@/apis/user";

const UserGroupSchema = z.object({
  bookingRequestId: z.string(),
  users: z.array(UserSchema),
  contactName: z.string().optional(),
  contactPhoneNumber: z.string().optional(),
  status: z.enum(
    [
      "pending",
      "picked_up",
      "dropping_off",
      "dropped_off",
      "no_show",
      "cancelled",
    ],
    {
      error: "Status is required.",
    },
  ),
  skipReason: z.string().optional(),
});

type UserGroupData = z.infer<typeof UserGroupSchema>;

const StopSchema = z.object({
  id: z.string(),
  arrivalTime: z.date({
    error: "Arrival time is required.",
  }),
  actualArrivalTime: z.date().optional(),
  location: LocationSchema,
  order: z.number({
    error: "Order is required.",
  }),
  type: z.enum(["pickup", "drop_off"], {
    error: "Type is required.",
  }),
  tickets: z.array(TripTicketSchema).optional(),
  group: z.array(UserGroupSchema).optional(),
});

type StopData = z.infer<typeof StopSchema>;

export const TripStopSchema = z.object({
  id: z.string(),
  location: LocationSchema,
  locationId: z.string().optional(),
  arrivalTime: z.date("Arrival time can't be empty."),
  order: z
    .number({
      error: "Order is required.",
    })
    .optional(),
  type: z.enum(["pickup", "drop_off"], {
    error: "Type is required.",
  }),
});

export type TripStopData = z.infer<typeof TripStopSchema>;

export const CreateTripStopSchema = TripStopSchema.omit({
  id: true,
  order: true,
});
export type CreateTripStopData = z.infer<typeof CreateTripStopSchema>;

export { StopSchema, type StopData, UserGroupSchema, type UserGroupData };
