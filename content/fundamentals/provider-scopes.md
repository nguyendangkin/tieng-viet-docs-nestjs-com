### Phạm vi tiêm phụ thuộc (Injection scopes)

Đối với những người có nền tảng từ các ngôn ngữ lập trình khác, có thể họ sẽ ngạc nhiên khi biết rằng trong Nest, hầu hết mọi thứ đều được chia sẻ giữa các yêu cầu đến. Chúng ta có một pool kết nối đến cơ sở dữ liệu, các dịch vụ singleton với trạng thái toàn cục, v.v. Hãy nhớ rằng Node.js không tuân theo Mô hình Đa luồng Phi trạng thái theo Yêu cầu/Phản hồi, trong đó mỗi yêu cầu được xử lý bởi một luồng riêng biệt. Do đó, việc sử dụng các thể hiện singleton là hoàn toàn **an toàn** cho ứng dụng của chúng ta.

Tuy nhiên, có những trường hợp đặc biệt khi vòng đời dựa trên yêu cầu có thể là hành vi mong muốn, ví dụ như bộ nhớ đệm theo yêu cầu trong các ứng dụng GraphQL, theo dõi yêu cầu và đa người thuê. Phạm vi tiêm phụ thuộc cung cấp một cơ chế để đạt được hành vi vòng đời nhà cung cấp mong muốn.

#### Phạm vi nhà cung cấp (Provider scope)

Một nhà cung cấp có thể có một trong các phạm vi sau:

<table>
  <tr>
    <td><code>DEFAULT</code></td>
    <td>Một thể hiện duy nhất của nhà cung cấp được chia sẻ trong toàn bộ ứng dụng. Vòng đời của thể hiện gắn liền trực tiếp với vòng đời của ứng dụng. Khi ứng dụng đã khởi động, tất cả các nhà cung cấp singleton đã được khởi tạo. Phạm vi singleton được sử dụng mặc định.</td>
  </tr>
  <tr>
    <td><code>REQUEST</code></td>
    <td>Một thể hiện mới của nhà cung cấp được tạo riêng cho mỗi <strong>yêu cầu</strong> đến. Thể hiện này được thu gom rác sau khi yêu cầu đã xử lý xong.</td>
  </tr>
  <tr>
    <td><code>TRANSIENT</code></td>
    <td>Các nhà cung cấp tạm thời không được chia sẻ giữa các người tiêu dùng. Mỗi người tiêu dùng tiêm một nhà cung cấp tạm thời sẽ nhận được một thể hiện mới, riêng biệt.</td>
  </tr>
</table>

> info **Gợi ý** Sử dụng phạm vi singleton được **khuyến nghị** cho hầu hết các trường hợp sử dụng. Chia sẻ các nhà cung cấp giữa các người tiêu dùng và giữa các yêu cầu có nghĩa là một thể hiện có thể được lưu vào bộ nhớ đệm và việc khởi tạo của nó chỉ xảy ra một lần, trong quá trình khởi động ứng dụng.

#### Sử dụng (Usage)

