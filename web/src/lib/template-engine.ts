// Template engine for generating Go code based on user selections

export interface TemplateContext {
  // Databases
  hasRedis: boolean;
  hasMemcached: boolean;
  hasClickHouse: boolean;
  hasMongo: boolean;
  hasMySQL: boolean;
  hasPostgres: boolean;
  hasSQLite: boolean;

  // Project settings
  projectModule: string;
  projectLayout: string;
  httpServerLibrary: string;
  queueLibrary: string;
  loggingType: string;
  loggingLibrary: string;
  schedulerLibrary: string;

  // Frontend
  frontendPackageManager: string;
  frontend: string;

  // Notifications
  hasDiscord: boolean;
  hasMicrosoftTeams: boolean;
  hasSlack: boolean;
  hasTelegram: boolean;
  hasGomail: boolean;

  // Additional features
  hasGitHubSpecKit: boolean;
  hasAgentSkills: boolean;
  hasOpenAPI: boolean;
  hasSNAPBI: boolean;
  hasJWT: boolean;
  hasCasbin: boolean;
  hasBatchProcessing: boolean;
  hasDocker: boolean;
  hasGitHubActions: boolean;
  hasGitLabCI: boolean;
  hasJenkins: boolean;
  hasFumadocs: boolean;
  hasFileIO: boolean;
  hasGitInit: boolean;
  hasMakefile: boolean;
  hasElasticAPM: boolean;
  hasOpenTelemetry: boolean;
  hasPrometheus: boolean;
  hasSecurity: boolean;
  hasTestcontainers: boolean;
  hasWebsocket: boolean;
}

export interface UserSelections {
  Databases?: Set<string> | string;
  "Project Modules"?: string;
  "Project Layout"?: string;
  "HTTP Server Library"?: string;
  "Queue Library"?: string;
  "Logging Types"?: string;
  "Logging Library"?: string;
  "Scheduler Library"?: string;
  Notification?: Set<string> | string;
  "Frontend Package Manager"?: string;
  Frontend?: string;
  "Additional Features"?: Set<string> | string;
}

export function createTemplateContext(
  selections: UserSelections,
): TemplateContext {
  const databases =
    selections["Databases"] instanceof Set
      ? selections["Databases"]
      : new Set<string>();
  const notifications =
    selections["Notification"] instanceof Set
      ? selections["Notification"]
      : new Set<string>();
  const additionalFeatures =
    selections["Additional Features"] instanceof Set
      ? selections["Additional Features"]
      : new Set<string>();

  return {
    // Databases
    hasRedis: databases.has("Cache: Redis"),
    hasMemcached: databases.has("Cache: Memcached"),
    hasClickHouse: databases.has("ClickHouse"),
    hasMongo: databases.has("Mongo"),
    hasMySQL: databases.has("MySQL"),
    hasPostgres: databases.has("Postgres"),
    hasSQLite: databases.has("SQLite"),

    // Project settings
    projectModule:
      typeof selections["Project Modules"] === "string"
        ? selections["Project Modules"]
        : "Skeleton",
    projectLayout:
      typeof selections["Project Layout"] === "string"
        ? selections["Project Layout"]
        : "Flat",
    httpServerLibrary:
      typeof selections["HTTP Server Library"] === "string"
        ? selections["HTTP Server Library"]
        : "net/http",
    queueLibrary:
      typeof selections["Queue Library"] === "string"
        ? selections["Queue Library"]
        : "",
    loggingType:
      typeof selections["Logging Types"] === "string"
        ? selections["Logging Types"]
        : "stdout",
    loggingLibrary:
      typeof selections["Logging Library"] === "string"
        ? selections["Logging Library"]
        : "log",
    schedulerLibrary:
      typeof selections["Scheduler Library"] === "string"
        ? selections["Scheduler Library"]
        : "",

    // Frontend
    frontendPackageManager:
      typeof selections["Frontend Package Manager"] === "string"
        ? selections["Frontend Package Manager"]
        : "npm",
    frontend:
      typeof selections["Frontend"] === "string" ? selections["Frontend"] : "",

    // Notifications
    hasDiscord: notifications.has("Chatbot: Discord"),
    hasMicrosoftTeams: notifications.has("Chatbot: Microsoft Teams"),
    hasSlack: notifications.has("Chatbot: Slack"),
    hasTelegram: notifications.has("Chatbot: Telegram"),
    hasGomail: notifications.has("Email: gomail"),

    // Additional features
    hasGitHubSpecKit: additionalFeatures.has("AI: GitHub Spec-Kit"),
    hasAgentSkills: additionalFeatures.has("AI: Agent Skills"),
    hasOpenAPI: additionalFeatures.has("API: OpenAPI"),
    hasSNAPBI: additionalFeatures.has("API: SNAP BI"),
    hasJWT: additionalFeatures.has("Auth: JWT, OAuth2"),
    hasCasbin: additionalFeatures.has("Auth: Casbin RBAC"),
    hasBatchProcessing: additionalFeatures.has("Batch Processing"),
    hasDocker: additionalFeatures.has(
      "Deployment: Docker, Compose, Kubernetes",
    ),
    hasGitHubActions: additionalFeatures.has("Deployment: GitHub Actions"),
    hasGitLabCI: additionalFeatures.has("Deployment: GitLab CI/CD"),
    hasJenkins: additionalFeatures.has("Deployment: Jenkins"),
    hasFumadocs: additionalFeatures.has("Documentation: Fumadocs"),
    hasFileIO: additionalFeatures.has("File Reader/Writer: JSON, CSV"),
    hasGitInit: additionalFeatures.has("Git: git init"),
    hasMakefile: additionalFeatures.has("Makefile"),
    hasElasticAPM: additionalFeatures.has("Observability: Elastic APM"),
    hasOpenTelemetry: additionalFeatures.has("Observability: OpenTelemetry"),
    hasPrometheus: additionalFeatures.has("Observability: Prometheus"),
    hasSecurity: additionalFeatures.has(
      "Security: golangci-lint, gosec, SonarQube",
    ),
    hasTestcontainers: additionalFeatures.has("Testing: testcontainers"),
    hasWebsocket: additionalFeatures.has("Websocket: Gorilla"),
  };
}

// Helper function to check if any database is selected
export function hasAnyDatabase(ctx: TemplateContext): boolean {
  return (
    ctx.hasRedis ||
    ctx.hasMemcached ||
    ctx.hasClickHouse ||
    ctx.hasMongo ||
    ctx.hasMySQL ||
    ctx.hasPostgres ||
    ctx.hasSQLite
  );
}

// Helper function to check if any observability tool is enabled
export function hasAnyObservability(ctx: TemplateContext): boolean {
  return ctx.hasElasticAPM || ctx.hasOpenTelemetry || ctx.hasPrometheus;
}
