### Tuần tự hóa (Serialization)

Tuần tự hóa là một quá trình diễn ra trước khi các đối tượng được trả về trong phản hồi mạng. Đây là nơi thích hợp để cung cấp các quy tắc cho việc chuyển đổi và làm sạch dữ liệu được trả về cho máy khách. Ví dụ, dữ liệu nhạy cảm như mật khẩu luôn phải được loại trừ khỏi phản hồi. Hoặc, một số thuộc tính có thể yêu cầu chuyển đổi bổ sung, chẳng hạn như chỉ gửi một tập con các thuộc tính của một thực thể. Thực hiện các chuyển đổi này một cách thủ công có thể tốn thời gian và dễ mắc lỗi, và có thể khiến bạn không chắc chắn rằng tất cả các trường hợp đã được xử lý.

#### Tổng quan (Overview)

Nest cung cấp khả năng tích hợp sẵn để đảm bảo rằng các hoạt động này có thể được thực hiện một cách đơn giản. Interceptor `ClassSerializerInterceptor` sử dụng gói [class-transformer](https://github.com/typestack/class-transformer) mạnh mẽ để cung cấp cách khai báo và mở rộng để chuyển đổi đối tượng. Hoạt động cơ bản mà nó thực hiện là lấy giá trị được trả về bởi một phương thức xử lý và áp dụng hàm `instanceToPlain()` từ [class-transformer](https://github.com/typestack/class-transformer). Khi làm như vậy, nó có thể áp dụng các quy tắc được biểu thị bởi các decorator `class-transformer` trên một lớp thực thể/DTO, như được mô tả dưới đây.

> **Gợi ý** Quá trình tuần tự hóa không áp dụng cho các phản hồi [StreamableFile](https://docs.nestjs.com/techniques/streaming-files#streamable-file-class).

#### Loại trừ thuộc tính (Exclude properties)

Giả sử chúng ta muốn tự động loại trừ thuộc tính `password` từ một thực thể người dùng. Chúng ta chú thích thực thể như sau:

```typescript
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: number;
  firstName: string;
  lastName: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
```

Bây giờ hãy xem xét một bộ điều khiển với một phương thức xử lý trả về một thể hiện của lớp này.

```typescript
@UseInterceptors(ClassSerializerInterceptor)
@Get()
findOne(): UserEntity {
  return new UserEntity({
    id: 1,
    firstName: 'Kamil',
    lastName: 'Mysliwiec',
    password: 'password',
  });
}
```

> **Cảnh báo** Lưu ý rằng chúng ta phải trả về một thể hiện của lớp. Nếu bạn trả về một đối tượng JavaScript đơn giản, ví dụ, `{{ '{' }} user: new UserEntity() {{ '}' }}`, đối tượng sẽ không được tuần tự hóa đúng cách.

> **Gợi ý** `ClassSerializerInterceptor` được nhập từ `@nestjs/common`.

Khi điểm cuối này được yêu cầu, máy khách nhận được phản hồi sau:

```json
{
  "id": 1,
  "firstName": "Kamil",
  "lastName": "Mysliwiec"
}
```

Lưu ý rằng interceptor có thể được áp dụng trên toàn ứng dụng (như đã đề cập [ở đây](https://docs.nestjs.com/interceptors#binding-interceptors)). Sự kết hợp của interceptor và khai báo lớp thực thể đảm bảo rằng **bất kỳ** phương thức nào trả về một `UserEntity` sẽ chắc chắn loại bỏ thuộc tính `password`. Điều này cung cấp cho bạn một mức độ thực thi tập trung của quy tắc kinh doanh này.

#### Hiển thị thuộc tính (Expose properties)

Bạn có thể sử dụng decorator `@Expose()` để cung cấp tên bí danh cho các thuộc tính, hoặc để thực thi một hàm để tính toán giá trị thuộc tính (tương tự như các hàm **getter**), như được hiển thị dưới đây.

```typescript
@Expose()
get fullName(): string {
  return `${this.firstName} ${this.lastName}`;
}
```

#### Chuyển đổi (Transform)

Bạn có thể thực hiện chuyển đổi dữ liệu bổ sung bằng cách sử dụng decorator `@Transform()`. Ví dụ, cấu trúc sau trả về thuộc tính name của `RoleEntity` thay vì trả về toàn bộ đối tượng.

```typescript
@Transform(({ value }) => value.name)
role: RoleEntity;
```

#### Truyền tùy chọn (Pass options)

Bạn có thể muốn sửa đổi hành vi mặc định của các hàm chuyển đổi. Để ghi đè cài đặt mặc định, hãy truyền chúng trong một đối tượng `options` với decorator `@SerializeOptions()`.

```typescript
@SerializeOptions({
  excludePrefixes: ['_'],
})
@Get()
findOne(): UserEntity {
  return new UserEntity();
}
```

> **Gợi ý** Decorator `@SerializeOptions()` được nhập từ `@nestjs/common`.

Các tùy chọn được truyền qua `@SerializeOptions()` được truyền làm đối số thứ hai của hàm `instanceToPlain()` cơ bản. Trong ví dụ này, chúng ta tự động loại trừ tất cả các thuộc tính bắt đầu bằng tiền tố `_`.

#### Ví dụ (Example)

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/21-serializer).

#### WebSockets và Microservices

Mặc dù chương này cho thấy các ví dụ sử dụng ứng dụng kiểu HTTP (ví dụ: Express hoặc Fastify), `ClassSerializerInterceptor` hoạt động tương tự cho WebSockets và Microservices, bất kể phương thức truyền tải nào được sử dụng.

#### Tìm hiểu thêm (Learn more)

Đọc thêm về các decorator và tùy chọn có sẵn được cung cấp bởi gói `class-transformer` [tại đây](https://github.com/typestack/class-transformer).
