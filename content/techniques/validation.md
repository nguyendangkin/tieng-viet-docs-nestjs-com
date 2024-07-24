### Xác thực (Validation)

Thực hành tốt nhất là xác thực tính đúng đắn của bất kỳ dữ liệu nào được gửi vào ứng dụng web. Để tự động xác thực các yêu cầu đến, Nest cung cấp một số pipe có sẵn ngay từ đầu:

- `ValidationPipe`
- `ParseIntPipe`
- `ParseBoolPipe`
- `ParseArrayPipe`
- `ParseUUIDPipe`

`ValidationPipe` sử dụng gói [class-validator](https://github.com/typestack/class-validator) mạnh mẽ và các decorator xác thực khai báo của nó. `ValidationPipe` cung cấp một cách tiếp cận thuận tiện để thực thi các quy tắc xác thực cho tất cả các payload từ phía client, trong đó các quy tắc cụ thể được khai báo với các annotation đơn giản trong các khai báo lớp/DTO cục bộ trong mỗi module.

#### Tổng quan (Overview)

Trong chương [Pipes](/pipes), chúng ta đã trải qua quá trình xây dựng các pipe đơn giản và gắn chúng vào controllers, phương thức hoặc toàn bộ ứng dụng để minh họa cách quy trình hoạt động. Hãy chắc chắn rằng bạn đã xem lại chương đó để hiểu rõ nhất các chủ đề của chương này. Ở đây, chúng ta sẽ tập trung vào các trường hợp sử dụng **thực tế** khác nhau của `ValidationPipe`, và chỉ ra cách sử dụng một số tính năng tùy chỉnh nâng cao của nó.

#### Sử dụng ValidationPipe có sẵn (Using the built-in ValidationPipe)

Để bắt đầu sử dụng nó, trước tiên chúng ta cài đặt các dependency cần thiết.

```bash
$ npm i --save class-validator class-transformer
```

> info **Gợi ý** `ValidationPipe` được xuất từ gói `@nestjs/common`.

Vì pipe này sử dụng các thư viện [`class-validator`](https://github.com/typestack/class-validator) và [`class-transformer`](https://github.com/typestack/class-transformer), có nhiều tùy chọn khả dụng. Bạn cấu hình các cài đặt này thông qua một đối tượng cấu hình được truyền vào pipe. Sau đây là các tùy chọn có sẵn:

```typescript
export interface ValidationPipeOptions extends ValidatorOptions {
  transform?: boolean;
  disableErrorMessages?: boolean;
  exceptionFactory?: (errors: ValidationError[]) => any;
}
```

Ngoài những điều này, tất cả các tùy chọn `class-validator` (kế thừa từ giao diện `ValidatorOptions`) đều có sẵn:

<table>
  <tr>
    <th>Tùy chọn (Option)</th>
    <th>Kiểu (Type)</th>
    <th>Mô tả (Description)</th>
  </tr>
  <tr>
    <td><code>enableDebugMessages</code></td>
    <td><code>boolean</code></td>
    <td>Nếu được đặt thành true, trình xác thực sẽ in thêm thông báo cảnh báo ra console khi có điều gì đó không đúng.</td>
  </tr>
  <tr>
    <td><code>skipUndefinedProperties</code></td>
    <td><code>boolean</code></td>
    <td>Nếu được đặt thành true thì trình xác thực sẽ bỏ qua việc xác thực tất cả các thuộc tính không xác định trong đối tượng đang được xác thực.</td>
  </tr>
  <tr>
    <td><code>skipNullProperties</code></td>
    <td><code>boolean</code></td>
    <td>Nếu được đặt thành true thì trình xác thực sẽ bỏ qua việc xác thực tất cả các thuộc tính có giá trị null trong đối tượng đang được xác thực.</td>
  </tr>
  <tr>
    <td><code>skipMissingProperties</code></td>
    <td><code>boolean</code></td>
    <td>Nếu được đặt thành true thì trình xác thực sẽ bỏ qua việc xác thực tất cả các thuộc tính có giá trị null hoặc không xác định trong đối tượng đang được xác thực.</td>
  </tr>
  <tr>
    <td><code>whitelist</code></td>
    <td><code>boolean</code></td>
    <td>Nếu được đặt thành true, trình xác thực sẽ loại bỏ khỏi đối tượng đã xác thực (được trả về) bất kỳ thuộc tính nào không sử dụng bất kỳ decorator xác thực nào.</td>
  </tr>
  <tr>
    <td><code>forbidNonWhitelisted</code></td>
    <td><code>boolean</code></td>
    <td>Nếu được đặt thành true, thay vì loại bỏ các thuộc tính không nằm trong danh sách trắng, trình xác thực sẽ ném ra một ngoại lệ.</td>
  </tr>
  <tr>
    <td><code>forbidUnknownValues</code></td>
    <td><code>boolean</code></td>
    <td>Nếu được đặt thành true, các nỗ lực xác thực các đối tượng không xác định sẽ thất bại ngay lập tức.</td>
  </tr>
  <tr>
    <td><code>disableErrorMessages</code></td>
    <td><code>boolean</code></td>
    <td>Nếu được đặt thành true, các lỗi xác thực sẽ không được trả về cho client.</td>
  </tr>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td><code>number</code></td>
    <td>Cài đặt này cho phép bạn chỉ định loại ngoại lệ nào sẽ được sử dụng trong trường hợp có lỗi. Mặc định nó ném ra <code>BadRequestException</code>.</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td><code>Function</code></td>
    <td>Nhận một mảng các lỗi xác thực và trả về một đối tượng ngoại lệ để ném ra.</td>
  </tr>
  <tr>
    <td><code>groups</code></td>
    <td><code>string[]</code></td>
    <td>Các nhóm được sử dụng trong quá trình xác thực đối tượng.</td>
  </tr>
  <tr>
    <td><code>always</code></td>
    <td><code>boolean</code></td>
    <td>Đặt mặc định cho tùy chọn <code>always</code> của các decorator. Mặc định có thể bị ghi đè trong các tùy chọn decorator</td>
  </tr>
  <tr>
    <td><code>strictGroups</code></td>
    <td><code>boolean</code></td>
    <td>Nếu <code>groups</code> không được cung cấp hoặc trống, bỏ qua các decorator có ít nhất một nhóm.</td>
  </tr>
  <tr>
    <td><code>dismissDefaultMessages</code></td>
    <td><code>boolean</code></td>
    <td>Nếu được đặt thành true, việc xác thực sẽ không sử dụng các thông báo mặc định. Thông báo lỗi sẽ luôn là <code>undefined</code> nếu nó không được đặt rõ ràng.</td>
  </tr>
  <tr>
    <td><code>validationError.target</code></td>
    <td><code>boolean</code></td>
    <td>Chỉ ra nếu mục tiêu nên được hiển thị trong <code>ValidationError</code>.</td>
  </tr>
  <tr>
    <td><code>validationError.value</code></td>
    <td><code>boolean</code></td>
    <td>Chỉ ra nếu giá trị đã được xác thực nên được hiển thị trong <code>ValidationError</code>.</td>
  </tr>
  <tr>
    <td><code>stopAtFirstError</code></td>
    <td><code>boolean</code></td>
    <td>Khi được đặt thành true, việc xác thực thuộc tính đã cho sẽ dừng lại sau khi gặp lỗi đầu tiên. Mặc định là false.</td>
  </tr>
</table>

> info **Lưu ý** Tìm thêm thông tin về gói `class-validator` trong [repository](https://github.com/typestack/class-validator) của nó.

#### Tự động xác thực (Auto-validation)

Chúng ta sẽ bắt đầu bằng việc gắn `ValidationPipe` ở cấp độ ứng dụng, từ đó đảm bảo tất cả các endpoint được bảo vệ khỏi việc nhận dữ liệu không chính xác.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
```

Để kiểm tra pipe của chúng ta, hãy tạo một endpoint cơ bản.

```typescript
@Post()
create(@Body() createUserDto: CreateUserDto) {
  return 'This action adds a new user';
}
```

> info **Gợi ý** Vì TypeScript không lưu trữ metadata về **generics hoặc interfaces**, khi bạn sử dụng chúng trong DTO của mình, `ValidationPipe` có thể không thể xác thực đúng dữ liệu đến. Vì lý do này, hãy cân nhắc sử dụng các lớp cụ thể trong DTO của bạn.

> info **Gợi ý** Khi import DTO của bạn, bạn không thể sử dụng import chỉ kiểu vì nó sẽ bị xóa khi chạy, tức là hãy nhớ `import {{ '{' }} CreateUserDto {{ '}' }}` thay vì `import type {{ '{' }} CreateUserDto {{ '}' }}`.

Bây giờ chúng ta có thể thêm một vài quy tắc xác thực trong `CreateUserDto` của chúng ta. Chúng ta làm điều này bằng cách sử dụng các decorator được cung cấp bởi gói `class-validator`, được mô tả chi tiết [tại đây](https://github.com/typestack/class-validator#validation-decorators). Theo cách này, bất kỳ route nào sử dụng `CreateUserDto` sẽ tự động thực thi các quy tắc xác thực này.

```typescript
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
```

Với các quy tắc này, nếu một yêu cầu đến endpoint của chúng ta với một thuộc tính `email` không hợp lệ trong phần thân yêu cầu, ứng dụng sẽ tự động trả về mã `400 Bad Request`, cùng với phần thân phản hồi sau:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["email must be an email"]
}
```

Ngoài việc xác thực phần thân yêu cầu, `ValidationPipe` cũng có thể được sử dụng với các thuộc tính đối tượng yêu cầu khác. Hãy tưởng tượng rằng chúng ta muốn chấp nhận `:id` trong đường dẫn endpoint. Để đảm bảo rằng chỉ có số được chấp nhận cho tham số yêu cầu này, chúng ta có thể sử dụng cấu trúc sau:

```typescript
@Get(':id')
findOne(@Param() params: FindOneParams) {
  return 'This action returns a user';
}
```

`FindOneParams`, giống như một DTO, chỉ đơn giản là một lớp định nghĩa các quy tắc xác thực sử dụng `class-validator`. Nó sẽ trông như thế này:

```typescript
import { IsNumberString } from 'class-validator';

export class FindOneParams {
  @IsNumberString()
  id: number;
}
```

#### Vô hiệu hóa lỗi chi tiết (Disable detailed errors)

Thông báo lỗi có thể hữu ích để giải thích điều gì không chính xác trong một yêu cầu. Tuy nhiên, một số môi trường sản xuất thích vô hiệu hóa lỗi chi tiết. Thực hiện điều này bằng cách truyền một đối tượng tùy chọn vào `ValidationPipe`:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    disableErrorMessages: true,
  }),
);
```

Kết quả là, các thông báo lỗi chi tiết sẽ không được hiển thị trong phần thân phản hồi.

#### Loại bỏ thuộc tính (Stripping properties)

`ValidationPipe` của chúng ta cũng có thể lọc ra các thuộc tính không nên được nhận bởi phương thức xử lý. Trong trường hợp này, chúng ta có thể **đưa vào danh sách trắng** các thuộc tính có thể chấp nhận được, và bất kỳ thuộc tính nào không có trong danh sách trắng sẽ tự động bị loại bỏ khỏi đối tượng kết quả. Ví dụ, nếu phương thức xử lý của chúng ta mong đợi các thuộc tính `email` và `password`, nhưng một yêu cầu cũng bao gồm thuộc tính `age`, thuộc tính này có thể tự động bị loại bỏ khỏi DTO kết quả. Để kích hoạt hành vi như vậy, hãy đặt `whitelist` thành `true`.

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
  }),
);
```

