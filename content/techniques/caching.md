### Bộ nhớ đệm (Caching)

Bộ nhớ đệm là một **kỹ thuật** tuyệt vời và đơn giản giúp cải thiện hiệu suất ứng dụng của bạn. Nó đóng vai trò là kho lưu trữ dữ liệu tạm thời cung cấp khả năng truy cập dữ liệu hiệu suất cao.

#### Cài đặt (Installation)

Trước tiên hãy cài đặt các gói cần thiết:

```bash
$ npm install @nestjs/cache-manager cache-manager
```

> **Cảnh báo** `cache-manager` phiên bản 4 sử dụng giây cho `TTL (Thời gian sống)`. Phiên bản hiện tại của `cache-manager` (v5) đã chuyển sang sử dụng mili giây. NestJS không chuyển đổi giá trị và chỉ đơn giản chuyển tiếp ttl mà bạn cung cấp cho thư viện. Nói cách khác:
>
> - Nếu sử dụng `cache-manager` v4, cung cấp ttl bằng giây
> - Nếu sử dụng `cache-manager` v5, cung cấp ttl bằng mili giây
> - Tài liệu đang đề cập đến giây, vì NestJS được phát hành nhắm đến phiên bản 4 của cache-manager.

#### Bộ nhớ đệm trong bộ nhớ (In-memory cache)

Nest cung cấp API thống nhất cho các nhà cung cấp lưu trữ bộ nhớ đệm khác nhau. Bộ nhớ đệm tích hợp sẵn là kho dữ liệu trong bộ nhớ. Tuy nhiên, bạn có thể dễ dàng chuyển sang một giải pháp toàn diện hơn, như Redis.

Để bật bộ nhớ đệm, hãy nhập `CacheModule` và gọi phương thức `register()` của nó.

```typescript
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
})
export class AppModule {}
```

#### Tương tác với kho lưu trữ bộ nhớ đệm (Interacting with the Cache store)

Để tương tác với phiên bản trình quản lý bộ nhớ đệm, hãy tiêm nó vào lớp của bạn bằng cách sử dụng token `CACHE_MANAGER`, như sau:

```typescript
constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}
```

> **Gợi ý** Lớp `Cache` được nhập từ `cache-manager`, trong khi token `CACHE_MANAGER` từ gói `@nestjs/cache-manager`.

Phương thức `get` trên phiên bản `Cache` (từ gói `cache-manager`) được sử dụng để truy xuất các mục từ bộ nhớ đệm. Nếu mục không tồn tại trong bộ nhớ đệm, `null` sẽ được trả về.

```typescript
const value = await this.cacheManager.get('key');
```

Để thêm một mục vào bộ nhớ đệm, sử dụng phương thức `set`:

```typescript
await this.cacheManager.set('key', 'value');
```

