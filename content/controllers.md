### Bộ điều khiển (Controllers)

Các bộ điều khiển chịu trách nhiệm xử lý các **yêu cầu** đến và trả về **phản hồi** cho máy khách.

<figure><img src="/assets/Controllers_1.png" /></figure>

Mục đích của một bộ điều khiển là nhận các yêu cầu cụ thể cho ứng dụng. Cơ chế **định tuyến** kiểm soát bộ điều khiển nào nhận được yêu cầu nào. Thường thì mỗi bộ điều khiển có nhiều hơn một route, và các route khác nhau có thể thực hiện các hành động khác nhau.

Để tạo một bộ điều khiển cơ bản, chúng ta sử dụng các lớp và **decorators**. Decorators liên kết các lớp với metadata cần thiết và cho phép Nest tạo một bản đồ định tuyến (kết nối yêu cầu với các bộ điều khiển tương ứng).

> info **Gợi ý** Để nhanh chóng tạo một bộ điều khiển CRUD với [validation](https://docs.nestjs.com/techniques/validation) tích hợp sẵn, bạn có thể sử dụng [CRUD generator](https://docs.nestjs.com/recipes/crud-generator#crud-generator) của CLI: `nest g resource [name]`.

#### Định tuyến (Routing)

Trong ví dụ sau, chúng ta sẽ sử dụng decorator `@Controller()`, điều này là **bắt buộc** để định nghĩa một bộ điều khiển cơ bản. Chúng ta sẽ chỉ định một tiền tố đường dẫn tùy chọn là `cats`. Sử dụng tiền tố đường dẫn trong decorator `@Controller()` cho phép chúng ta dễ dàng nhóm một tập hợp các route liên quan và giảm thiểu mã lặp lại. Ví dụ, chúng ta có thể chọn nhóm một tập hợp các route quản lý tương tác với thực thể mèo dưới route `/cats`. Trong trường hợp đó, chúng ta có thể chỉ định tiền tố đường dẫn `cats` trong decorator `@Controller()` để không phải lặp lại phần đường dẫn đó cho mỗi route trong tệp.

```typescript
@@filename(cats.controller)
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(): string {
    return 'Hành động này trả về tất cả mèo';
  }
}
@@switch
import { Controller, Get } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  findAll() {
    return 'Hành động này trả về tất cả mèo';
  }
}
```

> info **Gợi ý** Để tạo một bộ điều khiển bằng CLI, chỉ cần thực thi lệnh `$ nest g controller [name]`.

Decorator phương thức yêu cầu HTTP `@Get()` trước phương thức `findAll()` cho Nest biết để tạo một trình xử lý cho một điểm cuối cụ thể cho các yêu cầu HTTP. Điểm cuối tương ứng với phương thức yêu cầu HTTP (GET trong trường hợp này) và đường dẫn route. Đường dẫn route là gì? Đường dẫn route cho một trình xử lý được xác định bằng cách nối tiền tố (tùy chọn) được khai báo cho bộ điều khiển và bất kỳ đường dẫn nào được chỉ định trong decorator của phương thức. Vì chúng ta đã khai báo một tiền tố cho mọi route (`cats`), và không thêm bất kỳ thông tin đường dẫn nào trong decorator, Nest sẽ ánh xạ các yêu cầu `GET /cats` đến trình xử lý này. Như đã đề cập, đường dẫn bao gồm cả tiền tố đường dẫn tùy chọn của bộ điều khiển **và** bất kỳ chuỗi đường dẫn nào được khai báo trong decorator phương thức yêu cầu. Ví dụ, tiền tố đường dẫn `cats` kết hợp với decorator `@Get('breed')` sẽ tạo ra một ánh xạ route cho các yêu cầu như `GET /cats/breed`.

Trong ví dụ trên của chúng ta, khi một yêu cầu GET được thực hiện đến điểm cuối này, Nest định tuyến yêu cầu đến phương thức `findAll()` do người dùng định nghĩa. Lưu ý rằng tên phương thức mà chúng ta chọn ở đây là hoàn toàn tùy ý. Chúng ta rõ ràng phải khai báo một phương thức để liên kết route với, nhưng Nest không gắn bất kỳ ý nghĩa nào cho tên phương thức được chọn.

Phương thức này sẽ trả về mã trạng thái 200 và phản hồi liên quan, trong trường hợp này chỉ là một chuỗi. Tại sao điều đó xảy ra? Để giải thích, chúng ta sẽ đầu tiên giới thiệu khái niệm rằng Nest sử dụng hai **tùy chọn khác nhau** để thao tác phản hồi:

<table>
  <tr>
    <td>Tiêu chuẩn (khuyến nghị)</td>
    <td>
      Sử dụng phương pháp tích hợp này, khi một trình xử lý yêu cầu trả về một đối tượng hoặc mảng JavaScript, nó sẽ <strong>tự động</strong> được chuyển đổi thành JSON. Tuy nhiên, khi nó trả về một kiểu dữ liệu nguyên thủy JavaScript (ví dụ: <code>string</code>, <code>number</code>, <code>boolean</code>), Nest sẽ chỉ gửi giá trị đó mà không cố gắng chuyển đổi nó. Điều này làm cho việc xử lý phản hồi trở nên đơn giản: chỉ cần trả về giá trị, và Nest sẽ lo phần còn lại.
      <br />
      <br /> Hơn nữa, <strong>mã trạng thái</strong> của phản hồi luôn là 200 theo mặc định, ngoại trừ các yêu cầu POST sử dụng 201. Chúng ta có thể dễ dàng thay đổi hành vi này bằng cách thêm decorator <code>@HttpCode(...)</code> ở cấp độ trình xử lý (xem <a href='controllers#status-code'>Mã trạng thái</a>).
    </td>
  </tr>
  <tr>
    <td>Đặc thù cho thư viện</td>
    <td>
      Chúng ta có thể sử dụng <a href="https://expressjs.com/en/api.html#res" rel="nofollow" target="_blank">đối tượng phản hồi</a> đặc thù cho thư viện (ví dụ: Express), có thể được tiêm vào bằng cách sử dụng decorator <code>@Res()</code> trong chữ ký của phương thức xử lý (ví dụ: <code>findAll(@Res() response)</code>). Với cách tiếp cận này, bạn có khả năng sử dụng các phương thức xử lý phản hồi gốc được hiển thị bởi đối tượng đó. Ví dụ, với Express, bạn có thể xây dựng phản hồi bằng mã như <code>response.status(200).send()</code>.
    </td>
  </tr>
</table>

> warning **Cảnh báo** Nest phát hiện khi trình xử lý đang sử dụng `@Res()` hoặc `@Next()`, cho biết bạn đã chọn tùy chọn đặc thù cho thư viện. Nếu cả hai cách tiếp cận được sử dụng cùng một lúc, cách tiếp cận Tiêu chuẩn sẽ **tự động bị vô hiệu hóa** cho route duy nhất này và sẽ không còn hoạt động như mong đợi. Để sử dụng cả hai cách tiếp cận cùng một lúc (ví dụ, bằng cách tiêm đối tượng phản hồi để chỉ đặt cookies/headers nhưng vẫn để phần còn lại cho framework), bạn phải đặt tùy chọn `passthrough` thành `true` trong decorator `@Res({{ '{' }} passthrough: true {{ '}' }})`.

<app-banner-devtools></app-banner-devtools>

#### Đối tượng yêu cầu (Request object)

Các trình xử lý thường cần truy cập vào chi tiết **yêu cầu** của máy khách. Nest cung cấp quyền truy cập vào [đối tượng yêu cầu](https://expressjs.com/en/api.html#req) của nền tảng cơ bản (Express theo mặc định). Chúng ta có thể truy cập đối tượng yêu cầu bằng cách hướng dẫn Nest tiêm nó bằng cách thêm decorator `@Req()` vào chữ ký của trình xử lý.

```typescript
@@filename(cats.controller)
import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('cats')
export class CatsController {
  @Get()
  findAll(@Req() request: Request): string {
    return 'Hành động này trả về tất cả mèo';
  }
}
@@switch
import { Controller, Bind, Get, Req } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Get()
  @Bind(Req())
  findAll(request) {
    return 'Hành động này trả về tất cả mèo';
  }
}
```

> info **Gợi ý** Để tận dụng các kiểu dữ liệu của `express` (như trong ví dụ tham số `request: Request` ở trên), cài đặt gói `@types/express`.

Đối tượng yêu cầu đại diện cho yêu cầu HTTP và có các thuộc tính cho chuỗi truy vấn yêu cầu, tham số, tiêu đề HTTP và phần thân (đọc thêm [tại đây](https://expressjs.com/en/api.html#req)). Trong hầu hết các trường hợp, không cần thiết phải lấy các thuộc tính này một cách thủ công. Thay vào đó, chúng ta có thể sử dụng các decorator chuyên dụng như `@Body()` hoặc `@Query()`, có sẵn ngay trong hộp. Dưới đây là danh sách các decorator được cung cấp và các đối tượng nền tảng cụ thể mà chúng đại diện.

<table>
  <tbody>
    <tr>
      <td><code>@Request(), @Req()</code></td>
      <td><code>req</code></td></tr>
    <tr>
      <td><code>@Response(), @Res()</code><span class="table-code-asterisk">*</span></td>
      <td><code>res</code></td>
    </tr>
    <tr>
      <td><code>@Next()</code></td>
      <td><code>next</code></td>
    </tr>
    <tr>
      <td><code>@Session()</code></td>
      <td><code>req.session</code></td>
    </tr>
    <tr>
      <td><code>@Param(key?: string)</code></td>
      <td><code>req.params</code> / <code>req.params[key]</code></td>
    </tr>
    <tr>
      <td><code>@Body(key?: string)</code></td>
      <td><code>req.body</code> / <code>req.body[key]</code></td>
    </tr>
    <tr>
      <td><code>@Query(key?: string)</code></td>
      <td><code>req.query</code> / <code>req.query[key]</code></td>
    </tr>
    <tr>
      <td><code>@Headers(name?: string)</code></td>
      <td><code>req.headers</code> / <code>req.headers[name]</code></td>
    </tr>
    <tr>
      <td><code>@Ip()</code></td>
      <td><code>req.ip</code></td>
    </tr>
    <tr>
      <td><code>@HostParam()</code></td>
      <td><code>req.hosts</code></td>
    </tr>
  </tbody>
</table>

<sup>\* </sup>Để tương thích với kiểu dữ liệu trên các nền tảng HTTP cơ bản (ví dụ: Express và Fastify), Nest cung cấp các decorator `@Res()` và `@Response()`. `@Res()` chỉ đơn giản là một bí danh cho `@Response()`. Cả hai đều trực tiếp hiển thị giao diện đối tượng `response` gốc của nền tảng cơ bản. Khi sử dụng chúng, bạn cũng nên import các kiểu dữ liệu cho thư viện cơ bản (ví dụ: `@types/express`) để tận dụng tối đa. Lưu ý rằng khi bạn tiêm `@Res()` hoặc `@Response()` vào một phương thức xử lý, bạn đặt Nest vào chế độ **Đặc thù cho thư viện** cho trình xử lý đó, và bạn trở nên chịu trách nhiệm quản lý phản hồi. Khi làm như vậy, bạn phải phát hành một số loại phản hồi bằng cách thực hiện cuộc gọi trên đối tượng `response` (ví dụ: `res.json(...)` hoặc `res.send(...)`), nếu không máy chủ HTTP sẽ bị treo.

> info **Gợi ý** Để tìm hiểu cách tạo các decorator tùy chỉnh của riêng bạn, hãy truy cập chương [này](/custom-decorators).

#### Tài nguyên (Resources)

Trước đó, chúng ta đã định nghĩa một điểm cuối để lấy tài nguyên mèo (route **GET**). Thông thường, chúng ta cũng muốn cung cấp một điểm cuối tạo ra các bản ghi mới. Để làm điều này, hãy tạo trình xử lý **POST**:

```typescript
@@filename(cats.controller)
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create(): string {
    return 'Hành động này thêm một con mèo mới';
  }

  @Get()
  findAll(): string {
    return 'Hành động này trả về tất cả mèo';
  }
}
@@switch
import { Controller, Get, Post } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  create() {
    return 'Hành động này thêm một con mèo mới';
  }

  @Get()
  findAll() {
    return 'Hành động này trả về tất cả mèo';
  }
}
```

Nó đơn giản như vậy. Nest cung cấp các decorator cho tất cả các phương thức HTTP tiêu chuẩn: `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`, `@Options()`, và `@Head()`. Ngoài ra, `@All()` định nghĩa một điểm cuối xử lý tất cả chúng.

#### Ký tự đại diện cho route (Route wildcards)

Các route dựa trên mẫu cũng được hỗ trợ. Ví dụ, dấu hoa thị được sử dụng như một ký tự đại diện và sẽ khớp với bất kỳ sự kết hợp ký tự nào.

```typescript
@Get('ab*cd')
findAll() {
  return 'Route này sử dụng một ký tự đại diện';
}
```

Đường dẫn route `'ab*cd'` sẽ khớp với `abcd`, `ab_cd`, `abecd`, và vân vân. Các ký tự `?`, `+`, `*`, và `()` có thể được sử dụng trong đường dẫn route và là các tập con của các đối tác biểu thức chính quy của chúng. Dấu gạch ngang ( `-`) và dấu chấm (`.`) được hiểu theo nghĩa đen bởi các đường dẫn dựa trên chuỗi.

> warning **Cảnh báo** Một ký tự đại diện ở giữa route chỉ được hỗ trợ bởi express.

#### Mã trạng thái (Status code)

Như đã đề cập, mã **trạng thái** phản hồi luôn là **200** theo mặc định, ngoại trừ các yêu cầu POST là **201**. Chúng ta có thể dễ dàng thay đổi hành vi này bằng cách thêm decorator `@HttpCode(...)` ở cấp độ trình xử lý.

```typescript
@Post()
@HttpCode(204)
create() {
  return 'Hành động này thêm một con mèo mới';
}
```

> info **Gợi ý** Import `HttpCode` từ gói `@nestjs/common`.

Thường xuyên, mã trạng thái của bạn không phải là tĩnh mà phụ thuộc vào nhiều yếu tố. Trong trường hợp đó, bạn có thể sử dụng đối tượng **phản hồi** đặc thù cho thư viện (tiêm bằng `@Res()`) (hoặc, trong trường hợp lỗi, ném một ngoại lệ).

#### Tiêu đề (Headers)

Để chỉ định một tiêu đề phản hồi tùy chỉnh, bạn có thể sử dụng decorator `@Header()` hoặc đối tượng phản hồi đặc thù cho thư viện (và gọi `res.header()` trực tiếp).

```typescript
@Post()
@Header('Cache-Control', 'none')
create() {
  return 'Hành động này thêm một con mèo mới';
}
```

> info **Gợi ý** Import `Header` từ gói `@nestjs/common`.

#### Chuyển hướng (Redirection)

Để chuyển hướng phản hồi đến một URL cụ thể, bạn có thể sử dụng decorator `@Redirect()` hoặc đối tượng phản hồi đặc thù cho thư viện (và gọi `res.redirect()` trực tiếp).

`@Redirect()` nhận hai đối số, `url` và `statusCode`, cả hai đều là tùy chọn. Giá trị mặc định của `statusCode` là `302` (`Found`) nếu bỏ qua.

```typescript
@Get()
@Redirect('https://nestjs.com', 301)
```

> info **Gợi ý** Đôi khi bạn có thể muốn xác định mã trạng thái HTTP hoặc URL chuyển hướng một cách động. Làm điều này bằng cách trả về một đối tượng tuân theo giao diện `HttpRedirectResponse` (từ `@nestjs/common`).

Các giá trị được trả về sẽ ghi đè lên bất kỳ đối số nào được truyền cho decorator `@Redirect()`. Ví dụ:

```typescript
@Get('docs')
@Redirect('https://docs.nestjs.com', 302)
getDocs(@Query('version') version) {
  if (version && version === '5') {
    return { url: 'https://docs.nestjs.com/v5/' };
  }
}
```

#### Tham số route (Route parameters)

Các route với đường dẫn tĩnh sẽ không hoạt động khi bạn cần chấp nhận **dữ liệu động** như một phần của yêu cầu (ví dụ: `GET /cats/1` để lấy mèo có id `1`). Để định nghĩa các route với tham số, chúng ta có thể thêm các **token** tham số route vào đường dẫn của route để bắt giá trị động tại vị trí đó trong URL yêu cầu. Token tham số route trong decorator `@Get()` trong ví dụ dưới đây minh họa cách sử dụng này. Các tham số route được khai báo theo cách này có thể được truy cập bằng cách sử dụng decorator `@Param()`, cần được thêm vào chữ ký của phương thức.

> info **Gợi ý** Các route có tham số nên được khai báo sau bất kỳ đường dẫn tĩnh nào. Điều này ngăn chặn các đường dẫn có tham số chặn lưu lượng dành cho các đường dẫn tĩnh.

```typescript
@@filename()
@Get(':id')
findOne(@Param() params: any): string {
  console.log(params.id);
  return `Hành động này trả về một con mèo #${params.id}`;
}
@@switch
@Get(':id')
@Bind(Param())
findOne(params) {
  console.log(params.id);
  return `Hành động này trả về một con mèo #${params.id}`;
}
```

`@Param()` được sử dụng để trang trí một tham số phương thức (`params` trong ví dụ trên), và làm cho các tham số **route** có sẵn như các thuộc tính của tham số phương thức được trang trí đó bên trong thân phương thức. Như thấy trong mã trên, chúng ta có thể truy cập tham số `id` bằng cách tham chiếu đến `params.id`. Bạn cũng có thể truyền một token tham số cụ thể vào decorator và sau đó tham chiếu trực tiếp đến tham số route theo tên trong thân phương thức.

> info **Gợi ý** Import `Param` từ gói `@nestjs/common`.

```typescript
@@filename()
@Get(':id')
findOne(@Param('id') id: string): string {
  return `Hành động này trả về một con mèo #${id}`;
}
@@switch
@Get(':id')
@Bind(Param('id'))
findOne(id) {
  return `Hành động này trả về một con mèo #${id}`;
}
```

#### Định tuyến Sub-Domain (Sub-Domain Routing)

Decorator `@Controller` có thể nhận một tùy chọn `host` để yêu cầu host HTTP của các yêu cầu đến phải khớp với một giá trị cụ thể nào đó.

```typescript
@Controller({ host: 'admin.example.com' })
export class AdminController {
  @Get()
  index(): string {
    return 'Trang quản trị';
  }
}
```

> **Cảnh báo** Vì **Fastify** thiếu hỗ trợ cho các bộ định tuyến lồng nhau, khi sử dụng định tuyến sub-domain, nên sử dụng bộ chuyển đổi Express (mặc định) thay thế.

Tương tự như đường dẫn `route`, tùy chọn `hosts` có thể sử dụng các token để bắt giá trị động tại vị trí đó trong tên host. Token tham số host trong decorator `@Controller()` trong ví dụ dưới đây minh họa cách sử dụng này. Các tham số host được khai báo theo cách này có thể được truy cập bằng cách sử dụng decorator `@HostParam()`, cần được thêm vào chữ ký của phương thức.

```typescript
@Controller({ host: ':account.example.com' })
export class AccountController {
  @Get()
  getInfo(@HostParam('account') account: string) {
    return account;
  }
}
```

#### Phạm vi (Scopes)

Đối với những người đến từ nền tảng lập trình khác nhau, có thể không ngờ rằng trong Nest, hầu như mọi thứ đều được chia sẻ giữa các yêu cầu đến. Chúng ta có một pool kết nối đến cơ sở dữ liệu, các dịch vụ singleton với trạng thái toàn cục, v.v. Hãy nhớ rằng Node.js không tuân theo Mô hình Đa luồng Phi trạng thái Yêu cầu/Phản hồi trong đó mỗi yêu cầu được xử lý bởi một luồng riêng biệt. Do đó, việc sử dụng các thể hiện singleton là hoàn toàn **an toàn** cho các ứng dụng của chúng ta.

Tuy nhiên, có những trường hợp cực đoan khi vòng đời của bộ điều khiển dựa trên yêu cầu có thể là hành vi mong muốn, ví dụ như bộ nhớ đệm dựa trên yêu cầu trong các ứng dụng GraphQL, theo dõi yêu cầu hoặc đa thuê. Tìm hiểu cách kiểm soát phạm vi [tại đây](/fundamentals/injection-scopes).

#### Bất đồng bộ (Asynchronicity)

Chúng ta yêu thích JavaScript hiện đại và chúng ta biết rằng việc trích xuất dữ liệu chủ yếu là **bất đồng bộ**. Đó là lý do tại sao Nest hỗ trợ và hoạt động tốt với các hàm `async`.

> info **Gợi ý** Tìm hiểu thêm về tính năng `async / await` [tại đây](https://kamilmysliwiec.com/typescript-2-1-introduction-async-await)

Mọi hàm bất đồng bộ phải trả về một `Promise`. Điều này có nghĩa là bạn có thể trả về một giá trị trì hoãn mà Nest sẽ có thể tự giải quyết. Hãy xem một ví dụ về điều này:

```typescript
@@filename(cats.controller)
@Get()
async findAll(): Promise<any[]> {
  return [];
}
@@switch
@Get()
async findAll() {
  return [];
}
```

Mã trên là hoàn toàn hợp lệ. Hơn nữa, các trình xử lý route của Nest thậm chí còn mạnh mẽ hơn khi có thể trả về [observable streams](https://rxjs-dev.firebaseapp.com/guide/observable) RxJS. Nest sẽ tự động đăng ký vào nguồn bên dưới và lấy giá trị cuối cùng được phát ra (một khi stream hoàn thành).

```typescript
@@filename(cats.controller)
@Get()
findAll(): Observable<any[]> {
  return of([]);
}
@@switch
@Get()
findAll() {
  return of([]);
}
```

Cả hai cách tiếp cận trên đều hoạt động và bạn có thể sử dụng bất kỳ cách nào phù hợp với yêu cầu của bạn.

Tất nhiên, tôi sẽ dịch nội dung sang tiếng Việt nhưng vẫn giữ nguyên định dạng markdown. Dưới đây là bản dịch:

#### Tải trọng yêu cầu (Request payloads)

Ví dụ trước đây của chúng ta về bộ xử lý route POST không chấp nhận bất kỳ tham số nào từ phía khách hàng. Hãy sửa điều này bằng cách thêm decorator `@Body()` vào đây.

Nhưng trước tiên (nếu bạn sử dụng TypeScript), chúng ta cần xác định lược đồ **DTO** (Data Transfer Object). DTO là một đối tượng xác định cách dữ liệu sẽ được gửi qua mạng. Chúng ta có thể xác định lược đồ DTO bằng cách sử dụng các giao diện **TypeScript**, hoặc bằng các lớp đơn giản. Thú vị là, chúng tôi khuyên bạn nên sử dụng **lớp** ở đây. Tại sao? Lớp là một phần của tiêu chuẩn JavaScript ES6, và do đó chúng được giữ nguyên như các thực thể thật trong JavaScript đã được biên dịch. Mặt khác, vì giao diện TypeScript bị xóa trong quá trình chuyển đổi, Nest không thể tham chiếu đến chúng trong thời gian chạy. Điều này rất quan trọng vì các tính năng như **Pipes** cho phép các khả năng bổ sung khi chúng có quyền truy cập vào metatype của biến trong thời gian chạy.

Hãy tạo lớp `CreateCatDto`:

```typescript
@@filename(create-cat.dto)
export class CreateCatDto {
  name: string;
  age: number;
  breed: string;
}
```

Nó chỉ có ba thuộc tính cơ bản. Sau đó, chúng ta có thể sử dụng DTO mới tạo này bên trong `CatsController`:

```typescript
@@filename(cats.controller)
@Post()
async create(@Body() createCatDto: CreateCatDto) {
  return 'Hành động này thêm một con mèo mới';
}
@@switch
@Post()
@Bind(Body())
async create(createCatDto) {
  return 'Hành động này thêm một con mèo mới';
}
```

> info **Gợi ý** `ValidationPipe` của chúng ta có thể lọc ra các thuộc tính không nên được nhận bởi phương thức xử lý. Trong trường hợp này, chúng ta có thể liệt kê các thuộc tính được chấp nhận, và bất kỳ thuộc tính nào không được bao gồm trong danh sách trắng sẽ tự động bị loại bỏ khỏi đối tượng kết quả. Trong ví dụ `CreateCatDto`, danh sách trắng của chúng ta là các thuộc tính `name`, `age`, và `breed`. Tìm hiểu thêm [tại đây](https://docs.nestjs.com/techniques/validation#stripping-properties).

#### Xử lý lỗi (Handling errors)

Có một chương riêng về xử lý lỗi (tức là làm việc với ngoại lệ) [tại đây](/exception-filters).

#### Mẫu tài nguyên đầy đủ (Full resource sample)

Dưới đây là một ví dụ sử dụng một số decorator có sẵn để tạo một controller cơ bản. Controller này hiển thị một vài phương thức để truy cập và thao tác dữ liệu nội bộ.

```typescript
@@filename(cats.controller)
import { Controller, Get, Query, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CreateCatDto, UpdateCatDto, ListAllEntities } from './dto';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Body() createCatDto: CreateCatDto) {
    return 'Hành động này thêm một con mèo mới';
  }

  @Get()
  findAll(@Query() query: ListAllEntities) {
    return `Hành động này trả về tất cả mèo (giới hạn: ${query.limit} mục)`;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return `Hành động này trả về một con mèo #${id}`;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
    return `Hành động này cập nhật một con mèo #${id}`;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return `Hành động này xóa một con mèo #${id}`;
  }
}
@@switch
import { Controller, Get, Query, Post, Body, Put, Param, Delete, Bind } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  @Bind(Body())
  create(createCatDto) {
    return 'Hành động này thêm một con mèo mới';
  }

  @Get()
  @Bind(Query())
  findAll(query) {
    console.log(query);
    return `Hành động này trả về tất cả mèo (giới hạn: ${query.limit} mục)`;
  }

  @Get(':id')
  @Bind(Param('id'))
  findOne(id) {
    return `Hành động này trả về một con mèo #${id}`;
  }

  @Put(':id')
  @Bind(Param('id'), Body())
  update(id, updateCatDto) {
    return `Hành động này cập nhật một con mèo #${id}`;
  }

  @Delete(':id')
  @Bind(Param('id'))
  remove(id) {
    return `Hành động này xóa một con mèo #${id}`;
  }
}
```

> info **Gợi ý** Nest CLI cung cấp một trình tạo (schematic) tự động tạo **tất cả mã boilerplate** để giúp chúng ta tránh phải làm tất cả những điều này, và làm cho trải nghiệm của nhà phát triển đơn giản hơn nhiều. Đọc thêm về tính năng này [tại đây](/recipes/crud-generator).

#### Khởi động và chạy (Getting up and running)

Với controller đã được định nghĩa đầy đủ ở trên, Nest vẫn chưa biết rằng `CatsController` tồn tại và do đó sẽ không tạo một thể hiện của lớp này.

Các controller luôn thuộc về một module, đó là lý do tại sao chúng ta bao gồm mảng `controllers` trong decorator `@Module()`. Vì chúng ta chưa định nghĩa bất kỳ module nào khác ngoài `AppModule` gốc, chúng ta sẽ sử dụng nó để giới thiệu `CatsController`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { CatsController } from './cats/cats.controller';

@Module({
  controllers: [CatsController],
})
export class AppModule {}
```

