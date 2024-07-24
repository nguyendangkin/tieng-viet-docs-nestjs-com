import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent implements OnInit {
  @Input()
  isSidebarOpened = true;
  readonly items = [
    {
      title: '(Giới thiệu ) Introduction',
      isOpened: false,
      path: '/',
    },
    {
      title: '(Tổng quan) Overview',
      isOpened: true,
      children: [
        { title: '(Những bước đầu tiên) First steps', path: '/first-steps' },
        { title: '(Bộ điều khiển) Controllers', path: '/controllers' },
        { title: '(Nhà cung cấp) Providers', path: '/providers' },
        { title: '(Các Module) Modules', path: '/modules' },
        { title: '(Phần mềm trung gian) Middleware', path: '/middleware' },
        {
          title: '(Bộ lọc ngoại lệ) Exception filters',
          path: '/exception-filters',
        },
        { title: '(Ống dẫn) Pipes', path: '/pipes' },
        { title: '(Bảo vệ) Guards', path: '/guards' },
        { title: '(Bộ đánh chặn) Interceptors', path: '/interceptors' },
        {
          title: '(Decorator tùy chỉnh) Custom decorators',
          path: '/custom-decorators',
        },
      ],
    },
    {
      title: '(Cơ bản) Fundamentals',
      isOpened: false,
      children: [
        {
          title: '(Nhà cung cấp tùy chỉnh) Custom providers',
          path: '/fundamentals/custom-providers',
        },
        {
          title: '(Nhà cung cấp bất đồng bộ) Asynchronous providers',
          path: '/fundamentals/async-providers',
        },
        {
          title: '(Các module động) Dynamic modules',
          path: '/fundamentals/dynamic-modules',
        },
        {
          title: '(Phạm vi tiêm phụ thuộc) Injection scopes',
          path: '/fundamentals/injection-scopes',
        },
        {
          title: '(Phụ thuộc vòng tròn) Circular dependency',
          path: '/fundamentals/circular-dependency',
        },
        {
          title: '(Tham chiếu Module) Module reference',
          path: '/fundamentals/module-ref',
        },
        {
          title: '(Tải các module lười biếng) Lazy-loading modules',
          path: '/fundamentals/lazy-loading-modules',
        },
        {
          title: '(Ngữ cảnh thực thi) Execution context',
          path: '/fundamentals/execution-context',
        },
        {
          title: '(Các sự kiện vòng đời) Lifecycle events',
          path: '/fundamentals/lifecycle-events',
        },
        {
          title: '(Tính không phụ thuộc nền tảng) Platform agnosticism',
          path: '/fundamentals/platform-agnosticism',
        },
        { title: '(Kiểm thử) Testing', path: '/fundamentals/testing' },
      ],
    },
    {
      title: '(Kỹ thuật) Techniques',
      isOpened: false,
      children: [
        {
          title: '(Cấu hình) Configuration',
          path: '/techniques/configuration',
        },
        { title: '(Cơ sở dữ liệu) Database', path: '/techniques/database' },
        { title: 'Mongo', path: '/techniques/mongodb' },
        { title: '(Xác thực) Validation', path: '/techniques/validation' },
        { title: 'Bộ nhớ đệm (Caching)', path: '/techniques/caching' },
        {
          title: 'Tuần tự hóa (Serialization)',
          path: '/techniques/serialization',
        },
        {
          title: 'Quản lý phiên bản (Versioning)',
          path: '/techniques/versioning',
        },
        {
          title: 'Lập lịch công việc (Task Scheduling)',
          path: '/techniques/task-scheduling',
        },
        { title: 'Hàng đợi (Queues)', path: '/techniques/queues' },
        { title: 'Ghi nhật ký (Logging)', path: '/techniques/logger' },
        { title: 'Cookies', path: '/techniques/cookies' },
        { title: 'Sự kiện (Events)', path: '/techniques/events' },
        { title: 'Nén (Compression)', path: '/techniques/compression' },
        { title: 'Tải lên tệp (File upload)', path: '/techniques/file-upload' },
        {
          title: 'Truyền phát tệp tin (Streaming files)',
          path: '/techniques/streaming-files',
        },
        { title: 'HTTP module', path: '/techniques/http-module' },
        { title: 'Phiên (Session)', path: '/techniques/session' },
        { title: 'Model-View-Controller', path: '/techniques/mvc' },
        {
          title: 'Hiệu suất (Performance) (Fastify)',
          path: '/techniques/performance',
        },
        {
          title: 'Sự kiện gửi từ máy chủ (Server-Sent Events)',
          path: '/techniques/server-sent-events',
        },
      ],
    },
    {
      title: '(Bảo mật) Security',
      isOpened: false,
      children: [
        {
          title: 'Xác thực (Authentication)',
          path: '/security/authentication',
        },
        { title: 'Ủy quyền (Authorization)', path: '/security/authorization' },
        {
          title: 'Mã hóa và Băm (Encryption and Hashing)',
          path: '/security/encryption-and-hashing',
        },
        { title: 'Mũ bảo hiểm (Helmet)', path: '/security/helmet' },
        { title: 'CORS', path: '/security/cors' },
        { title: 'Bảo vệ CSRF (CSRF Protection)', path: '/security/csrf' },
        {
          title: 'Giới hạn tốc độ (Rate Limiting)',
          path: '/security/rate-limiting',
        },
      ],
    },
    {
      title: 'GraphQL',
      isOpened: false,
      children: [
        { title: 'Quick start', path: '/graphql/quick-start' },
        { title: 'Resolvers', path: '/graphql/resolvers' },
        { title: 'Mutations', path: '/graphql/mutations' },
        { title: 'Subscriptions', path: '/graphql/subscriptions' },
        { title: 'Scalars', path: '/graphql/scalars' },
        { title: 'Directives', path: '/graphql/directives' },
        { title: 'Interfaces', path: '/graphql/interfaces' },
        { title: 'Unions and Enums', path: '/graphql/unions-and-enums' },
        { title: 'Field middleware', path: '/graphql/field-middleware' },
        { title: 'Mapped types', path: '/graphql/mapped-types' },
        { title: 'Plugins', path: '/graphql/plugins' },
        { title: 'Complexity', path: '/graphql/complexity' },
        { title: 'Extensions', path: '/graphql/extensions' },
        { title: 'CLI Plugin', path: '/graphql/cli-plugin' },
        { title: 'Generating SDL', path: '/graphql/generating-sdl' },
        { title: 'Sharing models', path: '/graphql/sharing-models' },
        {
          title: 'Other features',
          path: '/graphql/other-features',
        },
        { title: 'Federation', path: '/graphql/federation' },
        { title: 'Migration guide', path: '/graphql/migration-guide' },
      ],
    },
    {
      title: 'WebSockets',
      isOpened: false,
      children: [
        { title: 'Gateways', path: '/websockets/gateways' },
        { title: 'Exception filters', path: '/websockets/exception-filters' },
        { title: 'Pipes', path: '/websockets/pipes' },
        { title: 'Guards', path: '/websockets/guards' },
        { title: 'Interceptors', path: '/websockets/interceptors' },
        { title: 'Adapters', path: '/websockets/adapter' },
      ],
    },
    {
      title: 'Microservices',
      isOpened: false,
      children: [
        { title: 'Overview', path: '/microservices/basics' },
        { title: 'Redis', path: '/microservices/redis' },
        { title: 'MQTT', path: '/microservices/mqtt' },
        { title: 'NATS', path: '/microservices/nats' },
        { title: 'RabbitMQ', path: '/microservices/rabbitmq' },
        { title: 'Kafka', path: '/microservices/kafka' },
        { title: 'gRPC', path: '/microservices/grpc' },
        {
          title: 'Custom transporters',
          path: '/microservices/custom-transport',
        },
        {
          title: 'Exception filters',
          path: '/microservices/exception-filters',
        },
        { title: 'Pipes', path: '/microservices/pipes' },
        { title: 'Guards', path: '/microservices/guards' },
        { title: 'Interceptors', path: '/microservices/interceptors' },
      ],
    },
    {
      title: 'Standalone apps',
      isOpened: false,
      path: '/standalone-applications',
    },
    {
      title: 'CLI',
      isOpened: false,
      children: [
        { title: 'Overview', path: '/cli/overview' },
        { title: 'Workspaces', path: '/cli/monorepo' },
        { title: 'Libraries', path: '/cli/libraries' },
        { title: 'Usage', path: '/cli/usages' },
        { title: 'Scripts', path: '/cli/scripts' },
      ],
    },
    {
      title: 'OpenAPI',
      isOpened: false,
      children: [
        { title: 'Introduction', path: '/openapi/introduction' },
        {
          title: 'Types and Parameters',
          path: '/openapi/types-and-parameters',
        },
        { title: 'Operations', path: '/openapi/operations' },
        { title: 'Security', path: '/openapi/security' },
        { title: 'Mapped Types', path: '/openapi/mapped-types' },
        { title: 'Decorators', path: '/openapi/decorators' },
        { title: 'CLI Plugin', path: '/openapi/cli-plugin' },
        { title: 'Other features', path: '/openapi/other-features' },
        { title: 'Migration guide', path: '/openapi/migration-guide' },
      ],
    },
    {
      title: '(Code mẫu) Recipes',
      isOpened: false,
      children: [
        { title: '(Đọc-Đánh giá-In-Lặp) REPL', path: '/recipes/repl' },
        {
          title: '(Trình tạo CRUD) CRUD generator',
          path: '/recipes/crud-generator',
        },
        {
          title: 'SWC (Trình biên dịch Web nhanh chóng)',
          path: '/recipes/swc',
        },
        { title: 'Passport (auth)', path: '/recipes/passport' },
        { title: 'Hot reload', path: '/recipes/hot-reload' },
        { title: 'MikroORM', path: '/recipes/mikroorm' },
        { title: 'TypeORM', path: '/recipes/sql-typeorm' },
        { title: 'Mongoose', path: '/recipes/mongodb' },
        { title: 'Sequelize', path: '/recipes/sql-sequelize' },
        { title: 'Router module', path: '/recipes/router-module' },
        { title: 'Swagger', path: '/recipes/swagger' },
        { title: 'Health checks', path: '/recipes/terminus' },
        { title: 'CQRS', path: '/recipes/cqrs' },
        { title: 'Compodoc', path: '/recipes/documentation' },
        { title: 'Prisma', path: '/recipes/prisma' },
        { title: 'Serve static', path: '/recipes/serve-static' },
        { title: 'Commander', path: '/recipes/nest-commander' },
        { title: 'Async local storage', path: '/recipes/async-local-storage' },
        { title: 'Automock', path: '/recipes/automock' },
      ],
    },
    {
      title: 'FAQ',
      isOpened: false,
      children: [
        { title: 'Serverless', path: '/faq/serverless' },
        { title: 'HTTP adapter', path: '/faq/http-adapter' },
        {
          title: 'Keep-Alive connections',
          path: '/faq/keep-alive-connections',
        },
        { title: 'Global path prefix', path: '/faq/global-prefix' },
        { title: 'Raw body', path: '/faq/raw-body' },
        { title: 'Hybrid application', path: '/faq/hybrid-application' },
        { title: 'HTTPS & multiple servers', path: '/faq/multiple-servers' },
        { title: 'Request lifecycle', path: '/faq/request-lifecycle' },
        { title: 'Common errors', path: '/faq/common-errors' },
        {
          title: 'Examples',
          externalUrl: 'https://github.com/nestjs/nest/tree/master/sample',
        },
      ],
    },
    {
      title: 'Devtools',
      isNew: true,
      isOpened: false,
      children: [
        { title: 'Overview', path: '/devtools/overview' },
        { title: 'CI/CD integration', path: '/devtools/ci-cd-integration' },
      ],
    },
    {
      title: 'Migration guide',
      isOpened: false,
      path: '/migration-guide',
    },
    {
      title: 'Official courses',
      externalUrl: 'https://courses.nestjs.com/',
    },
    {
      title: 'Discover',
      isOpened: false,
      children: [
        { title: 'Who is using Nest?', path: '/discover/companies' },
        { title: 'Jobs board', externalUrl: 'https://jobs.nestjs.com/' },
      ],
    },
    // {
    //   title: 'T-Shirts and Hoodies',
    //   externalUrl: 'https://nestjs.threadless.com/',
    // },
    {
      title: 'Support us',
      isOpened: false,
      path: '/support',
    },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((ev) => ev instanceof NavigationEnd))
      .subscribe((event) => this.toggleCategory());

    this.toggleCategory();
  }

  toggleCategory() {
    const { firstChild } = this.route.snapshot;
    if (
      (firstChild.url && firstChild.url[1]) ||
      (firstChild.url &&
        firstChild.routeConfig &&
        firstChild.routeConfig.loadChildren)
    ) {
      const { path } = firstChild.url[0];
      const index = this.items.findIndex(
        ({ title }) => title.toLowerCase() === path,
      );
      if (index < 0) {
        return;
      }
      this.items[index].isOpened = true;
      this.items[1].isOpened = false;
    }
  }
}
