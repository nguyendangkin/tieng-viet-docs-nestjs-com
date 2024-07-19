### Guards (Bảo vệ)

Guard là một class được đánh dấu với decorator `@Injectable()`, và triển khai interface `CanActivate`.

<figure><img src="/assets/Guards_1.png" /></figure>

Guards có **một trách nhiệm duy nhất**. Chúng xác định liệu một request có được xử lý bởi route handler hay không, phụ thuộc vào một số điều kiện nhất định (như quyền hạn, vai trò, ACLs, v.v.) tại thời điểm chạy. Điều này thường được gọi là **authorization** (ủy quyền). Authorization (và người anh em họ của nó, **authentication** (xác thực), thường đi kèm với nó) thường được xử lý bởi [middleware](/middleware) trong các ứng dụng Express truyền thống. Middleware là một lựa chọn tốt cho xác thực, vì những việc như xác thực token và gắn thuộc tính vào đối tượng `request` không liên quan chặt chẽ đến một ngữ cảnh route cụ thể (và metadata của nó).

Nhưng middleware, về bản chất, là dumb (ngớ ngẩn). Nó không biết handler nào sẽ được thực thi sau khi gọi hàm `next()`. Mặt khác, **Guards** có quyền truy cập vào instance `ExecutionContext`, và do đó biết chính xác điều gì sẽ được thực thi tiếp theo. Chúng được thiết kế, giống như exception filters, pipes, và interceptors, để cho phép bạn can thiệp vào logic xử lý tại đúng điểm trong chu trình request/response, và làm điều đó một cách khai báo. Điều này giúp giữ cho code của bạn DRY và khai báo.

> info **Gợi ý** Guards được thực thi **sau** tất cả middleware, nhưng **trước** bất kỳ interceptor hoặc pipe nào.

#### Authorization guard (Bảo vệ ủy quyền)

Như đã đề cập, **authorization** là một trường hợp sử dụng tuyệt vời cho Guards vì các route cụ thể chỉ nên có sẵn khi người gọi (thường là một người dùng đã xác thực cụ thể) có đủ quyền. `AuthGuard` mà chúng ta sẽ xây dựng bây giờ giả định một người dùng đã được xác thực (và do đó, một token được đính kèm vào headers của request). Nó sẽ trích xuất và xác thực token, và sử dụng thông tin được trích xuất để xác định liệu request có thể tiếp tục hay không.

```typescript
@@filename(auth.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard {
  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    return validateRequest(request);
  }
}
```

> info **Gợi ý** Nếu bạn đang tìm kiếm một ví dụ thực tế về cách triển khai cơ chế xác thực trong ứng dụng của bạn, hãy truy cập [chương này](/security/authentication). Tương tự, để xem ví dụ phức tạp hơn về authorization, hãy xem [trang này](/security/authorization).

Logic bên trong hàm `validateRequest()` có thể đơn giản hoặc phức tạp tùy theo nhu cầu. Điểm chính của ví dụ này là để cho thấy cách guards phù hợp trong chu trình request/response.

Mọi guard phải triển khai hàm `canActivate()`. Hàm này nên trả về một giá trị boolean, cho biết liệu request hiện tại có được phép hay không. Nó có thể trả về kết quả đồng bộ hoặc bất đồng bộ (thông qua `Promise` hoặc `Observable`). Nest sử dụng giá trị trả về để kiểm soát hành động tiếp theo:

- nếu nó trả về `true`, request sẽ được xử lý.
- nếu nó trả về `false`, Nest sẽ từ chối request.

<app-banner-enterprise></app-banner-enterprise>

#### Execution context (Ngữ cảnh thực thi)

