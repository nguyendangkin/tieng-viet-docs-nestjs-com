### Tải lên tệp (File upload)

Để xử lý việc tải lên tệp, Nest cung cấp một module tích hợp dựa trên gói middleware [multer](https://github.com/expressjs/multer) cho Express. Multer xử lý dữ liệu được đăng ở định dạng `multipart/form-data`, chủ yếu được sử dụng để tải lên tệp qua yêu cầu HTTP `POST`. Module này có thể cấu hình đầy đủ và bạn có thể điều chỉnh hành vi của nó theo yêu cầu ứng dụng của bạn.

> warning **Cảnh báo** Multer không thể xử lý dữ liệu không ở định dạng multipart được hỗ trợ (`multipart/form-data`). Ngoài ra, lưu ý rằng gói này không tương thích với `FastifyAdapter`.

Để có kiểu an toàn hơn, hãy cài đặt gói typings Multer:

```shell
$ npm i -D @types/multer
```

Với gói này được cài đặt, chúng ta có thể sử dụng kiểu `Express.Multer.File` (bạn có thể import kiểu này như sau: `import {{ '{' }} Express {{ '}' }} from 'express'`).

#### Ví dụ cơ bản (Basic example)

Để tải lên một tệp duy nhất, chỉ cần gắn interceptor `FileInterceptor()` vào trình xử lý route và trích xuất `file` từ `request` sử dụng decorator `@UploadedFile()`.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  console.log(file);
}
@@switch
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
@Bind(UploadedFile())
uploadFile(file) {
  console.log(file);
}
```

> info **Gợi ý** Decorator `FileInterceptor()` được xuất từ gói `@nestjs/platform-express`. Decorator `@UploadedFile()` được xuất từ `@nestjs/common`.

Decorator `FileInterceptor()` nhận hai đối số:

- `fieldName`: chuỗi cung cấp tên của trường từ biểu mẫu HTML chứa tệp
- `options`: đối tượng tùy chọn của kiểu `MulterOptions`. Đây là cùng một đối tượng được sử dụng bởi constructor multer (chi tiết hơn [tại đây](https://github.com/expressjs/multer#multeropts)).

> warning **Cảnh báo** `FileInterceptor()` có thể không tương thích với các nhà cung cấp đám mây bên thứ ba như Google Firebase hoặc các nhà cung cấp khác.

#### Xác thực tệp (File validation)

Thường xuyên, có thể hữu ích để xác thực metadata của tệp đến, như kích thước tệp hoặc loại mime của tệp. Để làm điều này, bạn có thể tạo [Pipe](https://docs.nestjs.com/pipes) riêng của mình và gắn nó vào tham số được chú thích với decorator `UploadedFile`. Ví dụ dưới đây minh họa cách một pipe xác thực kích thước tệp cơ bản có thể được triển khai:

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // "value" là một đối tượng chứa các thuộc tính và metadata của tệp
    const oneKb = 1000;
    return value.size < oneKb;
  }
}
```

Nest cung cấp một pipe tích hợp để xử lý các trường hợp sử dụng phổ biến và tạo điều kiện/chuẩn hóa việc thêm các trường hợp mới. Pipe này được gọi là `ParseFilePipe`, và bạn có thể sử dụng nó như sau:

```typescript
@Post('file')
uploadFileAndPassValidation(
  @Body() body: SampleDto,
  @UploadedFile(
    new ParseFilePipe({
      validators: [
        // ... Tập hợp các instance xác thực tệp ở đây
      ]
    })
  )
  file: Express.Multer.File,
) {
  return {
    body,
    file: file.buffer.toString(),
  };
}
```

Như bạn có thể thấy, cần phải chỉ định một mảng các trình xác thực tệp sẽ được thực thi bởi `ParseFilePipe`. Chúng ta sẽ thảo luận về giao diện của một trình xác thực, nhưng đáng để đề cập rằng pipe này cũng có hai tùy chọn **tùy chọn** bổ sung:

<table>
  <tr>
    <td><code>errorHttpStatusCode</code></td>
    <td>Mã trạng thái HTTP sẽ được ném ra trong trường hợp <b>bất kỳ</b> trình xác thực nào thất bại. Mặc định là <code>400</code> (BAD REQUEST)</td>
  </tr>
  <tr>
    <td><code>exceptionFactory</code></td>
    <td>Một factory nhận thông báo lỗi và trả về một lỗi.</td>
  </tr>
</table>

Bây giờ, quay lại giao diện `FileValidator`. Để tích hợp các trình xác thực với pipe này, bạn phải sử dụng các triển khai tích hợp hoặc cung cấp `FileValidator` tùy chỉnh của riêng bạn. Xem ví dụ dưới đây:

```typescript
export abstract class FileValidator<TValidationOptions = Record<string, any>> {
  constructor(protected readonly validationOptions: TValidationOptions) {}

  /**
   * Chỉ ra nếu tệp này nên được coi là hợp lệ, theo các tùy chọn được truyền vào constructor.
   * @param file tệp từ đối tượng request
   */
  abstract isValid(file?: any): boolean | Promise<boolean>;

  /**
   * Xây dựng một thông báo lỗi trong trường hợp xác thực thất bại.
   * @param file tệp từ đối tượng request
   */
  abstract buildErrorMessage(file: any): string;
}
```

> info **Gợi ý** Giao diện `FileValidator` hỗ trợ xác thực bất đồng bộ thông qua hàm `isValid` của nó. Để tận dụng bảo mật kiểu, bạn cũng có thể đặt kiểu cho tham số `file` là `Express.Multer.File` trong trường hợp bạn đang sử dụng express (mặc định) làm driver.

`FileValidator` là một lớp thông thường có quyền truy cập vào đối tượng tệp và xác thực nó theo các tùy chọn được cung cấp bởi client. Nest có hai triển khai `FileValidator` tích hợp mà bạn có thể sử dụng trong dự án của mình:

- `MaxFileSizeValidator` - Kiểm tra xem kích thước của một tệp đã cho có nhỏ hơn giá trị được cung cấp (đo bằng `bytes`) không
- `FileTypeValidator` - Kiểm tra xem loại mime của một tệp đã cho có khớp với giá trị đã cho không.

