### Quản lý phiên bản (Versioning)

> **Gợi ý** Chương này chỉ liên quan đến các ứng dụng dựa trên HTTP.

Quản lý phiên bản cho phép bạn có **các phiên bản khác nhau** của các bộ điều khiển hoặc các tuyến đường riêng lẻ chạy trong cùng một ứng dụng. Ứng dụng thay đổi rất thường xuyên và không hiếm khi có những thay đổi lớn mà bạn cần thực hiện trong khi vẫn cần hỗ trợ phiên bản trước đó của ứng dụng.

Có 4 loại quản lý phiên bản được hỗ trợ:

<table>
  <tr>
    <td><a href='techniques/versioning#uri-versioning-type'><code>Quản lý phiên bản URI</code></a></td>
    <td>Phiên bản sẽ được truyền trong URI của yêu cầu (mặc định)</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#header-versioning-type'><code>Quản lý phiên bản Header</code></a></td>
    <td>Một header yêu cầu tùy chỉnh sẽ chỉ định phiên bản</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#media-type-versioning-type'><code>Quản lý phiên bản Media Type</code></a></td>
    <td>Header <code>Accept</code> của yêu cầu sẽ chỉ định phiên bản</td>
  </tr>
  <tr>
    <td><a href='techniques/versioning#custom-versioning-type'><code>Quản lý phiên bản Tùy chỉnh</code></a></td>
    <td>Bất kỳ khía cạnh nào của yêu cầu có thể được sử dụng để chỉ định (các) phiên bản. Một hàm tùy chỉnh được cung cấp để trích xuất (các) phiên bản đó.</td>
  </tr>
</table>

#### Loại Quản lý phiên bản URI

Quản lý phiên bản URI sử dụng phiên bản được truyền trong URI của yêu cầu, chẳng hạn như `https://example.com/v1/route` và `https://example.com/v2/route`.

> **Chú ý** Với Quản lý phiên bản URI, phiên bản sẽ tự động được thêm vào URI sau <a href="faq/global-prefix">tiền tố đường dẫn toàn cục</a> (nếu có) và trước bất kỳ đường dẫn bộ điều khiển hoặc tuyến đường nào.

Để bật Quản lý phiên bản URI cho ứng dụng của bạn, hãy thực hiện như sau:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
// hoặc "app.enableVersioning()"
app.enableVersioning({
  type: VersioningType.URI,
});
await app.listen(3000);
```

> **Chú ý** Phiên bản trong URI sẽ tự động được thêm tiền tố `v` theo mặc định, tuy nhiên giá trị tiền tố có thể được cấu hình bằng cách đặt khóa `prefix` thành tiền tố mong muốn của bạn hoặc `false` nếu bạn muốn tắt nó.

> **Gợi ý** Enum `VersioningType` có sẵn để sử dụng cho thuộc tính `type` và được nhập từ gói `@nestjs/common`.

#### Loại Quản lý phiên bản Header

Quản lý phiên bản Header sử dụng một header yêu cầu tùy chỉnh do người dùng chỉ định để chỉ định phiên bản, trong đó giá trị của header sẽ là phiên bản sử dụng cho yêu cầu.

Ví dụ về Yêu cầu HTTP cho Quản lý phiên bản Header:

Để bật **Quản lý phiên bản Header** cho ứng dụng của bạn, hãy thực hiện như sau:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'Custom-Header',
});
await app.listen(3000);
```

Thuộc tính `header` nên là tên của header sẽ chứa phiên bản của yêu cầu.

> **Gợi ý** Enum `VersioningType` có sẵn để sử dụng cho thuộc tính `type` và được nhập từ gói `@nestjs/common`.

#### Loại Quản lý phiên bản Media Type

Quản lý phiên bản Media Type sử dụng header `Accept` của yêu cầu để chỉ định phiên bản.

Trong header `Accept`, phiên bản sẽ được tách khỏi loại media bằng dấu chấm phẩy, `;`. Sau đó, nó sẽ chứa một cặp khóa-giá trị đại diện cho phiên bản sử dụng cho yêu cầu, chẳng hạn như `Accept: application/json;v=2`. Khóa được coi là tiền tố khi xác định phiên bản sẽ được cấu hình để bao gồm khóa và dấu phân cách.

Để bật **Quản lý phiên bản Media Type** cho ứng dụng của bạn, hãy thực hiện như sau:

```typescript
@@filename(main)
const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.MEDIA_TYPE,
  key: 'v=',
});
await app.listen(3000);
```

