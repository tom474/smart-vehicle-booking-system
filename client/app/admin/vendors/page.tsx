"use client";

import { getVendor, getVendors } from "@/apis/vendor";
import TableView from "@/components/dashboard-table/table-view";
import { mapParam } from "@/lib/build-query-param";
import { vendorColumns } from "./_columns/vendors";
import CreateUpdateVendorForm from "./_components/create-update";
import ViewVendor from "./_components/view";

function Driver() {
  return (
    <TableView
      targetDataStr="Vendor"
      tableConfig={{
        columnVisibility: {
          driverName: false,
          vehicleLicensePlate: false,
        },
      }}
      columns={vendorColumns}
      fetcher={mapParam(getVendors)}
      renderCreate={<CreateUpdateVendorForm />}
      renderView={{
        fetcher: (id) => getVendor(id),
        render: (data) => <ViewVendor data={data} />,
      }}
      renderEdit={{
        fetcher: (id) => getVendor(id),
        render: (data) => <CreateUpdateVendorForm data={data} />,
      }}
    // renderDestructiveAction={{
    //   onSubmit(id) {
    //     toast.promise(deleteVendor(id), {
    //       loading: "Deleting vendor...",
    //       success: `Vendor #${id} has been deleted`,
    //       error: `Could not delete vendor #${id}, please try again later`,
    //     })
    //   },
    // }}
    />
  );
}

export default Driver;
