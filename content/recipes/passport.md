### Passport (xác thực)

[Passport](https://github.com/jaredhanson/passport) là thư viện xác thực node.js phổ biến nhất, được cộng đồng biết đến rộng rãi và được sử dụng thành công trong nhiều ứng dụng sản xuất. Rất dễ dàng để tích hợp thư viện này với ứng dụng **Nest** bằng cách sử dụng module `@nestjs/passport`. Ở mức độ cao, Passport thực hiện một loạt các bước để:

- Xác thực người dùng bằng cách xác minh "thông tin đăng nhập" của họ (như tên người dùng/mật khẩu, JSON Web Token ([JWT](https://jwt.io/)), hoặc token nhận dạng từ Nhà cung cấp Nhận dạng)
- Quản lý trạng thái đã xác thực (bằng cách cấp một token di động, như JWT, hoặc tạo một [phiên Express](https://github.com/expressjs/session))
- Đính kèm thông tin về người dùng đã xác thực vào đối tượng `Request` để sử dụng trong các trình xử lý route

Passport có một hệ sinh thái phong phú các [chiến lược](http://www.passportjs.org/) thực hiện các cơ chế xác thực khác nhau. Mặc dù đơn giản về khái niệm, tập hợp các chiến lược Passport mà bạn có thể chọn là rất lớn và đa dạng. Passport trừu tượng hóa các bước đa dạng này thành một mô hình tiêu chuẩn, và module `@nestjs/passport` bao bọc và chuẩn hóa mô hình này thành các cấu trúc Nest quen thuộc.

Trong chương này, chúng ta sẽ triển khai một giải pháp xác thực hoàn chỉnh từ đầu đến cuối cho một máy chủ API RESTful sử dụng các module mạnh mẽ và linh hoạt này. Bạn có thể sử dụng các khái niệm được mô tả ở đây để triển khai bất kỳ chiến lược Passport nào để tùy chỉnh cơ chế xác thực của bạn. Bạn có thể làm theo các bước trong chương này để xây dựng ví dụ hoàn chỉnh này.

#### Yêu cầu xác thực (Authentication requirements)

Hãy cụ thể hóa các yêu cầu của chúng ta. Đối với trường hợp sử dụng này, khách hàng sẽ bắt đầu bằng cách xác thực với tên người dùng và mật khẩu. Sau khi xác thực, máy chủ sẽ cấp một JWT có thể được gửi như một [bearer token trong header authorization](https://tools.ietf.org/html/rfc6750) trên các yêu cầu tiếp theo để chứng minh xác thực. Chúng ta cũng sẽ tạo một route được bảo vệ chỉ có thể truy cập được bởi các yêu cầu chứa JWT hợp lệ.

Chúng ta sẽ bắt đầu với yêu cầu đầu tiên: xác thực người dùng. Sau đó, chúng ta sẽ mở rộng bằng cách cấp JWT. Cuối cùng, chúng ta sẽ tạo một route được bảo vệ kiểm tra JWT hợp lệ trên yêu cầu.

Đầu tiên, chúng ta cần cài đặt các gói cần thiết. Passport cung cấp một chiến lược gọi là [passport-local](https://github.com/jaredhanson/passport-local) triển khai cơ chế xác thực tên người dùng/mật khẩu, phù hợp với nhu cầu của chúng ta cho phần này của trường hợp sử dụng.

```bash
$ npm install --save @nestjs/passport passport passport-local
$ npm install --save-dev @types/passport-local
```

> warning **Lưu ý** Đối với **bất kỳ** chiến lược Passport nào bạn chọn, bạn sẽ luôn cần các gói `@nestjs/passport` và `passport`. Sau đó, bạn sẽ cần cài đặt gói cụ thể cho chiến lược (ví dụ: `passport-jwt` hoặc `passport-local`) triển khai cơ chế xác thực cụ thể mà bạn đang xây dựng. Ngoài ra, bạn cũng có thể cài đặt các định nghĩa kiểu cho bất kỳ chiến lược Passport nào, như được hiển thị ở trên với `@types/passport-local`, cung cấp hỗ trợ khi viết mã TypeScript.

#### Triển khai chiến lược Passport (Implementing Passport strategies)

Chúng ta đã sẵn sàng để triển khai tính năng xác thực. Chúng ta sẽ bắt đầu với một cái nhìn tổng quan về quá trình được sử dụng cho **bất kỳ** chiến lược Passport nào. Rất hữu ích khi nghĩ về Passport như một mini framework. Sự thanh lịch của framework này là nó trừu tượng hóa quá trình xác thực thành một vài bước cơ bản mà bạn tùy chỉnh dựa trên chiến lược bạn đang triển khai. Nó giống như một framework vì bạn cấu hình nó bằng cách cung cấp các tham số tùy chỉnh (dưới dạng đối tượng JSON thuần túy) và mã tùy chỉnh dưới dạng các hàm callback, mà Passport gọi vào thời điểm thích hợp. Module `@nestjs/passport` bao bọc framework này trong một gói kiểu Nest, làm cho nó dễ dàng tích hợp vào ứng dụng Nest. Chúng ta sẽ sử dụng `@nestjs/passport` bên dưới, nhưng trước tiên hãy xem xét cách **Passport thuần** hoạt động.

Trong Passport thuần, bạn cấu hình một chiến lược bằng cách cung cấp hai thứ:

1. Một tập hợp các tùy chọn cụ thể cho chiến lược đó. Ví dụ, trong chiến lược JWT, bạn có thể cung cấp một bí mật để ký các token.
2. Một "callback xác minh", nơi bạn cho Passport biết cách tương tác với kho lưu trữ người dùng của bạn (nơi bạn quản lý tài khoản người dùng). Ở đây, bạn xác minh liệu một người dùng tồn tại (và/hoặc tạo một người dùng mới), và liệu thông tin đăng nhập của họ có hợp lệ hay không. Thư viện Passport mong đợi callback này trả về một người dùng đầy đủ nếu xác thực thành công, hoặc null nếu thất bại (thất bại được định nghĩa là hoặc người dùng không được tìm thấy, hoặc, trong trường hợp passport-local, mật khẩu không khớp).

Với `@nestjs/passport`, bạn cấu hình một chiến lược Passport bằng cách mở rộng lớp `PassportStrategy`. Bạn truyền các tùy chọn chiến lược (mục 1 ở trên) bằng cách gọi phương thức `super()` trong lớp con của bạn, tùy chọn truyền vào một đối tượng tùy chọn. Bạn cung cấp callback xác minh (mục 2 ở trên) bằng cách triển khai phương thức `validate()` trong lớp con của bạn.

Chúng ta sẽ bắt đầu bằng cách tạo một `AuthModule` và trong đó, một `AuthService`:

```bash
$ nest g module auth
$ nest g service auth
```

Khi chúng ta triển khai `AuthService`, chúng ta sẽ thấy nó hữu ích để đóng gói các hoạt động người dùng trong một `UsersService`, vì vậy hãy tạo module và service đó ngay bây giờ:

```bash
$ nest g module users
$ nest g service users
```

Thay thế nội dung mặc định của các tệp được tạo này như hiển thị bên dưới. Đối với ứng dụng mẫu của chúng ta, `UsersService` chỉ duy trì một danh sách người dùng cứng trong bộ nhớ và một phương thức tìm kiếm để truy xuất một người dùng theo tên người dùng. Trong một ứng dụng thực tế, đây là nơi bạn sẽ xây dựng mô hình người dùng và lớp lưu trữ của bạn, sử dụng thư viện của bạn (ví dụ: TypeORM, Sequelize, Mongoose, v.v.).

```typescript
@@filename(users/users.service)
import { Injectable } from '@nestjs/common';

// Đây nên là một lớp/interface thực tế đại diện cho một thực thể người dùng
export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }
}
@@switch
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor() {
    this.users = [
      {
        userId: 1,
        username: 'john',
        password: 'changeme',
      },
      {
        userId: 2,
        username: 'maria',
        password: 'guess',
      },
    ];
  }

  async findOne(username) {
    return this.users.find(user => user.username === username);
  }
}
```

Trong `UsersModule`, thay đổi duy nhất cần thiết là thêm `UsersService` vào mảng exports của decorator `@Module` để nó có thể nhìn thấy bên ngoài module này (chúng ta sẽ sớm sử dụng nó trong `AuthService` của chúng ta).

```typescript
@@filename(users/users.module)
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
@@switch
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

`AuthService` của chúng ta có nhiệm vụ truy xuất một người dùng và xác minh mật khẩu. Chúng ta tạo một phương thức `validateUser()` cho mục đích này. Trong mã bên dưới, chúng ta sử dụng toán tử spread tiện lợi của ES6 để loại bỏ thuộc tính password khỏi đối tượng user trước khi trả về nó. Chúng ta sẽ gọi vào phương thức `validateUser()` từ chiến lược Passport local của chúng ta trong một lúc nữa.

```typescript
@@filename(auth/auth.service)
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}
```

> Cảnh báo **Cảnh báo** Tất nhiên trong một ứng dụng thực tế, bạn sẽ không lưu trữ mật khẩu dưới dạng văn bản thuần túy. Thay vào đó, bạn sẽ sử dụng một thư viện như [bcrypt](https://github.com/kelektiv/node.bcrypt.js#readme), với thuật toán băm một chiều có thêm salt. Với cách tiếp cận đó, bạn chỉ lưu trữ các mật khẩu đã được băm, và sau đó so sánh mật khẩu đã lưu trữ với phiên bản đã băm của mật khẩu **đầu vào**, do đó không bao giờ lưu trữ hoặc tiết lộ mật khẩu người dùng dưới dạng văn bản thuần túy. Để giữ cho ứng dụng mẫu của chúng ta đơn giản, chúng ta vi phạm quy tắc tuyệt đối đó và sử dụng văn bản thuần túy. **Đừng làm điều này trong ứng dụng thực tế của bạn!**

Bây giờ, chúng ta cập nhật `AuthModule` của mình để import `UsersModule`.

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
})
export class AuthModule {}
```

#### Triển khai Passport local (Implementing Passport local)

Bây giờ chúng ta có thể triển khai **chiến lược xác thực local** của Passport. Tạo một file có tên `local.strategy.ts` trong thư mục `auth`, và thêm mã sau:

```typescript
@@filename(auth/local.strategy)
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
@@switch
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Dependencies } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
@Dependencies(AuthService)
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(authService) {
    super();
    this.authService = authService;
  }

  async validate(username, password) {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

Chúng ta đã tuân theo công thức được mô tả trước đó cho tất cả các chiến lược Passport. Trong trường hợp sử dụng của chúng ta với passport-local, không có tùy chọn cấu hình nào, vì vậy constructor của chúng ta chỉ đơn giản gọi `super()`, mà không có đối tượng tùy chọn.

> info **Gợi ý** Chúng ta có thể truyền một đối tượng tùy chọn trong lệnh gọi `super()` để tùy chỉnh hành vi của chiến lược passport. Trong ví dụ này, chiến lược passport-local mặc định mong đợi các thuộc tính có tên `username` và `password` trong phần thân yêu cầu. Truyền một đối tượng tùy chọn để chỉ định các tên thuộc tính khác, ví dụ: `super({{ '{' }} usernameField: 'email' {{ '}' }})`. Xem [tài liệu Passport](http://www.passportjs.org/docs/configure/) để biết thêm thông tin.

Chúng ta cũng đã triển khai phương thức `validate()`. Đối với mỗi chiến lược, Passport sẽ gọi hàm xác minh (được triển khai với phương thức `validate()` trong `@nestjs/passport`) sử dụng một bộ tham số phù hợp với chiến lược cụ thể. Đối với chiến lược local, Passport mong đợi một phương thức `validate()` với chữ ký sau: `validate(username: string, password:string): any`.

Phần lớn công việc xác thực được thực hiện trong `AuthService` của chúng ta (với sự giúp đỡ của `UsersService`), vì vậy phương thức này khá đơn giản. Phương thức `validate()` cho **bất kỳ** chiến lược Passport nào sẽ tuân theo một mẫu tương tự, chỉ khác biệt trong chi tiết về cách thông tin xác thực được biểu diễn. Nếu tìm thấy người dùng và thông tin xác thực hợp lệ, người dùng được trả về để Passport có thể hoàn thành các nhiệm vụ của nó (ví dụ: tạo thuộc tính `user` trên đối tượng `Request`), và pipeline xử lý yêu cầu có thể tiếp tục. Nếu không tìm thấy, chúng ta ném ra một ngoại lệ và để <a href="exception-filters">lớp xử lý ngoại lệ</a> của chúng ta xử lý nó.

Thông thường, sự khác biệt đáng kể duy nhất trong phương thức `validate()` cho mỗi chiến lược là **cách** bạn xác định xem một người dùng có tồn tại và hợp lệ hay không. Ví dụ, trong chiến lược JWT, tùy thuộc vào yêu cầu, chúng ta có thể đánh giá xem `userId` được mang trong token đã giải mã có khớp với một bản ghi trong cơ sở dữ liệu người dùng của chúng ta hay không, hoặc khớp với danh sách các token bị thu hồi. Do đó, mẫu phân lớp và triển khai xác thực cụ thể cho chiến lược này là nhất quán, thanh lịch và có thể mở rộng.

Chúng ta cần cấu hình `AuthModule` của mình để sử dụng các tính năng Passport mà chúng ta vừa định nghĩa. Cập nhật `auth.module.ts` để trông như sau:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [UsersModule, PassportModule],
  providers: [AuthService, LocalStrategy],
})
export class AuthModule {}
```

#### Các Guards tích hợp của Passport (Built-in Passport Guards)

Chương <a href="guards">Guards</a> mô tả chức năng chính của Guards: xác định liệu một yêu cầu sẽ được xử lý bởi trình xử lý route hay không. Điều đó vẫn đúng, và chúng ta sẽ sớm sử dụng khả năng tiêu chuẩn đó. Tuy nhiên, trong bối cảnh sử dụng module `@nestjs/passport`, chúng ta cũng sẽ giới thiệu một chi tiết mới nhỏ có thể ban đầu gây nhầm lẫn, vì vậy hãy thảo luận về nó ngay bây giờ. Hãy xem xét rằng ứng dụng của bạn có thể tồn tại trong hai trạng thái, từ góc độ xác thực:

1. người dùng/khách hàng **không** đăng nhập (chưa được xác thực)
2. người dùng/khách hàng **đã** đăng nhập (đã được xác thực)

Trong trường hợp đầu tiên (người dùng chưa đăng nhập), chúng ta cần thực hiện hai chức năng riêng biệt:

- Hạn chế các route mà người dùng chưa xác thực có thể truy cập (tức là, từ chối truy cập vào các route bị hạn chế). Chúng ta sẽ sử dụng Guards trong khả năng quen thuộc của chúng để xử lý chức năng này, bằng cách đặt một Guard trên các route được bảo vệ. Như bạn có thể dự đoán, chúng ta sẽ kiểm tra sự hiện diện của một JWT hợp lệ trong Guard này, vì vậy chúng ta sẽ làm việc trên Guard này sau, khi chúng ta đã phát hành JWT thành công.

- Bắt đầu **bước xác thực** khi một người dùng chưa xác thực trước đó cố gắng đăng nhập. Đây là bước mà chúng ta sẽ **phát hành** một JWT cho một người dùng hợp lệ. Suy nghĩ về điều này trong một khoảnh khắc, chúng ta biết rằng chúng ta sẽ cần `POST` thông tin xác thực tên người dùng/mật khẩu để bắt đầu xác thực, vì vậy chúng ta sẽ thiết lập một route `POST /auth/login` để xử lý điều đó. Điều này đặt ra câu hỏi: làm thế nào chính xác chúng ta gọi chiến lược passport-local trong route đó?

Câu trả lời rất đơn giản: bằng cách sử dụng một loại Guard khác, hơi khác một chút. Module `@nestjs/passport` cung cấp cho chúng ta một Guard tích hợp sẵn làm điều này cho chúng ta. Guard này gọi chiến lược Passport và khởi động các bước được mô tả ở trên (lấy thông tin xác thực, chạy hàm xác minh, tạo thuộc tính `user`, v.v.).

Trường hợp thứ hai được liệt kê ở trên (người dùng đã đăng nhập) chỉ đơn giản dựa vào loại Guard tiêu chuẩn mà chúng ta đã thảo luận để cho phép truy cập vào các route được bảo vệ cho người dùng đã đăng nhập.

<app-banner-courses-auth></app-banner-courses-auth>

#### Route đăng nhập (Login route)

Với chiến lược đã được thiết lập, chúng ta có thể triển khai một route `/auth/login` cơ bản và áp dụng Guard tích hợp sẵn để khởi động luồng passport-local.

Mở file `app.controller.ts` và thay thế nội dung của nó bằng đoạn mã sau:

```typescript
@@filename(app.controller)
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  async login(@Request() req) {
    return req.user;
  }
}
@@switch
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  @UseGuards(AuthGuard('local'))
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return req.user;
  }
}
```

Với `@UseGuards(AuthGuard('local'))`, chúng ta đang sử dụng một `AuthGuard` mà `@nestjs/passport` **tự động cung cấp** cho chúng ta khi chúng ta mở rộng chiến lược passport-local. Hãy phân tích điều đó. Chiến lược Passport local của chúng ta có tên mặc định là `'local'`. Chúng ta tham chiếu tên đó trong decorator `@UseGuards()` để liên kết nó với mã được cung cấp bởi gói `passport-local`. Điều này được sử dụng để phân biệt chiến lược nào cần gọi trong trường hợp chúng ta có nhiều chiến lược Passport trong ứng dụng của mình (mỗi chiến lược có thể cung cấp một `AuthGuard` cụ thể cho chiến lược đó). Mặc dù chúng ta chỉ có một chiến lược như vậy cho đến nay, chúng ta sẽ sớm thêm một chiến lược thứ hai, vì vậy điều này cần thiết để phân biệt.

Để kiểm tra route của chúng ta, chúng ta sẽ để route `/auth/login` chỉ đơn giản trả về người dùng cho bây giờ. Điều này cũng cho phép chúng ta minh họa một tính năng khác của Passport: Passport tự động tạo một đối tượng `user`, dựa trên giá trị chúng ta trả về từ phương thức `validate()`, và gán nó cho đối tượng `Request` như `req.user`. Sau này, chúng ta sẽ thay thế điều này bằng mã để tạo và trả về một JWT thay vào đó.

Vì đây là các route API, chúng ta sẽ kiểm tra chúng bằng thư viện [cURL](https://curl.haxx.se/) thường có sẵn. Bạn có thể kiểm tra với bất kỳ đối tượng `user` nào được hard-code trong `UsersService`.

```bash
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # result -> {"userId":1,"username":"john"}
```

Mặc dù điều này hoạt động, việc truyền trực tiếp tên chiến lược vào `AuthGuard()` đưa các chuỗi ma thuật vào codebase. Thay vào đó, chúng tôi khuyên bạn nên tạo lớp của riêng bạn, như được hiển thị bên dưới:

```typescript
@@filename(auth/local-auth.guard)
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

Bây giờ, chúng ta có thể cập nhật trình xử lý route `/auth/login` và sử dụng `LocalAuthGuard` thay thế:

```typescript
@UseGuards(LocalAuthGuard)
@Post('auth/login')
async login(@Request() req) {
  return req.user;
}
```

#### Chức năng JWT (JWT functionality)

Chúng ta đã sẵn sàng chuyển sang phần JWT của hệ thống xác thực của chúng ta. Hãy xem xét và tinh chỉnh các yêu cầu của chúng ta:

- Cho phép người dùng xác thực bằng tên người dùng/mật khẩu, trả về JWT để sử dụng trong các cuộc gọi tiếp theo đến các endpoint API được bảo vệ. Chúng ta đang trên đường đáp ứng yêu cầu này. Để hoàn thành nó, chúng ta sẽ cần viết mã phát hành JWT.
- Tạo các route API được bảo vệ dựa trên sự hiện diện của một JWT hợp lệ như một bearer token

Chúng ta sẽ cần cài đặt thêm một vài gói để hỗ trợ các yêu cầu JWT của chúng ta:

```bash
$ npm install --save @nestjs/jwt passport-jwt
$ npm install --save-dev @types/passport-jwt
```

Gói `@nestjs/jwt` (xem thêm [tại đây](https://github.com/nestjs/jwt)) là một gói tiện ích giúp thao tác với JWT. Gói `passport-jwt` là gói Passport triển khai chiến lược JWT và `@types/passport-jwt` cung cấp các định nghĩa kiểu TypeScript.

Hãy xem xét kỹ hơn cách một yêu cầu `POST /auth/login` được xử lý. Chúng ta đã trang trí route bằng cách sử dụng `AuthGuard` tích hợp được cung cấp bởi chiến lược passport-local. Điều này có nghĩa là:

1. Trình xử lý route **chỉ được gọi nếu người dùng đã được xác thực**
2. Tham số `req` sẽ chứa một thuộc tính `user` (được Passport điền vào trong quá trình xác thực passport-local)

Với điều này trong đầu, chúng ta cuối cùng có thể tạo một JWT thực sự và trả về nó trong route này. Để giữ cho các dịch vụ của chúng ta được module hóa một cách gọn gàng, chúng ta sẽ xử lý việc tạo JWT trong `authService`. Mở file `auth.service.ts` trong thư mục `auth`, thêm phương thức `login()`, và import `JwtService` như được hiển thị:

```typescript
@@filename(auth/auth.service)
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async validateUser(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user) {
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

Chúng ta đang sử dụng thư viện `@nestjs/jwt`, cung cấp một hàm `sign()` để tạo JWT từ một tập hợp con các thuộc tính của đối tượng `user`, sau đó chúng ta trả về dưới dạng một đối tượng đơn giản với một thuộc tính `access_token` duy nhất. Lưu ý: chúng ta chọn tên thuộc tính `sub` để giữ giá trị `userId` của chúng ta để phù hợp với tiêu chuẩn JWT. Đừng quên tiêm provider JwtService vào `AuthService`.

Bây giờ chúng ta cần cập nhật `AuthModule` để import các phụ thuộc mới và cấu hình `JwtModule`.

Đầu tiên, tạo `constants.ts` trong thư mục `auth`, và thêm mã sau:

```typescript
@@filename(auth/constants)
export const jwtConstants = {
  secret: 'ĐỪNG SỬ DỤNG GIÁ TRỊ NÀY. THAY VÀO ĐÓ, TẠO MỘT BÍ MẬT PHỨC TẠP VÀ GIỮ NÓ AN TOÀN BÊN NGOÀI MÃ NGUỒN.',
};
@@switch
export const jwtConstants = {
  secret: 'ĐỪNG SỬ DỤNG GIÁ TRỊ NÀY. THAY VÀO ĐÓ, TẠO MỘT BÍ MẬT PHỨC TẠP VÀ GIỮ NÓ AN TOÀN BÊN NGOÀI MÃ NGUỒN.',
};
```

Chúng ta sẽ sử dụng điều này để chia sẻ khóa của chúng ta giữa các bước ký và xác minh JWT.

> Cảnh báo **Cảnh báo** **Không tiết lộ khóa này công khai**. Chúng tôi đã làm như vậy ở đây để làm rõ những gì mã đang làm, nhưng trong một hệ thống sản xuất **bạn phải bảo vệ khóa này** bằng các biện pháp thích hợp như kho bí mật, biến môi trường, hoặc dịch vụ cấu hình.

Bây giờ, mở `auth.module.ts` trong thư mục `auth` và cập nhật nó để trông như thế này:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

Chúng ta cấu hình `JwtModule` bằng cách sử dụng `register()`, truyền vào một đối tượng cấu hình. Xem [tại đây](https://github.com/nestjs/jwt/blob/master/README.md) để biết thêm về `JwtModule` của Nest và [tại đây](https://github.com/auth0/node-jsonwebtoken#usage) để biết thêm chi tiết về các tùy chọn cấu hình có sẵn.

Bây giờ chúng ta có thể cập nhật route `/auth/login` để trả về một JWT.

```typescript
@@filename(app.controller)
import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }
}
@@switch
import { Controller, Bind, Request, Post, UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }
}
```

Hãy tiếp tục và kiểm tra các route của chúng ta bằng cURL một lần nữa. Bạn có thể kiểm tra với bất kỳ đối tượng `user` nào được hard-code trong `UsersService`.

```bash
$ # POST to /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # kết quả -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Lưu ý: JWT ở trên đã bị cắt ngắn
```

#### Triển khai Passport JWT (Implementing Passport JWT)

Bây giờ chúng ta có thể giải quyết yêu cầu cuối cùng của mình: bảo vệ các endpoint bằng cách yêu cầu một JWT hợp lệ phải có mặt trong yêu cầu. Passport cũng có thể giúp chúng ta ở đây. Nó cung cấp chiến lược [passport-jwt](https://github.com/mikenicholson/passport-jwt) để bảo mật các endpoint RESTful bằng JSON Web Tokens. Bắt đầu bằng cách tạo một file có tên `jwt.strategy.ts` trong thư mục `auth`, và thêm mã sau:

```typescript
@@filename(auth/jwt.strategy)
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
@@switch
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

Với `JwtStrategy` của chúng ta, chúng ta đã tuân theo cùng một công thức được mô tả trước đó cho tất cả các chiến lược Passport. Chiến lược này yêu cầu một số khởi tạo, vì vậy chúng ta thực hiện điều đó bằng cách truyền một đối tượng tùy chọn trong lệnh gọi `super()`. Bạn có thể đọc thêm về các tùy chọn có sẵn [tại đây](https://github.com/mikenicholson/passport-jwt#configure-strategy). Trong trường hợp của chúng ta, các tùy chọn này là:

- `jwtFromRequest`: cung cấp phương thức mà JWT sẽ được trích xuất từ `Request`. Chúng ta sẽ sử dụng cách tiếp cận tiêu chuẩn là cung cấp một bearer token trong header Authorization của các yêu cầu API của chúng ta. Các tùy chọn khác được mô tả [tại đây](https://github.com/mikenicholson/passport-jwt#extracting-the-jwt-from-the-request).
- `ignoreExpiration`: chỉ để rõ ràng, chúng ta chọn cài đặt mặc định `false`, điều này ủy quyền trách nhiệm đảm bảo rằng JWT chưa hết hạn cho module Passport. Điều này có nghĩa là nếu route của chúng ta được cung cấp một JWT đã hết hạn, yêu cầu sẽ bị từ chối và một phản hồi `401 Unauthorized` sẽ được gửi. Passport xử lý điều này tự động một cách thuận tiện cho chúng ta.
- `secretOrKey`: chúng ta đang sử dụng tùy chọn thuận tiện là cung cấp một bí mật đối xứng để ký token. Các tùy chọn khác, chẳng hạn như khóa công khai được mã hóa PEM, có thể phù hợp hơn cho các ứng dụng sản xuất (xem [tại đây](https://github.com/mikenicholson/passport-jwt#configure-strategy) để biết thêm thông tin). Trong mọi trường hợp, như đã cảnh báo trước đó, **không tiết lộ bí mật này công khai**.

Phương thức `validate()` đáng được thảo luận. Đối với chiến lược jwt, Passport trước tiên xác minh chữ ký của JWT và giải mã JSON. Sau đó, nó gọi phương thức `validate()` của chúng ta, truyền JSON đã giải mã làm tham số duy nhất. Dựa trên cách ký JWT hoạt động, **chúng ta được đảm bảo rằng chúng ta đang nhận được một token hợp lệ** mà chúng ta đã ký trước đó và cấp cho một người dùng hợp lệ.

Kết quả của tất cả điều này, phản hồi của chúng ta cho callback `validate()` là rất đơn giản: chúng ta chỉ đơn giản trả về một đối tượng chứa các thuộc tính `userId` và `username`. Nhắc lại rằng Passport sẽ xây dựng một đối tượng `user` dựa trên giá trị trả về của phương thức `validate()` của chúng ta, và gắn nó như một thuộc tính trên đối tượng `Request`.

Cũng đáng để chỉ ra rằng cách tiếp cận này để lại cho chúng ta không gian ('hooks' như nó vốn có) để đưa logic kinh doanh khác vào quy trình. Ví dụ, chúng ta có thể thực hiện một tra cứu cơ sở dữ liệu trong phương thức `validate()` của chúng ta để trích xuất thêm thông tin về người dùng, dẫn đến một đối tượng `user` phong phú hơn có sẵn trong `Request` của chúng ta. Đây cũng là nơi chúng ta có thể quyết định thực hiện xác thực token thêm, chẳng hạn như tra cứu `userId` trong danh sách các token bị thu hồi, cho phép chúng ta thực hiện thu hồi token. Mô hình chúng ta đã triển khai ở đây trong mã mẫu của chúng ta là một mô hình JWT "không trạng thái" nhanh chóng, trong đó mỗi cuộc gọi API được ủy quyền ngay lập tức dựa trên sự hiện diện của một JWT hợp lệ, và một ít thông tin về người yêu cầu (userId và username của nó) có sẵn trong pipeline Request của chúng ta.

Thêm `JwtStrategy` mới như một provider trong `AuthModule`:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

Bằng cách import cùng một secret được sử dụng khi chúng ta ký JWT, chúng ta đảm bảo rằng giai đoạn **xác minh** được thực hiện bởi Passport và giai đoạn **ký** được thực hiện trong AuthService của chúng ta sử dụng một secret chung.

Cuối cùng, chúng ta định nghĩa lớp `JwtAuthGuard` mở rộng từ `AuthGuard` có sẵn:

```typescript
@@filename(auth/jwt-auth.guard)
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### Triển khai route được bảo vệ và JWT strategy guards (Implement protected route and JWT strategy guards)

Bây giờ chúng ta có thể triển khai route được bảo vệ và Guard liên quan.

Mở file `app.controller.ts` và cập nhật nó như sau:

```typescript
@@filename(app.controller)
import { Controller, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
@@switch
import { Controller, Dependencies, Bind, Get, Request, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { LocalAuthGuard } from './auth/local-auth.guard';
import { AuthService } from './auth/auth.service';

@Dependencies(AuthService)
@Controller()
export class AppController {
  constructor(authService) {
    this.authService = authService;
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  @Bind(Request())
  async login(req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Bind(Request())
  getProfile(req) {
    return req.user;
  }
}
```

Một lần nữa, chúng ta đang áp dụng `AuthGuard` mà module `@nestjs/passport` đã tự động cung cấp cho chúng ta khi chúng ta cấu hình module passport-jwt. Guard này được tham chiếu bằng tên mặc định của nó, `jwt`. Khi route `GET /profile` của chúng ta được truy cập, Guard sẽ tự động gọi strategy passport-jwt tùy chỉnh đã được cấu hình, xác thực JWT, và gán thuộc tính `user` cho đối tượng `Request`.

Đảm bảo ứng dụng đang chạy và kiểm tra các route bằng `cURL`.

```bash
$ # GET /profile
$ curl http://localhost:3000/profile
$ # kết quả -> {"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
$ # kết quả -> {"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm... }

$ # GET /profile sử dụng access_token được trả về từ bước trước như bearer code
$ curl http://localhost:3000/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
$ # kết quả -> {"userId":1,"username":"john"}
```

Lưu ý rằng trong `AuthModule`, chúng ta đã cấu hình JWT có thời gian hết hạn là `60 giây`. Đây có thể là thời gian hết hạn quá ngắn, và việc xử lý chi tiết về hết hạn token và làm mới nằm ngoài phạm vi của bài viết này. Tuy nhiên, chúng tôi đã chọn điều đó để minh họa một đặc tính quan trọng của JWT và strategy passport-jwt. Nếu bạn đợi 60 giây sau khi xác thực trước khi cố gắng gửi yêu cầu `GET /profile`, bạn sẽ nhận được phản hồi `401 Unauthorized`. Điều này là do Passport tự động kiểm tra thời gian hết hạn của JWT, giúp bạn không phải làm điều đó trong ứng dụng của mình.

Bây giờ chúng ta đã hoàn thành việc triển khai xác thực JWT. Các client JavaScript (như Angular/React/Vue) và các ứng dụng JavaScript khác giờ đây có thể xác thực và giao tiếp an toàn với API Server của chúng ta.

#### Mở rộng guards (Extending guards)

Trong hầu hết các trường hợp, sử dụng lớp `AuthGuard` được cung cấp là đủ. Tuy nhiên, có thể có những trường hợp bạn muốn đơn giản là mở rộng xử lý lỗi mặc định hoặc logic xác thực. Để làm điều này, bạn có thể mở rộng lớp có sẵn và ghi đè các phương thức trong một lớp con.

```typescript
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Thêm logic xác thực tùy chỉnh của bạn ở đây
    // ví dụ, gọi super.logIn(request) để thiết lập một phiên.
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Bạn có thể ném ra một ngoại lệ dựa trên đối số "info" hoặc "err"
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

Ngoài việc mở rộng xử lý lỗi mặc định và logic xác thực, chúng ta có thể cho phép xác thực đi qua một chuỗi các strategy. Strategy đầu tiên thành công, chuyển hướng hoặc lỗi sẽ dừng chuỗi. Các lỗi xác thực sẽ tiếp tục qua từng strategy theo thứ tự, cuối cùng sẽ thất bại nếu tất cả các strategy đều thất bại.

```typescript
export class JwtAuthGuard extends AuthGuard(['strategy_jwt_1', 'strategy_jwt_2', '...']) { ... }
```

#### Bật xác thực toàn cục (Enable authentication globally)

Nếu phần lớn các endpoint của bạn nên được bảo vệ mặc định, bạn có thể đăng ký guard xác thực như một [global guard](/guards#binding-guards) và thay vì sử dụng decorator `@UseGuards()` ở trên mỗi controller, bạn có thể đơn giản là đánh dấu những route nào nên là công khai.

Đầu tiên, đăng ký `JwtAuthGuard` như một global guard bằng cách sử dụng cấu trúc sau (trong bất kỳ module nào):

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

Với điều này, Nest sẽ tự động gắn `JwtAuthGuard` vào tất cả các endpoint.

Bây giờ chúng ta phải cung cấp một cơ chế để khai báo các route là công khai. Để làm điều này, chúng ta có thể tạo một decorator tùy chỉnh bằng cách sử dụng hàm tạo decorator `SetMetadata`.

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Trong file trên, chúng ta đã xuất hai hằng số. Một là khóa metadata của chúng ta có tên `IS_PUBLIC_KEY`, và cái còn lại là decorator mới của chúng ta mà chúng ta sẽ gọi là `Public` (bạn có thể đặt tên thay thế là `SkipAuth` hoặc `AllowAnon`, tùy theo dự án của bạn).

Bây giờ chúng ta có một decorator `@Public()` tùy chỉnh, chúng ta có thể sử dụng nó để trang trí bất kỳ phương thức nào, như sau:

```typescript
@Public()
@Get()
findAll() {
  return [];
}
```

Cuối cùng, chúng ta cần `JwtAuthGuard` trả về `true` khi tìm thấy metadata `"isPublic"`. Để làm điều này, chúng ta sẽ sử dụng lớp `Reflector` (đọc thêm [tại đây](/guards#putting-it-all-together)).

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
```

#### Các chiến lược phạm vi yêu cầu (Request-scoped strategies)

API của passport dựa trên việc đăng ký các chiến lược vào phiên bản toàn cục của thư viện. Do đó, các chiến lược không được thiết kế để có các tùy chọn phụ thuộc vào yêu cầu hoặc được khởi tạo động cho mỗi yêu cầu (đọc thêm về các [nhà cung cấp phạm vi yêu cầu](/fundamentals/injection-scopes)). Khi bạn cấu hình chiến lược của mình ở phạm vi yêu cầu, Nest sẽ không bao giờ khởi tạo nó vì nó không gắn với bất kỳ route cụ thể nào. Không có cách nào để xác định những chiến lược "phạm vi yêu cầu" nào nên được thực thi cho mỗi yêu cầu.

Tuy nhiên, có các cách để giải quyết động các nhà cung cấp phạm vi yêu cầu trong chiến lược. Để làm điều này, chúng ta tận dụng tính năng [tham chiếu module](/fundamentals/module-ref).

Đầu tiên, mở file `local.strategy.ts` và tiêm `ModuleRef` theo cách thông thường:

```typescript
constructor(private moduleRef: ModuleRef) {
  super({
    passReqToCallback: true,
  });
}
```

> info **Gợi ý** Lớp `ModuleRef` được import từ gói `@nestjs/core`.

Đảm bảo đặt thuộc tính cấu hình `passReqToCallback` thành `true`, như được hiển thị ở trên.

Trong bước tiếp theo, phiên bản yêu cầu sẽ được sử dụng để lấy định danh ngữ cảnh hiện tại, thay vì tạo một cái mới (đọc thêm về ngữ cảnh yêu cầu [tại đây](/fundamentals/module-ref#getting-current-sub-tree)).

Bây giờ, bên trong phương thức `validate()` của lớp `LocalStrategy`, sử dụng phương thức `getByRequest()` của lớp `ContextIdFactory` để tạo một id ngữ cảnh dựa trên đối tượng yêu cầu, và truyền nó vào lệnh gọi `resolve()`:

```typescript
async validate(
  request: Request,
  username: string,
  password: string,
) {
  const contextId = ContextIdFactory.getByRequest(request);
  // "AuthService" là một nhà cung cấp phạm vi yêu cầu
  const authService = await this.moduleRef.resolve(AuthService, contextId);
  ...
}
```

Trong ví dụ trên, phương thức `resolve()` sẽ trả về bất đồng bộ phiên bản phạm vi yêu cầu của nhà cung cấp `AuthService` (chúng ta giả định rằng `AuthService` được đánh dấu là một nhà cung cấp phạm vi yêu cầu).

#### Tùy chỉnh Passport (Customize Passport)

Bất kỳ tùy chọn tùy chỉnh Passport tiêu chuẩn nào cũng có thể được truyền theo cách tương tự, sử dụng phương thức `register()`. Các tùy chọn có sẵn phụ thuộc vào chiến lược đang được triển khai. Ví dụ:

```typescript
PassportModule.register({ session: true });
```

Bạn cũng có thể truyền các chiến lược một đối tượng tùy chọn trong hàm tạo của chúng để cấu hình chúng.
Đối với chiến lược local, bạn có thể truyền ví dụ:

```typescript
constructor(private authService: AuthService) {
  super({
    usernameField: 'email',
    passwordField: 'password',
  });
}
```

Hãy xem [Website chính thức của Passport](http://www.passportjs.org/docs/oauth/) để biết tên các thuộc tính.

#### Các chiến lược có tên (Named strategies)

Khi triển khai một chiến lược, bạn có thể cung cấp một tên cho nó bằng cách truyền đối số thứ hai cho hàm `PassportStrategy`. Nếu bạn không làm điều này, mỗi chiến lược sẽ có một tên mặc định (ví dụ: 'jwt' cho jwt-strategy):

```typescript
export class JwtStrategy extends PassportStrategy(Strategy, 'myjwt')
```

Sau đó, bạn tham chiếu đến nó thông qua một decorator như `@UseGuards(AuthGuard('myjwt'))`.

#### GraphQL

Để sử dụng AuthGuard với [GraphQL](https://docs.nestjs.com/graphql/quick-start), hãy mở rộng lớp AuthGuard có sẵn và ghi đè phương thức getRequest().

```typescript
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

Để lấy người dùng đã xác thực hiện tại trong resolver graphql của bạn, bạn có thể định nghĩa một decorator `@CurrentUser()`:

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const ctx = GqlExecutionContext.create(context);
  return ctx.getContext().req.user;
});
```

Để sử dụng decorator trên trong resolver của bạn, hãy đảm bảo bao gồm nó như một tham số của truy vấn hoặc mutation của bạn:

```typescript
@Query(returns => User)
@UseGuards(GqlAuthGuard)
whoAmI(@CurrentUser() user: User) {
  return this.usersService.findById(user.id);
}
```