Khi được đặt thành true, điều này sẽ tự động loại bỏ các thuộc tính không nằm trong danh sách trắng (những thuộc tính không có bất kỳ decorator nào trong lớp xác thực).

Ngoài ra, bạn có thể dừng quá trình xử lý yêu cầu khi có mặt các thuộc tính không nằm trong danh sách trắng, và trả về phản hồi lỗi cho người dùng. Để kích hoạt điều này, hãy đặt thuộc tính tùy chọn `forbidNonWhitelisted` thành `true`, kết hợp với việc đặt `whitelist` thành `true`.

<app-banner-courses></app-banner-courses>

#### Chuyển đổi đối tượng payload (Transform payload objects)

Các payload gửi đến qua mạng là các đối tượng JavaScript thông thường. `ValidationPipe` có thể tự động chuyển đổi payload thành các đối tượng được định kiểu theo các lớp DTO của chúng. Để bật chuyển đổi tự động, đặt `transform` thành `true`. Điều này có thể được thực hiện ở cấp độ phương thức:

```typescript
@@filename(cats.controller)
@Post()
@UsePipes(new ValidationPipe({ transform: true }))
async create(@Body() createCatDto: CreateCatDto) {
  this.catsService.create(createCatDto);
}
```

Để bật hành vi này toàn cục, đặt tùy chọn trên một pipe toàn cục:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
  }),
);
```

Với tùy chọn chuyển đổi tự động được bật, `ValidationPipe` cũng sẽ thực hiện chuyển đổi các kiểu dữ liệu nguyên thủy. Trong ví dụ sau, phương thức `findOne()` nhận một đối số đại diện cho tham số đường dẫn `id` được trích xuất:

```typescript
@Get(':id')
findOne(@Param('id') id: number) {
  console.log(typeof id === 'number'); // true
  return 'This action returns a user';
}
```

Theo mặc định, mọi tham số đường dẫn và tham số truy vấn đều được truyền qua mạng dưới dạng `string`. Trong ví dụ trên, chúng ta đã chỉ định kiểu `id` là `number` (trong chữ ký phương thức). Do đó, `ValidationPipe` sẽ cố gắng tự động chuyển đổi định danh chuỗi thành số.

#### Chuyển đổi rõ ràng (Explicit conversion)

Trong phần trên, chúng ta đã thấy cách `ValidationPipe` có thể ngầm chuyển đổi các tham số truy vấn và đường dẫn dựa trên kiểu dữ liệu mong đợi. Tuy nhiên, tính năng này yêu cầu phải bật chuyển đổi tự động.

Ngoài ra (khi tắt chuyển đổi tự động), bạn có thể chuyển đổi rõ ràng các giá trị bằng cách sử dụng `ParseIntPipe` hoặc `ParseBoolPipe` (lưu ý rằng `ParseStringPipe` không cần thiết vì, như đã đề cập trước đó, mọi tham số đường dẫn và tham số truy vấn đều được truyền qua mạng dưới dạng `string` theo mặc định).

```typescript
@Get(':id')
findOne(
  @Param('id', ParseIntPipe) id: number,
  @Query('sort', ParseBoolPipe) sort: boolean,
) {
  console.log(typeof id === 'number'); // true
  console.log(typeof sort === 'boolean'); // true
  return 'This action returns a user';
}
```

> info **Gợi ý** `ParseIntPipe` và `ParseBoolPipe` được xuất từ gói `@nestjs/common`.

#### Kiểu dữ liệu ánh xạ (Mapped types)

Khi xây dựng các tính năng như **CRUD** (Create/Read/Update/Delete), thường rất hữu ích khi tạo ra các biến thể của một kiểu thực thể cơ bản. Nest cung cấp một số hàm tiện ích thực hiện các phép biến đổi kiểu để làm cho việc này thuận tiện hơn.

> **Cảnh báo** Nếu ứng dụng của bạn sử dụng gói `@nestjs/swagger`, hãy xem [chương này](/openapi/mapped-types) để biết thêm thông tin về Kiểu dữ liệu ánh xạ. Tương tự, nếu bạn sử dụng gói `@nestjs/graphql`, hãy xem [chương này](/graphql/mapped-types). Cả hai gói đều phụ thuộc nhiều vào kiểu dữ liệu nên chúng yêu cầu một cách import khác để sử dụng. Do đó, nếu bạn sử dụng `@nestjs/mapped-types` (thay vì một gói phù hợp, hoặc `@nestjs/swagger` hoặc `@nestjs/graphql` tùy thuộc vào loại ứng dụng của bạn), bạn có thể gặp phải các tác dụng phụ khác nhau, không được ghi chép.

Khi xây dựng các kiểu xác thực đầu vào (còn gọi là DTO), thường rất hữu ích khi xây dựng các biến thể **create** và **update** trên cùng một kiểu. Ví dụ, biến thể **create** có thể yêu cầu tất cả các trường, trong khi biến thể **update** có thể làm cho tất cả các trường trở thành tùy chọn.

Nest cung cấp hàm tiện ích `PartialType()` để làm cho nhiệm vụ này dễ dàng hơn và giảm thiểu mã lặp lại.

Hàm `PartialType()` trả về một kiểu (lớp) với tất cả các thuộc tính của kiểu đầu vào được đặt thành tùy chọn. Ví dụ, giả sử chúng ta có một kiểu **create** như sau:

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

Theo mặc định, tất cả các trường này đều bắt buộc. Để tạo một kiểu với các trường giống nhau, nhưng mỗi trường đều là tùy chọn, sử dụng `PartialType()` truyền tham chiếu lớp (`CreateCatDto`) làm đối số:

```typescript
export class UpdateCatDto extends PartialType(CreateCatDto) {}
```

> info **Gợi ý** Hàm `PartialType()` được import từ gói `@nestjs/mapped-types`.

Hàm `PickType()` tạo một kiểu mới (lớp) bằng cách chọn một tập hợp các thuộc tính từ một kiểu đầu vào. Ví dụ, giả sử chúng ta bắt đầu với một kiểu như:

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

Chúng ta có thể chọn một tập hợp các thuộc tính từ lớp này bằng cách sử dụng hàm tiện ích `PickType()`:

```typescript
export class UpdateCatAgeDto extends PickType(CreateCatDto, ['age'] as const) {}
```

> info **Gợi ý** Hàm `PickType()` được import từ gói `@nestjs/mapped-types`.

Hàm `OmitType()` tạo một kiểu bằng cách chọn tất cả các thuộc tính từ một kiểu đầu vào và sau đó loại bỏ một tập hợp các khóa cụ thể. Ví dụ, giả sử chúng ta bắt đầu với một kiểu như:

```typescript
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

