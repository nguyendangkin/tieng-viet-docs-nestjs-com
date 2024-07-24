### Logger (Bộ ghi nhật ký)

Nest đi kèm với một bộ ghi nhật ký dựa trên văn bản được tích hợp sẵn, được sử dụng trong quá trình khởi động ứng dụng và một số trường hợp khác như hiển thị các ngoại lệ được bắt (tức là ghi nhật ký hệ thống). Chức năng này được cung cấp thông qua lớp `Logger` trong gói `@nestjs/common`. Bạn có thể kiểm soát hoàn toàn hành vi của hệ thống ghi nhật ký, bao gồm bất kỳ điều nào sau đây:

- vô hiệu hóa hoàn toàn việc ghi nhật ký
- chỉ định mức độ chi tiết của nhật ký (ví dụ: hiển thị lỗi, cảnh báo, thông tin gỡ lỗi, v.v.)
- ghi đè dấu thời gian trong bộ ghi nhật ký mặc định (ví dụ: sử dụng tiêu chuẩn ISO8601 làm định dạng ngày)
- ghi đè hoàn toàn bộ ghi nhật ký mặc định
- tùy chỉnh bộ ghi nhật ký mặc định bằng cách mở rộng nó
- sử dụng dependency injection để đơn giản hóa việc tạo và kiểm thử ứng dụng của bạn

Bạn cũng có thể sử dụng bộ ghi nhật ký tích hợp sẵn, hoặc tạo triển khai tùy chỉnh của riêng bạn, để ghi nhật ký các sự kiện và thông điệp ở cấp độ ứng dụng của riêng bạn.

Để có chức năng ghi nhật ký nâng cao hơn, bạn có thể sử dụng bất kỳ gói ghi nhật ký Node.js nào, chẳng hạn như [Winston](https://github.com/winstonjs/winston), để triển khai một hệ thống ghi nhật ký hoàn toàn tùy chỉnh, chất lượng sản xuất.

#### Tùy chỉnh cơ bản

Để vô hiệu hóa việc ghi nhật ký, đặt thuộc tính `logger` thành `false` trong đối tượng tùy chọn ứng dụng Nest (tùy chọn) được truyền làm đối số thứ hai cho phương thức `NestFactory.create()`.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: false,
});
await app.listen(3000);
```

Để bật các mức ghi nhật ký cụ thể, đặt thuộc tính `logger` thành một mảng các chuỗi chỉ định các mức nhật ký cần hiển thị, như sau:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn'],
});
await app.listen(3000);
```

Các giá trị trong mảng có thể là bất kỳ kết hợp nào của `'log'`, `'fatal'`, `'error'`, `'warn'`, `'debug'`, và `'verbose'`.

> info **Gợi ý** Để vô hiệu hóa màu sắc trong các thông báo của bộ ghi nhật ký mặc định, đặt biến môi trường `NO_COLOR` thành một chuỗi không rỗng.

#### Triển khai tùy chỉnh

Bạn có thể cung cấp một triển khai bộ ghi nhật ký tùy chỉnh để được Nest sử dụng cho việc ghi nhật ký hệ thống bằng cách đặt giá trị của thuộc tính `logger` thành một đối tượng thỏa mãn giao diện `LoggerService`. Ví dụ, bạn có thể yêu cầu Nest sử dụng đối tượng `console` JavaScript toàn cục tích hợp sẵn (triển khai giao diện `LoggerService`), như sau:

```typescript
const app = await NestFactory.create(AppModule, {
  logger: console,
});
await app.listen(3000);
```

Triển khai bộ ghi nhật ký tùy chỉnh của riêng bạn là đơn giản. Chỉ cần triển khai từng phương thức của giao diện `LoggerService` như được hiển thị dưới đây.

```typescript
import { LoggerService, Injectable } from '@nestjs/common';

@Injectable()
export class MyLogger implements LoggerService {
  /**
   * Ghi một nhật ký mức 'log'.
   */
  log(message: any, ...optionalParams: any[]) {}

  /**
   * Ghi một nhật ký mức 'fatal'.
   */
  fatal(message: any, ...optionalParams: any[]) {}

  /**
   * Ghi một nhật ký mức 'error'.
   */
  error(message: any, ...optionalParams: any[]) {}

  /**
   * Ghi một nhật ký mức 'warn'.
   */
  warn(message: any, ...optionalParams: any[]) {}

  /**
   * Ghi một nhật ký mức 'debug'.
   */
  debug?(message: any, ...optionalParams: any[]) {}

  /**
   * Ghi một nhật ký mức 'verbose'.
   */
  verbose?(message: any, ...optionalParams: any[]) {}
}
```