Thuộc tính `key` nên là khóa và dấu phân cách của cặp khóa-giá trị chứa phiên bản. Đối với ví dụ `Accept: application/json;v=2`, thuộc tính `key` sẽ được đặt thành `v=`.

> **Gợi ý** Enum `VersioningType` có sẵn để sử dụng cho thuộc tính `type` và được nhập từ gói `@nestjs/common`.

#### Loại Quản lý phiên bản Tùy chỉnh

Quản lý phiên bản Tùy chỉnh sử dụng bất kỳ khía cạnh nào của yêu cầu để chỉ định phiên bản (hoặc các phiên bản). Yêu cầu đến được phân tích bằng một hàm `extractor` trả về một chuỗi hoặc mảng các chuỗi.

Nếu nhiều phiên bản được cung cấp bởi người yêu cầu, hàm extractor có thể trả về một mảng các chuỗi, được sắp xếp theo thứ tự từ phiên bản lớn nhất/cao nhất đến nhỏ nhất/thấp nhất. Các phiên bản được khớp với các tuyến đường theo thứ tự từ cao đến thấp.

Nếu một chuỗi hoặc mảng rỗng được trả về từ `extractor`, không có tuyến đường nào được khớp và một lỗi 404 được trả về.

Ví dụ, nếu một yêu cầu đến chỉ định nó hỗ trợ các phiên bản `1`, `2`, và `3`, `extractor` **PHẢI** trả về `[3, 2, 1]`. Điều này đảm bảo rằng phiên bản tuyến đường cao nhất có thể được chọn trước.

Nếu các phiên bản `[3, 2, 1]` được trích xuất, nhưng các tuyến đường chỉ tồn tại cho phiên bản `2` và `1`, tuyến đường khớp với phiên bản `2` được chọn (phiên bản `3` tự động bị bỏ qua).

> **Chú ý** Việc chọn phiên bản khớp cao nhất dựa trên mảng trả về từ `extractor` > **không hoạt động đáng tin cậy** với bộ điều hợp Express do hạn chế thiết kế. Một phiên bản duy nhất (hoặc là một chuỗi hoặc mảng có 1 phần tử) hoạt động tốt trong Express. Fastify hỗ trợ chính xác cả việc chọn phiên bản khớp cao nhất và chọn phiên bản duy nhất.

Để bật **Quản lý phiên bản Tùy chỉnh** cho ứng dụng của bạn, hãy tạo một hàm `extractor` và truyền nó vào ứng dụng của bạn như sau:

```typescript
@@filename(main)
// Ví dụ extractor trích xuất danh sách các phiên bản từ một header tùy chỉnh và chuyển nó thành một mảng đã sắp xếp.
// Ví dụ này sử dụng Fastify, nhưng các yêu cầu Express có thể được xử lý tương tự.
const extractor = (request: FastifyRequest): string | string[] =>
  [request.headers['custom-versioning-field'] ?? '']
     .flatMap(v => v.split(','))
     .filter(v => !!v)
     .sort()
     .reverse()

const app = await NestFactory.create(AppModule);
app.enableVersioning({
  type: VersioningType.CUSTOM,
  extractor,
});
await app.listen(3000);
```

#### Sử dụng (Usage)

Quản lý phiên bản cho phép bạn quản lý phiên bản các bộ điều khiển, các tuyến đường riêng lẻ, và cũng cung cấp cách để một số tài nguyên nhất định có thể không tham gia vào quản lý phiên bản. Cách sử dụng quản lý phiên bản là giống nhau bất kể Loại Quản lý phiên bản mà ứng dụng của bạn sử dụng.

> **Chú ý** Nếu quản lý phiên bản được bật cho ứng dụng nhưng bộ điều khiển hoặc tuyến đường không chỉ định phiên bản, bất kỳ yêu cầu nào đến bộ điều khiển/tuyến đường đó sẽ nhận được trạng thái phản hồi `404`. Tương tự, nếu một yêu cầu được nhận chứa một phiên bản không có bộ điều khiển hoặc tuyến đường tương ứng, nó cũng sẽ nhận được trạng thái phản hồi `404`.

#### Phiên bản bộ điều khiển (Controller versions)

Một phiên bản có thể được áp dụng cho một bộ điều khiển, đặt phiên bản cho tất cả các tuyến đường trong bộ điều khiển đó.

Để thêm một phiên bản vào bộ điều khiển, hãy thực hiện như sau:

```typescript
@@filename(cats.controller)
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll(): string {
    return 'Hành động này trả về tất cả mèo cho phiên bản 1';
  }
}
@@switch
@Controller({
  version: '1',
})
export class CatsControllerV1 {
  @Get('cats')
  findAll() {
    return 'Hành động này trả về tất cả mèo cho phiên bản 1';
  }
}
```

#### Phiên bản tuyến đường (Route versions)

Một phiên bản có thể được áp dụng cho một tuyến đường riêng lẻ. Phiên bản này sẽ ghi đè bất kỳ phiên bản nào khác có thể ảnh hưởng đến tuyến đường, chẳng hạn như Phiên bản Bộ điều khiển.

Để thêm một phiên bản vào một tuyến đường riêng lẻ, hãy thực hiện như sau:

```typescript
@@filename(cats.controller)
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1(): string {
    return 'Hành động này trả về tất cả mèo cho phiên bản 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2(): string {
    return 'Hành động này trả về tất cả mèo cho phiên bản 2';
  }
}
@@switch
import { Controller, Get, Version } from '@nestjs/common';

@Controller()
export class CatsController {
  @Version('1')
  @Get('cats')
  findAllV1() {
    return 'Hành động này trả về tất cả mèo cho phiên bản 1';
  }

  @Version('2')
  @Get('cats')
  findAllV2() {
    return 'Hành động này trả về tất cả mèo cho phiên bản 2';
  }
}
```

#### Nhiều phiên bản (Multiple versions)

Nhiều phiên bản có thể được áp dụng cho một controller hoặc route. Để sử dụng nhiều phiên bản, bạn sẽ đặt phiên bản là một Mảng.

Để thêm nhiều phiên bản, hãy làm như sau:

```typescript
@@filename(cats.controller)
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'Hành động này trả về tất cả mèo cho phiên bản 1 hoặc 2';
  }
}
@@switch
@Controller({
  version: ['1', '2'],
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'Hành động này trả về tất cả mèo cho phiên bản 1 hoặc 2';
  }
}
```

#### Phiên bản "Trung lập" (Version "Neutral")

Một số controller hoặc route có thể không quan tâm đến phiên bản và sẽ có chức năng giống nhau bất kể phiên bản nào. Để phù hợp với điều này, phiên bản có thể được đặt thành biểu tượng `VERSION_NEUTRAL`.

Một yêu cầu đến sẽ được ánh xạ tới một controller hoặc route `VERSION_NEUTRAL` bất kể phiên bản được gửi trong yêu cầu, ngoài ra còn áp dụng nếu yêu cầu không chứa phiên bản nào cả.

> warning **Lưu ý** Đối với Phiên bản URI, một tài nguyên `VERSION_NEUTRAL` sẽ không có phiên bản hiện diện trong URI.

Để thêm một controller hoặc route trung lập về phiên bản, hãy làm như sau:

```typescript
@@filename(cats.controller)
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll(): string {
    return 'Hành động này trả về tất cả mèo bất kể phiên bản nào';
  }
}
@@switch
import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  version: VERSION_NEUTRAL,
})
export class CatsController {
  @Get('cats')
  findAll() {
    return 'Hành động này trả về tất cả mèo bất kể phiên bản nào';
  }
}
```

#### Phiên bản mặc định toàn cục (Global default version)

Nếu bạn không muốn cung cấp phiên bản cho mỗi controller hoặc các route riêng lẻ, hoặc nếu bạn muốn có một phiên bản cụ thể được đặt làm phiên bản mặc định cho mọi controller/route không có phiên bản được chỉ định, bạn có thể đặt `defaultVersion` như sau:

```typescript
@@filename(main)
app.enableVersioning({
  // ...
  defaultVersion: '1'
  // hoặc
  defaultVersion: ['1', '2']
  // hoặc
  defaultVersion: VERSION_NEUTRAL
});
```

#### Phiên bản middleware (Middleware versioning)

[Middlewares](https://docs.nestjs.com/middleware) cũng có thể sử dụng metadata phiên bản để cấu hình middleware cho phiên bản cụ thể của một route. Để làm điều này, hãy cung cấp số phiên bản làm một trong các tham số cho phương thức `MiddlewareConsumer.forRoutes()`:

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
      .forRoutes({ path: 'cats', method: RequestMethod.GET, version: '2' });
  }
}
```

Với đoạn mã trên, `LoggerMiddleware` sẽ chỉ được áp dụng cho phiên bản '2' của endpoint `/cats`.

> info **Lưu ý** Middlewares hoạt động với bất kỳ loại phiên bản nào được mô tả trong phần này: `URI`, `Header`, `Media Type` hoặc `Custom`.
