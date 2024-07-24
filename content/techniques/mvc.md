### Model-View-Controller

Nest, mặc định, sử dụng thư viện [Express](https://github.com/expressjs/express) bên dưới. Do đó, mọi kỹ thuật sử dụng mô hình MVC (Model-View-Controller) trong Express cũng áp dụng cho Nest.

Đầu tiên, hãy tạo một ứng dụng Nest đơn giản bằng công cụ [CLI](https://github.com/nestjs/nest-cli):

```bash
$ npm i -g @nestjs/cli
$ nest new project
```

Để tạo một ứng dụng MVC, chúng ta cũng cần một [công cụ template](https://expressjs.com/en/guide/using-template-engines.html) để render các view HTML:

```bash
$ npm install --save hbs
```

Chúng ta đã sử dụng công cụ `hbs` ([Handlebars](https://github.com/pillarjs/hbs#readme)), mặc dù bạn có thể sử dụng bất kỳ công cụ nào phù hợp với yêu cầu của bạn. Sau khi quá trình cài đặt hoàn tất, chúng ta cần cấu hình instance express bằng mã sau:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
  );

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  await app.listen(3000);
}
bootstrap();
```

Chúng ta đã nói với [Express](https://github.com/expressjs/express) rằng thư mục `public` sẽ được sử dụng để lưu trữ các tài sản tĩnh, `views` sẽ chứa các template, và công cụ template `hbs` sẽ được sử dụng để render đầu ra HTML.

#### Render template

Bây giờ, hãy tạo một thư mục `views` và template `index.hbs` bên trong nó. Trong template, chúng ta sẽ in ra một `message` được truyền từ controller:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>App</title>
  </head>
  <body>
    {{ "{{ message }\}" }}
  </body>
</html>
```

Tiếp theo, mở file `app.controller` và thay thế phương thức `root()` bằng mã sau:

```typescript
@@filename(app.controller)
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }
}
```

Trong mã này, chúng ta đang chỉ định template để sử dụng trong decorator `@Render()`, và giá trị trả về của phương thức xử lý tuyến đường được truyền đến template để render. Lưu ý rằng giá trị trả về là một đối tượng với thuộc tính `message`, khớp với placeholder `message` mà chúng ta đã tạo trong template.

Trong khi ứng dụng đang chạy, mở trình duyệt của bạn và điều hướng đến `http://localhost:3000`. Bạn sẽ thấy thông báo `Hello world!`.

#### Render template động

Nếu logic ứng dụng phải quyết định động template nào để render, thì chúng ta nên sử dụng decorator `@Res()`, và cung cấp tên view trong trình xử lý tuyến đường của chúng ta, thay vì trong decorator `@Render()`:

> info **Gợi ý** Khi Nest phát hiện decorator `@Res()`, nó sẽ tiêm đối tượng `response` cụ thể của thư viện. Chúng ta có thể sử dụng đối tượng này để render template một cách động. Tìm hiểu thêm về API của đối tượng `response` [tại đây](https://expressjs.com/en/api.html).

```typescript
@@filename(app.controller)
import { Get, Controller, Res, Render } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private appService: AppService) {}

  @Get()
  root(@Res() res: Response) {
    return res.render(
      this.appService.getViewName(),
      { message: 'Hello world!' },
    );
  }
}
```

#### Ví dụ

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/15-mvc).

#### Fastify

Như đã đề cập trong [chương này](/techniques/performance), chúng ta có thể sử dụng bất kỳ nhà cung cấp HTTP tương thích nào với Nest. Một thư viện như vậy là [Fastify](https://github.com/fastify/fastify). Để tạo một ứng dụng MVC với Fastify, chúng ta phải cài đặt các gói sau:

```bash
$ npm i --save @fastify/static @fastify/view handlebars
```

Các bước tiếp theo bao gồm gần như cùng quá trình được sử dụng với Express, với một số khác biệt nhỏ cụ thể cho nền tảng. Sau khi quá trình cài đặt hoàn tất, mở file `main.ts` và cập nhật nội dung của nó:

```typescript
@@filename(main)
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });
  await app.listen(3000);
}
bootstrap();
```

API của Fastify hơi khác một chút nhưng kết quả cuối cùng của các lệnh gọi phương thức đó vẫn giữ nguyên. Một điểm khác biệt cần lưu ý với Fastify là tên template được truyền vào decorator `@Render()` phải bao gồm phần mở rộng tệp.

```typescript
@@filename(app.controller)
import { Get, Controller, Render } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Render('index.hbs')
  root() {
    return { message: 'Hello world!' };
  }
}
```

Trong khi ứng dụng đang chạy, mở trình duyệt của bạn và điều hướng đến `http://localhost:3000`. Bạn sẽ thấy thông báo `Hello world!`.

#### Ví dụ

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/17-mvc-fastify).
