### Đọc-Đánh giá-In-Lặp (Read-Eval-Print-Loop - REPL)

REPL là một môi trường tương tác đơn giản nhận đầu vào đơn lẻ từ người dùng, thực thi chúng và trả về kết quả cho người dùng.
Tính năng REPL cho phép bạn kiểm tra đồ thị phụ thuộc và gọi các phương thức trên các provider (và controller) của bạn trực tiếp từ terminal.

#### Sử dụng (Usage)

Để chạy ứng dụng NestJS của bạn ở chế độ REPL, tạo một tệp `repl.ts` mới (bên cạnh tệp `main.ts` hiện có) và thêm mã sau vào bên trong:

```typescript
@@filename(repl)
import { repl } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
@@switch
import { repl } from '@nestjs/core';
import { AppModule } from './src/app.module';

async function bootstrap() {
  await repl(AppModule);
}
bootstrap();
```

Bây giờ trong terminal của bạn, khởi động REPL bằng lệnh sau:

```bash
$ npm run start -- --entryFile repl
```

> info **Gợi ý** `repl` trả về một đối tượng [Node.js REPL server](https://nodejs.org/api/repl.html).

Khi nó đã chạy, bạn sẽ thấy thông báo sau trong console của bạn:

```bash
LOG [NestFactory] Starting Nest application...
LOG [InstanceLoader] AppModule dependencies initialized
LOG REPL initialized
```

Và bây giờ bạn có thể bắt đầu tương tác với đồ thị phụ thuộc của mình. Ví dụ, bạn có thể truy xuất một `AppService` (chúng ta đang sử dụng dự án khởi đầu làm ví dụ ở đây) và gọi phương thức `getHello()`:

```typescript
> get(AppService).getHello()
'Hello World!'
```

Bạn có thể thực thi bất kỳ mã JavaScript nào từ terminal của mình, ví dụ, gán một instance của `AppController` cho một biến cục bộ, và sử dụng `await` để gọi một phương thức bất đồng bộ:

```typescript
> appController = get(AppController)
AppController { appService: AppService {} }
> await appController.getHello()
'Hello World!'
```

Để hiển thị tất cả các phương thức công khai có sẵn trên một provider hoặc controller nhất định, sử dụng hàm `methods()`, như sau:

```typescript
> methods(AppController)

Methods:
 ◻ getHello
```

Để in tất cả các module đã đăng ký dưới dạng danh sách cùng với các controller và provider của chúng, sử dụng `debug()`.

```typescript
> debug()

AppModule:
 - controllers:
  ◻ AppController
 - providers:
  ◻ AppService
```

Demo nhanh:

<figure><img src="/assets/repl.gif" alt="Ví dụ REPL" /></figure>

Bạn có thể tìm thêm thông tin về các phương thức gốc hiện có, được định nghĩa trước trong phần dưới đây.

#### Các hàm gốc (Native functions)

REPL tích hợp của NestJS đi kèm với một số hàm gốc có sẵn toàn cục khi bạn khởi động REPL. Bạn có thể gọi `help()` để liệt kê chúng ra.

Nếu bạn không nhớ chữ ký (tức là: các tham số dự kiến và kiểu trả về) của một hàm, bạn có thể gọi `<function_name>.help`.
Ví dụ:

```text
> $.help
Truy xuất một instance của injectable hoặc controller, nếu không sẽ ném ra ngoại lệ.
Giao diện: $(token: InjectionToken) => any
```

> info **Gợi ý** Những giao diện hàm này được viết bằng [cú pháp biểu thức kiểu hàm TypeScript](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-type-expressions).

| Hàm            | Mô tả                                                                                                              | Chữ ký                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `debug`        | In tất cả các module đã đăng ký dưới dạng danh sách cùng với các controller và provider của chúng.                 | `debug(moduleCls?: ClassRef \| string) => void`                       |
| `get` hoặc `$` | Truy xuất một instance của injectable hoặc controller, nếu không sẽ ném ra ngoại lệ.                               | `get(token: InjectionToken) => any`                                   |
| `methods`      | Hiển thị tất cả các phương thức công khai có sẵn trên một provider hoặc controller nhất định.                      | `methods(token: ClassRef \| string) => void`                          |
| `resolve`      | Giải quyết instance tạm thời hoặc có phạm vi yêu cầu của injectable hoặc controller, nếu không sẽ ném ra ngoại lệ. | `resolve(token: InjectionToken, contextId: any) => Promise<any>`      |
| `select`       | Cho phép điều hướng qua cây module, ví dụ, để lấy ra một instance cụ thể từ module đã chọn.                        | `select(token: DynamicModule \| ClassRef) => INestApplicationContext` |

#### Chế độ theo dõi (Watch mode)

Trong quá trình phát triển, việc chạy REPL ở chế độ theo dõi để phản ánh tất cả các thay đổi mã tự động là rất hữu ích:

```bash
$ npm run start -- --watch --entryFile repl
```

Điều này có một nhược điểm, lịch sử lệnh của REPL bị loại bỏ sau mỗi lần tải lại, điều này có thể gây khó chịu.
May mắn thay, có một giải pháp rất đơn giản. Sửa đổi hàm `bootstrap` của bạn như sau:

```typescript
async function bootstrap() {
  const replServer = await repl(AppModule);
  replServer.setupHistory('.nestjs_repl_history', (err) => {
    if (err) {
      console.error(err);
    }
  });
}
```

Bây giờ lịch sử được bảo toàn giữa các lần chạy/tải lại.
