package main

import (
	"embed"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"slices"
	"text/template"
	"time"

	"github.com/pkg/errors"

	"github.com/charmbracelet/huh"
	"github.com/charmbracelet/huh/spinner"
	"github.com/charmbracelet/lipgloss"
)

//go:embed tmpl
var tmplFS embed.FS

// indigo color from huh theme
var titleStyle = lipgloss.NewStyle().
	Foreground(lipgloss.AdaptiveColor{Light: "#5A56E0", Dark: "#7571F9"}).
	Bold(true)

// green color from huh theme
var successStyle = lipgloss.NewStyle().
	Foreground(lipgloss.AdaptiveColor{Light: "#02BA84", Dark: "#02BF87"})

// red color from huh theme
var errorStyle = lipgloss.NewStyle().
	Foreground(lipgloss.AdaptiveColor{Light: "#FF4672", Dark: "#ED567A"})

var (
	args               []string
	projectName        string
	databases          []string
	projectModules     []string
	projectLayout      string
	httpServerLib      string
	queueLib           string
	loggingTypes       []string
	loggingLib         string
	schedulerLib       string
	notifications      []string
	fePackageManager   string
	frontend           string
	additionalFeatures []string
	isOk               bool
)

const (
	descriptionSelect  = "Press enter to select one of the following options"
	descriptionChoices = "Press space to select/unselect these following choices"
)

type option struct {
	key        string
	value      string
	isDisabled bool
}

type options []option

func (opts options) Options() []huh.Option[option] {
	result := make([]huh.Option[option], len(opts))
	for i, opt := range opts {
		result[i] = huh.NewOption(opt.value, opt)
	}
	return result
}

type menu struct {
	title   string
	options options
	value   option
}

func (m menu) run() string {
	err := huh.NewSelect[option]().
		Title(m.title).
		Description(descriptionSelect).
		Options(m.options.Options()...).
		Value(&m.value).
		Run()
	if err != nil {
		fmt.Println(errorStyle.Render(fmt.Sprintf("┃ ✘ Failed to get %s: %s\n", m.title, err.Error())))
		os.Exit(1)
	}

	fmt.Printf(titleStyle.Render("✓ %s"), m.title)
	fmt.Println()
	fmt.Println(successStyle.Render(fmt.Sprintf("┃   ✓ %s", m.value.value)))
	fmt.Println()

	return m.value.key
}

type menuMulti struct {
	title        string
	defaultValue option
	options      options
	value        []option
}

func (m menuMulti) run() []string {
	title := m.title
	if m.defaultValue.key != "" {
		title += " (default: " + m.defaultValue.value + ")"
	}

	err := huh.NewMultiSelect[option]().
		Title(title).
		Description(descriptionChoices).
		Options(m.options.Options()...).
		Value(&m.value).
		Run()
	if err != nil {
		fmt.Println(errorStyle.Render(fmt.Sprintf("┃ ✘ Failed to get %s: %s\n", m.title, err.Error())))
		os.Exit(1)
	}

	fmt.Printf(titleStyle.Render("✓ %s"), m.title)
	fmt.Println()

	var result []string

	// If no selection made
	if len(m.value) == 0 {
		// If there's a default value, use it
		if m.defaultValue.key != "" {
			fmt.Println(successStyle.Render(fmt.Sprintf("┃   ✓ %s (default)", m.defaultValue.value)))
			result = []string{m.defaultValue.key}
		} else {
			// No default value, show empty message
			fmt.Println(successStyle.Render("┃   (none selected)"))
			result = []string{}
		}
	} else {
		// User selected options, display them
		for _, value := range m.value {
			fmt.Println(successStyle.Render(fmt.Sprintf("┃   ✓ %s", value.value)))
		}
		result = make([]string, len(m.value))
		for i, v := range m.value {
			result[i] = v.key
		}
	}

	fmt.Println()
	return result
}

var databaseMenu = menuMulti{
	title: "Databases",
	options: options{
		{key: "redis", value: "Cache: Redis"},
		{key: "memcached", value: "Cache: Memcached"},
		{key: "clickhouse", value: "ClickHouse"},
		{key: "mongo", value: "Mongo"},
		{key: "mysql", value: "MySQL"},
		{key: "postgres", value: "Postgres"},
		{key: "sqlite", value: "SQLite"},
	},
}

var projectModulesMenu = menuMulti{
	title:        "Project Modules",
	defaultValue: option{key: "skeleton", value: "Skeleton"},
	options: options{
		{key: "grpc", value: "gRPC Client/Server"},
		{key: "http", value: "HTTP Client/Server"},
		{key: "notification", value: "Notification (email, chatbot)"},
		{key: "queue-producer", value: "Queue Producer"},
		{key: "queue-consumer", value: "Queue Consumer"},
		{key: "scheduler", value: "Scheduler"},
		{key: "tui", value: "Terminal UI"},
		{key: "web-frontend", value: "Web Frontend"},
	},
}

