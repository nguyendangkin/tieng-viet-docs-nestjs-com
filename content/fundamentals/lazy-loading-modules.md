### Tải các module lười biếng (Lazy loading modules)

Theo mặc định, các module được tải một cách háo hức, nghĩa là ngay khi ứng dụng tải, tất cả các module cũng được tải theo, bất kể chúng có cần thiết ngay lập tức hay không. Mặc dù điều này tốt cho hầu hết các ứng dụng, nó có thể trở thành nút thắt cổ chai cho các ứng dụng/worker chạy trong **môi trường serverless**, nơi mà độ trễ khởi động ("khởi động lạnh") là rất quan trọng.

Tải lười biếng có thể giúp giảm thời gian khởi động bằng cách chỉ tải các module cần thiết cho lần gọi hàm serverless cụ thể. Ngoài ra, bạn cũng có thể tải các module khác một cách bất đồng bộ sau khi hàm serverless đã "ấm" để tăng tốc thời gian khởi động cho các lần gọi tiếp theo (đăng ký module trì hoãn).

> info **Gợi ý** Nếu bạn quen thuộc với framework **[Angular](https://angular.dev/)**, bạn có thể đã từng thấy thuật ngữ "[lazy-loading modules](https://angular.dev/guide/ngmodules/lazy-loading#lazy-loading-basics)". Hãy lưu ý rằng kỹ thuật này **khác biệt về mặt chức năng** trong Nest, vì vậy hãy xem đây như một tính năng hoàn toàn khác nhưng có quy ước đặt tên tương tự.

> warning **Cảnh báo** Lưu ý rằng [các phương thức hook vòng đời](https://docs.nestjs.com/fundamentals/lifecycle-events) không được gọi trong các module và service được tải lười biếng.

#### Bắt đầu (Getting started)

Để tải các module theo yêu cầu, Nest cung cấp lớp `LazyModuleLoader` có thể được tiêm vào một lớp theo cách thông thường:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(private lazyModuleLoader: LazyModuleLoader) {}
}
@@switch
@Injectable()
@Dependencies(LazyModuleLoader)
export class CatsService {
  constructor(lazyModuleLoader) {
    this.lazyModuleLoader = lazyModuleLoader;
  }
}
```

> info **Gợi ý** Lớp `LazyModuleLoader` được import từ gói `@nestjs/core`.

Ngoài ra, bạn có thể lấy tham chiếu đến provider `LazyModuleLoader` từ trong tệp khởi động ứng dụng (`main.ts`) của bạn, như sau:

```typescript
// "app" đại diện cho một phiên bản ứng dụng Nest
const lazyModuleLoader = app.get(LazyModuleLoader);
```

Với điều này, bạn có thể tải bất kỳ module nào bằng cách sử dụng cấu trúc sau:

```typescript
const { LazyModule } = await import('./lazy.module');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);
```

> info **Gợi ý** Các module "được tải lười biếng" được **lưu vào bộ nhớ đệm** sau lần gọi đầu tiên phương thức `LazyModuleLoader#load`. Điều đó có nghĩa là mỗi lần cố gắng tải `LazyModule` tiếp theo sẽ **rất nhanh** và sẽ trả về một phiên bản đã lưu trong bộ nhớ đệm, thay vì tải lại module.
>
> ```bash
> Lần tải "LazyModule": 1
> thời gian: 2.379ms
> Lần tải "LazyModule": 2
> thời gian: 0.294ms
> Lần tải "LazyModule": 3
> thời gian: 0.303ms
> ```
>
> Ngoài ra, các module "được tải lười biếng" chia sẻ cùng một đồ thị module với những module được tải háo hức khi khởi động ứng dụng cũng như bất kỳ module lười biếng nào khác được đăng ký sau đó trong ứng dụng của bạn.

Trong đó `lazy.module.ts` là một tệp TypeScript xuất ra một **module Nest thông thường** (không cần thay đổi thêm).

Phương thức `LazyModuleLoader#load` trả về [tham chiếu module](/fundamentals/module-ref) (của `LazyModule`) cho phép bạn điều hướng danh sách nội bộ các provider và lấy tham chiếu đến bất kỳ provider nào bằng cách sử dụng token tiêm của nó làm khóa tra cứu.

Ví dụ, giả sử chúng ta có một `LazyModule` với định nghĩa sau:

```typescript
@Module({
  providers: [LazyService],
  exports: [LazyService],
})
export class LazyModule {}
```

> info **Gợi ý** Các module được tải lười biếng không thể được đăng ký là **module toàn cục** vì điều đó không có ý nghĩa (vì chúng được đăng ký một cách lười biếng, theo yêu cầu khi tất cả các module được đăng ký tĩnh đã được khởi tạo). Tương tự, các **bộ tăng cường toàn cục** đã đăng ký (guards/interceptors/v.v.) **sẽ không hoạt động** đúng cách.

Với điều này, chúng ta có thể lấy tham chiếu đến provider `LazyService`, như sau:

```typescript
const { LazyModule } = await import('./lazy.module');
const moduleRef = await this.lazyModuleLoader.load(() => LazyModule);

const { LazyService } = await import('./lazy.service');
const lazyService = moduleRef.get(LazyService);
```

> warning **Cảnh báo** Nếu bạn sử dụng **Webpack**, hãy đảm bảo cập nhật tệp `tsconfig.json` của bạn - đặt `compilerOptions.module` thành `"esnext"` và thêm thuộc tính `compilerOptions.moduleResolution` với giá trị là `"node"`:
>
> ```json
> {
>   "compilerOptions": {
>     "module": "esnext",
>     "moduleResolution": "node",
>     ...
>   }
> }
> ```
>
> Với những tùy chọn này được thiết lập, bạn sẽ có thể tận dụng tính năng [phân chia mã](https://webpack.js.org/guides/code-splitting/).

#### Tải lười biếng controllers, gateways, và resolvers (Lazy loading controllers, gateways, and resolvers)

Vì controllers (hoặc resolvers trong ứng dụng GraphQL) trong Nest đại diện cho các tập hợp các routes/paths/topics (hoặc queries/mutations), bạn **không thể tải lười biếng chúng** bằng cách sử dụng lớp `LazyModuleLoader`.

> error **Cảnh báo** Controllers, [resolvers](/graphql/resolvers), và [gateways](/websockets/gateways) được đăng ký bên trong các module tải lười biếng sẽ không hoạt động như mong đợi. Tương tự, bạn không thể đăng ký các hàm middleware (bằng cách triển khai giao diện `MiddlewareConsumer`) theo yêu cầu.

Ví dụ, giả sử bạn đang xây dựng một API REST (ứng dụng HTTP) với trình điều khiển Fastify ở bên dưới (sử dụng gói `@nestjs/platform-fastify`). Fastify không cho phép bạn đăng ký các route sau khi ứng dụng đã sẵn sàng/lắng nghe thành công các tin nhắn. Điều đó có nghĩa là ngay cả khi chúng ta phân tích các ánh xạ route được đăng ký trong các controller của module, tất cả các route được tải lười biếng sẽ không thể truy cập được vì không có cách nào để đăng ký chúng trong thời gian chạy.

Tương tự, một số chiến lược truyền tải mà chúng tôi cung cấp như một phần của gói `@nestjs/microservices` (bao gồm Kafka, gRPC, hoặc RabbitMQ) yêu cầu đăng ký/lắng nghe các topic/kênh cụ thể trước khi kết nối được thiết lập. Một khi ứng dụng của bạn bắt đầu lắng nghe tin nhắn, framework sẽ không thể đăng ký/lắng nghe các topic mới.

Cuối cùng, gói `@nestjs/graphql` với cách tiếp cận code first được bật sẽ tự động tạo schema GraphQL ngay lập tức dựa trên metadata. Điều đó có nghĩa là nó yêu cầu tất cả các lớp phải được tải trước. Nếu không, sẽ không thể tạo ra schema phù hợp, hợp lệ.

#### Các trường hợp sử dụng phổ biến (Common use-cases)

Phổ biến nhất, bạn sẽ thấy các module được tải lười biếng trong các tình huống khi worker/cron job/lambda & hàm serverless/webhook của bạn phải kích hoạt các service khác nhau (logic khác nhau) dựa trên các đối số đầu vào (đường dẫn route/ngày tháng/tham số truy vấn, v.v.). Mặt khác, việc tải lười biếng các module có thể không quá có ý nghĩa đối với các ứng dụng monolithic, nơi mà thời gian khởi động không quá quan trọng.
