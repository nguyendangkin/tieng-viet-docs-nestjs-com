### Bộ lọc ngoại lệ (Exception filters)

Nest đi kèm với một **lớp xử lý ngoại lệ** tích hợp sẵn, chịu trách nhiệm xử lý tất cả các ngoại lệ không được xử lý trong toàn bộ ứng dụng. Khi một ngoại lệ không được xử lý bởi mã ứng dụng của bạn, nó sẽ được lớp này bắt lại, sau đó tự động gửi một phản hồi thân thiện với người dùng phù hợp.

<figure>
  <img src="/assets/Filter_1.png" />
</figure>

Mặc định, hành động này được thực hiện bởi một **bộ lọc ngoại lệ toàn cục** tích hợp sẵn, xử lý các ngoại lệ thuộc loại `HttpException` (và các lớp con của nó). Khi một ngoại lệ **không được nhận dạng** (không phải `HttpException` hoặc một lớp kế thừa từ `HttpException`), bộ lọc ngoại lệ tích hợp sẽ tạo ra phản hồi JSON mặc định sau:

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

> info **Gợi ý** Bộ lọc ngoại lệ toàn cục hỗ trợ một phần thư viện `http-errors`. Về cơ bản, bất kỳ ngoại lệ nào được ném ra chứa các thuộc tính `statusCode` và `message` sẽ được điền đúng cách và gửi lại dưới dạng phản hồi (thay vì `InternalServerErrorException` mặc định cho các ngoại lệ không được nhận dạng).

#### Ném các ngoại lệ tiêu chuẩn (Throwing standard exceptions)

Nest cung cấp một lớp `HttpException` tích hợp sẵn, được xuất từ gói `@nestjs/common`. Đối với các ứng dụng API REST/GraphQL HTTP điển hình, thực hành tốt nhất là gửi các đối tượng phản hồi HTTP tiêu chuẩn khi một số điều kiện lỗi xảy ra.

Ví dụ, trong `CatsController`, chúng ta có một phương thức `findAll()` (một trình xử lý route `GET`). Giả sử rằng trình xử lý route này ném ra một ngoại lệ vì một lý do nào đó. Để minh họa điều này, chúng ta sẽ mã hóa cứng nó như sau:

```typescript
@@filename(cats.controller)
@Get()
async findAll() {
  throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
}
```

> info **Gợi ý** Chúng ta đã sử dụng `HttpStatus` ở đây. Đây là một enum trợ giúp được import từ gói `@nestjs/common`.

Khi client gọi endpoint này, phản hồi sẽ trông như thế này:

```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

Constructor của `HttpException` nhận hai đối số bắt buộc xác định phản hồi:

- Đối số `response` định nghĩa phần thân JSON của phản hồi. Nó có thể là một `string` hoặc một `object` như mô tả bên dưới.
- Đối số `status` định nghĩa [mã trạng thái HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status).

Mặc định, phần thân phản hồi JSON chứa hai thuộc tính:

- `statusCode`: mặc định là mã trạng thái HTTP được cung cấp trong đối số `status`
- `message`: một mô tả ngắn gọn về lỗi HTTP dựa trên `status`

Để ghi đè chỉ phần message của phần thân phản hồi JSON, cung cấp một chuỗi trong đối số `response`. Để ghi đè toàn bộ phần thân phản hồi JSON, truyền một đối tượng vào đối số `response`. Nest sẽ serialize đối tượng và trả về nó như phần thân phản hồi JSON.

Đối số thứ hai của constructor - `status` - phải là một mã trạng thái HTTP hợp lệ. Thực hành tốt nhất là sử dụng enum `HttpStatus` được import từ `@nestjs/common`.

Có một đối số constructor **thứ ba** (tùy chọn) - `options` - có thể được sử dụng để cung cấp [nguyên nhân](https://nodejs.org/en/blog/release/v16.9.0/#error-cause) lỗi. Đối tượng `cause` này không được serialize vào đối tượng phản hồi, nhưng nó có thể hữu ích cho mục đích ghi log, cung cấp thông tin giá trị về lỗi bên trong đã gây ra việc ném `HttpException`.

Đây là một ví dụ ghi đè toàn bộ phần thân phản hồi và cung cấp nguyên nhân lỗi:

```typescript
@@filename(cats.controller)
@Get()
async findAll() {
  try {
    await this.service.findAll()
  } catch (error) {
    throw new HttpException({
      status: HttpStatus.FORBIDDEN,
      error: 'This is a custom message',
    }, HttpStatus.FORBIDDEN, {
      cause: error
    });
  }
}
```

Sử dụng cách trên, phản hồi sẽ trông như thế này:

```json
{
  "status": 403,
  "error": "This is a custom message"
}
```

#### Ngoại lệ tùy chỉnh (Custom exceptions)

Trong nhiều trường hợp, bạn sẽ không cần phải viết các ngoại lệ tùy chỉnh, và có thể sử dụng ngoại lệ HTTP tích hợp sẵn của Nest, như được mô tả trong phần tiếp theo. Nếu bạn cần tạo các ngoại lệ tùy chỉnh, đó là một thực hành tốt để tạo **hệ thống phân cấp ngoại lệ** của riêng bạn, trong đó các ngoại lệ tùy chỉnh của bạn kế thừa từ lớp cơ sở `HttpException`. Với cách tiếp cận này, Nest sẽ nhận ra các ngoại lệ của bạn và tự động xử lý các phản hồi lỗi. Hãy triển khai một ngoại lệ tùy chỉnh như vậy:

```typescript
@@filename(forbidden.exception)
export class ForbiddenException extends HttpException {
  constructor() {
    super('Forbidden', HttpStatus.FORBIDDEN);
  }
}
```

Vì `ForbiddenException` kế thừa từ lớp cơ sở `HttpException`, nó sẽ hoạt động liền mạch với trình xử lý ngoại lệ tích hợp sẵn, và do đó chúng ta có thể sử dụng nó bên trong phương thức `findAll()`.

```typescript
@@filename(cats.controller)
@Get()
async findAll() {
  throw new ForbiddenException();
}
```

#### Các ngoại lệ HTTP tích hợp sẵn (Built-in HTTP exceptions)

Nest cung cấp một tập hợp các ngoại lệ tiêu chuẩn kế thừa từ lớp cơ sở `HttpException`. Chúng được xuất từ gói `@nestjs/common`, và đại diện cho nhiều ngoại lệ HTTP phổ biến nhất:

- `BadRequestException`
- `UnauthorizedException`
- `NotFoundException`
- `ForbiddenException`
- `NotAcceptableException`
- `RequestTimeoutException`
- `ConflictException`
- `GoneException`
- `HttpVersionNotSupportedException`
- `PayloadTooLargeException`
- `UnsupportedMediaTypeException`
- `UnprocessableEntityException`
- `InternalServerErrorException`
- `NotImplementedException`
- `ImATeapotException`
- `MethodNotAllowedException`
- `BadGatewayException`
- `ServiceUnavailableException`
- `GatewayTimeoutException`
- `PreconditionFailedException`

Tất cả các ngoại lệ tích hợp sẵn cũng có thể cung cấp cả `nguyên nhân` lỗi và mô tả lỗi bằng cách sử dụng tham số `options`:

```typescript
throw new BadRequestException('Something bad happened', { cause: new Error(), description: 'Some error description' });
```

Sử dụng cách trên, phản hồi sẽ trông như thế này:

```json
{
  "message": "Something bad happened",
  "error": "Some error description",
  "statusCode": 400
}
```

#### Bộ lọc ngoại lệ (Exception filters)

Mặc dù bộ lọc ngoại lệ cơ sở (tích hợp sẵn) có thể tự động xử lý nhiều trường hợp cho bạn, bạn có thể muốn **kiểm soát hoàn toàn** lớp xử lý ngoại lệ. Ví dụ, bạn có thể muốn thêm ghi log hoặc sử dụng một schema JSON khác dựa trên một số yếu tố động. **Bộ lọc ngoại lệ** được thiết kế chính xác cho mục đích này. Chúng cho phép bạn kiểm soát chính xác luồng điều khiển và nội dung của phản hồi được gửi lại cho client.

Hãy tạo một bộ lọc ngoại lệ chịu trách nhiệm bắt các ngoại lệ là một thể hiện của lớp `HttpException`, và triển khai logic phản hồi tùy chỉnh cho chúng. Để làm điều này, chúng ta sẽ cần truy cập các đối tượng `Request` và `Response` nền tảng cơ bản. Chúng ta sẽ truy cập đối tượng `Request` để có thể trích xuất `url` gốc và đưa nó vào thông tin ghi log. Chúng ta sẽ sử dụng đối tượng `Response` để kiểm soát trực tiếp phản hồi được gửi đi, bằng cách sử dụng phương thức `response.json()`.

```typescript
@@filename(http-exception.filter)
import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}
@@switch
import { Catch, HttpException } from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    response
      .status(status)
      .json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
  }
}
```

> info **Gợi ý** Tất cả các bộ lọc ngoại lệ nên triển khai giao diện generic `ExceptionFilter<T>`. Điều này yêu cầu bạn cung cấp phương thức `catch(exception: T, host: ArgumentsHost)` với chữ ký được chỉ định. `T` chỉ ra loại ngoại lệ.

> warning **Cảnh báo** Nếu bạn đang sử dụng `@nestjs/platform-fastify` bạn có thể sử dụng `response.send()` thay vì `response.json()`. Đừng quên import các kiểu chính xác từ `fastify`.

Decorator `@Catch(HttpException)` gắn kết các metadata cần thiết vào bộ lọc ngoại lệ, cho Nest biết rằng bộ lọc cụ thể này đang tìm kiếm các ngoại lệ loại `HttpException` và không gì khác. Decorator `@Catch()` có thể nhận một tham số duy nhất, hoặc một danh sách được phân tách bằng dấu phẩy. Điều này cho phép bạn thiết lập bộ lọc cho một số loại ngoại lệ cùng một lúc.

#### Đối tượng host của các đối số (Arguments host)

Hãy xem xét các tham số của phương thức `catch()`. Tham số `exception` là đối tượng ngoại lệ đang được xử lý. Tham số `host` là một đối tượng `ArgumentsHost`. `ArgumentsHost` là một đối tượng tiện ích mạnh mẽ mà chúng ta sẽ xem xét kỹ hơn trong [chương về ngữ cảnh thực thi](/fundamentals/execution-context)\*. Trong mẫu mã này, chúng ta sử dụng nó để lấy tham chiếu đến các đối tượng `Request` và `Response` đang được truyền vào trình xử lý yêu cầu gốc (trong controller nơi ngoại lệ phát sinh). Trong mẫu mã này, chúng ta đã sử dụng một số phương thức hỗ trợ trên `ArgumentsHost` để lấy các đối tượng `Request` và `Response` mong muốn. Tìm hiểu thêm về `ArgumentsHost` [tại đây](/fundamentals/execution-context).

\*Lý do cho mức độ trừu tượng này là `ArgumentsHost` hoạt động trong tất cả các ngữ cảnh (ví dụ: ngữ cảnh máy chủ HTTP mà chúng ta đang làm việc bây giờ, nhưng cũng bao gồm Microservices và WebSockets). Trong chương về ngữ cảnh thực thi, chúng ta sẽ thấy cách chúng ta có thể truy cập <a href="https://docs.nestjs.com/fundamentals/execution-context#host-methods">các đối số cơ bản</a> phù hợp cho **bất kỳ** ngữ cảnh thực thi nào với sức mạnh của `ArgumentsHost` và các hàm hỗ trợ của nó. Điều này sẽ cho phép chúng ta viết các bộ lọc ngoại lệ chung hoạt động trên tất cả các ngữ cảnh.

<app-banner-courses></app-banner-courses>

#### Liên kết các bộ lọc (Binding filters)

Hãy gắn `HttpExceptionFilter` mới của chúng ta vào phương thức `create()` của `CatsController`.

```typescript
@@filename(cats.controller)
@Post()
@UseFilters(new HttpExceptionFilter())
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
@@switch
@Post()
@UseFilters(new HttpExceptionFilter())
@Bind(Body())
async create(createCatDto) {
  throw new ForbiddenException();
}
```

> info **Gợi ý** Decorator `@UseFilters()` được import từ package `@nestjs/common`.

Chúng ta đã sử dụng decorator `@UseFilters()` ở đây. Tương tự như decorator `@Catch()`, nó có thể nhận một instance bộ lọc duy nhất, hoặc một danh sách các instance bộ lọc được phân tách bằng dấu phẩy. Ở đây, chúng ta đã tạo instance của `HttpExceptionFilter` tại chỗ. Ngoài ra, bạn có thể truyền vào class (thay vì một instance), để giao trách nhiệm khởi tạo cho framework, và cho phép **dependency injection**.

```typescript
@@filename(cats.controller)
@Post()
@UseFilters(HttpExceptionFilter)
async create(@Body() createCatDto: CreateCatDto) {
  throw new ForbiddenException();
}
@@switch
@Post()
@UseFilters(HttpExceptionFilter)
@Bind(Body())
async create(createCatDto) {
  throw new ForbiddenException();
}
```

> info **Gợi ý** Nên áp dụng bộ lọc bằng cách sử dụng các lớp thay vì các instance khi có thể. Điều này giảm **việc sử dụng bộ nhớ** vì Nest có thể dễ dàng tái sử dụng các instance của cùng một lớp trong toàn bộ module của bạn.

Trong ví dụ trên, `HttpExceptionFilter` chỉ được áp dụng cho route handler `create()` duy nhất, làm cho nó có phạm vi method. Bộ lọc ngoại lệ có thể có phạm vi ở các cấp độ khác nhau: phạm vi method của controller/resolver/gateway, phạm vi controller, hoặc phạm vi toàn cục.
Ví dụ, để thiết lập một bộ lọc có phạm vi controller, bạn sẽ làm như sau:

```typescript
@@filename(cats.controller)
@UseFilters(new HttpExceptionFilter())
export class CatsController {}
```

Cấu trúc này thiết lập `HttpExceptionFilter` cho mọi route handler được định nghĩa trong `CatsController`.

Để tạo một bộ lọc có phạm vi toàn cục, bạn sẽ làm như sau:

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(3000);
}
bootstrap();
```

