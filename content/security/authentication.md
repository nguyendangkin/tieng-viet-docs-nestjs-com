### Xác thực (Authentication)

Xác thực là một phần **thiết yếu** của hầu hết các ứng dụng. Có nhiều cách tiếp cận và chiến lược khác nhau để xử lý xác thực. Cách tiếp cận cho bất kỳ dự án nào đều phụ thuộc vào yêu cầu cụ thể của ứng dụng đó. Chương này giới thiệu một số cách tiếp cận xác thực có thể được điều chỉnh cho nhiều yêu cầu khác nhau.

Hãy cụ thể hóa các yêu cầu của chúng ta. Đối với trường hợp sử dụng này, khách hàng sẽ bắt đầu bằng cách xác thực với tên người dùng và mật khẩu. Sau khi xác thực, máy chủ sẽ cấp một JWT có thể được gửi dưới dạng [bearer token](https://tools.ietf.org/html/rfc6750) trong tiêu đề ủy quyền trên các yêu cầu tiếp theo để chứng minh xác thực. Chúng ta cũng sẽ tạo một route được bảo vệ chỉ có thể truy cập được đối với các yêu cầu chứa JWT hợp lệ.

Chúng ta sẽ bắt đầu với yêu cầu đầu tiên: xác thực người dùng. Sau đó, chúng ta sẽ mở rộng bằng cách cấp JWT. Cuối cùng, chúng ta sẽ tạo một route được bảo vệ kiểm tra JWT hợp lệ trên yêu cầu.

#### Tạo module xác thực (Creating an authentication module)

Chúng ta sẽ bắt đầu bằng cách tạo một `AuthModule` và trong đó, một `AuthService` và một `AuthController`. Chúng ta sẽ sử dụng `AuthService` để triển khai logic xác thực và `AuthController` để hiển thị các endpoint xác thực.

```bash
$ nest g module auth
$ nest g controller auth
$ nest g service auth
```

Khi triển khai `AuthService`, chúng ta sẽ thấy rằng việc đóng gói các hoạt động của người dùng trong `UsersService` rất hữu ích, vì vậy hãy tạo module và service đó ngay bây giờ:

```bash
$ nest g module users
$ nest g service users
```

Thay thế nội dung mặc định của các tệp được tạo này như hiển thị bên dưới. Đối với ứng dụng mẫu của chúng ta, `UsersService` chỉ duy trì một danh sách người dùng được mã hóa cứng trong bộ nhớ và một phương thức tìm kiếm để truy xuất một người dùng theo tên người dùng. Trong một ứng dụng thực tế, đây là nơi bạn sẽ xây dựng mô hình người dùng và lớp lưu trữ của mình, sử dụng thư viện bạn chọn (ví dụ: TypeORM, Sequelize, Mongoose, v.v.).

```typescript
@@filename(users/users.service)
import { Injectable } from '@nestjs/common';

// Đây nên là một lớp/giao diện thực tế đại diện cho một thực thể người dùng
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

#### Triển khai endpoint "Đăng nhập" (Implementing the "Sign in" endpoint)

`AuthService` của chúng ta có nhiệm vụ truy xuất người dùng và xác minh mật khẩu. Chúng ta tạo một phương thức `signIn()` cho mục đích này. Trong đoạn mã bên dưới, chúng ta sử dụng toán tử spread ES6 tiện lợi để loại bỏ thuộc tính mật khẩu khỏi đối tượng người dùng trước khi trả về nó. Đây là một thực hành phổ biến khi trả về đối tượng người dùng, vì bạn không muốn tiết lộ các trường nhạy cảm như mật khẩu hoặc các khóa bảo mật khác.

```typescript
@@filename(auth/auth.service)
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signIn(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO: Tạo JWT và trả về nó ở đây
    // thay vì đối tượng người dùng
    return result;
  }
}
@@switch
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
@Dependencies(UsersService)
export class AuthService {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async signIn(username: string, pass: string) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const { password, ...result } = user;
    // TODO: Tạo JWT và trả về nó ở đây
    // thay vì đối tượng người dùng
    return result;
  }
}
```

> Cảnh báo **Cảnh báo** Tất nhiên trong một ứng dụng thực tế, bạn sẽ không lưu trữ mật khẩu dưới dạng văn bản thuần túy. Thay vào đó, bạn sẽ sử dụng một thư viện như [bcrypt](https://github.com/kelektiv/node.bcrypt.js#readme), với thuật toán băm một chiều có muối. Với cách tiếp cận đó, bạn chỉ lưu trữ mật khẩu đã được băm, và sau đó so sánh mật khẩu đã lưu trữ với phiên bản đã băm của mật khẩu **đến**, do đó không bao giờ lưu trữ hoặc tiết lộ mật khẩu người dùng dưới dạng văn bản thuần túy. Để giữ cho ứng dụng mẫu của chúng ta đơn giản, chúng ta vi phạm quy tắc tuyệt đối đó và sử dụng văn bản thuần túy. **Đừng làm điều này trong ứng dụng thực tế của bạn!**

Bây giờ, chúng ta cập nhật `AuthModule` của mình để import `UsersModule`.

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
```

