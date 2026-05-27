import React, { useState, useCallback, useMemo } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarLeft } from "@/components/sidebar-left";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CodeEditor } from "@/components/code-editor";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarRight } from "@/components/sidebar-right";
import {
  createTemplateContext,
  type UserSelections,
} from "@/lib/template-engine";
import { generateFiles, type GeneratedFile } from "@/lib/templates";

export function App() {
  const [userSelections, setUserSelections] = useState<UserSelections>({});

  // Generate files based on current selections
  const generatedFiles = useMemo(() => {
    const ctx = createTemplateContext(userSelections);
    const files = generateFiles(ctx);

    // Convert to Record for easy lookup
    const fileMap: Record<string, GeneratedFile> = {};
    files.forEach((file) => {
      fileMap[file.path] = file;
    });
    return fileMap;
  }, [userSelections]);

  // Default to first generated file
  const defaultFilePath = Object.keys(generatedFiles)[0] || "cmd/main.go";
  const [selectedFilePath, setSelectedFilePath] =
    useState<string>(defaultFilePath);

  const selectedFile =
    generatedFiles[selectedFilePath] || generatedFiles[defaultFilePath];

  const handleFileSelect = useCallback(
    (filePath: string) => {
      if (generatedFiles[filePath]) {
        setSelectedFilePath(filePath);
      }
    },
    [generatedFiles],
  );

  const handleSelectionChange = useCallback(
    (selections: Record<string, Set<string> | string>) => {
      setUserSelections(selections);
    },
    [],
  );

  return (
    <React.Fragment>
      <TooltipProvider>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <SidebarProvider>
            <SidebarLeft
              selectedFile={selectedFilePath}
              onFileSelect={handleFileSelect}
              generatedFiles={generatedFiles}
            />
            <SidebarInset className="overflow-hidden">
              <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2 min-w-0">
                <div className="flex flex-1 items-center gap-2 px-3 min-w-0">
                  <SidebarTrigger />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbPage className="line-clamp-1">
                          {selectedFile?.path || "No file selected"}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  <div className="ml-auto">
                    <ModeToggle />
                  </div>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden min-w-0">
                <div className="flex-1 min-h-0 min-w-0">
                  <CodeEditor
                    value={selectedFile?.content || "// No content"}
                    language={selectedFile?.language || "go"}
                  />
                </div>
              </div>
            </SidebarInset>
            <SidebarRight onSelectionChange={handleSelectionChange} />
          </SidebarProvider>
        </ThemeProvider>
      </TooltipProvider>
    </React.Fragment>
  );
}
