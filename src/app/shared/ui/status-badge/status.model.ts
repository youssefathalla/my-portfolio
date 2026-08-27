import * as v from 'valibot';

export const StatusVariantSchema = v.picklist(['primary', 'green', 'yellow', 'blue', 'red', 'gray']);
export type StatusVariant = v.InferOutput<typeof StatusVariantSchema>;

export const StatusConfigSchema = v.object({
  label: v.optional(v.string()),
  color: StatusVariantSchema,
  icon: v.optional(v.string()),
});
export type StatusConfig = v.InferOutput<typeof StatusConfigSchema>;
