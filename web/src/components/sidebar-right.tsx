import * as React from "react";

import { Options } from "@/components/option";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { PlusIcon } from "lucide-react";
import {
  SiClickhouse,
  SiMongodb,
  SiMysql,
  SiRedis,
  SiSqlite,
  SiPostgresql,
  SiGin,
  SiRabbitmq,
  SiApachekafka,
  SiNatsdotio,
  SiTelegram,
  SiDiscord,
  SiNpm,
  SiYarn,
  SiPnpm,
  SiBun,
  SiDeno,
  SiVite,
  SiNextdotjs,
  SiNuxt,
  SiSolid,
  SiSvelte,
  SiTanstack,
  SiSonarqubeserver,
  SiPrometheus,
  SiOpentelemetry,
  SiElastic,
  SiGit,
  SiOpenapiinitiative,
  SiJsonwebtokens,
  SiDocker,
  SiGithubcopilot,
  SiJenkins,
  SiGitlab,
  SiGithubactions,
} from "@icons-pack/react-simple-icons";

// This is sample data.
const data = {
  options: [
    {
      name: "Databases",
      isMulti: true,
      items: [
        { name: "Cache: Redis", icon: <SiRedis /> },
        "Cache: Memcached",
        { name: "ClickHouse", icon: <SiClickhouse /> },
        { name: "Mongo", icon: <SiMongodb /> },
        { name: "MySQL", icon: <SiMysql /> },
        { name: "Postgres", icon: <SiPostgresql /> },
        { name: "SQLite", icon: <SiSqlite /> },
      ],
    },
    {
      name: "Project Modules",
      items: [
        "Skeleton",
        "gRPC Client/Server",
        "HTTP Client/Server",
        "Queue Producer",
        "Queue Consumer",
        "Scheduler",
        "Terminal UI",
      ],
    },
    {
      name: "Project Layout",
      items: [
        "Flat",
        "Clean Architecture",
        "Domain-Driven Design (Onion)",
        "Hexagonal Architecture",
        "Layer-Based",
        "Modular/Feature-Based",
      ],
    },
    {
      name: "HTTP Server Library",
      items: [
        "net/http",
        { name: "Gin", icon: <SiGin /> },
        "Echo",
        "Fiber v2",
        "Fiber v3",
        "Beego",
        "Gorilla",
      ],
    },
    {
      name: "Queue Library",
      items: [
        { name: "AMQP 0.9.1 (RabbitMQ)", icon: <SiRabbitmq /> },
        { name: "AMQP 1.0 (RabbitMQ)", icon: <SiRabbitmq /> },
        { name: "Asynq (Redis)", icon: <SiRedis /> },
        { name: "Kafka", icon: <SiApachekafka /> },
        { name: "NATS", icon: <SiNatsdotio /> },
        "NSQ",
        "Redpanda",
        { name: "Taskq (Redis)", icon: <SiRedis /> },
      ],
    },
    {
      name: "Logging Types",
      items: ["disabled", "stdout", "File"],
    },
    {
      name: "Logging Library",
      items: ["log", "slog", "Logrus", "Zap", "Zerolog"],
    },
    {
      name: "Scheduler Library",
      items: ["robfig/cron/v3", "gocron"],
    },
    {
      name: "Notification",
      isMulti: true,
      items: [
        { name: "Chatbot: Discord", icon: <SiDiscord /> },
        "Chatbot: Microsoft Teams",
        "Chatbot: Slack",
        { name: "Chatbot: Telegram", icon: <SiTelegram /> },
        "Email: gomail",
      ],
    },
    {
      name: "Frontend Package Manager",
      items: [
        { name: "bun", icon: <SiBun /> },
        { name: "deno", icon: <SiDeno /> },
        { name: "npm", icon: <SiNpm /> },
        { name: "pnpm", icon: <SiPnpm /> },
        { name: "yarn", icon: <SiYarn /> },
      ],
    },
    {
      name: "Frontend",
      items: [
        { name: "Vite", icon: <SiVite /> },
        { name: "Next.js", icon: <SiNextdotjs /> },
        { name: "Nuxt.js", icon: <SiNuxt /> },
        { name: "Solid Start", icon: <SiSolid /> },
        { name: "SvelteKit", icon: <SiSvelte /> },
        { name: "Tanstack Start", icon: <SiTanstack /> },
      ],
    },
    {
      name: "Additional Features",
      isMulti: true,
      items: [
        { name: "AI: GitHub Spec-Kit", icon: <SiGithubcopilot /> },
        "AI: Agent Skills",
        { name: "API: OpenAPI", icon: <SiOpenapiinitiative /> },
        "API: SNAP BI",
        { name: "Auth: JWT, OAuth2", icon: <SiJsonwebtokens /> },
        "Auth: Casbin RBAC",
        "Batch Processing",
        { name: "Deployment: Docker, Compose, Kubernetes", icon: <SiDocker /> },
        { name: "Deployment: GitHub Actions", icon: <SiGithubactions /> },
        { name: "Deployment: GitLab CI/CD", icon: <SiGitlab /> },
        { name: "Deployment: Jenkins", icon: <SiJenkins /> },
        "Documentation: Fumadocs",
        "File Reader/Writer: JSON, CSV",
        { name: "Git: git init", icon: <SiGit /> },
        "Makefile",
        { name: "Observability: Elastic APM", icon: <SiElastic /> },
        { name: "Observability: OpenTelemetry", icon: <SiOpentelemetry /> },
        { name: "Observability: Prometheus", icon: <SiPrometheus /> },
        {
          name: "Security: golangci-lint, gosec, SonarQube",
          icon: <SiSonarqubeserver />,
        },
        "Testing: testcontainers",
        "Websocket: Gorilla",
      ],
    },
  ],
};

export function SidebarRight({
  onSelectionChange,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  onSelectionChange?: (
    selections: Record<string, Set<string> | string>,
  ) => void;
}) {
  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l lg:flex"
      {...props}
    >
      <SidebarContent>
        <SidebarSeparator className="mx-0" />
        <Options options={data.options} onSelectionChange={onSelectionChange} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <PlusIcon />
              <span>Add Your Plugins/Features</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
