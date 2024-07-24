### Giới hạn tốc độ (Rate Limiting)

Một kỹ thuật phổ biến để bảo vệ ứng dụng khỏi các cuộc tấn công brute-force là **giới hạn tốc độ**. Để bắt đầu, bạn cần cài đặt gói `@nestjs/throttler`.

```bash
$ npm i --save @nestjs/throttler
```

Sau khi cài đặt hoàn tất, `ThrottlerModule` có thể được cấu hình như bất kỳ gói Nest nào khác với các phương thức `forRoot` hoặc `forRootAsync`.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
})
export class AppModule {}
```

Điều trên sẽ thiết lập các tùy chọn toàn cục cho `ttl`, thời gian tồn tại tính bằng mili giây, và `limit`, số lượng yêu cầu tối đa trong khoảng thời gian ttl, cho các route của ứng dụng được bảo vệ.

Sau khi module được import, bạn có thể chọn cách ràng buộc `ThrottlerGuard`. Bất kỳ loại ràng buộc nào được đề cập trong phần [guards](https://docs.nestjs.com/guards) đều được chấp nhận. Ví dụ, nếu bạn muốn ràng buộc guard một cách toàn cục, bạn có thể thêm provider này vào bất kỳ module nào:

```typescript
{
  provide: APP_GUARD,
  useClass: ThrottlerGuard
}
```

#### Nhiều định nghĩa Throttler (Multiple Throttler Definitions)

Có thể có những lúc bạn muốn thiết lập nhiều định nghĩa giới hạn tốc độ, như không quá 3 cuộc gọi trong một giây, 20 cuộc gọi trong 10 giây và 100 cuộc gọi trong một phút. Để làm điều này, bạn có thể thiết lập các định nghĩa của mình trong mảng với các tùy chọn được đặt tên, sau đó có thể được tham chiếu trong các decorator `@SkipThrottle()` và `@Throttle()` để thay đổi các tùy chọn lại.

```typescript
@@filename(app.module)
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100
      }
    ]),
  ],
})
export class AppModule {}
```

#### Tùy chỉnh (Customization)

Có thể có lúc bạn muốn ràng buộc guard cho một controller hoặc toàn cục, nhưng muốn vô hiệu hóa giới hạn tốc độ cho một hoặc nhiều endpoint của bạn. Để làm điều đó, bạn có thể sử dụng decorator `@SkipThrottle()`, để phủ định throttler cho cả một lớp hoặc một route đơn lẻ. Decorator `@SkipThrottle()` cũng có thể nhận một đối tượng có các khóa là chuỗi với giá trị boolean trong trường hợp bạn muốn loại trừ _hầu hết_ một controller, nhưng không phải mọi route, và cấu hình nó cho mỗi bộ throttler nếu bạn có nhiều hơn một. Nếu bạn không truyền một đối tượng, mặc định là sử dụng `{{ '{' }} default: true {{ '}' }}`

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {}
```

Decorator `@SkipThrottle()` này có thể được sử dụng để bỏ qua một route hoặc một lớp hoặc để phủ định việc bỏ qua một route trong một lớp đã được bỏ qua.

```typescript
@SkipThrottle()
@Controller('users')
export class UsersController {
  // Giới hạn tốc độ được áp dụng cho route này.
  @SkipThrottle({ default: false })
  dontSkip() {
    return 'List users work with Rate limiting.';
  }
  // Route này sẽ bỏ qua giới hạn tốc độ.
  doSkip() {
    return 'List users work without Rate limiting.';
  }
}
```

Cũng có decorator `@Throttle()` có thể được sử dụng để ghi đè `limit` và `ttl` được thiết lập trong module toàn cục, để cung cấp các tùy chọn bảo mật chặt chẽ hơn hoặc lỏng lẻo hơn. Decorator này cũng có thể được sử dụng trên một lớp hoặc một hàm. Từ phiên bản 5 trở đi, decorator nhận vào một đối tượng với chuỗi liên quan đến tên của bộ throttler, và một đối tượng với các khóa limit và ttl và giá trị số nguyên, tương tự như các tùy chọn được truyền vào module gốc. Nếu bạn không có tên được đặt trong các tùy chọn ban đầu của mình, hãy sử dụng chuỗi `default`. Bạn phải cấu hình nó như sau:

```typescript
// Ghi đè cấu hình mặc định cho Giới hạn tốc độ và thời lượng.
@Throttle({ default: { limit: 3, ttl: 60000 } })
@Get()
findAll() {
  return "List users works with custom rate limiting.";
}
```

