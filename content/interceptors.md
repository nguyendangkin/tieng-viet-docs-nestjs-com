### Bộ đánh chặn (Interceptors)

Một bộ đánh chặn là một lớp được đánh dấu bằng decorator `@Injectable()` và triển khai giao diện `NestInterceptor`.

<figure><img src="/assets/Interceptors_1.png" /></figure>

Bộ đánh chặn có một tập hợp các khả năng hữu ích được lấy cảm hứng từ kỹ thuật [Lập trình hướng khía cạnh](https://en.wikipedia.org/wiki/Aspect-oriented_programming) (AOP). Chúng cho phép:

- Gắn thêm logic trước / sau khi thực thi phương thức
- Biến đổi kết quả trả về từ một hàm
- Biến đổi ngoại lệ được ném ra từ một hàm
- Mở rộng hành vi cơ bản của hàm
- Ghi đè hoàn toàn một hàm tùy thuộc vào các điều kiện cụ thể (ví dụ: cho mục đích caching)

#### Cơ bản (Basics)

Mỗi bộ đánh chặn triển khai phương thức `intercept()`, nhận hai đối số. Đối số đầu tiên là instance `ExecutionContext` (chính xác là đối tượng giống như đối với [guards](/guards)). `ExecutionContext` kế thừa từ `ArgumentsHost`. Chúng ta đã thấy `ArgumentsHost` trước đó trong chương về bộ lọc ngoại lệ. Ở đó, chúng ta thấy rằng nó là một wrapper xung quanh các đối số đã được truyền vào handler gốc, và chứa các mảng đối số khác nhau dựa trên loại ứng dụng. Bạn có thể xem lại [bộ lọc ngoại lệ](https://docs.nestjs.com/exception-filters#arguments-host) để biết thêm về chủ đề này.

#### Ngữ cảnh thực thi (Execution context)

Bằng cách mở rộng `ArgumentsHost`, `ExecutionContext` cũng thêm một số phương thức trợ giúp mới cung cấp thêm chi tiết về quá trình thực thi hiện tại. Những chi tiết này có thể hữu ích trong việc xây dựng các bộ đánh chặn tổng quát hơn có thể hoạt động trên nhiều controllers, phương thức và ngữ cảnh thực thi. Tìm hiểu thêm về `ExecutionContext` [tại đây](/fundamentals/execution-context).

#### Trình xử lý cuộc gọi (Call handler)

Đối số thứ hai là `CallHandler`. Giao diện `CallHandler` triển khai phương thức `handle()`, mà bạn có thể sử dụng để gọi phương thức xử lý route tại một điểm nào đó trong bộ đánh chặn của bạn. Nếu bạn không gọi phương thức `handle()` trong triển khai phương thức `intercept()` của bạn, phương thức xử lý route sẽ không được thực thi.

Cách tiếp cận này có nghĩa là phương thức `intercept()` **bao bọc** hiệu quả luồng request/response. Kết quả là, bạn có thể triển khai logic tùy chỉnh **cả trước và sau** việc thực thi xử lý route cuối cùng. Rõ ràng là bạn có thể viết mã trong phương thức `intercept()` của mình thực thi **trước** khi gọi `handle()`, nhưng làm thế nào bạn ảnh hưởng đến những gì xảy ra sau đó? Bởi vì phương thức `handle()` trả về một `Observable`, chúng ta có thể sử dụng các toán tử [RxJS](https://github.com/ReactiveX/rxjs) mạnh mẽ để thao tác thêm với phản hồi. Sử dụng thuật ngữ của Lập trình hướng khía cạnh, việc gọi xử lý route (tức là gọi `handle()`) được gọi là [Pointcut](https://en.wikipedia.org/wiki/Pointcut), chỉ ra rằng đó là điểm mà logic bổ sung của chúng ta được chèn vào.

Xem xét, ví dụ, một request `POST /cats` đến. Request này được định hướng đến handler `create()` được định nghĩa trong `CatsController`. Nếu một bộ đánh chặn không gọi phương thức `handle()` được gọi ở bất kỳ đâu trên đường đi, phương thức `create()` sẽ không được thực thi. Một khi `handle()` được gọi (và `Observable` của nó đã được trả về), handler `create()` sẽ được kích hoạt. Và một khi luồng phản hồi được nhận qua `Observable`, các hoạt động bổ sung có thể được thực hiện trên luồng, và kết quả cuối cùng được trả về cho người gọi.

<app-banner-devtools></app-banner-devtools>

#### Đánh chặn khía cạnh (Aspect interception)

Trường hợp sử dụng đầu tiên chúng ta sẽ xem xét là sử dụng bộ đánh chặn để ghi lại tương tác của người dùng (ví dụ: lưu trữ các cuộc gọi của người dùng, gửi sự kiện bất đồng bộ hoặc tính toán dấu thời gian). Chúng tôi hiển thị một `LoggingInterceptor` đơn giản dưới đây:

```typescript
@@filename(logging.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('Trước...');

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(`Sau... ${Date.now() - now}ms`)),
      );
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor {
  intercept(context, next) {
    console.log('Trước...');

    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(`Sau... ${Date.now() - now}ms`)),
      );
  }
}
```

> info **Gợi ý** `NestInterceptor<T, R>` là một giao diện generic trong đó `T` chỉ ra kiểu của `Observable<T>` (hỗ trợ luồng phản hồi), và `R` là kiểu của giá trị được bọc bởi `Observable<R>`.

> warning **Lưu ý** Bộ đánh chặn, giống như controllers, providers, guards, v.v., có thể **inject dependencies** thông qua `constructor` của chúng.

Vì `handle()` trả về một `Observable` của RxJS, chúng ta có nhiều lựa chọn về các toán tử mà chúng ta có thể sử dụng để thao tác với luồng. Trong ví dụ trên, chúng ta đã sử dụng toán tử `tap()`, gọi hàm ghi log ẩn danh của chúng ta khi kết thúc hoặc ngoại lệ của luồng observable, nhưng không can thiệp vào chu kỳ phản hồi.

#### Liên kết bộ đánh chặn (Binding interceptors)

Để thiết lập bộ đánh chặn, chúng ta sử dụng decorator `@UseInterceptors()` được import từ package `@nestjs/common`. Giống như [pipes](/pipes) và [guards](/guards), bộ đánh chặn có thể có phạm vi controller, phạm vi phương thức hoặc phạm vi toàn cục.

```typescript
@@filename(cats.controller)
@UseInterceptors(LoggingInterceptor)
export class CatsController {}
```

> info **Gợi ý** Decorator `@UseInterceptors()` được import từ package `@nestjs/common`.

Sử dụng cấu trúc trên, mỗi route handler được định nghĩa trong `CatsController` sẽ sử dụng `LoggingInterceptor`. Khi ai đó gọi endpoint `GET /cats`, bạn sẽ thấy đầu ra sau trong đầu ra tiêu chuẩn của bạn:

```typescript
Trước...
Sau... 1ms
```

Lưu ý rằng chúng ta đã truyền class `LoggingInterceptor` (thay vì một instance), để lại trách nhiệm khởi tạo cho framework và cho phép dependency injection. Giống như với pipes, guards và bộ lọc ngoại lệ, chúng ta cũng có thể truyền một instance tại chỗ:

```typescript
@@filename(cats.controller)
@UseInterceptors(new LoggingInterceptor())
export class CatsController {}
```

Như đã đề cập, cấu trúc trên gắn bộ đánh chặn vào mọi handler được khai báo bởi controller này. Nếu chúng ta muốn giới hạn phạm vi của bộ đánh chặn cho một phương thức duy nhất, chúng ta chỉ cần áp dụng decorator ở cấp độ **phương thức**.

Để thiết lập một bộ đánh chặn toàn cục, chúng ta sử dụng phương thức `useGlobalInterceptors()` của instance ứng dụng Nest:

```typescript
const app = await NestFactory.create(AppModule);
app.useGlobalInterceptors(new LoggingInterceptor());
```

Bộ đánh chặn toàn cục được sử dụng trong toàn bộ ứng dụng, cho mọi controller và mọi route handler. Về mặt dependency injection, bộ đánh chặn toàn cục được đăng ký từ bên ngoài bất kỳ module nào (với `useGlobalInterceptors()`, như trong ví dụ trên) không thể inject dependencies vì điều này được thực hiện bên ngoài ngữ cảnh của bất kỳ module nào. Để giải quyết vấn đề này, bạn có thể thiết lập một bộ đánh chặn **trực tiếp từ bất kỳ module nào** bằng cách sử dụng cấu trúc sau:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
```

> info **Gợi ý** Khi sử dụng cách tiếp cận này để thực hiện dependency injection cho bộ đánh chặn, lưu ý rằng bất kể module nào sử dụng cấu trúc này, bộ đánh chặn thực sự là toàn cục. Nên làm điều này ở đâu? Chọn module nơi bộ đánh chặn (`LoggingInterceptor` trong ví dụ trên) được định nghĩa. Ngoài ra, `useClass` không phải là cách duy nhất để xử lý đăng ký custom provider. Tìm hiểu thêm [tại đây](/fundamentals/custom-providers).

#### Ánh xạ phản hồi (Response mapping)

Chúng ta đã biết rằng `handle()` trả về một `Observable`. Luồng chứa giá trị **được trả về** từ route handler, và do đó chúng ta có thể dễ dàng thay đổi nó bằng cách sử dụng toán tử `map()` của RxJS.

> warning **Cảnh báo** Tính năng ánh xạ phản hồi không hoạt động với chiến lược phản hồi đặc thù cho thư viện (sử dụng đối tượng `@Res()` trực tiếp bị cấm).

Hãy tạo `TransformInterceptor`, sẽ sửa đổi mỗi phản hồi theo cách đơn giản để minh họa quá trình. Nó sẽ sử dụng toán tử `map()` của RxJS để gán đối tượng phản hồi vào thuộc tính `data` của một đối tượng mới được tạo, trả về đối tượng mới cho client.

```typescript
@@filename(transform.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(map(data => ({ data })));
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor {
  intercept(context, next) {
    return next.handle().pipe(map(data => ({ data })));
  }
}
```

> info **Gợi ý** Các interceptor lồng nhau hoạt động với cả phương thức `intercept()` đồng bộ và bất đồng bộ. Bạn có thể đơn giản chuyển phương thức sang `async` nếu cần thiết.

Với cấu trúc trên, khi ai đó gọi endpoint `GET /cats`, phản hồi sẽ trông như sau (giả sử route handler trả về một mảng rỗng `[]`):

```json
{
  "data": []
}
```

Interceptor có giá trị lớn trong việc tạo ra các giải pháp có thể tái sử dụng cho các yêu cầu xuất hiện trong toàn bộ ứng dụng.
Ví dụ, hãy tưởng tượng chúng ta cần chuyển đổi mỗi lần xuất hiện của giá trị `null` thành một chuỗi rỗng `''`. Chúng ta có thể làm điều đó bằng một dòng mã và liên kết interceptor toàn cục để nó sẽ tự động được sử dụng bởi mỗi handler đã đăng ký.

```typescript
@@filename()
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(map(value => value === null ? '' : value ));
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludeNullInterceptor {
  intercept(context, next) {
    return next
      .handle()
      .pipe(map(value => value === null ? '' : value ));
  }
}
```

#### Ánh xạ ngoại lệ (Exception mapping)

Một trường hợp sử dụng thú vị khác là tận dụng toán tử `catchError()` của RxJS để ghi đè các ngoại lệ được ném ra:

```typescript
@@filename(errors.interceptor)
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  BadGatewayException,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(
        catchError(err => throwError(() => new BadGatewayException())),
      );
  }
}
@@switch
import { Injectable, BadGatewayException } from '@nestjs/common';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor {
  intercept(context, next) {
    return next
      .handle()
      .pipe(
        catchError(err => throwError(() => new BadGatewayException())),
      );
  }
}
```

#### Ghi đè luồng (Stream overriding)

Có một số lý do tại sao đôi khi chúng ta muốn hoàn toàn ngăn chặn việc gọi handler và trả về một giá trị khác thay thế. Một ví dụ rõ ràng là triển khai bộ nhớ đệm để cải thiện thời gian phản hồi. Hãy xem xét một **interceptor bộ nhớ đệm** đơn giản trả về phản hồi từ bộ nhớ đệm. Trong một ví dụ thực tế, chúng ta sẽ muốn xem xét các yếu tố khác như TTL, vô hiệu hóa bộ nhớ đệm, kích thước bộ nhớ đệm, v.v., nhưng điều đó nằm ngoài phạm vi của cuộc thảo luận này. Ở đây chúng ta sẽ cung cấp một ví dụ cơ bản minh họa khái niệm chính.

```typescript
@@filename(cache.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, of } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isCached = true;
    if (isCached) {
      return of([]);
    }
    return next.handle();
  }
}
@@switch
import { Injectable } from '@nestjs/common';
import { of } from 'rxjs';