Chúng ta đã gắn metadata vào lớp module bằng cách sử dụng decorator `@Module()`, và bây giờ Nest có thể dễ dàng phản ánh các controller nào cần được gắn kết.

#### Phương pháp tiếp cận theo thư viện cụ thể (Library-specific approach)

Cho đến nay, chúng ta đã thảo luận về cách tiêu chuẩn của Nest để thao tác với các phản hồi. Cách thứ hai để thao tác phản hồi là sử dụng [đối tượng phản hồi](https://expressjs.com/en/api.html#res) cụ thể của thư viện. Để tiêm một đối tượng phản hồi cụ thể, chúng ta cần sử dụng decorator `@Res()`. Để thể hiện sự khác biệt, hãy viết lại `CatsController` như sau:

```typescript
@@filename()
import { Controller, Get, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Controller('cats')
export class CatsController {
  @Post()
  create(@Res() res: Response) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  findAll(@Res() res: Response) {
     res.status(HttpStatus.OK).json([]);
  }
}
@@switch
import { Controller, Get, Post, Bind, Res, Body, HttpStatus } from '@nestjs/common';

@Controller('cats')
export class CatsController {
  @Post()
  @Bind(Res(), Body())
  create(res, createCatDto) {
    res.status(HttpStatus.CREATED).send();
  }

  @Get()
  @Bind(Res())
  findAll(res) {
     res.status(HttpStatus.OK).json([]);
  }
}
```

Mặc dù phương pháp này hoạt động và thực sự cho phép linh hoạt hơn ở một số khía cạnh bằng cách cung cấp toàn quyền kiểm soát đối tượng phản hồi (thao tác headers, tính năng cụ thể của thư viện, v.v.), nó nên được sử dụng một cách cẩn thận. Nói chung, cách tiếp cận này kém rõ ràng hơn và có một số nhược điểm. Nhược điểm chính là code của bạn trở nên phụ thuộc vào nền tảng (vì các thư viện cơ bản có thể có API khác nhau trên đối tượng phản hồi), và khó kiểm tra hơn (bạn sẽ phải mock đối tượng phản hồi, v.v.).

Ngoài ra, trong ví dụ trên, bạn mất khả năng tương thích với các tính năng của Nest phụ thuộc vào xử lý phản hồi tiêu chuẩn của Nest, chẳng hạn như Interceptors và decorators `@HttpCode()` / `@Header()`. Để khắc phục điều này, bạn có thể đặt tùy chọn `passthrough` thành `true`, như sau:

```typescript
@@filename()
@Get()
findAll(@Res({ passthrough: true }) res: Response) {
  res.status(HttpStatus.OK);
  return [];
}
@@switch
@Get()
@Bind(Res({ passthrough: true }))
findAll(res) {
  res.status(HttpStatus.OK);
  return [];
}
```

Bây giờ bạn có thể tương tác với đối tượng phản hồi gốc (ví dụ, đặt cookies hoặc headers tùy thuộc vào các điều kiện nhất định), nhưng để phần còn lại cho framework.