> warning **Cảnh báo** Để xác minh loại tệp, lớp [FileTypeValidator](https://github.com/nestjs/nest/blob/master/packages/common/pipes/file/file-type.validator.ts) sử dụng loại được phát hiện bởi multer. Theo mặc định, multer suy ra loại tệp từ phần mở rộng tệp trên thiết bị của người dùng. Tuy nhiên, nó không kiểm tra nội dung tệp thực tế. Vì tệp có thể được đổi tên thành các phần mở rộng tùy ý, hãy xem xét sử dụng một triển khai tùy chỉnh (như kiểm tra [số ma thuật](https://www.ibm.com/support/pages/what-magic-number) của tệp) nếu ứng dụng của bạn yêu cầu một giải pháp an toàn hơn.

Để hiểu cách chúng có thể được sử dụng kết hợp với `FileParsePipe` đã đề cập trước đó, chúng ta sẽ sử dụng một đoạn mã đã được thay đổi từ ví dụ cuối cùng được trình bày:

```typescript
@UploadedFile(
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 1000 }),
      new FileTypeValidator({ fileType: 'image/jpeg' }),
    ],
  }),
)
file: Express.Multer.File,
```

> info **Gợi ý** Nếu số lượng trình xác thực tăng lên lớn hoặc các tùy chọn của chúng làm rối tệp, bạn có thể định nghĩa mảng này trong một tệp riêng biệt và import nó ở đây như một hằng số có tên như `fileValidators`.

Cuối cùng, bạn có thể sử dụng lớp đặc biệt `ParseFilePipeBuilder` cho phép bạn tổng hợp & xây dựng các trình xác thực của mình. Bằng cách sử dụng nó như được hiển thị dưới đây, bạn có thể tránh việc khởi tạo thủ công từng trình xác thực và chỉ cần truyền các tùy chọn của chúng trực tiếp:

```typescript
@UploadedFile(
  new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: 'jpeg',
    })
    .addMaxSizeValidator({
      maxSize: 1000
    })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
    }),
)
file: Express.Multer.File,
```

> info **Gợi ý** Sự hiện diện của tệp được yêu cầu theo mặc định, nhưng bạn có thể làm cho nó tùy chọn bằng cách thêm tham số `fileIsRequired: false` bên trong các tùy chọn của hàm `build` (ở cùng cấp với `errorHttpStatusCode`).

#### Mảng các tệp (Array of files)

Để tải lên một mảng các tệp (được xác định bằng một tên trường duy nhất), sử dụng decorator `FilesInterceptor()` (lưu ý **Files** số nhiều trong tên decorator). Decorator này nhận ba đối số:

- `fieldName`: như đã mô tả ở trên
- `maxCount`: số tùy chọn xác định số lượng tệp tối đa để chấp nhận
- `options`: đối tượng `MulterOptions` tùy chọn, như đã mô tả ở trên

Khi sử dụng `FilesInterceptor()`, trích xuất các tệp từ `request` với decorator `@UploadedFiles()`.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
@@switch
@Post('upload')
@UseInterceptors(FilesInterceptor('files'))
@Bind(UploadedFiles())
uploadFile(files) {
  console.log(files);
}
```

> info **Gợi ý** Decorator `FilesInterceptor()` được xuất từ gói `@nestjs/platform-express`. Decorator `@UploadedFiles()` được xuất từ `@nestjs/common`.

#### Nhiều tệp (Multiple files)

Để tải lên nhiều tệp (tất cả với các khóa tên trường khác nhau), sử dụng decorator `FileFieldsInterceptor()`. Decorator này nhận hai đối số:

- `uploadedFields`: một mảng các đối tượng, trong đó mỗi đối tượng chỉ định một thuộc tính `name` bắt buộc với một giá trị chuỗi chỉ định tên trường, như đã mô tả ở trên, và một thuộc tính `maxCount` tùy chọn, như đã mô tả ở trên
- `options`: đối tượng `MulterOptions` tùy chọn, như đã mô tả ở trên

Khi sử dụng `FileFieldsInterceptor()`, trích xuất các tệp từ `request` với decorator `@UploadedFiles()`.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(@UploadedFiles() files: { avatar?: Express.Multer.File[], background?: Express.Multer.File[] }) {
  console.log(files);
}
@@switch
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(FileFieldsInterceptor([
  { name: 'avatar', maxCount: 1 },
  { name: 'background', maxCount: 1 },
]))
uploadFile(files) {
  console.log(files);
}
```

#### Bất kỳ tập tin nào (Any files)

Để tải lên tất cả các trường với khóa trường tùy ý, sử dụng decorator `AnyFilesInterceptor()`. Decorator này có thể chấp nhận một đối tượng `options` tùy chọn như mô tả ở trên.

Khi sử dụng `AnyFilesInterceptor()`, trích xuất tập tin từ `request` với decorator `@UploadedFiles()`.

```typescript
@@filename()
@Post('upload')
@UseInterceptors(AnyFilesInterceptor())
uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {
  console.log(files);
}
@@switch
@Post('upload')
@Bind(UploadedFiles())
@UseInterceptors(AnyFilesInterceptor())
uploadFile(files) {
  console.log(files);
}
```

#### Không có tập tin (No files)

Để chấp nhận `multipart/form-data` nhưng không cho phép tải lên bất kỳ tập tin nào, sử dụng `NoFilesInterceptor`. Điều này đặt dữ liệu đa phần làm thuộc tính trên phần thân yêu cầu. Bất kỳ tập tin nào được gửi cùng yêu cầu sẽ ném ra `BadRequestException`.

```typescript
@Post('upload')
@UseInterceptors(NoFilesInterceptor())
handleMultiPartData(@Body() body) {
  console.log(body)
}
```

#### Tùy chọn mặc định (Default options)

Bạn có thể chỉ định tùy chọn multer trong các bộ chặn tập tin như mô tả ở trên. Để đặt tùy chọn mặc định, bạn có thể gọi phương thức tĩnh `register()` khi bạn import `MulterModule`, truyền vào các tùy chọn được hỗ trợ. Bạn có thể sử dụng tất cả tùy chọn được liệt kê [tại đây](https://github.com/expressjs/multer#multeropts).

```typescript
MulterModule.register({
  dest: './upload',
});
```

> info **Gợi ý** Lớp `MulterModule` được xuất từ gói `@nestjs/platform-express`.

#### Cấu hình bất đồng bộ (Async configuration)

Khi bạn cần đặt tùy chọn `MulterModule` bất đồng bộ thay vì tĩnh, sử dụng phương thức `registerAsync()`. Như với hầu hết các module động, Nest cung cấp một số kỹ thuật để xử lý cấu hình bất đồng bộ.

Một kỹ thuật là sử dụng hàm factory:

```typescript
MulterModule.registerAsync({
  useFactory: () => ({
    dest: './upload',
  }),
});
```

Giống như các [nhà cung cấp factory](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory) khác, hàm factory của chúng ta có thể là `async` và có thể tiêm phụ thuộc thông qua `inject`.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    dest: configService.get<string>('MULTER_DEST'),
  }),
  inject: [ConfigService],
});
```

Ngoài ra, bạn có thể cấu hình `MulterModule` bằng cách sử dụng một lớp thay vì một factory, như được hiển thị dưới đây:

```typescript
MulterModule.registerAsync({
  useClass: MulterConfigService,
});
```

Cách xây dựng trên khởi tạo `MulterConfigService` bên trong `MulterModule`, sử dụng nó để tạo đối tượng tùy chọn cần thiết. Lưu ý rằng trong ví dụ này, `MulterConfigService` phải triển khai giao diện `MulterOptionsFactory`, như được hiển thị dưới đây. `MulterModule` sẽ gọi phương thức `createMulterOptions()` trên đối tượng đã khởi tạo của lớp được cung cấp.

```typescript
@Injectable()
class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      dest: './upload',
    };
  }
}
```

Nếu bạn muốn tái sử dụng một nhà cung cấp tùy chọn hiện có thay vì tạo một bản sao riêng bên trong `MulterModule`, hãy sử dụng cú pháp `useExisting`.

```typescript
MulterModule.registerAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

#### Ví dụ (Example)

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/29-file-upload).
