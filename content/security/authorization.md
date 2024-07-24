### Ủy quyền (Authorization)

**Ủy quyền** (Authorization) đề cập đến quá trình xác định những gì một người dùng có thể làm. Ví dụ, một người dùng quản trị được phép tạo, chỉnh sửa và xóa bài đăng. Một người dùng không phải quản trị chỉ được ủy quyền để đọc các bài đăng.

Ủy quyền là trực giao và độc lập với xác thực. Tuy nhiên, ủy quyền yêu cầu một cơ chế xác thực.

Có nhiều cách tiếp cận và chiến lược khác nhau để xử lý ủy quyền. Cách tiếp cận được chọn cho bất kỳ dự án nào phụ thuộc vào các yêu cầu ứng dụng cụ thể của nó. Chương này giới thiệu một số cách tiếp cận ủy quyền có thể được điều chỉnh cho nhiều yêu cầu khác nhau.

#### Triển khai RBAC cơ bản (Basic RBAC implementation)

Kiểm soát truy cập dựa trên vai trò (**RBAC**) là một cơ chế kiểm soát truy cập trung lập về chính sách được định nghĩa xung quanh vai trò và đặc quyền. Trong phần này, chúng ta sẽ trình bày cách triển khai một cơ chế RBAC rất cơ bản sử dụng [guards](/guards) của Nest.

Đầu tiên, hãy tạo một enum `Role` đại diện cho các vai trò trong hệ thống:

```typescript
@@filename(role.enum)
export enum Role {
  User = 'user',
  Admin = 'admin',
}
```

> info **Gợi ý** Trong các hệ thống phức tạp hơn, bạn có thể lưu trữ vai trò trong cơ sở dữ liệu hoặc lấy chúng từ nhà cung cấp xác thực bên ngoài.

Với điều này, chúng ta có thể tạo một decorator `@Roles()`. Decorator này cho phép chỉ định những vai trò nào được yêu cầu để truy cập vào các tài nguyên cụ thể.

```typescript
@@filename(roles.decorator)
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
@@switch
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);
```

Bây giờ chúng ta đã có một decorator `@Roles()` tùy chỉnh, chúng ta có thể sử dụng nó để trang trí bất kỳ bộ xử lý route nào.

```typescript
@@filename(cats.controller)
@Post()
@Roles(Role.Admin)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Roles(Role.Admin)
@Bind(Body())
create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

Cuối cùng, chúng ta tạo một lớp `RolesGuard` sẽ so sánh các vai trò được gán cho người dùng hiện tại với các vai trò thực tế được yêu cầu bởi route đang được xử lý. Để truy cập (các) vai trò của route (metadata tùy chỉnh), chúng ta sẽ sử dụng lớp trợ giúp `Reflector`, được cung cấp sẵn bởi framework và được xuất từ gói `@nestjs/core`.

```typescript
@@filename(roles.guard)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
@Dependencies(Reflector)
export class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const requiredRoles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles.includes(role));
  }
}
```

> info **Gợi ý** Tham khảo phần [Reflection và metadata](/fundamentals/execution-context#reflection-and-metadata) của chương Execution context để biết thêm chi tiết về việc sử dụng `Reflector` theo cách nhạy cảm với ngữ cảnh.

> warning **Lưu ý** Ví dụ này được gọi là "**cơ bản**" vì chúng ta chỉ kiểm tra sự hiện diện của vai trò ở cấp độ bộ xử lý route. Trong các ứng dụng thực tế, bạn có thể có các điểm cuối/bộ xử lý liên quan đến nhiều hoạt động, trong đó mỗi hoạt động yêu cầu một tập hợp quyền cụ thể. Trong trường hợp này, bạn sẽ phải cung cấp một cơ chế để kiểm tra vai trò ở đâu đó trong logic kinh doanh của bạn, khiến việc duy trì trở nên khó khăn hơn vì sẽ không có nơi tập trung liên kết quyền với các hành động cụ thể.

Trong ví dụ này, chúng ta giả định rằng `request.user` chứa thể hiện người dùng và các vai trò được phép (dưới thuộc tính `roles`). Trong ứng dụng của bạn, có thể bạn sẽ tạo ra mối liên kết đó trong **authentication guard** tùy chỉnh của bạn - xem chương [xác thực](/security/authentication) để biết thêm chi tiết.

Để đảm bảo ví dụ này hoạt động, lớp `User` của bạn phải trông như sau:

```typescript
class User {
  // ...các thuộc tính khác
  roles: Role[];
}
```

Cuối cùng, hãy đảm bảo đăng ký `RolesGuard`, ví dụ, ở cấp độ controller, hoặc toàn cục:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
],
```