Chỉ định phạm vi tiêm bằng cách truyền thuộc tính `scope` vào đối tượng tùy chọn của decorator `@Injectable()`:

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {}
```

Tương tự, đối với [nhà cung cấp tùy chỉnh](/fundamentals/custom-providers), đặt thuộc tính `scope` trong biểu mẫu dài cho đăng ký nhà cung cấp:

```typescript
{
  provide: 'CACHE_MANAGER',
  useClass: CacheManager,
  scope: Scope.TRANSIENT,
}
```

> info **Gợi ý** Nhập enum `Scope` từ `@nestjs/common`

Phạm vi singleton được sử dụng theo mặc định và không cần phải khai báo. Nếu bạn muốn khai báo một nhà cung cấp có phạm vi singleton, hãy sử dụng giá trị `Scope.DEFAULT` cho thuộc tính `scope`.

> warning **Lưu ý** Websocket Gateways không nên sử dụng các nhà cung cấp có phạm vi yêu cầu vì chúng phải hoạt động như singleton. Mỗi gateway bao gồm một socket thực và không thể được khởi tạo nhiều lần. Hạn chế này cũng áp dụng cho một số nhà cung cấp khác, như [_Passport strategies_](../security/authentication#request-scoped-strategies) hoặc _Cron controllers_.

#### Phạm vi bộ điều khiển (Controller scope)

Các bộ điều khiển cũng có thể có phạm vi, áp dụng cho tất cả các phương thức xử lý yêu cầu được khai báo trong bộ điều khiển đó. Giống như phạm vi nhà cung cấp, phạm vi của một bộ điều khiển khai báo vòng đời của nó. Đối với một bộ điều khiển có phạm vi yêu cầu, một thể hiện mới được tạo cho mỗi yêu cầu đến và được thu gom rác khi yêu cầu đã xử lý xong.

Khai báo phạm vi bộ điều khiển với thuộc tính `scope` của đối tượng `ControllerOptions`:

```typescript
@Controller({
  path: 'cats',
  scope: Scope.REQUEST,
})
export class CatsController {}
```

#### Phân cấp phạm vi (Scope hierarchy)

Phạm vi `REQUEST` lan truyền theo chuỗi tiêm. Một bộ điều khiển phụ thuộc vào một nhà cung cấp có phạm vi yêu cầu sẽ tự nó trở thành có phạm vi yêu cầu.

Hãy tưởng tượng đồ thị phụ thuộc sau: `CatsController <- CatsService <- CatsRepository`. Nếu `CatsService` có phạm vi yêu cầu (và các phần khác là singleton mặc định), `CatsController` sẽ trở thành có phạm vi yêu cầu vì nó phụ thuộc vào dịch vụ được tiêm. `CatsRepository`, không phụ thuộc, sẽ vẫn giữ phạm vi singleton.

Các phụ thuộc có phạm vi tạm thời không tuân theo mô hình đó. Nếu một `DogsService` có phạm vi singleton tiêm một nhà cung cấp `LoggerService` tạm thời, nó sẽ nhận được một thể hiện mới của nó. Tuy nhiên, `DogsService` sẽ vẫn giữ phạm vi singleton, vì vậy việc tiêm nó ở bất kỳ đâu cũng sẽ _không_ giải quyết thành một thể hiện mới của `DogsService`. Trong trường hợp đó là hành vi mong muốn, `DogsService` phải được đánh dấu rõ ràng là `TRANSIENT`.

<app-banner-courses></app-banner-courses>

#### Nhà cung cấp yêu cầu (Request provider)

Trong một ứng dụng dựa trên máy chủ HTTP (ví dụ: sử dụng `@nestjs/platform-express` hoặc `@nestjs/platform-fastify`), bạn có thể muốn truy cập một tham chiếu đến đối tượng yêu cầu gốc khi sử dụng các nhà cung cấp có phạm vi yêu cầu. Bạn có thể làm điều này bằng cách tiêm đối tượng `REQUEST`.

Nhà cung cấp `REQUEST` có phạm vi yêu cầu, vì vậy bạn không cần phải sử dụng rõ ràng phạm vi `REQUEST` trong trường hợp này.

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(REQUEST) private request: Request) {}
}
```

Do sự khác biệt về nền tảng/giao thức, bạn truy cập yêu cầu đến hơi khác một chút đối với các ứng dụng Microservice hoặc GraphQL. Trong các ứng dụng [GraphQL](/graphql/quick-start), bạn tiêm `CONTEXT` thay vì `REQUEST`:

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { CONTEXT } from '@nestjs/graphql';

