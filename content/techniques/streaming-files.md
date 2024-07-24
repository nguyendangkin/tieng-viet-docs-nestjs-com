### Truyền phát tệp tin (Streaming files)

> info **Lưu ý** Chương này chỉ ra cách bạn có thể truyền phát tệp tin từ **ứng dụng HTTP** của bạn. Các ví dụ được trình bày dưới đây không áp dụng cho các ứng dụng GraphQL hoặc Microservice.

Có thể có lúc bạn muốn gửi lại một tệp tin từ REST API của bạn đến khách hàng. Để làm điều này với Nest, thông thường bạn sẽ làm như sau:

```ts
@Controller('file')
export class FileController {
  @Get()
  getFile(@Res() res: Response) {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    file.pipe(res);
  }
}
```

Nhưng khi làm như vậy, bạn sẽ mất quyền truy cập vào logic bộ chặn sau bộ điều khiển của bạn. Để xử lý điều này, bạn có thể trả về một thực thể `StreamableFile` và ở dưới, framework sẽ lo việc truyền phát phản hồi.

#### Lớp StreamableFile (Streamable File class)

`StreamableFile` là một lớp giữ luồng sẽ được trả về. Để tạo một `StreamableFile` mới, bạn có thể truyền một `Buffer` hoặc một `Stream` vào hàm tạo `StreamableFile`.

> info **gợi ý** Lớp `StreamableFile` có thể được import từ `@nestjs/common`.

#### Hỗ trợ đa nền tảng (Cross-platform support)

Fastify, theo mặc định, có thể hỗ trợ gửi tệp tin mà không cần gọi `stream.pipe(res)`, vì vậy bạn không cần phải sử dụng lớp `StreamableFile` chút nào. Tuy nhiên, Nest hỗ trợ việc sử dụng `StreamableFile` trong cả hai loại nền tảng, vì vậy nếu bạn chuyển đổi giữa Express và Fastify, bạn không cần phải lo lắng về tính tương thích giữa hai động cơ.

#### Ví dụ (Example)

Bạn có thể tìm thấy một ví dụ đơn giản về việc trả về `package.json` dưới dạng một tệp thay vì JSON dưới đây, nhưng ý tưởng này mở rộng tự nhiên đến hình ảnh, tài liệu và bất kỳ loại tệp nào khác.

```ts
import { Controller, Get, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }
}
```

Loại nội dung mặc định (giá trị cho tiêu đề phản hồi HTTP `Content-Type`) là `application/octet-stream`. Nếu bạn cần tùy chỉnh giá trị này, bạn có thể sử dụng tùy chọn `type` từ `StreamableFile`, hoặc sử dụng phương thức `res.set` hoặc decorator [`@Header()`](/controllers#headers), như thế này:

```ts
import { Controller, Get, StreamableFile, Res } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';
import type { Response } from 'express'; // Giả sử rằng chúng ta đang sử dụng Bộ điều hợp HTTP ExpressJS

@Controller('file')
export class FileController {
  @Get()
  getFile(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file, {
      type: 'application/json',
      disposition: 'attachment; filename="package.json"',
      // Nếu bạn muốn định nghĩa giá trị Content-Length thành một giá trị khác thay vì độ dài của tệp:
      // length: 123,
    });
  }

  // Hoặc thậm chí:
  @Get()
  getFileChangingResponseObjDirectly(@Res({ passthrough: true }) res: Response): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="package.json"',
    });
    return new StreamableFile(file);
  }

  // Hoặc thậm chí:
  @Get()
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename="package.json"')
  getFileUsingStaticValues(): StreamableFile {
    const file = createReadStream(join(process.cwd(), 'package.json'));
    return new StreamableFile(file);
  }
}
```
