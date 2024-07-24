### Nén (Compression)

Nén có thể giảm đáng kể kích thước của phần thân phản hồi, từ đó tăng tốc độ của một ứng dụng web.

Đối với các trang web có lưu lượng truy cập cao trong môi trường sản xuất, rất nên chuyển việc nén từ máy chủ ứng dụng - thường là trong một proxy ngược (ví dụ: Nginx). Trong trường hợp đó, bạn không nên sử dụng middleware nén.

#### Sử dụng với Express (mặc định) (Use with Express (default))

Sử dụng gói middleware [compression](https://github.com/expressjs/compression) để bật nén gzip.

Trước tiên, cài đặt gói cần thiết:

```bash
$ npm i --save compression
```

Sau khi cài đặt hoàn tất, áp dụng middleware nén như middleware toàn cục.

```typescript
import * as compression from 'compression';
// ở đâu đó trong file khởi tạo của bạn
app.use(compression());
```

#### Sử dụng với Fastify (Use with Fastify)

Nếu sử dụng `FastifyAdapter`, bạn sẽ muốn sử dụng [fastify-compress](https://github.com/fastify/fastify-compress):

```bash
$ npm i --save @fastify/compress
```

Sau khi cài đặt hoàn tất, áp dụng middleware `@fastify/compress` như middleware toàn cục.

```typescript
import compression from '@fastify/compress';
// ở đâu đó trong file khởi tạo của bạn
await app.register(compression);
```

Theo mặc định, `@fastify/compress` sẽ sử dụng nén Brotli (trên Node >= 11.7.0) khi trình duyệt chỉ ra hỗ trợ cho mã hóa này. Mặc dù Brotli có thể khá hiệu quả về tỷ lệ nén, nó cũng có thể khá chậm. Theo mặc định, Brotli đặt chất lượng nén tối đa là 11, mặc dù nó có thể được điều chỉnh để giảm thời gian nén thay vì chất lượng nén bằng cách điều chỉnh `BROTLI_PARAM_QUALITY` giữa 0 tối thiểu và 11 tối đa. Điều này sẽ yêu cầu tinh chỉnh để tối ưu hóa hiệu suất không gian/thời gian. Một ví dụ với chất lượng 4:

```typescript
import { constants } from 'zlib';
// ở đâu đó trong file khởi tạo của bạn
await app.register(compression, { brotliOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } } });
```

Để đơn giản hóa, bạn có thể muốn nói với `fastify-compress` chỉ sử dụng deflate và gzip để nén phản hồi; bạn sẽ kết thúc với các phản hồi có thể lớn hơn nhưng chúng sẽ được gửi nhanh hơn nhiều.

Để chỉ định các mã hóa, cung cấp một đối số thứ hai cho `app.register`:

```typescript
await app.register(compression, { encodings: ['gzip', 'deflate'] });
```

Điều trên nói với `fastify-compress` chỉ sử dụng mã hóa gzip và deflate, ưu tiên gzip nếu client hỗ trợ cả hai.
