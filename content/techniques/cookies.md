### Cookie (Cookies)

**Cookie HTTP** là một phần dữ liệu nhỏ được lưu trữ bởi trình duyệt của người dùng. Cookie được thiết kế để là một cơ chế đáng tin cậy cho các trang web để ghi nhớ thông tin trạng thái. Khi người dùng truy cập lại trang web, cookie sẽ tự động được gửi cùng với yêu cầu.

#### Sử dụng với Express (mặc định) (Use with Express (default))

Trước tiên, hãy cài đặt [gói cần thiết](https://github.com/expressjs/cookie-parser) (và các kiểu của nó cho người dùng TypeScript):

```shell
$ npm i cookie-parser
$ npm i -D @types/cookie-parser
```

Sau khi cài đặt hoàn tất, áp dụng middleware `cookie-parser` làm middleware toàn cục (ví dụ, trong file `main.ts` của bạn).

```typescript
import * as cookieParser from 'cookie-parser';
// ở đâu đó trong file khởi tạo của bạn
app.use(cookieParser());
```

Bạn có thể truyền một số tùy chọn cho middleware `cookieParser`:

- `secret` một chuỗi hoặc mảng được sử dụng để ký cookie. Điều này là tùy chọn và nếu không được chỉ định, sẽ không phân tích cú pháp cookie đã ký. Nếu một chuỗi được cung cấp, nó sẽ được sử dụng làm bí mật. Nếu một mảng được cung cấp, một nỗ lực sẽ được thực hiện để bỏ ký cookie với từng bí mật theo thứ tự.
- `options` một đối tượng được truyền cho `cookie.parse` như tùy chọn thứ hai. Xem [cookie](https://www.npmjs.org/package/cookie) để biết thêm thông tin.

Middleware sẽ phân tích cú pháp tiêu đề `Cookie` trên yêu cầu và hiển thị dữ liệu cookie dưới dạng thuộc tính `req.cookies` và, nếu một bí mật được cung cấp, dưới dạng thuộc tính `req.signedCookies`. Các thuộc tính này là các cặp giá trị tên của tên cookie đến giá trị cookie.

Khi một bí mật được cung cấp, module này sẽ bỏ ký và xác thực bất kỳ giá trị cookie đã ký nào và di chuyển các cặp giá trị tên đó từ `req.cookies` vào `req.signedCookies`. Một cookie đã ký là một cookie có giá trị được đặt tiền tố bằng `s:`. Cookie đã ký không vượt qua xác thực chữ ký sẽ có giá trị `false` thay vì giá trị đã bị can thiệp.

Với điều này, bạn có thể đọc cookie từ trong các trình xử lý route, như sau:

```typescript
@Get()
findAll(@Req() request: Request) {
  console.log(request.cookies); // hoặc "request.cookies['cookieKey']"
  // hoặc console.log(request.signedCookies);
}
```

> info **Gợi ý** Decorator `@Req()` được import từ `@nestjs/common`, trong khi `Request` từ gói `express`.

Để đính kèm một cookie vào phản hồi gửi đi, sử dụng phương thức `Response#cookie()`:

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: Response) {
  response.cookie('key', 'value')
}
```

> warning **Cảnh báo** Nếu bạn muốn để logic xử lý phản hồi cho framework, hãy nhớ đặt tùy chọn `passthrough` thành `true`, như được hiển thị ở trên. Đọc thêm [tại đây](/controllers#library-specific-approach).

> info **Gợi ý** Decorator `@Res()` được import từ `@nestjs/common`, trong khi `Response` từ gói `express`.

#### Sử dụng với Fastify (Use with Fastify)

Trước tiên, cài đặt gói cần thiết:

```shell
$ npm i @fastify/cookie
```

Sau khi cài đặt hoàn tất, đăng ký plugin `@fastify/cookie`:

```typescript
import fastifyCookie from '@fastify/cookie';

// ở đâu đó trong file khởi tạo của bạn
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.register(fastifyCookie, {
  secret: 'my-secret', // cho chữ ký cookie
});
```

Với điều này, bạn có thể đọc cookie từ trong các trình xử lý route, như sau:

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  console.log(request.cookies); // hoặc "request.cookies['cookieKey']"
}
```

> info **Gợi ý** Decorator `@Req()` được import từ `@nestjs/common`, trong khi `FastifyRequest` từ gói `fastify`.

Để đính kèm một cookie vào phản hồi gửi đi, sử dụng phương thức `FastifyReply#setCookie()`:

```typescript
@Get()
findAll(@Res({ passthrough: true }) response: FastifyReply) {
  response.setCookie('key', 'value')
}
```

Để đọc thêm về phương thức `FastifyReply#setCookie()`, hãy xem [trang này](https://github.com/fastify/fastify-cookie#sending).

> warning **Cảnh báo** Nếu bạn muốn để logic xử lý phản hồi cho framework, hãy nhớ đặt tùy chọn `passthrough` thành `true`, như được hiển thị ở trên. Đọc thêm [tại đây](/controllers#library-specific-approach).

> info **Gợi ý** Decorator `@Res()` được import từ `@nestjs/common`, trong khi `FastifyReply` từ gói `fastify`.

#### Tạo một decorator tùy chỉnh (đa nền tảng) (Creating a custom decorator (cross-platform))

Để cung cấp một cách thuận tiện, khai báo để truy cập cookie đến, chúng ta có thể tạo một [decorator tùy chỉnh](/custom-decorators).

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Cookies = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.cookies?.[data] : request.cookies;
});
```

Decorator `@Cookies()` sẽ trích xuất tất cả cookie, hoặc một cookie có tên từ đối tượng `req.cookies` và điền vào tham số được trang trí với giá trị đó.

Với điều này, chúng ta có thể sử dụng decorator trong chữ ký của trình xử lý route, như sau:

```typescript
@Get()
findAll(@Cookies('name') name: string) {}
```
