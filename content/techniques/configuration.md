### Cấu hình (Configuration)

Các ứng dụng thường chạy trong các **môi trường** khác nhau. Tùy thuộc vào môi trường, các cài đặt cấu hình khác nhau nên được sử dụng. Ví dụ, thông thường môi trường local dựa vào thông tin xác thực cơ sở dữ liệu cụ thể, chỉ hợp lệ cho phiên bản DB cục bộ. Môi trường sản xuất sẽ sử dụng một bộ thông tin xác thực DB riêng biệt. Vì các biến cấu hình thay đổi, thực hành tốt nhất là [lưu trữ các biến cấu hình](https://12factor.net/config) trong môi trường.

Các biến môi trường được định nghĩa bên ngoài có thể nhìn thấy trong Node.js thông qua biến toàn cục `process.env`. Chúng ta có thể thử giải quyết vấn đề của nhiều môi trường bằng cách đặt các biến môi trường riêng biệt trong từng môi trường. Điều này có thể nhanh chóng trở nên khó quản lý, đặc biệt là trong môi trường phát triển và kiểm thử, nơi các giá trị này cần được giả lập và/hoặc thay đổi dễ dàng.

Trong các ứng dụng Node.js, thông thường sử dụng các tệp `.env`, chứa các cặp key-value trong đó mỗi key đại diện cho một giá trị cụ thể, để đại diện cho mỗi môi trường. Việc chạy một ứng dụng trong các môi trường khác nhau sau đó chỉ là vấn đề thay thế tệp `.env` phù hợp.

Một cách tiếp cận tốt để sử dụng kỹ thuật này trong Nest là tạo một `ConfigModule` để hiển thị một `ConfigService` để tải tệp `.env` thích hợp. Mặc dù bạn có thể chọn viết một module như vậy cho riêng mình, để thuận tiện, Nest cung cấp gói `@nestjs/config` sẵn có. Chúng ta sẽ đề cập đến gói này trong chương hiện tại.

#### Cài đặt (Installation)

Để bắt đầu sử dụng nó, trước tiên chúng ta cài đặt dependency cần thiết.

```bash
$ npm i --save @nestjs/config
```

> info **Gợi ý (Hint)** Gói `@nestjs/config` sử dụng [dotenv](https://github.com/motdotla/dotenv) nội bộ.

> warning **Lưu ý (Note)** `@nestjs/config` yêu cầu TypeScript 4.1 trở lên.

#### Bắt đầu (Getting started)

Sau khi quá trình cài đặt hoàn tất, chúng ta có thể import `ConfigModule`. Thông thường, chúng ta sẽ import nó vào `AppModule` gốc và điều khiển hành vi của nó bằng cách sử dụng phương thức tĩnh `.forRoot()`. Trong bước này, các cặp key/value của biến môi trường được phân tích cú pháp và giải quyết. Sau đó, chúng ta sẽ thấy một số tùy chọn để truy cập lớp `ConfigService` của `ConfigModule` trong các module tính năng khác của chúng ta.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

Mã trên sẽ tải và phân tích cú pháp một tệp `.env` từ vị trí mặc định (thư mục gốc của dự án), hợp nhất các cặp key/value từ tệp `.env` với các biến môi trường được gán cho `process.env`, và lưu trữ kết quả trong một cấu trúc riêng mà bạn có thể truy cập thông qua `ConfigService`. Phương thức `forRoot()` đăng ký provider `ConfigService`, cung cấp phương thức `get()` để đọc các biến cấu hình đã được phân tích/hợp nhất này. Vì `@nestjs/config` dựa vào [dotenv](https://github.com/motdotla/dotenv), nó sử dụng quy tắc của gói đó để giải quyết xung đột trong tên biến môi trường. Khi một key tồn tại cả trong môi trường thời gian chạy dưới dạng biến môi trường (ví dụ: thông qua xuất OS shell như `export DATABASE_USER=test`) và trong tệp `.env`, biến môi trường thời gian chạy sẽ được ưu tiên.

Một tệp `.env` mẫu trông giống như sau:

```json
DATABASE_USER=test
DATABASE_PASSWORD=test
```

#### Đường dẫn tệp env tùy chỉnh (Custom env file path)

Mặc định, gói này tìm kiếm một tệp `.env` trong thư mục gốc của ứng dụng. Để chỉ định một đường dẫn khác cho tệp `.env`, hãy đặt thuộc tính `envFilePath` của một đối tượng tùy chọn (tùy chọn) mà bạn truyền vào `forRoot()`, như sau:

```typescript
ConfigModule.forRoot({
  envFilePath: '.development.env',
});
```

Bạn cũng có thể chỉ định nhiều đường dẫn cho các tệp `.env` như thế này:

```typescript
ConfigModule.forRoot({
  envFilePath: ['.env.development.local', '.env.development'],
});
```

Nếu một biến được tìm thấy trong nhiều tệp, tệp đầu tiên sẽ được ưu tiên.

#### Tắt tải biến môi trường (Disable env variables loading)

Nếu bạn không muốn tải tệp `.env`, mà thay vào đó muốn đơn giản truy cập các biến môi trường từ môi trường thời gian chạy (như với xuất OS shell như `export DATABASE_USER=test`), hãy đặt thuộc tính `ignoreEnvFile` của đối tượng tùy chọn thành `true`, như sau:

```typescript
ConfigModule.forRoot({
  ignoreEnvFile: true,
});
```

#### Sử dụng module toàn cục (Use module globally)

Khi bạn muốn sử dụng `ConfigModule` trong các module khác, bạn sẽ cần phải import nó (như thông thường với bất kỳ module Nest nào). Hoặc, khai báo nó là một [module toàn cục](https://docs.nestjs.com/modules#global-modules) bằng cách đặt thuộc tính `isGlobal` của đối tượng tùy chọn thành `true`, như được hiển thị bên dưới. Trong trường hợp đó, bạn sẽ không cần phải import `ConfigModule` trong các module khác sau khi nó đã được tải trong module gốc (ví dụ: `AppModule`).

```typescript
ConfigModule.forRoot({
  isGlobal: true,
});
```

#### Tệp cấu hình tùy chỉnh (Custom configuration files)

Đối với các dự án phức tạp hơn, bạn có thể sử dụng các tệp cấu hình tùy chỉnh để trả về các đối tượng cấu hình lồng nhau. Điều này cho phép bạn nhóm các cài đặt cấu hình liên quan theo chức năng (ví dụ: các cài đặt liên quan đến cơ sở dữ liệu) và lưu trữ các cài đặt liên quan trong các tệp riêng biệt để giúp quản lý chúng độc lập.

Một tệp cấu hình tùy chỉnh xuất một hàm factory trả về một đối tượng cấu hình. Đối tượng cấu hình có thể là bất kỳ đối tượng JavaScript thuần túy lồng nhau tùy ý. Đối tượng `process.env` sẽ chứa các cặp key/value biến môi trường đã được giải quyết hoàn toàn (với tệp `.env` và các biến được định nghĩa bên ngoài được giải quyết và hợp nhất như đã mô tả <a href="techniques/configuration#getting-started">ở trên</a>). Vì bạn kiểm soát đối tượng cấu hình được trả về, bạn có thể thêm bất kỳ logic cần thiết nào để chuyển đổi giá trị sang một kiểu thích hợp, đặt giá trị mặc định, v.v. Ví dụ:

```typescript
@@filename(config/configuration)
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432
  }
});
```

Chúng ta tải tệp này bằng cách sử dụng thuộc tính `load` của đối tượng tùy chọn mà chúng ta truyền vào phương thức `ConfigModule.forRoot()`:

```typescript
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
  ],
})
export class AppModule {}
```

> info **Lưu ý (Notice)** Giá trị được gán cho thuộc tính `load` là một mảng, cho phép bạn tải nhiều tệp cấu hình (ví dụ: `load: [databaseConfig, authConfig]`)

Với các tệp cấu hình tùy chỉnh, chúng ta cũng có thể quản lý các tệp tùy chỉnh như các tệp YAML. Dưới đây là một ví dụ về cấu hình sử dụng định dạng YAML:

```yaml
http:
  host: 'localhost'
  port: 8080

db:
  postgres:
    url: 'localhost'
    port: 5432
    database: 'yaml-db'

  sqlite:
    database: 'sqlite.db'
```

Để đọc và phân tích cú pháp các tệp YAML, chúng ta có thể sử dụng gói `js-yaml`.

```bash
$ npm i js-yaml
$ npm i -D @types/js-yaml
```

Sau khi gói được cài đặt, chúng ta sử dụng hàm `yaml#load` để tải tệp YAML mà chúng ta vừa tạo ở trên.

```typescript
@@filename(config/configuration)
import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const YAML_CONFIG_FILENAME = 'config.yaml';

export default () => {
  return yaml.load(
    readFileSync(join(__dirname, YAML_CONFIG_FILENAME), 'utf8'),
  ) as Record<string, any>;
};
```

> warning **Lưu ý (Note)** Nest CLI không tự động di chuyển "tài sản" của bạn (các tệp không phải TS) vào thư mục `dist` trong quá trình build. Để đảm bảo rằng các tệp YAML của bạn được sao chép, bạn phải chỉ định điều này trong đối tượng `compilerOptions#assets` trong tệp `nest-cli.json`. Ví dụ, nếu thư mục `config` ở cùng cấp với thư mục `src`, hãy thêm `compilerOptions#assets` với giá trị `"assets": [{{ '{' }}"include": "../config/*.yaml", "outDir": "./dist/config"{{ '}' }}]`. Đọc thêm [tại đây](/cli/monorepo#assets).

<app-banner-devtools></app-banner-devtools>

#### Sử dụng `ConfigService` (Using the `ConfigService`)

Để truy cập các giá trị cấu hình từ `ConfigService` của chúng ta, trước tiên chúng ta cần inject `ConfigService`. Như với bất kỳ provider nào, chúng ta cần import module chứa nó - `ConfigModule` - vào module sẽ sử dụng nó (trừ khi bạn đặt thuộc tính `isGlobal` trong đối tượng tùy chọn được truyền vào phương thức `ConfigModule.forRoot()` thành `true`). Import nó vào một module tính năng như được hiển thị bên dưới.

```typescript
@@filename(feature.module)
@Module({
  imports: [ConfigModule],
  // ...
})
```

Sau đó, chúng ta có thể inject nó bằng cách sử dụng injection constructor tiêu chuẩn:

```typescript
constructor(private configService: ConfigService) {}
```

> info **Gợi ý (Hint)** `ConfigService` được import từ gói `@nestjs/config`.

Và sử dụng nó trong lớp của chúng ta:

```typescript
// lấy một biến môi trường
const dbUser = this.configService.get<string>('DATABASE_USER');

// lấy một giá trị cấu hình tùy chỉnh
const dbHost = this.configService.get<string>('database.host');
```

Như được hiển thị ở trên, sử dụng phương thức `configService.get()` để lấy một biến môi trường đơn giản bằng cách truyền tên biến. Bạn có thể thực hiện gợ ý kiểu TypeScript bằng cách truyền kiểu, như được hiển thị ở trên (ví dụ: `get<string>(...)`). Phương thức `get()` cũng có thể duyệt qua một đối tượng cấu hình tùy chỉnh lồng nhau (được tạo thông qua <a href="techniques/configuration#custom-configuration-files">Tệp cấu hình tùy chỉnh</a>), như được hiển thị trong ví dụ thứ hai ở trên.

Bạn cũng có thể lấy toàn bộ đối tượng cấu hình tùy chỉnh lồng nhau bằng cách sử dụng một interface làm gợi ý kiểu:

```typescript
interface DatabaseConfig {
  host: string;
  port: number;
}

const dbConfig = this.configService.get<DatabaseConfig>('database');

// bây giờ bạn có thể sử dụng `dbConfig.port` và `dbConfig.host`
const port = dbConfig.port;
```

Phương thức `get()` cũng nhận một đối số thứ hai tùy chọn xác định giá trị mặc định, sẽ được trả về khi khóa không tồn tại, như được hiển thị bên dưới:

```typescript
// sử dụng "localhost" khi "database.host" không được định nghĩa
const dbHost = this.configService.get<string>('database.host', 'localhost');
```

`ConfigService` có hai generic tùy chọn (đối số kiểu). Generic đầu tiên giúp ngăn chặn việc truy cập một thuộc tính cấu hình không tồn tại. Sử dụng nó như được hiển thị bên dưới:

```typescript
interface EnvironmentVariables {
  PORT: number;
  TIMEOUT: string;
}

// ở đâu đó trong mã
constructor(private configService: ConfigService<EnvironmentVariables>) {
  const port = this.configService.get('PORT', { infer: true });

  // Lỗi TypeScript: điều này không hợp lệ vì thuộc tính URL không được định nghĩa trong EnvironmentVariables
  const url = this.configService.get('URL', { infer: true });
}
```

Với thuộc tính `infer` được đặt thành `true`, phương thức `ConfigService#get` sẽ tự động suy ra kiểu thuộc tính dựa trên interface, vì vậy ví dụ, `typeof port === "number"` (nếu bạn không sử dụng cờ `strictNullChecks` từ TypeScript) vì `PORT` có kiểu `number` trong interface `EnvironmentVariables`.

Ngoài ra, với tính năng `infer`, bạn có thể suy ra kiểu của thuộc tính đối tượng cấu hình tùy chỉnh lồng nhau, ngay cả khi sử dụng ký hiệu dấu chấm, như sau:

```typescript
constructor(private configService: ConfigService<{ database: { host: string } }>) {
  const dbHost = this.configService.get('database.host', { infer: true })!;
  // typeof dbHost === "string"                                          |
  //                                                                     +--> toán tử khẳng định không null
}
```

Generic thứ hai phụ thuộc vào generic đầu tiên, hoạt động như một khẳng định kiểu để loại bỏ tất cả các kiểu `undefined` mà các phương thức của `ConfigService` có thể trả về khi `strictNullChecks` được bật. Ví dụ:

```typescript
// ...
constructor(private configService: ConfigService<{ PORT: number }, true>) {
  //                                                               ^^^^
  const port = this.configService.get('PORT', { infer: true });
  //    ^^^ Kiểu của port sẽ là 'number' do đó bạn không cần khẳng định kiểu TS nữa
}
```

#### Không gian tên cấu hình (Configuration namespaces)

`ConfigModule` cho phép bạn định nghĩa và tải nhiều tệp cấu hình tùy chỉnh, như được hiển thị trong <a href="techniques/configuration#custom-configuration-files">Tệp cấu hình tùy chỉnh</a> ở trên. Bạn có thể quản lý các hệ thống phân cấp đối tượng cấu hình phức tạp với các đối tượng cấu hình lồng nhau như được hiển thị trong phần đó. Hoặc, bạn có thể trả về một đối tượng cấu hình "không gian tên" với hàm `registerAs()` như sau:

```typescript
@@filename(config/database.config)
export default registerAs('database', () => ({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT || 5432
}));
```

Cũng như với các tệp cấu hình tùy chỉnh, bên trong hàm factory `registerAs()` của bạn, đối tượng `process.env` sẽ chứa các cặp key/value biến môi trường đã được giải quyết hoàn toàn (với tệp `.env` và các biến được định nghĩa bên ngoài được giải quyết và hợp nhất như đã mô tả <a href="techniques/configuration#getting-started">ở trên</a>).

> info **Gợi ý (Hint)** Hàm `registerAs` được xuất từ gói `@nestjs/config`.

Tải một cấu hình không gian tên với thuộc tính `load` của đối tượng tùy chọn của phương thức `forRoot()`, giống như cách bạn tải một tệp cấu hình tùy chỉnh:

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
    }),
  ],
})
export class AppModule {}
```

Bây giờ, để lấy giá trị `host` từ không gian tên `database`, sử dụng ký hiệu dấu chấm. Sử dụng `'database'` làm tiền tố cho tên thuộc tính, tương ứng với tên của không gian tên (được truyền làm đối số đầu tiên cho hàm `registerAs()`):

```typescript
const dbHost = this.configService.get<string>('database.host');
```

Một giải pháp thay thế hợp lý là inject trực tiếp không gian tên `database`. Điều này cho phép chúng ta hưởng lợi từ kiểu dữ liệu mạnh:

```typescript
constructor(
  @Inject(databaseConfig.KEY)
  private dbConfig: ConfigType<typeof databaseConfig>,
) {}
```

> info **Gợi ý (Hint)** `ConfigType` được xuất từ gói `@nestjs/config`.

#### Lưu trữ biến môi trường (Cache environment variables)

Vì việc truy cập `process.env` có thể chậm, bạn có thể đặt thuộc tính `cache` của đối tượng tùy chọn được truyền vào `ConfigModule.forRoot()` để tăng hiệu suất của phương thức `ConfigService#get` khi nó liên quan đến các biến được lưu trữ trong `process.env`.

