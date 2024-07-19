### Middleware (Phần mềm trung gian)

Middleware là một hàm được gọi **trước** trình xử lý route. Các hàm middleware có quyền truy cập vào các đối tượng [request](https://expressjs.com/en/4x/api.html#req) và [response](https://expressjs.com/en/4x/api.html#res), cũng như hàm middleware `next()` trong chu trình request-response của ứng dụng. Hàm middleware **tiếp theo** thường được biểu thị bằng một biến có tên là `next`.

<figure><img src="/assets/Middlewares_1.png" /></figure>

Middleware trong Nest, về mặc định, tương đương với middleware [express](https://expressjs.com/en/guide/using-middleware.html). Mô tả sau đây từ tài liệu chính thức của express giải thích về khả năng của middleware:

<blockquote class="external">
  Các hàm middleware có thể thực hiện các tác vụ sau:
  <ul>
    <li>thực thi bất kỳ đoạn mã nào.</li>
    <li>thực hiện các thay đổi đối với các đối tượng request và response.</li>
    <li>kết thúc chu trình request-response.</li>
    <li>gọi hàm middleware tiếp theo trong stack.</li>
    <li>nếu hàm middleware hiện tại không kết thúc chu trình request-response, nó phải gọi <code>next()</code> để
      chuyển quyền điều khiển cho hàm middleware tiếp theo. Nếu không, request sẽ bị treo.</li>
  </ul>
</blockquote>

Bạn có thể triển khai middleware tùy chỉnh trong Nest bằng một hàm, hoặc trong một lớp với decorator `@Injectable()`. Lớp này nên triển khai giao diện `NestMiddleware`, trong khi hàm không có yêu cầu đặc biệt nào. Hãy bắt đầu bằng cách triển khai một tính năng middleware đơn giản sử dụng phương pháp lớp.

> warning **Cảnh báo** `Express` và `fastify` xử lý middleware khác nhau và cung cấp chữ ký phương thức khác nhau, đọc thêm [tại đây](/techniques/performance#middleware).

```typescript
@@filename(logger.middleware)
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
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

#### Dependency injection (Tiêm phụ thuộc)

Middleware của Nest hỗ trợ đầy đủ Dependency Injection. Giống như với providers và controllers, chúng có thể **tiêm các phụ thuộc** có sẵn trong cùng một module. Như thường lệ, điều này được thực hiện thông qua `constructor`.

#### Applying middleware (Áp dụng middleware)

Không có vị trí cho middleware trong decorator `@Module()`. Thay vào đó, chúng ta thiết lập chúng bằng phương thức `configure()` của lớp module. Các module bao gồm middleware phải triển khai giao diện `NestModule`. Hãy thiết lập `LoggerMiddleware` ở cấp độ `AppModule`.

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}
@@switch
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('cats');
  }
}
```

Trong ví dụ trên, chúng ta đã thiết lập `LoggerMiddleware` cho các trình xử lý route `/cats` đã được định nghĩa trước đó trong `CatsController`. Chúng ta cũng có thể hạn chế middleware cho một phương thức request cụ thể bằng cách truyền một đối tượng chứa `path` route và `method` request vào phương thức `forRoutes()` khi cấu hình middleware. Trong ví dụ dưới đây, lưu ý rằng chúng ta import enum `RequestMethod` để tham chiếu đến loại phương thức request mong muốn.

```typescript
@@filename(app.module)
import { Module, NestModule, RequestMethod, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}
@@switch
import { Module, RequestMethod } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: 'cats', method: RequestMethod.GET });
  }
}
```

> info **Gợi ý** Phương thức `configure()` có thể được làm bất đồng bộ bằng cách sử dụng `async/await` (ví dụ: bạn có thể `await` hoàn thành một hoạt động bất đồng bộ bên trong phần thân của phương thức `configure()`).

> warning **Cảnh báo** Khi sử dụng adapter `express`, ứng dụng NestJS sẽ đăng ký `json` và `urlencoded` từ gói `body-parser` theo mặc định. Điều này có nghĩa là nếu bạn muốn tùy chỉnh middleware đó thông qua `MiddlewareConsumer`, bạn cần tắt middleware toàn cục bằng cách đặt cờ `bodyParser` thành `false` khi tạo ứng dụng với `NestFactory.create()`.

#### Route wildcards (Ký tự đại diện cho route)

Các route dựa trên mẫu cũng được hỗ trợ. Ví dụ, dấu hoa thị được sử dụng như một **ký tự đại diện**, và sẽ khớp với bất kỳ tổ hợp ký tự nào:

```typescript
forRoutes({ path: 'ab*cd', method: RequestMethod.ALL });
```

Đường dẫn route `'ab*cd'` sẽ khớp với `abcd`, `ab_cd`, `abecd`, và vân vân. Các ký tự `?`, `+`, `*`, và `()` có thể được sử dụng trong đường dẫn route, và là các tập con của các ký tự tương ứng trong biểu thức chính quy. Dấu gạch ngang ( `-`) và dấu chấm (`.`) được diễn giải theo nghĩa đen bởi các đường dẫn dựa trên chuỗi.

> warning **Cảnh báo** Gói `fastify` sử dụng phiên bản mới nhất của gói `path-to-regexp`, không còn hỗ trợ ký tự đại diện dấu hoa thị `*`. Thay vào đó, bạn phải sử dụng tham số (ví dụ: `(.*)`, `:splat*`).

#### Middleware consumer (Người tiêu dùng middleware)

`MiddlewareConsumer` là một lớp trợ giúp. Nó cung cấp một số phương thức tích hợp để quản lý middleware. Tất cả chúng đều có thể được **kết nối** một cách đơn giản theo [kiểu fluent](https://en.wikipedia.org/wiki/Fluent_interface). Phương thức `forRoutes()` có thể nhận một chuỗi đơn, nhiều chuỗi, một đối tượng `RouteInfo`, một lớp controller và thậm chí nhiều lớp controller. Trong hầu hết các trường hợp, bạn có thể chỉ cần truyền một danh sách các **controller** được phân tách bằng dấu phẩy. Dưới đây là một ví dụ với một controller duy nhất:

```typescript
@@filename(app.module)
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}
@@switch
import { Module } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { CatsModule } from './cats/cats.module';
import { CatsController } from './cats/cats.controller';

@Module({
  imports: [CatsModule],
})
export class AppModule {
  configure(consumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes(CatsController);
  }
}
```

> info **Gợi ý** Phương thức `apply()` có thể nhận một middleware duy nhất, hoặc nhiều đối số để chỉ định <a href="/middleware#multiple-middleware">nhiều middleware</a>.

#### Excluding routes (Loại trừ các route)

Đôi khi chúng ta muốn **loại trừ** một số route khỏi việc áp dụng middleware. Chúng ta có thể dễ dàng loại trừ một số route nhất định bằng phương thức `exclude()`. Phương thức này có thể nhận một chuỗi đơn, nhiều chuỗi, hoặc một đối tượng `RouteInfo` xác định các route cần loại trừ, như được hiển thị dưới đây:

```typescript
consumer.apply(LoggerMiddleware).exclude({ path: 'cats', method: RequestMethod.GET }, { path: 'cats', method: RequestMethod.POST }, 'cats/(.*)').forRoutes(CatsController);
```

> info **Gợi ý** Phương thức `exclude()` hỗ trợ các tham số ký tự đại diện sử dụng gói [path-to-regexp](https://github.com/pillarjs/path-to-regexp#parameters).

Với ví dụ trên, `LoggerMiddleware` sẽ được áp dụng cho tất cả các route được định nghĩa bên trong `CatsController` **ngoại trừ** ba route được truyền vào phương thức `exclude()`.

#### Functional middleware (Middleware chức năng)

Lớp `LoggerMiddleware` mà chúng ta đã sử dụng khá đơn giản. Nó không có thành viên, không có phương thức bổ sung, và không có phụ thuộc. Tại sao chúng ta không thể chỉ định nghĩa nó trong một hàm đơn giản thay vì một lớp? Trên thực tế, chúng ta có thể. Loại middleware này được gọi là **middleware chức năng**. Hãy chuyển đổi middleware logger từ dạng lớp sang dạng chức năng để minh họa sự khác biệt:

```typescript
@@filename(logger.middleware)
import { Request, Response, NextFunction } from 'express';

export function logger(req: Request, res: Response, next: NextFunction) {
  console.log(`Request...`);
  next();
};
@@switch
export function logger(req, res, next) {
  console.log(`Request...`);
  next();
};
```

Và sử dụng nó trong `AppModule`:

```typescript
@@filename(app.module)
consumer
  .apply(logger)
  .forRoutes(CatsController);
```

> info **Gợi ý** Hãy xem xét sử dụng phương án **middleware chức năng** đơn giản hơn bất cứ khi nào middleware của bạn không cần bất kỳ phụ thuộc nào.

#### Multiple middleware (Nhiều middleware)

Như đã đề cập ở trên, để gắn kết nhiều middleware được thực thi tuần tự, chỉ cần cung cấp một danh sách được phân tách bằng dấu phẩy bên trong phương thức `apply()`:

```typescript
consumer.apply(cors(), helmet(), logger).forRoutes(CatsController);
```

#### Global middleware (Middleware toàn cục)

Nếu chúng ta muốn gắn kết middleware với mọi route đã đăng ký cùng một lúc, chúng ta có thể sử dụng phương thức `use()` được cung cấp bởi phiên bản `INestApplication`:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.use(logger);
await app.listen(3000);
```

> info **Gợi ý** Việc truy cập vào container DI trong một middleware toàn cục là không thể. Bạn có thể sử dụng [middleware chức năng](middleware#functional-middleware) thay thế khi sử dụng `app.use()`. Ngoài ra, bạn có thể sử dụng middleware dạng lớp và sử dụng nó với `.forRoutes('*')` trong `AppModule` (hoặc bất kỳ module nào khác).
