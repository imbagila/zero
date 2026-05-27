// Mock file contents for the code editor demo

export interface MockFile {
  path: string;
  name: string;
  language: string;
  content: string;
}

export const mockFiles: Record<string, MockFile> = {
  "cmd/main.go": {
    path: "cmd/main.go",
    name: "main.go",
    language: "go",
    content: `package main

import (
	"fmt"
	"log"
	"os"

	"myapp/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	fmt.Printf("Starting application on port %d...\\n", cfg.Port)
	
	if err := run(cfg); err != nil {
		log.Fatalf("Application error: %v", err)
		os.Exit(1)
	}
}

func run(cfg *config.Config) error {
	// Initialize your application here
	fmt.Println("Application started successfully!")
	return nil
}
`,
  },
  "config/config.go": {
    path: "config/config.go",
    name: "config.go",
    language: "go",
    content: `package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port     int
	Debug    bool
	DBHost   string
	DBPort   int
	DBName   string
	LogLevel string
}

func Load() (*Config, error) {
	port, _ := strconv.Atoi(getEnv("PORT", "8080"))
	dbPort, _ := strconv.Atoi(getEnv("DB_PORT", "5432"))
	
	return &Config{
		Port:     port,
		Debug:    getEnv("DEBUG", "false") == "true",
		DBHost:   getEnv("DB_HOST", "localhost"),
		DBPort:   dbPort,
		DBName:   getEnv("DB_NAME", "myapp"),
		LogLevel: getEnv("LOG_LEVEL", "info"),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
`,
  },
  "go.mod": {
    path: "go.mod",
    name: "go.mod",
    language: "go",
    content: `module myapp

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/joho/godotenv v1.5.1
	gorm.io/driver/postgres v1.5.4
	gorm.io/gorm v1.25.5
)
`,
  },
  ".gitignore": {
    path: ".gitignore",
    name: ".gitignore",
    language: "plaintext",
    content: `# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary
*.test

# Output of the go coverage tool
*.out

# Dependency directories
vendor/

# IDE
.idea/
.vscode/
*.swp
*.swo

# Environment
.env
.env.local

# Build output
/bin/
/dist/
`,
  },
  "README.md": {
    path: "README.md",
    name: "README.md",
    language: "markdown",
    content: `# MyApp

A simple Go application template.

## Getting Started

### Prerequisites

- Go 1.21 or higher
- PostgreSQL (optional)

### Installation

\`\`\`bash
git clone https://github.com/example/myapp.git
cd myapp
go mod download
\`\`\`

### Running

\`\`\`bash
go run cmd/main.go
\`\`\`

### Building

\`\`\`bash
go build -o bin/myapp cmd/main.go
\`\`\`

## Configuration

Set the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8080 | Server port |
| DEBUG | false | Enable debug mode |
| DB_HOST | localhost | Database host |
| DB_PORT | 5432 | Database port |
| DB_NAME | myapp | Database name |

## License

MIT
`,
  },
};

export const defaultFilePath = "cmd/main.go";

export function getFileByPath(path: string): MockFile | undefined {
  return mockFiles[path];
}

export function getAllFilePaths(): string[] {
  return Object.keys(mockFiles);
}
