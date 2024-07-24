### Lập lịch công việc (Task Scheduling)

Lập lịch công việc cho phép bạn lên lịch cho mã tùy ý (phương thức/hàm) thực thi vào một ngày/giờ cố định, theo các khoảng thời gian lặp lại, hoặc một lần sau một khoảng thời gian xác định. Trong thế giới Linux, điều này thường được xử lý bởi các gói như [cron](https://en.wikipedia.org/wiki/Cron) ở cấp độ hệ điều hành. Đối với các ứng dụng Node.js, có một số gói mô phỏng chức năng giống cron. Nest cung cấp gói `@nestjs/schedule`, tích hợp với gói Node.js phổ biến [cron](https://github.com/kelektiv/node-cron). Chúng ta sẽ đề cập đến gói này trong chương hiện tại.

#### Cài đặt (Installation)

Để bắt đầu sử dụng, trước tiên chúng ta cài đặt các phụ thuộc cần thiết.

```bash
$ npm install --save @nestjs/schedule
```

Để kích hoạt lập lịch công việc, hãy import `ScheduleModule` vào `AppModule` gốc và chạy phương thức tĩnh `forRoot()` như được hiển thị dưới đây:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
})
export class AppModule {}
```

Lệnh gọi `.forRoot()` khởi tạo bộ lập lịch và đăng ký bất kỳ <a href="techniques/task-scheduling#declarative-cron-jobs">công việc cron</a>, <a href="techniques/task-scheduling#declarative-timeouts">thời gian chờ</a> và <a href="techniques/task-scheduling#declarative-intervals">khoảng thời gian</a> khai báo nào tồn tại trong ứng dụng của bạn. Việc đăng ký xảy ra khi hook vòng đời `onApplicationBootstrap` diễn ra, đảm bảo rằng tất cả các module đã được tải và khai báo bất kỳ công việc lập lịch nào.

#### Công việc cron khai báo (Declarative cron jobs)

Một công việc cron lên lịch cho một hàm tùy ý (gọi phương thức) chạy tự động. Các công việc cron có thể chạy:

- Một lần, vào một ngày/giờ cụ thể.
- Trên cơ sở định kỳ; các công việc định kỳ có thể chạy tại một thời điểm cụ thể trong một khoảng thời gian xác định (ví dụ: mỗi giờ một lần, mỗi tuần một lần, mỗi 5 phút một lần)

Khai báo một công việc cron với decorator `@Cron()` đứng trước định nghĩa phương thức chứa mã sẽ được thực thi, như sau:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron('45 * * * * *')
  handleCron() {
    this.logger.debug('Được gọi khi giây hiện tại là 45');
  }
}
```

Trong ví dụ này, phương thức `handleCron()` sẽ được gọi mỗi khi giây hiện tại là `45`. Nói cách khác, phương thức sẽ được chạy mỗi phút một lần, vào thời điểm 45 giây.