Hàm `canActivate()` nhận một tham số duy nhất, instance `ExecutionContext`. `ExecutionContext` kế thừa từ `ArgumentsHost`. Chúng ta đã thấy `ArgumentsHost` trước đó trong chương exception filters. Trong ví dụ trên, chúng ta chỉ sử dụng các phương thức helper giống nhau được định nghĩa trên `ArgumentsHost` mà chúng ta đã sử dụng trước đó, để lấy tham chiếu đến đối tượng `Request`. Bạn có thể xem lại phần **Arguments host** của chương [exception filters](https://docs.nestjs.com/exception-filters#arguments-host) để biết thêm về chủ đề này.

Bằng cách mở rộng `ArgumentsHost`, `ExecutionContext` cũng thêm một số phương thức helper mới cung cấp thêm chi tiết về quá trình thực thi hiện tại. Những chi tiết này có thể hữu ích trong việc xây dựng các guard tổng quát hơn có thể hoạt động trên nhiều controllers, methods, và execution contexts. Tìm hiểu thêm về `ExecutionContext` [tại đây](/fundamentals/execution-context).

#### Role-based authentication (Xác thực dựa trên vai trò)

Hãy xây dựng một guard chức năng hơn chỉ cho phép truy cập đối với người dùng có vai trò cụ thể. Chúng ta sẽ bắt đầu với một mẫu guard cơ bản, và phát triển nó trong các phần tiếp theo. Hiện tại, nó cho phép tất cả các request tiếp tục:

```typescript
@@filename(roles.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return true;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class RolesGuard {
  canActivate(context) {
    return true;
  }
}
```

#### Binding guards (Liên kết các bảo vệ)

Giống như pipes và exception filters, guards có thể có phạm vi **controller-scoped**, method-scoped, hoặc global-scoped. Dưới đây, chúng ta thiết lập một guard có phạm vi controller bằng cách sử dụng decorator `@UseGuards()`. Decorator này có thể nhận một đối số duy nhất, hoặc một danh sách các đối số được phân tách bằng dấu phẩy. Điều này cho phép bạn dễ dàng áp dụng bộ guards phù hợp chỉ với một khai báo.

```typescript
@@filename()
@Controller('cats')
@UseGuards(RolesGuard)
export class CatsController {}
```

> info **Gợi ý** Decorator `@UseGuards()` được import từ package `@nestjs/common`.

Ở trên, chúng ta đã truyền class `RolesGuard` (thay vì một instance), để lại trách nhiệm khởi tạo cho framework và cho phép dependency injection. Giống như với pipes và exception filters, chúng ta cũng có thể truyền một instance tại chỗ:

```typescript
@@filename()
@Controller('cats')
@UseGuards(new RolesGuard())
export class CatsController {}
```

Cấu trúc trên gắn guard vào mọi handler được khai báo bởi controller này. Nếu chúng ta muốn guard chỉ áp dụng cho một phương thức duy nhất, chúng ta áp dụng decorator `@UseGuards()` ở cấp độ **method**.

Để thiết lập một global guard, sử dụng phương thức `useGlobalGuards()` của instance ứng dụng Nest:

```typescript
@@filename()
const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new RolesGuard());
```

> warning **Lưu ý** Trong trường hợp ứng dụng lai, phương thức `useGlobalGuards()` không thiết lập guards cho gateways và microservices theo mặc định (xem [Ứng dụng lai](/faq/hybrid-application) để biết thông tin về cách thay đổi hành vi này). Đối với các ứng dụng microservice "tiêu chuẩn" (không phải lai), `useGlobalGuards()` sẽ gắn các guards toàn cục.

Global guards được sử dụng trong toàn bộ ứng dụng, cho mọi controller và mọi route handler. Về mặt dependency injection, global guards được đăng ký từ bên ngoài bất kỳ module nào (với `useGlobalGuards()` như trong ví dụ trên) không thể inject dependencies vì điều này được thực hiện bên ngoài ngữ cảnh của bất kỳ module nào. Để giải quyết vấn đề này, bạn có thể thiết lập một guard trực tiếp từ bất kỳ module nào bằng cách sử dụng cấu trúc sau:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
```

> info **Gợi ý** Khi sử dụng cách tiếp cận này để thực hiện dependency injection cho guard, lưu ý rằng bất kể module nào sử dụng cấu trúc này, guard thực sự là global. Nên làm điều này ở đâu? Chọn module nơi guard (`RolesGuard` trong ví dụ trên) được định nghĩa. Ngoài ra, `useClass` không phải là cách duy nhất để xử lý đăng ký custom provider. Tìm hiểu thêm [tại đây](/fundamentals/custom-providers).

#### Setting roles per handler (Thiết lập vai trò cho từng handler)

`RolesGuard` của chúng ta đang hoạt động, nhưng nó chưa thực sự thông minh. Chúng ta chưa tận dụng được tính năng quan trọng nhất của guard - [execution context](/fundamentals/execution-context). Nó chưa biết về vai trò, hoặc những vai trò nào được phép cho mỗi handler. `CatsController`, ví dụ, có thể có các scheme quyền khác nhau cho các route khác nhau. Một số có thể chỉ có sẵn cho người dùng admin, và những cái khác có thể mở cho mọi người. Làm thế nào chúng ta có thể khớp vai trò với route một cách linh hoạt và có thể tái sử dụng?

Đây là lúc **custom metadata** xuất hiện (tìm hiểu thêm [tại đây](https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata)). Nest cung cấp khả năng gắn **metadata** tùy chỉnh vào route handlers thông qua các decorators được tạo bằng phương thức tĩnh `Reflector#createDecorator`, hoặc decorator `@SetMetadata()` được tích hợp sẵn.

Ví dụ, hãy tạo một decorator `@Roles()` sử dụng phương thức `Reflector#createDecorator` sẽ gắn metadata vào handler. `Reflector` được cung cấp sẵn bởi framework và được exposed từ package `@nestjs/core`.

```ts
@@filename(roles.decorator)
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();
```

Decorator `Roles` ở đây là một hàm nhận một đối số duy nhất có kiểu `string[]`.

Bây giờ, để sử dụng decorator này, chúng ta chỉ cần chú thích handler với nó:

```typescript
@@filename(cats.controller)
@Post()
@Roles(['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles(['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

Ở đây chúng ta đã gắn metadata decorator `Roles` vào phương thức `create()`, chỉ ra rằng chỉ những người dùng có vai trò `admin` mới được phép truy cập route này.

Thay vào đó, thay vì sử dụng phương thức `Reflector#createDecorator`, chúng ta có thể sử dụng decorator `@SetMetadata()` được tích hợp sẵn. Tìm hiểu thêm [tại đây](/fundamentals/execution-context#low-level-approach).

#### Putting it all together (Kết hợp tất cả lại)

Bây giờ hãy quay lại và kết nối điều này với `RolesGuard` của chúng ta. Hiện tại, nó chỉ đơn giản trả về `true` trong mọi trường hợp, cho phép mọi request tiếp tục. Chúng ta muốn làm cho giá trị trả về có điều kiện dựa trên việc so sánh **vai trò được gán cho người dùng hiện tại** với vai trò thực sự được yêu cầu bởi route đang được xử lý. Để truy cập vai trò của route (metadata tùy chỉnh), chúng ta sẽ sử dụng lớp helper `Reflector` một lần nữa, như sau:

```typescript
@@filename(roles.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return matchRoles(roles, user.roles);
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';

@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return matchRoles(roles, user.roles);
  }
}
```

> info **Gợi ý** Trong thế giới node.js, thông thường người ta gắn người dùng đã được ủy quyền vào đối tượng `request`. Do đó, trong mã mẫu ở trên, chúng ta đang giả định rằng `request.user` chứa instance người dùng và các vai trò được phép. Trong ứng dụng của bạn, bạn có thể tạo liên kết đó trong **authentication guard** (hoặc middleware) tùy chỉnh của bạn. Xem [chương này](/security/authentication) để biết thêm thông tin về chủ đề này.

> warning **Cảnh báo** Logic bên trong hàm `matchRoles()` có thể đơn giản hoặc phức tạp tùy theo nhu cầu. Điểm chính của ví dụ này là để cho thấy cách guards phù hợp trong chu trình request/response.

Tham khảo phần <a href="https://docs.nestjs.com/fundamentals/execution-context#reflection-and-metadata">Reflection and metadata</a> của chương **Execution context** để biết thêm chi tiết về việc sử dụng `Reflector` theo cách nhạy cảm với ngữ cảnh.

Khi một người dùng có quyền không đủ yêu cầu một endpoint, Nest tự động trả về phản hồi sau:

```typescript
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

Lưu ý rằng phía sau, khi một guard trả về `false`, framework sẽ ném ra một `ForbiddenException`. Nếu bạn muốn trả về một phản hồi lỗi khác, bạn nên ném ra ngoại lệ cụ thể của riêng bạn. Ví dụ:

```typescript
throw new UnauthorizedException();
```

Bất kỳ ngoại lệ nào được ném ra bởi guard sẽ được xử lý bởi [lớp exceptions](/exception-filters) (global exceptions filter và bất kỳ exceptions filters nào được áp dụng cho ngữ cảnh hiện tại).

> info **Gợi ý** Nếu bạn đang tìm kiếm một ví dụ thực tế về cách triển khai authorization, hãy xem [chương này](/security/authorization).
