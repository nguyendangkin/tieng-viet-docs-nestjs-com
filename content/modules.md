### Modules (Các module)

Module là một lớp được chú thích bằng decorator `@Module()`. Decorator `@Module()` cung cấp metadata mà **Nest** sử dụng để tổ chức cấu trúc ứng dụng.

<figure><img src="/assets/Modules_1.png" /></figure>

Mỗi ứng dụng có ít nhất một module, một **root module**. Root module là điểm bắt đầu Nest sử dụng để xây dựng **application graph** - cấu trúc dữ liệu nội bộ Nest sử dụng để giải quyết các mối quan hệ và phụ thuộc của module và provider. Mặc dù các ứng dụng rất nhỏ về mặt lý thuyết có thể chỉ có root module, nhưng đây không phải là trường hợp điển hình. Chúng tôi muốn nhấn mạnh rằng các module được khuyến nghị **mạnh mẽ** như một cách hiệu quả để tổ chức các thành phần của bạn. Do đó, đối với hầu hết các ứng dụng, kiến trúc kết quả sẽ sử dụng nhiều module, mỗi module đóng gói một tập hợp các **khả năng** có liên quan chặt chẽ.

Decorator `@Module()` nhận một đối tượng duy nhất có các thuộc tính mô tả module:

|               |                                                                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `providers`   | các provider sẽ được khởi tạo bởi bộ tiêm Nest và có thể được chia sẻ ít nhất trong module này                                                                                          |
| `controllers` | tập hợp các controller được định nghĩa trong module này cần được khởi tạo                                                                                                               |
| `imports`     | danh sách các module được import mà xuất các provider cần thiết trong module này                                                                                                        |
| `exports`     | tập con của `providers` được cung cấp bởi module này và nên có sẵn trong các module khác import module này. Bạn có thể sử dụng chính provider hoặc chỉ token của nó (giá trị `provide`) |

Module **đóng gói** các provider theo mặc định. Điều này có nghĩa là không thể tiêm các provider không trực tiếp là một phần của module hiện tại hoặc không được xuất từ các module đã import. Vì vậy, bạn có thể coi các provider được xuất từ một module như giao diện công khai hoặc API của module.

#### Feature modules (Các module tính năng)