Decorator `@Cron()` hỗ trợ các [mẫu cron](http://crontab.org/) tiêu chuẩn sau:

- Dấu hoa thị (ví dụ: `*`)
- Phạm vi (ví dụ: `1-3,5`)
- Bước (ví dụ: `*/2`)

Trong ví dụ trên, chúng ta đã truyền `45 * * * * *` cho decorator. Bảng sau đây cho thấy cách mỗi vị trí trong chuỗi mẫu cron được diễn giải:

<pre class="language-javascript"><code class="language-javascript">
* * * * * *
| | | | | |
| | | | | ngày trong tuần
| | | | tháng
| | | ngày trong tháng
| | giờ
| phút
giây (tùy chọn)
</code></pre>

Một số mẫu cron ví dụ là:

<table>
  <tbody>
    <tr>
      <td><code>* * * * * *</code></td>
      <td>mỗi giây</td>
    </tr>
    <tr>
      <td><code>45 * * * * *</code></td>
      <td>mỗi phút, vào giây thứ 45</td>
    </tr>
    <tr>
      <td><code>0 10 * * * *</code></td>
      <td>mỗi giờ, vào đầu phút thứ 10</td>
    </tr>
    <tr>
      <td><code>0 */30 9-17 * * *</code></td>
      <td>mỗi 30 phút giữa 9 giờ sáng và 5 giờ chiều</td>
    </tr>
   <tr>
      <td><code>0 30 11 * * 1-5</code></td>
      <td>Thứ Hai đến Thứ Sáu lúc 11:30 sáng</td>
    </tr>
  </tbody>
</table>

Gói `@nestjs/schedule` cung cấp một enum tiện lợi với các mẫu cron thường được sử dụng. Bạn có thể sử dụng enum này như sau:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_30_SECONDS)
  handleCron() {
    this.logger.debug('Được gọi mỗi 30 giây');
  }
}
```

Trong ví dụ này, phương thức `handleCron()` sẽ được gọi mỗi `30` giây.

Ngoài ra, bạn có thể cung cấp một đối tượng `Date` JavaScript cho decorator `@Cron()`. Làm như vậy khiến công việc thực thi chính xác một lần, vào ngày được chỉ định.

> info **Gợi ý** Sử dụng phép tính ngày JavaScript để lên lịch công việc tương đối so với ngày hiện tại. Ví dụ, `@Cron(new Date(Date.now() + 10 * 1000))` để lên lịch một công việc chạy 10 giây sau khi ứng dụng khởi động.

Ngoài ra, bạn có thể cung cấp các tùy chọn bổ sung làm tham số thứ hai cho decorator `@Cron()`.

<table>
  <tbody>
    <tr>
      <td><code>name</code></td>
      <td>
        Hữu ích để truy cập và kiểm soát một công việc cron sau khi nó đã được khai báo.
      </td>
    </tr>
    <tr>
      <td><code>timeZone</code></td>
      <td>
        Chỉ định múi giờ cho việc thực thi. Điều này sẽ thay đổi thời gian thực tế tương ứng với múi giờ của bạn. Nếu múi giờ không hợp lệ, một lỗi sẽ được ném ra. Bạn có thể kiểm tra tất cả các múi giờ có sẵn tại trang web <a href="http://momentjs.com/timezone/">Moment Timezone</a>.
      </td>
    </tr>
    <tr>
      <td><code>utcOffset</code></td>
      <td>
        Điều này cho phép bạn chỉ định độ lệch của múi giờ của bạn thay vì sử dụng tham số <code>timeZone</code>.
      </td>
    </tr>
    <tr>
      <td><code>disabled</code></td>
      <td>
       Điều này chỉ ra liệu công việc có được thực thi hay không.
      </td>
    </tr>
  </tbody>
</table>

```typescript
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class NotificationService {
  @Cron('* * 0 * * *', {
    name: 'notifications',
    timeZone: 'Europe/Paris',
  })
  triggerNotifications() {}
}
```

Bạn có thể truy cập và kiểm soát một công việc cron sau khi nó đã được khai báo, hoặc tạo động một công việc cron (nơi mà mẫu cron của nó được định nghĩa tại thời điểm chạy) với <a href="/techniques/task-scheduling#dynamic-schedule-module-api">API Động</a>. Để truy cập một công việc cron khai báo thông qua API, bạn phải liên kết công việc với một tên bằng cách truyền thuộc tính `name` trong một đối tượng tùy chọn làm đối số thứ hai của decorator.

#### Khoảng thời gian khai báo (Declarative intervals)

Để khai báo rằng một phương thức nên chạy tại một khoảng thời gian (lặp lại) xác định, đặt tiền tố định nghĩa phương thức với decorator `@Interval()`. Truyền giá trị khoảng thời gian, dưới dạng số mili giây, cho decorator như được hiển thị dưới đây:

```typescript
@Interval(10000)
handleInterval() {
  this.logger.debug('Được gọi mỗi 10 giây');
}
```

> info **Gợi ý** Cơ chế này sử dụng hàm JavaScript `setInterval()` bên dưới. Bạn cũng có thể sử dụng một công việc cron để lên lịch các công việc định kỳ.

Nếu bạn muốn kiểm soát khoảng thời gian khai báo của mình từ bên ngoài lớp khai báo thông qua <a href="/techniques/task-scheduling#dynamic-schedule-module-api">API Động</a>, hãy liên kết khoảng thời gian với một tên bằng cách sử dụng cấu trúc sau:

```typescript
@Interval('notifications', 2500)
handleInterval() {}
```

<a href="techniques/task-scheduling#dynamic-intervals">API Động</a> cũng cho phép **tạo** các khoảng thời gian động, trong đó các thuộc tính của khoảng thời gian được định nghĩa tại thời điểm chạy, và **liệt kê và xóa** chúng.

<app-banner-enterprise></app-banner-enterprise>

#### Thời gian chờ khai báo (Declarative timeouts)

Để khai báo rằng một phương thức nên chạy (một lần) tại một thời gian chờ xác định, đặt tiền tố định nghĩa phương thức với decorator `@Timeout()`. Truyền độ lệch thời gian tương đối (tính bằng mili giây), từ khi khởi động ứng dụng, cho decorator như được hiển thị dưới đây:

```typescript
@Timeout(5000)
handleTimeout() {
  this.logger.debug('Được gọi một lần sau 5 giây');
}
```

> info **Gợi ý** Cơ chế này sử dụng hàm JavaScript `setTimeout()` bên dưới.

Nếu bạn muốn kiểm soát thời gian chờ khai báo của mình từ bên ngoài lớp khai báo thông qua <a href="/techniques/task-scheduling#dynamic-schedule-module-api">API Động</a>, hãy liên kết thời gian chờ với một tên bằng cách sử dụng cấu trúc sau:

```typescript
@Timeout('notifications', 2500)
handleTimeout() {}
```

<a href="techniques/task-scheduling#dynamic-timeouts">API Động</a> cũng cho phép **tạo** các thời gian chờ động, trong đó các thuộc tính của thời gian chờ được định nghĩa tại thời điểm chạy, và **liệt kê và xóa** chúng.

#### API module lập lịch động (Dynamic schedule module API)

Module `@nestjs/schedule` cung cấp một API động cho phép quản lý <a href="techniques/task-scheduling#declarative-cron-jobs">công việc cron</a>, <a href="techniques/task-scheduling#declarative-timeouts">thời gian chờ</a> và <a href="techniques/task-scheduling#declarative-intervals">khoảng thời gian</a> khai báo. API cũng cho phép tạo và quản lý các công việc cron, thời gian chờ và khoảng thời gian **động**, trong đó các thuộc tính được định nghĩa tại thời điểm chạy.

#### Công việc cron động (Dynamic cron jobs)

Lấy tham chiếu đến một thể hiện `CronJob` theo tên từ bất kỳ đâu trong mã của bạn bằng cách sử dụng API `SchedulerRegistry`. Đầu tiên, tiêm `SchedulerRegistry` sử dụng phương pháp tiêm constructor tiêu chuẩn:

```typescript
constructor(private schedulerRegistry: SchedulerRegistry) {}
```

> info **Gợi ý** Import `SchedulerRegistry` từ gói `@nestjs/schedule`.

Sau đó sử dụng nó trong một lớp như sau. Giả sử một công việc cron được tạo với khai báo sau:

```typescript
@Cron('* * 8 * * *', {
  name: 'notifications',
})
triggerNotifications() {}
```

Truy cập công việc này bằng cách sau:

```typescript
const job = this.schedulerRegistry.getCronJob('notifications');