@Injectable()
export class CacheInterceptor {
  intercept(context, next) {
    const isCached = true;
    if (isCached) {
      return of([]);
    }
    return next.handle();
  }
}
```

`CacheInterceptor` của chúng ta có một biến `isCached` cố định và một phản hồi `[]` cũng cố định. Điểm quan trọng cần lưu ý là chúng ta trả về một luồng mới ở đây, được tạo bởi toán tử `of()` của RxJS, do đó route handler **sẽ không được gọi** chút nào. Khi ai đó gọi một endpoint sử dụng `CacheInterceptor`, phản hồi (một mảng rỗng cố định) sẽ được trả về ngay lập tức. Để tạo một giải pháp chung, bạn có thể tận dụng `Reflector` và tạo một decorator tùy chỉnh. `Reflector` được mô tả chi tiết trong chương [guards](/guards).

#### Thêm các toán tử (More operators)

Khả năng thao tác luồng bằng các toán tử RxJS mang lại cho chúng ta nhiều khả năng. Hãy xem xét một trường hợp sử dụng phổ biến khác. Hãy tưởng tượng bạn muốn xử lý **timeout** cho các yêu cầu route. Khi endpoint của bạn không trả về bất cứ thứ gì sau một khoảng thời gian, bạn muốn kết thúc bằng một phản hồi lỗi. Cấu trúc sau đây cho phép điều này:

```typescript
@@filename(timeout.interceptor)
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(5000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  };
};
@@switch
import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor {
  intercept(context, next) {
    return next.handle().pipe(
      timeout(5000),
      catchError(err => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        return throwError(() => err);
      }),
    );
  };
};
```

Sau 5 giây, xử lý yêu cầu sẽ bị hủy bỏ. Bạn cũng có thể thêm logic tùy chỉnh trước khi ném `RequestTimeoutException` (ví dụ: giải phóng tài nguyên).
