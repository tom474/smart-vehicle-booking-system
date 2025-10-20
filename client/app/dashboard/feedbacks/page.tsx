"use client";

import {
  getTripFeedbackById,
  getTripFeedbacks,
  type TripFeedbackData,
} from "@/apis/trip-feedback";
import TableView from "@/components/dashboard-table/table-view";
import { mapParam } from "@/lib/build-query-param";
import { feedbackColumns } from "./_columns/feedback";
import { ViewTripFeedbacks } from "./_components/view";

function Feedbacks() {
  return (
    <TableView
      targetDataStr="Trip feedback"
      tableConfig={{
        columnVisibility: {
          comment: false,
        },
      }}
      columns={(props) =>
        feedbackColumns({
          ...props,
          onEdit: undefined,
        }) as TripFeedbackData[]
      }
      fetcher={mapParam(getTripFeedbacks)}
      // fetcher={async () =>
      //   await new Promise<TripFeedbackData[]>((r) =>
      //     r([mockTripFeedback]),
      //   )
      // }
      // renderView={{
      //   fetcher: async () =>
      //     await new Promise<TripFeedbackData>((r) =>
      //       r(mockTripFeedback),
      //     ),
      //
      //   render: (data) =>
      //     data ? <ViewTripFeedbacks data={data} /> : null,
      // }}

      renderView={{
        fetcher: (id) => getTripFeedbackById(id),
        render: (data) =>
          data ? <ViewTripFeedbacks data={data} /> : null,
      }}
    // renderEdit={{
    //   fetcher: (id) => getExpense(id),
    //   render: (data) => (data ? <CreateExpense defaultValue={data} /> : null),
    // }}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _mockTripFeedback = {
  id: "fb_001",
  rating: 4,
  comment: "The trip was smooth and comfortable. Driver was friendly!",
  userId: "user_123",
  tripId: "trip_456",
  createdAt: new Date("2024-09-05T12:05:00Z"),
  updatedAt: new Date("2024-09-05T12:05:00Z"),
};

export default Feedbacks;
