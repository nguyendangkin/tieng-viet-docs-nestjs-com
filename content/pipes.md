### Pipes (Ống dẫn)

Pipe là một class được đánh dấu bằng decorator `@Injectable()`, và implements interface `PipeTransform`.

<figure>
  <img src="/assets/Pipe_1.png" />
</figure>

Pipes có hai trường hợp sử dụng điển hình:

- **transformation**: chuyển đổi dữ liệu đầu vào sang dạng mong muốn (ví dụ: từ chuỗi sang số nguyên)
- **validation**: đánh giá dữ liệu đầu vào và nếu hợp lệ, đơn giản là truyền qua không thay đổi; nếu không, ném ra một ngoại lệ

Trong cả hai trường hợp, pipes hoạt động trên các `arguments` đang được xử lý bởi một <a href="controllers#route-parameters">route handler của controller</a>. Nest chèn một pipe ngay trước khi một phương thức được gọi, và pipe nhận các đối số dành cho phương thức đó và thao tác trên chúng. Bất kỳ hoạt động chuyển đổi hoặc xác thực nào diễn ra tại thời điểm đó, sau đó route handler được gọi với các đối số đã (có thể) được chuyển đổi.

Nest đi kèm với một số pipes có sẵn mà bạn có thể sử dụng ngay lập tức. Bạn cũng có thể xây dựng các pipes tùy chỉnh của riêng mình. Trong chương này, chúng ta sẽ giới thiệu các pipes có sẵn và chỉ cách liên kết chúng với các route handlers. Sau đó, chúng ta sẽ xem xét một số pipes tự xây dựng để chỉ cách bạn có thể tạo một pipe từ đầu.

> info **Gợi ý** Pipes chạy trong vùng ngoại lệ. Điều này có nghĩa là khi một Pipe ném ra một ngoại lệ, nó được xử lý bởi lớp ngoại lệ (global exceptions filter và bất kỳ [exceptions filters](/exception-filters) nào được áp dụng cho ngữ cảnh hiện tại). Với điều trên, rõ ràng là khi một ngoại lệ được ném ra trong một Pipe, không có phương thức controller nào được thực thi sau đó. Điều này cung cấp cho bạn một kỹ thuật thực hành tốt nhất để xác thực dữ liệu đi vào ứng dụng từ các nguồn bên ngoài tại ranh giới hệ thống.

#### Pipes có sẵn (Built-in pipes)

Nest đi kèm với chín pipes có sẵn:

- `ValidationPipe`
- `ParseIntPipe`
- `ParseFloatPipe`
- `ParseBoolPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`
- `ParseEnumPipe`
- `DefaultValuePipe`
- `ParseFilePipe`

Chúng được xuất từ package `@nestjs/common`.

Hãy xem nhanh việc sử dụng `ParseIntPipe`. Đây là một ví dụ về trường hợp sử dụng **transformation**, trong đó pipe đảm bảo rằng một tham số của phương thức handler được chuyển đổi thành một số nguyên JavaScript (hoặc ném ra một ngoại lệ nếu việc chuyển đổi thất bại). Sau trong chương này, chúng ta sẽ trình bày một triển khai đơn giản cho `ParseIntPipe`. Các kỹ thuật ví dụ dưới đây cũng áp dụng cho các pipes chuyển đổi có sẵn khác (`ParseBoolPipe`, `ParseFloatPipe`, `ParseEnumPipe`, `ParseArrayPipe` và `ParseUUIDPipe`, mà chúng ta sẽ gọi là các pipes `Parse*` trong chương này).

#### Liên kết pipes (Binding pipes)

Để sử dụng một pipe, chúng ta cần liên kết một instance của lớp pipe với ngữ cảnh thích hợp. Trong ví dụ `ParseIntPipe` của chúng ta, chúng ta muốn liên kết pipe với một phương thức route handler cụ thể, và đảm bảo nó chạy trước khi phương thức được gọi. Chúng ta làm điều đó với cấu trúc sau, mà chúng ta sẽ gọi là liên kết pipe ở cấp độ tham số phương thức:

