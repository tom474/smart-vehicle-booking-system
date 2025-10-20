import { useFormContext } from "react-hook-form";
import type { z } from "zod/v4";
import { ScheduleEnum, type SettingsData, SettingType } from "@/apis/settings";
import FixedSelectorField from "@/components/form-field/fixed-selector";
import { FormField } from "@/components/ui/form";
import { LegacyTextInputField } from "@/components/form-field/input";
import TimeField from "@/components/form-field/time";
import NumberInputField from "@/components/form-field/number";
import { capitalize } from "@/lib/string-utils";

function getSettingType(key: string): z.infer<typeof SettingType> | undefined {
  const parts = key.split(".");
  if (parts.length < 2) return undefined;

  const type = parts.pop(); // last part

  try {
    const settingType = SettingType.parse(type);
    return settingType;
  } catch {
    console.warn(`${type} is not yet available in setting type`);
    return "string";
  }
}

export default function SettingField({ setting }: { setting: SettingsData }) {
  const form = useFormContext();

  const settingType = getSettingType(setting.key);
  const name = setting.id;

  const title = setting.title;
  const description = setting.description;

  switch (settingType) {
    case "enabled":
      return (
        <FormField
          control={form.control}
          name={name}
          render={({ field }) => {
            console.log("FIXED SELECTOR: ", field.value);
            return (
              <FixedSelectorField
                field={field}
                defaultValue={String(field.value)}
                label={title}
                description={description}
                items={[
                  ["true", "Enable"],
                  ["false", "Disable"],
                ]}
              />
            );
          }}
        />
      );

    case "schedule":
      return (
        <FormField
          control={form.control}
          name={name}
          render={({ field }) => {
            return (
              <FixedSelectorField
                field={field}
                label={title}
                description={description}
                items={ScheduleEnum.options.map((opt) => [
                  opt,
                  capitalize(opt),
                ])}
              />
            );
          }}
        />
      );

    case "time":
      return (
        <FormField
          control={form.control}
          name={name}
          render={({ field }) => {
            return (
              <TimeField
                field={field}
                label={title}
                description={description}
                className="appearance-none w-fit text-right"
              />
            );
          }}
        />
      );

    case "lead_hours":
      return (
        <FormField
          control={form.control}
          name={name}
          render={({ field }) => {
            return (
              <NumberInputField
                {...field}
                label={title}
                description={description}
                value={field.value ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  // Convert to number or empty string for controlled input
                  field.onChange(
                    val === "" ? "" : Number(val),
                  );
                }}
                type="number"
                min={0}
                className="text-right"
              />
            );
          }}
        />
      );

    case "string":
      return (
        <FormField
          control={form.control}
          name={name}
          render={({ field }) => {
            return (
              <LegacyTextInputField
                {...field}
                label={title}
                description={description}
                className="text-right"
              />
            );
          }}
        />
      );

    default:
      return null;
  }
}
