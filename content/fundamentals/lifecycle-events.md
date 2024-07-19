### Các sự kiện vòng đời (Lifecycle Events)

Một ứng dụng Nest, cũng như mọi thành phần của ứng dụng, có một vòng đời được quản lý bởi Nest. Nest cung cấp các **hooks vòng đời** (lifecycle hooks) cho phép quan sát các sự kiện vòng đời quan trọng và khả năng thực hiện hành động (chạy mã đã đăng ký trên các module, provider hoặc controller) khi chúng xảy ra.

#### Trình tự vòng đời (Lifecycle sequence)

Sơ đồ sau mô tả trình tự các sự kiện vòng đời chính của ứng dụng, từ lúc ứng dụng được khởi động cho đến khi tiến trình node kết thúc. Chúng ta có thể chia toàn bộ vòng đời thành ba giai đoạn: **khởi tạo** (initializing), **chạy** (running) và **kết thúc** (terminating). Sử dụng vòng đời này, bạn có thể lên kế hoạch khởi tạo phù hợp cho các module và dịch vụ, quản lý các kết nối đang hoạt động và tắt ứng dụng một cách nhẹ nhàng khi nhận được tín hiệu kết thúc.

<figure><img src="/assets/lifecycle-events.png" /></figure>

#### Các sự kiện vòng đời (Lifecycle events)

Các sự kiện vòng đời xảy ra trong quá trình khởi động và tắt ứng dụng. Nest gọi các phương thức hook vòng đời đã đăng ký trên các module, provider và controller tại mỗi sự kiện vòng đời sau đây (**shutdown hooks** cần được kích hoạt trước, như mô tả [bên dưới](https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown)). Như hiển thị trong sơ đồ trên, Nest cũng gọi các phương thức cơ bản phù hợp để bắt đầu lắng nghe kết nối và dừng lắng nghe kết nối.

Trong bảng sau, `onModuleDestroy`, `beforeApplicationShutdown` và `onApplicationShutdown` chỉ được kích hoạt nếu bạn gọi `app.close()` một cách rõ ràng hoặc nếu tiến trình nhận được tín hiệu hệ thống đặc biệt (như SIGTERM) và bạn đã gọi `enableShutdownHooks` đúng cách khi khởi động ứng dụng (xem phần **Tắt ứng dụng** (Application shutdown) bên dưới).

| Phương thức hook vòng đời       | Sự kiện vòng đời kích hoạt lời gọi phương thức hook                                                                                                                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onModuleInit()`                | Được gọi một lần khi các phụ thuộc của module chủ đã được giải quyết.                                                                                                                                                              |
| `onApplicationBootstrap()`      | Được gọi một lần khi tất cả các module đã được khởi tạo, nhưng trước khi lắng nghe kết nối.                                                                                                                                        |
| `onModuleDestroy()`\*           | Được gọi sau khi nhận được tín hiệu kết thúc (ví dụ: `SIGTERM`).                                                                                                                                                                   |
| `beforeApplicationShutdown()`\* | Được gọi sau khi tất cả các xử lý `onModuleDestroy()` đã hoàn thành (Promises đã giải quyết hoặc bị từ chối);<br />khi hoàn thành (Promises đã giải quyết hoặc bị từ chối), tất cả kết nối hiện có sẽ bị đóng (gọi `app.close()`). |
| `onApplicationShutdown()`\*     | Được gọi sau khi các kết nối đóng (giải quyết `app.close()`).                                                                                                                                                                      |

\* Đối với các sự kiện này, nếu bạn không gọi `app.close()` một cách rõ ràng, bạn phải chọn tham gia để làm cho chúng hoạt động với các tín hiệu hệ thống như `SIGTERM`. Xem phần [Tắt ứng dụng](fundamentals/lifecycle-events#application-shutdown) bên dưới.

> **Cảnh báo** Các hook vòng đời được liệt kê ở trên không được kích hoạt cho các lớp **phạm vi yêu cầu** (request-scoped). Các lớp phạm vi yêu cầu không gắn liền với vòng đời ứng dụng và tuổi thọ của chúng không thể đoán trước. Chúng được tạo riêng cho mỗi yêu cầu và tự động được thu gom rác sau khi phản hồi được gửi đi.

> **Gợi ý** Thứ tự thực hiện của `onModuleInit()` và `onApplicationBootstrap()` phụ thuộc trực tiếp vào thứ tự nhập khẩu module, đợi hook trước đó.

#### Cách sử dụng (Usage)

Mỗi hook vòng đời được đại diện bởi một giao diện. Các giao diện về mặt kỹ thuật là tùy chọn vì chúng không tồn tại sau khi biên dịch TypeScript. Tuy nhiên, việc sử dụng chúng là một thực hành tốt để hưởng lợi từ kiểu dữ liệu mạnh và công cụ chỉnh sửa. Để đăng ký một hook vòng đời, hãy triển khai giao diện phù hợp. Ví dụ, để đăng ký một phương thức được gọi trong quá trình khởi tạo module trên một lớp cụ thể (ví dụ: Controller, Provider hoặc Module), hãy triển khai giao diện `OnModuleInit` bằng cách cung cấp một phương thức `onModuleInit()`, như được hiển thị dưới đây:

```typescript
@@filename()
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  onModuleInit() {
    console.log(`The module has been initialized.`);
  }
}
```

#### Khởi tạo bất đồng bộ (Asynchronous initialization)

Cả hai hook `OnModuleInit` và `OnApplicationBootstrap` cho phép bạn trì hoãn quá trình khởi tạo ứng dụng (trả về một `Promise` hoặc đánh dấu phương thức là `async` và `await` hoàn thành phương thức bất đồng bộ trong thân phương thức).

```typescript
@@filename()
async onModuleInit(): Promise<void> {
  await this.fetch();
}
@@switch
async onModuleInit() {
  await this.fetch();
}
```

#### Tắt ứng dụng (Application shutdown)

Các hook `onModuleDestroy()`, `beforeApplicationShutdown()` và `onApplicationShutdown()` được gọi trong giai đoạn kết thúc (để đáp ứng lời gọi rõ ràng đến `app.close()` hoặc khi nhận được tín hiệu hệ thống như SIGTERM nếu đã chọn tham gia). Tính năng này thường được sử dụng với [Kubernetes](https://kubernetes.io/) để quản lý vòng đời container, bởi [Heroku](https://www.heroku.com/) cho dynos hoặc các dịch vụ tương tự.

Các trình nghe hook tắt tiêu thụ tài nguyên hệ thống, vì vậy chúng bị vô hiệu hóa theo mặc định. Để sử dụng các hook tắt, bạn **phải kích hoạt trình nghe** bằng cách gọi `enableShutdownHooks()`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bắt đầu lắng nghe các hook tắt
  app.enableShutdownHooks();

  await app.listen(3000);
}
bootstrap();
```