Sau đó, bạn có thể cung cấp một thể hiện của `MyLogger` thông qua thuộc tính `logger` của đối tượng tùy chọn ứng dụng Nest.

```typescript
const app = await NestFactory.create(AppModule, {
  logger: new MyLogger(),
});
await app.listen(3000);
```

Kỹ thuật này, mặc dù đơn giản, không sử dụng dependency injection cho lớp `MyLogger`. Điều này có thể gây ra một số thách thức, đặc biệt là cho việc kiểm thử, và hạn chế khả năng tái sử dụng của `MyLogger`. Để có một giải pháp tốt hơn, xem phần <a href="techniques/logger#dependency-injection">Dependency Injection</a> bên dưới.

#### Mở rộng bộ ghi nhật ký tích hợp

Thay vì viết một bộ ghi nhật ký từ đầu, bạn có thể đáp ứng nhu cầu của mình bằng cách mở rộng lớp `ConsoleLogger` tích hợp sẵn và ghi đè hành vi đã chọn của triển khai mặc định.

```typescript
import { ConsoleLogger } from '@nestjs/common';

export class MyLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    // thêm logic tùy chỉnh của bạn ở đây
    super.error(...arguments);
  }
}
```

Bạn có thể sử dụng bộ ghi nhật ký mở rộng như vậy trong các module tính năng của bạn như được mô tả trong phần <a href="techniques/logger#using-the-logger-for-application-logging">Sử dụng bộ ghi nhật ký cho việc ghi nhật ký ứng dụng</a> bên dưới.

Bạn có thể yêu cầu Nest sử dụng bộ ghi nhật ký mở rộng của bạn cho việc ghi nhật ký hệ thống bằng cách truyền một thể hiện của nó thông qua thuộc tính `logger` của đối tượng tùy chọn ứng dụng (như được hiển thị trong phần <a href="techniques/logger#custom-logger-implementation">Triển khai tùy chỉnh</a> ở trên), hoặc bằng cách sử dụng kỹ thuật được hiển thị trong phần <a href="techniques/logger#dependency-injection">Dependency Injection</a> bên dưới. Nếu bạn làm như vậy, bạn nên cẩn thận gọi `super`, như được hiển thị trong mã mẫu ở trên, để ủy quyền lệnh gọi phương thức ghi nhật ký cụ thể cho lớp cha (tích hợp sẵn) để Nest có thể dựa vào các tính năng tích hợp sẵn mà nó mong đợi.

<app-banner-courses></app-banner-courses>

#### Tiêm phụ thuộc (Dependency injection)

Để có chức năng ghi nhật ký nâng cao hơn, bạn sẽ muốn tận dụng lợi thế của tiêm phụ thuộc. Ví dụ, bạn có thể muốn tiêm một `ConfigService` vào logger của mình để tùy chỉnh nó, và ngược lại tiêm logger tùy chỉnh của bạn vào các bộ điều khiển và/hoặc nhà cung cấp khác. Để kích hoạt tiêm phụ thuộc cho logger tùy chỉnh của bạn, hãy tạo một lớp triển khai `LoggerService` và đăng ký lớp đó như một nhà cung cấp trong một module nào đó. Ví dụ, bạn có thể

1. Định nghĩa một lớp `MyLogger` mở rộng `ConsoleLogger` tích hợp sẵn hoặc ghi đè hoàn toàn nó, như đã hiển thị trong các phần trước. Hãy chắc chắn triển khai giao diện `LoggerService`.
2. Tạo một `LoggerModule` như hiển thị bên dưới, và cung cấp `MyLogger` từ module đó.

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

Với cấu trúc này, bây giờ bạn đang cung cấp logger tùy chỉnh của mình để sử dụng bởi bất kỳ module nào khác. Bởi vì lớp `MyLogger` của bạn là một phần của một module, nó có thể sử dụng tiêm phụ thuộc (ví dụ, để tiêm một `ConfigService`). Có một kỹ thuật nữa cần thiết để cung cấp logger tùy chỉnh này để Nest sử dụng cho ghi nhật ký hệ thống (ví dụ: cho khởi động và xử lý lỗi).

