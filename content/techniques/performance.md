### Hiệu suất (Performance) (Fastify)

Mặc định, Nest sử dụng framework [Express](https://expressjs.com/). Như đã đề cập trước đó, Nest cũng cung cấp khả năng tương thích với các thư viện khác như [Fastify](https://github.com/fastify/fastify). Nest đạt được sự độc lập về framework này bằng cách triển khai một bộ điều hợp framework, có chức năng chính là ủy quyền middleware và trình xử lý cho các triển khai cụ thể phù hợp với thư viện.

> info **Gợi ý** Lưu ý rằng để một bộ điều hợp framework được triển khai, thư viện mục tiêu phải cung cấp quy trình xử lý pipeline yêu cầu/phản hồi tương tự như trong Express.

[Fastify](https://github.com/fastify/fastify) cung cấp một framework thay thế tốt cho Nest vì nó giải quyết các vấn đề thiết kế tương tự như Express. Tuy nhiên, fastify **nhanh hơn** nhiều so với Express, đạt được kết quả benchmark gần gấp đôi. Một câu hỏi hợp lý là tại sao Nest sử dụng Express làm nhà cung cấp HTTP mặc định? Lý do là Express được sử dụng rộng rãi, nổi tiếng và có một bộ middleware tương thích khổng lồ, có sẵn cho người dùng Nest ngay từ đầu.

Nhưng vì Nest cung cấp sự độc lập về framework, bạn có thể dễ dàng chuyển đổi giữa chúng. Fastify có thể là một lựa chọn tốt hơn khi bạn đặt giá trị cao vào hiệu suất rất nhanh. Để sử dụng Fastify, chỉ cần chọn `FastifyAdapter` tích hợp sẵn như được hiển thị trong chương này.

#### Cài đặt (Installation)

Đầu tiên, chúng ta cần cài đặt gói cần thiết:

```bash
$ npm i --save @nestjs/platform-fastify
```

#### Bộ điều hợp (Adapter)

Sau khi nền tảng Fastify được cài đặt, chúng ta có thể sử dụng `FastifyAdapter`.

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  await app.listen(3000);
}
bootstrap();
```

Mặc định, Fastify chỉ lắng nghe trên giao diện `localhost 127.0.0.1` ([đọc thêm](https://www.fastify.io/docs/latest/Guides/Getting-Started/#your-first-server)). Nếu bạn muốn chấp nhận kết nối trên các máy chủ khác, bạn nên chỉ định `'0.0.0.0'` trong lệnh gọi `listen()`:

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  await app.listen(3000, '0.0.0.0');
}
```

#### Các gói cụ thể cho nền tảng (Platform specific packages)

Hãy nhớ rằng khi bạn sử dụng `FastifyAdapter`, Nest sử dụng Fastify làm **nhà cung cấp HTTP**. Điều này có nghĩa là mỗi công thức dựa vào Express có thể không còn hoạt động nữa. Thay vào đó, bạn nên sử dụng các gói tương đương của Fastify.

#### Phản hồi chuyển hướng (Redirect response)

Fastify xử lý phản hồi chuyển hướng hơi khác so với Express. Để thực hiện chuyển hướng đúng cách với Fastify, hãy trả về cả mã trạng thái và URL, như sau:

```typescript
@Get()
index(@Res() res) {
  res.status(302).redirect('/login');
}
```

#### Tùy chọn Fastify (Fastify options)

Bạn có thể truyền các tùy chọn vào constructor Fastify thông qua constructor `FastifyAdapter`. Ví dụ:

```typescript
new FastifyAdapter({ logger: true });
```

#### Middleware

Các hàm middleware truy xuất các đối tượng `req` và `res` gốc thay vì các wrapper của Fastify. Đây là cách gói `middie` hoạt động (được sử dụng bên dưới) và `fastify` - hãy xem [trang này](https://www.fastify.io/docs/latest/Reference/Middleware/) để biết thêm thông tin,

```typescript
@@filename(logger.middleware)
import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    console.log('Request...');
    next();
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware {
  use(req, res, next) {
    console.log('Request...');
    next();
  }
}
```

#### Cấu hình tuyến đường (Route Config)

Bạn có thể sử dụng tính năng [cấu hình tuyến đường](https://fastify.dev/docs/latest/Reference/Routes/#config) của Fastify với decorator `@RouteConfig()`.

```typescript
@RouteConfig({ output: 'hello world' })
@Get()
index(@Req() req) {
  return req.routeConfig.output;
}
```

#### Ràng buộc tuyến đường (Route Constraints)

Từ phiên bản v10.3.0, `@nestjs/platform-fastify` hỗ trợ tính năng [ràng buộc tuyến đường](https://fastify.dev/docs/latest/Reference/Routes/#constraints) của Fastify với decorator `@RouteConstraints`.

```typescript
@RouteConstraints({ version: '1.2.x' })
newFeature() {
  return 'This works only for version >= 1.2.x';
}
```

> info **Gợi ý** `@RouteConfig()` và `@RouteConstraints` được import từ `@nestjs/platform-fastify`.

#### Ví dụ (Example)

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/10-fastify).
