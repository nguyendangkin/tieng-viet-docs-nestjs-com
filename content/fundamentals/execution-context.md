### Ngữ cảnh thực thi (Execution context)

Nest cung cấp một số lớp tiện ích giúp dễ dàng viết các ứng dụng hoạt động trên nhiều ngữ cảnh ứng dụng khác nhau (ví dụ: dựa trên máy chủ HTTP Nest, microservices và ngữ cảnh ứng dụng WebSockets). Những tiện ích này cung cấp thông tin về ngữ cảnh thực thi hiện tại, có thể được sử dụng để xây dựng các [guard](/guards), [filter](/exception-filters) và [interceptor](/interceptors) chung có thể hoạt động trên nhiều bộ điều khiển, phương thức và ngữ cảnh thực thi.

Chúng ta sẽ đề cập đến hai lớp như vậy trong chương này: `ArgumentsHost` và `ExecutionContext`.

#### Lớp ArgumentsHost (ArgumentsHost class)

Lớp `ArgumentsHost` cung cấp các phương thức để truy xuất các đối số được truyền vào một trình xử lý. Nó cho phép chọn ngữ cảnh phù hợp (ví dụ: HTTP, RPC (microservice) hoặc WebSockets) để truy xuất các đối số. Framework cung cấp một thể hiện của `ArgumentsHost`, thường được tham chiếu như một tham số `host`, ở những nơi bạn có thể muốn truy cập nó. Ví dụ, phương thức `catch()` của một [bộ lọc ngoại lệ](https://docs.nestjs.com/exception-filters#arguments-host) được gọi với một thể hiện `ArgumentsHost`.

`ArgumentsHost` đơn giản hoạt động như một trừu tượng hóa trên các đối số của trình xử lý. Ví dụ, đối với các ứng dụng máy chủ HTTP (khi `@nestjs/platform-express` được sử dụng), đối tượng `host` đóng gói mảng `[request, response, next]` của Express, trong đó `request` là đối tượng yêu cầu, `response` là đối tượng phản hồi và `next` là một hàm điều khiển chu kỳ yêu cầu-phản hồi của ứng dụng. Mặt khác, đối với các ứng dụng [GraphQL](/graphql/quick-start), đối tượng `host` chứa mảng `[root, args, context, info]`.

#### Ngữ cảnh ứng dụng hiện tại (Current application context)

Khi xây dựng các [guard](/guards), [filter](/exception-filters) và [interceptor](/interceptors) chung được thiết kế để chạy trên nhiều ngữ cảnh ứng dụng, chúng ta cần một cách để xác định loại ứng dụng mà phương thức của chúng ta đang chạy. Thực hiện điều này bằng phương thức `getType()` của `ArgumentsHost`:

```typescript
if (host.getType() === 'http') {
  // làm điều gì đó chỉ quan trọng trong ngữ cảnh của các yêu cầu HTTP thông thường (REST)
} else if (host.getType() === 'rpc') {
  // làm điều gì đó chỉ quan trọng trong ngữ cảnh của các yêu cầu Microservice
} else if (host.getType<GqlContextType>() === 'graphql') {
  // làm điều gì đó chỉ quan trọng trong ngữ cảnh của các yêu cầu GraphQL
}
```

> info **Gợi ý** `GqlContextType` được import từ gói `@nestjs/graphql`.

Với loại ứng dụng có sẵn, chúng ta có thể viết các thành phần chung hơn, như được hiển thị bên dưới.

#### Đối số trình xử lý máy chủ (Host handler arguments)

Để truy xuất mảng các đối số được truyền vào trình xử lý, một cách tiếp cận là sử dụng phương thức `getArgs()` của đối tượng host.

```typescript
const [req, res, next] = host.getArgs();
```

Bạn có thể lấy một đối số cụ thể bằng chỉ số sử dụng phương thức `getArgByIndex()`:

```typescript
const request = host.getArgByIndex(0);
const response = host.getArgByIndex(1);
```

Trong các ví dụ này, chúng ta đã truy xuất các đối tượng yêu cầu và phản hồi bằng chỉ số, điều này thường không được khuyến nghị vì nó gắn kết ứng dụng với một ngữ cảnh thực thi cụ thể. Thay vào đó, bạn có thể làm cho mã của mình mạnh mẽ và có thể tái sử dụng hơn bằng cách sử dụng một trong các phương thức tiện ích của đối tượng `host` để chuyển đổi sang ngữ cảnh ứng dụng phù hợp cho ứng dụng của bạn. Các phương thức tiện ích chuyển đổi ngữ cảnh được hiển thị bên dưới.

```typescript
/**
 * Chuyển ngữ cảnh sang RPC.
 */
switchToRpc(): RpcArgumentsHost;
/**
 * Chuyển ngữ cảnh sang HTTP.
 */
switchToHttp(): HttpArgumentsHost;
/**
 * Chuyển ngữ cảnh sang WebSockets.
 */
switchToWs(): WsArgumentsHost;
```

Hãy viết lại ví dụ trước đó bằng cách sử dụng phương thức `switchToHttp()`. Lệnh gọi trợ giúp `host.switchToHttp()` trả về một đối tượng `HttpArgumentsHost` phù hợp cho ngữ cảnh ứng dụng HTTP. Đối tượng `HttpArgumentsHost` có hai phương thức hữu ích mà chúng ta có thể sử dụng để trích xuất các đối tượng mong muốn. Chúng ta cũng sử dụng các khẳng định kiểu Express trong trường hợp này để trả về các đối tượng kiểu Express gốc:

```typescript
const ctx = host.switchToHttp();
const request = ctx.getRequest<Request>();
const response = ctx.getResponse<Response>();
```

Tương tự, `WsArgumentsHost` và `RpcArgumentsHost` có các phương thức để trả về các đối tượng phù hợp trong các ngữ cảnh microservices và WebSockets. Đây là các phương thức cho `WsArgumentsHost`:

```typescript
export interface WsArgumentsHost {
  /**
   * Trả về đối tượng dữ liệu.
   */
  getData<T>(): T;
  /**
   * Trả về đối tượng khách hàng.
   */
  getClient<T>(): T;
}
```

Sau đây là các phương thức cho `RpcArgumentsHost`:

```typescript
export interface RpcArgumentsHost {
  /**
   * Trả về đối tượng dữ liệu.
   */
  getData<T>(): T;

  /**
   * Trả về đối tượng ngữ cảnh.
   */
  getContext<T>(): T;
}
```

#### Lớp ExecutionContext (ExecutionContext class)

`ExecutionContext` mở rộng `ArgumentsHost`, cung cấp thêm chi tiết về quá trình thực thi hiện tại. Giống như `ArgumentsHost`, Nest cung cấp một thể hiện của `ExecutionContext` ở những nơi bạn có thể cần nó, chẳng hạn như trong phương thức `canActivate()` của một [guard](https://docs.nestjs.com/guards#execution-context) và phương thức `intercept()` của một [interceptor](https://docs.nestjs.com/interceptors#execution-context). Nó cung cấp các phương thức sau:

```typescript
export interface ExecutionContext extends ArgumentsHost {
  /**
   * Trả về kiểu của lớp điều khiển mà trình xử lý hiện tại thuộc về.
   */
  getClass<T>(): Type<T>;
  /**
   * Trả về một tham chiếu đến trình xử lý (phương thức) sẽ được gọi tiếp theo
   * trong pipeline yêu cầu.
   */
  getHandler(): Function;
}
```

Phương thức `getHandler()` trả về một tham chiếu đến trình xử lý sắp được gọi. Phương thức `getClass()` trả về kiểu của lớp `Controller` mà trình xử lý cụ thể này thuộc về. Ví dụ, trong ngữ cảnh HTTP, nếu yêu cầu đang được xử lý hiện tại là một yêu cầu `POST`, được gắn với phương thức `create()` trên `CatsController`, `getHandler()` trả về một tham chiếu đến phương thức `create()` và `getClass()` trả về **lớp** `CatsController` (không phải thể hiện).

```typescript
const methodKey = ctx.getHandler().name; // "create"
const className = ctx.getClass().name; // "CatsController"
```

Khả năng truy cập tham chiếu đến cả lớp hiện tại và phương thức xử lý cung cấp sự linh hoạt lớn. Quan trọng nhất, nó cho chúng ta cơ hội truy cập metadata được đặt thông qua các decorator được tạo bằng `Reflector#createDecorator` hoặc decorator `@SetMetadata()` tích hợp từ bên trong các guard hoặc interceptor. Chúng ta sẽ đề cập đến trường hợp sử dụng này bên dưới.

<app-banner-enterprise></app-banner-enterprise>

#### Phản chiếu và metadata (Reflection and metadata)

Nest cung cấp khả năng gắn **metadata tùy chỉnh** vào các trình xử lý route thông qua các decorator được tạo bằng phương thức `Reflector#createDecorator`, và decorator `@SetMetadata()` tích hợp sẵn. Trong phần này, hãy so sánh hai cách tiếp cận và xem cách truy cập metadata từ bên trong một guard hoặc interceptor.

Để tạo các decorator có kiểu mạnh sử dụng `Reflector#createDecorator`, chúng ta cần chỉ định đối số kiểu. Ví dụ, hãy tạo một decorator `Roles` nhận một mảng các chuỗi làm đối số.

```ts
@@filename(roles.decorator)
import { Reflector } from '@nestjs/core';

export const Roles = Reflector.createDecorator<string[]>();
```

Decorator `Roles` ở đây là một hàm nhận một đối số kiểu `string[]`.

Bây giờ, để sử dụng decorator này, chúng ta chỉ cần chú thích trình xử lý với nó:

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

Ở đây chúng ta đã gắn metadata của decorator `Roles` vào phương thức `create()`, chỉ ra rằng chỉ những người dùng có vai trò `admin` mới được phép truy cập route này.

Để truy cập (các) vai trò của route (metadata tùy chỉnh), chúng ta sẽ sử dụng lớp trợ giúp `Reflector` một lần nữa. `Reflector` có thể được tiêm vào một lớp theo cách thông thường:

```typescript
@@filename(roles.guard)
@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}
}
@@switch
@Injectable()
@Dependencies(Reflector)
export class CatsService {
  constructor(reflector) {
    this.reflector = reflector;
  }
}
```

> info **Gợi ý** Lớp `Reflector` được import từ gói `@nestjs/core`.

Bây giờ, để đọc metadata của trình xử lý, sử dụng phương thức `get()`:

```typescript
const roles = this.reflector.get(Roles, context.getHandler());
```

Phương thức `Reflector#get` cho phép chúng ta dễ dàng truy cập metadata bằng cách truyền vào hai đối số: một tham chiếu decorator và một **ngữ cảnh** (mục tiêu decorator) để truy xuất metadata từ đó. Trong ví dụ này, **decorator** được chỉ định là `Roles` (tham khảo lại tệp `roles.decorator.ts` ở trên). Ngữ cảnh được cung cấp bởi lệnh gọi `context.getHandler()`, dẫn đến việc trích xuất metadata cho trình xử lý route đang được xử lý hiện tại. Hãy nhớ rằng, `getHandler()` cung cấp cho chúng ta một **tham chiếu** đến hàm xử lý route.

Ngoài ra, chúng ta có thể tổ chức bộ điều khiển của mình bằng cách áp dụng metadata ở cấp độ bộ điều khiển, áp dụng cho tất cả các route trong lớp bộ điều khiển.

```typescript
@@filename(cats.controller)
@Roles(['admin'])
@Controller('cats')
export class CatsController {}
@@switch
@Roles(['admin'])
@Controller('cats')
export class CatsController {}
```

Trong trường hợp này, để trích xuất metadata của bộ điều khiển, chúng ta truyền `context.getClass()` làm đối số thứ hai (để cung cấp lớp bộ điều khiển làm ngữ cảnh cho việc trích xuất metadata) thay vì `context.getHandler()`:

```typescript
@@filename(roles.guard)
const roles = this.reflector.get(Roles, context.getClass());
```

Do khả năng cung cấp metadata ở nhiều cấp độ, bạn có thể cần trích xuất và kết hợp metadata từ nhiều ngữ cảnh. Lớp `Reflector` cung cấp hai phương thức tiện ích được sử dụng để giúp với việc này. Các phương thức này trích xuất metadata **cả** từ bộ điều khiển và phương thức cùng một lúc, và kết hợp chúng theo các cách khác nhau.

Hãy xem xét kịch bản sau, nơi bạn đã cung cấp metadata `Roles` ở cả hai cấp độ.

```typescript
@@filename(cats.controller)
@Roles(['user'])
@Controller('cats')
export class CatsController {
  @Post()
  @Roles(['admin'])
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }
}
@@switch
@Roles(['user'])
@Controller('cats')
export class CatsController {}
  @Post()
  @Roles(['admin'])
  @Bind(Body())
  async create(createCatDto) {
    this.catsService.create(createCatDto);
  }
}
```

Nếu mục đích của bạn là chỉ định `'user'` làm vai trò mặc định và ghi đè nó có chọn lọc cho một số phương thức nhất định, bạn có thể sẽ sử dụng phương thức `getAllAndOverride()`.

```typescript
const roles = this.reflector.getAllAndOverride(Roles, [context.getHandler(), context.getClass()]);
```

Một guard với mã này, chạy trong ngữ cảnh của phương thức `create()`, với metadata ở trên, sẽ dẫn đến `roles` chứa `['admin']`.

Để lấy metadata cho cả hai và kết hợp chúng (phương thức này kết hợp cả mảng và đối tượng), sử dụng phương thức `getAllAndMerge()`:

```typescript
const roles = this.reflector.getAllAndMerge(Roles, [context.getHandler(), context.getClass()]);
```

Điều này sẽ dẫn đến `roles` chứa `['user', 'admin']`.

Đối với cả hai phương thức kết hợp này, bạn truyền khóa metadata làm đối số đầu tiên, và một mảng các ngữ cảnh mục tiêu metadata (tức là, các lệnh gọi đến phương thức `getHandler()` và/hoặc `getClass()`) làm đối số thứ hai.

#### Cách tiếp cận cấp thấp (Low-level approach)

Như đã đề cập trước đó, thay vì sử dụng `Reflector#createDecorator`, bạn cũng có thể sử dụng decorator `@SetMetadata()` tích hợp sẵn để gắn metadata vào một trình xử lý.

```typescript
@@filename(cats.controller)
@Post()
@SetMetadata('roles', ['admin'])
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@SetMetadata('roles', ['admin'])
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Gợi ý** Decorator `@SetMetadata()` được import từ gói `@nestjs/common`.

Với cấu trúc trên, chúng ta đã gắn metadata `roles` (trong đó `roles` là khóa metadata và `['admin']` là giá trị liên kết) vào phương thức `create()`. Mặc dù điều này hoạt động, nhưng không phải là thực hành tốt để sử dụng `@SetMetadata()` trực tiếp trong các route của bạn. Thay vào đó, bạn có thể tạo các decorator riêng của mình, như được hiển thị dưới đây:

```typescript
@@filename(roles.decorator)
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
@@switch
import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles) => SetMetadata('roles', roles);
```

Cách tiếp cận này sạch sẽ và dễ đọc hơn, và hơi giống với cách tiếp cận `Reflector#createDecorator`. Sự khác biệt là với `@SetMetadata` bạn có nhiều kiểm soát hơn đối với khóa và giá trị metadata, và cũng có thể tạo các decorator nhận nhiều hơn một đối số.

Bây giờ chúng ta có một decorator `@Roles()` tùy chỉnh, chúng ta có thể sử dụng nó để trang trí phương thức `create()`.

```typescript
@@filename(cats.controller)
@Post()
@Roles('admin')
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles('admin')
@Bind(Body())
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

Để truy cập (các) vai trò của route (metadata tùy chỉnh), chúng ta sẽ sử dụng lớp trợ giúp `Reflector` một lần nữa:

```typescript
@@filename(roles.guard)
@Injectable()
export class RolesGuard {
  constructor(private reflector: Reflector) {}
}
@@switch
@Injectable()
@Dependencies(Reflector)
export class CatsService {
  constructor(reflector) {
    this.reflector = reflector;
  }
}
```

> info **Gợi ý** Lớp `Reflector` được import từ gói `@nestjs/core`.

Bây giờ, để đọc metadata của trình xử lý, sử dụng phương thức `get()`.

```typescript
const roles = this.reflector.get<string[]>('roles', context.getHandler());
```

Ở đây thay vì truyền một tham chiếu decorator, chúng ta truyền **khóa** metadata làm đối số đầu tiên (trong trường hợp của chúng ta là `'roles'`). Mọi thứ khác vẫn giữ nguyên như trong ví dụ `Reflector#createDecorator`.
