import { Home, MapPin, MapPinHouse, Navigation } from "lucide-react";
import type { LocationData } from "@/apis/location";
import Badge from "@/components/badge";
import FieldSeparator from "@/components/form-field/field-separator";
import TextViewField from "@/components/ui/view-field";
import { capitalize } from "@/lib/string-utils";
import { useTranslations } from "next-intl";

interface Props {
  data: LocationData;
}

function ViewLocation({ data }: Props) {
  const t = useTranslations("Admin.location");

  const typeVariants = {
    fixed: "info",
    custom: "warning",
  } as const;

  return (
    <FieldSeparator>
      <TextViewField
        icon={MapPin}
        title={t("type")}
        value={
          <Badge variant={typeVariants[data.type]}>
            {capitalize(data.type)}
          </Badge>
        }
      />

      <TextViewField icon={MapPinHouse} title={t("name")} value={data.name} />

      <TextViewField icon={Home} title={t("address")} value={data.address} />

      <TextViewField
        icon={Navigation}
        title={t("latitude")}
        value={data.latitude?.toString()}
      />

      <TextViewField
        icon={Navigation}
        title={t("longitude")}
        value={data.longitude?.toString()}
      />
    </FieldSeparator>
  );
}

export default ViewLocation;
