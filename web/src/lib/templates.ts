// Template definitions for generating Go code

import type { TemplateContext } from "./template-engine";
import { hasAnyDatabase } from "./template-engine";

export interface GeneratedFile {
  path: string;
  name: string;
  language: string;
  content: string;
}

// Generate main.go in cmd directory
export function generateMainGo(ctx: TemplateContext): string {
  const imports: string[] = [
    `"fmt"`,
    `"log"`,
  ];

  if (hasAnyDatabase(ctx)) {
    imports.push(`"myapp/config"`);
  }

  if (ctx.hasOpenTelemetry) {
    imports.push(`"context"`);
    imports.push(`"go.opentelemetry.io/otel"`);
  }

  const hasHTTP = ctx.projectModule.includes("HTTP") || ctx.projectModule === "Skeleton";
  const hasGRPC = ctx.projectModule.includes("gRPC");

  if (hasHTTP) {
    if (ctx.httpServerLibrary === "Gin") {
      imports.push(`"github.com/gin-gonic/gin"`);
    } else if (ctx.httpServerLibrary === "Echo") {
      imports.push(`"github.com/labstack/echo/v4"`);
    } else if (ctx.httpServerLibrary === "Fiber v3") {
      imports.push(`"github.com/gofiber/fiber/v3"`);
    } else {
      imports.push(`"net/http"`);
    }
  }

  return `package main

import (
${imports.map(imp => `\t${imp}`).join('\n')}
)

func main() {
${ctx.hasOpenTelemetry ? '\tctx := context.Background()\n' : ''}${hasAnyDatabase(ctx) ? `\t// Initialize configuration
\tcfg, err := config.New()
\tif err != nil {
\t\tlog.Fatalf("Failed to load config: %v", err)
\t}

` : ''}${ctx.hasMySQL ? `\t// Initialize MySQL connection
\tmysqlDB, err := cfg.InitMySQL(ctx)
\tif err != nil {
\t\tlog.Fatalf("Failed to connect to MySQL: %v", err)
\t}
\tdefer mysqlDB.Close()

` : ''}${ctx.hasPostgres ? `\t// Initialize PostgreSQL connection
\tpostgresDB, err := cfg.InitPostgres(ctx)
\tif err != nil {
\t\tlog.Fatalf("Failed to connect to Postgres: %v", err)
\t}
\tdefer postgresDB.Close()

` : ''}${ctx.hasRedis ? `\t// Initialize Redis connection
\tredisClient, err := cfg.InitRedis(ctx)
\tif err != nil {
\t\tlog.Fatalf("Failed to connect to Redis: %v", err)
\t}
\tdefer redisClient.Close()

` : ''}${ctx.hasMongo ? `\t// Initialize MongoDB connection
\tmongoClient, err := cfg.InitMongo(ctx)
\tif err != nil {
\t\tlog.Fatalf("Failed to connect to MongoDB: %v", err)
\t}
\tdefer mongoClient.Disconnect(ctx)

` : ''}${hasHTTP ? `\t// Initialize HTTP server
\tfmt.Println("Starting ${ctx.httpServerLibrary} server on :8080...")
${ctx.httpServerLibrary === "Gin" ? `\tr := gin.Default()
\tr.GET("/health", func(c *gin.Context) {
\t\tc.JSON(200, gin.H{"status": "healthy"})
\t})
\tif err := r.Run(":8080"); err != nil {
\t\tlog.Fatal(err)
\t}` : ctx.httpServerLibrary === "Echo" ? `\te := echo.New()
\te.GET("/health", func(c echo.Context) error {
\t\treturn c.JSON(200, map[string]string{"status": "healthy"})
\t})
\tif err := e.Start(":8080"); err != nil {
\t\tlog.Fatal(err)
\t}` : ctx.httpServerLibrary.startsWith("Fiber") ? `\tapp := fiber.New()
\tapp.Get("/health", func(c fiber.Ctx) error {
\t\treturn c.JSON(fiber.Map{"status": "healthy"})
\t})
\tif err := app.Listen(":8080"); err != nil {
\t\tlog.Fatal(err)
\t}` : `\thttp.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
\t\tw.WriteHeader(http.StatusOK)
\t\tw.Write([]byte("{\\"status\\": \\"healthy\\"}"))
\t})
\tif err := http.ListenAndServe(":8080", nil); err != nil {
\t\tlog.Fatal(err)
\t}`}
` : hasGRPC ? `\tfmt.Println("Starting gRPC server...")
\t// TODO: Add gRPC server initialization
` : `\tfmt.Println("Application started successfully!")
\tselect {} // Keep running
`}}
`;
}