job.stop();
console.log(job.lastDate());
```

Phương thức `getCronJob()` trả về công việc cron được đặt tên. Đối tượng `CronJob` trả về có các phương thức sau:

- `stop()` - dừng một công việc đã được lên lịch chạy.
- `start()` - khởi động lại một công việc đã bị dừng.
- `setTime(time: CronTime)` - dừng một công việc, đặt thời gian mới cho nó, và sau đó bắt đầu lại
- `lastDate()` - trả về một biểu diễn `DateTime` của ngày mà lần thực thi cuối cùng của công việc đã xảy ra.
- `nextDate()` - trả về một biểu diễn `DateTime` của ngày khi lần thực thi tiếp theo của công việc được lên lịch.
- `nextDates(count: number)` - Cung cấp một mảng (kích thước `count`) các biểu diễn `DateTime` cho tập hợp các ngày tiếp theo sẽ kích hoạt thực thi công việc. `count` mặc định là 0, trả về một mảng rỗng.

> info **Gợi ý** Sử dụng `toJSDate()` trên các đối tượng `DateTime` để hiển thị chúng dưới dạng Date JavaScript tương đương với DateTime này.

**Tạo** một công việc cron mới động bằng cách sử dụng phương thức `SchedulerRegistry#addCronJob`, như sau:

```typescript
addCronJob(name: string, seconds: string) {
  const job = new CronJob(`${seconds} * * * * *`, () => {
    this.logger.warn(`thời gian (${seconds}) cho công việc ${name} chạy!`);
  });

  this.schedulerRegistry.addCronJob(name, job);
  job.start();

  this.logger.warn(
    `công việc ${name} đã được thêm cho mỗi phút tại giây ${seconds}!`,
  );
}
```

Trong mã này, chúng ta sử dụng đối tượng `CronJob` từ gói `cron` để tạo công việc cron. Constructor của `CronJob` nhận một mẫu cron (giống như <a href="techniques/task-scheduling#declarative-cron-jobs">decorator</a> `@Cron()`) làm đối số đầu tiên, và một callback được thực thi khi bộ hẹn giờ cron kích hoạt làm đối số thứ hai. Phương thức `SchedulerRegistry#addCronJob` nhận hai đối số: một tên cho `CronJob`, và chính đối tượng `CronJob`.

> warning **Cảnh báo** Hãy nhớ tiêm `SchedulerRegistry` trước khi truy cập nó. Import `CronJob` từ gói `cron`.

**Xóa** một công việc cron được đặt tên bằng cách sử dụng phương thức `SchedulerRegistry#deleteCronJob`, như sau:

```typescript
deleteCron(name: string) {
  this.schedulerRegistry.deleteCronJob(name);
  this.logger.warn(`công việc ${name} đã bị xóa!`);
}
```

