import {
  Banknote,
  Calendar,
  CardSim,
  CheckCircle,
  ImageIcon,
  NotepadText,
  Paperclip,
  User,
} from "lucide-react";
import Image from "next/image";
import type { ExpenseData } from "@/apis/expense";
import FieldSeparator from "@/components/form-field/field-separator";
import TextViewField from "@/components/ui/view-field";

interface Props {
  data: ExpenseData;
}

export const ViewExpense = ({ data }: Props) => {
  return (
    <FieldSeparator>
      <TextViewField
        icon={CheckCircle}
        title="Status"
        value={
          data.status
            ? data.status.charAt(0).toUpperCase() +
            data.status.slice(1)
            : "N/A"
        }
      />

      <TextViewField
        icon={Banknote}
        title="Type"
        value={
          data.type
            ? data.type.charAt(0).toUpperCase() + data.type.slice(1)
            : "N/A"
        }
      />

      <TextViewField
        icon={NotepadText}
        title="Description"
        value={data.description || "N/A"}
      />

      <TextViewField
        icon={Banknote}
        title="Amount"
        value={
          data.amount ? `${data.amount.toLocaleString()} VND` : "N/A"
        }
      />

      <TextViewField
        icon={User}
        title="Driver ID"
        value={data.driverId || "N/A"}
      />

      <TextViewField
        icon={CardSim}
        title="Vehicle Service ID"
        value={data.vehicleServiceId || "N/A"}
      />

      <TextViewField
        icon={CardSim}
        title="Trip ID"
        value={data.tripId || "N/A"}
      />

      <TextViewField
        icon={Paperclip}
        title="Attachments"
        value={
          data.attachments
            ? `${data.attachments.length} file(s)`
            : "No attachments"
        }
      />

      <TextViewField
        icon={Calendar}
        title="Created At"
        value={
          data.createdAt
            ? new Date(data.createdAt).toLocaleString()
            : "N/A"
        }
      />

      <TextViewField
        icon={Calendar}
        title="Updated At"
        value={
          data.updatedAt
            ? new Date(data.updatedAt).toLocaleString()
            : "N/A"
        }
      />

      <TextViewField
        variant="dropdown"
        icon={ImageIcon}
        title="Receipt Image"
        value={
          data.receiptImageUrl && (
            <Image
              src={`/api/image-proxy?sas=${encodeURIComponent(
                `${data.receiptImageUrl}&v=${data.updatedAt || Date.now()}`,
              )}`}
              height={512}
              width={512}
              className="w-full border rounded-lg h-fit"
              alt="Receipt Image"
            />
          )
        }
      />
    </FieldSeparator>
  );
};
