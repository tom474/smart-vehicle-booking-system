import { ArrowRight, LucideIcon, Search, } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, } from "./ui/command"
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "./ui/input"

interface GlobalSearchProps {
  className?: string,
  open?: boolean,
  onOpenChange?: Dispatch<SetStateAction<boolean>>
}

interface SearchItemData {
  icon: LucideIcon
  label: string
}

interface SearchPageItemData extends SearchItemData {
  url: string
}

export function GlobalSearch({ className, open: openProp, onOpenChange }: GlobalSearchProps) {
  const t = useTranslations("Sidebar");

  const [_open, _setOpen] = useState(false)
  const open = openProp ?? _open
  const setOpen = onOpenChange ?? _setOpen

  const [searchQuery, setSearchQuery] = useState<string>('')

  const inputRef = useRef<HTMLInputElement>(null)
  const commandInputRef = useRef<HTMLInputElement>(null)

  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        inputRef.current?.focus()

      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, setOpen])

  const userRole = "admin"

  const coordinatorAndAdminRole = ["Admin", "admin", "Coordinator", "coordinator", "ROL-4", "ROL-5"];
  const adminRole = ["Admin", "admin", "ROL-5"];
  const getSearchPageItems = (): SearchPageItemData[] => {
    if (coordinatorAndAdminRole.includes(userRole)) {
      const coordPageItems = [
        {
          label: t("coordinator.dashboard"),
          url: "/dashboard",
          icon: ArrowRight,
        },

        {
          label: t("coordinator.bookingRequests"),
          url: "/dashboard/bookings",
          icon: ArrowRight,
        },
        {
          label: t("coordinator.trips"),
          url: "/dashboard/trips",
          icon: ArrowRight,
        },
        {
          label: t("coordinator.feedbacks"),
          url: "/dashboard/feedbacks",
          icon: ArrowRight,
        },
        {
          label: t("coordinator.expenses"),
          url: "/dashboard/expenses",
          icon: ArrowRight,
        },
        {
          title: t("coordinator.schedule"),
          url: "/dashboard/schedules",
          icon: ArrowRight,
        },

        {
          label: t("coordinator.leaveRequests"),
          url: "/dashboard/leave-requests",
          icon: ArrowRight,
        },
        {
          label: t("coordinator.vehicleServiceRequests"),
          url: "/dashboard/vehicle-service-requests",
          icon: ArrowRight,
        },
        {
          label: t("coordinator.report"),
          url: "/dashboard/report",
          icon: ArrowRight,
        }, {
          label: t("coordinator.drivers"),
          url: "/admin/drivers",
          icon: ArrowRight,
        },
        {
          label: t("coordinator.locations"),
          url: "/admin/locations",
          icon: ArrowRight,
        },
        {
          label: t("coordinator.vehicles"),
          url: "/admin/vehicles/owned",
          icon: ArrowRight,
        },
        {
          label: t("coordinator.vendors"),
          url: "/admin/vendors",
          icon: ArrowRight,
        },
      ] as SearchPageItemData[];

      if (adminRole.includes(userRole)) {
        const adminPageItems = [

          {
            label: t("admin.rolesAndPermissions"),
            url: "/admin/roles-and-permissions",
            icon: ArrowRight,
          },
          {
            label: t("admin.users"),
            url: "/admin/users",
            icon: ArrowRight,
          },
          {
            title: t("admin.settings"),
            url: "/admin/settings",
            icon: ArrowRight,
          }, {
            title: t("admin.activityLogs"),
            url: "/admin/activity-logs",
            icon: ArrowRight,
          },

        ] as SearchPageItemData[]

        return [...adminPageItems, ...coordPageItems];
      }

      return coordPageItems;
    } else {
      return []
    }
  };


  return (
    <>
      <div className={cn("relative w-full flex overflow-visible", className)}>
        {/* Search bar */}
        <Search className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground size-4" />
        <Input
          type="text"
          placeholder="Search..."
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key == 'Enter') {
              commandInputRef.current?.dispatchEvent(
                new KeyboardEvent("keydown", {
                  key: "Enter",
                  code: "Enter",
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                })
              )
            }
          }}
          className="w-full pl-9"
        />
        <p className={cn("text-muted-foreground text-sm",
          "absolute transform -translate-y-1/2 right-3 top-1/2 text-muted-foreground")}
        >
          <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
            <span className="text-nowrap text-xs">Ctrl K</span>
          </kbd>
        </p>
        {/* Suggestion box */}
        <Command className={cn("absolute bg-white border shadow-xl z-50 top-full mt-2 left-0 right-0 h-fit", !open && "hidden")}>
          <div className="hidden">
            <CommandInput ref={commandInputRef} value={searchQuery} placeholder="Search documentations..." />
          </div>
          {/* <CommandInput placeholder="Search documentations..." /> */}
          <CommandList className="h-full bg-white" >
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {getSearchPageItems().map(item => (
                <CommandItem key={item.label} onSelect={() => {
                  router.push(item.url)
                  setSearchQuery("")
                  setOpen(false)
                }}>
                  {<item.icon />}
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {/* <CommandSeparator /> */}
            {/* <CommandGroup heading="Settings"> */}
            {/* <CommandItem> */}
            {/*   <User /> */}
            {/*   <span>Profile</span> */}
            {/*   <CommandShortcut>⌘P</CommandShortcut> */}
            {/* </CommandItem> */}
            {/*   <CommandItem> */}
            {/*     <CreditCard /> */}
            {/*     <span>Billing</span> */}
            {/*     <CommandShortcut>⌘B</CommandShortcut> */}
            {/*   </CommandItem> */}
            {/*   <CommandItem> */}
            {/*     <Settings /> */}
            {/*     <span>Settings</span> */}
            {/*     <CommandShortcut>⌘S</CommandShortcut> */}
            {/*   </CommandItem> */}
            {/* </CommandGroup> */}
          </CommandList>
        </Command>
      </div>
    </>
  )
}

