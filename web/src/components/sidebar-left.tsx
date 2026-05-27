import * as React from "react";
import { ChevronRight, File, Folder } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { GeneratedFile } from "@/lib/templates";

interface SidebarLeftProps extends React.ComponentProps<typeof Sidebar> {
  selectedFile?: string;
  onFileSelect?: (filePath: string) => void;
  generatedFiles: Record<string, GeneratedFile>;
}

// Helper function to build tree structure from file paths
function buildTreeFromPaths(paths: string[]): TreeItem[] {
  const tree: any = {};

  paths.forEach((path) => {
    const parts = path.split("/");
    let current = tree;

    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // It's a file
        if (!current._files) current._files = [];
        current._files.push(part);
      } else {
        // It's a directory
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    });
  });

  // Convert tree object to array format
  function convertToArray(obj: any): TreeItem[] {
    const result: TreeItem[] = [];

    // Add files first
    if (obj._files) {
      result.push(...obj._files.map((f: string) => f as TreeItem));
    }

    // Then add directories
    Object.keys(obj).forEach((key) => {
      if (key !== "_files") {
        const children = convertToArray(obj[key]);
        result.push([key, ...children] as TreeItem);
      }
    });

    return result;
  }

  return convertToArray(tree);
}

export function SidebarLeft({
  selectedFile,
  onFileSelect,
  generatedFiles,
  ...props
}: SidebarLeftProps) {
  const filePaths = Object.keys(generatedFiles);
  const tree = React.useMemo(() => buildTreeFromPaths(filePaths), [filePaths]);

  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Generated Files</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tree.map((item) => (
                <Tree
                  key={String(Array.isArray(item) ? item[0] : item)}
                  item={item}
                  selectedFile={selectedFile}
                  onFileSelect={onFileSelect}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

type TreeItem = string | TreeItem[];

interface TreeProps {
  item: TreeItem;
  parentPath?: string;
  selectedFile?: string;
  onFileSelect?: (filePath: string) => void;
}

function Tree({
  item,
  parentPath = "",
  selectedFile,
  onFileSelect,
}: TreeProps) {
  const [rawName, ...items] = Array.isArray(item) ? item : [item];
  // First element is always the name (string), remaining are children
  const name = rawName as string;
  const currentPath = parentPath ? `${parentPath}/${name}` : name;

  if (!items.length) {
    const isActive = selectedFile === currentPath;
    return (
      <SidebarMenuButton
        isActive={isActive}
        className="data-[active=true]:bg-accent cursor-pointer"
        onClick={() => onFileSelect?.(currentPath)}
      >
        <File />
        {name}
      </SidebarMenuButton>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
        defaultOpen={true}
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <ChevronRight className="transition-transform" />
            <Folder />
            {name}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {items.map((subItem) => (
              <Tree
                key={String(Array.isArray(subItem) ? subItem[0] : subItem)}
                item={subItem}
                parentPath={currentPath}
                selectedFile={selectedFile}
                onFileSelect={onFileSelect}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
}
