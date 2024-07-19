### Phụ thuộc vòng tròn (Circular dependency)

Phụ thuộc vòng tròn xảy ra khi hai lớp phụ thuộc lẫn nhau. Ví dụ, lớp A cần lớp B, và lớp B cũng cần lớp A. Phụ thuộc vòng tròn có thể phát sinh trong Nest giữa các module và giữa các nhà cung cấp.

Mặc dù nên tránh phụ thuộc vòng tròn khi có thể, bạn không phải lúc nào cũng làm được như vậy. Trong những trường hợp như vậy, Nest cho phép giải quyết phụ thuộc vòng tròn giữa các nhà cung cấp theo hai cách. Trong chương này, chúng ta mô tả việc sử dụng **tham chiếu chuyển tiếp** (forward referencing) như một kỹ thuật, và sử dụng lớp **ModuleRef** để truy xuất một thể hiện nhà cung cấp từ container DI như một kỹ thuật khác.

Chúng ta cũng mô tả cách giải quyết phụ thuộc vòng tròn giữa các module.

> warning **Cảnh báo** Phụ thuộc vòng tròn cũng có thể được gây ra khi sử dụng "barrel files"/index.ts files để nhóm các import. Các barrel files nên được bỏ qua khi nói đến các lớp module/nhà cung cấp. Ví dụ, không nên sử dụng barrel files khi import các file trong cùng thư mục với barrel file, tức là `cats/cats.controller` không nên import `cats` để import file `cats/cats.service`. Để biết thêm chi tiết, vui lòng xem [vấn đề github này](https://github.com/nestjs/nest/issues/1181#issuecomment-430197191).

#### Tham chiếu chuyển tiếp (Forward reference)

**Tham chiếu chuyển tiếp** cho phép Nest tham chiếu đến các lớp chưa được định nghĩa bằng cách sử dụng hàm tiện ích `forwardRef()`. Ví dụ, nếu `CatsService` và `CommonService` phụ thuộc lẫn nhau, cả hai bên của mối quan hệ có thể sử dụng `@Inject()` và hàm tiện ích `forwardRef()` để giải quyết phụ thuộc vòng tròn. Nếu không, Nest sẽ không khởi tạo chúng vì tất cả các metadata thiết yếu sẽ không có sẵn. Đây là một ví dụ:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => CommonService))
    private commonService: CommonService,
  ) {}
}
@@switch
@Injectable()
@Dependencies(forwardRef(() => CommonService))
export class CatsService {
  constructor(commonService) {
    this.commonService = commonService;
  }
}
```

> info **Gợi ý** Hàm `forwardRef()` được import từ gói `@nestjs/common`.

Điều đó bao gồm một bên của mối quan hệ. Bây giờ hãy làm tương tự với `CommonService`:

```typescript
@@filename(common.service)
@Injectable()
export class CommonService {
  constructor(
    @Inject(forwardRef(() => CatsService))
    private catsService: CatsService,
  ) {}
}
@@switch
@Injectable()
@Dependencies(forwardRef(() => CatsService))
export class CommonService {
  constructor(catsService) {
    this.catsService = catsService;
  }
}
```

> warning **Cảnh báo** Thứ tự khởi tạo là không xác định. Đảm bảo rằng mã của bạn không phụ thuộc vào việc constructor nào được gọi trước. Việc có các phụ thuộc vòng tròn phụ thuộc vào các nhà cung cấp với `Scope.REQUEST` có thể dẫn đến các phụ thuộc không xác định. Thông tin thêm có sẵn [ở đây](https://github.com/nestjs/nest/issues/5778)

#### Lớp ModuleRef thay thế (ModuleRef class alternative)

Một giải pháp thay thế cho việc sử dụng `forwardRef()` là tái cấu trúc mã của bạn và sử dụng lớp `ModuleRef` để truy xuất một nhà cung cấp ở một bên của mối quan hệ (nếu không sẽ là) vòng tròn. Tìm hiểu thêm về lớp tiện ích `ModuleRef` [tại đây](/fundamentals/module-ref).

#### Tham chiếu chuyển tiếp module (Module forward reference)

Để giải quyết phụ thuộc vòng tròn giữa các module, sử dụng cùng hàm tiện ích `forwardRef()` ở cả hai bên của liên kết module. Ví dụ:

```typescript
@@filename(common.module)
@Module({
  imports: [forwardRef(() => CatsModule)],
})
export class CommonModule {}
```

Điều đó bao gồm một bên của mối quan hệ. Bây giờ hãy làm tương tự với `CatsModule`:

```typescript
@@filename(cats.module)
@Module({
  imports: [forwardRef(() => CommonModule)],
})
export class CatsModule {}
```
