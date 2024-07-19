### Decorator tùy chỉnh cho route (Custom route decorators)

Nest được xây dựng dựa trên một tính năng ngôn ngữ gọi là **decorator**. Decorator là một khái niệm phổ biến trong nhiều ngôn ngữ lập trình thông dụng, nhưng trong thế giới JavaScript, chúng vẫn còn tương đối mới. Để hiểu rõ hơn về cách decorator hoạt động, chúng tôi khuyên bạn nên đọc [bài viết này](https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841). Dưới đây là một định nghĩa đơn giản:

<blockquote class="external">
  Một decorator ES2016 là một biểu thức trả về một hàm và có thể nhận target, name và property descriptor làm đối số.
  Bạn áp dụng nó bằng cách thêm tiền tố `@` vào trước decorator và đặt nó ở đầu những gì bạn muốn trang trí. Decorator có thể được định nghĩa cho một lớp, một phương thức hoặc một thuộc tính.
</blockquote>

#### Decorator cho tham số (Param decorators)

Nest cung cấp một tập hợp các **decorator tham số** hữu ích mà bạn có thể sử dụng cùng với các bộ xử lý route HTTP. Dưới đây là danh sách các decorator được cung cấp và các đối tượng Express (hoặc Fastify) thuần túy mà chúng đại diện

<table>
  <tbody>
    <tr>
      <td><code>@Request(), @Req()</code></td>
      <td><code>req</code></td>
    </tr>
    <tr>
      <td><code>@Response(), @Res()</code></td>
      <td><code>res</code></td>
    </tr>
    <tr>
      <td><code>@Next()</code></td>
      <td><code>next</code></td>
    </tr>
    <tr>
      <td><code>@Session()</code></td>
      <td><code>req.session</code></td>
    </tr>
    <tr>
      <td><code>@Param(param?: string)</code></td>
      <td><code>req.params</code> / <code>req.params[param]</code></td>
    </tr>
    <tr>
      <td><code>@Body(param?: string)</code></td>
      <td><code>req.body</code> / <code>req.body[param]</code></td>
    </tr>
    <tr>
      <td><code>@Query(param?: string)</code></td>
      <td><code>req.query</code> / <code>req.query[param]</code></td>
    </tr>
    <tr>
      <td><code>@Headers(param?: string)</code></td>
      <td><code>req.headers</code> / <code>req.headers[param]</code></td>
    </tr>
    <tr>
      <td><code>@Ip()</code></td>
      <td><code>req.ip</code></td>
    </tr>
    <tr>
      <td><code>@HostParam()</code></td>
      <td><code>req.hosts</code></td>
    </tr>
  </tbody>
</table>

Ngoài ra, bạn có thể tạo **decorator tùy chỉnh** của riêng mình. Tại sao điều này hữu ích?

Trong thế giới node.js, thông thường người ta gắn các thuộc tính vào đối tượng **request**. Sau đó, bạn phải trích xuất chúng thủ công trong mỗi bộ xử lý route, sử dụng mã như sau:

```typescript
const user = req.user;
```

Để làm cho mã của bạn dễ đọc và rõ ràng hơn, bạn có thể tạo một decorator `@User()` và tái sử dụng nó trong tất cả các controller của bạn.

```typescript
@@filename(user.decorator)
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

Sau đó, bạn có thể sử dụng nó ở bất cứ đâu phù hợp với yêu cầu của bạn.

```typescript
@@filename()
@Get()
async findOne(@User() user: UserEntity) {
  console.log(user);
}
@@switch
@Get()
@Bind(User())
async findOne(user) {
  console.log(user);
}
```

#### Truyền dữ liệu (Passing data)

Khi hành vi của decorator của bạn phụ thuộc vào một số điều kiện, bạn có thể sử dụng tham số `data` để truyền một đối số cho hàm factory của decorator. Một trường hợp sử dụng cho điều này là một decorator tùy chỉnh trích xuất các thuộc tính từ đối tượng request bằng khóa. Giả sử, ví dụ, rằng <a href="techniques/authentication#implementing-passport-strategies">lớp xác thực</a> của chúng ta xác nhận các yêu cầu và gắn một thực thể người dùng vào đối tượng request. Thực thể người dùng cho một yêu cầu đã được xác thực có thể trông như sau:

```json
{
  "id": 101,
  "firstName": "Alan",
  "lastName": "Turing",
  "email": "alan@email.com",
  "roles": ["admin"]
}
```

Hãy định nghĩa một decorator nhận tên thuộc tính làm khóa và trả về giá trị liên quan nếu nó tồn tại (hoặc undefined nếu nó không tồn tại, hoặc nếu đối tượng `user` chưa được tạo).

```typescript
@@filename(user.decorator)
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
@@switch
import { createParamDecorator } from '@nestjs/common';