// Generate config.go
export function generateConfigGo(ctx: TemplateContext): string {
  const fields: string[] = [
    `\tPort     int`,
    `\tLogLevel string`,
  ];

  if (ctx.hasOpenTelemetry || ctx.hasPrometheus || ctx.hasElasticAPM) {
    fields.push(`\t\n\t// Observability`);
    if (ctx.hasOpenTelemetry) {
      fields.push(`\tOtelEndpoint string`);
    }
    if (ctx.hasPrometheus) {
      fields.push(`\tPrometheusPort int`);
    }
  }

  if (ctx.hasMySQL) {
    fields.push(`\t\n\t// MySQL Configuration`);
    fields.push(`\tMySQLDSN            string`);
    fields.push(`\tMySQLMaxOpenConns   int`);
    fields.push(`\tMySQLMaxIdleConns   int`);
  }

  if (ctx.hasPostgres) {
    fields.push(`\t\n\t// PostgreSQL Configuration`);
    fields.push(`\tPostgresDSN         string`);
    fields.push(`\tPostgresMaxOpenConns int`);
    fields.push(`\tPostgresMaxIdleConns int`);
  }

  if (ctx.hasRedis) {
    fields.push(`\t\n\t// Redis Configuration`);
    fields.push(`\tRedisAddr     string`);
    fields.push(`\tRedisPassword string`);
    fields.push(`\tRedisDB       int`);
  }

  if (ctx.hasMongo) {
    fields.push(`\t\n\t// MongoDB Configuration`);
    fields.push(`\tMongoURI      string`);
    fields.push(`\tMongoDatabase string`);
  }

  const imports: string[] = [
    `"os"`,
    `"strconv"`,
  ];

  if (ctx.hasMySQL) {
    imports.push(`"database/sql"`);
    imports.push(`_ "github.com/go-sql-driver/mysql"`);
  }

  if (ctx.hasPostgres) {
    imports.push(`"database/sql"`);
    imports.push(`_ "github.com/lib/pq"`);
  }

  if (ctx.hasRedis) {
    imports.push(`"github.com/redis/go-redis/v9"`);
    imports.push(`"context"`);
  }

  if (ctx.hasMongo) {
    imports.push(`"context"`);
    imports.push(`"go.mongodb.org/mongo-driver/mongo"`);
    imports.push(`"go.mongodb.org/mongo-driver/mongo/options"`);
  }

  // Remove duplicates
  const uniqueImports = Array.from(new Set(imports));

  return `package config

import (
${uniqueImports.map(imp => `\t${imp}`).join('\n')}
)

type Config struct {
${fields.join('\n')}
}

func New() (*Config, error) {
\tport, _ := strconv.Atoi(getEnv("PORT", "8080"))
\t
\treturn &Config{
\t\tPort:     port,
\t\tLogLevel: getEnv("LOG_LEVEL", "info"),${ctx.hasOpenTelemetry ? `
\t\tOtelEndpoint: getEnv("OTEL_ENDPOINT", "localhost:4317"),` : ''}${ctx.hasPrometheus ? `
\t\tPrometheusPort: getEnvInt("PROMETHEUS_PORT", 9090),` : ''}${ctx.hasMySQL ? `
\t\tMySQLDSN:          getEnv("MYSQL_DSN", "user:password@tcp(localhost:3306)/dbname"),
\t\tMySQLMaxOpenConns: getEnvInt("MYSQL_MAX_OPEN_CONNS", 10),
\t\tMySQLMaxIdleConns: getEnvInt("MYSQL_MAX_IDLE_CONNS", 5),` : ''}${ctx.hasPostgres ? `
\t\tPostgresDSN:          getEnv("POSTGRES_DSN", "postgresql://user:password@localhost:5432/dbname"),
\t\tPostgresMaxOpenConns: getEnvInt("POSTGRES_MAX_OPEN_CONNS", 10),
\t\tPostgresMaxIdleConns: getEnvInt("POSTGRES_MAX_IDLE_CONNS", 5),` : ''}${ctx.hasRedis ? `
\t\tRedisAddr:     getEnv("REDIS_ADDR", "localhost:6379"),
\t\tRedisPassword: getEnv("REDIS_PASSWORD", ""),
\t\tRedisDB:       getEnvInt("REDIS_DB", 0),` : ''}${ctx.hasMongo ? `
\t\tMongoURI:      getEnv("MONGO_URI", "mongodb://localhost:27017"),
\t\tMongoDatabase: getEnv("MONGO_DATABASE", "myapp"),` : ''}
\t}, nil
}
${ctx.hasMySQL ? `
func (c *Config) InitMySQL(ctx context.Context) (*sql.DB, error) {
\tdb, err := sql.Open("mysql", c.MySQLDSN)
\tif err != nil {
\t\treturn nil, err
\t}
\t
\tdb.SetMaxOpenConns(c.MySQLMaxOpenConns)
\tdb.SetMaxIdleConns(c.MySQLMaxIdleConns)
\t
\tif err := db.PingContext(ctx); err != nil {
\t\treturn nil, err
\t}
\t
\treturn db, nil
}
` : ''}${ctx.hasPostgres ? `
func (c *Config) InitPostgres(ctx context.Context) (*sql.DB, error) {
\tdb, err := sql.Open("postgres", c.PostgresDSN)
\tif err != nil {
\t\treturn nil, err
\t}
\t
\tdb.SetMaxOpenConns(c.PostgresMaxOpenConns)
\tdb.SetMaxIdleConns(c.PostgresMaxIdleConns)
\t
\tif err := db.PingContext(ctx); err != nil {
\t\treturn nil, err
\t}
\t
\treturn db, nil
}
` : ''}${ctx.hasRedis ? `
func (c *Config) InitRedis(ctx context.Context) (*redis.Client, error) {
\tclient := redis.NewClient(&redis.Options{
\t\tAddr:     c.RedisAddr,
\t\tPassword: c.RedisPassword,
\t\tDB:       c.RedisDB,
\t})
\t
\tif err := client.Ping(ctx).Err(); err != nil {
\t\treturn nil, err
\t}
\t
\treturn client, nil
}
` : ''}${ctx.hasMongo ? `
func (c *Config) InitMongo(ctx context.Context) (*mongo.Client, error) {
\tclientOptions := options.Client().ApplyURI(c.MongoURI)
\tclient, err := mongo.Connect(ctx, clientOptions)
\tif err != nil {
\t\treturn nil, err
\t}
\t
\tif err := client.Ping(ctx, nil); err != nil {
\t\treturn nil, err
\t}
\t
\treturn client, nil
}
` : ''}
func getEnv(key, defaultValue string) string {
\tif value := os.Getenv(key); value != "" {
\t\treturn value
\t}
\treturn defaultValue
}

func getEnvInt(key string, defaultValue int) int {
\tif value := os.Getenv(key); value != "" {
\t\tif intValue, err := strconv.Atoi(value); err == nil {
\t\t\treturn intValue
\t\t}
\t}
\treturn defaultValue
}
`;
}