Khi một người dùng với quyền không đủ yêu cầu một điểm cuối, Nest sẽ tự động trả về phản hồi sau:

```typescript
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

> info **Gợi ý** Nếu bạn muốn trả về một phản hồi lỗi khác, bạn nên ném ra một ngoại lệ cụ thể của riêng bạn thay vì trả về một giá trị boolean.

<app-banner-courses-auth></app-banner-courses-auth>

#### Ủy quyền dựa trên yêu cầu (Claims-based authorization)

Khi một danh tính được tạo ra, nó có thể được gán một hoặc nhiều yêu cầu được cấp bởi một bên đáng tin cậy. Một yêu cầu là một cặp tên-giá trị đại diện cho những gì chủ thể có thể làm, không phải chủ thể là gì.

Để triển khai ủy quyền dựa trên yêu cầu trong Nest, bạn có thể làm theo các bước chúng tôi đã trình bày ở trên trong phần [RBAC](/security/authorization#basic-rbac-implementation) với một sự khác biệt đáng kể: thay vì kiểm tra các vai trò cụ thể, bạn nên so sánh **quyền**. Mỗi người dùng sẽ có một tập hợp quyền được gán. Tương tự, mỗi tài nguyên/điểm cuối sẽ xác định những quyền nào được yêu cầu (ví dụ, thông qua một decorator `@RequirePermissions()` chuyên dụng) để truy cập chúng.

```typescript
@@filename(cats.controller)
@Post()
@RequirePermissions(Permission.CREATE_CAT)
create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@RequirePermissions(Permission.CREATE_CAT)
@Bind(Body())
create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Gợi ý** Trong ví dụ trên, `Permission` (tương tự như `Role` mà chúng ta đã trình bày trong phần RBAC) là một enum TypeScript chứa tất cả các quyền có sẵn trong hệ thống của bạn.

Đây là bản dịch của đoạn văn với các tiêu đề và cú pháp markdown được giữ nguyên:

#### Tích hợp CASL (Integrating CASL)