Bởi vì khởi tạo ứng dụng (`NestFactory.create()`) xảy ra bên ngoài ngữ cảnh của bất kỳ module nào, nó không tham gia vào giai đoạn Tiêm Phụ thuộc bình thường của quá trình khởi tạo. Vì vậy chúng ta phải đảm bảo rằng ít nhất một module ứng dụng nhập `LoggerModule` để kích hoạt Nest tạo ra một thể hiện singleton của lớp `MyLogger` của chúng ta.

Sau đó chúng ta có thể hướng dẫn Nest sử dụng cùng một thể hiện singleton của `MyLogger` với cấu trúc sau:

```typescript
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(app.get(MyLogger));
await app.listen(3000);
```

> info **Lưu ý** Trong ví dụ trên, chúng ta đặt `bufferLogs` thành `true` để đảm bảo tất cả các bản ghi sẽ được đệm cho đến khi một logger tùy chỉnh được gắn kết (`MyLogger` trong trường hợp này) và quá trình khởi tạo ứng dụng hoàn thành hoặc thất bại. Nếu quá trình khởi tạo thất bại, Nest sẽ quay lại `ConsoleLogger` gốc để in ra bất kỳ thông báo lỗi nào được báo cáo. Ngoài ra, bạn có thể đặt `autoFlushLogs` thành `false` (mặc định là `true`) để tự xả bản ghi theo cách thủ công (sử dụng phương thức `Logger#flush()`).

Ở đây chúng ta sử dụng phương thức `get()` trên thể hiện `NestApplication` để truy xuất thể hiện singleton của đối tượng `MyLogger`. Kỹ thuật này về cơ bản là một cách để "tiêm" một thể hiện của logger để Nest sử dụng. Lệnh gọi `app.get()` truy xuất thể hiện singleton của `MyLogger`, và phụ thuộc vào thể hiện đó được tiêm trước tiên trong một module khác, như đã mô tả ở trên.

Bạn cũng có thể tiêm nhà cung cấp `MyLogger` này vào các lớp tính năng của bạn, do đó đảm bảo hành vi ghi nhật ký nhất quán trên cả ghi nhật ký hệ thống Nest và ghi nhật ký ứng dụng. Xem <a href="techniques/logger#using-the-logger-for-application-logging">Sử dụng logger cho ghi nhật ký ứng dụng</a> và <a href="techniques/logger#injecting-a-custom-logger">Tiêm một logger tùy chỉnh</a> bên dưới để biết thêm thông tin.

#### Sử dụng logger cho ghi nhật ký ứng dụng (Using the logger for application logging)

Chúng ta có thể kết hợp một số kỹ thuật trên để cung cấp hành vi và định dạng nhất quán trên cả ghi nhật ký hệ thống Nest và ghi nhật ký sự kiện/thông báo ứng dụng của chúng ta.

Một thực hành tốt là khởi tạo lớp `Logger` từ `@nestjs/common` trong mỗi dịch vụ của chúng ta. Chúng ta có thể cung cấp tên dịch vụ của chúng ta làm đối số `context` trong hàm tạo `Logger`, như sau:

```typescript
import { Logger, Injectable } from '@nestjs/common';

@Injectable()
class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Đang làm gì đó...');
  }
}
```

Trong triển khai logger mặc định, `context` được in trong dấu ngoặc vuông, như `NestFactory` trong ví dụ dưới đây:

```bash
[Nest] 19096   - 12/08/2019, 7:12:59 AM   [NestFactory] Bắt đầu ứng dụng Nest...
```

Nếu chúng ta cung cấp một logger tùy chỉnh thông qua `app.useLogger()`, nó sẽ thực sự được Nest sử dụng nội bộ. Điều đó có nghĩa là mã của chúng ta vẫn không phụ thuộc vào triển khai, trong khi chúng ta có thể dễ dàng thay thế logger mặc định bằng logger tùy chỉnh của chúng ta bằng cách gọi `app.useLogger()`.

Bằng cách đó nếu chúng ta tuân theo các bước từ phần trước và gọi `app.useLogger(app.get(MyLogger))`, các lệnh gọi tiếp theo đến `this.logger.log()` từ `MyService` sẽ dẫn đến các lệnh gọi đến phương thức `log` từ thể hiện `MyLogger`.

Điều này nên phù hợp cho hầu hết các trường hợp. Nhưng nếu bạn cần tùy chỉnh nhiều hơn (như thêm và gọi các phương thức tùy chỉnh), hãy chuyển sang phần tiếp theo.