```typescript
ConfigModule.forRoot({
  cache: true,
});
```

#### Đăng ký từng phần (Partial registration)

Cho đến nay, chúng ta đã xử lý các tệp cấu hình trong module gốc của chúng ta (ví dụ: `AppModule`), với phương thức `forRoot()`. Có lẽ bạn có một cấu trúc dự án phức tạp hơn, với các tệp cấu hình đặc thù cho tính năng nằm ở nhiều thư mục khác nhau. Thay vì tải tất cả các tệp này trong module gốc, gói `@nestjs/config` cung cấp một tính năng gọi là **đăng ký từng phần**, chỉ tham chiếu đến các tệp cấu hình liên quan đến mỗi module tính năng. Sử dụng phương thức tĩnh `forFeature()` trong một module tính năng để thực hiện đăng ký từng phần này, như sau:

```typescript
import databaseConfig from './config/database.config';

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
})
export class DatabaseModule {}
```

> info **Cảnh báo (Warning)** Trong một số trường hợp, bạn có thể cần truy cập các thuộc tính được tải thông qua đăng ký từng phần bằng cách sử dụng hook `onModuleInit()`, thay vì trong một constructor. Điều này là do phương thức `forFeature()` được chạy trong quá trình khởi tạo module, và thứ tự khởi tạo module là không xác định. Nếu bạn truy cập các giá trị được tải theo cách này bởi một module khác, trong một constructor, module mà cấu hình phụ thuộc vào có thể chưa được khởi tạo. Phương thức `onModuleInit()` chỉ chạy sau khi tất cả các module mà nó phụ thuộc vào đã được khởi tạo, do đó kỹ thuật này là an toàn.

