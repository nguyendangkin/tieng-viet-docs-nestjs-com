### Các module động (Dynamic modules)

Chương [Modules](/modules) đã đề cập đến cơ bản về các module của Nest, và bao gồm một giới thiệu ngắn gọn về [các module động](https://docs.nestjs.com/modules#dynamic-modules). Chương này sẽ mở rộng chủ đề về các module động. Sau khi hoàn thành, bạn sẽ có một hiểu biết tốt về chúng là gì và cách sử dụng chúng khi nào.

#### Giới thiệu (Introduction)

Hầu hết các ví dụ mã trong phần **Tổng quan** của tài liệu sử dụng các module thông thường, hoặc tĩnh. Các module định nghĩa các nhóm thành phần như [providers](/providers) và [controllers](/controllers) phù hợp với nhau như một phần mô-đun của một ứng dụng tổng thể. Chúng cung cấp một ngữ cảnh thực thi, hoặc phạm vi, cho các thành phần này. Ví dụ, các provider được định nghĩa trong một module có thể nhìn thấy được bởi các thành viên khác của module mà không cần phải xuất chúng. Khi một provider cần được nhìn thấy bên ngoài một module, nó được xuất từ module chủ của nó trước, và sau đó được nhập vào module tiêu thụ.

Hãy xem xét một ví dụ quen thuộc.

Đầu tiên, chúng ta sẽ định nghĩa một `UsersModule` để cung cấp và xuất một `UsersService`. `UsersModule` là module **chủ** cho `UsersService`.

```typescript
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

Tiếp theo, chúng ta sẽ định nghĩa một `AuthModule`, nó nhập `UsersModule`, làm cho các provider được xuất của `UsersModule` có sẵn bên trong `AuthModule`:

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

Những cấu trúc này cho phép chúng ta tiêm `UsersService` vào, ví dụ, `AuthService` được lưu trữ trong `AuthModule`:

```typescript
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}
  /*
    Triển khai sử dụng this.usersService
  */
}
```

Chúng ta sẽ gọi đây là ràng buộc module **tĩnh**. Tất cả thông tin mà Nest cần để kết nối các module đã được khai báo trong các module chủ và tiêu thụ. Hãy phân tích những gì đang xảy ra trong quá trình này. Nest làm cho `UsersService` có sẵn bên trong `AuthModule` bằng cách:

1. Khởi tạo `UsersModule`, bao gồm việc nhập các module khác mà `UsersModule` tiêu thụ và giải quyết bất kỳ phụ thuộc nào (xem [Custom providers](https://docs.nestjs.com/fundamentals/custom-providers)).
2. Khởi tạo `AuthModule`, và làm cho các provider được xuất của `UsersModule` có sẵn cho các thành phần trong `AuthModule` (giống như chúng đã được khai báo trong `AuthModule`).
3. Tiêm một instance của `UsersService` vào `AuthService`.

#### Trường hợp sử dụng module động (Dynamic module use case)

Với ràng buộc module tĩnh, không có cơ hội cho module tiêu thụ **ảnh hưởng** đến cách các provider từ module chủ được cấu hình. Tại sao điều này quan trọng? Hãy xem xét trường hợp chúng ta có một module đa năng cần hoạt động khác nhau trong các trường hợp sử dụng khác nhau. Điều này tương tự với khái niệm "plugin" trong nhiều hệ thống, nơi một cơ sở chung cần một số cấu hình trước khi nó có thể được sử dụng bởi người tiêu dùng.

Một ví dụ tốt với Nest là **module cấu hình**. Nhiều ứng dụng thấy hữu ích khi externalize chi tiết cấu hình bằng cách sử dụng một module cấu hình. Điều này giúp dễ dàng thay đổi động cài đặt ứng dụng trong các triển khai khác nhau: ví dụ, cơ sở dữ liệu phát triển cho các nhà phát triển, cơ sở dữ liệu dàn dựng cho môi trường dàn dựng/kiểm tra, v.v. Bằng cách ủy quyền quản lý các tham số cấu hình cho một module cấu hình, mã nguồn ứng dụng vẫn độc lập với các tham số cấu hình.

Thách thức là bản thân module cấu hình, vì nó là chung chung (tương tự như một "plugin"), cần được tùy chỉnh bởi module tiêu thụ nó. Đây là nơi _các module động_ có vai trò. Sử dụng các tính năng module động, chúng ta có thể làm cho module cấu hình của mình trở nên **động** để module tiêu thụ có thể sử dụng một API để kiểm soát cách module cấu hình được tùy chỉnh tại thời điểm nó được nhập.

Nói cách khác, các module động cung cấp một API để nhập một module vào một module khác, và tùy chỉnh các thuộc tính và hành vi của module đó khi nó được nhập, trái ngược với việc sử dụng các ràng buộc tĩnh mà chúng ta đã thấy cho đến nay.

<app-banner-devtools></app-banner-devtools>

#### Ví dụ về module cấu hình (Config module example)

Chúng ta sẽ sử dụng phiên bản cơ bản của mã ví dụ từ [chương cấu hình](https://docs.nestjs.com/techniques/configuration#service) cho phần này. Phiên bản hoàn chỉnh như cuối chương này có sẵn như một [ví dụ hoạt động tại đây](https://github.com/nestjs/nest/tree/master/sample/25-dynamic-modules).

Yêu cầu của chúng ta là làm cho `ConfigModule` chấp nhận một đối tượng `options` để tùy chỉnh nó. Đây là tính năng mà chúng ta muốn hỗ trợ. Mẫu cơ bản cứng hóa vị trí của file `.env` trong thư mục gốc của dự án. Giả sử chúng ta muốn làm cho điều đó có thể cấu hình được, để bạn có thể quản lý các file `.env` của mình trong bất kỳ thư mục nào bạn chọn. Ví dụ, hãy tưởng tượng bạn muốn lưu trữ các file `.env` khác nhau của mình trong một thư mục dưới thư mục gốc của dự án có tên là `config` (tức là, một thư mục anh em với `src`). Bạn muốn có thể chọn các thư mục khác nhau khi sử dụng `ConfigModule` trong các dự án khác nhau.

Các module động cho chúng ta khả năng truyền tham số vào module đang được nhập để chúng ta có thể thay đổi hành vi của nó. Hãy xem điều này hoạt động như thế nào. Sẽ hữu ích nếu chúng ta bắt đầu từ mục tiêu cuối cùng về cách điều này có thể trông từ góc nhìn của module tiêu thụ, và sau đó làm việc ngược lại. Đầu tiên, hãy nhanh chóng xem lại ví dụ về việc nhập _tĩnh_ `ConfigModule` (tức là, một cách tiếp cận không có khả năng ảnh hưởng đến hành vi của module được nhập). Hãy chú ý kỹ đến mảng `imports` trong decorator `@Module()`:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Hãy xem xét một import _module động_ có thể trông như thế nào, nơi chúng ta đang truyền vào một đối tượng cấu hình. So sánh sự khác biệt trong mảng `imports` giữa hai ví dụ này:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule.register({ folder: './config' })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Hãy xem điều gì đang xảy ra trong ví dụ động ở trên. Các phần chuyển động là gì?

1. `ConfigModule` là một lớp bình thường, vì vậy chúng ta có thể suy ra rằng nó phải có một **phương thức tĩnh** được gọi là `register()`. Chúng ta biết nó là tĩnh vì chúng ta đang gọi nó trên lớp `ConfigModule`, không phải trên một **instance** của lớp. Lưu ý: phương thức này, mà chúng ta sẽ tạo ra sớm, có thể có bất kỳ tên tùy ý nào, nhưng theo quy ước chúng ta nên gọi nó là `forRoot()` hoặc `register()`.
2. Phương thức `register()` được định nghĩa bởi chúng ta, vì vậy chúng ta có thể chấp nhận bất kỳ đối số đầu vào nào chúng ta muốn. Trong trường hợp này, chúng ta sẽ chấp nhận một đối tượng `options` đơn giản với các thuộc tính phù hợp, đây là trường hợp điển hình.
3. Chúng ta có thể suy ra rằng phương thức `register()` phải trả về một cái gì đó giống như một `module` vì giá trị trả về của nó xuất hiện trong danh sách `imports` quen thuộc, mà chúng ta đã thấy cho đến nay bao gồm một danh sách các module.

Trên thực tế, những gì phương thức `register()` của chúng ta sẽ trả về là một `DynamicModule`. Một module động không gì hơn là một module được tạo ra tại thời điểm chạy, với chính xác các thuộc tính giống như một module tĩnh, cộng thêm một thuộc tính bổ sung gọi là `module`. Hãy nhanh chóng xem lại một khai báo module tĩnh mẫu, chú ý kỹ đến các tùy chọn module được truyền vào decorator:

```typescript
@Module({
  imports: [DogsModule],
  controllers: [CatsController],
  providers: [CatsService],
  exports: [CatsService]
})
```

Các module động phải trả về một đối tượng với chính xác cùng giao diện, cộng thêm một thuộc tính bổ sung gọi là `module`. Thuộc tính `module` đóng vai trò là tên của module, và nên giống với tên lớp của module, như được hiển thị trong ví dụ dưới đây.

> info **Gợi ý** Đối với một module động, tất cả các thuộc tính của đối tượng tùy chọn module là tùy chọn **ngoại trừ** `module`.

Còn về phương thức tĩnh `register()`? Chúng ta có thể thấy rằng công việc của nó là trả về một đối tượng có giao diện `DynamicModule`. Khi chúng ta gọi nó, chúng ta đang hiệu quả cung cấp một module cho danh sách `imports`, tương tự như cách chúng ta sẽ làm trong trường hợp tĩnh bằng cách liệt kê tên lớp module. Nói cách khác, API module động chỉ đơn giản trả về một module, nhưng thay vì cố định các thuộc tính trong decorator `@Module`, chúng ta chỉ định chúng theo chương trình.

Vẫn còn một vài chi tiết cần đề cập để giúp làm cho bức tranh hoàn chỉnh:

1. Chúng ta có thể nói rằng thuộc tính `imports` của decorator `@Module()` có thể không chỉ lấy tên lớp module (ví dụ: `imports: [UsersModule]`), mà còn có thể lấy một hàm **trả về** một module động (ví dụ: `imports: [ConfigModule.register(...)]`).

2. Một module động có thể tự nhập các module khác. Chúng ta sẽ không làm điều đó trong ví dụ này, nhưng nếu module động phụ thuộc vào các provider từ các module khác, bạn sẽ nhập chúng bằng thuộc tính `imports` tùy chọn. Một lần nữa, điều này hoàn toàn tương tự với cách bạn khai báo metadata cho một module tĩnh bằng decorator `@Module()`.

Với hiểu biết này, chúng ta có thể xem xét khai báo `ConfigModule` động của chúng ta phải trông như thế nào. Hãy thử một lần.

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static register(): DynamicModule {
    return {
      module: ConfigModule,
      providers: [ConfigService],
      exports: [ConfigService],
    };
  }
}
```