var projectLayoutMenu = menu{
	title: "Project Layout",
	options: options{
		{key: "flat", value: "Flat"},
		{key: "clean-arch", value: "Clean Architecture: Entity, Infrastructure, Repository, Usecase, Delivery"},
		{key: "ddd", value: "Domain-Driven Design (Onion): Domain, Infrastructure, Application, Presentation"},
		{key: "hexagonal-arch", value: "Hexagonal Architecture: Domain, Port, Adapter"},
		{key: "layer-based", value: "Layer-Based: Entity, Model, Repository, Service, Controller"},
		{key: "feature-based", value: "Modular/Feature-Based: Account, Payment, Transaction, User, etc."},
	},
}

var httpServerLibMenu = menu{
	title: "HTTP Server Library",
	options: options{
		{key: "net-http", value: "net/http"},
		{key: "gin", value: "Gin"},
		{key: "echo", value: "Echo"},
		{key: "fiber-v2", value: "Fiber v2"},
		{key: "fiber-v3", value: "Fiber v3"},
		{key: "beego", value: "Beego"},
		{key: "gorilla", value: "Gorilla"},
	},
}

var queueLibMenu = menu{
	title: "Queue Library",
	options: options{
		{key: "amqp-0.9.1", value: "AMQP 0.9.1 (RabbitMQ)"},
		{key: "amqp-1.0", value: "AMQP 1.0 (RabbitMQ)"},
		{key: "asynq", value: "Asynq (Redis)"},
		{key: "kafka", value: "Kafka"},
		{key: "nats", value: "NATS"},
		{key: "nsq", value: "NSQ"},
		{key: "redpanda", value: "Redpanda"},
		{key: "taskq", value: "Taskq (Redis)"},
	},
}

var loggingTypesMenu = menuMulti{
	title:        "Logging Types",
	defaultValue: option{key: "stdout", value: "stdout"},
	options: options{
		{key: "disabled", value: "disabled"},
		{key: "stdout", value: "stdout"},
		{key: "file", value: "file"},
	},
}

var loggingLibMenu = menu{
	title: "Logging Library",
	options: options{
		{key: "log", value: "log"},
		{key: "slog", value: "slog"},
		{key: "logrus", value: "Logrus"},
		{key: "zap", value: "Zap"},
		{key: "zerolog", value: "Zerolog"},
	},
}

var schedulerLibMenu = menu{
	title: "Scheduler Library",
	options: options{
		{key: "robfig-cron", value: "robfig/cron/v3"},
		{key: "gocron", value: "gocron"},
	},
}

var notificationsMenu = menuMulti{
	title: "Notifications",
	options: options{
		{key: "discord", value: "Chatbot: Discord"},
		{key: "teams", value: "Chatbot: Microsoft Teams"},
		{key: "teams", value: "Chatbot: Slack"},
		{key: "telegram", value: "Chatbot: Telegram"},
		{key: "gomail", value: "Email: gomail"},
	},
}

var fePackageManagerMenu = menu{
	title: "Frontend Package Manager",
	options: options{
		{key: "npm", value: "npm"},
		{key: "yarn", value: "yarn"},
		{key: "pnpm", value: "pnpm"},
		{key: "bun", value: "bun"},
		{key: "deno", value: "deno"},
	},
}

var frontendMenu = menu{
	title: "Web Frontend Framework",
	options: options{
		{key: "vite", value: "Vite"},
		{key: "tanstack-start", value: "Tanstack Start"},
		{key: "nextjs", value: "Next.js"},
		{key: "nuxtjs", value: "Nuxt.js"},
		{key: "sveltekit", value: "SvelteKit"},
		{key: "solid-start", value: "Solid Start"},
	},
}

var additionalFeaturesMenu = menuMulti{
	title: "Additional Features",
	options: options{
		{key: "speckit", value: "AI: GitHub Spec-Kit"},
		{key: "agent-skills", value: "AI: Agent Skills"},
		{key: "openapi", value: "API: OpenAPI"},
		{key: "snap-bi", value: "API: SNAP BI"},
		{key: "oauth2", value: "Auth: JWT, OAuth2"},
		{key: "casbin", value: "Auth: Casbin RBAC"},
		{key: "batch", value: "Batch Processing"},
		{key: "docker", value: "Deployment: Docker, Compose, Kubernetes"},
		{key: "github-actions", value: "Deployment: GitHub Actions"},
		{key: "gitlab", value: "Deployment: GitLab CI/CD"},
		{key: "jenkins", value: "Deployment: Jenkins"},
		{key: "fumadocs", value: "Documentation: Fumadocs"},
		{key: "file-rw", value: "File Reader/Writer: JSON, CSV"},
		{key: "git", value: "Git: git init"},
		{key: "makefile", value: "Makefile"},
		{key: "elastic-apm", value: "Observability: Elastic APM"},
		{key: "opentelemetry", value: "Observability: OpenTelemetry"},
		{key: "prometheus", value: "Observability: Prometheus"},
		{key: "security", value: "Security: golangci-lint, gosec, SonarQube"},
		{key: "testcontainers", value: "Testing: testcontainers"},
		{key: "websocket", value: "Websocket: Gorilla"},
	},
}