`CatsController` và `CatsService` thuộc cùng một miền ứng dụng. Vì chúng có liên quan chặt chẽ, việc di chuyển chúng vào một feature module là hợp lý. Feature module đơn giản tổ chức code liên quan đến một tính năng cụ thể, giữ cho code được tổ chức và thiết lập ranh giới rõ ràng. Điều này giúp chúng ta quản lý độ phức tạp và phát triển với các nguyên tắc [SOLID](https://en.wikipedia.org/wiki/SOLID), đặc biệt khi quy mô của ứng dụng và/hoặc team tăng lên.

Để minh họa điều này, chúng ta sẽ tạo `CatsModule`.

```typescript
@@filename(cats/cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

> info **Gợi ý** Để tạo một module bằng CLI, chỉ cần thực thi lệnh `$ nest g module cats`.

Ở trên, chúng ta đã định nghĩa `CatsModule` trong file `cats.module.ts`, và di chuyển mọi thứ liên quan đến module này vào thư mục `cats`. Điều cuối cùng chúng ta cần làm là import module này vào root module (the `AppModule`, được định nghĩa trong file `app.module.ts`).

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [CatsModule],
})
export class AppModule {}
```

Đây là cách cấu trúc thư mục của chúng ta trông như sau:

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
      <div class="item">cats.module.ts</div>
      <div class="item">cats.service.ts</div>
    </div>
    <div class="item">app.module.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

#### Shared modules (Các module chia sẻ)

Trong Nest, các module là **singleton** theo mặc định, và do đó bạn có thể chia sẻ cùng một instance của bất kỳ provider nào giữa nhiều module một cách dễ dàng.

<figure><img src="/assets/Shared_Module_1.png" /></figure>

Mỗi module tự động là một **shared module**. Một khi được tạo, nó có thể được tái sử dụng bởi bất kỳ module nào. Hãy tưởng tượng rằng chúng ta muốn chia sẻ một instance của `CatsService` giữa nhiều module khác. Để làm điều đó, trước tiên chúng ta cần **xuất** provider `CatsService` bằng cách thêm nó vào mảng `exports` của module, như được hiển thị dưới đây:

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService]
})
export class CatsModule {}
```

Bây giờ bất kỳ module nào import `CatsModule` đều có quyền truy cập vào `CatsService` và sẽ chia sẻ cùng một instance với tất cả các module khác cũng import nó.

<app-banner-devtools></app-banner-devtools>

#### Module re-exporting (Tái xuất module)

Như đã thấy ở trên, các Module có thể xuất các provider nội bộ của chúng. Ngoài ra, chúng có thể tái xuất các module mà chúng import. Trong ví dụ dưới đây, `CommonModule` vừa được import vào **và** xuất từ `CoreModule`, làm cho nó có sẵn cho các module khác import module này.

```typescript
@Module({
  imports: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}
```

#### Dependency injection (Tiêm phụ thuộc)

Một lớp module cũng có thể **tiêm** các provider (ví dụ: cho mục đích cấu hình):

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {
  constructor(private catsService: CatsService) {}
}
@@switch
import { Module, Dependencies } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
@Dependencies(CatsService)
export class CatsModule {
  constructor(catsService) {
    this.catsService = catsService;
  }
}
```

Tuy nhiên, chính các lớp module không thể được tiêm như các provider do [phụ thuộc vòng tròn](/fundamentals/circular-dependency).

#### Global modules (Các module toàn cục)

Nếu bạn phải import cùng một bộ module ở mọi nơi, điều đó có thể trở nên tẻ nhạt. Không giống như trong Nest, [Angular](https://angular.dev) `providers` được đăng ký trong phạm vi toàn cục. Một khi được định nghĩa, chúng có sẵn ở mọi nơi. Tuy nhiên, Nest đóng gói các provider bên trong phạm vi module. Bạn không thể sử dụng các provider của một module ở nơi khác mà không import module đóng gói trước.

Khi bạn muốn cung cấp một bộ provider nên có sẵn ở mọi nơi ngay từ đầu (ví dụ: helpers, kết nối cơ sở dữ liệu, v.v.), hãy làm cho module **toàn cục** với decorator `@Global()`.

```typescript
import { Module, Global } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Global()
@Module({
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService],
})
export class CatsModule {}
```

Decorator `@Global()` làm cho module có phạm vi toàn cục. Các module toàn cục nên được đăng ký **chỉ một lần**, thường là bởi module gốc hoặc module cốt lõi. Trong ví dụ trên, provider `CatsService` sẽ có mặt khắp nơi, và các module muốn tiêm service sẽ không cần phải import `CatsModule` trong mảng imports của chúng.

> info **Gợi ý** Làm mọi thứ toàn cục không phải là một quyết định thiết kế tốt. Các module toàn cục có sẵn để giảm lượng boilerplate cần thiết. Mảng `imports` thường là cách ưu tiên để làm cho API của module có sẵn cho người tiêu dùng.

#### Dynamic modules (Các module động)

Hệ thống module của Nest bao gồm một tính năng mạnh mẽ gọi là **dynamic modules**. Tính năng này cho phép bạn dễ dàng tạo các module có thể tùy chỉnh có thể đăng ký và cấu hình các provider một cách động. Dynamic modules được đề cập rộng rãi [tại đây](/fundamentals/dynamic-modules). Trong chương này, chúng ta sẽ cung cấp một tổng quan ngắn gọn để hoàn tất phần giới thiệu về các module.

Sau đây là một ví dụ về định nghĩa module động cho `DatabaseModule`:

```typescript
@@filename()
import { Module, DynamicModule } from '@nestjs/common';
import { createDatabaseProviders } from './database.providers';
import { Connection } from './connection.provider';

@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options?): DynamicModule {
    const providers = createDatabaseProviders(options, entities);
    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
@@switch
import { Module } from '@nestjs/common';
import { createDatabaseProviders } from './database.providers';
import { Connection } from './connection.provider';

@Module({
  providers: [Connection],
  exports: [Connection],
})
export class DatabaseModule {
  static forRoot(entities = [], options) {
    const providers = createDatabaseProviders(options, entities);
    return {
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
```

> info **Gợi ý** Phương thức `forRoot()` có thể trả về một module động đồng bộ hoặc bất đồng bộ (tức là thông qua một `Promise`).

Module này định nghĩa provider `Connection` theo mặc định (trong metadata decorator `@Module()`), nhưng thêm vào đó - tùy thuộc vào đối tượng `entities` và `options` được truyền vào phương thức `forRoot()` - hiển thị một tập hợp các provider, ví dụ như các repository. Lưu ý rằng các thuộc tính được trả về bởi module động **mở rộng** (thay vì ghi đè) metadata module cơ sở được định nghĩa trong decorator `@Module()`. Đó là cách cả provider `Connection` được khai báo tĩnh **và** các provider repository được tạo động được xuất từ module.

Nếu bạn muốn đăng ký một module động trong phạm vi toàn cục, hãy đặt thuộc tính `global` thành `true`.

```typescript
{
  global: true,
  module: DatabaseModule,
  providers: providers,
  exports: providers,
}
```

> warning **Cảnh báo** Như đã đề cập ở trên, làm mọi thứ toàn cục **không phải là một quyết định thiết kế tốt**.

`DatabaseModule` có thể được import và cấu hình theo cách sau:

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [DatabaseModule.forRoot([User])],
})
export class AppModule {}
```

Nếu bạn muốn xuất lại một module động, bạn có thể bỏ qua việc gọi phương thức `forRoot()` trong mảng exports:

```typescript
import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [DatabaseModule.forRoot([User])],
  exports: [DatabaseModule],
})
export class AppModule {}
```

Chương [Module động](/fundamentals/dynamic-modules) đề cập đến chủ đề này chi tiết hơn và bao gồm một [ví dụ thực tế](https://github.com/nestjs/nest/tree/master/sample/25-dynamic-modules).

> info **Gợi ý** Tìm hiểu cách xây dựng các module động có khả năng tùy chỉnh cao bằng cách sử dụng `ConfigurableModuleBuilder` tại [chương này](/fundamentals/dynamic-modules#configurable-module-builder).