```typescript
@Get(':id')
async findOne(@Param('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

Điều này đảm bảo rằng một trong hai điều kiện sau là đúng: hoặc tham số chúng ta nhận được trong phương thức `findOne()` là một số (như mong đợi trong lời gọi của chúng ta đến `this.catsService.findOne()`), hoặc một ngoại lệ được ném ra trước khi route handler được gọi.

Ví dụ, giả sử route được gọi như sau:

```bash
GET localhost:3000/abc
```

Nest sẽ ném ra một ngoại lệ như thế này:

```json
{
  "statusCode": 400,
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request"
}
```

Ngoại lệ sẽ ngăn phần thân của phương thức `findOne()` thực thi.

Trong ví dụ trên, chúng ta truyền một lớp (`ParseIntPipe`), không phải một instance, để framework chịu trách nhiệm khởi tạo và cho phép dependency injection. Như với pipes và guards, chúng ta có thể thay vào đó truyền một instance tại chỗ. Việc truyền một instance tại chỗ hữu ích nếu chúng ta muốn tùy chỉnh hành vi của pipe có sẵn bằng cách truyền các tùy chọn:

```typescript
@Get(':id')
async findOne(
  @Param('id', new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }))
  id: number,
) {
  return this.catsService.findOne(id);
}
```

Liên kết các pipes chuyển đổi khác (tất cả các pipes **Parse\***) hoạt động tương tự. Các pipes này đều hoạt động trong ngữ cảnh xác thực các tham số route, tham số query string và giá trị body request.

Ví dụ với một tham số query string:

```typescript
@Get()
async findOne(@Query('id', ParseIntPipe) id: number) {
  return this.catsService.findOne(id);
}
```

Đây là một ví dụ về việc sử dụng `ParseUUIDPipe` để phân tích một tham số chuỗi và xác thực xem nó có phải là một UUID không.

```typescript
@@filename()
@Get(':uuid')
async findOne(@Param('uuid', new ParseUUIDPipe()) uuid: string) {
  return this.catsService.findOne(uuid);
}
@@switch
@Get(':uuid')
@Bind(Param('uuid', new ParseUUIDPipe()))
async findOne(uuid) {
  return this.catsService.findOne(uuid);
}
```

> info **Gợi ý** Khi sử dụng `ParseUUIDPipe()`, bạn đang phân tích UUID ở phiên bản 3, 4 hoặc 5, nếu bạn chỉ yêu cầu một phiên bản cụ thể của UUID, bạn có thể truyền một phiên bản trong các tùy chọn của pipe.

Trên đây chúng ta đã thấy các ví dụ về việc liên kết các pipes `Parse*` có sẵn khác nhau. Việc liên kết các pipes xác thực hơi khác một chút; chúng ta sẽ thảo luận về điều đó trong phần tiếp theo.

> info **Gợi ý** Ngoài ra, xem [Các kỹ thuật xác thực](/techniques/validation) để có các ví dụ mở rộng về pipes xác thực.

#### Pipes tùy chỉnh (Custom pipes)

Như đã đề cập, bạn có thể xây dựng các pipes tùy chỉnh của riêng mình. Mặc dù Nest cung cấp một `ParseIntPipe` và `ValidationPipe` mạnh mẽ có sẵn, hãy xây dựng các phiên bản đơn giản của mỗi loại từ đầu để xem cách các pipes tùy chỉnh được xây dựng.

Chúng ta bắt đầu với một `ValidationPipe` đơn giản. Ban đầu, chúng ta sẽ làm cho nó chỉ nhận một giá trị đầu vào và ngay lập tức trả về cùng giá trị đó, hoạt động như một hàm nhận dạng.

```typescript
@@filename(validation.pipe)
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    return value;
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationPipe {
  transform(value, metadata) {
    return value;
  }
}
```

> info **Gợi ý** `PipeTransform<T, R>` là một interface generic phải được implement bởi bất kỳ pipe nào. Interface generic sử dụng `T` để chỉ ra kiểu của giá trị đầu vào `value`, và `R` để chỉ ra kiểu trả về của phương thức `transform()`.

Mọi pipe phải implement phương thức `transform()` để thực hiện hợp đồng interface `PipeTransform`. Phương thức này có hai tham số:

- `value`
- `metadata`

Tham số `value` là giá trị đối số phương thức hiện đang được xử lý (trước khi nó được nhận bởi phương thức xử lý route), và `metadata` là metadata của đối số phương thức hiện đang được xử lý. Đối tượng metadata có các thuộc tính sau:

```typescript
export interface ArgumentMetadata {
  type: 'body' | 'query' | 'param' | 'custom';
  metatype?: Type<unknown>;
  data?: string;
}
```

Các thuộc tính này mô tả đối số hiện đang được xử lý.

<table>
  <tr>
    <td>
      <code>type</code>
    </td>
    <td>Chỉ ra liệu đối số là body
      <code>@Body()</code>, query
      <code>@Query()</code>, param
      <code>@Param()</code>, hay một tham số tùy chỉnh (đọc thêm
      <a routerLink="/custom-decorators">tại đây</a>).</td>
  </tr>
  <tr>
    <td>
      <code>metatype</code>
    </td>
    <td>
      Cung cấp metatype của đối số, ví dụ,
      <code>String</code>. Lưu ý: giá trị là
      <code>undefined</code> nếu bạn bỏ qua khai báo kiểu trong chữ ký phương thức xử lý route, hoặc sử dụng JavaScript thuần túy.
    </td>
  </tr>
  <tr>
    <td>
      <code>data</code>
    </td>
    <td>Chuỗi được truyền cho decorator, ví dụ
      <code>@Body('string')</code>. Nó là
      <code>undefined</code> nếu bạn để trống ngoặc đơn của decorator.</td>
  </tr>
</table>

> warning **Cảnh báo** Các interfaces TypeScript biến mất trong quá trình biên dịch. Do đó, nếu kiểu của một tham số phương thức được khai báo là một interface thay vì một class, giá trị `metatype` sẽ là `Object`.

#### Xác thực dựa trên schema (Schema based validation)

Hãy làm cho pipe xác thực của chúng ta hữu ích hơn một chút. Hãy xem xét kỹ hơn phương thức `create()` của `CatsController`, nơi chúng ta có thể muốn đảm bảo rằng đối tượng body post hợp lệ trước khi cố gắng chạy phương thức service của chúng ta.

```typescript
@@filename()
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
async create(@Body() createCatDto) {
  this.catsService.create(createCatDto);
}
```

Hãy tập trung vào tham số body `createCatDto`. Kiểu của nó là `CreateCatDto`:

```typescript
@@filename(create-cat.dto)
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