#### Xác thực lược đồ (Schema validation)

Đây là thực hành tiêu chuẩn để ném một ngoại lệ trong quá trình khởi động ứng dụng nếu các biến môi trường bắt buộc chưa được cung cấp hoặc nếu chúng không đáp ứng các quy tắc xác thực nhất định. Gói `@nestjs/config` cho phép hai cách khác nhau để làm điều này:

- [Joi](https://github.com/sideway/joi) trình xác thực tích hợp. Với Joi, bạn định nghĩa một lược đồ đối tượng và xác thực các đối tượng JavaScript đối với nó.
- Một hàm `validate()` tùy chỉnh nhận các biến môi trường làm đầu vào.

Để sử dụng Joi, chúng ta phải cài đặt gói Joi:

```bash
$ npm install --save joi
```

Bây giờ chúng ta có thể định nghĩa một lược đồ xác thực Joi và truyền nó qua thuộc tính `validationSchema` của đối tượng tùy chọn của phương thức `forRoot()`, như được hiển thị bên dưới:

```typescript
@@filename(app.module)
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().port().default(3000),
      }),
    }),
  ],
})
export class AppModule {}
```

Mặc định, tất cả các khóa lược đồ được coi là tùy chọn. Ở đây, chúng ta đặt giá trị mặc định cho `NODE_ENV` và `PORT` sẽ được sử dụng nếu chúng ta không cung cấp các biến này trong môi trường (tệp `.env` hoặc môi trường quy trình). Ngoài ra, chúng ta có thể sử dụng phương thức xác thực `required()` để yêu cầu rằng một giá trị phải được định nghĩa trong môi trường (tệp `.env` hoặc môi trường quy trình). Trong trường hợp này, bước xác thực sẽ ném một ngoại lệ nếu chúng ta không cung cấp biến trong môi trường. Xem [Phương thức xác thực Joi](https://joi.dev/api/?v=17.3.0#example) để biết thêm về cách xây dựng các lược đồ xác thực.

Mặc định, các biến môi trường không xác định (các biến môi trường có khóa không có trong lược đồ) được cho phép và không gây ra ngoại lệ xác thực. Mặc định, tất cả các lỗi xác thực đều được báo cáo. Bạn có thể thay đổi các hành vi này bằng cách truyền một đối tượng tùy chọn thông qua khóa `validationOptions` của đối tượng tùy chọn `forRoot()`. Đối tượng tùy chọn này có thể chứa bất kỳ thuộc tính tùy chọn xác thực tiêu chuẩn nào được cung cấp bởi [Tùy chọn xác thực Joi](https://joi.dev/api/?v=17.3.0#anyvalidatevalue-options). Ví dụ, để đảo ngược hai cài đặt trên, truyền tùy chọn như sau:

```typescript
@@filename(app.module)
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'provision')
          .default('development'),
        PORT: Joi.number().port().default(3000),
      }),
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),
  ],
})
export class AppModule {}
```

Gói `@nestjs/config` sử dụng các cài đặt mặc định sau:

- `allowUnknown`: kiểm soát việc cho phép các khóa không xác định trong biến môi trường hay không. Mặc định là `true`
- `abortEarly`: nếu true, dừng xác thực ngay khi gặp lỗi đầu tiên; nếu false, trả về tất cả các lỗi. Mặc định là `false`.

Lưu ý rằng khi bạn quyết định truyền một đối tượng `validationOptions`, bất kỳ cài đặt nào bạn không chỉ định rõ ràng sẽ sử dụng giá trị mặc định tiêu chuẩn của `Joi` (không phải mặc định của `@nestjs/config`). Ví dụ, nếu bạn không chỉ định `allowUnknowns` trong đối tượng `validationOptions` tùy chỉnh của mình, nó sẽ có giá trị mặc định của `Joi` là `false`. Do đó, có lẽ an toàn nhất là chỉ định **cả hai** cài đặt này trong đối tượng tùy chỉnh của bạn.

#### Hàm xác thực tùy chỉnh (Custom validate function)

Ngoài ra, bạn có thể chỉ định một hàm `validate` **đồng bộ** nhận một đối tượng chứa các biến môi trường (từ tệp env và process) và trả về một đối tượng chứa các biến môi trường đã được xác thực để bạn có thể chuyển đổi/thay đổi chúng nếu cần. Nếu hàm này ném ra lỗi, nó sẽ ngăn ứng dụng khởi động.

Trong ví dụ này, chúng ta sẽ tiếp tục với các gói `class-transformer` và `class-validator`. Đầu tiên, chúng ta phải định nghĩa:

- một lớp với các ràng buộc xác thực,
- một hàm xác thực sử dụng các hàm `plainToInstance` và `validateSync`.

```typescript
@@filename(env.validation)
import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, Max, Min, validateSync } from 'class-validator';

enum Environment {
  Development = "development",
  Production = "production",
  Test = "test",
  Provision = "provision",
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(0)
  @Max(65535)
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(
    EnvironmentVariables,
    config,
    { enableImplicitConversion: true },
  );
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
```

Với cấu hình này, sử dụng hàm `validate` như một tùy chọn cấu hình của `ConfigModule`, như sau:

```typescript
@@filename(app.module)
import { validate } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
    }),
  ],
})
export class AppModule {}
```

#### Hàm getter tùy chỉnh (Custom getter functions)

`ConfigService` định nghĩa một phương thức `get()` chung để truy xuất giá trị cấu hình theo khóa. Chúng ta cũng có thể thêm các hàm `getter` để cho phép một phong cách lập trình tự nhiên hơn:

```typescript
@@filename()
@Injectable()
export class ApiConfigService {
  constructor(private configService: ConfigService) {}

  get isAuthEnabled(): boolean {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
@@switch
@Dependencies(ConfigService)
@Injectable()
export class ApiConfigService {
  constructor(configService) {
    this.configService = configService;
  }

  get isAuthEnabled() {
    return this.configService.get('AUTH_ENABLED') === 'true';
  }
}
```

Bây giờ chúng ta có thể sử dụng hàm getter như sau:

```typescript
@@filename(app.service)
@Injectable()
export class AppService {
  constructor(apiConfigService: ApiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Xác thực được bật
    }
  }
}
@@switch
@Dependencies(ApiConfigService)
@Injectable()
export class AppService {
  constructor(apiConfigService) {
    if (apiConfigService.isAuthEnabled) {
      // Xác thực được bật
    }
  }
}
```

#### Hook tải biến môi trường (Environment variables loaded hook)

Nếu cấu hình của một module phụ thuộc vào các biến môi trường, và các biến này được tải từ tệp `.env`, bạn có thể sử dụng hook `ConfigModule.envVariablesLoaded` để đảm bảo rằng tệp đã được tải trước khi tương tác với đối tượng `process.env`, xem ví dụ sau:

```typescript
export async function getStorageModule() {
  await ConfigModule.envVariablesLoaded;
  return process.env.STORAGE === 'S3' ? S3StorageModule : DefaultStorageModule;
}
```

Cấu trúc này đảm bảo rằng sau khi Promise `ConfigModule.envVariablesLoaded` được giải quyết, tất cả các biến cấu hình đều được tải lên.

#### Cấu hình module có điều kiện (Conditional module configuration)

Có thể có những lúc bạn muốn tải một module có điều kiện và chỉ định điều kiện trong một biến môi trường. May mắn thay, `@nestjs/config` cung cấp một `ConditionalModule` cho phép bạn làm điều đó.

```typescript
@Module({
  imports: [ConfigModule.forRoot(), ConditionalModule.registerWhen(FooModule, 'USE_FOO')],
})
export class AppModule {}
```

Module trên chỉ tải `FooModule` nếu trong tệp `.env` không có giá trị `false` cho biến môi trường `USE_FOO`. Bạn cũng có thể truyền một điều kiện tùy chỉnh, một hàm nhận tham chiếu `process.env` và nên trả về một giá trị boolean để `ConditionalModule` xử lý:

```typescript
@Module({
  imports: [ConfigModule.forRoot(), ConditionalModule.registerWhen(FooBarModule, (env: NodeJS.ProcessEnv) => !!env['foo'] && !!env['bar'])],
})
export class AppModule {}
```

Điều quan trọng là phải đảm bảo rằng khi sử dụng `ConditionalModule`, bạn cũng đã tải `ConfigModule` vào ứng dụng, để hook `ConfigModule.envVariablesLoaded` có thể được tham chiếu và sử dụng đúng cách. Nếu hook không được chuyển sang true trong vòng 5 giây, hoặc một thời gian chờ tính bằng mili giây do người dùng đặt trong tham số thứ ba của phương thức `registerWhen`, thì `ConditionalModule` sẽ ném ra lỗi và Nest sẽ hủy việc khởi động ứng dụng.

#### Biến có thể mở rộng (Expandable variables)

Gói `@nestjs/config` hỗ trợ mở rộng biến môi trường. Với kỹ thuật này, bạn có thể tạo các biến môi trường lồng nhau, trong đó một biến được tham chiếu trong định nghĩa của biến khác. Ví dụ:

```json
APP_URL=mywebsite.com
SUPPORT_EMAIL=support@${APP_URL}
```

Với cấu trúc này, biến `SUPPORT_EMAIL` được giải quyết thành `'support@mywebsite.com'`. Lưu ý việc sử dụng cú pháp `${{ '{' }}...{{ '}' }}` để kích hoạt việc giải quyết giá trị của biến `APP_URL` bên trong định nghĩa của `SUPPORT_EMAIL`.

> info **Gợi ý** Đối với tính năng này, gói `@nestjs/config` sử dụng nội bộ [dotenv-expand](https://github.com/motdotla/dotenv-expand).

Bật tính năng mở rộng biến môi trường bằng cách sử dụng thuộc tính `expandVariables` trong đối tượng tùy chọn được truyền vào phương thức `forRoot()` của `ConfigModule`, như được hiển thị bên dưới:

```typescript
@@filename(app.module)
@Module({
  imports: [
    ConfigModule.forRoot({
      // ...
      expandVariables: true,
    }),
  ],
})
export class AppModule {}
```

#### Sử dụng trong `main.ts` (Using in the `main.ts`)

Mặc dù cấu hình của chúng ta được lưu trữ trong một service, nó vẫn có thể được sử dụng trong tệp `main.ts`. Theo cách này, bạn có thể sử dụng nó để lưu trữ các biến như cổng ứng dụng hoặc máy chủ CORS.

Để truy cập nó, bạn phải sử dụng phương thức `app.get()`, theo sau là tham chiếu service:

```typescript
const configService = app.get(ConfigService);
```

Sau đó, bạn có thể sử dụng nó như bình thường, bằng cách gọi phương thức `get` với khóa cấu hình:

```typescript
const port = configService.get('PORT');
```
