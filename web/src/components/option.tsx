"use client";

import * as React from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRightIcon } from "lucide-react";

type OptionItem =
  | string
  | {
      name: string;
      icon?: React.ReactNode;
    };

// Helper to get item name
const getItemName = (item: OptionItem): string => {
  return typeof item === "string" ? item : item.name;
};

export function Options({
  options,
  onSelectionChange,
}: {
  options: {
    name: string;
    isMulti?: boolean;
    items: OptionItem[];
  }[];
  onSelectionChange?: (
    selections: Record<string, Set<string> | string>,
  ) => void;
}) {
  // Initialize state for each calendar
  const [selections, setSelections] = React.useState<
    Record<string, Set<string> | string>
  >(() => {
    const initial: Record<string, Set<string> | string> = {};
    options.forEach((calendar) => {
      if (calendar.isMulti) {
        // For multi-select, use a Set with first 2 items selected by default
        initial[calendar.name] = new Set(
          calendar.items.slice(0, 2).map(getItemName),
        );
      } else {
        // For single-select, use the first item by default
        initial[calendar.name] = getItemName(calendar.items[0]) || "";
      }
    });
    return initial;
  });

  // Notify parent when selections change
  React.useEffect(() => {
    onSelectionChange?.(selections);
  }, [selections, onSelectionChange]);

  const handleMultiSelect = (calendarName: string, item: string) => {
    setSelections((prev) => {
      const newSelections = { ...prev };
      const prevSelection = prev[calendarName];
      const currentSet = new Set(
        prevSelection instanceof Set ? prevSelection : [],
      );

      if (currentSet.has(item)) {
        currentSet.delete(item);
      } else {
        currentSet.add(item);
      }

      newSelections[calendarName] = currentSet;
      return newSelections;
    });
  };

  const handleSingleSelect = (calendarName: string, item: string) => {
    setSelections((prev) => ({
      ...prev,
      [calendarName]: item,
    }));
  };

  const isItemSelected = (
    calendarName: string,
    item: string,
    isMulti: boolean,
  ) => {
    const selection = selections[calendarName];
    if (isMulti) {
      return selection instanceof Set ? selection.has(item) : false;
    }
    return selection === item;
  };

  return (
    <>
      {options.map((calendar, index) => (
        <React.Fragment key={calendar.name}>
          <SidebarGroup key={calendar.name}>
            <Collapsible
              defaultOpen={index === 0}
              className="group/collapsible"
            >
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm"
              >
                <CollapsibleTrigger>
                  {calendar.name}{" "}
                  <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  {calendar.isMulti ? (
                    <SidebarMenu>
                      {calendar.items.map((item) => {
                        const itemName = getItemName(item);
                        const itemIcon =
                          typeof item === "object" ? item.icon : undefined;
                        return (
                          <SidebarMenuItem key={itemName}>
                            <SidebarMenuButton
                              onClick={() =>
                                handleMultiSelect(calendar.name, itemName)
                              }
                            >
                              <Checkbox
                                checked={isItemSelected(
                                  calendar.name,
                                  itemName,
                                  true,
                                )}
                                onCheckedChange={() =>
                                  handleMultiSelect(calendar.name, itemName)
                                }
                              />
                              {itemIcon && (
                                <span className="ml-2">{itemIcon}</span>
                              )}
                              <span className={itemIcon ? "ml-2" : "ml-2"}>
                                {itemName}
                              </span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  ) : (
                    <RadioGroup
                      value={(() => {
                        const sel = selections[calendar.name];
                        return typeof sel === "string" ? sel : "";
                      })()}
                      onValueChange={(value) =>
                        handleSingleSelect(calendar.name, value)
                      }
                    >
                      <SidebarMenu>
                        {calendar.items.map((item) => {
                          const itemName = getItemName(item);
                          const itemIcon =
                            typeof item === "object" ? item.icon : undefined;
                          return (
                            <SidebarMenuItem key={itemName}>
                              <SidebarMenuButton asChild>
                                <label className="flex items-center cursor-pointer">
                                  <RadioGroupItem value={itemName} />
                                  {itemIcon && (
                                    <span className="ml-2">{itemIcon}</span>
                                  )}
                                  <span className="ml-2">{itemName}</span>
                                </label>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          );
                        })}
                      </SidebarMenu>
                    </RadioGroup>
                  )}
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
          <SidebarSeparator className="mx-0" />
        </React.Fragment>
      ))}
    </>
  );
}