#### Tiêm một logger tùy chỉnh (Injecting a custom logger)

Để bắt đầu, mở rộng logger tích hợp sẵn với mã như sau. Chúng ta cung cấp tùy chọn `scope` như metadata cấu hình cho lớp `ConsoleLogger`, xác định một phạm vi [tạm thời](/fundamentals/injection-scopes), để đảm bảo rằng chúng ta sẽ có một thể hiện duy nhất của `MyLogger` trong mỗi module tính năng. Trong ví dụ này, chúng ta không mở rộng các phương thức `ConsoleLogger` riêng lẻ (như `log()`, `warn()`, v.v.), mặc dù bạn có thể chọn làm như vậy.

```typescript
import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends ConsoleLogger {
  customLog() {
    this.log('Hãy cho mèo ăn!');
  }
}
```

Tiếp theo, tạo một `LoggerModule` với cấu trúc như thế này:

```typescript
import { Module } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Module({
  providers: [MyLogger],
  exports: [MyLogger],
})
export class LoggerModule {}
```

Tiếp theo, nhập `LoggerModule` vào module tính năng của bạn. Vì chúng ta đã mở rộng `Logger` mặc định nên chúng ta có sự tiện lợi của việc sử dụng phương thức `setContext`. Vì vậy chúng ta có thể bắt đầu sử dụng logger tùy chỉnh nhận biết ngữ cảnh, như thế này:

```typescript
import { Injectable } from '@nestjs/common';
import { MyLogger } from './my-logger.service';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  constructor(private myLogger: MyLogger) {
    // Do phạm vi tạm thời, CatsService có thể hiện MyLogger duy nhất của riêng nó,
    // vì vậy việc đặt ngữ cảnh ở đây sẽ không ảnh hưởng đến các thể hiện khác trong các dịch vụ khác
    this.myLogger.setContext('CatsService');
  }

  findAll(): Cat[] {
    // Bạn có thể gọi tất cả các phương thức mặc định
    this.myLogger.warn('Sắp trả về mèo!');
    // Và các phương thức tùy chỉnh của bạn
    this.myLogger.customLog();
    return this.cats;
  }
}
```

Cuối cùng, hướng dẫn Nest sử dụng một thể hiện của logger tùy chỉnh trong tệp `main.ts` của bạn như hiển thị bên dưới. Tất nhiên trong ví dụ này, chúng ta thực sự chưa tùy chỉnh hành vi logger (bằng cách mở rộng các phương thức `Logger` như `log()`, `warn()`, v.v.), vì vậy bước này thực sự không cần thiết. Nhưng nó **sẽ** cần thiết nếu bạn thêm logic tùy chỉnh vào các phương thức đó và muốn Nest sử dụng cùng một triển khai.

```typescript
const app = await NestFactory.create(AppModule, {
  bufferLogs: true,
});
app.useLogger(new MyLogger());
await app.listen(3000);
```

> info **Gợi ý** Ngoài ra, thay vì đặt `bufferLogs` thành `true`, bạn có thể tạm thời vô hiệu hóa logger với hướng dẫn `logger: false`. Hãy lưu ý rằng nếu bạn cung cấp `logger: false` cho `NestFactory.create`, sẽ không có gì được ghi nhật ký cho đến khi bạn gọi `useLogger`, vì vậy bạn có thể bỏ lỡ một số lỗi khởi tạo quan trọng. Nếu bạn không quan tâm rằng một số thông báo ban đầu của bạn sẽ được ghi nhật ký với logger mặc định, bạn có thể chỉ cần bỏ qua tùy chọn `logger: false`.

#### Sử dụng logger bên ngoài (Use external logger)

Các ứng dụng sản xuất thường có yêu cầu ghi nhật ký cụ thể, bao gồm lọc nâng cao, định dạng và ghi nhật ký tập trung. Logger tích hợp của Nest được sử dụng để theo dõi hành vi hệ thống Nest, và cũng có thể hữu ích cho ghi nhật ký văn bản được định dạng cơ bản trong các module tính năng của bạn trong quá trình phát triển, nhưng các ứng dụng sản xuất thường tận dụng các module ghi nhật ký chuyên dụng như [Winston](https://github.com/winstonjs/winston). Như với bất kỳ ứng dụng Node.js tiêu chuẩn nào, bạn có thể tận dụng đầy đủ các module như vậy trong Nest.
