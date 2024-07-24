### Trình tạo CRUD (Chỉ dành cho TypeScript)

Trong suốt vòng đời của một dự án, khi chúng ta xây dựng các tính năng mới, chúng ta thường cần thêm các tài nguyên mới vào ứng dụng của mình. Những tài nguyên này thường yêu cầu nhiều hoạt động lặp đi lặp lại mà chúng ta phải lặp lại mỗi khi định nghĩa một tài nguyên mới.

#### Giới thiệu (Introduction)

Hãy tưởng tượng một kịch bản thực tế, nơi chúng ta cần hiển thị các điểm cuối CRUD cho 2 thực thể, giả sử là các thực thể **User** và **Product**.
Theo các phương pháp tốt nhất, cho mỗi thực thể chúng ta sẽ phải thực hiện một số hoạt động, như sau:

- Tạo một module (`nest g mo`) để giữ mã được tổ chức và thiết lập ranh giới rõ ràng (nhóm các thành phần liên quan)
- Tạo một controller (`nest g co`) để xác định các route CRUD (hoặc queries/mutations cho ứng dụng GraphQL)
- Tạo một service (`nest g s`) để thực hiện và cô lập logic kinh doanh
- Tạo một lớp/giao diện thực thể để biểu diễn hình dạng dữ liệu tài nguyên
- Tạo Data Transfer Objects (hoặc inputs cho ứng dụng GraphQL) để xác định cách dữ liệu sẽ được gửi qua mạng

Đó là rất nhiều bước!

Để giúp tăng tốc quá trình lặp đi lặp lại này, [Nest CLI](/cli/overview) cung cấp một trình tạo (schematic) tự động tạo tất cả mã boilerplate để giúp chúng ta tránh phải làm tất cả điều này, và làm cho trải nghiệm nhà phát triển đơn giản hơn nhiều.

> info **Lưu ý** Schematic hỗ trợ tạo các controller **HTTP**, các controller **Microservice**, các resolver **GraphQL** (cả code first và schema first), và các Gateway **WebSocket**.

#### Tạo một tài nguyên mới (Generating a new resource)

Để tạo một tài nguyên mới, chỉ cần chạy lệnh sau trong thư mục gốc của dự án của bạn:

```shell
$ nest g resource
```

Lệnh `nest g resource` không chỉ tạo tất cả các khối xây dựng NestJS (các lớp module, service, controller) mà còn tạo lớp entity, các lớp DTO cũng như các tệp kiểm thử (`.spec`).

Dưới đây bạn có thể thấy tệp controller được tạo (cho REST API):

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
```

Ngoài ra, nó tự động tạo ra các placeholder cho tất cả các điểm cuối CRUD (routes cho REST APIs, queries và mutations cho GraphQL, message subscribes cho cả Microservices và WebSocket Gateways) - tất cả mà không cần phải động tay.

> warning **Lưu ý** Các lớp service được tạo **không** gắn với bất kỳ **ORM (hoặc nguồn dữ liệu) cụ thể** nào. Điều này làm cho trình tạo đủ chung chung để đáp ứng nhu cầu của bất kỳ dự án nào. Theo mặc định, tất cả các phương thức sẽ chứa các placeholder, cho phép bạn điền vào đó với các nguồn dữ liệu cụ thể cho dự án của bạn.

Tương tự, nếu bạn muốn tạo các resolver cho một ứng dụng GraphQL, chỉ cần chọn `GraphQL (code first)` (hoặc `GraphQL (schema first)`) làm lớp truyền tải của bạn.

Trong trường hợp này, NestJS sẽ tạo một lớp resolver thay vì một controller REST API:

```shell
$ nest g resource users

> ? Bạn sử dụng lớp truyền tải nào? GraphQL (code first)
> ? Bạn có muốn tạo các điểm vào CRUD không? Có
> CREATE src/users/users.module.ts (224 bytes)
> CREATE src/users/users.resolver.spec.ts (525 bytes)
> CREATE src/users/users.resolver.ts (1109 bytes)
> CREATE src/users/users.service.spec.ts (453 bytes)
> CREATE src/users/users.service.ts (625 bytes)
> CREATE src/users/dto/create-user.input.ts (195 bytes)
> CREATE src/users/dto/update-user.input.ts (281 bytes)
> CREATE src/users/entities/user.entity.ts (187 bytes)
> UPDATE src/app.module.ts (312 bytes)
```

> info **Gợi ý** Để tránh tạo các tệp kiểm thử, bạn có thể truyền cờ `--no-spec`, như sau: `nest g resource users --no-spec`

Chúng ta có thể thấy dưới đây, không chỉ tất cả các mutations và queries boilerplate được tạo ra, mà mọi thứ đều được kết nối với nhau. Chúng ta đang sử dụng `UsersService`, Entity `User`, và các DTO của chúng ta.

```typescript
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id);
  }
}
```