> **cảnh báo** Do hạn chế vốn có của nền tảng, NestJS có hỗ trợ hạn chế cho các hook tắt ứng dụng trên Windows. Bạn có thể mong đợi `SIGINT` hoạt động, cũng như `SIGBREAK` và đến một mức độ nào đó là `SIGHUP` - [đọc thêm](https://nodejs.org/api/process.html#process_signal_events). Tuy nhiên, `SIGTERM` sẽ không bao giờ hoạt động trên Windows vì việc kết thúc một tiến trình trong trình quản lý tác vụ là vô điều kiện, "nghĩa là không có cách nào để một ứng dụng phát hiện hoặc ngăn chặn nó". Đây là một số [tài liệu liên quan](https://docs.libuv.org/en/v1.x/signal.html) từ libuv để tìm hiểu thêm về cách `SIGINT`, `SIGBREAK` và các tín hiệu khác được xử lý trên Windows. Ngoài ra, hãy xem tài liệu Node.js về [Sự kiện tín hiệu tiến trình](https://nodejs.org/api/process.html#process_signal_events)

> **Thông tin** `enableShutdownHooks` tiêu thụ bộ nhớ bằng cách khởi động các trình nghe. Trong trường hợp bạn đang chạy nhiều ứng dụng Nest trong một tiến trình Node duy nhất (ví dụ: khi chạy các bài kiểm tra song song với Jest), Node có thể phàn nàn về quá nhiều tiến trình nghe. Vì lý do này, `enableShutdownHooks` không được kích hoạt theo mặc định. Hãy lưu ý điều kiện này khi bạn đang chạy nhiều phiên bản trong một tiến trình Node duy nhất.

Khi ứng dụng nhận được tín hiệu kết thúc, nó sẽ gọi bất kỳ phương thức `onModuleDestroy()`, `beforeApplicationShutdown()`, sau đó là `onApplicationShutdown()` đã đăng ký (theo trình tự được mô tả ở trên) với tín hiệu tương ứng làm tham số đầu tiên. Nếu một hàm đã đăng ký đợi một lời gọi bất đồng bộ (trả về một promise), Nest sẽ không tiếp tục trong chuỗi cho đến khi promise được giải quyết hoặc bị từ chối.

```typescript
@@filename()
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal: string) {
    console.log(signal); // ví dụ: "SIGINT"
  }
}
@@switch
@Injectable()
class UsersService implements OnApplicationShutdown {
  onApplicationShutdown(signal) {
    console.log(signal); // ví dụ: "SIGINT"
  }
}
```

> **Thông tin** Việc gọi `app.close()` không kết thúc tiến trình Node mà chỉ kích hoạt các hook `onModuleDestroy()` và `onApplicationShutdown()`, vì vậy nếu có một số khoảng thời gian, tác vụ nền chạy dài, v.v., tiến trình sẽ không tự động kết thúc.
