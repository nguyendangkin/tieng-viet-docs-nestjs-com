### Providers (Nhà cung cấp)

Providers là một khái niệm cơ bản trong Nest. Nhiều lớp cơ bản của Nest có thể được coi là một provider – services, repositories, factories, helpers, và nhiều thứ khác. Ý tưởng chính của một provider là nó có thể được **tiêm** như một phụ thuộc; điều này có nghĩa là các đối tượng có thể tạo ra các mối quan hệ khác nhau với nhau, và chức năng "kết nối" các đối tượng này có thể phần lớn được giao cho hệ thống runtime của Nest.

<figure><img src="/assets/Components_1.png" /></figure>

Trong chương trước, chúng ta đã xây dựng một `CatsController` đơn giản. Controllers nên xử lý các yêu cầu HTTP và ủy thác các tác vụ phức tạp hơn cho **providers**. Providers là các lớp JavaScript thuần túy được khai báo là `providers` trong một [module](/modules).

> info **Gợi ý** Vì Nest cho phép thiết kế và tổ chức các phụ thuộc theo cách hướng đối tượng hơn, chúng tôi khuyên bạn nên tuân theo các nguyên tắc [SOLID](https://en.wikipedia.org/wiki/SOLID).

#### Services (Dịch vụ)

Hãy bắt đầu bằng cách tạo một `CatsService` đơn giản. Dịch vụ này sẽ chịu trách nhiệm lưu trữ và truy xuất dữ liệu, và được thiết kế để sử dụng bởi `CatsController`, vì vậy nó là một ứng viên tốt để được định nghĩa như một provider.

```typescript
@@filename(cats.service)
import { Injectable } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: Cat) {
    this.cats.push(cat);
  }

  findAll(): Cat[] {
    return this.cats;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatsService {
  constructor() {
    this.cats = [];
  }

  create(cat) {
    this.cats.push(cat);
  }

  findAll() {
    return this.cats;
  }
}
```

> info **Gợi ý** Để tạo một service bằng CLI, chỉ cần thực thi lệnh `$ nest g service cats`.

`CatsService` của chúng ta là một lớp cơ bản với một thuộc tính và hai phương thức. Tính năng mới duy nhất là nó sử dụng decorator `@Injectable()`. Decorator `@Injectable()` gắn metadata, khai báo rằng `CatsService` là một lớp có thể được quản lý bởi container [IoC](https://en.wikipedia.org/wiki/Inversion_of_control) của Nest. Nhân tiện, ví dụ này cũng sử dụng interface `Cat`, có thể trông như thế này:

```typescript
@@filename(interfaces/cat.interface)
export interface Cat {
  name: string;
  age: number;
  breed: string;
}
```

Bây giờ chúng ta đã có một lớp service để truy xuất mèo, hãy sử dụng nó trong `CatsController`:

```typescript
@@filename(cats.controller)
import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateCatDto } from './dto/create-cat.dto';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  async create(@Body() createCatDto: CreateCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
@@switch
import { Controller, Get, Post, Body, Bind, Dependencies } from '@nestjs/common';
import { CatsService } from './cats.service';

@Controller('cats')
@Dependencies(CatsService)
export class CatsController {
  constructor(catsService) {
    this.catsService = catsService;
  }

  @Post()
  @Bind(Body())
  async create(createCatDto) {
    this.catsService.create(createCatDto);
  }

  @Get()
  async findAll() {
    return this.catsService.findAll();
  }
}
```

`CatsService` được **tiêm** thông qua constructor của lớp. Chú ý việc sử dụng cú pháp `private`. Cách viết tắt này cho phép chúng ta vừa khai báo vừa khởi tạo thành viên `catsService` ngay tại cùng một vị trí.

#### Dependency injection (Tiêm phụ thuộc)

Nest được xây dựng dựa trên mẫu thiết kế mạnh mẽ thường được gọi là **Dependency injection**. Chúng tôi khuyên bạn nên đọc một bài viết tuyệt vời về khái niệm này trong tài liệu chính thức của [Angular](https://angular.dev/guide/di).

Trong Nest, nhờ vào khả năng của TypeScript, việc quản lý các phụ thuộc cực kỳ dễ dàng vì chúng được giải quyết chỉ bằng kiểu. Trong ví dụ dưới đây, Nest sẽ giải quyết `catsService` bằng cách tạo và trả về một instance của `CatsService` (hoặc, trong trường hợp thông thường của singleton, trả về instance hiện có nếu nó đã được yêu cầu ở nơi khác). Phụ thuộc này được giải quyết và truyền vào constructor của controller của bạn (hoặc gán cho thuộc tính được chỉ định):

```typescript
constructor(private catsService: CatsService) {}
```

#### Scopes (Phạm vi)

Providers thường có một vòng đời ("scope") đồng bộ hóa với vòng đời của ứng dụng. Khi ứng dụng được khởi động, mọi phụ thuộc phải được giải quyết, và do đó mọi provider phải được khởi tạo. Tương tự, khi ứng dụng tắt, mỗi provider sẽ bị hủy. Tuy nhiên, có những cách để làm cho vòng đời của provider của bạn **request-scoped** (phạm vi yêu cầu). Bạn có thể đọc thêm về các kỹ thuật này [tại đây](/fundamentals/injection-scopes).

<app-banner-courses></app-banner-courses>

#### Custom providers (Nhà cung cấp tùy chỉnh)

Nest có một container đảo ngược điều khiển ("IoC") tích hợp giải quyết mối quan hệ giữa các providers. Tính năng này là nền tảng cho tính năng tiêm phụ thuộc được mô tả ở trên, nhưng thực tế nó mạnh mẽ hơn nhiều so với những gì chúng ta đã mô tả cho đến nay. Có nhiều cách để định nghĩa một provider: bạn có thể sử dụng các giá trị đơn giản, lớp, và các factories đồng bộ hoặc bất đồng bộ. Nhiều ví dụ hơn được cung cấp [tại đây](/fundamentals/dependency-injection).

#### Optional providers (Nhà cung cấp tùy chọn)

Đôi khi, bạn có thể có các phụ thuộc không nhất thiết phải được giải quyết. Ví dụ, lớp của bạn có thể phụ thuộc vào một **đối tượng cấu hình**, nhưng nếu không có đối tượng nào được truyền vào, các giá trị mặc định nên được sử dụng. Trong trường hợp như vậy, phụ thuộc trở thành tùy chọn, vì việc thiếu provider cấu hình sẽ không dẫn đến lỗi.

Để chỉ ra rằng một provider là tùy chọn, sử dụng decorator `@Optional()` trong chữ ký của constructor.

```typescript
import { Injectable, Optional, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  constructor(@Optional() @Inject('HTTP_OPTIONS') private httpClient: T) {}
}
```

Lưu ý rằng trong ví dụ trên chúng ta đang sử dụng một provider tùy chỉnh, đó là lý do tại sao chúng ta bao gồm **token** tùy chỉnh `HTTP_OPTIONS`. Các ví dụ trước đã cho thấy việc tiêm dựa trên constructor chỉ ra một phụ thuộc thông qua một lớp trong constructor. Đọc thêm về các providers tùy chỉnh và các token liên quan của chúng [tại đây](/fundamentals/custom-providers).

#### Property-based injection (Tiêm dựa trên thuộc tính)

Kỹ thuật chúng ta đã sử dụng cho đến nay được gọi là tiêm dựa trên constructor, vì các providers được tiêm thông qua phương thức constructor. Trong một số trường hợp rất cụ thể, **tiêm dựa trên thuộc tính** có thể hữu ích. Ví dụ, nếu lớp cấp cao nhất của bạn phụ thuộc vào một hoặc nhiều providers, việc truyền tất cả chúng lên bằng cách gọi `super()` trong các lớp con từ constructor có thể rất tẻ nhạt. Để tránh điều này, bạn có thể sử dụng decorator `@Inject()` ở cấp độ thuộc tính.

```typescript
import { Injectable, Inject } from '@nestjs/common';

@Injectable()
export class HttpService<T> {
  @Inject('HTTP_OPTIONS')
  private readonly httpClient: T;
}
```

> warning **Cảnh báo** Nếu lớp của bạn không kế thừa từ lớp khác, bạn nên luôn ưu tiên sử dụng **tiêm dựa trên constructor**. Constructor mô tả rõ ràng những phụ thuộc nào là cần thiết và cung cấp khả năng hiển thị tốt hơn so với các thuộc tính lớp được chú thích bằng `@Inject`.

#### Provider registration (Đăng ký nhà cung cấp)

Bây giờ chúng ta đã định nghĩa một provider (`CatsService`), và chúng ta có một người tiêu dùng của dịch vụ đó (`CatsController`), chúng ta cần đăng ký dịch vụ với Nest để nó có thể thực hiện việc tiêm. Chúng ta làm điều này bằng cách chỉnh sửa file module của chúng ta (`app.module.ts`) và thêm dịch vụ vào mảng `providers` của decorator `@Module()`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';
import { CatsService } from './cats/cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class AppModule {}
```

Nest bây giờ sẽ có thể giải quyết các phụ thuộc của lớp `CatsController`.

Đây là cách cấu trúc thư mục của chúng ta nên trông như sau:

<div class="file-tree">
<div class="item">src</div>
<div class="children">
<div class="item">cats</div>
<div class="children">
<div class="item">dto</div>
<div class="children">
<div class="item">create-cat.dto.ts</div>
</div>
<div class="item">interfaces</div>
<div class="children">
<div class="item">cat.interface.ts</div>
</div>
<div class="item">cats.controller.ts</div>
<div class="item">cats.service.ts</div>
</div>
<div class="item">app.module.ts</div>
<div class="item">main.ts</div>
</div>
</div>

#### Manual instantiation (Khởi tạo thủ công)

Cho đến nay, chúng ta đã thảo luận về cách Nest tự động xử lý hầu hết các chi tiết của việc giải quyết các phụ thuộc. Trong một số trường hợp nhất định, bạn có thể cần phải bước ra ngoài hệ thống Dependency Injection tích hợp và truy xuất hoặc khởi tạo providers một cách thủ công. Chúng tôi sẽ thảo luận ngắn gọn về hai chủ đề như vậy dưới đây.

Để lấy các instances hiện có, hoặc khởi tạo providers động, bạn có thể sử dụng [Tham chiếu Module](/fundamentals/module-ref).

Để lấy providers trong hàm `bootstrap()` (ví dụ cho các ứng dụng độc lập không có controllers, hoặc để sử dụng dịch vụ cấu hình trong quá trình khởi động) xem [Ứng dụng độc lập](/standalone-applications).