Bây giờ nên rõ ràng cách các phần liên kết với nhau. Gọi `ConfigModule.register(...)` trả về một đối tượng `DynamicModule` với các thuộc tính về cơ bản giống với những gì mà cho đến nay chúng ta đã cung cấp dưới dạng metadata thông qua decorator `@Module()`.

> info **Gợi ý** Nhập `DynamicModule` từ `@nestjs/common`.

Tuy nhiên, module động của chúng ta chưa thực sự thú vị, vì chúng ta chưa giới thiệu bất kỳ khả năng nào để **cấu hình** nó như chúng ta đã nói muốn làm. Hãy giải quyết vấn đề đó tiếp theo.

#### Cấu hình module (Module configuration)

Giải pháp rõ ràng để tùy chỉnh hành vi của `ConfigModule` là truyền cho nó một đối tượng `options` trong phương thức tĩnh `register()`, như chúng ta đã đoán trước đó. Hãy xem lại thuộc tính `imports` của module tiêu thụ của chúng ta:

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [ConfigModule.register({ folder: './config' })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Điều đó xử lý việc truyền một đối tượng `options` cho module động của chúng ta một cách gọn gàng. Vậy làm thế nào chúng ta sử dụng đối tượng `options` đó trong `ConfigModule`? Hãy xem xét điều đó trong một phút. Chúng ta biết rằng `ConfigModule` của chúng ta về cơ bản là một host để cung cấp và xuất một dịch vụ có thể tiêm - `ConfigService` - để sử dụng bởi các provider khác. Thực tế là `ConfigService` của chúng ta cần đọc đối tượng `options` để tùy chỉnh hành vi của nó. Hãy giả định trong thời điểm này rằng chúng ta biết cách để bằng cách nào đó nhận `options` từ phương thức `register()` vào `ConfigService`. Với giả định đó, chúng ta có thể thực hiện một vài thay đổi cho dịch vụ để tùy chỉnh hành vi của nó dựa trên các thuộc tính từ đối tượng `options`. (**Lưu ý**: trong thời điểm này, vì chúng ta _chưa_ thực sự xác định cách truyền nó vào, chúng ta sẽ chỉ cứng hóa `options`. Chúng ta sẽ sửa điều này trong một phút.)

```typescript
import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { EnvConfig } from './interfaces';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor() {
    const options = { folder: './config' };

    const filePath = `${process.env.NODE_ENV || 'development'}.env`;
    const envFile = path.resolve(__dirname, '../../', options.folder, filePath);
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
```

Bây giờ `ConfigService` của chúng ta biết cách tìm file `.env` trong thư mục mà chúng ta đã chỉ định trong `options`.

Nhiệm vụ còn lại của chúng ta là bằng cách nào đó tiêm đối tượng `options` từ bước `register()` vào `ConfigService` của chúng ta. Và tất nhiên, chúng ta sẽ sử dụng _tiêm phụ thuộc_ để làm điều đó. Đây là một điểm quan trọng, vì vậy hãy đảm bảo bạn hiểu nó. `ConfigModule` của chúng ta đang cung cấp `ConfigService`. `ConfigService` lại phụ thuộc vào đối tượng `options` chỉ được cung cấp tại thời điểm chạy. Vì vậy, tại thời điểm chạy, chúng ta sẽ cần đầu tiên ràng buộc đối tượng `options` với container IoC của Nest, và sau đó có Nest tiêm nó vào `ConfigService` của chúng ta. Hãy nhớ từ chương **Custom providers** rằng các provider có thể [bao gồm bất kỳ giá trị nào](https://docs.nestjs.com/fundamentals/custom-providers#non-service-based-providers) không chỉ là các dịch vụ, vì vậy chúng ta hoàn toàn có thể sử dụng tiêm phụ thuộc để xử lý một đối tượng `options` đơn giản.

Hãy giải quyết việc ràng buộc đối tượng options với container IoC trước. Chúng ta làm điều này trong phương thức tĩnh `register()` của chúng ta. Hãy nhớ rằng chúng ta đang động tạo một module, và một trong các thuộc tính của một module là danh sách các provider của nó. Vì vậy những gì chúng ta cần làm là định nghĩa đối tượng options của chúng ta như một provider. Điều này sẽ làm cho nó có thể tiêm được vào `ConfigService`, mà chúng ta sẽ tận dụng trong bước tiếp theo. Trong mã dưới đây, hãy chú ý đến mảng `providers`:

```typescript
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

@Module({})
export class ConfigModule {
  static register(options: Record<string, any>): DynamicModule {
    return {
      module: ConfigModule,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        ConfigService,
      ],
      exports: [ConfigService],
    };
  }
}
```

Bây giờ chúng ta có thể hoàn thành quá trình bằng cách tiêm provider `'CONFIG_OPTIONS'` vào `ConfigService`. Hãy nhớ rằng khi chúng ta định nghĩa một provider sử dụng một token không phải là lớp, chúng ta cần sử dụng decorator `@Inject()` [như được mô tả ở đây](https://docs.nestjs.com/fundamentals/custom-providers#non-class-based-provider-tokens).

```typescript
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { Injectable, Inject } from '@nestjs/common';
import { EnvConfig } from './interfaces';

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(@Inject('CONFIG_OPTIONS') private options: Record<string, any>) {
    const filePath = `${process.env.NODE_ENV || 'development'}.env`;
    const envFile = path.resolve(__dirname, '../../', options.folder, filePath);
    this.envConfig = dotenv.parse(fs.readFileSync(envFile));
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}
```

Một lưu ý cuối cùng: để đơn giản hóa, chúng ta đã sử dụng một token tiêm dựa trên chuỗi (`'CONFIG_OPTIONS'`) ở trên, nhưng thực hành tốt nhất là định nghĩa nó như một hằng số (hoặc `Symbol`) trong một file riêng biệt, và nhập file đó. Ví dụ:

```typescript
export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';
```

#### Ví dụ (Example)

Một ví dụ đầy đủ của mã trong chương này có thể được tìm thấy [tại đây](https://github.com/nestjs/nest/tree/master/sample/25-dynamic-modules).

#### Hướng dẫn cộng đồng (Community guidelines)

Bạn có thể đã thấy việc sử dụng các phương thức như `forRoot`, `register`, và `forFeature` xung quanh một số gói `@nestjs/` và có thể đang tự hỏi sự khác biệt giữa tất cả các phương thức này là gì. Không có quy tắc cứng nhắc về điều này, nhưng các gói `@nestjs/` cố gắng tuân theo những hướng dẫn sau:

Khi tạo một module với:

- `register`, bạn đang mong đợi cấu hình một module động với một cấu hình cụ thể để chỉ sử dụng bởi module gọi. Ví dụ, với `@nestjs/axios` của Nest: `HttpModule.register({{ '{' }} baseUrl: 'someUrl' {{ '}' }})`. Nếu, trong một module khác bạn sử dụng `HttpModule.register({{ '{' }} baseUrl: 'somewhere else' {{ '}' }})`, nó sẽ có cấu hình khác. Bạn có thể làm điều này cho bao nhiêu module tùy ý.

- `forRoot`, bạn đang mong đợi cấu hình một module động một lần và tái sử dụng cấu hình đó ở nhiều nơi (mặc dù có thể không biết vì nó được trừu tượng hóa). Đây là lý do tại sao bạn có một `GraphQLModule.forRoot()`, một `TypeOrmModule.forRoot()`, v.v.

- `forFeature`, bạn đang mong đợi sử dụng cấu hình của `forRoot` của một module động nhưng cần sửa đổi một số cấu hình cụ thể cho nhu cầu của module gọi (ví dụ: repository nào module này nên có quyền truy cập, hoặc ngữ cảnh mà logger nên sử dụng.)

Tất cả những điều này, thường có các phiên bản `async` tương ứng của chúng, `registerAsync`, `forRootAsync`, và `forFeatureAsync`, có ý nghĩa tương tự, nhưng sử dụng Dependency Injection của Nest cho cấu hình.

#### Trình xây dựng module có thể cấu hình (Configurable module builder)

Vì việc tạo thủ công các module động có thể cấu hình cao, hiển thị các phương thức `async` (`registerAsync`, `forRootAsync`, v.v.) khá phức tạp, đặc biệt là đối với người mới bắt đầu, Nest cung cấp lớp `ConfigurableModuleBuilder` để tạo điều kiện cho quá trình này và cho phép bạn xây dựng một "bản thiết kế" module chỉ trong vài dòng mã.

Ví dụ, hãy lấy ví dụ chúng ta đã sử dụng ở trên (`ConfigModule`) và chuyển đổi nó để sử dụng `ConfigurableModuleBuilder`. Trước khi bắt đầu, hãy đảm bảo chúng ta tạo một giao diện chuyên dụng đại diện cho các tùy chọn mà `ConfigModule` của chúng ta nhận vào.

```typescript
export interface ConfigModuleOptions {
  folder: string;
}
```

Với điều này, tạo một file chuyên dụng mới (cùng với file `config.module.ts` hiện có) và đặt tên là `config.module-definition.ts`. Trong file này, hãy sử dụng `ConfigurableModuleBuilder` để xây dựng định nghĩa `ConfigModule`.

```typescript
@@filename(config.module-definition)
import { ConfigurableModuleBuilder } from '@nestjs/common';
import { ConfigModuleOptions } from './interfaces/config-module-options.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().build();
@@switch
import { ConfigurableModuleBuilder } from '@nestjs/common';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().build();
```

Bây giờ hãy mở file `config.module.ts` và sửa đổi triển khai của nó để tận dụng `ConfigurableModuleClass` được tạo tự động:

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigurableModuleClass } from './config.module-definition';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule extends ConfigurableModuleClass {}
```

Việc mở rộng `ConfigurableModuleClass` có nghĩa là `ConfigModule` bây giờ không chỉ cung cấp phương thức `register` (như trước đây với triển khai tùy chỉnh), mà còn phương thức `registerAsync` cho phép người dùng cấu hình module đó một cách bất đồng bộ, ví dụ, bằng cách cung cấp các factory bất đồng bộ:

```typescript
@Module({
  imports: [
    ConfigModule.register({ folder: './config' }),
    // hoặc thay thế:
    // ConfigModule.registerAsync({
    //   useFactory: () => {
    //     return {
    //       folder: './config',
    //     }
    //   },
    //   inject: [...bất kỳ phụ thuộc bổ sung nào...]
    // }),
  ],
})
export class AppModule {}
```

Cuối cùng, hãy cập nhật lớp `ConfigService` để tiêm provider tùy chọn module được tạo thay vì `'CONFIG_OPTIONS'` mà chúng ta đã sử dụng cho đến nay.

```typescript
@Injectable()
export class ConfigService {
  constructor(@Inject(MODULE_OPTIONS_TOKEN) private options: ConfigModuleOptions) { ... }
}
```

#### Khóa phương thức tùy chỉnh (Custom method key)

`ConfigurableModuleClass` mặc định cung cấp các phương thức `register` và phương thức `registerAsync` tương ứng. Để sử dụng tên phương thức khác, hãy sử dụng phương thức `ConfigurableModuleBuilder#setClassMethodName`, như sau:

```typescript
@@filename(config.module-definition)
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().setClassMethodName('forRoot').build();
@@switch
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().setClassMethodName('forRoot').build();
```

Cấu trúc này sẽ hướng dẫn `ConfigurableModuleBuilder` tạo ra một lớp hiển thị `forRoot` và `forRootAsync` thay vì. Ví dụ:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ folder: './config' }), // <-- chú ý việc sử dụng "forRoot" thay vì "register"
    // hoặc thay thế:
    // ConfigModule.forRootAsync({
    //   useFactory: () => {
    //     return {
    //       folder: './config',
    //     }
    //   },
    //   inject: [...bất kỳ phụ thuộc bổ sung nào...]
    // }),
  ],
})
export class AppModule {}
```

#### Lớp factory tùy chọn tùy chỉnh (Custom options factory class)

Vì phương thức `registerAsync` (hoặc `forRootAsync` hoặc bất kỳ tên nào khác, tùy thuộc vào cấu hình) cho phép người dùng truyền một định nghĩa provider giải quyết cho cấu hình module, người dùng thư viện có thể cung cấp một lớp để được sử dụng để xây dựng đối tượng cấu hình.

```typescript
@Module({
  imports: [
    ConfigModule.registerAsync({
      useClass: ConfigModuleOptionsFactory,
    }),
  ],
})
export class AppModule {}
```

Lớp này, mặc định, phải cung cấp phương thức `create()` trả về một đối tượng cấu hình module. Tuy nhiên, nếu thư viện của bạn tuân theo một quy ước đặt tên khác, bạn có thể thay đổi hành vi đó và hướng dẫn `ConfigurableModuleBuilder` mong đợi một phương thức khác, ví dụ, `createConfigOptions`, sử dụng phương thức `ConfigurableModuleBuilder#setFactoryMethodName`:

```typescript
@@filename(config.module-definition)
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<ConfigModuleOptions>().setFactoryMethodName('createConfigOptions').build();
@@switch
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder().setFactoryMethodName('createConfigOptions').build();
```

Bây giờ, lớp `ConfigModuleOptionsFactory` phải hiển thị phương thức `createConfigOptions` (thay vì `create`):

```typescript
@Module({
  imports: [
    ConfigModule.registerAsync({
      useClass: ConfigModuleOptionsFactory, // <-- lớp này phải cung cấp phương thức "createConfigOptions"
    }),
  ],
})
export class AppModule {}
```

#### Tùy chọn bổ sung (Extra options)

Có những trường hợp cạnh khi module của bạn có thể cần lấy các tùy chọn bổ sung xác định cách nó được cho là hoạt động (một ví dụ đẹp về tùy chọn như vậy là cờ `isGlobal` - hoặc chỉ `global`) mà đồng thời, không nên được bao gồm trong provider `MODULE_OPTIONS_TOKEN` (vì chúng không liên quan đến các dịch vụ/provider được đăng ký trong module đó, ví dụ, `ConfigService` không cần biết liệu module chủ của nó có được đăng ký là một module toàn cục hay không).

Trong những trường hợp như vậy, phương thức `ConfigurableModuleBuilder#setExtras` có thể được sử dụng. Xem ví dụ sau:

```typescript
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } = new ConfigurableModuleBuilder<ConfigModuleOptions>()
  .setExtras(
    {
      isGlobal: true,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }),
  )
  .build();
```

Trong ví dụ trên, đối số đầu tiên được truyền vào phương thức `setExtras` là một đối tượng chứa các giá trị mặc định cho các thuộc tính "bổ sung". Đối số thứ hai là một hàm nhận định nghĩa module được tạo tự động (với `provider`, `exports`, v.v.) và đối tượng `extras` đại diện cho các thuộc tính bổ sung (hoặc được chỉ định bởi người dùng hoặc mặc định). Giá trị trả về của hàm này là định nghĩa module đã được sửa đổi. Trong ví dụ cụ thể này, chúng ta đang lấy thuộc tính `extras.isGlobal` và gán nó cho thuộc tính `global` của định nghĩa module (điều này lại xác định liệu một module có toàn cục hay không, đọc thêm [tại đây](/modules#dynamic-modules)).

Bây giờ khi sử dụng module này, cờ `isGlobal` bổ sung có thể được truyền vào, như sau:

```typescript
@Module({
  imports: [
    ConfigModule.register({
      isGlobal: true,
      folder: './config',
    }),
  ],
})
export class AppModule {}
```

Tuy nhiên, vì `isGlobal` được khai báo là thuộc tính "bổ sung", nó sẽ không có sẵn trong provider `MODULE_OPTIONS_TOKEN`:

```typescript
@Injectable()
export class ConfigService {
  constructor(@Inject(MODULE_OPTIONS_TOKEN) private options: ConfigModuleOptions) {
    // Đối tượng "options" sẽ không có thuộc tính "isGlobal"
    // ...
  }
}
```

#### Mở rộng các phương thức được tạo tự động (Extending auto-generated methods)

Các phương thức tĩnh được tạo tự động (`register`, `registerAsync`, v.v.) có thể được mở rộng nếu cần, như sau:

```typescript
import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigurableModuleClass, ASYNC_OPTIONS_TYPE, OPTIONS_TYPE } from './config.module-definition';

@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule extends ConfigurableModuleClass {
  static register(options: typeof OPTIONS_TYPE): DynamicModule {
    return {
      // logic tùy chỉnh của bạn ở đây
      ...super.register(options),
    };
  }

  static registerAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
    return {
      // logic tùy chỉnh của bạn ở đây
      ...super.registerAsync(options),
    };
  }
}
```

Lưu ý việc sử dụng các kiểu `OPTIONS_TYPE` và `ASYNC_OPTIONS_TYPE` phải được xuất từ file định nghĩa module:

```typescript
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } = new ConfigurableModuleBuilder<ConfigModuleOptions>().build();
```
