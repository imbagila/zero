import React, { lazy, Suspense, useMemo, useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { Skeleton } from "@/components/ui/skeleton";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

interface CodeEditorProps {
  value?: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
}

const defaultCode = `// Welcome to Zero Code Editor
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type User struct {
	ID    int    \`json:"id"\`
	Name  string \`json:"name"\`
	Email string \`json:"email"\`
}

func main() {
	http.HandleFunc("/api/users", handleUsers)
	
	fmt.Println("Server starting on :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
	users := []User{
		{ID: 1, Name: "Alice", Email: "alice@example.com"},
		{ID: 2, Name: "Bob", Email: "bob@example.com"},
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
`;

export function CodeEditor({
  value = defaultCode,
  language = "go",
  onChange,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const [editorValue, setEditorValue] = useState(value);

  // Update editor value when prop changes
  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleChange = (newValue: string | undefined) => {
    setEditorValue(newValue || "");
    onChange?.(newValue);
  };

  const editorTheme = theme === "dark" ? "vs-dark" : "light";

  const editorOptions = useMemo(
    () => ({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      padding: { top: 16 },
      lineNumbers: "on" as const,
      renderLineHighlight: "all" as const,
      bracketPairColorization: { enabled: true },
      cursorBlinking: "smooth" as const,
      cursorSmoothCaretAnimation: "on" as const,
      smoothScrolling: true,
    }),
    [],
  );

  return (
    <React.Fragment>
      <div className="h-full w-full min-w-0 overflow-hidden rounded-xl border border-border">
        <Suspense
          fallback={
            <div className="h-full w-full p-4 space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-2/3" />
            </div>
          }
        >
          <MonacoEditor
            height="100%"
            width="100%"
            language={language}
            value={editorValue}
            theme={editorTheme}
            onChange={handleChange}
            options={editorOptions}
          />
        </Suspense>
      </div>
    </React.Fragment>
  );
}
