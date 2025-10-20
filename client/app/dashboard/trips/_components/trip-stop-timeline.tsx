import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { GripVertical, MapPin } from "lucide-react";
import { type CSSProperties, useState } from "react";
import type { TripStopData } from "@/apis/stop";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/ui/timeline";
import { dateTimeFormat } from "@/lib/date-time-format";

interface StopsColumnProps {
  stops: TripStopData[];
  setStops: (fn: (prev: TripStopData[]) => TripStopData[]) => void;
}

export const TripStopsTimeline = ({ stops, setStops }: StopsColumnProps) => {
  type errorStr = string | undefined;
  const [error, setError] = useState<errorStr>();

  const getStopPos = (id: UniqueIdentifier) =>
    stops.findIndex((stop) => stop.id === id);

  /// Return an error string, otherwise undefined
  const handleDragEnd = (e: DragEndEvent): errorStr => {
    const { active, over } = e;

    if (!over) return;
    if (active.id === over.id) return;

    const originalPos = getStopPos(active.id);
    const newPos = getStopPos(over.id);

    // const activeStop = stops[originalPos];
    // const overStop = stops[newPos];

    // validate drop-off position
    // if (activeStop.type === "drop_off" && newPos === 0) {
    //   return "Drop-off stop can't be set at the first stop.";
    // }

    // validate date
    // if (activeStop.arrivalTime > overStop.arrivalTime) {
    //   return "Cannot move to a position where date is sooner than this.";
    // }

    if (active.data.current) {
    }
    setStops((prev) => {
      return arrayMove(prev, originalPos, newPos);
    });
  };

  return (
    <>
      {error && <p className="italic text-destructive">{error}</p>}
      <DndContext
        collisionDetection={closestCorners}
        onDragEnd={(e) => {
          const error = handleDragEnd(e);
          setError(error);
        }}
      >
        <SortableContext
          items={stops}
          strategy={verticalListSortingStrategy}
        >
          <Timeline className="w-full" defaultValue={999}>
            {stops.map((stop) => (
              <Stop
                key={stop.id}
                stop={stop}
                setStops={setStops}
              />
            ))}
          </Timeline>
        </SortableContext>
      </DndContext>
    </>
  );
};

interface StopProps {
  stop: TripStopData;
  setStops: (fn: (prev: TripStopData[]) => TripStopData[]) => void;
}

const Stop = ({ stop, setStops }: StopProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: stop.id,
    });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleRemoveStop = () => {
    setStops((prev) => prev.filter((f) => f.id !== stop.id));
    // toast.promise(new Promise((r) => setTimeout(r, 3000)), {
    //   loading: "Removing the request...",
    //   success: `Request with trip id #PlaceholderId successfully removed. Requests have been returned to the optimization queue.`,
    //   error: `Could not remove request #PlaceholderId, please try again later`,
    // });
  };

  return (
    <TimelineItem step={stop.order!}>
      <TimelineSeparator />
      <TimelineIndicator />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            className="w-fit mb-2"
            size="xs"
            variant="destructive"
          >
            Remove
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to remove this request from
              the trip?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This trip upon removed will return to the scheduling
              pool.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {/* <AlertDialogAction> */}
            <AlertDialogAction onClick={() => handleRemoveStop()}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div
        className="flex bg-white hover:cursor-grab"
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
      >
        <div className="w-full">
          <TimelineHeader>
            <TimelineDate>{`Est. ${format(stop.arrivalTime, dateTimeFormat)}`}</TimelineDate>
            <TimelineTitle>
              {stop.type === "pickup" ? "Pickup" : "Drop-off"}
            </TimelineTitle>
          </TimelineHeader>
          <TimelineContent>
            <div className="flex items-center gap-1">
              <MapPin className="size-4 text-muted-foreground" />
              {stop.location.address}
            </div>

            {/* <div className="flex items-center gap-1">Capacity: {stop.currentCapacity}</div> */}
          </TimelineContent>
        </div>
        <div className="my-auto">
          <GripVertical className="text-muted-foreground" />
        </div>
      </div>
    </TimelineItem>
  );
};