Chúng ta có thể tạo ra một kiểu dẫn xuất có mọi thuộc tính **ngoại trừ** `name` như được hiển thị bên dưới. Trong cấu trúc này, đối số thứ hai của `OmitType` là một mảng các tên thuộc tính.

```typescript
export class UpdateCatDto extends OmitType(CreateCatDto, ['name'] as const) {}
```

> info **Gợi ý** Hàm `OmitType()` được import từ gói `@nestjs/mapped-types`.

Hàm `IntersectionType()` kết hợp hai kiểu thành một kiểu mới (lớp). Ví dụ, giả sử chúng ta bắt đầu với hai kiểu như:

```typescript
export class CreateCatDto {
  name: string;
  breed: string;
}

export class AdditionalCatInfo {
  color: string;
}
```

Chúng ta có thể tạo ra một kiểu mới kết hợp tất cả các thuộc tính trong cả hai kiểu.

```typescript
export class UpdateCatDto extends IntersectionType(CreateCatDto, AdditionalCatInfo) {}
```

> info **Gợi ý** Hàm `IntersectionType()` được import từ gói `@nestjs/mapped-types`.

Các hàm tiện ích ánh xạ kiểu có thể kết hợp với nhau. Ví dụ, đoạn mã sau sẽ tạo ra một kiểu (lớp) có tất cả các thuộc tính của kiểu `CreateCatDto` ngoại trừ `name`, và các thuộc tính đó sẽ được đặt thành tùy chọn:

```typescript
export class UpdateCatDto extends PartialType(OmitType(CreateCatDto, ['name'] as const)) {}
```

#### Phân tích và xác thực mảng (Parsing and validating arrays)

TypeScript không lưu trữ metadata về generics hoặc interfaces, vì vậy khi bạn sử dụng chúng trong DTO của mình, `ValidationPipe` có thể không thể xác thực đúng dữ liệu đến. Ví dụ, trong đoạn mã sau, `createUserDtos` sẽ không được xác thực chính xác:

```typescript
@Post()
createBulk(@Body() createUserDtos: CreateUserDto[]) {
  return 'This action adds new users';
}
```

Để xác thực mảng, hãy tạo một lớp riêng biệt chứa một thuộc tính bao bọc mảng, hoặc sử dụng `ParseArrayPipe`.

```typescript
@Post()
createBulk(
  @Body(new ParseArrayPipe({ items: CreateUserDto }))
  createUserDtos: CreateUserDto[],
) {
  return 'This action adds new users';
}
```

Ngoài ra, `ParseArrayPipe` có thể hữu ích khi phân tích các tham số truy vấn. Hãy xem xét một phương thức `findByIds()` trả về người dùng dựa trên các định danh được truyền dưới dạng tham số truy vấn.

```typescript
@Get()
findByIds(
  @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
  ids: number[],
) {
  return 'This action returns users by ids';
}
```

Cấu trúc này xác thực các tham số truy vấn đến từ một yêu cầu HTTP `GET` như sau:

```bash
GET /?ids=1,2,3
```

#### WebSockets và Microservices

Mặc dù chương này cho thấy các ví dụ sử dụng ứng dụng kiểu HTTP (ví dụ: Express hoặc Fastify), `ValidationPipe` hoạt động giống nhau cho WebSockets và microservices, bất kể phương thức truyền tải nào được sử dụng.

#### Tìm hiểu thêm (Learn more)

Đọc thêm về các trình xác thực tùy chỉnh, thông báo lỗi và các decorator có sẵn được cung cấp bởi gói `class-validator` [tại đây](https://github.com/typestack/class-validator).
