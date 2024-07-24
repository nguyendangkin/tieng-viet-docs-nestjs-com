### SWC

[SWC](https://swc.rs/) (Trình biên dịch Web nhanh chóng) là một nền tảng có thể mở rộng dựa trên Rust có thể được sử dụng cho cả biên dịch và đóng gói.
Sử dụng SWC với Nest CLI là một cách tuyệt vời và đơn giản để tăng tốc đáng kể quá trình phát triển của bạn.

> info **Gợi ý** SWC nhanh hơn khoảng **20 lần** so với trình biên dịch TypeScript mặc định.

#### Cài đặt (Installation)

Để bắt đầu, trước tiên hãy cài đặt một vài gói:

```bash
$ npm i --save-dev @swc/cli @swc/core
```

#### Bắt đầu (Getting started)

Sau khi quá trình cài đặt hoàn tất, bạn có thể sử dụng trình xây dựng `swc` với Nest CLI như sau:

```bash
$ nest start -b swc
# HOẶC nest start --builder swc
```

> info **Gợi ý** Nếu repository của bạn là monorepo, hãy xem [phần này](/recipes/swc#monorepo).

Thay vì truyền cờ `-b`, bạn cũng có thể đặt thuộc tính `compilerOptions.builder` thành `"swc"` trong tệp `nest-cli.json` của bạn, như sau:

```json
{
  "compilerOptions": {
    "builder": "swc"
  }
}
```

Để tùy chỉnh hành vi của trình xây dựng, bạn có thể truyền một đối tượng chứa hai thuộc tính, `type` (`"swc"`) và `options`, như sau:

```json
"compilerOptions": {
  "builder": {
    "type": "swc",
    "options": {
      "swcrcPath": "infrastructure/.swcrc",
    }
  }
}
```

Để chạy ứng dụng ở chế độ theo dõi, sử dụng lệnh sau:

```bash
$ nest start -b swc -w
# HOẶC nest start --builder swc --watch
```

#### Kiểm tra kiểu (Type checking)

SWC không thực hiện bất kỳ kiểm tra kiểu nào (khác với trình biên dịch TypeScript mặc định), vì vậy để bật nó, bạn cần sử dụng cờ `--type-check`:

```bash
$ nest start -b swc --type-check
```

Lệnh này sẽ hướng dẫn Nest CLI chạy `tsc` ở chế độ `noEmit` cùng với SWC, điều này sẽ thực hiện kiểm tra kiểu một cách không đồng bộ. Một lần nữa, thay vì truyền cờ `--type-check`, bạn cũng có thể đặt thuộc tính `compilerOptions.typeCheck` thành `true` trong tệp `nest-cli.json` của bạn, như sau:

```json
{
  "compilerOptions": {
    "builder": "swc",
    "typeCheck": true
  }
}
```

#### Plugin CLI (SWC)

Cờ `--type-check` sẽ tự động thực thi **các plugin CLI của NestJS** và tạo ra một tệp metadata được tuần tự hóa, sau đó có thể được tải bởi ứng dụng trong thời gian chạy.

#### Cấu hình SWC (SWC configuration)

Trình xây dựng SWC được cấu hình sẵn để phù hợp với các yêu cầu của ứng dụng NestJS. Tuy nhiên, bạn có thể tùy chỉnh cấu hình bằng cách tạo một tệp `.swcrc` trong thư mục gốc và điều chỉnh các tùy chọn theo ý muốn.

```json
{
  "$schema": "https://json.schemastore.org/swcrc",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
```

#### Monorepo

Nếu repository của bạn là monorepo, thay vì sử dụng trình xây dựng `swc`, bạn phải cấu hình `webpack` để sử dụng `swc-loader`.

Đầu tiên, hãy cài đặt gói cần thiết:

```bash
$ npm i --save-dev swc-loader
```

Sau khi cài đặt hoàn tất, tạo một tệp `webpack.config.js` trong thư mục gốc của ứng dụng của bạn với nội dung sau:

```js
const swcDefaultConfig = require('@nestjs/cli/lib/compiler/defaults/swc-defaults').swcDefaultsFactory().swcOptions;

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'swc-loader',
          options: swcDefaultConfig,
        },
      },
    ],
  },
};
```

#### Monorepo và plugin CLI

Bây giờ nếu bạn sử dụng các plugin CLI, `swc-loader` sẽ không tự động tải chúng. Thay vào đó, bạn phải tạo một tệp riêng biệt để tải chúng theo cách thủ công. Để làm điều này,
khai báo một tệp `generate-metadata.ts` gần tệp `main.ts` với nội dung sau:

```ts
import { PluginMetadataGenerator } from '@nestjs/cli/lib/compiler/plugins';
import { ReadonlyVisitor } from '@nestjs/swagger/dist/plugin';

const generator = new PluginMetadataGenerator();
generator.generate({
  visitors: [new ReadonlyVisitor({ introspectComments: true, pathToSource: __dirname })],
  outputDir: __dirname,
  watch: true,
  tsconfigPath: 'apps/<name>/tsconfig.app.json',
});
```

> info **Gợi ý** Trong ví dụ này, chúng tôi đã sử dụng plugin `@nestjs/swagger`, nhưng bạn có thể sử dụng bất kỳ plugin nào bạn chọn.

Phương thức `generate()` chấp nhận các tùy chọn sau:

|                    |                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `watch`            | Có theo dõi dự án để cập nhật thay đổi hay không.                                             |
| `tsconfigPath`     | Đường dẫn đến tệp `tsconfig.json`. Tương đối với thư mục làm việc hiện tại (`process.cwd()`). |
| `outputDir`        | Đường dẫn đến thư mục nơi tệp metadata sẽ được lưu.                                           |
| `visitors`         | Một mảng các visitor sẽ được sử dụng để tạo metadata.                                         |
| `filename`         | Tên của tệp metadata. Mặc định là `metadata.ts`.                                              |
| `printDiagnostics` | Có in chẩn đoán ra console hay không. Mặc định là `true`.                                     |

Cuối cùng, bạn có thể chạy script `generate-metadata` trong một cửa sổ terminal riêng biệt với lệnh sau:

```bash
$ npx ts-node src/generate-metadata.ts
# HOẶC npx ts-node apps/{YOUR_APP}/src/generate-metadata.ts
```

#### Những vấn đề thường gặp (Common pitfalls)

Nếu bạn sử dụng TypeORM/MikroORM hoặc bất kỳ ORM nào khác trong ứng dụng của mình, bạn có thể gặp phải các vấn đề về import vòng tròn. SWC không xử lý tốt **import vòng tròn**, vì vậy bạn nên sử dụng giải pháp thay thế sau:

```typescript
@Entity()
export class User {
  @OneToOne(() => Profile, (profile) => profile.user)
  profile: Relation<Profile>; // <--- xem kiểu "Relation<>" ở đây thay vì chỉ "Profile"
}
```

> info **Gợi ý** Kiểu `Relation` được xuất từ gói `typeorm`.

Làm như vậy ngăn kiểu của thuộc tính được lưu trong mã đã được chuyển đổi trong metadata của thuộc tính, ngăn chặn các vấn đề về phụ thuộc vòng tròn.

Nếu ORM của bạn không cung cấp giải pháp thay thế tương tự, bạn có thể tự định nghĩa kiểu bao bọc:

```typescript
/**
 * Kiểu bao bọc được sử dụng để tránh vấn đề phụ thuộc vòng tròn của mô-đun ESM
 * gây ra bởi việc lưu metadata phản ánh kiểu của thuộc tính.
 */
export type WrapperType<T> = T; // WrapperType === Relation
```

Đối với tất cả [các phụ thuộc vòng tròn](/fundamentals/circular-dependency) trong dự án của bạn, bạn cũng sẽ cần sử dụng kiểu bao bọc tùy chỉnh được mô tả ở trên:

```typescript
@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => ProfileService))
    private readonly profileService: WrapperType<ProfileService>,
  ) {}
}
```

### Jest + SWC

Để sử dụng SWC với Jest, bạn cần cài đặt các gói sau:

```bash
$ npm i --save-dev jest @swc/core @swc/jest
```

Sau khi cài đặt hoàn tất, cập nhật tệp `package.json`/`jest.config.js` (tùy thuộc vào cấu hình của bạn) với nội dung sau:

```json
{
  "jest": {
    "transform": {
      "^.+\\.(t|j)s?$": ["@swc/jest"]
    }
  }
}
```

Ngoài ra, bạn cần thêm các thuộc tính `transform` sau vào tệp `.swcrc` của bạn: `legacyDecorator`, `decoratorMetadata`:

```json
{
  "$schema": "https://json.schemastore.org/swcrc",
  "sourceMaps": true,
  "jsc": {
    "parser": {
      "syntax": "typescript",
      "decorators": true,
      "dynamicImport": true
    },
    "transform": {
      "legacyDecorator": true,
      "decoratorMetadata": true
    },
    "baseUrl": "./"
  },
  "minify": false
}
```

Nếu bạn sử dụng NestJS CLI Plugins trong dự án của mình, bạn sẽ phải chạy `PluginMetadataGenerator` thủ công. Chuyển đến [phần này](/recipes/swc#monorepo-and-cli-plugins) để tìm hiểu thêm.

### Vitest

[Vitest](https://vitest.dev/) là một trình chạy kiểm thử nhanh và nhẹ được thiết kế để làm việc với Vite. Nó cung cấp một giải pháp kiểm thử hiện đại, nhanh chóng và dễ sử dụng có thể được tích hợp với các dự án NestJS.

#### Cài đặt (Installation)

Để bắt đầu, trước tiên hãy cài đặt các gói cần thiết:

```bash
$ npm i --save-dev vitest unplugin-swc @swc/core @vitest/coverage-v8
```

#### Cấu hình (Configuration)

Tạo một tệp `vitest.config.ts` trong thư mục gốc của ứng dụng của bạn với nội dung sau:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
  },
  plugins: [
    // Điều này là cần thiết để xây dựng các tệp kiểm thử với SWC
    swc.vite({
      // Đặt rõ ràng loại module để tránh kế thừa giá trị này từ tệp cấu hình `.swcrc`
      module: { type: 'es6' },
    }),
  ],
});
```

Tệp cấu hình này thiết lập môi trường Vitest, thư mục gốc và plugin SWC. Bạn cũng nên tạo một tệp cấu hình riêng biệt
cho các kiểm thử e2e, với một trường `include` bổ sung chỉ định regex đường dẫn kiểm thử:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
  },
  plugins: [swc.vite()],
});
```

Ngoài ra, bạn có thể đặt các tùy chọn `alias` để hỗ trợ đường dẫn TypeScript trong các kiểm thử của bạn:

```ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    alias: {
      '@src': './src',
      '@test': './test',
    },
    root: './',
  },
  resolve: {
    alias: {
      '@src': './src',
      '@test': './test',
    },
  },
  plugins: [swc.vite()],
});
```

#### Cập nhật import trong các kiểm thử E2E

Thay đổi bất kỳ import kiểm thử E2E nào sử dụng `import * as request from 'supertest'` thành `import request from 'supertest'`. Điều này là cần thiết vì Vitest, khi được đóng gói với Vite, mong đợi một import mặc định cho supertest. Sử dụng import namespace có thể gây ra vấn đề trong thiết lập cụ thể này.

Cuối cùng, cập nhật các script kiểm thử trong tệp package.json của bạn như sau:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "test:debug": "vitest --inspect-brk --inspect --logHeapUsage --threads=false",
    "test:e2e": "vitest run --config ./vitest.config.e2e.ts"
  }
}
```

Các script này cấu hình Vitest để chạy kiểm thử, theo dõi thay đổi, tạo báo cáo độ phủ mã và gỡ lỗi. Script test:e2e được thiết kế đặc biệt để chạy các kiểm thử E2E với một tệp cấu hình tùy chỉnh.

Với thiết lập này, bạn giờ đây có thể tận hưởng lợi ích của việc sử dụng Vitest trong dự án NestJS của mình, bao gồm thực thi kiểm thử nhanh hơn và trải nghiệm kiểm thử hiện đại hơn.

> info **Gợi ý** Bạn có thể xem một ví dụ hoạt động trong [repository](https://github.com/TrilonIO/nest-vitest) này