@Injectable({ scope: Scope.REQUEST })
export class CatsService {
  constructor(@Inject(CONTEXT) private context) {}
}
```

Sau đó, bạn cấu hình giá trị `context` của mình (trong `GraphQLModule`) để chứa `request` như một thuộc tính của nó.

#### Nhà cung cấp truy vấn (Inquirer provider)

Nếu bạn muốn lấy lớp nơi một nhà cung cấp được xây dựng, ví dụ trong các nhà cung cấp ghi log hoặc đo lường, bạn có thể tiêm token `INQUIRER`.

```typescript
import { Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';

@Injectable({ scope: Scope.TRANSIENT })
export class HelloService {
  constructor(@Inject(INQUIRER) private parentClass: object) {}

  sayHello(message: string) {
    console.log(`${this.parentClass?.constructor?.name}: ${message}`);
  }
}
```

Và sau đó sử dụng nó như sau:

```typescript
import { Injectable } from '@nestjs/common';
import { HelloService } from './hello.service';

@Injectable()
export class AppService {
  constructor(private helloService: HelloService) {}

  getRoot(): string {
    this.helloService.sayHello('My name is getRoot');

    return 'Hello world!';
  }
}
```

Trong ví dụ trên, khi `AppService#getRoot` được gọi, `"AppService: My name is getRoot"` sẽ được ghi vào console.

#### Hiệu suất (Performance)

Sử dụng các nhà cung cấp có phạm vi yêu cầu sẽ có tác động đến hiệu suất ứng dụng. Mặc dù Nest cố gắng lưu trữ càng nhiều metadata càng tốt, nó vẫn phải tạo một thể hiện của lớp của bạn trên mỗi yêu cầu. Do đó, nó sẽ làm chậm thời gian phản hồi trung bình và kết quả đánh giá hiệu suất tổng thể của bạn. Trừ khi một nhà cung cấp phải có phạm vi yêu cầu, chúng tôi khuyên bạn nên sử dụng phạm vi singleton mặc định.

> info **Gợi ý** Mặc dù tất cả nghe có vẻ khá đáng sợ, một ứng dụng được thiết kế đúng cách sử dụng các nhà cung cấp có phạm vi yêu cầu không nên chậm đi quá 5% về mặt độ trễ.

#### Nhà cung cấp bền vững (Durable providers)

Các nhà cung cấp có phạm vi yêu cầu, như đã đề cập trong phần trước, có thể dẫn đến tăng độ trễ vì có ít nhất 1 nhà cung cấp có phạm vi yêu cầu (được tiêm vào thể hiện của bộ điều khiển, hoặc sâu hơn - được tiêm vào một trong các nhà cung cấp của nó) làm cho bộ điều khiển có phạm vi yêu cầu. Điều đó có nghĩa là nó phải được tạo lại (khởi tạo) cho mỗi yêu cầu riêng lẻ (và được thu gom rác sau đó). Bây giờ, điều đó cũng có nghĩa là, ví dụ, đối với 30k yêu cầu song song, sẽ có 30k thể hiện tạm thời của bộ điều khiển (và các nhà cung cấp có phạm vi yêu cầu của nó).

Có một nhà cung cấp chung mà hầu hết các nhà cung cấp phụ thuộc vào (nghĩ đến một kết nối cơ sở dữ liệu, hoặc một dịch vụ ghi log), tự động chuyển đổi tất cả các nhà cung cấp đó thành các nhà cung cấp có phạm vi yêu cầu. Điều này có thể gây ra thách thức trong **các ứng dụng đa người thuê**, đặc biệt là những ứng dụng có một nhà cung cấp "nguồn dữ liệu" trung tâm có phạm vi yêu cầu, lấy headers/token từ đối tượng yêu cầu và dựa trên các giá trị của nó, truy xuất kết nối/schema cơ sở dữ liệu tương ứng (cụ thể cho người thuê đó).

Ví dụ, giả sử bạn có một ứng dụng được sử dụng luân phiên bởi 10 khách hàng khác nhau. Mỗi khách hàng có **nguồn dữ liệu riêng**, và bạn muốn đảm bảo khách hàng A sẽ không bao giờ có thể truy cập vào cơ sở dữ liệu của khách hàng B. Một cách để đạt được điều này có thể là khai báo một nhà cung cấp "nguồn dữ liệu" có phạm vi yêu cầu, dựa trên đối tượng yêu cầu để xác định "khách hàng hiện tại" và truy xuất cơ sở dữ liệu tương ứng của họ. Với cách tiếp cận này, bạn có thể biến ứng dụng của mình thành một ứng dụng đa người thuê chỉ trong vài phút. Nhưng, một nhược điểm lớn của cách tiếp cận này là vì rất có thể một phần lớn các thành phần của ứng dụng của bạn phụ thuộc vào nhà cung cấp "nguồn dữ liệu", chúng sẽ ngầm trở thành "có phạm vi yêu cầu", và do đó bạn chắc chắn sẽ thấy tác động đến hiệu suất của ứng dụng.

Nhưng nếu chúng ta có một giải pháp tốt hơn? Vì chúng ta chỉ có 10 khách hàng, liệu chúng ta có thể có 10 [cây con DI](/fundamentals/module-ref#resolving-scoped-providers) riêng biệt cho mỗi khách hàng (thay vì tạo lại mỗi cây cho mỗi yêu cầu)? Nếu các nhà cung cấp của bạn không phụ thuộc vào bất kỳ thuộc tính nào thực sự duy nhất cho mỗi yêu cầu liên tiếp (ví dụ: UUID yêu cầu) mà thay vào đó có một số thuộc tính cụ thể cho phép chúng ta tổng hợp (phân loại) chúng, không có lý do gì để _tạo lại cây con DI_ trên mỗi yêu cầu đến.

Và đó chính xác là khi **các nhà cung cấp bền vững** phát huy tác dụng.

Trước khi chúng ta bắt đầu đánh dấu các nhà cung cấp là bền vững, trước tiên chúng ta phải đăng ký một **chiến lược** hướng dẫn Nest về những "thuộc tính yêu cầu chung" đó, cung cấp logic nhóm các yêu cầu - liên kết chúng với các cây con DI tương ứng của chúng.

```typescript
import { HostComponentInfo, ContextId, ContextIdFactory, ContextIdStrategy } from '@nestjs/core';
import { Request } from 'express';

const tenants = new Map<string, ContextId>();

export class AggregateByTenantContextIdStrategy implements ContextIdStrategy {
  attach(contextId: ContextId, request: Request) {
    const tenantId = request.headers['x-tenant-id'] as string;
    let tenantSubTreeId: ContextId;

    if (tenants.has(tenantId)) {
      tenantSubTreeId = tenants.get(tenantId);
    } else {
      tenantSubTreeId = ContextIdFactory.create();
      tenants.set(tenantId, tenantSubTreeId);
    }

    // Nếu cây không bền vững, trả về đối tượng "contextId" gốc
    return (info: HostComponentInfo) => (info.isTreeDurable ? tenantSubTreeId : contextId);
  }
}
```

> info **Gợi ý** Tương tự như phạm vi yêu cầu, tính bền vững lan truyền theo chuỗi tiêm. Điều đó có nghĩa là nếu A phụ thuộc vào B được đánh dấu là `durable`, A ngầm trở thành bền vững (trừ khi `durable` được đặt rõ ràng thành `false` cho nhà cung cấp A).

> warning **Cảnh báo** Lưu ý rằng chiến lược này không lý tưởng cho các ứng dụng hoạt động với số lượng lớn người thuê.

Giá trị trả về từ phương thức `attach` hướng dẫn Nest về việc nên sử dụng định danh ngữ cảnh nào cho một host nhất định. Trong trường hợp này, chúng ta đã chỉ định rằng `tenantSubTreeId` nên được sử dụng thay vì đối tượng `contextId` gốc được tạo tự động, khi thành phần host (ví dụ: bộ điều khiển có phạm vi yêu cầu) được đánh dấu là bền vững (bạn có thể học cách đánh dấu các nhà cung cấp là bền vững ở dưới). Ngoài ra, trong ví dụ trên, **không có payload** nào được đăng ký (trong đó payload = nhà cung cấp `REQUEST`/`CONTEXT` đại diện cho "gốc" - cha của cây con).

Nếu bạn muốn đăng ký payload cho một cây bền vững, hãy sử dụng cấu trúc sau thay thế:

```typescript
// Giá trị trả về của phương thức `AggregateByTenantContextIdStrategy#attach`:
return {
  resolve: (info: HostComponentInfo) => (info.isTreeDurable ? tenantSubTreeId : contextId),
  payload: { tenantId },
};
```

Bây giờ bất cứ khi nào bạn tiêm nhà cung cấp `REQUEST` (hoặc `CONTEXT` cho các ứng dụng GraphQL) sử dụng `@Inject(REQUEST)`/`@Inject(CONTEXT)`, đối tượng `payload` sẽ được tiêm (bao gồm một thuộc tính duy nhất - `tenantId` trong trường hợp này).

Được rồi, với chiến lược này, bạn có thể đăng ký nó ở đâu đó trong mã của bạn (vì nó áp dụng toàn cục), ví dụ, bạn có thể đặt nó trong file `main.ts`:

```typescript
ContextIdFactory.apply(new AggregateByTenantContextIdStrategy());
```

> info **Gợi ý** Lớp `ContextIdFactory` được nhập từ gói `@nestjs/core`.

Miễn là việc đăng ký xảy ra trước khi bất kỳ yêu cầu nào đến ứng dụng của bạn, mọi thứ sẽ hoạt động như dự định.

Cuối cùng, để biến một nhà cung cấp thông thường thành một nhà cung cấp bền vững, chỉ cần đặt cờ `durable` thành `true` và thay đổi phạm vi của nó thành `Scope.REQUEST` (không cần thiết nếu phạm vi REQUEST đã có trong chuỗi tiêm):

```typescript
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class CatsService {}
```

Tương tự, đối với [nhà cung cấp tùy chỉnh](/fundamentals/custom-providers), đặt thuộc tính `durable` trong biểu mẫu dài cho đăng ký nhà cung cấp:

```typescript
{
  provide: 'foobar',
  useFactory: () => { ... },
  scope: Scope.REQUEST,
  durable: true,
}
```