> warning **Cảnh báo** Phương thức `useGlobalFilters()` không thiết lập bộ lọc cho các gateway hoặc ứng dụng hybrid.

Bộ lọc có phạm vi toàn cục được sử dụng trong toàn bộ ứng dụng, cho mọi controller và mọi route handler. Về mặt dependency injection, bộ lọc toàn cục được đăng ký từ bên ngoài bất kỳ module nào (với `useGlobalFilters()` như trong ví dụ trên) không thể inject các dependency vì điều này được thực hiện bên ngoài ngữ cảnh của bất kỳ module nào. Để giải quyết vấn đề này, bạn có thể đăng ký một bộ lọc có phạm vi toàn cục **trực tiếp từ bất kỳ module nào** bằng cách sử dụng cấu trúc sau:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
```

> info **Gợi ý** Khi sử dụng cách tiếp cận này để thực hiện dependency injection cho bộ lọc, lưu ý rằng bất kể module nào sử dụng cấu trúc này, bộ lọc thực sự là toàn cục. Nên thực hiện điều này ở đâu? Chọn module nơi bộ lọc (`HttpExceptionFilter` trong ví dụ trên) được định nghĩa. Ngoài ra, `useClass` không phải là cách duy nhất để xử lý đăng ký provider tùy chỉnh. Tìm hiểu thêm [tại đây](/fundamentals/custom-providers).

Bạn có thể thêm nhiều bộ lọc với kỹ thuật này theo nhu cầu; chỉ cần thêm mỗi bộ lọc vào mảng providers.

#### Bắt tất cả (Catch everything)

Để bắt **mọi** ngoại lệ không được xử lý (bất kể loại ngoại lệ), hãy để trống danh sách tham số của decorator `@Catch()`, ví dụ: `@Catch()`.

Trong ví dụ dưới đây, chúng ta có một đoạn mã không phụ thuộc vào nền tảng vì nó sử dụng [HTTP adapter](./faq/http-adapter) để gửi phản hồi, và không sử dụng trực tiếp bất kỳ đối tượng nào đặc thù cho nền tảng (`Request` và `Response`):

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // Trong một số tình huống, `httpAdapter` có thể không có sẵn trong
    // phương thức constructor, vì vậy chúng ta nên giải quyết nó ở đây.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
```