Với điều này, hãy mở `AuthController` và thêm một phương thức `signIn()` vào nó. Phương thức này sẽ được gọi bởi khách hàng để xác thực người dùng. Nó sẽ nhận tên người dùng và mật khẩu trong phần thân yêu cầu, và sẽ trả về một token JWT nếu người dùng được xác thực.

```typescript
@@filename(auth/auth.controller)
import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
```

> Gợi ý **Gợi ý** Lý tưởng nhất, thay vì sử dụng kiểu `Record<string, any>`, chúng ta nên sử dụng một lớp DTO để xác định hình dạng của phần thân yêu cầu. Xem chương [validation](/techniques/validation) để biết thêm thông tin.

<app-banner-courses-auth></app-banner-courses-auth>

#### Token JWT (JWT token)

Chúng ta đã sẵn sàng chuyển sang phần JWT của hệ thống xác thực. Hãy xem xét và tinh chỉnh các yêu cầu của chúng ta:

- Cho phép người dùng xác thực bằng tên người dùng/mật khẩu, trả về JWT để sử dụng trong các cuộc gọi tiếp theo đến các endpoint API được bảo vệ. Chúng ta đang trên đường hoàn thành yêu cầu này. Để hoàn thành nó, chúng ta cần viết mã cấp JWT.
- Tạo các route API được bảo vệ dựa trên sự hiện diện của JWT hợp lệ như một bearer token

Chúng ta sẽ cần cài đặt thêm một gói để hỗ trợ các yêu cầu JWT của chúng ta:

```bash
$ npm install --save @nestjs/jwt
```

