### Hàng đợi (Queues)

Hàng đợi là một mẫu thiết kế mạnh mẽ giúp bạn giải quyết các thách thức phổ biến về hiệu suất và khả năng mở rộng ứng dụng. Một số ví dụ về vấn đề mà Hàng đợi có thể giúp bạn giải quyết là:

- Làm mượt các đỉnh xử lý. Ví dụ, nếu người dùng có thể khởi tạo các tác vụ tiêu tốn nhiều tài nguyên vào bất kỳ thời điểm nào, bạn có thể thêm các tác vụ này vào hàng đợi thay vì thực hiện chúng đồng bộ. Sau đó, bạn có thể có các tiến trình worker lấy tác vụ từ hàng đợi một cách có kiểm soát. Bạn có thể dễ dàng thêm các trình tiêu thụ Hàng đợi mới để mở rộng việc xử lý tác vụ phía sau khi ứng dụng mở rộng.
- Chia nhỏ các tác vụ nguyên khối có thể chặn vòng lặp sự kiện Node.js. Ví dụ, nếu yêu cầu của người dùng đòi hỏi công việc sử dụng CPU mạnh như chuyển mã âm thanh, bạn có thể ủy quyền tác vụ này cho các tiến trình khác, giải phóng các tiến trình đối mặt với người dùng để duy trì khả năng phản hồi.
- Cung cấp một kênh giao tiếp đáng tin cậy qua các dịch vụ khác nhau. Ví dụ, bạn có thể xếp hàng các tác vụ (công việc) trong một tiến trình hoặc dịch vụ và tiêu thụ chúng trong một tiến trình hoặc dịch vụ khác. Bạn có thể được thông báo (bằng cách lắng nghe các sự kiện trạng thái) khi hoàn thành, lỗi hoặc các thay đổi trạng thái khác trong vòng đời công việc từ bất kỳ tiến trình hoặc dịch vụ nào. Khi các nhà sản xuất hoặc người tiêu dùng Hàng đợi thất bại, trạng thái của họ được bảo toàn và việc xử lý tác vụ có thể tự động khởi động lại khi các nút được khởi động lại.

Nest cung cấp gói `@nestjs/bullmq` để tích hợp BullMQ và gói `@nestjs/bull` để tích hợp Bull. Cả hai gói đều là các trừu tượng/bọc trên các thư viện tương ứng của chúng, được phát triển bởi cùng một nhóm. Bull hiện đang trong chế độ bảo trì, với nhóm tập trung vào việc sửa lỗi, trong khi BullMQ đang được phát triển tích cực, với triển khai TypeScript hiện đại và một bộ tính năng khác nhau. Nếu Bull đáp ứng yêu cầu của bạn, nó vẫn là một lựa chọn đáng tin cậy và đã được thử nghiệm kỹ lưỡng. Các gói Nest giúp dễ dàng tích hợp cả Hàng đợi BullMQ hoặc Bull vào ứng dụng Nest của bạn một cách thân thiện.

