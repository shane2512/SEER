import { z } from "zod";

export const evaluateRequestSchema = z.object({
  marketId: z.string().min(1, "marketId is required"),
});
export type EvaluateRequest = z.infer<typeof evaluateRequestSchema>;

export const tradeRequestSchema = z.object({
  marketId: z.string().min(1, "marketId is required"),
  side: z.enum(["YES", "NO"]),
  size: z.number().positive("size must be greater than 0"),
});
export type TradeRequest = z.infer<typeof tradeRequestSchema>;
