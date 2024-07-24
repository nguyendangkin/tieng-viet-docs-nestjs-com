### CORS

Chia sẻ tài nguyên giữa các nguồn gốc khác nhau (Cross-origin resource sharing - CORS) là một cơ chế cho phép yêu cầu tài nguyên từ một tên miền khác. Bên dưới, Nest sử dụng gói [cors](https://github.com/expressjs/cors) của Express hoặc [@fastify/cors](https://github.com/fastify/fastify-cors) của Fastify tùy thuộc vào nền tảng cơ bản. Các gói này cung cấp nhiều tùy chọn mà bạn có thể tùy chỉnh dựa trên yêu cầu của mình.

#### Bắt đầu (Getting started)

Để bật CORS, gọi phương thức `enableCors()` trên đối tượng ứng dụng Nest.

```typescript
const app = await NestFactory.create(AppModule);
app.enableCors();
await app.listen(3000);
```

Phương thức `enableCors()` nhận một đối số là đối tượng cấu hình tùy chọn. Các thuộc tính có sẵn của đối tượng này được mô tả trong tài liệu chính thức về [CORS](https://github.com/expressjs/cors#configuration-options). Một cách khác là truyền vào một [hàm callback](https://github.com/expressjs/cors#configuring-cors-asynchronously) cho phép bạn định nghĩa đối tượng cấu hình bất đồng bộ dựa trên yêu cầu (ngay lập tức).

Ngoài ra, bật CORS thông qua đối tượng tùy chọn của phương thức `create()`. Đặt thuộc tính `cors` thành `true` để bật CORS với cài đặt mặc định.
Hoặc, truyền một [đối tượng cấu hình CORS](https://github.com/expressjs/cors#configuration-options) hoặc [hàm callback](https://github.com/expressjs/cors#configuring-cors-asynchronously) làm giá trị thuộc tính `cors` để tùy chỉnh hành vi của nó.

```typescript
const app = await NestFactory.create(AppModule, { cors: true });
await app.listen(3000);
```