// Generate go.mod
export function generateGoMod(ctx: TemplateContext): string {
  const dependencies: string[] = [];

  if (ctx.httpServerLibrary === "Gin") {
    dependencies.push(`\tgithub.com/gin-gonic/gin v1.9.1`);
  } else if (ctx.httpServerLibrary === "Echo") {
    dependencies.push(`\tgithub.com/labstack/echo/v4 v4.11.4`);
  } else if (ctx.httpServerLibrary === "Fiber v3") {
    dependencies.push(`\tgithub.com/gofiber/fiber/v3 v3.0.0`);
  }

  if (ctx.hasMySQL) {
    dependencies.push(`\tgithub.com/go-sql-driver/mysql v1.7.1`);
  }

  if (ctx.hasPostgres) {
    dependencies.push(`\tgithub.com/lib/pq v1.10.9`);
  }

  if (ctx.hasRedis) {
    dependencies.push(`\tgithub.com/redis/go-redis/v9 v9.4.0`);
  }

  if (ctx.hasMongo) {
    dependencies.push(`\tgo.mongodb.org/mongo-driver v1.13.1`);
  }

  if (ctx.hasOpenTelemetry) {
    dependencies.push(`\tgo.opentelemetry.io/otel v1.21.0`);
    dependencies.push(`\tgo.opentelemetry.io/otel/sdk v1.21.0`);
  }

  return `module myapp

go 1.21
${dependencies.length > 0 ? `
require (
${dependencies.join('\n')}
)
` : ''}`;
}

