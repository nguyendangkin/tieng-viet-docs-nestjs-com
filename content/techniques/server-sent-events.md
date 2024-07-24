### Sự kiện gửi từ máy chủ (Server-Sent Events)

Server-Sent Events (SSE) là một công nghệ đẩy từ máy chủ cho phép máy khách nhận các cập nhật tự động từ máy chủ thông qua kết nối HTTP. Mỗi thông báo được gửi dưới dạng một khối văn bản kết thúc bằng một cặp dòng mới (tìm hiểu thêm [tại đây](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)).

#### Cách sử dụng (Usage)

Để kích hoạt sự kiện Server-Sent trên một tuyến đường (tuyến đường đăng ký trong **lớp điều khiển**), chú thích trình xử lý phương thức bằng decorator `@Sse()`.

```typescript
@Sse('sse')
sse(): Observable<MessageEvent> {
  return interval(1000).pipe(map((_) => ({ data: { hello: 'world' } })));
}
```

> info **Gợi ý** Decorator `@Sse()` và giao diện `MessageEvent` được import từ `@nestjs/common`, trong khi `Observable`, `interval`, và `map` được import từ gói `rxjs`.

> warning **Cảnh báo** Các tuyến đường Server-Sent Events phải trả về một luồng `Observable`.

Trong ví dụ trên, chúng ta đã định nghĩa một tuyến đường có tên `sse` cho phép chúng ta truyền các cập nhật thời gian thực. Các sự kiện này có thể được lắng nghe bằng cách sử dụng [API EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource).

Phương thức `sse` trả về một `Observable` phát ra nhiều `MessageEvent` (trong ví dụ này, nó phát ra một `MessageEvent` mới mỗi giây). Đối tượng `MessageEvent` nên tuân thủ giao diện sau để phù hợp với đặc tả:

```typescript
export interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}
```

Với cấu hình này, chúng ta có thể tạo một thể hiện của lớp `EventSource` trong ứng dụng phía máy khách, truyền tuyến đường `/sse` (phù hợp với điểm cuối mà chúng ta đã truyền vào decorator `@Sse()` ở trên) làm đối số constructor.

Thể hiện `EventSource` mở một kết nối liên tục đến máy chủ HTTP, gửi các sự kiện ở định dạng `text/event-stream`. Kết nối vẫn mở cho đến khi bị đóng bằng cách gọi `EventSource.close()`.

Khi kết nối được mở, các tin nhắn đến từ máy chủ được gửi đến mã của bạn dưới dạng các sự kiện. Nếu có trường sự kiện trong tin nhắn đến, sự kiện được kích hoạt giống như giá trị trường sự kiện. Nếu không có trường sự kiện nào, thì một sự kiện `message` chung sẽ được kích hoạt ([nguồn](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)).

```javascript
const eventSource = new EventSource('/sse');
eventSource.onmessage = ({ data }) => {
  console.log('New message', JSON.parse(data));
};
```

#### Ví dụ (Example)

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/28-sse).
