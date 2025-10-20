import { ReactNode } from "react";
import useSWR from "swr";
import Spinner from "./spinner";
import { Errorable } from "./undefinable";

interface DataFetcherProps<T> {
  urlId: string;
  loading?: ReactNode;
  fetcher: Promise<T>;
  onFetchFinished: (data: T) => ReactNode;
}

export function DataFetcher<T>({
  urlId,
  fetcher,
  loading,
  onFetchFinished,
}: DataFetcherProps<T>) {
  const { data, isLoading, error } = useSWR(urlId, async () => await fetcher);

  if (isLoading) return loading || <Spinner />;
  if (error) return <Errorable errorMsg="There was an error" shouldError />;
  if (!data) return <Errorable errorMsg="No data found" shouldError />;

  return onFetchFinished(data);
}
