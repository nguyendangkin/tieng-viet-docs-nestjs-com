### Module HTTP (HTTP module)

[Axios](https://github.com/axios/axios) là một gói thư viện khách HTTP giàu tính năng được sử dụng rộng rãi. Nest bọc Axios và hiển thị nó thông qua `HttpModule` tích hợp sẵn. `HttpModule` xuất lớp `HttpService`, lớp này hiển thị các phương thức dựa trên Axios để thực hiện các yêu cầu HTTP. Thư viện cũng chuyển đổi các phản hồi HTTP kết quả thành `Observables`.

> info **Gợi ý** Bạn cũng có thể sử dụng trực tiếp bất kỳ thư viện khách HTTP mục đích chung nào của Node.js, bao gồm [got](https://github.com/sindresorhus/got) hoặc [undici](https://github.com/nodejs/undici).

#### Cài đặt (Installation)

Để bắt đầu sử dụng nó, trước tiên chúng ta cài đặt các phụ thuộc cần thiết.

```bash
$ npm i --save @nestjs/axios axios
```

#### Bắt đầu (Getting started)

Sau khi quá trình cài đặt hoàn tất, để sử dụng `HttpService`, trước tiên hãy import `HttpModule`.

```typescript
@Module({
  imports: [HttpModule],
  providers: [CatsService],
})
export class CatsModule {}
```

Tiếp theo, tiêm `HttpService` bằng cách sử dụng phương pháp tiêm constructor thông thường.

> info **Gợi ý** `HttpModule` và `HttpService` được import từ gói `@nestjs/axios`.

```typescript
@@filename()
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Observable<AxiosResponse<Cat[]>> {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
@@switch
@Injectable()
@Dependencies(HttpService)
export class CatsService {
  constructor(httpService) {
    this.httpService = httpService;
  }

  findAll() {
    return this.httpService.get('http://localhost:3000/cats');
  }
}
```

> info **Gợi ý** `AxiosResponse` là một interface được xuất từ gói `axios` (`$ npm i axios`).

Tất cả các phương thức `HttpService` trả về một `AxiosResponse` được bọc trong một đối tượng `Observable`.

#### Cấu hình (Configuration)

[Axios](https://github.com/axios/axios) có thể được cấu hình với nhiều tùy chọn khác nhau để tùy chỉnh hành vi của `HttpService`. Đọc thêm về chúng [tại đây](https://github.com/axios/axios#request-config). Để cấu hình phiên bản Axios cơ bản, truyền một đối tượng tùy chọn tùy chọn vào phương thức `register()` của `HttpModule` khi import nó. Đối tượng tùy chọn này sẽ được truyền trực tiếp vào hàm tạo Axios cơ bản.

```typescript
@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  providers: [CatsService],
})
export class CatsModule {}
```

#### Cấu hình bất đồng bộ (Async configuration)

Khi bạn cần truyền các tùy chọn module bất đồng bộ thay vì tĩnh, hãy sử dụng phương thức `registerAsync()`. Giống như hầu hết các module động, Nest cung cấp một số kỹ thuật để xử lý cấu hình bất đồng bộ.

Một kỹ thuật là sử dụng hàm factory:

```typescript
HttpModule.registerAsync({
  useFactory: () => ({
    timeout: 5000,
    maxRedirects: 5,
  }),
});
```

Giống như các nhà cung cấp factory khác, hàm factory của chúng ta có thể là [bất đồng bộ](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory) và có thể tiêm phụ thuộc thông qua `inject`.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    timeout: configService.get('HTTP_TIMEOUT'),
    maxRedirects: configService.get('HTTP_MAX_REDIRECTS'),
  }),
  inject: [ConfigService],
});
```

Ngoài ra, bạn có thể cấu hình `HttpModule` bằng cách sử dụng một lớp thay vì một factory, như được hiển thị bên dưới.

```typescript
HttpModule.registerAsync({
  useClass: HttpConfigService,
});
```

Cách xây dựng trên khởi tạo `HttpConfigService` bên trong `HttpModule`, sử dụng nó để tạo một đối tượng tùy chọn. Lưu ý rằng trong ví dụ này, `HttpConfigService` phải triển khai giao diện `HttpModuleOptionsFactory` như được hiển thị bên dưới. `HttpModule` sẽ gọi phương thức `createHttpOptions()` trên đối tượng được khởi tạo của lớp được cung cấp.

```typescript
@Injectable()
class HttpConfigService implements HttpModuleOptionsFactory {
  createHttpOptions(): HttpModuleOptions {
    return {
      timeout: 5000,
      maxRedirects: 5,
    };
  }
}
```

Nếu bạn muốn tái sử dụng một nhà cung cấp tùy chọn hiện có thay vì tạo một bản sao riêng bên trong `HttpModule`, hãy sử dụng cú pháp `useExisting`.

```typescript
HttpModule.registerAsync({
  imports: [ConfigModule],
  useExisting: HttpConfigService,
});
```

#### Sử dụng Axios trực tiếp (Using Axios directly)

Nếu bạn nghĩ rằng các tùy chọn của `HttpModule.register` không đủ cho bạn, hoặc nếu bạn chỉ muốn truy cập phiên bản Axios cơ bản được tạo bởi `@nestjs/axios`, bạn có thể truy cập nó thông qua `HttpService#axiosRef` như sau:

```typescript
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {}

  findAll(): Promise<AxiosResponse<Cat[]>> {
    return this.httpService.axiosRef.get('http://localhost:3000/cats');
    //                      ^ Giao diện AxiosInstance
  }
}
```

#### Ví dụ đầy đủ (Full example)

Vì giá trị trả về của các phương thức `HttpService` là một Observable, chúng ta có thể sử dụng `rxjs` - `firstValueFrom` hoặc `lastValueFrom` để lấy dữ liệu của yêu cầu dưới dạng một promise.

```typescript
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class CatsService {
  private readonly logger = new Logger(CatsService.name);
  constructor(private readonly httpService: HttpService) {}

  async findAll(): Promise<Cat[]> {
    const { data } = await firstValueFrom(
      this.httpService.get<Cat[]>('http://localhost:3000/cats').pipe(
        catchError((error: AxiosError) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        }),
      ),
    );
    return data;
  }
}
```

> info **Gợi ý** Truy cập tài liệu của RxJS về [`firstValueFrom`](https://rxjs.dev/api/index/function/firstValueFrom) và [`lastValueFrom`](https://rxjs.dev/api/index/function/lastValueFrom) để biết sự khác biệt giữa chúng.