Chúng ta muốn đảm bảo rằng bất kỳ request đến nào đến phương thức create đều chứa một body hợp lệ. Vì vậy chúng ta phải xác thực ba thành viên của đối tượng `createCatDto`. Chúng ta có thể làm điều này bên trong phương thức xử lý route, nhưng làm như vậy không lý tưởng vì nó sẽ vi phạm **nguyên tắc trách nhiệm đơn lẻ** (SRP).

Một cách tiếp cận khác có thể là tạo một **lớp validator** và ủy thác nhiệm vụ cho nó. Điều này có nhược điểm là chúng ta sẽ phải nhớ gọi validator này ở đầu mỗi phương thức.

Còn về việc tạo **middleware xác thực**? Điều này có thể hoạt động, nhưng đáng tiếc là không thể tạo ra **middleware chung** có thể được sử dụng trong tất cả các ngữ cảnh trên toàn bộ ứng dụng. Đó là vì middleware không biết về **ngữ cảnh thực thi**, bao gồm cả handler sẽ được gọi và bất kỳ tham số nào của nó.

Đây, tất nhiên, chính xác là trường hợp sử dụng mà pipes được thiết kế cho. Vì vậy, hãy tiếp tục và cải tiến pipe xác thực của chúng ta.

<app-banner-courses></app-banner-courses>

