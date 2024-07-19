### Những bước đầu tiên (First steps)

Trong loạt bài viết này, bạn sẽ học về **những nguyên tắc cơ bản** của Nest. Để làm quen với những khối xây dựng thiết yếu của các ứng dụng Nest, chúng ta sẽ xây dựng một ứng dụng CRUD cơ bản với các tính năng bao quát nhiều lĩnh vực ở mức độ giới thiệu.

#### Ngôn ngữ (Language)

Chúng tôi yêu thích [TypeScript](https://www.typescriptlang.org/), nhưng trên hết - chúng tôi yêu [Node.js](https://nodejs.org/en/). Đó là lý do tại sao Nest tương thích với cả TypeScript và **JavaScript thuần túy**. Nest tận dụng các tính năng ngôn ngữ mới nhất, vì vậy để sử dụng nó với JavaScript thuần túy, chúng ta cần một trình biên dịch [Babel](https://babeljs.io/).

Chúng tôi sẽ chủ yếu sử dụng TypeScript trong các ví dụ mà chúng tôi cung cấp, nhưng bạn luôn có thể **chuyển đổi các đoạn mã** sang cú pháp JavaScript thuần túy (chỉ cần nhấp để chuyển đổi nút ngôn ngữ ở góc trên bên phải của mỗi đoạn mã).

#### Yêu cầu tiên quyết (Prerequisites)

Vui lòng đảm bảo rằng [Node.js](https://nodejs.org) (phiên bản >= 16) đã được cài đặt trên hệ điều hành của bạn.

#### Thiết lập (Setup)

Thiết lập một dự án mới khá đơn giản với [Nest CLI](/cli/overview). Với [npm](https://www.npmjs.com/) đã được cài đặt, bạn có thể tạo một dự án Nest mới với các lệnh sau trong terminal của hệ điều hành:

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

> info **Gợi ý** Để tạo một dự án mới với bộ tính năng [nghiêm ngặt hơn](https://www.typescriptlang.org/tsconfig#strict) của TypeScript, hãy truyền cờ `--strict` vào lệnh `nest new`.

Thư mục `project-name` sẽ được tạo, các module node và một số file mẫu khác sẽ được cài đặt, và một thư mục `src/` sẽ được tạo và điền vào với một số file cốt lõi.

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.spec.ts</div>
    <div class="item">app.controller.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">app.service.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

Đây là một tổng quan ngắn gọn về những file cốt lõi đó:

|                          |                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------- |
| `app.controller.ts`      | Một controller cơ bản với một route duy nhất.                                                      |
| `app.controller.spec.ts` | Các unit test cho controller.                                                                      |
| `app.module.ts`          | Module gốc của ứng dụng.                                                                           |
| `app.service.ts`         | Một service cơ bản với một phương thức duy nhất.                                                   |
| `main.ts`                | File đầu vào của ứng dụng sử dụng hàm cốt lõi `NestFactory` để tạo một instance của ứng dụng Nest. |

File `main.ts` bao gồm một hàm async, sẽ **khởi động** ứng dụng của chúng ta:

```typescript
@@filename(main)

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

Để tạo một instance của ứng dụng Nest, chúng ta sử dụng lớp cốt lõi `NestFactory`. `NestFactory` cung cấp một số phương thức tĩnh cho phép tạo một instance của ứng dụng. Phương thức `create()` trả về một đối tượng ứng dụng, thực hiện giao diện `INestApplication`. Đối tượng này cung cấp một tập hợp các phương thức được mô tả trong các chương sắp tới. Trong ví dụ `main.ts` ở trên, chúng ta chỉ đơn giản khởi động HTTP listener của chúng ta, cho phép ứng dụng chờ các yêu cầu HTTP đến.

Lưu ý rằng một dự án được tạo khung bằng Nest CLI tạo ra một cấu trúc dự án ban đầu khuyến khích các nhà phát triển tuân theo quy ước giữ mỗi module trong thư mục riêng của nó.

> info **Gợi ý** Theo mặc định, nếu bất kỳ lỗi nào xảy ra trong quá trình tạo ứng dụng, ứng dụng của bạn sẽ thoát với mã `1`. Nếu bạn muốn nó ném ra một lỗi thay vì vậy, hãy tắt tùy chọn `abortOnError` (ví dụ: `NestFactory.create(AppModule, {{ '{' }} abortOnError: false {{ '}' }})`).

<app-banner-courses></app-banner-courses>

#### Nền tảng (Platform)

Nest nhằm mục đích trở thành một framework độc lập với nền tảng. Tính độc lập với nền tảng cho phép tạo ra các phần logic có thể tái sử dụng mà các nhà phát triển có thể tận dụng trên nhiều loại ứng dụng khác nhau. Về mặt kỹ thuật, Nest có thể làm việc với bất kỳ framework HTTP Node nào khi một bộ điều hợp được tạo ra. Có hai nền tảng HTTP được hỗ trợ sẵn: [express](https://expressjs.com/) và [fastify](https://www.fastify.io). Bạn có thể chọn cái phù hợp nhất với nhu cầu của mình.

|                    |                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform-express` | [Express](https://expressjs.com/) là một framework web tối giản nổi tiếng cho node. Đó là một thư viện đã được kiểm chứng, sẵn sàng cho sản xuất với nhiều tài nguyên được cộng đồng triển khai. Gói `@nestjs/platform-express` được sử dụng theo mặc định. Nhiều người dùng được phục vụ tốt với Express và không cần thực hiện hành động nào để kích hoạt nó. |
| `platform-fastify` | [Fastify](https://www.fastify.io/) là một framework hiệu suất cao và tiêu tốn ít tài nguyên, tập trung cao độ vào việc cung cấp hiệu quả và tốc độ tối đa. Đọc cách sử dụng nó [tại đây](/techniques/performance).                                                                                                                                              |

Bất kể nền tảng nào được sử dụng, nó đều hiển thị giao diện ứng dụng riêng của mình. Chúng được xem lần lượt là `NestExpressApplication` và `NestFastifyApplication`.

Khi bạn truyền một kiểu vào phương thức `NestFactory.create()`, như trong ví dụ dưới đây, đối tượng `app` sẽ có các phương thức có sẵn dành riêng cho nền tảng cụ thể đó. Tuy nhiên, lưu ý rằng bạn **không cần** chỉ định một kiểu **trừ khi** bạn thực sự muốn truy cập API nền tảng cơ bản.

```typescript
const app = await NestFactory.create<NestExpressApplication>(AppModule);
```

#### Chạy ứng dụng (Running the application)

Khi quá trình cài đặt hoàn tất, bạn có thể chạy lệnh sau tại dấu nhắc lệnh của hệ điều hành để khởi động ứng dụng lắng nghe các yêu cầu HTTP đến:

```bash
$ npm run start
```

> info **Gợi ý** Để tăng tốc quá trình phát triển (xây dựng nhanh hơn 20 lần), bạn có thể sử dụng [SWC builder](/recipes/swc) bằng cách truyền cờ `-b swc` vào script `start`, như sau `npm run start -- -b swc`.

Lệnh này khởi động ứng dụng với máy chủ HTTP lắng nghe trên cổng được định nghĩa trong file `src/main.ts`. Khi ứng dụng đang chạy, hãy mở trình duyệt của bạn và điều hướng đến `http://localhost:3000/`. Bạn sẽ thấy thông báo `Hello World!`.

Để theo dõi các thay đổi trong file của bạn, bạn có thể chạy lệnh sau để khởi động ứng dụng:

```bash
$ npm run start:dev
```

Lệnh này sẽ theo dõi các file của bạn, tự động biên dịch lại và tải lại máy chủ.

#### Linting và formatting (Linting and formatting)

[CLI](/cli/overview) cung cấp nỗ lực tốt nhất để tạo khung một quy trình phát triển đáng tin cậy ở quy mô lớn. Do đó, một dự án Nest được tạo ra đi kèm với cả **linter** và **formatter** mã được cài đặt sẵn (tương ứng là [eslint](https://eslint.org/) và [prettier](https://prettier.io/)).

> info **Gợi ý** Không chắc chắn về vai trò của formatters so với linters? Tìm hiểu sự khác biệt [tại đây](https://prettier.io/docs/en/comparison.html).

Để đảm bảo tính ổn định và khả năng mở rộng tối đa, chúng tôi sử dụng các gói cli cơ bản [`eslint`](https://www.npmjs.com/package/eslint) và [`prettier`](https://www.npmjs.com/package/prettier). Thiết lập này cho phép tích hợp IDE gọn gàng với các tiện ích mở rộng chính thức theo thiết kế.

Đối với các môi trường không có giao diện người dùng, nơi IDE không liên quan (Tích hợp Liên tục, Git hooks, v.v.), một dự án Nest đi kèm với các script `npm` sẵn sàng sử dụng.

```bash
# Lint và tự động sửa với eslint
$ npm run lint

# Format với prettier
$ npm run format
```