#### Proxy (Proxies)

Nếu ứng dụng của bạn chạy sau một máy chủ proxy, hãy kiểm tra các tùy chọn bộ điều hợp HTTP cụ thể ([express](http://expressjs.com/en/guide/behind-proxies.html) và [fastify](https://www.fastify.io/docs/latest/Reference/Server/#trustproxy)) cho tùy chọn `trust proxy` và bật nó. Làm như vậy sẽ cho phép bạn lấy địa chỉ IP gốc từ header `X-Forwarded-For`, và bạn có thể ghi đè phương thức `getTracker()` để lấy giá trị từ header thay vì từ `req.ip`. Ví dụ sau hoạt động với cả express và fastify:

```typescript
// throttler-behind-proxy.guard.ts
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip; // cá nhân hóa việc trích xuất IP để đáp ứng nhu cầu của riêng bạn
  }
}

// app.controller.ts
import { ThrottlerBehindProxyGuard } from './throttler-behind-proxy.guard';

@UseGuards(ThrottlerBehindProxyGuard)
```

> info **Gợi ý** Bạn có thể tìm thấy API của đối tượng Request `req` cho express [tại đây](https://expressjs.com/en/api.html#req.ips) và cho fastify [tại đây](https://www.fastify.io/docs/latest/Reference/Request/).

#### Websocket

Module này có thể hoạt động với websocket, nhưng nó yêu cầu một số mở rộng lớp. Bạn có thể mở rộng `ThrottlerGuard` và ghi đè phương thức `handleRequest` như sau:

```typescript
@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(context: ExecutionContext, limit: number, ttl: number, throttler: ThrottlerOptions): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const ip = client._socket.remoteAddress;
    const key = this.generateKey(context, ip, throttler.name);
    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      throw new ThrottlerException();
    }

    return true;
  }
}
```

> info **Gợi ý** Nếu bạn đang sử dụng ws, cần thay thế `_socket` bằng `conn`

Có một vài điều cần lưu ý khi làm việc với WebSocket:

- Guard không thể được đăng ký với `APP_GUARD` hoặc `app.useGlobalGuards()`
- Khi đạt đến giới hạn, Nest sẽ phát ra một sự kiện `exception`, vì vậy hãy đảm bảo có một listener sẵn sàng cho điều này

> info **Gợi ý** Nếu bạn đang sử dụng gói `@nestjs/platform-ws`, bạn có thể sử dụng `client._socket.remoteAddress` thay thế.

#### GraphQL

`ThrottlerGuard` cũng có thể được sử dụng để làm việc với các yêu cầu GraphQL. Một lần nữa, guard có thể được mở rộng, nhưng lần này phương thức `getRequestResponse` sẽ được ghi đè

```typescript
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }
}
```

#### Cấu hình (Configuration)

Các tùy chọn sau đây là hợp lệ cho đối tượng được truyền vào mảng của tùy chọn `ThrottlerModule`:

<table>
  <tr>
    <td><code>name</code></td>
    <td>tên để theo dõi nội bộ về bộ throttler nào đang được sử dụng. Mặc định là `default` nếu không được truyền</td>
  </tr>
  <tr>
    <td><code>ttl</code></td>
    <td>số mili giây mà mỗi yêu cầu sẽ tồn tại trong bộ nhớ</td>
  </tr>
  <tr>
    <td><code>limit</code></td>
    <td>số lượng yêu cầu tối đa trong giới hạn TTL</td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>một mảng các biểu thức chính quy của user-agent để bỏ qua khi đến lượt giới hạn tốc độ yêu cầu</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td>một hàm nhận vào <code>ExecutionContext</code> và trả về một <code>boolean</code> để ngắn mạch logic throttler. Giống như <code>@SkipThrottler()</code>, nhưng dựa trên yêu cầu</td>
  </tr>
</table>

Nếu bạn cần thiết lập bộ nhớ thay thế, hoặc muốn sử dụng một số tùy chọn trên theo nghĩa toàn cục hơn, áp dụng cho mỗi bộ throttler, bạn có thể truyền các tùy chọn trên thông qua khóa tùy chọn `throttlers` và sử dụng bảng dưới đây

<table>
  <tr>
    <td><code>storage</code></td>
    <td>một dịch vụ lưu trữ tùy chỉnh cho nơi theo dõi việc giới hạn tốc độ. <a href="/security/rate-limiting#storages">Xem tại đây.</a></td>
  </tr>
  <tr>
    <td><code>ignoreUserAgents</code></td>
    <td>một mảng các biểu thức chính quy của user-agent để bỏ qua khi đến lượt giới hạn tốc độ yêu cầu</td>
  </tr>
  <tr>
    <td><code>skipIf</code></td>
    <td>một hàm nhận vào <code>ExecutionContext</code> và trả về một <code>boolean</code> để ngắn mạch logic throttler. Giống như <code>@SkipThrottler()</code>, nhưng dựa trên yêu cầu</td>
  </tr>
  <tr>
    <td><code>throttlers</code></td>
    <td>một mảng các bộ throttler, được định nghĩa sử dụng bảng ở trên</td>
  </tr>
</table>

#### Cấu hình bất đồng bộ (Async Configuration)

Bạn có thể muốn lấy cấu hình giới hạn tốc độ của mình một cách bất đồng bộ thay vì đồng bộ. Bạn có thể sử dụng phương thức `forRootAsync()`, cho phép dependency injection và các phương thức `async`.

Một cách tiếp cận là sử dụng hàm factory:

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL'),
          limit: config.get('THROTTLE_LIMIT'),
        },
      ],
    }),
  ],
})
export class AppModule {}
```

Bạn cũng có thể sử dụng cú pháp `useClass`:

```typescript
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useClass: ThrottlerConfigService,
    }),
  ],
})
export class AppModule {}
```

Điều này có thể thực hiện được, miễn là `ThrottlerConfigService` triển khai giao diện `ThrottlerOptionsFactory`.

#### Bộ nhớ (Storages)

Bộ nhớ tích hợp là một bộ nhớ cache trong bộ nhớ theo dõi các yêu cầu được thực hiện cho đến khi chúng đã vượt qua TTL được thiết lập bởi các tùy chọn toàn cục. Bạn có thể thả vào tùy chọn bộ nhớ của riêng mình vào tùy chọn `storage` của `ThrottlerModule` miễn là lớp đó triển khai giao diện `ThrottlerStorage`.

Đối với các máy chủ phân tán, bạn có thể sử dụng nhà cung cấp bộ nhớ cộng đồng cho [Redis](https://github.com/kkoomen/nestjs-throttler-storage-redis) để có một nguồn sự thật duy nhất.

> info **Lưu ý** `ThrottlerStorage` có thể được import từ `@nestjs/throttler`.

#### Trợ giúp thời gian (Time Helpers)

Có một vài phương thức trợ giúp để làm cho thời gian dễ đọc hơn nếu bạn thích sử dụng chúng thay vì định nghĩa trực tiếp. `@nestjs/throttler` xuất ra năm trợ giúp khác nhau, `seconds`, `minutes`, `hours`, `days`, và `weeks`. Để sử dụng chúng, chỉ cần gọi `seconds(5)` hoặc bất kỳ trợ giúp nào khác, và số mili giây chính xác sẽ được trả về.

#### Hướng dẫn chuyển đổi (Migration Guide)

Đối với hầu hết mọi người, việc bọc các tùy chọn của bạn trong một mảng sẽ là đủ.

Nếu bạn đang sử dụng bộ nhớ tùy chỉnh, bạn nên bọc `ttl` và `limit` của bạn trong một
mảng và gán nó cho thuộc tính `throttlers` của đối tượng tùy chọn.

Bất kỳ `@ThrottleSkip()` nào bây giờ cũng nên nhận vào một đối tượng với các thuộc tính `string: boolean`.
Các chuỗi là tên của các throttler. Nếu bạn không có tên, hãy truyền chuỗi
`'default'`, vì đây là cái sẽ được sử dụng ngầm định nếu không.

Bất kỳ decorator `@Throttle()` nào cũng nên bây giờ nhận vào một đối tượng với các khóa chuỗi,
liên quan đến tên của các ngữ cảnh throttler (lại là `'default'` nếu không có tên)
và giá trị của các đối tượng có khóa `limit` và `ttl`.

> Cảnh báo **Quan trọng** `ttl` bây giờ là trong **mili giây**. Nếu bạn muốn giữ ttl của mình
> trong giây để dễ đọc, hãy sử dụng trợ giúp `seconds` từ gói này. Nó chỉ
> nhân ttl với 1000 để biến nó thành mili giây.

Để biết thêm thông tin, xem [Changelog](https://github.com/nestjs/throttler/blob/master/CHANGELOG.md#500)
