### Bảo vệ CSRF (CSRF Protection)

Giả mạo yêu cầu trên nhiều trang (Cross-site request forgery - còn được gọi là CSRF hoặc XSRF) là một loại khai thác độc hại của trang web, trong đó các lệnh **không được ủy quyền** được truyền từ một người dùng mà ứng dụng web tin tưởng. Để giảm thiểu loại tấn công này, bạn có thể sử dụng gói [csurf](https://github.com/expressjs/csurf).

#### Sử dụng với Express (mặc định)

Bắt đầu bằng cách cài đặt gói cần thiết:

```bash
$ npm i --save csurf
```

> warning **Cảnh báo (Warning)** Gói này đã bị lỗi thời, hãy tham khảo [tài liệu `csurf`](https://github.com/expressjs/csurf#csurf) để biết thêm thông tin.

> warning **Cảnh báo (Warning)** Như đã giải thích trong [tài liệu `csurf`](https://github.com/expressjs/csurf#csurf), middleware này yêu cầu middleware session hoặc `cookie-parser` phải được khởi tạo trước. Vui lòng xem tài liệu đó để biết thêm hướng dẫn.

Sau khi cài đặt hoàn tất, áp dụng middleware `csurf` như một middleware toàn cục.

```typescript
import * as csurf from 'csurf';
// ...
// ở đâu đó trong file khởi tạo của bạn
app.use(csurf());
```

#### Sử dụng với Fastify

Bắt đầu bằng cách cài đặt gói cần thiết:

```bash
$ npm i --save @fastify/csrf-protection
```

Sau khi cài đặt hoàn tất, đăng ký plugin `@fastify/csrf-protection`, như sau:

```typescript
import fastifyCsrf from '@fastify/csrf-protection';
// ...
// ở đâu đó trong file khởi tạo của bạn sau khi đăng ký một plugin lưu trữ
await app.register(fastifyCsrf);
```

> warning **Cảnh báo (Warning)** Như đã giải thích trong tài liệu `@fastify/csrf-protection` [tại đây](https://github.com/fastify/csrf-protection#usage), plugin này yêu cầu một plugin lưu trữ phải được khởi tạo trước. Vui lòng xem tài liệu đó để biết thêm hướng dẫn.