// Generate README.md
export function generateReadme(ctx: TemplateContext): string {
  const features: string[] = [];

  if (ctx.projectModule) features.push(`- **Module Type**: ${ctx.projectModule}`);
  if (ctx.projectLayout) features.push(`- **Architecture**: ${ctx.projectLayout}`);
  if (ctx.httpServerLibrary) features.push(`- **HTTP Server**: ${ctx.httpServerLibrary}`);
  
  const databases: string[] = [];
  if (ctx.hasMySQL) databases.push("MySQL");
  if (ctx.hasPostgres) databases.push("PostgreSQL");
  if (ctx.hasRedis) databases.push("Redis");
  if (ctx.hasMongo) databases.push("MongoDB");
  if (ctx.hasSQLite) databases.push("SQLite");
  if (ctx.hasClickHouse) databases.push("ClickHouse");
  if (databases.length > 0) features.push(`- **Databases**: ${databases.join(", ")}`);

  const observability: string[] = [];
  if (ctx.hasOpenTelemetry) observability.push("OpenTelemetry");
  if (ctx.hasPrometheus) observability.push("Prometheus");
  if (ctx.hasElasticAPM) observability.push("Elastic APM");
  if (observability.length > 0) features.push(`- **Observability**: ${observability.join(", ")}`);

  return `# MyApp

A Go application generated with Zero.

## Features

${features.join('\n')}

## Getting Started

### Prerequisites

- Go 1.21 or higher${ctx.hasDocker ? '\n- Docker & Docker Compose' : ''}${ctx.hasMySQL || ctx.hasPostgres || ctx.hasMongo ? '\n- Database server (see Configuration)' : ''}

### Installation

\`\`\`bash
git clone <your-repo>
cd myapp
go mod download
\`\`\`

### Running

\`\`\`bash${ctx.hasDocker ? `
# Using Docker
docker-compose up

# Or run locally` : ''}
go run cmd/main.go
\`\`\`

### Building

\`\`\`bash
go build -o bin/myapp cmd/main.go
\`\`\`

## Configuration

Configure the application using environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8080 | Server port |
| LOG_LEVEL | info | Logging level |${ctx.hasMySQL ? `
| MYSQL_DSN | - | MySQL connection string |
| MYSQL_MAX_OPEN_CONNS | 10 | Max open connections |
| MYSQL_MAX_IDLE_CONNS | 5 | Max idle connections |` : ''}${ctx.hasPostgres ? `
| POSTGRES_DSN | - | PostgreSQL connection string |
| POSTGRES_MAX_OPEN_CONNS | 10 | Max open connections |
| POSTGRES_MAX_IDLE_CONNS | 5 | Max idle connections |` : ''}${ctx.hasRedis ? `
| REDIS_ADDR | localhost:6379 | Redis address |
| REDIS_PASSWORD | "" | Redis password |
| REDIS_DB | 0 | Redis database number |` : ''}${ctx.hasMongo ? `
| MONGO_URI | mongodb://localhost:27017 | MongoDB URI |
| MONGO_DATABASE | myapp | MongoDB database name |` : ''}

## License

MIT
`;
}

// Generate .gitignore
export function generateGitignore(ctx: TemplateContext): string {
  return `# Binaries
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
${ctx.hasDocker ? `
# Docker
docker-compose.override.yml` : ''}${ctx.frontend ? `

# Frontend
web/node_modules/
web/dist/
web/.next/
web/.nuxt/
web/.output/` : ''}
`;
}

// Generate Dockerfile
export function generateDockerfile(ctx: TemplateContext): string {
  return `FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/bin/myapp cmd/main.go

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/bin/myapp .

EXPOSE ${ctx.projectModule.includes("HTTP") ? '8080' : '50051'}

CMD ["./myapp"]
`;
}

// Generate Makefile
export function generateMakefile(ctx: TemplateContext): string {
  return `.PHONY: build run test clean

build:
\tgo build -o bin/myapp cmd/main.go

run:
\tgo run cmd/main.go

test:
\tgo test -v ./...

clean:
\trm -rf bin/
${ctx.hasDocker ? `
docker-build:
\tdocker build -t myapp:latest .

docker-run:
\tdocker-compose up

docker-down:
\tdocker-compose down` : ''}
`;
}

// Master function to generate all files based on context
export function generateFiles(ctx: TemplateContext): GeneratedFile[] {
  const files: GeneratedFile[] = [
    {
      path: "cmd/main.go",
      name: "main.go",
      language: "go",
      content: generateMainGo(ctx),
    },
    {
      path: "go.mod",
      name: "go.mod",
      language: "go",
      content: generateGoMod(ctx),
    },
    {
      path: "README.md",
      name: "README.md",
      language: "markdown",
      content: generateReadme(ctx),
    },
    {
      path: ".gitignore",
      name: ".gitignore",
      language: "plaintext",
      content: generateGitignore(ctx),
    },
  ];

  if (hasAnyDatabase(ctx)) {
    files.push({
      path: "config/config.go",
      name: "config.go",
      language: "go",
      content: generateConfigGo(ctx),
    });
  }

  if (ctx.hasDocker) {
    files.push({
      path: "Dockerfile",
      name: "Dockerfile",
      language: "dockerfile",
      content: generateDockerfile(ctx),
    });
  }

  if (ctx.hasMakefile) {
    files.push({
      path: "Makefile",
      name: "Makefile",
      language: "makefile",
      content: generateMakefile(ctx),
    });
  }

  return files;
}