func main() {
	fmt.Println("███████████████████████████████████████████████████")
	fmt.Println()
	fmt.Println(" ███████████ ██████████ ███████████      ███████   ")
	fmt.Println("░█░░░░░░███ ░░███░░░░░█░░███░░░░░███   ███░░░░░███ ")
	fmt.Println("░     ███░   ░███  █ ░  ░███    ░███  ███     ░░███")
	fmt.Println("     ███     ░██████    ░██████████  ░███      ░███")
	fmt.Println("    ███      ░███░░█    ░███░░░░░███ ░███      ░███")
	fmt.Println("  ████     █ ░███ ░   █ ░███    ░███ ░░███     ███ ")
	fmt.Println(" ███████████ ██████████ █████   █████ ░░░███████░  ")
	fmt.Println("░░░░░░░░░░░ ░░░░░░░░░░ ░░░░░   ░░░░░    ░░░░░░░    ")
	fmt.Println()
	fmt.Println("███████████████████████████████████████████████████")
	fmt.Println()
	fmt.Println("Zero: A Go Boilerplate Project Scaffolding")
	fmt.Println("https://github.com/imbagila/zero")
	fmt.Println()
	fmt.Println("[💡] Run `zero ui` for interactive way to create go project!")
	fmt.Println()

	args = os.Args[1:]

	// project name
	err := huh.NewInput().
		Title("Project Name").
		Description("This will create a directory with given name as well").
		Placeholder("service-api, service-payment, etc.").
		Validate(func(s string) error {
			if s == "" {
				return errors.New("project name cannot be empty")
			}
			if !regexp.MustCompile(`^[a-z][a-z0-9_-]*$`).MatchString(s) {
				return errors.New("project name must start with a lowercase letter and contain only lowercase letters, digits, hyphens, and underscores")
			}
			return nil
		}).
		Value(&projectName).
		Run()
	if err != nil {
		fmt.Printf(errorStyle.Render("┃ ✘ Failed to get project name: %s\n"), err.Error())
		os.Exit(1)
	}

	fmt.Printf(titleStyle.Render("✓ Project Name:")+" %s\n", projectName)
	fmt.Println()

	// select databases
	databases = databaseMenu.run()

	// project modules
	projectModules = projectModulesMenu.run()

	// layout apps
	projectLayout = projectLayoutMenu.run()

	// http server
	if slices.Contains(projectModules, "http-server") {
		httpServerLib = httpServerLibMenu.run()
	}

	// queue
	if slices.Contains(projectModules, "queue-producer") ||
		slices.Contains(projectModules, "queue-consumer") {
		queueLib = queueLibMenu.run()
	}

	// logging types
	loggingTypes = loggingTypesMenu.run()

	// log library
	loggingLib = loggingLibMenu.run()

	// scheduler
	if slices.Contains(projectModules, "scheduler") {
		schedulerLib = schedulerLibMenu.run()
	}

	// notification
	if slices.Contains(projectModules, "notification") {
		notifications = notificationsMenu.run()
	}

	// frontend
	if slices.Contains(projectModules, "frontend") {
		// package manager
		fePackageManager = fePackageManagerMenu.run()

		// framework
		frontend = frontendMenu.run()
	}

	// features
	additionalFeatures = additionalFeaturesMenu.run()

	// confirmation
	err = huh.NewConfirm().
		Title("Are you sure? Once confirmed, your project will be created").
		Value(&isOk).
		Run()
	if err != nil {
		fmt.Printf(errorStyle.Render("┃ ✘ Failed to get choice: %s\n"), err.Error())
		os.Exit(1)
	}

	// start scaffolding
	templateData := map[string]any{
		"ProjectName": projectName,
		"Databases":   databases,
		"IsOk":        isOk,
	}

	createDirectory(projectName)

	err = spinner.New().
		Title("Initializing Go module...").
		Action(goModInit).
		Run()
	if err != nil {
		fmt.Printf(errorStyle.Render("┃ ✘ Failed to initialize go module: %s\n"), err.Error())
		os.Exit(1)
	}

	fmt.Println(successStyle.Render("✓ Go module initialized"))

	err = spinner.New().
		Title("Preparing project structure...").
		Action(func() {
			prepareProjectStructure(templateData)
		}).
		Run()
	if err != nil {
		fmt.Printf(errorStyle.Render("┃ ✘ Failed to prepare project structure: %s\n"), err.Error())
		os.Exit(1)
	}

	fmt.Println(successStyle.Render("✓ Project structure ready"))

	err = spinner.New().
		Title("Installing dependencies...").
		Action(goModTidy).
		Run()
	if err != nil {
		fmt.Printf(errorStyle.Render("┃ ✘ Failed to install dependencies: %s\n"), err.Error())
		os.Exit(1)
	}

	fmt.Println(successStyle.Render("✓ Dependencies installed"))

	err = spinner.New().
		Title("Cleaning up...").
		Action(cleanUp).
		Run()
	if err != nil {
		fmt.Printf(errorStyle.Render("┃ ✘ Failed to clean up: %s\n"), err.Error())
		os.Exit(1)
	}

	fmt.Println(successStyle.Render("✓ Cleanup done"))

	fmt.Printf(successStyle.Render("✓ Project '%s' created successfully!\n"), projectName)

	fmt.Println()

	fmt.Println("Go to your project directory:")
	fmt.Printf("\tcd %s\n", projectName)

	fmt.Println()

	fmt.Println("Run the project:")
	fmt.Printf("\tgo run cmd/app/main.go\n")

	fmt.Println()

	fmt.Println("Run the tests:")
	fmt.Printf("\tgo test ./...\n")

	fmt.Println()

	if slices.Contains(additionalFeatures, "fumadocs") {
		fmt.Println("Run the documentation:")
		fmt.Printf("\tgo run cmd/docs/main.go\n")

		fmt.Println()
	}

	fmt.Println("Happy coding! 🚀")
}

