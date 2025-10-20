"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useSWR from "swr";
import { getSettings, updateSetting } from "@/apis/settings";
import Spinner from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { apiURL } from "@/lib/utils";
import SettingField from "./_components/setting-field";
import { apiErrHandler } from "@/lib/error-handling";

export default function Settings() {
  const tToast = useTranslations("Admin.setting.toast");
  const tForm = useTranslations("Admin.setting.form");
  const t = useTranslations("Admin.setting");

  const [defaultValues, setDefaultValues] = useState<
    Record<string, string> | undefined
  >(undefined);

  const { data, isLoading, error } = useSWR(`${apiURL}/settings`, () =>
    getSettings(),
  );

  const form = useForm({});

  const { isDirty, isSubmitting } = form.formState;

  useEffect(() => {
    if (data) {
      const defaultValues = data.reduce(
        (acc, s) => {
          acc[s.id] = s.value;
          return acc;
        },
        {} as Record<string, string>,
      );

      setDefaultValues(defaultValues);

      setTimeout(() => form.reset(defaultValues), 1);
      // form.reset(defaultValues);
    }
  }, [data, form]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center size-full">
        <Spinner />
      </div>
    );
  if (error) return "There was an error";
  if (!data) return "No settings found";

  function onSubmit(data: Record<string, string>) {
    // only send changed values
    const changed = Object.entries(data)
      .filter(([key, val]) => val !== defaultValues?.[key])
      .map(([key, val]) => ({ id: key, value: val }));

    const promises: Promise<void>[] = changed.map((c) =>
      updateSetting(c.id, c.value),
    );

    if (promises.length > 0) {
      toast.promise(
        (async () => {
          const results = await Promise.allSettled(promises);

          results.forEach((result, idx) => {
            if (result.status === "rejected") {
              const failedKey = changed[idx].id;

              // Attach error message to that field
              form.setError(failedKey, {
                type: "manual",
                message: tForm("fieldError"),
              });
            }
          });

          // If all failed, throw so toast shows error state
          if (results.every((r) => r.status === "rejected")) {
            throw new Error("All updates failed");
          }
        })(),
        {
          loading: tToast("update.loading"),
          success: tToast("update.success"),
          error: (e) => {
            const apiErr = apiErrHandler(e);
            if (apiErr) return apiErr;

            return tToast("update.error");
          },
        },
      );
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4 bg-white p-4 rounded-md"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-1">{t("title")}</h1>
          {/* <p className="text-subtitle-2 text-muted-foreground"> */}
          {/* 	{t("description")} */}
          {/* </p> */}
        </div>
        <div className="flex flex-col gap-8">
          {data.map((setting) => (
            <SettingField key={setting.id} setting={setting} />
          ))}
        </div>

        <div className="w-full flex justify-end gap-4">
          {isDirty && (
            <Button
              variant="outline"
              type="button"
              onClick={() => form.reset(defaultValues)}
            >
              Cancel
            </Button>
          )}
          <Button
            disabled={!isDirty || isSubmitting}
            variant="secondary"
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
