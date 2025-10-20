"use client";

import { AlertCircle } from "lucide-react";
import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DashboardCardProps<TData> extends HTMLAttributes<HTMLDivElement> {
  title: string;
  fetchFn: () => Promise<TData>;
  onFetchFinished: (data: TData) => ReactNode;
}

function DashboardCardTest<TData>({
  title,
  fetchFn,
  onFetchFinished,
  className,
}: DashboardCardProps<TData>) {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMockData = async () => {
      const res = await fetchFn();
      setData(res);
      setIsLoading(false);
    };

    loadMockData();
  }, [fetchFn]);

  if (isLoading)
    return (
      <Skeleton className="flex flex-col w-full min-h-[100px] gap-6 p-6 rounded-md" />
    );
  if (!data)
    return (
      <div className="flex flex-col w-full gap-6 p-6 bg-destructive text-primary-foreground rounded-md  shadow-destructive-700/50">
        <div className="flex gap-2 justify-start items-center">
          <AlertCircle />
          <p className="text-headline-2 capitalize">No data!</p>
        </div>
        <p className="text-body-2 italic">
          Please contact admin department or refresh the page
        </p>
      </div>
    );

  return (
    <div
      className={cn(
        "flex flex-col w-full gap-6 p-6 bg-background rounded-md",
        className,
      )}
    >
      <p className="text-headline-2 capitalize">{title}</p>
      {onFetchFinished(data)}
    </div>
  );
}

export default DashboardCardTest;
