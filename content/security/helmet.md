### Mũ bảo hiểm (Helmet)

[Helmet](https://github.com/helmetjs/helmet) có thể giúp bảo vệ ứng dụng của bạn khỏi một số lỗ hổng bảo mật web đã biết bằng cách đặt các tiêu đề HTTP một cách thích hợp. Nhìn chung, Helmet chỉ là một tập hợp các hàm middleware nhỏ hơn để thiết lập các tiêu đề HTTP liên quan đến bảo mật (đọc thêm [tại đây](https://github.com/helmetjs/helmet#how-it-works)).

> info **Gợi ý (Hint)** Lưu ý rằng việc áp dụng `helmet` như một middleware toàn cục hoặc đăng ký nó phải được thực hiện trước các lệnh gọi `app.use()` khác hoặc các hàm thiết lập có thể gọi `app.use()`. Điều này là do cách hoạt động của nền tảng cơ bản (tức là Express hoặc Fastify), trong đó thứ tự định nghĩa middleware/routes rất quan trọng. Nếu bạn sử dụng middleware như `helmet` hoặc `cors` sau khi định nghĩa một route, thì middleware đó sẽ không áp dụng cho route đó, nó chỉ áp dụng cho các route được định nghĩa sau middleware.

#### Sử dụng với Express (mặc định)

Bắt đầu bằng cách cài đặt gói cần thiết.

```bash
$ npm i --save helmet
```

Sau khi cài đặt hoàn tất, áp dụng nó như một middleware toàn cục.

```typescript
import helmet from 'helmet';
// ở đâu đó trong file khởi tạo của bạn
app.use(helmet());
```

> warning **Cảnh báo (Warning)** Khi sử dụng `helmet`, `@apollo/server` (4.x), và [Apollo Sandbox](https://docs.nestjs.com/graphql/quick-start#apollo-sandbox), có thể có vấn đề với [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) trên Apollo Sandbox. Để giải quyết vấn đề này, hãy cấu hình CSP như sau:
>
> ```typescript
> app.use(
>   helmet({
>     crossOriginEmbedderPolicy: false,
>     contentSecurityPolicy: {
>       directives: {
>         imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
>         scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
>         manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
>         frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
>       },
>     },
>   }),
> );
> ```

#### Sử dụng với Fastify

Nếu bạn đang sử dụng `FastifyAdapter`, hãy cài đặt gói [@fastify/helmet](https://github.com/fastify/fastify-helmet):

```bash
$ npm i --save @fastify/helmet
```

[fastify-helmet](https://github.com/fastify/fastify-helmet) không nên được sử dụng như một middleware, mà như một [Fastify plugin](https://www.fastify.io/docs/latest/Reference/Plugins/), tức là bằng cách sử dụng `app.register()`:

```typescript
import helmet from '@fastify/helmet';
// ở đâu đó trong file khởi tạo của bạn
await app.register(helmet);
```

> warning **Cảnh báo (Warning)** Khi sử dụng `apollo-server-fastify` và `@fastify/helmet`, có thể có vấn đề với [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) trên GraphQL playground, để giải quyết xung đột này, hãy cấu hình CSP như sau:
>
> ```typescript
> await app.register(fastifyHelmet, {
>   contentSecurityPolicy: {
>     directives: {
>       defaultSrc: [`'self'`, 'unpkg.com'],
>       styleSrc: [`'self'`, `'unsafe-inline'`, 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'unpkg.com'],
>       fontSrc: [`'self'`, 'fonts.gstatic.com', 'data:'],
>       imgSrc: [`'self'`, 'data:', 'cdn.jsdelivr.net'],
>       scriptSrc: [`'self'`, `https: 'unsafe-inline'`, `cdn.jsdelivr.net`, `'unsafe-eval'`],
>     },
>   },
> });
>
> // Nếu bạn không định sử dụng CSP, bạn có thể sử dụng cách này:
> await app.register(fastifyHelmet, {
>   contentSecurityPolicy: false,
> });
> ```