Cả BullMQ và Bull đều sử dụng [Redis](https://redis.io/) để lưu trữ dữ liệu công việc, vì vậy bạn sẽ cần cài đặt Redis trên hệ thống của mình. Vì chúng được hỗ trợ bởi Redis, kiến trúc Hàng đợi của bạn có thể hoàn toàn phân tán và độc lập với nền tảng. Ví dụ, bạn có thể có một số <a href="techniques/queues#producers">nhà sản xuất</a> và <a href="techniques/queues#consumers">người tiêu dùng</a> và <a href="techniques/queues#event-listeners">người lắng nghe</a> Hàng đợi chạy trong Nest trên một (hoặc nhiều) nút, và các nhà sản xuất, người tiêu dùng và người lắng nghe khác chạy trên các nền tảng Node.js khác trên các nút mạng khác.

Chương này đề cập đến các gói `@nestjs/bullmq` và `@nestjs/bull`. Chúng tôi cũng khuyên bạn nên đọc tài liệu [BullMQ](https://docs.bullmq.io/) và [Bull](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md) để biết thêm thông tin nền và chi tiết triển khai cụ thể.

#### Cài đặt BullMQ (BullMQ installation)

Để bắt đầu sử dụng BullMQ, trước tiên chúng ta cài đặt các phụ thuộc cần thiết.

```bash
$ npm install --save @nestjs/bullmq bullmq
```

Sau khi quá trình cài đặt hoàn tất, chúng ta có thể nhập `BullModule` vào `AppModule` gốc.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

Phương thức `forRoot()` được sử dụng để đăng ký một đối tượng cấu hình gói `bullmq` sẽ được sử dụng bởi tất cả các hàng đợi được đăng ký trong ứng dụng (trừ khi được chỉ định khác). Để tham khảo, sau đây là một số thuộc tính trong đối tượng cấu hình:

- `connection: ConnectionOptions` - Tùy chọn để cấu hình kết nối Redis. Xem [Connections](https://docs.bullmq.io/guide/connections) để biết thêm thông tin. Tùy chọn.
- `prefix: string` - Tiền tố cho tất cả các khóa hàng đợi. Tùy chọn.
- `defaultJobOptions: JobOpts` - Tùy chọn để kiểm soát cài đặt mặc định cho các công việc mới. Xem [JobOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd) để biết thêm thông tin. Tùy chọn.
- `settings: AdvancedSettings` - Cài đặt cấu hình Hàng đợi nâng cao. Những cài đặt này thường không nên thay đổi. Xem [AdvancedSettings](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) để biết thêm thông tin. Tùy chọn.

Tất cả các tùy chọn đều là tùy chọn, cung cấp kiểm soát chi tiết về hành vi hàng đợi. Những tùy chọn này được truyền trực tiếp vào hàm tạo `Queue` của BullMQ. Đọc thêm về các tùy chọn này và các tùy chọn khác [tại đây](https://api.docs.bullmq.io/interfaces/v4.QueueOptions.html).

Để đăng ký một hàng đợi, nhập mô-đun động `BullModule.registerQueue()`, như sau:

```typescript
BullModule.registerQueue({
  name: 'audio',
});
```

> info **Gợi ý** Tạo nhiều hàng đợi bằng cách truyền nhiều đối tượng cấu hình được phân tách bằng dấu phẩy vào phương thức `registerQueue()`.

Phương thức `registerQueue()` được sử dụng để khởi tạo và/hoặc đăng ký hàng đợi. Hàng đợi được chia sẻ giữa các mô-đun và tiến trình kết nối với cùng một cơ sở dữ liệu Redis cơ bản với cùng thông tin đăng nhập. Mỗi hàng đợi là duy nhất bởi thuộc tính tên của nó. Tên hàng đợi được sử dụng làm cả mã thông báo tiêm (để tiêm hàng đợi vào các bộ điều khiển/nhà cung cấp) và là đối số cho các decorator để liên kết các lớp tiêu dùng và người lắng nghe với hàng đợi.

Bạn cũng có thể ghi đè một số tùy chọn đã được cấu hình trước cho một hàng đợi cụ thể, như sau:

```typescript
BullModule.registerQueue({
  name: 'audio',
  connection: {
    port: 6380,
  },
});
```

BullMQ cũng hỗ trợ mối quan hệ cha - con giữa các công việc. Chức năng này cho phép tạo ra các luồng trong đó các công việc là nút của cây có độ sâu tùy ý. Để đọc thêm về chúng, hãy kiểm tra [tại đây](https://docs.bullmq.io/guide/flows).

Để thêm một luồng, bạn có thể làm như sau:

```typescript
BullModule.registerFlowProducer({
  name: 'flowProducerName',
});
```

Vì công việc được lưu trữ trong Redis, mỗi khi một hàng đợi cụ thể được khởi tạo (ví dụ: khi một ứng dụng được khởi động/khởi động lại), nó cố gắng xử lý bất kỳ công việc cũ nào có thể tồn tại từ một phiên chưa hoàn thành trước đó.

Mỗi hàng đợi có thể có một hoặc nhiều nhà sản xuất, người tiêu dùng và người lắng nghe. Người tiêu dùng lấy công việc từ hàng đợi theo một thứ tự cụ thể: FIFO (mặc định), LIFO hoặc theo ưu tiên. Kiểm soát thứ tự xử lý hàng đợi được thảo luận <a href="techniques/queues#consumers">tại đây</a>.

<app-banner-enterprise></app-banner-enterprise>

#### Cấu hình có tên (Named configurations)

Nếu hàng đợi của bạn kết nối với nhiều phiên bản Redis khác nhau, bạn có thể sử dụng một kỹ thuật gọi là **cấu hình có tên**. Tính năng này cho phép bạn đăng ký một số cấu hình dưới các khóa được chỉ định, sau đó bạn có thể tham chiếu đến chúng trong các tùy chọn hàng đợi.

Ví dụ, giả sử bạn có một phiên bản Redis bổ sung (ngoài phiên bản mặc định) được sử dụng bởi một vài hàng đợi đăng ký trong ứng dụng của bạn, bạn có thể đăng ký cấu hình của nó như sau:

```typescript
BullModule.forRoot('alternative-config', {
  connection: {
    port: 6381,
  },
});
```

Trong ví dụ trên, `'alternative-config'` chỉ là một khóa cấu hình (nó có thể là bất kỳ chuỗi tùy ý nào).

Với điều này, bạn có thể chỉ đến cấu hình này trong đối tượng tùy chọn `registerQueue()`:

```typescript
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
```

#### Nhà sản xuất (Producers)

Nhà sản xuất công việc thêm công việc vào hàng đợi. Nhà sản xuất thường là các dịch vụ ứng dụng (các [provider](/providers) của Nest). Để thêm công việc vào hàng đợi, trước tiên hãy tiêm hàng đợi vào dịch vụ như sau:

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
```

> info **Gợi ý** Decorator `@InjectQueue()` xác định hàng đợi bằng tên của nó, như được cung cấp trong lệnh gọi phương thức `registerQueue()` (ví dụ: `'audio'`).

Bây giờ, thêm một công việc bằng cách gọi phương thức `add()` của hàng đợi, truyền vào một đối tượng công việc do người dùng định nghĩa. Công việc được biểu diễn dưới dạng các đối tượng JavaScript có thể serialize được (vì đó là cách chúng được lưu trữ trong cơ sở dữ liệu Redis). Hình dạng của công việc bạn truyền vào là tùy ý; hãy sử dụng nó để biểu diễn ngữ nghĩa của đối tượng công việc của bạn. Bạn cũng cần đặt tên cho nó. Điều này cho phép bạn tạo các <a href="techniques/queues#consumers">người tiêu dùng</a> chuyên biệt chỉ xử lý các công việc có tên nhất định.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

#### Tùy chọn công việc (Job options)

Công việc có thể có các tùy chọn bổ sung được liên kết với chúng. Truyền một đối tượng tùy chọn sau đối số `job` trong phương thức `Queue.add()`. Một số thuộc tính của đối tượng tùy chọn công việc là:

- `priority`: `number` - Giá trị ưu tiên tùy chọn. Phạm vi từ 1 (ưu tiên cao nhất) đến MAX_INT (ưu tiên thấp nhất). Lưu ý rằng việc sử dụng ưu tiên có ảnh hưởng nhẹ đến hiệu suất, vì vậy hãy sử dụng chúng một cách thận trọng.
- `delay`: `number` - Khoảng thời gian (mili giây) chờ đợi cho đến khi công việc này có thể được xử lý. Lưu ý rằng để có độ trễ chính xác, cả máy chủ và máy khách đều phải đồng bộ hóa đồng hồ của họ.
- `attempts`: `number` - Tổng số lần thử thực hiện công việc cho đến khi nó hoàn thành.
- `repeat`: `RepeatOpts` - Lặp lại công việc theo đặc tả cron. Xem [RepeatOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `backoff`: `number | BackoffOpts` - Cài đặt backoff cho các lần thử lại tự động nếu công việc thất bại. Xem [BackoffOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `lifo`: `boolean` - Nếu đúng, thêm công việc vào cuối bên phải của hàng đợi thay vì bên trái (mặc định là false).
- `jobId`: `number` | `string` - Ghi đè ID công việc - theo mặc định, ID công việc là một số nguyên duy nhất, nhưng bạn có thể sử dụng cài đặt này để ghi đè nó. Nếu bạn sử dụng tùy chọn này, bạn có trách nhiệm đảm bảo jobId là duy nhất. Nếu bạn cố gắng thêm một công việc với id đã tồn tại, nó sẽ không được thêm vào.
- `removeOnComplete`: `boolean | number` - Nếu đúng, xóa công việc khi nó hoàn thành thành công. Một số chỉ định số lượng công việc cần giữ lại. Hành vi mặc định là giữ công việc trong tập hợp đã hoàn thành.
- `removeOnFail`: `boolean | number` - Nếu đúng, xóa công việc khi nó thất bại sau tất cả các lần thử. Một số chỉ định số lượng công việc cần giữ lại. Hành vi mặc định là giữ công việc trong tập hợp thất bại.
- `stackTraceLimit`: `number` - Giới hạn số lượng dòng theo dõi ngăn xếp sẽ được ghi lại trong stacktrace.

Dưới đây là một vài ví dụ về việc tùy chỉnh công việc với các tùy chọn công việc.

Để trì hoãn việc bắt đầu một công việc, sử dụng thuộc tính cấu hình `delay`.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { delay: 3000 }, // trì hoãn 3 giây
);
```

Để thêm một công việc vào cuối bên phải của hàng đợi (xử lý công việc theo kiểu **LIFO** (Last In First Out)), đặt thuộc tính `lifo` của đối tượng cấu hình thành `true`.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

Để ưu tiên một công việc, sử dụng thuộc tính `priority`.

```typescript
const job = await this.audioQueue.add(
  'transcode',
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

Để xem danh sách đầy đủ các tùy chọn, hãy kiểm tra tài liệu API [tại đây](https://api.docs.bullmq.io/types/v4.JobsOptions.html) và [tại đây](https://api.docs.bullmq.io/interfaces/v4.BaseJobOptions.html).

#### Người tiêu dùng (Consumers)

Người tiêu dùng là một **lớp** định nghĩa các phương thức hoặc xử lý công việc được thêm vào hàng đợi, hoặc lắng nghe các sự kiện trên hàng đợi, hoặc cả hai. Khai báo một lớp người tiêu dùng bằng cách sử dụng decorator `@Processor()` như sau:

```typescript
import { Processor } from '@nestjs/bullmq';

@Processor('audio')
export class AudioConsumer {}
```

> info **Gợi ý** Người tiêu dùng phải được đăng ký như `providers` để gói `@nestjs/bullmq` có thể nhận biết chúng.

Trong đó đối số chuỗi của decorator (ví dụ: `'audio'`) là tên của hàng đợi được liên kết với các phương thức của lớp.

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    let progress = 0;
    for (i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 1;
      await job.progress(progress);
    }
    return {};
  }
}
```

Phương thức process được gọi bất cứ khi nào worker đang rảnh và có công việc cần xử lý trong hàng đợi. Phương thức xử lý này nhận đối tượng `job` làm đối số duy nhất. Giá trị được trả về bởi phương thức xử lý được lưu trữ trong đối tượng công việc và có thể được truy cập sau đó, ví dụ trong một trình lắng nghe cho sự kiện đã hoàn thành.

Đối tượng `Job` có nhiều phương thức cho phép bạn tương tác với trạng thái của chúng. Ví dụ, mã trên sử dụng phương thức `progress()` để cập nhật tiến độ của công việc. Xem [tại đây](https://api.docs.bullmq.io/classes/v4.Job.html) để biết tham chiếu API đầy đủ của đối tượng `Job`.

Trong phiên bản cũ hơn, Bull, bạn có thể chỉ định rằng một phương thức xử lý công việc sẽ chỉ xử lý các công việc của một loại nhất định (công việc có `tên` cụ thể) bằng cách truyền `tên` đó vào decorator `@Process()` như được hiển thị bên dưới.

> warning **Cảnh báo** Điều này không hoạt động với BullMQ, hãy tiếp tục đọc.

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

Hành vi này không được hỗ trợ trong BullMQ do sự nhầm lẫn mà nó tạo ra. Thay vào đó, bạn cần sử dụng các câu lệnh switch case để gọi các dịch vụ hoặc logic khác nhau cho mỗi tên công việc:

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    switch (job.name) {
      case 'transcode': {
        let progress = 0;
        for (i = 0; i < 100; i++) {
          await doSomething(job.data);
          progress += 1;
          await job.progress(progress);
        }
        return {};
      }
      case 'concatenate': {
        await doSomeLogic2();
        break;
      }
    }
  }
}
```

Điều này được đề cập trong phần [named processor](https://docs.bullmq.io/patterns/named-processor) của tài liệu BullMQ.

#### Người tiêu dùng phạm vi yêu cầu (Request-scoped consumers)

Khi một người tiêu dùng được đánh dấu là phạm vi yêu cầu (tìm hiểu thêm về phạm vi tiêm [tại đây](/fundamentals/injection-scopes#provider-scope)), một thể hiện mới của lớp sẽ được tạo ra dành riêng cho mỗi công việc. Thể hiện sẽ được thu gom rác sau khi công việc đã hoàn thành.

```typescript
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
```

Vì các lớp người tiêu dùng phạm vi yêu cầu được khởi tạo động và giới hạn cho một công việc duy nhất, bạn có thể tiêm một `JOB_REF` thông qua constructor bằng cách tiếp cận tiêu chuẩn.

```typescript
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
```

> info **Gợi ý** Token `JOB_REF` được import từ gói `@nestjs/bullmq`.

#### Người lắng nghe sự kiện (Event listeners)

Bull tạo ra một tập hợp các sự kiện hữu ích khi trạng thái hàng đợi và/hoặc công việc thay đổi. Nest cung cấp decorator `@OnQueueEvent(event)` cho phép đăng ký vào một tập hợp cốt lõi của các sự kiện tiêu chuẩn.

Người lắng nghe sự kiện phải được khai báo trong một lớp <a href="techniques/queues#consumers">người tiêu dùng</a> (nghĩa là trong một lớp được trang trí bằng decorator `@Processor()`). Để lắng nghe một sự kiện, sử dụng decorator `@OnQueueEvent(event)` với sự kiện bạn muốn xử lý. Ví dụ, để lắng nghe sự kiện được phát ra khi một công việc vào trạng thái hoạt động trong hàng đợi `audio`, sử dụng cấu trúc sau:

```typescript
import { Processor, Process, OnQueueEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('audio')
export class AudioConsumer {

  @OnQueueEvent('active')
  onActive(job: Job) {
    console.log(
      `Đang xử lý công việc ${job.id} loại ${job.name} với dữ liệu ${job.data}...`,
    );
  }
  // ...
```

Bạn có thể xem danh sách đầy đủ các sự kiện dưới dạng thuộc tính của QueueEventsListener [tại đây](https://api.docs.bullmq.io/interfaces/v4.QueueEventsListener.html).

#### Quản lý hàng đợi (Queue management)

Hàng đợi có một API cho phép bạn thực hiện các chức năng quản lý như tạm dừng và tiếp tục, truy xuất số lượng công việc trong các trạng thái khác nhau, và nhiều hơn nữa. Bạn có thể tìm thấy API hàng đợi đầy đủ [tại đây](https://api.docs.bullmq.io/classes/v4.Queue.html). Gọi bất kỳ phương thức nào trong số này trực tiếp trên đối tượng `Queue`, như được hiển thị bên dưới với các ví dụ tạm dừng/tiếp tục.

Tạm dừng một hàng đợi bằng cách gọi phương thức `pause()`. Một hàng đợi đã tạm dừng sẽ không xử lý các công việc mới cho đến khi được tiếp tục, nhưng các công việc đang được xử lý hiện tại sẽ tiếp tục cho đến khi chúng được hoàn thành.

```typescript
await audioQueue.pause();
```

Để tiếp tục một hàng đợi đã tạm dừng, sử dụng phương thức `resume()`, như sau:

```typescript
await audioQueue.resume();
```

#### Các quy trình riêng biệt (Separate processes)

Các trình xử lý công việc cũng có thể được chạy trong một quy trình riêng biệt (được fork) ([nguồn](https://docs.bullmq.io/guide/workers/sandboxed-processors)). Điều này có một số ưu điểm:

- Quy trình được sandbox nên nếu nó gặp sự cố, nó không ảnh hưởng đến worker.
- Bạn có thể chạy mã chặn mà không ảnh hưởng đến hàng đợi (các công việc sẽ không bị đình trệ).
- Sử dụng CPU đa lõi tốt hơn nhiều.
- Ít kết nối đến redis hơn.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { join } from 'path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(__dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
```

> warning **Cảnh báo** Xin lưu ý rằng vì hàm của bạn đang được thực thi trong một quy trình được fork, Dependency Injection (và IoC container) sẽ không có sẵn. Điều đó có nghĩa là hàm xử lý của bạn sẽ cần phải chứa (hoặc tạo) tất cả các thể hiện của các phụ thuộc bên ngoài mà nó cần.

#### Cấu hình bất đồng bộ (Async configuration)

Bạn có thể muốn truyền các tùy chọn `bullmq` một cách bất đồng bộ thay vì tĩnh. Trong trường hợp này, sử dụng phương thức `forRootAsync()` cung cấp một số cách để xử lý cấu hình bất đồng bộ. Tương tự, nếu bạn muốn truyền các tùy chọn hàng đợi một cách bất đồng bộ, hãy sử dụng phương thức `registerQueueAsync()`.

Một cách tiếp cận là sử dụng hàm factory:

```typescript
BullModule.forRootAsync({
  useFactory: () => ({
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

Factory của chúng ta hoạt động giống như bất kỳ [nhà cung cấp bất đồng bộ](https://docs.nestjs.com/fundamentals/async-providers) nào khác (ví dụ: nó có thể là `async` và nó có thể tiêm các phụ thuộc thông qua `inject`).

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    connection: {
      host: configService.get('QUEUE_HOST'),
      port: configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
```

Ngoài ra, bạn có thể sử dụng cú pháp `useClass`:

```typescript
BullModule.forRootAsync({
  useClass: BullConfigService,
});
```

Cấu trúc trên sẽ khởi tạo `BullConfigService` bên trong `BullModule` và sử dụng nó để cung cấp một đối tượng tùy chọn bằng cách gọi `createSharedConfiguration()`. Lưu ý rằng điều này có nghĩa là `BullConfigService` phải triển khai giao diện `SharedBullConfigurationFactory`, như được hiển thị dưới đây:

```typescript
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullModuleOptions {
    return {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

Để ngăn việc tạo `BullConfigService` bên trong `BullModule` và sử dụng một nhà cung cấp được nhập từ một module khác, bạn có thể sử dụng cú pháp `useExisting`.

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Cấu trúc này hoạt động giống như `useClass` với một sự khác biệt quan trọng - `BullModule` sẽ tìm kiếm các module đã nhập để sử dụng lại một `ConfigService` hiện có thay vì khởi tạo một cái mới.

#### Cài đặt Bull (Bull installation)

> warning **Lưu ý** Nếu bạn đã quyết định sử dụng BullMQ, hãy bỏ qua phần này và các chương tiếp theo.

Để bắt đầu sử dụng Bull, trước tiên chúng ta cài đặt các phụ thuộc cần thiết.

```bash
$ npm install --save @nestjs/bull bull
```

Khi quá trình cài đặt hoàn tất, chúng ta có thể nhập `BullModule` vào `AppModule` gốc.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
  ],
})
export class AppModule {}
```

Phương thức `forRoot()` được sử dụng để đăng ký một đối tượng cấu hình gói `bull` sẽ được sử dụng bởi tất cả các hàng đợi đã đăng ký trong ứng dụng (trừ khi được chỉ định khác). Một đối tượng cấu hình bao gồm các thuộc tính sau:

- `limiter: RateLimiter` - Tùy chọn để kiểm soát tốc độ xử lý công việc của hàng đợi. Xem [RateLimiter](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) để biết thêm thông tin. Tùy chọn.
- `redis: RedisOpts` - Tùy chọn để cấu hình kết nối Redis. Xem [RedisOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) để biết thêm thông tin. Tùy chọn.
- `prefix: string` - Tiền tố cho tất cả các khóa hàng đợi. Tùy chọn.
- `defaultJobOptions: JobOpts` - Tùy chọn để kiểm soát cài đặt mặc định cho các công việc mới. Xem [JobOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd) để biết thêm thông tin. Tùy chọn.
- `settings: AdvancedSettings` - Cài đặt cấu hình Hàng đợi nâng cao. Thông thường, những cài đặt này không nên thay đổi. Xem [AdvancedSettings](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue) để biết thêm thông tin. Tùy chọn.

Tất cả các tùy chọn đều là tùy chọn, cung cấp kiểm soát chi tiết về hành vi hàng đợi. Những tùy chọn này được truyền trực tiếp vào constructor `Queue` của Bull. Đọc thêm về các tùy chọn này [tại đây](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue).

Để đăng ký một hàng đợi, hãy nhập module động `BullModule.registerQueue()`, như sau:

```typescript
BullModule.registerQueue({
  name: 'audio',
});
```

> info **Gợi ý** Tạo nhiều hàng đợi bằng cách truyền nhiều đối tượng cấu hình được phân tách bằng dấu phẩy vào phương thức `registerQueue()`.

Phương thức `registerQueue()` được sử dụng để khởi tạo và/hoặc đăng ký hàng đợi. Các hàng đợi được chia sẻ giữa các module và quy trình kết nối với cùng một cơ sở dữ liệu Redis cơ bản với cùng thông tin đăng nhập. Mỗi hàng đợi là duy nhất theo thuộc tính tên của nó. Tên hàng đợi được sử dụng làm cả token tiêm (để tiêm hàng đợi vào các controller/provider) và làm đối số cho các decorator để liên kết các lớp người tiêu dùng và người lắng nghe với hàng đợi.

Bạn cũng có thể ghi đè một số tùy chọn đã được cấu hình trước cho một hàng đợi cụ thể, như sau:

```typescript
BullModule.registerQueue({
  name: 'audio',
  redis: {
    port: 6380,
  },
});
```

Vì các công việc được lưu trữ trong Redis, mỗi khi một hàng đợi có tên cụ thể được khởi tạo (ví dụ: khi một ứng dụng được khởi động/khởi động lại), nó cố gắng xử lý bất kỳ công việc cũ nào có thể tồn tại từ một phiên chưa hoàn thành trước đó.

Mỗi hàng đợi có thể có một hoặc nhiều nhà sản xuất, người tiêu dùng và người lắng nghe. Người tiêu dùng truy xuất công việc từ hàng đợi theo một thứ tự cụ thể: FIFO (mặc định), LIFO, hoặc theo ưu tiên. Kiểm soát thứ tự xử lý hàng đợi được thảo luận <a href="techniques/queues#consumers">tại đây</a>.

<app-banner-enterprise></app-banner-enterprise>

#### Cấu hình có tên (Named configurations)

Nếu các hàng đợi của bạn kết nối với nhiều phiên bản Redis, bạn có thể sử dụng một kỹ thuật gọi là **cấu hình có tên**. Tính năng này cho phép bạn đăng ký một số cấu hình dưới các khóa được chỉ định, mà sau đó bạn có thể tham chiếu trong các tùy chọn hàng đợi.

Ví dụ, giả sử bạn có một phiên bản Redis bổ sung (ngoài phiên bản mặc định) được sử dụng bởi một vài hàng đợi đã đăng ký trong ứng dụng của bạn, bạn có thể đăng ký cấu hình của nó như sau:

```typescript
BullModule.forRoot('alternative-config', {
  redis: {
    port: 6381,
  },
});
```

Trong ví dụ trên, `'alternative-config'` chỉ là một khóa cấu hình (nó có thể là bất kỳ chuỗi tùy ý nào).

Với điều này, bây giờ bạn có thể chỉ đến cấu hình này trong đối tượng tùy chọn `registerQueue()`:

```typescript
BullModule.registerQueue({
  configKey: 'alternative-config',
  name: 'video',
});
```

#### Nhà sản xuất (Producers)

Nhà sản xuất công việc thêm công việc vào hàng đợi. Nhà sản xuất thường là các dịch vụ ứng dụng (các [providers](/providers) của Nest). Để thêm công việc vào hàng đợi, trước tiên hãy tiêm hàng đợi vào dịch vụ như sau:

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private audioQueue: Queue) {}
}
```

> info **Gợi ý** Decorator `@InjectQueue()` xác định hàng đợi bằng tên của nó, như đã cung cấp trong lệnh gọi phương thức `registerQueue()` (ví dụ: `'audio'`).

Bây giờ, thêm một công việc bằng cách gọi phương thức `add()` của hàng đợi, truyền một đối tượng công việc do người dùng định nghĩa. Công việc được biểu diễn dưới dạng các đối tượng JavaScript có thể serializable (vì đó là cách chúng được lưu trữ trong cơ sở dữ liệu Redis). Hình dạng của công việc bạn truyền vào là tùy ý; sử dụng nó để biểu diễn ngữ nghĩa của đối tượng công việc của bạn.

```typescript
const job = await this.audioQueue.add({
  foo: 'bar',
});
```

#### Công việc có tên (Named jobs)

Công việc có thể có tên duy nhất. Điều này cho phép bạn tạo các <a href="techniques/queues#consumers">người tiêu dùng</a> chuyên biệt chỉ xử lý các công việc có tên nhất định.

```typescript
const job = await this.audioQueue.add('transcode', {
  foo: 'bar',
});
```

> Warning **Cảnh báo** Khi sử dụng công việc có tên, bạn phải tạo bộ xử lý cho mỗi tên duy nhất được thêm vào hàng đợi, nếu không hàng đợi sẽ phàn nàn rằng bạn đang thiếu bộ xử lý cho công việc đã cho. Xem <a href="techniques/queues#consumers">tại đây</a> để biết thêm thông tin về việc tiêu thụ các công việc có tên.

#### Tùy chọn công việc (Job options)

Công việc có thể có các tùy chọn bổ sung được liên kết với chúng. Truyền một đối tượng tùy chọn sau đối số `job` trong phương thức `Queue.add()`. Các thuộc tính tùy chọn công việc là:

- `priority`: `number` - Giá trị ưu tiên tùy chọn. Phạm vi từ 1 (ưu tiên cao nhất) đến MAX_INT (ưu tiên thấp nhất). Lưu ý rằng việc sử dụng các ưu tiên có ảnh hưởng nhỏ đến hiệu suất, vì vậy hãy sử dụng chúng một cách thận trọng.
- `delay`: `number` - Khoảng thời gian (mili giây) chờ đợi cho đến khi công việc này có thể được xử lý. Lưu ý rằng để có độ trễ chính xác, cả máy chủ và máy khách đều phải đồng bộ hóa đồng hồ của họ.
- `attempts`: `number` - Tổng số lần thử công việc cho đến khi nó hoàn thành.
- `repeat`: `RepeatOpts` - Lặp lại công việc theo đặc tả cron. Xem [RepeatOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `backoff`: `number | BackoffOpts` - Cài đặt backoff cho các lần thử lại tự động nếu công việc thất bại. Xem [BackoffOpts](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueadd).
- `lifo`: `boolean` - Nếu true, thêm công việc vào cuối bên phải của hàng đợi thay vì bên trái (mặc định là false).
- `timeout`: `number` - Số mili giây sau đó công việc sẽ thất bại với lỗi hết thời gian chờ.
- `jobId`: `number` | `string` - Ghi đè ID công việc - theo mặc định, ID công việc là một số nguyên duy nhất, nhưng bạn có thể sử dụng cài đặt này để ghi đè nó. Nếu bạn sử dụng tùy chọn này, bạn phải tự đảm bảo rằng jobId là duy nhất. Nếu bạn cố gắng thêm một công việc với id đã tồn tại, nó sẽ không được thêm vào.
- `removeOnComplete`: `boolean | number` - Nếu true, xóa công việc khi nó hoàn thành thành công. Một số chỉ định số lượng công việc cần giữ lại. Hành vi mặc định là giữ công việc trong tập hoàn thành.
- `removeOnFail`: `boolean | number` - Nếu true, xóa công việc khi nó thất bại sau tất cả các lần thử. Một số chỉ định số lượng công việc cần giữ lại. Hành vi mặc định là giữ công việc trong tập thất bại.
- `stackTraceLimit`: `number` - Giới hạn số lượng dòng theo dõi ngăn xếp sẽ được ghi lại trong stacktrace.

Dưới đây là một vài ví dụ về việc tùy chỉnh công việc với các tùy chọn công việc.

Để trì hoãn việc bắt đầu một công việc, sử dụng thuộc tính cấu hình `delay`.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { delay: 3000 }, // trì hoãn 3 giây
);
```

Để thêm một công việc vào cuối bên phải của hàng đợi (xử lý công việc theo **LIFO** (Last In First Out)), đặt thuộc tính `lifo` của đối tượng cấu hình thành `true`.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { lifo: true },
);
```

Để ưu tiên một công việc, sử dụng thuộc tính `priority`.

```typescript
const job = await this.audioQueue.add(
  {
    foo: 'bar',
  },
  { priority: 2 },
);
```

#### Người tiêu dùng (Consumers)

Người tiêu dùng là một **lớp** định nghĩa các phương thức hoặc xử lý các công việc được thêm vào hàng đợi, hoặc lắng nghe các sự kiện trên hàng đợi, hoặc cả hai. Khai báo một lớp người tiêu dùng bằng cách sử dụng decorator `@Processor()` như sau:

```typescript
import { Processor } from '@nestjs/bull';

@Processor('audio')
export class AudioConsumer {}
```

> info **Gợi ý** Người tiêu dùng phải được đăng ký là `providers` để gói `@nestjs/bull` có thể nhận biết chúng.

Trong đó đối số chuỗi của decorator (ví dụ: `'audio'`) là tên của hàng đợi được liên kết với các phương thức của lớp.

Trong một lớp người tiêu dùng, khai báo các trình xử lý công việc bằng cách trang trí các phương thức xử lý với decorator `@Process()`.

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {
  @Process()
  async transcode(job: Job<unknown>) {
    let progress = 0;
    for (let i = 0; i < 100; i++) {
      await doSomething(job.data);
      progress += 1;
      await job.progress(progress);
    }
    return {};
  }
}
```

Phương thức được trang trí (ví dụ: `transcode()`) được gọi bất cứ khi nào worker rảnh rỗi và có công việc cần xử lý trong hàng đợi. Phương thức xử lý này nhận đối tượng `job` làm đối số duy nhất. Giá trị được trả về bởi phương thức xử lý được lưu trữ trong đối tượng công việc và có thể được truy cập sau đó, ví dụ trong một listener cho sự kiện hoàn thành.

Các đối tượng `Job` có nhiều phương thức cho phép bạn tương tác với trạng thái của chúng. Ví dụ, mã trên sử dụng phương thức `progress()` để cập nhật tiến độ của công việc. Xem [tại đây](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#job) để biết tham chiếu API đối tượng `Job` đầy đủ.

Bạn có thể chỉ định rằng một phương thức xử lý công việc sẽ xử lý **chỉ** các công việc thuộc một loại nhất định (công việc có `name` cụ thể) bằng cách truyền `name` đó vào decorator `@Process()` như được hiển thị bên dưới. Bạn có thể có nhiều trình xử lý `@Process()` trong một lớp người tiêu dùng nhất định, tương ứng với mỗi loại công việc (`name`). Khi bạn sử dụng công việc có tên, hãy đảm bảo có một trình xử lý tương ứng với mỗi tên.

```typescript
@Process('transcode')
async transcode(job: Job<unknown>) { ... }
```

> warning **Cảnh báo** Khi định nghĩa nhiều người tiêu dùng cho cùng một hàng đợi, tùy chọn `concurrency` trong `@Process({{ '{' }} concurrency: 1 {{ '}' }})` sẽ không có hiệu lực. `concurrency` tối thiểu sẽ khớp với số lượng người tiêu dùng được định nghĩa. Điều này cũng áp dụng ngay cả khi các trình xử lý `@Process()` sử dụng `name` khác nhau để xử lý các công việc có tên.

#### Người tiêu dùng phạm vi yêu cầu (Request-scoped consumers)

Khi một người tiêu dùng được đánh dấu là phạm vi yêu cầu (tìm hiểu thêm về các phạm vi tiêm [tại đây](/fundamentals/injection-scopes#provider-scope)), một phiên bản mới của lớp sẽ được tạo riêng cho mỗi công việc. Phiên bản sẽ được thu gom rác sau khi công việc hoàn thành.

```typescript
@Processor({
  name: 'audio',
  scope: Scope.REQUEST,
})
```

Vì các lớp người tiêu dùng phạm vi yêu cầu được khởi tạo động và phạm vi cho một công việc duy nhất, bạn có thể tiêm một `JOB_REF` thông qua constructor bằng cách tiếp cận tiêu chuẩn.

```typescript
constructor(@Inject(JOB_REF) jobRef: Job) {
  console.log(jobRef);
}
```

> info **Gợi ý** Token `JOB_REF` được import từ gói `@nestjs/bull`.

#### Trình lắng nghe sự kiện (Event listeners)

Bull tạo ra một tập hợp các sự kiện hữu ích khi xảy ra thay đổi trạng thái của hàng đợi và/hoặc công việc. Nest cung cấp một tập hợp các decorator cho phép đăng ký một tập hợp cốt lõi của các sự kiện tiêu chuẩn. Chúng được xuất từ gói `@nestjs/bull`.

Trình lắng nghe sự kiện phải được khai báo trong một lớp <a href="techniques/queues#consumers">người tiêu dùng</a> (nghĩa là trong một lớp được trang trí bằng decorator `@Processor()`). Để lắng nghe một sự kiện, sử dụng một trong các decorator trong bảng bên dưới để khai báo một trình xử lý cho sự kiện đó. Ví dụ, để lắng nghe sự kiện được phát ra khi một công việc vào trạng thái hoạt động trong hàng đợi `audio`, sử dụng cấu trúc sau:

```typescript
import { Processor, Process, OnQueueActive } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('audio')
export class AudioConsumer {

  @OnQueueActive()
  onActive(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
    );
  }
  ...
```

Vì Bull hoạt động trong môi trường phân tán (đa nút), nó định nghĩa khái niệm về tính cục bộ của sự kiện. Khái niệm này nhận ra rằng các sự kiện có thể được kích hoạt hoàn toàn trong một quy trình đơn lẻ, hoặc trên các hàng đợi được chia sẻ từ các quy trình khác nhau. Một sự kiện **cục bộ** là sự kiện được tạo ra khi một hành động hoặc thay đổi trạng thái được kích hoạt trên một hàng đợi trong quy trình cục bộ. Nói cách khác, khi nhà sản xuất và người tiêu dùng sự kiện của bạn cục bộ đối với một quy trình duy nhất, tất cả các sự kiện xảy ra trên các hàng đợi đều là cục bộ.

Khi một hàng đợi được chia sẻ trên nhiều quy trình, chúng ta gặp khả năng có các sự kiện **toàn cục**. Để một trình lắng nghe trong một quy trình nhận được thông báo sự kiện được kích hoạt bởi một quy trình khác, nó phải đăng ký cho một sự kiện toàn cục.

Các trình xử lý sự kiện được gọi bất cứ khi nào sự kiện tương ứng của chúng được phát ra. Trình xử lý được gọi với chữ ký được hiển thị trong bảng bên dưới, cung cấp quyền truy cập vào thông tin liên quan đến sự kiện. Chúng ta thảo luận về một sự khác biệt chính giữa chữ ký trình xử lý sự kiện cục bộ và toàn cục bên dưới.

<table>
  <tr>
    <th>Trình lắng nghe sự kiện cục bộ</th>
    <th>Trình lắng nghe sự kiện toàn cục</th>
    <th>Chữ ký phương thức xử lý / Khi nào được kích hoạt</th>
  </tr>
  <tr>
    <td><code>@OnQueueError()</code></td><td><code>@OnGlobalQueueError()</code></td><td><code>handler(error: Error)</code> - Đã xảy ra lỗi. <code>error</code> chứa lỗi kích hoạt.</td>
  </tr>
  <tr>
    <td><code>@OnQueueWaiting()</code></td><td><code>@OnGlobalQueueWaiting()</code></td><td><code>handler(jobId: number | string)</code> - Một công việc đang chờ được xử lý ngay khi một worker rảnh rỗi. <code>jobId</code> chứa id cho công việc đã vào trạng thái này.</td>
  </tr>
  <tr>
    <td><code>@OnQueueActive()</code></td><td><code>@OnGlobalQueueActive()</code></td><td><code>handler(job: Job)</code> - Công việc <code>job</code> đã bắt đầu. </td>
  </tr>
  <tr>
    <td><code>@OnQueueStalled()</code></td><td><code>@OnGlobalQueueStalled()</code></td><td><code>handler(job: Job)</code> - Công việc <code>job</code> đã được đánh dấu là bị đình trệ. Điều này hữu ích để gỡ lỗi các worker công việc bị crash hoặc tạm dừng vòng lặp sự kiện.</td>
  </tr>
  <tr>
    <td><code>@OnQueueProgress()</code></td><td><code>@OnGlobalQueueProgress()</code></td><td><code>handler(job: Job, progress: number)</code> - Tiến độ của công việc <code>job</code> đã được cập nhật thành giá trị <code>progress</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueueCompleted()</code></td><td><code>@OnGlobalQueueCompleted()</code></td><td><code>handler(job: Job, result: any)</code> Công việc <code>job</code> đã hoàn thành thành công với kết quả <code>result</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueueFailed()</code></td><td><code>@OnGlobalQueueFailed()</code></td><td><code>handler(job: Job, err: Error)</code> Công việc <code>job</code> thất bại với lý do <code>err</code>.</td>
  </tr>
  <tr>
    <td><code>@OnQueuePaused()</code></td><td><code>@OnGlobalQueuePaused()</code></td><td><code>handler()</code> Hàng đợi đã bị tạm dừng.</td>
  </tr>
  <tr>
    <td><code>@OnQueueResumed()</code></td><td><code>@OnGlobalQueueResumed()</code></td><td><code>handler(job: Job)</code> Hàng đợi đã được tiếp tục.</td>
  </tr>
  <tr>
    <td><code>@OnQueueCleaned()</code></td><td><code>@OnGlobalQueueCleaned()</code></td><td><code>handler(jobs: Job[], type: string)</code> Các công việc cũ đã được dọn dẹp khỏi hàng đợi. <code>jobs</code> là một mảng các công việc đã được dọn dẹp, và <code>type</code> là loại công việc được dọn dẹp.</td>
  </tr>
  <tr>
    <td><code>@OnQueueDrained()</code></td><td><code>@OnGlobalQueueDrained()</code></td><td><code>handler()</code> Được phát ra bất cứ khi nào hàng đợi đã xử lý tất cả các công việc đang chờ (ngay cả khi có thể có một số công việc bị trì hoãn chưa được xử lý).</td>
  </tr>
  <tr>
    <td><code>@OnQueueRemoved()</code></td><td><code>@OnGlobalQueueRemoved()</code></td><td><code>handler(job: Job)</code> Công việc <code>job</code> đã được xóa thành công.</td>
  </tr>
</table>

Khi lắng nghe các sự kiện toàn cục, chữ ký phương thức có thể hơi khác so với phiên bản cục bộ tương ứng. Cụ thể, bất kỳ chữ ký phương thức nào nhận các đối tượng `job` trong phiên bản cục bộ, thay vào đó nhận một `jobId` (`number`) trong phiên bản toàn cục. Để có tham chiếu đến đối tượng `job` thực tế trong trường hợp như vậy, sử dụng phương thức `Queue#getJob`. Lệnh gọi này nên được đợi, và do đó trình xử lý nên được khai báo là `async`. Ví dụ:

```typescript
@OnGlobalQueueCompleted()
async onGlobalCompleted(jobId: number, result: any) {
  const job = await this.immediateQueue.getJob(jobId);
  console.log('(Global) on completed: job ', job.id, ' -> result: ', result);
}
```

> info **Gợi ý** Để truy cập đối tượng `Queue` (để thực hiện lệnh gọi `getJob()`), bạn tất nhiên phải tiêm nó. Ngoài ra, Queue phải được đăng ký trong module nơi bạn đang tiêm nó.

Ngoài các decorator lắng nghe sự kiện cụ thể, bạn cũng có thể sử dụng decorator `@OnQueueEvent()` chung kết hợp với các enum `BullQueueEvents` hoặc `BullQueueGlobalEvents`. Đọc thêm về các sự kiện [tại đây](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#events).

#### Quản lý hàng đợi (Queue management)

Hàng đợi có một API cho phép bạn thực hiện các chức năng quản lý như tạm dừng và tiếp tục, lấy số lượng công việc trong các trạng thái khác nhau, và một số chức năng khác. Bạn có thể tìm thấy API hàng đợi đầy đủ [tại đây](https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queue). Gọi bất kỳ phương thức nào trong số này trực tiếp trên đối tượng `Queue`, như được hiển thị bên dưới với các ví dụ tạm dừng/tiếp tục.

Tạm dừng một hàng đợi bằng lệnh gọi phương thức `pause()`. Một hàng đợi bị tạm dừng sẽ không xử lý các công việc mới cho đến khi được tiếp tục, nhưng các công việc hiện tại đang được xử lý sẽ tiếp tục cho đến khi chúng được hoàn thành.

```typescript
await audioQueue.pause();
```

Để tiếp tục một hàng đợi đã tạm dừng, sử dụng phương thức `resume()`, như sau:

```typescript
await audioQueue.resume();
```

#### Các quy trình riêng biệt (Separate processes)

Các trình xử lý công việc cũng có thể được chạy trong một quy trình riêng biệt (được phân nhánh) ([nguồn](https://github.com/OptimalBits/bull#separate-processes)). Điều này có một số ưu điểm:

- Quy trình được sandbox hóa nên nếu nó bị crash, nó không ảnh hưởng đến worker.
- Bạn có thể chạy mã chặn mà không ảnh hưởng đến hàng đợi (các công việc sẽ không bị đình trệ).
- Sử dụng CPU đa lõi tốt hơn nhiều.
- Ít kết nối đến redis hơn.

```ts
@@filename(app.module)
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audio',
      processors: [join(__dirname, 'processor.js')],
    }),
  ],
})
export class AppModule {}
```

Xin lưu ý rằng vì hàm của bạn đang được thực thi trong một quy trình được phân nhánh, Dependency Injection (và IoC container) sẽ không khả dụng. Điều đó có nghĩa là hàm xử lý của bạn sẽ cần phải chứa (hoặc tạo) tất cả các thể hiện của các phụ thuộc bên ngoài mà nó cần.

```ts
@@filename(processor)
import { Job, DoneCallback } from 'bull';

export default function (job: Job, cb: DoneCallback) {
  console.log(`[${process.pid}] ${JSON.stringify(job.data)}`);
  cb(null, 'It works');
}
```

#### Cấu hình không đồng bộ (Async configuration)

Bạn có thể muốn truyền các tùy chọn `bull` một cách không đồng bộ thay vì tĩnh. Trong trường hợp này, sử dụng phương thức `forRootAsync()` cung cấp một số cách để xử lý cấu hình không đồng bộ. Tương tự, nếu bạn muốn truyền các tùy chọn hàng đợi một cách không đồng bộ, hãy sử dụng phương thức `registerQueueAsync()`.

Một cách tiếp cận là sử dụng hàm factory:

```typescript
BullModule.forRootAsync({
  useFactory: () => ({
    redis: {
      host: 'localhost',
      port: 6379,
    },
  }),
});
```

Factory của chúng ta hoạt động giống như bất kỳ [nhà cung cấp không đồng bộ](https://docs.nestjs.com/fundamentals/async-providers) nào khác (ví dụ: nó có thể là `async` và nó có thể tiêm các phụ thuộc thông qua `inject`).

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    redis: {
      host: configService.get('QUEUE_HOST'),
      port: configService.get('QUEUE_PORT'),
    },
  }),
  inject: [ConfigService],
});
```

Ngoài ra, bạn có thể sử dụng cú pháp `useClass`:

```typescript
BullModule.forRootAsync({
  useClass: BullConfigService,
});
```

Cấu trúc trên sẽ khởi tạo `BullConfigService` bên trong `BullModule` và sử dụng nó để cung cấp một đối tượng tùy chọn bằng cách gọi `createSharedConfiguration()`. Lưu ý rằng điều này có nghĩa là `BullConfigService` phải triển khai giao diện `SharedBullConfigurationFactory`, như được hiển thị dưới đây:

```typescript
@Injectable()
class BullConfigService implements SharedBullConfigurationFactory {
  createSharedConfiguration(): BullModuleOptions {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
      },
    };
  }
}
```

Để ngăn chặn việc tạo `BullConfigService` bên trong `BullModule` và sử dụng một nhà cung cấp được import từ một module khác, bạn có thể sử dụng cú pháp `useExisting`.

```typescript
BullModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Cấu trúc này hoạt động giống như `useClass` với một sự khác biệt quan trọng - `BullModule` sẽ tìm kiếm các module đã import để tái sử dụng một `ConfigService` hiện có thay vì khởi tạo một cái mới.

#### Ví dụ (Example)

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/26-queues).