func createDirectory(projectName string) {
	if len(args) > 0 && args[0] == "test" {
		return
	}

	err := os.Mkdir(projectName, 0755)
	if err != nil {
		fmt.Printf("failed to create directory %s: %s\n", projectName, err.Error())
		os.Exit(1)
	}

	err = os.Chdir(projectName)
	if err != nil {
		fmt.Printf("failed to change directory to %s: %s\n", projectName, err.Error())
		os.Exit(1)
	}
}

func goModInit() {
	if len(args) > 0 && args[0] == "test" {
		time.Sleep(3 * time.Second)
		return
	}

	err := exec.Command("go", "mod", "init").Run()
	if err != nil {
		fmt.Printf("failed to run 'go mod init': %s\n", err.Error())
		os.Exit(1)
	}
}

func prepareProjectStructure(templateData map[string]any) {
	if len(args) > 0 && args[0] == "test" {
		time.Sleep(5 * time.Second)
		return
	}

	err := os.MkdirAll("cmd", 0755)
	if err != nil {
		fmt.Printf("failed to create cmd directory: %s\n", err.Error())
		os.Exit(1)
	}

	err = os.MkdirAll("config", 0755)
	if err != nil {
		fmt.Printf("failed to create config directory: %s\n", err.Error())
		os.Exit(1)
	}

	err = processTemplate("tmpl/cmd/main.go.gotmpl", "cmd/main.go", templateData)
	if err != nil {
		fmt.Printf("failed to process main.go template: %s\n", err.Error())
		os.Exit(1)
	}

	err = processTemplate("tmpl/config/app.go.gotmpl", "config/app.go", templateData)
	if err != nil {
		fmt.Printf("failed to process app.go template: %s\n", err.Error())
		os.Exit(1)
	}

	// for _, database := range databases {
	// 	err = processTemplate("tmpl/config/"+database+".go.gotmpl", "config/"+database+".go", templateData)
	// }
}

func goModTidy() {
	if len(args) > 0 && args[0] == "test" {
		time.Sleep(3 * time.Second)
		return
	}

	err := exec.Command("go", "mod", "tidy").Run()
	if err != nil {
		fmt.Printf("failed to run 'go mod tidy': %s\n", err.Error())
		os.Exit(1)
	}
}

func cleanUp() {
	if len(args) > 0 && args[0] == "test" {
		time.Sleep(2 * time.Second)
		return
	}

	err := exec.Command("gofmt", "-w", ".").Run()
	if err != nil {
		fmt.Printf("failed to run 'gofmt': %s\n", err.Error())
		os.Exit(1)
	}
}

func processTemplate(templatePath, outputPath string, data any) error {
	templateContent, err := tmplFS.ReadFile(templatePath)
	if err != nil {
		return err
	}

	tmpl, err := template.New(filepath.Base(templatePath)).Parse(string(templateContent))
	if err != nil {
		return err
	}

	outputFile, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer outputFile.Close()

	err = tmpl.Execute(outputFile, data)
	if err != nil {
		return err
	}

	return nil
}
