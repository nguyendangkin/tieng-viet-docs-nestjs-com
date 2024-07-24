### Phiên (Session)

**Phiên HTTP** cung cấp một cách để lưu trữ thông tin về người dùng qua nhiều yêu cầu, điều này đặc biệt hữu ích cho các ứng dụng [MVC](/techniques/mvc).

#### Sử dụng với Express (mặc định)

Đầu tiên, cài đặt [gói cần thiết](https://github.com/expressjs/session) (và các kiểu của nó cho người dùng TypeScript):

```shell
$ npm i express-session
$ npm i -D @types/express-session
```

Sau khi cài đặt hoàn tất, áp dụng middleware `express-session` như một middleware toàn cục (ví dụ: trong tệp `main.ts` của bạn).

```typescript
import * as session from 'express-session';
// ở đâu đó trong tệp khởi tạo của bạn
app.use(
  session({
    secret: 'my-secret',
    resave: false,
    saveUninitialized: false,
  }),
);
```

> warning **Lưu ý** Bộ lưu trữ phiên phía máy chủ mặc định được thiết kế có chủ đích không dành cho môi trường sản xuất. Nó sẽ rò rỉ bộ nhớ trong hầu hết các điều kiện, không mở rộng được quá một quy trình duy nhất và chỉ dành cho việc gỡ lỗi và phát triển. Đọc thêm trong [kho lưu trữ chính thức](https://github.com/expressjs/session).

`secret` được sử dụng để ký cookie ID phiên. Đây có thể là một chuỗi cho một bí mật duy nhất hoặc một mảng của nhiều bí mật. Nếu một mảng các bí mật được cung cấp, chỉ phần tử đầu tiên sẽ được sử dụng để ký cookie ID phiên, trong khi tất cả các phần tử sẽ được xem xét khi xác minh chữ ký trong các yêu cầu. Bản thân bí mật không nên dễ dàng được phân tích bởi con người và tốt nhất là một tập hợp ngẫu nhiên các ký tự.

Bật tùy chọn `resave` buộc phiên phải được lưu trở lại vào kho lưu trữ phiên, ngay cả khi phiên không bao giờ bị sửa đổi trong quá trình yêu cầu. Giá trị mặc định là `true`, nhưng việc sử dụng mặc định đã bị lỗi thời, vì mặc định sẽ thay đổi trong tương lai.

Tương tự, bật tùy chọn `saveUninitialized` Buộc một phiên "chưa được khởi tạo" được lưu vào kho. Một phiên chưa được khởi tạo khi nó mới nhưng không được sửa đổi. Chọn `false` hữu ích để triển khai các phiên đăng nhập, giảm sử dụng lưu trữ máy chủ hoặc tuân thủ các luật yêu cầu sự cho phép trước khi đặt cookie. Chọn `false` cũng sẽ giúp với các điều kiện chạy đua khi một khách hàng thực hiện nhiều yêu cầu song song mà không có phiên ([nguồn](https://github.com/expressjs/session#saveuninitialized)).

Bạn có thể truyền một số tùy chọn khác cho middleware `session`, đọc thêm về chúng trong [tài liệu API](https://github.com/expressjs/session#options).

> info **Gợi ý** Xin lưu ý rằng `secure: true` là một tùy chọn được khuyến nghị. Tuy nhiên, nó yêu cầu một trang web có https, tức là HTTPS là cần thiết cho các cookie bảo mật. Nếu secure được đặt và bạn truy cập trang web của mình qua HTTP, cookie sẽ không được đặt. Nếu bạn có node.js của mình phía sau một proxy và đang sử dụng `secure: true`, bạn cần đặt `"trust proxy"` trong express.

Với điều này, bạn có thể đặt và đọc các giá trị phiên từ bên trong các trình xử lý tuyến đường, như sau:

```typescript
@Get()
findAll(@Req() request: Request) {
  request.session.visits = request.session.visits ? request.session.visits + 1 : 1;
}
```

> info **Gợi ý** Decorator `@Req()` được import từ `@nestjs/common`, trong khi `Request` từ gói `express`.

Ngoài ra, bạn có thể sử dụng decorator `@Session()` để trích xuất một đối tượng phiên từ yêu cầu, như sau:

```typescript
@Get()
findAll(@Session() session: Record<string, any>) {
  session.visits = session.visits ? session.visits + 1 : 1;
}
```

> info **Gợi ý** Decorator `@Session()` được import từ gói `@nestjs/common`.

#### Sử dụng với Fastify

Đầu tiên, cài đặt gói cần thiết:

```shell
$ npm i @fastify/secure-session
```

Sau khi cài đặt hoàn tất, đăng ký plugin `fastify-secure-session`:

```typescript
import secureSession from '@fastify/secure-session';

// ở đâu đó trong tệp khởi tạo của bạn
const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
await app.register(secureSession, {
  secret: 'averylogphrasebiggerthanthirtytwochars',
  salt: 'mq9hDxBVDbspDR6n',
});
```

> info **Gợi ý** Bạn cũng có thể tạo trước một khóa ([xem hướng dẫn](https://github.com/fastify/fastify-secure-session)) hoặc sử dụng [xoay vòng khóa](https://github.com/fastify/fastify-secure-session#using-keys-with-key-rotation).

Đọc thêm về các tùy chọn có sẵn trong [kho lưu trữ chính thức](https://github.com/fastify/fastify-secure-session).

Với điều này, bạn có thể đặt và đọc các giá trị phiên từ bên trong các trình xử lý tuyến đường, như sau:

```typescript
@Get()
findAll(@Req() request: FastifyRequest) {
  const visits = request.session.get('visits');
  request.session.set('visits', visits ? visits + 1 : 1);
}
```

Ngoài ra, bạn có thể sử dụng decorator `@Session()` để trích xuất một đối tượng phiên từ yêu cầu, như sau:

```typescript
@Get()
findAll(@Session() session: secureSession.Session) {
  const visits = session.get('visits');
  session.set('visits', visits ? visits + 1 : 1);
}
```

> info **Gợi ý** Decorator `@Session()` được import từ `@nestjs/common`, trong khi `secureSession.Session` từ gói `@fastify/secure-session` (câu lệnh import: `import * as secureSession from '@fastify/secure-session'`).