export const User = createParamDecorator((data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;

  return data ? user && user[data] : user;
});
```

Đây là cách bạn có thể truy cập một thuộc tính cụ thể thông qua decorator `@User()` trong controller:

```typescript
@@filename()
@Get()
async findOne(@User('firstName') firstName: string) {
  console.log(`Hello ${firstName}`);
}
@@switch
@Get()
@Bind(User('firstName'))
async findOne(firstName) {
  console.log(`Hello ${firstName}`);
}
```

Bạn có thể sử dụng cùng một decorator này với các khóa khác nhau để truy cập các thuộc tính khác nhau. Nếu đối tượng `user` sâu hoặc phức tạp, điều này có thể làm cho việc triển khai bộ xử lý yêu cầu dễ dàng hơn và dễ đọc hơn.

> info **Gợi ý** Đối với người dùng TypeScript, lưu ý rằng `createParamDecorator<T>()` là một generic. Điều này có nghĩa là bạn có thể áp dụng kiểm tra kiểu một cách rõ ràng, ví dụ `createParamDecorator<string>((data, ctx) => ...)`. Hoặc, chỉ định kiểu tham số trong hàm factory, ví dụ `createParamDecorator((data: string, ctx) => ...)`. Nếu bạn bỏ qua cả hai, kiểu cho `data` sẽ là `any`.

#### Làm việc với pipes (Working with pipes)

Nest xử lý các decorator tham số tùy chỉnh theo cách tương tự như các decorator có sẵn (`@Body()`, `@Param()` và `@Query()`). Điều này có nghĩa là các pipe cũng được thực thi cho các tham số được chú thích tùy chỉnh (trong ví dụ của chúng ta, đối số `user`). Hơn nữa, bạn có thể áp dụng pipe trực tiếp vào decorator tùy chỉnh:

```typescript
@@filename()
@Get()
async findOne(
  @User(new ValidationPipe({ validateCustomDecorators: true }))
  user: UserEntity,
) {
  console.log(user);
}
@@switch
@Get()
@Bind(User(new ValidationPipe({ validateCustomDecorators: true })))
async findOne(user) {
  console.log(user);
}
```

> info **Gợi ý** Lưu ý rằng tùy chọn `validateCustomDecorators` phải được đặt thành true. `ValidationPipe` không xác thực các đối số được chú thích bằng decorator tùy chỉnh theo mặc định.

#### Kết hợp decorator (Decorator composition)

Nest cung cấp một phương thức hỗ trợ để kết hợp nhiều decorator. Ví dụ, giả sử bạn muốn kết hợp tất cả các decorator liên quan đến xác thực thành một decorator duy nhất. Điều này có thể được thực hiện với cấu trúc sau:

```typescript
@@filename(auth.decorator)
import { applyDecorators } from '@nestjs/common';

export function Auth(...roles: Role[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
@@switch
import { applyDecorators } from '@nestjs/common';

export function Auth(...roles) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}
```

Sau đó, bạn có thể sử dụng decorator `@Auth()` tùy chỉnh này như sau:

```typescript
@Get('users')
@Auth('admin')
findAllUsers() {}
```

Điều này có tác dụng áp dụng tất cả bốn decorator với một khai báo duy nhất.

> warning **Cảnh báo** Decorator `@ApiHideProperty()` từ gói `@nestjs/swagger` không thể kết hợp và sẽ không hoạt động đúng với hàm `applyDecorators`.