**Liệt kê** tất cả các công việc cron bằng cách sử dụng phương thức `SchedulerRegistry#getCronJobs` như sau:

```typescript
getCrons() {
  const jobs = this.schedulerRegistry.getCronJobs();
  jobs.forEach((value, key, map) => {
    let next;
    try {
      next = value.nextDate().toJSDate();
    } catch (e) {
      next = 'lỗi: ngày kích hoạt tiếp theo đã qua!';
    }
    this.logger.log(`công việc: ${key} -> tiếp theo: ${next}`);
  });
}
```

Phương thức `getCronJobs()` trả về một `map`. Trong mã này, chúng ta lặp qua map và cố gắng truy cập phương thức `nextDate()` của mỗi `CronJob`. Trong API `CronJob`, nếu một công việc đã kích hoạt và không có ngày kích hoạt trong tương lai, nó sẽ ném ra một ngoại lệ.

#### Khoảng thời gian động (Dynamic intervals)

Lấy tham chiếu đến một khoảng thời gian với phương thức `SchedulerRegistry#getInterval`. Như trên, tiêm `SchedulerRegistry` sử dụng phương pháp tiêm constructor tiêu chuẩn:

```typescript
constructor(private schedulerRegistry: SchedulerRegistry) {}
```

Và sử dụng nó như sau:

```typescript
const interval = this.schedulerRegistry.getInterval('notifications');
clearInterval(interval);
```

**Tạo** một khoảng thời gian mới động bằng cách sử dụng phương thức `SchedulerRegistry#addInterval`, như sau:

```typescript
addInterval(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(`Khoảng thời gian ${name} đang thực thi tại thời điểm (${milliseconds})!`);
  };

  const interval = setInterval(callback, milliseconds);
  this.schedulerRegistry.addInterval(name, interval);
}
```

Trong mã này, chúng ta tạo một khoảng thời gian JavaScript tiêu chuẩn, sau đó truyền nó vào phương thức `SchedulerRegistry#addInterval`.
Phương thức đó nhận hai đối số: một tên cho khoảng thời gian, và chính khoảng thời gian đó.

**Xóa** một khoảng thời gian được đặt tên bằng cách sử dụng phương thức `SchedulerRegistry#deleteInterval`, như sau:

```typescript
deleteInterval(name: string) {
  this.schedulerRegistry.deleteInterval(name);
  this.logger.warn(`Khoảng thời gian ${name} đã bị xóa!`);
}
```

**Liệt kê** tất cả các khoảng thời gian bằng cách sử dụng phương thức `SchedulerRegistry#getIntervals` như sau:

```typescript
getIntervals() {
  const intervals = this.schedulerRegistry.getIntervals();
  intervals.forEach(key => this.logger.log(`Khoảng thời gian: ${key}`));
}
```

#### Thời gian chờ động (Dynamic timeouts)

Lấy tham chiếu đến một thời gian chờ với phương thức `SchedulerRegistry#getTimeout`. Như trên, tiêm `SchedulerRegistry` sử dụng phương pháp tiêm constructor tiêu chuẩn:

```typescript
constructor(private readonly schedulerRegistry: SchedulerRegistry) {}
```

Và sử dụng nó như sau:

```typescript
const timeout = this.schedulerRegistry.getTimeout('notifications');
clearTimeout(timeout);
```

**Tạo** một thời gian chờ mới động bằng cách sử dụng phương thức `SchedulerRegistry#addTimeout`, như sau:

```typescript
addTimeout(name: string, milliseconds: number) {
  const callback = () => {
    this.logger.warn(`Thời gian chờ ${name} đang thực thi sau (${milliseconds})!`);
  };

  const timeout = setTimeout(callback, milliseconds);
  this.schedulerRegistry.addTimeout(name, timeout);
}
```

Trong mã này, chúng ta tạo một thời gian chờ JavaScript tiêu chuẩn, sau đó truyền nó vào phương thức `SchedulerRegistry#addTimeout`.
Phương thức đó nhận hai đối số: một tên cho thời gian chờ, và chính thời gian chờ đó.

**Xóa** một thời gian chờ được đặt tên bằng cách sử dụng phương thức `SchedulerRegistry#deleteTimeout`, như sau:

```typescript
deleteTimeout(name: string) {
  this.schedulerRegistry.deleteTimeout(name);
  this.logger.warn(`Thời gian chờ ${name} đã bị xóa!`);
}
```

**Liệt kê** tất cả các thời gian chờ bằng cách sử dụng phương thức `SchedulerRegistry#getTimeouts` như sau:

```typescript
getTimeouts() {
  const timeouts = this.schedulerRegistry.getTimeouts();
  timeouts.forEach(key => this.logger.log(`Thời gian chờ: ${key}`));
}
```

#### Ví dụ (Example)

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/27-scheduling).