[CASL](https://casl.js.org/) là một thư viện ủy quyền đồng hình hạn chế những tài nguyên mà một khách hàng cụ thể được phép truy cập. Nó được thiết kế để có thể áp dụng từng bước và có thể dễ dàng mở rộng giữa ủy quyền dựa trên yêu cầu đơn giản và ủy quyền dựa trên chủ thể và thuộc tính đầy đủ tính năng.

Để bắt đầu, trước tiên hãy cài đặt gói `@casl/ability`:

```bash
$ npm i @casl/ability
```

> info **Gợi ý** Trong ví dụ này, chúng tôi chọn CASL, nhưng bạn có thể sử dụng bất kỳ thư viện nào khác như `accesscontrol` hoặc `acl`, tùy thuộc vào sở thích và nhu cầu dự án của bạn.

Sau khi hoàn tất cài đặt, để minh họa cơ chế của CASL, chúng ta sẽ định nghĩa hai lớp thực thể: `User` và `Article`.

```typescript
class User {
  id: number;
  isAdmin: boolean;
}
```

Lớp `User` bao gồm hai thuộc tính, `id`, là một định danh người dùng duy nhất, và `isAdmin`, cho biết liệu người dùng có quyền quản trị hay không.

```typescript
class Article {
  id: number;
  isPublished: boolean;
  authorId: number;
}
```

Lớp `Article` có ba thuộc tính, lần lượt là `id`, `isPublished`, và `authorId`. `id` là một định danh bài viết duy nhất, `isPublished` cho biết liệu một bài viết đã được xuất bản hay chưa, và `authorId`, là ID của người dùng đã viết bài viết.

Bây giờ hãy xem xét và tinh chỉnh các yêu cầu của chúng ta cho ví dụ này:

- Quản trị viên có thể quản lý (tạo/đọc/cập nhật/xóa) tất cả các thực thể
- Người dùng chỉ có quyền đọc đối với mọi thứ
- Người dùng có thể cập nhật các bài viết của họ (`article.authorId === userId`)
- Các bài viết đã được xuất bản không thể bị xóa (`article.isPublished === true`)

Với điều này trong tâm trí, chúng ta có thể bắt đầu bằng cách tạo một enum `Action` đại diện cho tất cả các hành động có thể mà người dùng có thể thực hiện với các thực thể:

```typescript
export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}
```

> warning **Lưu ý** `manage` là một từ khóa đặc biệt trong CASL đại diện cho "bất kỳ" hành động nào.

Để đóng gói thư viện CASL, hãy tạo `CaslModule` và `CaslAbilityFactory` ngay bây giờ.

```bash
$ nest g module casl
$ nest g class casl/casl-ability.factory
```

Với điều này, chúng ta có thể định nghĩa phương thức `createForUser()` trên `CaslAbilityFactory`. Phương thức này sẽ tạo đối tượng `Ability` cho một người dùng cụ thể:

```typescript
type Subjects = InferSubjects<typeof Article | typeof User> | 'all';

export type AppAbility = Ability<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: User) {
    const { can, cannot, build } = new AbilityBuilder<Ability<[Action, Subjects]>>(Ability as AbilityClass<AppAbility>);

    if (user.isAdmin) {
      can(Action.Manage, 'all'); // quyền đọc-ghi cho mọi thứ
    } else {
      can(Action.Read, 'all'); // quyền chỉ đọc cho mọi thứ
    }

    can(Action.Update, Article, { authorId: user.id });
    cannot(Action.Delete, Article, { isPublished: true });

    return build({
      // Đọc https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types để biết chi tiết
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
```

> warning **Lưu ý** `all` là một từ khóa đặc biệt trong CASL đại diện cho "bất kỳ chủ thể nào".

> info **Gợi ý** Các lớp `Ability`, `AbilityBuilder`, `AbilityClass`, và `ExtractSubjectType` được xuất từ gói `@casl/ability`.

> info **Gợi ý** Tùy chọn `detectSubjectType` cho phép CASL hiểu cách lấy loại chủ thể từ một đối tượng. Để biết thêm thông tin, hãy đọc [tài liệu CASL](https://casl.js.org/v6/en/guide/subject-type-detection#use-classes-as-subject-types) để biết chi tiết.

Trong ví dụ trên, chúng ta đã tạo thể hiện `Ability` sử dụng lớp `AbilityBuilder`. Như bạn có thể đoán, `can` và `cannot` chấp nhận các đối số giống nhau nhưng có ý nghĩa khác nhau, `can` cho phép thực hiện một hành động trên chủ thể được chỉ định và `cannot` cấm. Cả hai có thể chấp nhận tối đa 4 đối số. Để tìm hiểu thêm về các hàm này, hãy truy cập [tài liệu CASL chính thức](https://casl.js.org/v6/en/guide/intro).

Cuối cùng, hãy đảm bảo thêm `CaslAbilityFactory` vào các mảng `providers` và `exports` trong định nghĩa module `CaslModule`:

```typescript
import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';

@Module({
  providers: [CaslAbilityFactory],
  exports: [CaslAbilityFactory],
})
export class CaslModule {}
```

Với điều này, chúng ta có thể tiêm `CaslAbilityFactory` vào bất kỳ lớp nào bằng cách sử dụng injection constructor tiêu chuẩn miễn là `CaslModule` được import trong ngữ cảnh chủ:

```typescript
constructor(private caslAbilityFactory: CaslAbilityFactory) {}
```

Sau đó sử dụng nó trong một lớp như sau.

```typescript
const ability = this.caslAbilityFactory.createForUser(user);
if (ability.can(Action.Read, 'all')) {
  // "user" có quyền đọc đối với mọi thứ
}
```

> info **Gợi ý** Tìm hiểu thêm về lớp `Ability` trong [tài liệu CASL chính thức](https://casl.js.org/v6/en/guide/intro).

Ví dụ, giả sử chúng ta có một người dùng không phải là quản trị viên. Trong trường hợp này, người dùng nên có thể đọc các bài viết, nhưng việc tạo mới hoặc xóa các bài viết hiện có nên bị cấm.

```typescript
const user = new User();
user.isAdmin = false;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Read, Article); // true
ability.can(Action.Delete, Article); // false
ability.can(Action.Create, Article); // false
```

> info **Gợi ý** Mặc dù cả lớp `Ability` và `AbilityBuilder` đều cung cấp các phương thức `can` và `cannot`, chúng có mục đích khác nhau và chấp nhận các đối số hơi khác nhau.

Ngoài ra, như chúng ta đã chỉ định trong yêu cầu của mình, người dùng nên có thể cập nhật các bài viết của họ:

```typescript
const user = new User();
user.id = 1;

const article = new Article();
article.authorId = user.id;

const ability = this.caslAbilityFactory.createForUser(user);
ability.can(Action.Update, article); // true

article.authorId = 2;
ability.can(Action.Update, article); // false
```

Như bạn có thể thấy, thể hiện `Ability` cho phép chúng ta kiểm tra quyền một cách khá dễ đọc. Tương tự, `AbilityBuilder` cho phép chúng ta định nghĩa quyền (và chỉ định các điều kiện khác nhau) theo cách tương tự. Để tìm thêm ví dụ, hãy truy cập tài liệu chính thức.

Đây là bản dịch của đoạn văn với các tiêu đề và cú pháp markdown được giữ nguyên:

#### Nâng cao: Triển khai một `PoliciesGuard` (Advanced: Implementing a `PoliciesGuard`)

Trong phần này, chúng ta sẽ trình bày cách xây dựng một guard phức tạp hơn một chút, kiểm tra xem người dùng có đáp ứng các **chính sách ủy quyền** cụ thể có thể được cấu hình ở cấp độ phương thức hay không (bạn có thể mở rộng nó để tôn trọng các chính sách được cấu hình ở cấp độ lớp nữa). Trong ví dụ này, chúng ta sẽ sử dụng gói CASL chỉ cho mục đích minh họa, nhưng việc sử dụng thư viện này không bắt buộc. Ngoài ra, chúng ta sẽ sử dụng provider `CaslAbilityFactory` mà chúng ta đã tạo trong phần trước.

Đầu tiên, hãy xác định rõ các yêu cầu. Mục tiêu là cung cấp một cơ chế cho phép chỉ định kiểm tra chính sách cho từng bộ xử lý route. Chúng ta sẽ hỗ trợ cả đối tượng và hàm (cho các kiểm tra đơn giản hơn và cho những người thích mã theo phong cách hướng hàm hơn).

Hãy bắt đầu bằng cách định nghĩa các giao diện cho các trình xử lý chính sách:

```typescript
import { AppAbility } from '../casl/casl-ability.factory';

interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
```

Như đã đề cập ở trên, chúng ta đã cung cấp hai cách có thể để định nghĩa một trình xử lý chính sách, một đối tượng (thể hiện của một lớp triển khai giao diện `IPolicyHandler`) và một hàm (đáp ứng kiểu `PolicyHandlerCallback`).

Với điều này, chúng ta có thể tạo một decorator `@CheckPolicies()`. Decorator này cho phép chỉ định những chính sách nào phải được đáp ứng để truy cập các tài nguyên cụ thể.

```typescript
export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandler[]) => SetMetadata(CHECK_POLICIES_KEY, handlers);
```

Bây giờ hãy tạo một `PoliciesGuard` sẽ trích xuất và thực thi tất cả các trình xử lý chính sách được gắn với một bộ xử lý route.

```typescript
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private reflector: Reflector, private caslAbilityFactory: CaslAbilityFactory) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers = this.reflector.get<PolicyHandler[]>(CHECK_POLICIES_KEY, context.getHandler()) || [];

    const { user } = context.switchToHttp().getRequest();
    const ability = this.caslAbilityFactory.createForUser(user);

    return policyHandlers.every((handler) => this.execPolicyHandler(handler, ability));
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
```

> info **Gợi ý** Trong ví dụ này, chúng ta giả định rằng `request.user` chứa thể hiện người dùng. Trong ứng dụng của bạn, có thể bạn sẽ tạo ra mối liên kết đó trong **guard xác thực** tùy chỉnh của bạn - xem chương [xác thực](/security/authentication) để biết thêm chi tiết.

Hãy phân tích ví dụ này. `policyHandlers` là một mảng các trình xử lý được gán cho phương thức thông qua decorator `@CheckPolicies()`. Tiếp theo, chúng ta sử dụng phương thức `CaslAbilityFactory#create` để tạo đối tượng `Ability`, cho phép chúng ta xác minh liệu người dùng có đủ quyền để thực hiện các hành động cụ thể hay không. Chúng ta đang truyền đối tượng này cho trình xử lý chính sách, có thể là một hàm hoặc một thể hiện của lớp triển khai `IPolicyHandler`, hiển thị phương thức `handle()` trả về một giá trị boolean. Cuối cùng, chúng ta sử dụng phương thức `Array#every` để đảm bảo rằng mọi trình xử lý đều trả về giá trị `true`.

Cuối cùng, để kiểm tra guard này, hãy gắn nó vào bất kỳ bộ xử lý route nào và đăng ký một trình xử lý chính sách nội tuyến (cách tiếp cận hàm), như sau:

```typescript
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies((ability: AppAbility) => ability.can(Action.Read, Article))
findAll() {
  return this.articlesService.findAll();
}
```

Ngoài ra, chúng ta có thể định nghĩa một lớp triển khai giao diện `IPolicyHandler`:

```typescript
export class ReadArticlePolicyHandler implements IPolicyHandler {
  handle(ability: AppAbility) {
    return ability.can(Action.Read, Article);
  }
}
```

Và sử dụng nó như sau:

```typescript
@Get()
@UseGuards(PoliciesGuard)
@CheckPolicies(new ReadArticlePolicyHandler())
findAll() {
  return this.articlesService.findAll();
}
```

> warning **Lưu ý** Vì chúng ta phải khởi tạo trình xử lý chính sách tại chỗ bằng từ khóa `new`, lớp `ReadArticlePolicyHandler` không thể sử dụng Dependency Injection. Điều này có thể được giải quyết bằng phương thức `ModuleRef#get` (đọc thêm [tại đây](/fundamentals/module-ref)). Về cơ bản, thay vì đăng ký các hàm và thể hiện thông qua decorator `@CheckPolicies()`, bạn phải cho phép truyền một `Type<IPolicyHandler>`. Sau đó, bên trong guard của bạn, bạn có thể truy xuất một thể hiện bằng cách sử dụng tham chiếu kiểu: `moduleRef.get(YOUR_HANDLER_TYPE)` hoặc thậm chí khởi tạo nó động bằng phương thức `ModuleRef#create`.
