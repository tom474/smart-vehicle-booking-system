import { z } from "zod/v4";
import { buildQueryParams } from "@/lib/build-query-param";
import { apiURL, customFetch } from "@/lib/utils";

export const ReportGenerationSchema = z
  .object({
    fileName: z.string().optional(),
    dateRange: z.any().optional(),
    startTime: z.date().optional(),
    endTime: z.date().optional(),
    date: z.date(),
    period: z.enum(["1", "2", "3", "6", "12"]),
    type: z.enum(["csv"]),
  })
  .check((ctx) => {
    const data = ctx.value;
    if (data.endTime && data.endTime > new Date()) {
      ctx.issues.push({
        code: "custom",
        message: "The end date cannot be in the future",
        input: data.endTime,
        path: ["dateRange"],
      });
    }
  });

export type ReportGenerationData = z.infer<typeof ReportGenerationSchema>;

export async function generateReport(data: ReportGenerationData) {
  try {
    const reportLink = await generateDownloadLink({
      fileName: data.fileName,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    const res = await fetch(reportLink.downloadUrl, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`Failed to download report: ${res}`);
    }

    const blob = await res.blob();

    const objectUrl = URL.createObjectURL(blob);

    const link: HTMLAnchorElement = document.createElement("a");
    link.href = objectUrl;
    link.download = reportLink.filename;
    // link.download = `report-${format(data.date, dateTimeFormat)}.zip`;
    link.click();

    URL.revokeObjectURL(objectUrl);
  } catch (e) {
    console.log(e);
    throw Error;
  }
}

const ReportLinkSchema = z.object({
  downloadUrl: z.url(),
  filename: z.string(),
});

type ReportLinkData = z.infer<typeof ReportLinkSchema>;

interface GenerateDownloadLinkProps {
  fileName?: string;
  startTime?: Date;
  endTime?: Date;
}

async function generateDownloadLink({
  ...props
}: GenerateDownloadLinkProps): Promise<ReportLinkData> {
  const { startTime, endTime, ...rest } = props;

  const queryParams = buildQueryParams({
    ...rest,
    ...(startTime ? { startTime: startTime.toISOString() } : {}),
    ...(endTime ? { endTime: endTime.toISOString() } : {}),
  });

  try {
    const res = await customFetch(
      `${apiURL}/exports/all?${queryParams.toString()}`,
      {
        method: "GET",
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to generate report link: ${res}`);
    }
    const json = await res.json();

    return ReportLinkSchema.parse(json);
  } catch (e) {
    console.log(e);
    throw Error;
  }
}
