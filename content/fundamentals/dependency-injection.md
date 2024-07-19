### Nhà cung cấp tùy chỉnh (Custom providers)

Trong các chương trước, chúng ta đã đề cập đến nhiều khía cạnh khác nhau của **Tiêm phụ thuộc (Dependency Injection - DI)** và cách nó được sử dụng trong Nest. Một ví dụ về điều này là [tiêm phụ thuộc dựa trên constructor](https://docs.nestjs.com/providers#dependency-injection) được sử dụng để tiêm các thể hiện (thường là các nhà cung cấp dịch vụ) vào các lớp. Bạn sẽ không ngạc nhiên khi biết rằng Tiêm phụ thuộc được tích hợp vào cốt lõi của Nest một cách cơ bản. Cho đến nay, chúng ta mới chỉ khám phá một mẫu chính. Khi ứng dụng của bạn trở nên phức tạp hơn, bạn có thể cần tận dụng đầy đủ các tính năng của hệ thống DI, vì vậy hãy cùng khám phá chúng chi tiết hơn.

#### Cơ bản về DI (DI fundamentals)

Tiêm phụ thuộc là một kỹ thuật [đảo ngược điều khiển (inversion of control - IoC)](https://en.wikipedia.org/wiki/Inversion_of_control) trong đó bạn ủy quyền việc khởi tạo các phụ thuộc cho container IoC (trong trường hợp của chúng ta là hệ thống runtime NestJS), thay vì tự thực hiện trong mã của bạn một cách mệnh lệnh. Hãy xem xét những gì đang xảy ra trong ví dụ này từ [chương Nhà cung cấp](https://docs.nestjs.com/providers).

Đầu tiên, chúng ta định nghĩa một nhà cung cấp. Decorator `@Injectable()` đánh dấu lớp `CatsService` là một nhà cung cấp.

```typescript
@@filename(cats.service)
import { Injectable } from '@nestjs/common';
import { Cat } from './interfaces/cat.interface';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

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

  findAll() {
    return this.cats;
  }
}
```

Sau đó, chúng ta yêu cầu Nest tiêm nhà cung cấp vào lớp controller của chúng ta:

```typescript
@@filename(cats.controller)
import { Controller, Get } from '@nestjs/common';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Get()
  async findAll(): Promise<Cat[]> {
    return this.catsService.findAll();
  }
}
@@switch
import { Controller, Get, Bind, Dependencies } from '@nestjs/common';
import { CatsService } from './cats.service';

@Controller('cats')
@Dependencies(CatsService)
export class CatsController {
  constructor(catsService) {
    this.catsService = catsService;
  }

  @Get()
  async findAll() {
    return this.catsService.findAll();
  }
}
```

Cuối cùng, chúng ta đăng ký nhà cung cấp với container IoC của Nest:

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

Chính xác thì điều gì đang xảy ra bên dưới để làm cho điều này hoạt động? Có ba bước quan trọng trong quá trình:

1. Trong `cats.service.ts`, decorator `@Injectable()` khai báo lớp `CatsService` là một lớp có thể được quản lý bởi container IoC của Nest.
2. Trong `cats.controller.ts`, `CatsController` khai báo một phụ thuộc vào token `CatsService` bằng cách tiêm constructor:

```typescript
  constructor(private catsService: CatsService)
```

3. Trong `app.module.ts`, chúng ta liên kết token `CatsService` với lớp `CatsService` từ file `cats.service.ts`. Chúng ta sẽ <a href="/fundamentals/custom-providers#standard-providers">thấy bên dưới</a> chính xác cách liên kết này (còn được gọi là _đăng ký_) diễn ra.

Khi container IoC của Nest khởi tạo một `CatsController`, nó trước tiên tìm kiếm bất kỳ phụ thuộc nào\*. Khi nó tìm thấy phụ thuộc `CatsService`, nó thực hiện tra cứu trên token `CatsService`, trả về lớp `CatsService`, theo bước đăng ký (#3 ở trên). Giả sử phạm vi `SINGLETON` (hành vi mặc định), Nest sẽ tạo một thể hiện của `CatsService`, lưu vào bộ nhớ cache và trả về nó, hoặc nếu đã có một thể hiện được lưu trong bộ nhớ cache, trả về thể hiện hiện có.

\*Giải thích này hơi đơn giản hóa để minh họa vấn đề. Một lĩnh vực quan trọng mà chúng ta đã bỏ qua là quá trình phân tích mã để tìm các phụ thuộc rất phức tạp và xảy ra trong quá trình khởi động ứng dụng. Một tính năng quan trọng là việc phân tích phụ thuộc (hoặc "tạo đồ thị phụ thuộc") là **bắc cầu**. Trong ví dụ trên, nếu bản thân `CatsService` có các phụ thuộc, những phụ thuộc đó cũng sẽ được giải quyết. Đồ thị phụ thuộc đảm bảo rằng các phụ thuộc được giải quyết theo đúng thứ tự - về cơ bản là "từ dưới lên". Cơ chế này giúp nhà phát triển không phải quản lý các đồ thị phụ thuộc phức tạp như vậy.

<app-banner-courses></app-banner-courses>

#### Nhà cung cấp tiêu chuẩn (Standard providers)

Hãy xem xét kỹ hơn về decorator `@Module()`. Trong `app.module`, chúng ta khai báo:

```typescript
@Module({
  controllers: [CatsController],
  providers: [CatsService],
})
```

Thuộc tính `providers` nhận một mảng các `providers`. Cho đến nay, chúng ta đã cung cấp các nhà cung cấp đó thông qua một danh sách tên lớp. Trên thực tế, cú pháp `providers: [CatsService]` là cách viết tắt cho cú pháp đầy đủ hơn:

```typescript
providers: [
  {
    provide: CatsService,
    useClass: CatsService,
  },
];
```

Bây giờ chúng ta thấy cấu trúc rõ ràng này, chúng ta có thể hiểu quá trình đăng ký. Ở đây, chúng ta đang liên kết rõ ràng token `CatsService` với lớp `CatsService`. Cách viết tắt chỉ đơn giản là một tiện ích để đơn giản hóa trường hợp sử dụng phổ biến nhất, trong đó token được sử dụng để yêu cầu một thể hiện của một lớp có cùng tên.

#### Nhà cung cấp tùy chỉnh (Custom providers)

Điều gì xảy ra khi yêu cầu của bạn vượt quá những gì được cung cấp bởi _Nhà cung cấp tiêu chuẩn_? Dưới đây là một vài ví dụ:

- Bạn muốn tạo một thể hiện tùy chỉnh thay vì để Nest khởi tạo (hoặc trả về một thể hiện đã được lưu trong bộ nhớ cache của) một lớp
- Bạn muốn tái sử dụng một lớp hiện có trong một phụ thuộc thứ hai
- Bạn muốn ghi đè một lớp bằng một phiên bản giả lập cho mục đích kiểm thử

Nest cho phép bạn định nghĩa Nhà cung cấp tùy chỉnh để xử lý các trường hợp này. Nó cung cấp một số cách để định nghĩa nhà cung cấp tùy chỉnh. Hãy cùng xem xét chúng.

> info **Gợi ý** Nếu bạn gặp vấn đề với việc giải quyết phụ thuộc, bạn có thể đặt biến môi trường `NEST_DEBUG` và nhận được các bản ghi giải quyết phụ thuộc bổ sung trong quá trình khởi động.

#### Nhà cung cấp giá trị: `useValue` (Value providers: `useValue`)

Cú pháp `useValue` rất hữu ích để tiêm một giá trị không đổi, đưa một thư viện bên ngoài vào container Nest, hoặc thay thế một triển khai thực tế bằng một đối tượng giả lập. Giả sử bạn muốn buộc Nest sử dụng một `CatsService` giả lập cho mục đích kiểm thử.

```typescript
import { CatsService } from './cats.service';

const mockCatsService = {
  /* triển khai giả lập
  ...
  */
};

@Module({
  imports: [CatsModule],
  providers: [
    {
      provide: CatsService,
      useValue: mockCatsService,
    },
  ],
})
export class AppModule {}
```

Trong ví dụ này, token `CatsService` sẽ được giải quyết thành đối tượng giả lập `mockCatsService`. `useValue` yêu cầu một giá trị - trong trường hợp này là một đối tượng literal có cùng giao diện với lớp `CatsService` mà nó đang thay thế. Do [kiểu cấu trúc](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) của TypeScript, bạn có thể sử dụng bất kỳ đối tượng nào có giao diện tương thích, bao gồm cả đối tượng literal hoặc thể hiện lớp được khởi tạo bằng `new`.

#### Token nhà cung cấp không dựa trên lớp (Non-class-based provider tokens)

Cho đến nay, chúng ta đã sử dụng tên lớp làm token nhà cung cấp (giá trị của thuộc tính `provide` trong một nhà cung cấp được liệt kê trong mảng `providers`). Điều này phù hợp với mẫu tiêu chuẩn được sử dụng với [tiêm dựa trên constructor](https://docs.nestjs.com/providers#dependency-injection), trong đó token cũng là tên lớp. (Hãy xem lại <a href="/fundamentals/custom-providers#di-fundamentals">Cơ bản về DI</a> để ôn lại về token nếu khái niệm này chưa hoàn toàn rõ ràng). Đôi khi, chúng ta có thể muốn có sự linh hoạt để sử dụng chuỗi hoặc ký hiệu làm token DI. Ví dụ:

```typescript
import { connection } from './connection';

@Module({
  providers: [
    {
      provide: 'CONNECTION',
      useValue: connection,
    },
  ],
})
export class AppModule {}
```

Trong ví dụ này, chúng ta đang liên kết một token có giá trị chuỗi (`'CONNECTION'`) với một đối tượng `connection` đã tồn tại mà chúng ta đã nhập từ một file bên ngoài.

> warning **Lưu ý** Ngoài việc sử dụng chuỗi làm giá trị token, bạn cũng có thể sử dụng [ký hiệu](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) JavaScript hoặc [enum](https://www.typescriptlang.org/docs/handbook/enums.html) TypeScript.

Trước đây chúng ta đã thấy cách tiêm một nhà cung cấp bằng cách sử dụng mẫu [tiêm dựa trên constructor](https://docs.nestjs.com/providers#dependency-injection) tiêu chuẩn. Mẫu này **yêu cầu** phụ thuộc phải được khai báo với tên lớp. Nhà cung cấp tùy chỉnh `'CONNECTION'` sử dụng một token có giá trị chuỗi. Hãy xem cách tiêm một nhà cung cấp như vậy. Để làm điều đó, chúng ta sử dụng decorator `@Inject()`. Decorator này nhận một đối số duy nhất - token.

```typescript
@@filename()
@Injectable()
export class CatsRepository {
  constructor(@Inject('CONNECTION') connection: Connection) {}
}
@@switch
@Injectable()
@Dependencies('CONNECTION')
export class CatsRepository {
  constructor(connection) {}
}
```

> info **Gợi ý** Decorator `@Inject()` được import từ gói `@nestjs/common`.

Mặc dù chúng ta trực tiếp sử dụng chuỗi `'CONNECTION'` trong các ví dụ trên để minh họa, nhưng để tổ chức mã sạch sẽ, thực hành tốt nhất là định nghĩa các token trong một file riêng biệt, chẳng hạn như `constants.ts`. Hãy coi chúng giống như các ký hiệu hoặc enum được định nghĩa trong file riêng của chúng và được import khi cần thiết.

#### Nhà cung cấp lớp: `useClass` (Class providers: `useClass`)

Cú pháp `useClass` cho phép bạn xác định động một lớp mà một token nên giải quyết. Ví dụ, giả sử chúng ta có một lớp `ConfigService` trừu tượng (hoặc mặc định). Tùy thuộc vào môi trường hiện tại, chúng ta muốn Nest cung cấp một triển khai khác của dịch vụ cấu hình. Đoạn mã sau triển khai chiến lược như vậy.

```typescript
const configServiceProvider = {
  provide: ConfigService,
  useClass: process.env.NODE_ENV === 'development' ? DevelopmentConfigService : ProductionConfigService,
};

@Module({
  providers: [configServiceProvider],
})
export class AppModule {}
```

Hãy xem xét một vài chi tiết trong mẫu mã này. Bạn sẽ nhận thấy rằng chúng ta định nghĩa `configServiceProvider` với một đối tượng literal trước, sau đó truyền nó vào thuộc tính `providers` của decorator module. Đây chỉ là một chút tổ chức mã, nhưng về mặt chức năng tương đương với các ví dụ chúng ta đã sử dụng cho đến nay trong chương này.

Ngoài ra, chúng ta đã sử dụng tên lớp `ConfigService` làm token của chúng ta. Đối với bất kỳ lớp nào phụ thuộc vào `ConfigService`, Nest sẽ tiêm một thể hiện của lớp đã cung cấp (`DevelopmentConfigService` hoặc `ProductionConfigService`) ghi đè bất kỳ triển khai mặc định nào có thể đã được khai báo ở nơi khác (ví dụ: một `ConfigService` được khai báo với decorator `@Injectable()`).

#### Nhà cung cấp factory: `useFactory` (Factory providers: `useFactory`)

Cú pháp `useFactory` cho phép tạo nhà cung cấp **động**. Nhà cung cấp thực tế sẽ được cung cấp bởi giá trị trả về từ một hàm factory. Hàm factory có thể đơn giản hoặc phức tạp tùy theo nhu cầu. Một factory đơn giản có thể không phụ thuộc vào bất kỳ nhà cung cấp nào khác. Một factory phức tạp hơn có thể tự tiêm các nhà cung cấp khác mà nó cần để tính toán kết quả. Đối với trường hợp sau, cú pháp nhà cung cấp factory có một cặp cơ chế liên quan:

1. Hàm factory có thể chấp nhận các đối số (tùy chọn).
2. Thuộc tính `inject` (tùy chọn) chấp nhận một mảng các nhà cung cấp mà Nest sẽ giải quyết và truyền làm đối số cho hàm factory trong quá trình khởi tạo. Ngoài ra, các nhà cung cấp này có thể được đánh dấu là tùy chọn. Hai danh sách này nên có mối tương quan: Nest sẽ truyền các thể hiện từ danh sách `inject` làm đối số cho hàm factory theo cùng thứ tự. Ví dụ dưới đây minh họa điều này.

```typescript
@@filename()
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider, optionalProvider?: string) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \_____________/            \__________________/
  //        Nhà cung cấp này           Nhà cung cấp với token này
  //        là bắt buộc.               có thể giải quyết thành `undefined`.
};

@Module({
  providers: [
    connectionProvider,
    OptionsProvider,
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
@@switch
const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider, optionalProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider, { token: 'SomeOptionalProvider', optional: true }],
  //       \_____________/            \__________________/
  //        Nhà cung cấp này           Nhà cung cấp với token này
  //        là bắt buộc.               có thể giải quyết thành `undefined`.
};

@Module({
  providers: [
    connectionProvider,
    OptionsProvider,
    // { provide: 'SomeOptionalProvider', useValue: 'anything' },
  ],
})
export class AppModule {}
```

#### Nhà cung cấp bí danh: `useExisting` (Alias providers: `useExisting`)

Cú pháp `useExisting` cho phép bạn tạo bí danh cho các nhà cung cấp hiện có. Điều này tạo ra hai cách để truy cập cùng một nhà cung cấp. Trong ví dụ dưới đây, token (dựa trên chuỗi) `'AliasedLoggerService'` là một bí danh cho token (dựa trên lớp) `LoggerService`. Giả sử chúng ta có hai phụ thuộc khác nhau, một cho `'AliasedLoggerService'` và một cho `LoggerService`. Nếu cả hai phụ thuộc đều được chỉ định với phạm vi `SINGLETON`, chúng sẽ giải quyết thành cùng một thể hiện.

```typescript
@Injectable()
class LoggerService {
  /* chi tiết triển khai */
}

const loggerAliasProvider = {
  provide: 'AliasedLoggerService',
  useExisting: LoggerService,
};

@Module({
  providers: [LoggerService, loggerAliasProvider],
})
export class AppModule {}
```

#### Nhà cung cấp không dựa trên dịch vụ (Non-service based providers)

Mặc dù các nhà cung cấp thường cung cấp dịch vụ, nhưng chúng không giới hạn ở việc sử dụng đó. Một nhà cung cấp có thể cung cấp **bất kỳ** giá trị nào. Ví dụ, một nhà cung cấp có thể cung cấp một mảng các đối tượng cấu hình dựa trên môi trường hiện tại, như được hiển thị dưới đây:

```typescript
const configFactory = {
  provide: 'CONFIG',
  useFactory: () => {
    return process.env.NODE_ENV === 'development' ? devConfig : prodConfig;
  },
};

@Module({
  providers: [configFactory],
})
export class AppModule {}
```

#### Xuất nhà cung cấp tùy chỉnh (Export custom provider)

Giống như bất kỳ nhà cung cấp nào, một nhà cung cấp tùy chỉnh được giới hạn trong module khai báo nó. Để làm cho nó có thể nhìn thấy đối với các module khác, nó phải được xuất. Để xuất một nhà cung cấp tùy chỉnh, chúng ta có thể sử dụng token của nó hoặc đối tượng nhà cung cấp đầy đủ.

Ví dụ sau đây hiển thị việc xuất bằng cách sử dụng token:

```typescript
@@filename()
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
@@switch
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class AppModule {}
```

Hoặc, xuất với đối tượng nhà cung cấp đầy đủ:

```typescript
@@filename()
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider: OptionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
@@switch
const connectionFactory = {
  provide: 'CONNECTION',
  useFactory: (optionsProvider) => {
    const options = optionsProvider.get();
    return new DatabaseConnection(options);
  },
  inject: [OptionsProvider],
};

@Module({
  providers: [connectionFactory],
  exports: [connectionFactory],
})
export class AppModule {}
```