#### Xác thực schema đối tượng (Object schema validation)

Có một số cách tiếp cận có sẵn để thực hiện xác thực đối tượng một cách sạch sẽ, [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself). Một cách tiếp cận phổ biến là sử dụng xác thực **dựa trên schema**. Hãy thử cách tiếp cận đó.

Thư viện [Zod](https://zod.dev/) cho phép bạn tạo schemas một cách đơn giản, với một API dễ đọc. Hãy xây dựng một pipe xác thực sử dụng schemas dựa trên Zod.

Bắt đầu bằng cách cài đặt gói cần thiết:

```bash
$ npm install --save zod
```

Trong mẫu code dưới đây, chúng ta tạo một lớp đơn giản nhận một schema làm đối số `constructor`. Sau đó, chúng ta áp dụng phương thức `schema.parse()`, phương thức này xác thực đối số đến của chúng ta với schema đã cung cấp.

Như đã lưu ý trước đó, một **pipe xác thực** hoặc trả về giá trị không thay đổi hoặc ném ra một ngoại lệ.

Trong phần tiếp theo, bạn sẽ thấy cách chúng ta cung cấp schema phù hợp cho một phương thức controller nhất định bằng cách sử dụng decorator `@UsePipes()`. Làm như vậy giúp pipe xác thực của chúng ta có thể tái sử dụng trong các ngữ cảnh khác nhau, như chúng ta đã đặt ra để làm.

```typescript
@@filename()
import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema  } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}
@@switch
import { BadRequestException } from '@nestjs/common';

export class ZodValidationPipe {
  constructor(private schema) {}

  transform(value, metadata) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}

```

#### Liên kết các pipes xác thực (Binding validation pipes)

Trước đó, chúng ta đã thấy cách liên kết các pipes chuyển đổi (như `ParseIntPipe` và các pipes `Parse*` khác).

Việc liên kết các pipes xác thực cũng rất đơn giản.

Trong trường hợp này, chúng ta muốn liên kết pipe ở cấp độ lời gọi phương thức. Trong ví dụ hiện tại, chúng ta cần làm những điều sau để sử dụng `ZodValidationPipe`:

1. Tạo một instance của `ZodValidationPipe`
2. Truyền schema Zod cụ thể cho ngữ cảnh vào constructor của lớp pipe
3. Liên kết pipe với phương thức

Ví dụ về schema Zod:

```typescript
import { z } from 'zod';

export const createCatSchema = z
  .object({
    name: z.string(),
    age: z.number(),
    breed: z.string(),
  })
  .required();

export type CreateCatDto = z.infer<typeof createCatSchema>;
```

Chúng ta thực hiện điều đó bằng cách sử dụng decorator `@UsePipes()` như sau:

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(new ZodValidationPipe(createCatSchema))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
@@switch
@Post()
@Bind(Body())
@UsePipes(new ZodValidationPipe(createCatSchema))
async create(createCatDto) {
  this.catsService.create(createCatDto);
}
```

> info **Gợi ý** Decorator `@UsePipes()` được import từ package `@nestjs/common`.

> warning **Cảnh báo** Thư viện `zod` yêu cầu cấu hình `strictNullChecks` phải được bật trong file `tsconfig.json` của bạn.

#### Class validator (Class validator)

> warning **Cảnh báo** Các kỹ thuật trong phần này yêu cầu TypeScript và không khả dụng nếu ứng dụng của bạn được viết bằng JavaScript thuần túy.

Hãy xem xét một cách triển khai khác cho kỹ thuật xác thực của chúng ta.

Nest hoạt động tốt với thư viện [class-validator](https://github.com/typestack/class-validator). Thư viện mạnh mẽ này cho phép bạn sử dụng xác thực dựa trên decorator. Xác thực dựa trên decorator cực kỳ mạnh mẽ, đặc biệt khi kết hợp với khả năng **Pipe** của Nest vì chúng ta có quyền truy cập vào `metatype` của thuộc tính được xử lý. Trước khi bắt đầu, chúng ta cần cài đặt các gói cần thiết:

```bash
$ npm i --save class-validator class-transformer
```

Khi đã cài đặt xong, chúng ta có thể thêm một vài decorators vào lớp `CreateCatDto`. Ở đây chúng ta thấy một lợi thế đáng kể của kỹ thuật này: lớp `CreateCatDto` vẫn là nguồn duy nhất cho đối tượng Post body của chúng ta (thay vì phải tạo một lớp xác thực riêng biệt).

```typescript
@@filename(create-cat.dto)
import { IsString, IsInt } from 'class-validator';

export class CreateCatDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;

  @IsString()
  breed: string;
}
```

> info **Gợi ý** Đọc thêm về các decorators của class-validator [tại đây](https://github.com/typestack/class-validator#usage).

Bây giờ chúng ta có thể tạo một lớp `ValidationPipe` sử dụng các chú thích này.

```typescript
@@filename(validation.pipe)
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