> **Lưu ý** Kho lưu trữ bộ nhớ đệm trong bộ nhớ chỉ có thể lưu trữ các giá trị của các kiểu được hỗ trợ bởi [thuật toán clone có cấu trúc](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#javascript_types).

Thời gian hết hạn mặc định của bộ nhớ đệm là 5 giây.

Bạn có thể chỉ định thủ công một TTL (thời gian hết hạn tính bằng giây) cho khóa cụ thể này, như sau:

```typescript
await this.cacheManager.set('key', 'value', 1000);
```

Để vô hiệu hóa việc hết hạn của bộ nhớ đệm, đặt thuộc tính cấu hình `ttl` thành `0`:

```typescript
await this.cacheManager.set('key', 'value', 0);
```

Để xóa một mục khỏi bộ nhớ đệm, sử dụng phương thức `del`:

```typescript
await this.cacheManager.del('key');
```

Để xóa toàn bộ bộ nhớ đệm, sử dụng phương thức `reset`:

```typescript
await this.cacheManager.reset();
```

#### Tự động lưu trữ đệm phản hồi (Auto-caching responses)

> **Cảnh báo** Trong các ứng dụng [GraphQL](/graphql/quick-start), các interceptor được thực thi riêng biệt cho mỗi trình giải quyết trường. Do đó, `CacheModule` (sử dụng interceptor để lưu trữ đệm phản hồi) sẽ không hoạt động đúng cách.

Để bật tự động lưu trữ đệm phản hồi, chỉ cần liên kết `CacheInterceptor` nơi bạn muốn lưu trữ đệm dữ liệu.

```typescript
@Controller()
@UseInterceptors(CacheInterceptor)
export class AppController {
  @Get()
  findAll(): string[] {
    return [];
  }
}
```

> **Cảnh báo** Chỉ các điểm cuối `GET` được lưu trữ trong bộ nhớ đệm. Ngoài ra, các tuyến đường máy chủ HTTP tiêm đối tượng phản hồi gốc (`@Res()`) không thể sử dụng Interceptor Bộ nhớ đệm. Xem
> <a href="https://docs.nestjs.com/interceptors#response-mapping">ánh xạ phản hồi</a> để biết thêm chi tiết.

Để giảm lượng mã lặp lại cần thiết, bạn có thể liên kết `CacheInterceptor` với tất cả các điểm cuối trên toàn cục:

```typescript
import { Module } from '@nestjs/common';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [CacheModule.register()],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
```

#### Tùy chỉnh bộ nhớ đệm (Customize caching)

Tất cả dữ liệu được lưu trữ trong bộ nhớ đệm đều có thời gian hết hạn riêng ([TTL](https://en.wikipedia.org/wiki/Time_to_live)). Để tùy chỉnh giá trị mặc định, hãy truyền đối tượng tùy chọn vào phương thức `register()`.

```typescript
CacheModule.register({
  ttl: 5, // giây
  max: 10, // số lượng mục tối đa trong bộ nhớ đệm
});
```

#### Sử dụng module toàn cục (Use module globally)

Khi bạn muốn sử dụng `CacheModule` trong các module khác, bạn sẽ cần nhập nó (như thông thường với bất kỳ module Nest nào). Hoặc, khai báo nó như một [module toàn cục](https://docs.nestjs.com/modules#global-modules) bằng cách đặt thuộc tính `isGlobal` của đối tượng tùy chọn thành `true`, như được hiển thị bên dưới. Trong trường hợp đó, bạn sẽ không cần nhập `CacheModule` trong các module khác sau khi nó đã được tải trong module gốc (ví dụ: `AppModule`).

```typescript
CacheModule.register({
  isGlobal: true,
});
```

#### Ghi đè bộ nhớ đệm toàn cục (Global cache overrides)

Trong khi bộ nhớ đệm toàn cục được bật, các mục được lưu trữ trong bộ nhớ đệm được lưu trữ dưới một `CacheKey` được tự động tạo dựa trên đường dẫn tuyến. Bạn có thể ghi đè một số cài đặt bộ nhớ đệm nhất định (`@CacheKey()` và `@CacheTTL()`) trên cơ sở từng phương thức, cho phép các chiến lược lưu trữ đệm tùy chỉnh cho các phương thức điều khiển riêng lẻ. Điều này có thể phù hợp nhất khi sử dụng [các kho lưu trữ bộ nhớ đệm khác nhau.](https://docs.nestjs.com/techniques/caching#different-stores)

Bạn có thể áp dụng decorator `@CacheTTL()` trên cơ sở từng bộ điều khiển để đặt TTL lưu trữ đệm cho toàn bộ bộ điều khiển. Trong các tình huống mà cả cài đặt TTL bộ nhớ đệm ở cấp bộ điều khiển và cấp phương thức được định nghĩa, cài đặt TTL bộ nhớ đệm được chỉ định ở cấp phương thức sẽ được ưu tiên hơn so với cài đặt ở cấp bộ điều khiển.

```typescript
@Controller()
@CacheTTL(50)
export class AppController {
  @CacheKey('custom_key')
  @CacheTTL(20)
  findAll(): string[] {
    return [];
  }
}
```

> **Gợi ý** Các decorator `@CacheKey()` và `@CacheTTL()` được nhập từ gói `@nestjs/cache-manager`.

Decorator `@CacheKey()` có thể được sử dụng với hoặc không có decorator `@CacheTTL()` tương ứng và ngược lại. Người dùng có thể chọn chỉ ghi đè `@CacheKey()` hoặc chỉ `@CacheTTL()`. Các cài đặt không được ghi đè bằng decorator sẽ sử dụng các giá trị mặc định được đăng ký toàn cục (xem [Tùy chỉnh bộ nhớ đệm](https://docs.nestjs.com/techniques/caching#customize-caching)).

#### WebSockets và Microservices

Bạn cũng có thể áp dụng `CacheInterceptor` cho các người đăng ký WebSocket cũng như các mẫu của Microservice (bất kể phương thức truyền tải nào đang được sử dụng).

```typescript
@@filename()
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
@@switch
@CacheKey('events')
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
```

Tuy nhiên, decorator `@CacheKey()` bổ sung là cần thiết để chỉ định một khóa được sử dụng để lưu trữ và truy xuất dữ liệu được lưu trong bộ nhớ đệm sau đó. Ngoài ra, xin lưu ý rằng bạn **không nên lưu trữ đệm mọi thứ**. Các hành động thực hiện một số hoạt động kinh doanh thay vì chỉ truy vấn dữ liệu không bao giờ nên được lưu trữ trong bộ nhớ đệm.

Ngoài ra, bạn có thể chỉ định thời gian hết hạn bộ nhớ đệm (TTL) bằng cách sử dụng decorator `@CacheTTL()`, điều này sẽ ghi đè giá trị TTL mặc định toàn cục.

```typescript
@@filename()
@CacheTTL(10)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client: Client, data: string[]): Observable<string[]> {
  return [];
}
@@switch
@CacheTTL(10)
@UseInterceptors(CacheInterceptor)
@SubscribeMessage('events')
handleEvent(client, data) {
  return [];
}
```

> **Gợi ý** Decorator `@CacheTTL()` có thể được sử dụng với hoặc không có decorator `@CacheKey()` tương ứng.

#### Điều chỉnh theo dõi (Adjust tracking)

Mặc định, Nest sử dụng URL yêu cầu (trong ứng dụng HTTP) hoặc khóa bộ nhớ đệm (trong ứng dụng websockets và microservices, được đặt thông qua decorator `@CacheKey()`) để liên kết các bản ghi bộ nhớ đệm với các điểm cuối của bạn. Tuy nhiên, đôi khi bạn có thể muốn thiết lập theo dõi dựa trên các yếu tố khác nhau, ví dụ, sử dụng các tiêu đề HTTP (ví dụ: `Authorization` để xác định đúng các điểm cuối `profile`).

Để thực hiện điều đó, hãy tạo một lớp con của `CacheInterceptor` và ghi đè phương thức `trackBy()`.

```typescript
@Injectable()
class HttpCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    return 'key';
  }
}
```

#### Các kho lưu trữ khác nhau (Different stores)

Dịch vụ này tận dụng [cache-manager](https://github.com/node-cache-manager/node-cache-manager) ở bên dưới. Gói `cache-manager` hỗ trợ một loạt các kho lưu trữ hữu ích, ví dụ như [kho lưu trữ Redis](https://github.com/dabroek/node-cache-manager-redis-store). Danh sách đầy đủ các kho lưu trữ được hỗ trợ có sẵn [tại đây](https://github.com/node-cache-manager/node-cache-manager#store-engines). Để thiết lập kho lưu trữ Redis, chỉ cần truyền gói cùng với các tùy chọn tương ứng vào phương thức `register()`.

```typescript
import type { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-redis-store';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';

@Module({
  imports: [
    CacheModule.register<RedisClientOptions>({
      store: redisStore,

      // Cấu hình cụ thể cho kho lưu trữ:
      host: 'localhost',
      port: 6379,
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

> **Cảnh báo** `cache-manager-redis-store` không hỗ trợ redis v4. Để giao diện `ClientOpts` tồn tại và hoạt động đúng, bạn cần cài đặt phiên bản chính mới nhất của `redis` 3.x.x. Xem [vấn đề](https://github.com/dabroek/node-cache-manager-redis-store/issues/40) này để theo dõi tiến trình nâng cấp này.

#### Cấu hình bất đồng bộ (Async configuration)

Bạn có thể muốn truyền các tùy chọn module một cách bất đồng bộ thay vì truyền chúng tĩnh tại thời điểm biên dịch. Trong trường hợp này, hãy sử dụng phương thức `registerAsync()`, cung cấp một số cách để xử lý cấu hình bất đồng bộ.

Một cách tiếp cận là sử dụng hàm factory:

```typescript
CacheModule.registerAsync({
  useFactory: () => ({
    ttl: 5,
  }),
});
```

Factory của chúng ta hoạt động giống như tất cả các factory module bất đồng bộ khác (nó có thể là `async` và có khả năng tiêm các phụ thuộc thông qua `inject`).

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    ttl: configService.get('CACHE_TTL'),
  }),
  inject: [ConfigService],
});
```

Ngoài ra, bạn có thể sử dụng phương thức `useClass`:

```typescript
CacheModule.registerAsync({
  useClass: CacheConfigService,
});
```

Cấu trúc trên sẽ khởi tạo `CacheConfigService` bên trong `CacheModule` và sẽ sử dụng nó để lấy đối tượng tùy chọn. `CacheConfigService` phải triển khai giao diện `CacheOptionsFactory` để cung cấp các tùy chọn cấu hình:

```typescript
@Injectable()
class CacheConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      ttl: 5,
    };
  }
}
```

Nếu bạn muốn sử dụng một nhà cung cấp cấu hình hiện có được nhập từ một module khác, hãy sử dụng cú pháp `useExisting`:

```typescript
CacheModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Điều này hoạt động giống như `useClass` với một sự khác biệt quan trọng - `CacheModule` sẽ tìm kiếm các module đã nhập để tái sử dụng bất kỳ `ConfigService` nào đã được tạo, thay vì khởi tạo một cái mới của riêng nó.

> **Gợi ý** `CacheModule#register` và `CacheModule#registerAsync` và `CacheOptionsFactory` có một generic tùy chọn (đối số kiểu) để thu hẹp các tùy chọn cấu hình cụ thể cho kho lưu trữ, làm cho nó an toàn về kiểu.

#### Ví dụ (Example)

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/20-cache).
