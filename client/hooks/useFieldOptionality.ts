import { useMemo } from 'react';
import { ZodOptional, ZodSchema } from 'zod';

const TEMPORARY_REPLACEMENT_PLACEHOLDER = '__PLACEHOLDER__';
const ZOD_OBJECT_FIELD_PATH = '.shape.';
const ZOD_ARRAY_FIELD_PATH = '._def.type';

export const generateZodFieldPath = (fieldName: string) => {
  return fieldName
    .replaceAll(/\.\d+/g, TEMPORARY_REPLACEMENT_PLACEHOLDER)
    .replaceAll(/\./g, ZOD_OBJECT_FIELD_PATH)
    .replaceAll(new RegExp(TEMPORARY_REPLACEMENT_PLACEHOLDER, 'g'), ZOD_ARRAY_FIELD_PATH);
};

const handleNotFoundField = (fieldName: string) => {
  throw new Error(
    `Field ${fieldName} not found in schema. Make sure the field exists in the schema or do not 
pass the schema inside the Form - in this case you could manually set the required property for FormLabel.`
  );
};

export type UseFieldOptionalityCheck = (fieldName: string, schema?: ZodSchema) => boolean | null;

export const useFieldOptionalityCheck: UseFieldOptionalityCheck = (fieldName, schema) => {
  return useMemo(() => {
    if (!schema) {
      return null;
    }
    const zodFieldPath = generateZodFieldPath(fieldName);
    // @ts-expect-error - form schema is always object
    const zodField = get(schema?.shape, zodFieldPath);
    if (!zodField) handleNotFoundField(fieldName);
    return zodField instanceof ZodOptional;
  }, [fieldName, schema]);
};