> info **Gợi ý** Như một lời nhắc, bạn không cần phải tự xây dựng một pipe xác thực chung vì `ValidationPipe` đã được Nest cung cấp sẵn. `ValidationPipe` tích hợp sẵn cung cấp nhiều tùy chọn hơn mẫu mà chúng ta đã xây dựng trong chương này, mẫu này được giữ ở mức cơ bản để minh họa cơ chế của một pipe tự xây dựng. Bạn có thể tìm thấy chi tiết đầy đủ, cùng với nhiều ví dụ [tại đây](/techniques/validation).

> warning **Lưu ý** Chúng ta đã sử dụng thư viện [class-transformer](https://github.com/typestack/class-transformer) ở trên, được tạo bởi cùng tác giả của thư viện **class-validator**, và kết quả là chúng hoạt động rất tốt với nhau.

Hãy đi qua code này. Đầu tiên, lưu ý rằng phương thức `transform()` được đánh dấu là `async`. Điều này là có thể vì Nest hỗ trợ cả pipes đồng bộ và **bất đồng bộ**. Chúng ta làm cho phương thức này `async` vì một số xác thực của class-validator [có thể bất đồng bộ](https://github.com/typestack/class-validator#custom-validation-classes) (sử dụng Promises).

Tiếp theo, lưu ý rằng chúng ta đang sử dụng phân rã để trích xuất trường metatype (chỉ trích xuất thành viên này từ `ArgumentMetadata`) vào tham số `metatype` của chúng ta. Đây chỉ là cách viết tắt để lấy toàn bộ `ArgumentMetadata` và sau đó có một câu lệnh bổ sung để gán biến metatype.

Tiếp theo, lưu ý hàm trợ giúp `toValidate()`. Nó chịu trách nhiệm bỏ qua bước xác thực khi đối số hiện tại đang được xử lý là một kiểu JavaScript gốc (những kiểu này không thể có decorators xác thực đính kèm, nên không có lý do gì để chạy chúng qua bước xác thực).

Tiếp theo, chúng ta sử dụng hàm `plainToInstance()` của class-transformer để chuyển đổi đối tượng đối số JavaScript thuần túy của chúng ta thành một đối tượng có kiểu để chúng ta có thể áp dụng xác thực. Lý do chúng ta phải làm điều này là vì đối tượng post body đến, khi được giải mã từ yêu cầu mạng, **không có bất kỳ thông tin kiểu nào** (đây là cách nền tảng cơ bản, như Express, hoạt động). Class-validator cần sử dụng các decorators xác thực mà chúng ta đã định nghĩa cho DTO của chúng ta trước đó, vì vậy chúng ta cần thực hiện chuyển đổi này để xử lý body đến như một đối tượng được trang trí phù hợp, không chỉ là một đối tượng vanilla thuần túy.

Cuối cùng, như đã lưu ý trước đó, vì đây là một **pipe xác thực** nên nó hoặc trả về giá trị không thay đổi, hoặc ném ra một ngoại lệ.

Bước cuối cùng là liên kết `ValidationPipe`. Pipes có thể có phạm vi tham số, phạm vi phương thức, phạm vi controller, hoặc phạm vi toàn cục. Trước đó, với pipe xác thực dựa trên Zod của chúng ta, chúng ta đã thấy một ví dụ về việc liên kết pipe ở cấp độ phương thức.
Trong ví dụ dưới đây, chúng ta sẽ liên kết instance pipe với decorator `@Body()` của route handler để pipe của chúng ta được gọi để xác thực post body.

```typescript
@@filename(cats.controller)
@Post()
async create(
  @Body(new ValidationPipe()) createCatDto: CreateCatDto,
) {
  this.catsService.create(createCatDto);
}
```

Pipes có phạm vi tham số hữu ích khi logic xác thực chỉ liên quan đến một tham số được chỉ định.

#### Pipes có phạm vi toàn cục (Global scoped pipes)

Vì `ValidationPipe` được tạo ra để càng chung chung càng tốt, chúng ta có thể nhận ra toàn bộ tiện ích của nó bằng cách thiết lập nó như một pipe **có phạm vi toàn cục** để nó được áp dụng cho mọi route handler trong toàn bộ ứng dụng.

```typescript
@@filename(main)
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

> warning **Lưu ý** Trong trường hợp <a href="faq/hybrid-application">ứng dụng lai</a>, phương thức `useGlobalPipes()` không thiết lập pipes cho các gateways và microservices. Đối với các ứng dụng microservice "chuẩn" (không lai), `useGlobalPipes()` gắn kết pipes một cách toàn cục.

Pipes toàn cục được sử dụng trong toàn bộ ứng dụng, cho mọi controller và mọi route handler.

Lưu ý rằng về mặt dependency injection, các pipes toàn cục được đăng ký từ bên ngoài bất kỳ module nào (với `useGlobalPipes()` như trong ví dụ trên) không thể inject các dependencies vì việc liên kết đã được thực hiện bên ngoài ngữ cảnh của bất kỳ module nào. Để giải quyết vấn đề này, bạn có thể thiết lập một pipe toàn cục **trực tiếp từ bất kỳ module nào** bằng cách sử dụng cấu trúc sau:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}
```

> info **Gợi ý** Khi sử dụng cách tiếp cận này để thực hiện dependency injection cho pipe, lưu ý rằng bất kể module nào sử dụng cấu trúc này, pipe thực sự là toàn cục. Nên thực hiện điều này ở đâu? Chọn module nơi pipe (`ValidationPipe` trong ví dụ trên) được định nghĩa. Ngoài ra, `useClass` không phải là cách duy nhất để xử lý đăng ký provider tùy chỉnh. Tìm hiểu thêm [tại đây](/fundamentals/custom-providers).

#### ValidationPipe tích hợp sẵn (The built-in ValidationPipe)

Như một lời nhắc, bạn không cần phải tự xây dựng một pipe xác thực chung vì `ValidationPipe` đã được Nest cung cấp sẵn. `ValidationPipe` tích hợp sẵn cung cấp nhiều tùy chọn hơn mẫu mà chúng ta đã xây dựng trong chương này, mẫu này được giữ ở mức cơ bản để minh họa cơ chế của một pipe tự xây dựng. Bạn có thể tìm thấy chi tiết đầy đủ, cùng với nhiều ví dụ [tại đây](/techniques/validation).

#### Trường hợp sử dụng chuyển đổi (Transformation use case)

Validation không phải là trường hợp sử dụng duy nhất cho các pipe tùy chỉnh. Ở đầu chương này, chúng ta đã đề cập rằng một pipe cũng có thể **chuyển đổi** dữ liệu đầu vào sang định dạng mong muốn. Điều này có thể thực hiện được vì giá trị trả về từ hàm `transform` sẽ hoàn toàn ghi đè giá trị trước đó của đối số.

Khi nào điều này hữu ích? Hãy xem xét rằng đôi khi dữ liệu được gửi từ phía client cần phải trải qua một số thay đổi - ví dụ như chuyển đổi một chuỗi thành số nguyên - trước khi nó có thể được xử lý đúng cách bởi phương thức xử lý route. Hơn nữa, một số trường dữ liệu bắt buộc có thể bị thiếu, và chúng ta muốn áp dụng các giá trị mặc định. **Các pipe chuyển đổi** có thể thực hiện những chức năng này bằng cách đặt một hàm xử lý giữa yêu cầu của client và trình xử lý yêu cầu.

Dưới đây là một `ParseIntPipe` đơn giản chịu trách nhiệm chuyển đổi một chuỗi thành giá trị số nguyên. (Như đã lưu ý ở trên, Nest có sẵn một `ParseIntPipe` phức tạp hơn; chúng ta đưa ra ví dụ này như một ví dụ đơn giản về một pipe chuyển đổi tùy chỉnh).

```typescript
@@filename(parse-int.pipe)
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
@@switch
import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntPipe {
  transform(value, metadata) {
    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
```

Sau đó, chúng ta có thể gắn pipe này vào tham số đã chọn như sau:

```typescript
@@filename()
@Get(':id')
async findOne(@Param('id', new ParseIntPipe()) id) {
  return this.catsService.findOne(id);
}
@@switch
@Get(':id')
@Bind(Param('id', new ParseIntPipe()))
async findOne(id) {
  return this.catsService.findOne(id);
}
```

Một trường hợp chuyển đổi hữu ích khác là chọn một **thực thể người dùng** hiện có từ cơ sở dữ liệu bằng cách sử dụng id được cung cấp trong yêu cầu:

```typescript
@@filename()
@Get(':id')
findOne(@Param('id', UserByIdPipe) userEntity: UserEntity) {
  return userEntity;
}
@@switch
@Get(':id')
@Bind(Param('id', UserByIdPipe))
findOne(userEntity) {
  return userEntity;
}
```

Chúng tôi để việc triển khai pipe này cho người đọc, nhưng lưu ý rằng giống như tất cả các pipe chuyển đổi khác, nó nhận một giá trị đầu vào (một `id`) và trả về một giá trị đầu ra (một đối tượng `UserEntity`). Điều này có thể làm cho mã của bạn trở nên khai báo hơn và [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) bằng cách trích xuất mã boilerplate ra khỏi trình xử lý của bạn và đưa vào một pipe chung.

#### Cung cấp giá trị mặc định (Providing defaults)

Các pipe `Parse*` mong đợi giá trị của tham số được định nghĩa. Chúng sẽ ném ra một ngoại lệ khi nhận được giá trị `null` hoặc `undefined`. Để cho phép một endpoint xử lý các giá trị tham số querystring bị thiếu, chúng ta phải cung cấp một giá trị mặc định để được tiêm vào trước khi các pipe `Parse*` hoạt động trên các giá trị này. `DefaultValuePipe` phục vụ mục đích đó. Đơn giản chỉ cần khởi tạo một `DefaultValuePipe` trong decorator `@Query()` trước pipe `Parse*` liên quan, như được hiển thị dưới đây:

```typescript
@@filename()
@Get()
async findAll(
  @Query('activeOnly', new DefaultValuePipe(false), ParseBoolPipe) activeOnly: boolean,
  @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
) {
  return this.catsService.findAll({ activeOnly, page });
}
```