> Gợi ý **Gợi ý** Gói `@nestjs/jwt` (xem thêm [tại đây](https://github.com/nestjs/jwt)) là một gói tiện ích giúp thao tác với JWT. Điều này bao gồm tạo và xác minh các token JWT.

Để giữ cho các service của chúng ta được module hóa một cách rõ ràng, chúng ta sẽ xử lý việc tạo JWT trong `authService`. Mở file `auth.service.ts` trong thư mục `auth`, tiêm `JwtService`, và cập nhật phương thức `signIn` để tạo token JWT như hiển thị bên dưới:

```typescript
@@filename(auth/auth.service)
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { sub: user.userId, username: user.username };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
@@switch
import { Injectable, Dependencies, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Dependencies(UsersService, JwtService)
@Injectable()
export class AuthService {
  constructor(usersService, jwtService) {
    this.usersService = usersService;
    this.jwtService = jwtService;
  }

  async signIn(username, pass) {
    const user = await this.usersService.findOne(username);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    const payload = { username: user.username, sub: user.userId };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
```

Chúng ta đang sử dụng thư viện `@nestjs/jwt`, cung cấp hàm `signAsync()` để tạo JWT từ một tập con các thuộc tính của đối tượng `user`, sau đó chúng ta trả về dưới dạng một đối tượng đơn giản với một thuộc tính `access_token` duy nhất. Lưu ý: chúng ta chọn tên thuộc tính là `sub` để chứa giá trị `userId` để phù hợp với tiêu chuẩn JWT.

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

Bây giờ, mở `auth.module.ts` trong thư mục `auth` và cập nhật nó để trông giống như sau:

```typescript
@@filename(auth/auth.module)
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
@@switch
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

> Gợi ý **Gợi ý** Chúng ta đang đăng ký `JwtModule` là global để làm mọi thứ dễ dàng hơn cho chúng ta. Điều này có nghĩa là chúng ta không cần phải import `JwtModule` ở bất kỳ nơi nào khác trong ứng dụng của chúng ta.

Chúng ta cấu hình `JwtModule` bằng cách sử dụng `register()`, truyền vào một đối tượng cấu hình. Xem [tại đây](https://github.com/nestjs/jwt/blob/master/README.md) để biết thêm về `JwtModule` của Nest và [tại đây](https://github.com/auth0/node-jsonwebtoken#usage) để biết thêm chi tiết về các tùy chọn cấu hình có sẵn.

Hãy tiếp tục và kiểm tra các route của chúng ta bằng cách sử dụng cURL một lần nữa. Bạn có thể kiểm tra với bất kỳ đối tượng `user` nào được mã hóa cứng trong `UsersService`.

```bash
$ # POST đến /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
$ # Lưu ý: JWT ở trên đã được cắt ngắn
```

#### Triển khai guard xác thực (Implementing the authentication guard)

Bây giờ chúng ta có thể giải quyết yêu cầu cuối cùng: bảo vệ các endpoint bằng cách yêu cầu JWT hợp lệ phải có mặt trên yêu cầu. Chúng ta sẽ làm điều này bằng cách tạo một `AuthGuard` mà chúng ta có thể sử dụng để bảo vệ các route của mình.

```typescript
@@filename(auth/auth.guard)
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        {
          secret: jwtConstants.secret
        }
      );
      // 💡 Chúng ta đang gán payload cho đối tượng request ở đây
      // để chúng ta có thể truy cập nó trong các xử lý route của mình
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

Bây giờ chúng ta có thể triển khai route được bảo vệ của mình và đăng ký `AuthGuard` để bảo vệ nó.

Mở file `auth.controller.ts` và cập nhật nó như hiển thị bên dưới:

```typescript
@@filename(auth.controller)
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: Record<string, any>) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

Chúng ta đang áp dụng `AuthGuard` mà chúng ta vừa tạo cho route `GET /profile` để nó sẽ được bảo vệ.

Đảm bảo ứng dụng đang chạy, và kiểm tra các route bằng cách sử dụng `cURL`.

```bash
$ # GET /profile
$ curl http://localhost:3000/auth/profile
{"statusCode":401,"message":"Unauthorized"}

$ # POST /auth/login
$ curl -X POST http://localhost:3000/auth/login -d '{"username": "john", "password": "changeme"}' -H "Content-Type: application/json"
{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."}

$ # GET /profile sử dụng access_token trả về từ bước trước như bearer code
$ curl http://localhost:3000/auth/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2Vybm..."
{"sub":1,"username":"john","iat":...,"exp":...}
```

Lưu ý rằng trong `AuthModule`, chúng ta đã cấu hình JWT có thời gian hết hạn là `60 giây`. Đây là thời gian hết hạn quá ngắn, và việc xử lý chi tiết về hết hạn token và làm mới nằm ngoài phạm vi của bài viết này. Tuy nhiên, chúng tôi đã chọn điều đó để chứng minh một tính chất quan trọng của JWT. Nếu bạn đợi 60 giây sau khi xác thực trước khi cố gắng thực hiện yêu cầu `GET /auth/profile`, bạn sẽ nhận được phản hồi `401 Unauthorized`. Đây là bởi vì `@nestjs/jwt` tự động kiểm tra thời gian hết hạn của JWT, giúp bạn không phải làm điều đó trong ứng dụng của mình.

Bây giờ chúng ta đã hoàn thành việc triển khai xác thực JWT. Các client JavaScript (như Angular/React/Vue) và các ứng dụng JavaScript khác giờ đây có thể xác thực và giao tiếp an toàn với API Server của chúng ta.

#### Kích hoạt xác thực toàn cục (Enable authentication globally)

Nếu phần lớn các endpoint của bạn nên được bảo vệ theo mặc định, bạn có thể đăng ký guard xác thực như một [guard toàn cục](/guards#binding-guards) và thay vì sử dụng decorator `@UseGuards()` trên đầu mỗi controller, bạn có thể chỉ đơn giản đánh dấu các route nào nên là công khai.

Đầu tiên, đăng ký `AuthGuard` như một guard toàn cục bằng cách sử dụng cấu trúc sau (trong bất kỳ module nào, ví dụ, trong `AuthModule`):

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: AuthGuard,
  },
],
```

Với điều này, Nest sẽ tự động liên kết `AuthGuard` với tất cả các endpoint.

Bây giờ chúng ta phải cung cấp một cơ chế để khai báo các route là công khai. Để làm điều này, chúng ta có thể tạo một decorator tùy chỉnh bằng cách sử dụng hàm tạo decorator `SetMetadata`.

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Trong file trên, chúng ta đã xuất hai hằng số. Một là khóa metadata của chúng ta có tên `IS_PUBLIC_KEY`, và cái kia là decorator mới của chúng ta mà chúng ta sẽ gọi là `Public` (bạn có thể đặt tên nó là `SkipAuth` hoặc `AllowAnon`, tùy theo dự án của bạn).

Bây giờ chúng ta có một decorator `@Public()` tùy chỉnh, chúng ta có thể sử dụng nó để trang trí bất kỳ phương thức nào, như sau:

```typescript
@Public()
@Get()
findAll() {
  return [];
}
```

Cuối cùng, chúng ta cần `AuthGuard` trả về `true` khi metadata `"isPublic"` được tìm thấy. Để làm điều này, chúng ta sẽ sử dụng lớp `Reflector` (đọc thêm [tại đây](/guards#putting-it-all-together)).

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      // 💡 Xem điều kiện này
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      // 💡 Chúng ta đang gán payload cho đối tượng request ở đây
      // để chúng ta có thể truy cập nó trong các xử lý route của mình
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

#### Tích hợp Passport (Passport integration)

[Passport](https://github.com/jaredhanson/passport) là thư viện xác thực node.js phổ biến nhất, được cộng đồng biết đến rộng rãi và được sử dụng thành công trong nhiều ứng dụng sản xuất. Rất dễ dàng để tích hợp thư viện này với ứng dụng **Nest** bằng cách sử dụng module `@nestjs/passport`.

Để tìm hiểu cách bạn có thể tích hợp Passport với NestJS, hãy xem [chương này](/recipes/passport).

#### Ví dụ (Example)

Bạn có thể tìm thấy phiên bản hoàn chỉnh của mã trong chương này [tại đây](https://github.com/nestjs/nest/tree/master/sample/19-auth-jwt).