> warning **Cảnh báo** Khi kết hợp một bộ lọc ngoại lệ bắt tất cả với một bộ lọc được gắn với một loại cụ thể, bộ lọc "Bắt tất cả" nên được khai báo trước để cho phép bộ lọc cụ thể xử lý đúng loại được gắn.

#### Kế thừa (Inheritance)

Thông thường, bạn sẽ tạo các bộ lọc ngoại lệ hoàn toàn tùy chỉnh được thiết kế để đáp ứng yêu cầu của ứng dụng của bạn. Tuy nhiên, có thể có những trường hợp bạn muốn chỉ đơn giản mở rộng **bộ lọc ngoại lệ toàn cục** mặc định được tích hợp sẵn, và ghi đè hành vi dựa trên một số yếu tố nhất định.

Để ủy quyền xử lý ngoại lệ cho bộ lọc cơ sở, bạn cần mở rộng `BaseExceptionFilter` và gọi phương thức `catch()` được kế thừa.

```typescript
@@filename(all-exceptions.filter)
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    super.catch(exception, host);
  }
}
@@switch
import { Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception, host) {
    super.catch(exception, host);
  }
}
```

> warning **Cảnh báo** Các bộ lọc có phạm vi Method và Controller mà mở rộng `BaseExceptionFilter` không nên được khởi tạo bằng `new`. Thay vào đó, hãy để framework tự động khởi tạo chúng.

Các bộ lọc toàn cục **có thể** mở rộng bộ lọc cơ sở. Điều này có thể được thực hiện theo một trong hai cách.

Phương pháp đầu tiên là inject tham chiếu `HttpAdapter` khi khởi tạo bộ lọc toàn cục tùy chỉnh:

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  await app.listen(3000);
}
bootstrap();
```

Phương pháp thứ hai là sử dụng token `APP_FILTER` <a href="exception-filters#binding-filters">như đã hiển thị ở đây</a>.
