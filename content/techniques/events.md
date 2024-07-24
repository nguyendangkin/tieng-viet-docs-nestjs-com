### Sự kiện (Events)

Gói [Event Emitter](https://www.npmjs.com/package/@nestjs/event-emitter) (`@nestjs/event-emitter`) cung cấp một triển khai observer đơn giản, cho phép bạn đăng ký và lắng nghe các sự kiện khác nhau xảy ra trong ứng dụng của bạn. Sự kiện là một cách tuyệt vời để tách rời các khía cạnh khác nhau của ứng dụng, vì một sự kiện duy nhất có thể có nhiều người lắng nghe không phụ thuộc vào nhau.

`EventEmitterModule` sử dụng nội bộ gói [eventemitter2](https://github.com/EventEmitter2/EventEmitter2).

#### Bắt đầu (Getting started)

Đầu tiên, cài đặt gói cần thiết:

```shell
$ npm i --save @nestjs/event-emitter
```

Sau khi cài đặt hoàn tất, import `EventEmitterModule` vào `AppModule` gốc và chạy phương thức tĩnh `forRoot()` như được hiển thị dưới đây:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot()
  ],
})
export class AppModule {}
```

Lệnh gọi `.forRoot()` khởi tạo event emitter và đăng ký bất kỳ người lắng nghe sự kiện khai báo nào tồn tại trong ứng dụng của bạn. Việc đăng ký xảy ra khi hook vòng đời `onApplicationBootstrap` xảy ra, đảm bảo rằng tất cả các module đã được tải và khai báo bất kỳ công việc đã lên lịch nào.

Để cấu hình instance `EventEmitter` cơ bản, truyền đối tượng cấu hình vào phương thức `.forRoot()`, như sau:

```typescript
EventEmitterModule.forRoot({
  // đặt giá trị này thành `true` để sử dụng wildcards
  wildcard: false,
  // dấu phân cách được sử dụng để phân đoạn namespaces
  delimiter: '.',
  // đặt giá trị này thành `true` nếu bạn muốn phát sự kiện newListener
  newListener: false,
  // đặt giá trị này thành `true` nếu bạn muốn phát sự kiện removeListener
  removeListener: false,
  // số lượng tối đa người lắng nghe có thể được gán cho một sự kiện
  maxListeners: 10,
  // hiển thị tên sự kiện trong thông báo rò rỉ bộ nhớ khi số lượng người lắng nghe vượt quá số lượng tối đa
  verboseMemoryLeak: false,
  // vô hiệu hóa việc ném uncaughtException nếu một sự kiện lỗi được phát ra và nó không có người lắng nghe
  ignoreErrors: false,
});
```

#### Gửi sự kiện (Dispatching Events)

Để gửi (tức là kích hoạt) một sự kiện, trước tiên hãy tiêm `EventEmitter2` sử dụng tiêm constructor tiêu chuẩn:

```typescript
constructor(private eventEmitter: EventEmitter2) {}
```

> info **Gợi ý** Import `EventEmitter2` từ gói `@nestjs/event-emitter`.

Sau đó sử dụng nó trong một lớp như sau:

```typescript
this.eventEmitter.emit(
  'order.created',
  new OrderCreatedEvent({
    orderId: 1,
    payload: {},
  }),
);
```

#### Lắng nghe sự kiện (Listening to Events)

Để khai báo một người lắng nghe sự kiện, trang trí một phương thức bằng decorator `@OnEvent()` trước định nghĩa phương thức chứa mã sẽ được thực thi, như sau:

```typescript
@OnEvent('order.created')
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // xử lý và xử lý sự kiện "OrderCreatedEvent"
}
```

> warning **Cảnh báo** Người đăng ký sự kiện không thể là phạm vi yêu cầu.

Đối số đầu tiên có thể là `string` hoặc `symbol` cho một event emitter đơn giản và `string | symbol | Array<string | symbol>` trong trường hợp của một wildcard emitter.

Đối số thứ hai (tùy chọn) là một đối tượng tùy chọn người lắng nghe như sau:

```typescript
export type OnEventOptions = OnOptions & {
  /**
   * Nếu "true", thêm (thay vì nối) người lắng nghe đã cho vào đầu mảng người lắng nghe.
   *
   * @see https://github.com/EventEmitter2/EventEmitter2#emitterprependlistenerevent-listener-options
   *
   * @default false
   */
  prependListener?: boolean;

  /**
   * Nếu "true", callback onEvent sẽ không ném lỗi trong khi xử lý sự kiện. Ngược lại, nếu "false" nó sẽ ném lỗi.
   *
   * @default true
   */
  suppressErrors?: boolean;
};
```

> info **Gợi ý** Đọc thêm về đối tượng tùy chọn `OnOptions` từ [`eventemitter2`](https://github.com/EventEmitter2/EventEmitter2#emitteronevent-listener-options-objectboolean).

```typescript
@OnEvent('order.created', { async: true })
handleOrderCreatedEvent(payload: OrderCreatedEvent) {
  // xử lý và xử lý sự kiện "OrderCreatedEvent"
}
```

Để sử dụng namespaces/wildcards, truyền tùy chọn `wildcard` vào phương thức `EventEmitterModule#forRoot()`. Khi namespaces/wildcards được bật, sự kiện có thể là chuỗi (`foo.bar`) được phân tách bởi một dấu phân cách hoặc mảng (`['foo', 'bar']`). Dấu phân cách cũng có thể cấu hình như một thuộc tính cấu hình (`delimiter`). Với tính năng namespaces được bật, bạn có thể đăng ký sự kiện sử dụng wildcard:

```typescript
@OnEvent('order.*')
handleOrderEvents(payload: OrderCreatedEvent | OrderRemovedEvent | OrderUpdatedEvent) {
  // xử lý và xử lý một sự kiện
}
```

Lưu ý rằng wildcard như vậy chỉ áp dụng cho một khối. Đối số `order.*` sẽ khớp, ví dụ, các sự kiện `order.created` và `order.shipped` nhưng không phải `order.delayed.out_of_stock`. Để lắng nghe các sự kiện như vậy, sử dụng mẫu `wildcard đa cấp` (tức là `**`), được mô tả trong tài liệu [EventEmitter2](https://github.com/EventEmitter2/EventEmitter2#multi-level-wildcards).

Với mẫu này, bạn có thể, ví dụ, tạo một người lắng nghe sự kiện bắt tất cả các sự kiện.

```typescript
@OnEvent('**')
handleEverything(payload: any) {
  // xử lý và xử lý một sự kiện
}
```

> info **Gợi ý** Lớp `EventEmitter2` cung cấp một số phương thức hữu ích để tương tác với sự kiện, như `waitFor` và `onAny`. Bạn có thể đọc thêm về chúng [tại đây](https://github.com/EventEmitter2/EventEmitter2).

#### Ví dụ (Example)

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/30-event-emitter).
