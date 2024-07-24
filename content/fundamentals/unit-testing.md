### Kiểm thử (Testing)

Kiểm thử tự động được coi là một phần thiết yếu của bất kỳ nỗ lực phát triển phần mềm nghiêm túc nào. Tự động hóa giúp dễ dàng lặp lại các bài kiểm thử cá nhân hoặc bộ kiểm thử một cách nhanh chóng và dễ dàng trong quá trình phát triển. Điều này giúp đảm bảo các phiên bản đáp ứng được các mục tiêu về chất lượng và hiệu suất. Tự động hóa giúp tăng độ bao phủ và cung cấp vòng phản hồi nhanh hơn cho các nhà phát triển. Tự động hóa vừa tăng năng suất của từng nhà phát triển vừa đảm bảo các bài kiểm thử được chạy tại các thời điểm quan trọng trong vòng đời phát triển, chẳng hạn như khi check-in mã nguồn, tích hợp tính năng và phát hành phiên bản.

Các bài kiểm thử như vậy thường bao gồm nhiều loại khác nhau, bao gồm kiểm thử đơn vị, kiểm thử đầu cuối (e2e), kiểm thử tích hợp, và nhiều loại khác. Mặc dù những lợi ích là không thể phủ nhận, việc thiết lập chúng có thể rất tẻ nhạt. Nest nỗ lực thúc đẩy các phương pháp phát triển tốt nhất, bao gồm cả kiểm thử hiệu quả, vì vậy nó bao gồm các tính năng như sau để giúp các nhà phát triển và nhóm xây dựng và tự động hóa các bài kiểm thử. Nest:

- tự động tạo khung cho các bài kiểm thử đơn vị mặc định cho các thành phần và kiểm thử e2e cho các ứng dụng
- cung cấp công cụ mặc định (như trình chạy kiểm thử tạo một bộ tải module/ứng dụng độc lập)
- cung cấp tích hợp với [Jest](https://github.com/facebook/jest) và [Supertest](https://github.com/visionmedia/supertest) ngay từ đầu, trong khi vẫn không phụ thuộc vào các công cụ kiểm thử
- làm cho hệ thống tiêm phụ thuộc của Nest có sẵn trong môi trường kiểm thử để dễ dàng mô phỏng các thành phần

Như đã đề cập, bạn có thể sử dụng bất kỳ **framework kiểm thử** nào mà bạn thích, vì Nest không ép buộc bất kỳ công cụ cụ thể nào. Chỉ cần thay thế các phần tử cần thiết (như trình chạy kiểm thử), và bạn vẫn sẽ được hưởng lợi từ các cơ sở kiểm thử sẵn có của Nest.

#### Cài đặt (Installation)

Để bắt đầu, trước tiên hãy cài đặt gói cần thiết:

```bash
$ npm i --save-dev @nestjs/testing
```

#### Kiểm thử đơn vị (Unit testing)

Trong ví dụ sau, chúng ta kiểm thử hai lớp: `CatsController` và `CatsService`. Như đã đề cập, [Jest](https://github.com/facebook/jest) được cung cấp như framework kiểm thử mặc định. Nó đóng vai trò là một trình chạy kiểm thử và cũng cung cấp các hàm assert và tiện ích test-double giúp mô phỏng, theo dõi, v.v. Trong bài kiểm thử cơ bản sau, chúng ta khởi tạo thủ công các lớp này và đảm bảo rằng bộ điều khiển và dịch vụ đáp ứng hợp đồng API của chúng.

```typescript
@@filename(cats.controller.spec)
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
@@switch
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

> info **Gợi ý** Giữ các tệp kiểm thử của bạn gần với các lớp mà chúng kiểm thử. Các tệp kiểm thử nên có hậu tố `.spec` hoặc `.test`.

Vì mẫu trên là đơn giản, chúng ta không thực sự kiểm thử bất cứ điều gì cụ thể của Nest. Thực tế, chúng ta thậm chí không sử dụng tiêm phụ thuộc (chú ý rằng chúng ta truyền một instance của `CatsService` cho `catsController` của chúng ta). Hình thức kiểm thử này - nơi chúng ta khởi tạo thủ công các lớp đang được kiểm thử - thường được gọi là **kiểm thử cô lập** vì nó độc lập với framework. Hãy giới thiệu một số khả năng nâng cao hơn giúp bạn kiểm thử các ứng dụng sử dụng nhiều tính năng của Nest hơn.

#### Tiện ích kiểm thử (Testing utilities)

Gói `@nestjs/testing` cung cấp một bộ tiện ích cho phép quá trình kiểm thử mạnh mẽ hơn. Hãy viết lại ví dụ trước đó bằng cách sử dụng lớp `Test` tích hợp:

```typescript
@@filename(cats.controller.spec)
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = moduleRef.get<CatsService>(CatsService);
    catsController = moduleRef.get<CatsController>(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
@@switch
import { Test } from '@nestjs/testing';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController;
  let catsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
        controllers: [CatsController],
        providers: [CatsService],
      }).compile();

    catsService = moduleRef.get(CatsService);
    catsController = moduleRef.get(CatsController);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});
```

Lớp `Test` rất hữu ích để cung cấp một ngữ cảnh thực thi ứng dụng về cơ bản mô phỏng toàn bộ runtime của Nest, nhưng cung cấp cho bạn các hook giúp dễ dàng quản lý các instance của lớp, bao gồm cả mô phỏng và ghi đè. Lớp `Test` có một phương thức `createTestingModule()` nhận một đối tượng metadata module làm đối số (cùng đối tượng bạn truyền cho decorator `@Module()`). Phương thức này trả về một instance `TestingModule` mà đến lượt nó cung cấp một vài phương thức. Đối với các bài kiểm thử đơn vị, phương thức quan trọng là phương thức `compile()`. Phương thức này khởi động một module với các phụ thuộc của nó (tương tự như cách một ứng dụng được khởi động trong tệp `main.ts` thông thường bằng cách sử dụng `NestFactory.create()`), và trả về một module sẵn sàng để kiểm thử.

> info **Gợi ý** Phương thức `compile()` là **bất đồng bộ** và do đó phải được đợi. Một khi module được biên dịch, bạn có thể truy xuất bất kỳ instance **tĩnh** nào mà nó khai báo (bộ điều khiển và nhà cung cấp) bằng cách sử dụng phương thức `get()`.

`TestingModule` kế thừa từ lớp [module reference](/fundamentals/module-ref), và do đó khả năng giải quyết động các nhà cung cấp có phạm vi (transient hoặc request-scoped). Thực hiện điều này với phương thức `resolve()` (phương thức `get()` chỉ có thể truy xuất các instance tĩnh).

```typescript
const moduleRef = await Test.createTestingModule({
  controllers: [CatsController],
  providers: [CatsService],
}).compile();

catsService = await moduleRef.resolve(CatsService);
```

> warning **Cảnh báo** Phương thức `resolve()` trả về một instance duy nhất của nhà cung cấp, từ cây con **DI container** riêng của nó. Mỗi cây con có một định danh ngữ cảnh duy nhất. Do đó, nếu bạn gọi phương thức này nhiều hơn một lần và so sánh các tham chiếu instance, bạn sẽ thấy rằng chúng không bằng nhau.

> info **Gợi ý** Tìm hiểu thêm về các tính năng tham chiếu module [tại đây](/fundamentals/module-ref).

Thay vì sử dụng phiên bản sản xuất của bất kỳ nhà cung cấp nào, bạn có thể ghi đè nó bằng một [nhà cung cấp tùy chỉnh](/fundamentals/custom-providers) cho mục đích kiểm thử. Ví dụ, bạn có thể mô phỏng một dịch vụ cơ sở dữ liệu thay vì kết nối với cơ sở dữ liệu trực tiếp. Chúng ta sẽ đề cập đến các ghi đè trong phần tiếp theo, nhưng chúng cũng có sẵn cho các bài kiểm thử đơn vị.

<app-banner-courses></app-banner-courses>

#### Tự động mô phỏng (Auto mocking)

Nest cũng cho phép bạn định nghĩa một nhà máy mô phỏng để áp dụng cho tất cả các phụ thuộc còn thiếu của bạn. Điều này hữu ích cho các trường hợp bạn có một số lượng lớn phụ thuộc trong một lớp và việc mô phỏng tất cả chúng sẽ mất nhiều thời gian và cần nhiều thiết lập. Để sử dụng tính năng này, `createTestingModule()` sẽ cần được nối chuỗi với phương thức `useMocker()`, truyền vào một nhà máy cho các mô phỏng phụ thuộc của bạn. Nhà máy này có thể nhận một token tùy chọn, là một token instance, bất kỳ token nào hợp lệ cho một nhà cung cấp Nest, và trả về một triển khai mô phỏng. Dưới đây là một ví dụ về việc tạo một trình mô phỏng chung sử dụng [`jest-mock`](https://www.npmjs.com/package/jest-mock) và một mô phỏng cụ thể cho `CatsService` sử dụng `jest.fn()`.

```typescript
// ...
import { ModuleMocker, MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('CatsController', () => {
  let controller: CatsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CatsController],
    })
      .useMocker((token) => {
        const results = ['test1', 'test2'];
        if (token === CatsService) {
          return { findAll: jest.fn().mockResolvedValue(results) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(CatsController);
  });
});
```

Bạn cũng có thể truy xuất các mô phỏng này từ container kiểm thử như bạn thường làm với các nhà cung cấp tùy chỉnh, `moduleRef.get(CatsService)`.

> info **Gợi ý** Một nhà máy mô phỏng chung, như `createMock` từ [`@golevelup/ts-jest`](https://github.com/golevelup/nestjs/tree/master/packages/testing) cũng có thể được truyền trực tiếp.

> info **Gợi ý** Các nhà cung cấp `REQUEST` và `INQUIRER` không thể được tự động mô phỏng vì chúng đã được định nghĩa trước trong ngữ cảnh. Tuy nhiên, chúng có thể được _ghi đè_ bằng cách sử dụng cú pháp nhà cung cấp tùy chỉnh hoặc bằng cách sử dụng phương thức `.overrideProvider`.

#### Kiểm thử đầu cuối (End-to-end testing)

Không giống như kiểm thử đơn vị, tập trung vào các module và lớp riêng lẻ, kiểm thử đầu cuối (e2e) bao gồm tương tác của các lớp và module ở mức tổng hợp hơn -- gần hơn với loại tương tác mà người dùng cuối sẽ có với hệ thống sản xuất. Khi một ứng dụng phát triển, việc kiểm thử thủ công hành vi đầu cuối của mỗi điểm cuối API trở nên khó khăn. Các bài kiểm thử đầu cuối tự động giúp chúng ta đảm bảo rằng hành vi tổng thể của hệ thống là chính xác và đáp ứng các yêu cầu của dự án. Để thực hiện các bài kiểm thử e2e, chúng ta sử dụng cấu hình tương tự như cấu hình mà chúng ta vừa đề cập trong phần **kiểm thử đơn vị**. Ngoài ra, Nest giúp dễ dàng sử dụng thư viện [Supertest](https://github.com/visionmedia/supertest) để mô phỏng các yêu cầu HTTP.

```typescript
@@filename(cats.e2e-spec)
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET cats`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
@@switch
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';
import { INestApplication } from '@nestjs/common';

describe('Cats', () => {
  let app: INestApplication;
  let catsService = { findAll: () => ['test'] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CatsModule],
    })
      .overrideProvider(CatsService)
      .useValue(catsService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it(`/GET cats`, () => {
    return request(app.getHttpServer())
      .get('/cats')
      .expect(200)
      .expect({
        data: catsService.findAll(),
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

> info **Gợi ý** Nếu bạn đang sử dụng [Fastify](/techniques/performance) làm bộ chuyển đổi HTTP của mình, nó yêu cầu cấu hình hơi khác một chút và có khả năng kiểm thử tích hợp sẵn:
>
> ```ts
> let app: NestFastifyApplication;
>
> beforeAll(async () => {
>   app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
>
>   await app.init();
>   await app.getHttpAdapter().getInstance().ready();
> });
>
> it(`/GET cats`, () => {
>   return app
>     .inject({
>       method: 'GET',
>       url: '/cats',
>     })
>     .then((result) => {
>       expect(result.statusCode).toEqual(200);
>       expect(result.payload).toEqual(/* expectedPayload */);
>     });
> });
>
> afterAll(async () => {
>   await app.close();
> });
> ```

Trong ví dụ này, chúng ta xây dựng dựa trên một số khái niệm đã được mô tả trước đó. Ngoài phương thức `compile()` mà chúng ta đã sử dụng trước đó, bây giờ chúng ta sử dụng phương thức `createNestApplication()` để khởi tạo một môi trường runtime Nest đầy đủ. Chúng ta lưu một tham chiếu đến ứng dụng đang chạy trong biến `app` của chúng ta để có thể sử dụng nó để mô phỏng các yêu cầu HTTP.

Chúng ta mô phỏng các bài kiểm thử HTTP bằng cách sử dụng hàm `request()` từ Supertest. Chúng ta muốn các yêu cầu HTTP này định tuyến đến ứng dụng Nest đang chạy của chúng ta, vì vậy chúng ta truyền cho hàm `request()` một tham chiếu đến trình lắng nghe HTTP cơ bản của Nest (mà đến lượt nó có thể được cung cấp bởi nền tảng Express). Do đó, việc xây dựng `request(app.getHttpServer())`. Lệnh gọi đến `request()` đưa cho chúng ta một HTTP Server được bọc, bây giờ được kết nối với ứng dụng Nest, nó hiển thị các phương thức để mô phỏng một yêu cầu HTTP thực tế. Ví dụ, sử dụng `request(...).get('/cats')` sẽ khởi tạo một yêu cầu đến ứng dụng Nest giống hệt với một yêu cầu HTTP **thực tế** như `get '/cats'` đến qua mạng.

Trong ví dụ này, chúng ta cũng cung cấp một triển khai thay thế (test-double) của `CatsService` chỉ đơn giản trả về một giá trị cố định mà chúng ta có thể kiểm tra. Sử dụng `overrideProvider()` để cung cấp một triển khai thay thế như vậy. Tương tự, Nest cung cấp các phương thức để ghi đè modules, guards, interceptors, filters và pipes với các phương thức `overrideModule()`, `overrideGuard()`, `overrideInterceptor()`, `overrideFilter()`, và `overridePipe()` tương ứng.

Mỗi phương thức ghi đè (ngoại trừ `overrideModule()`) trả về một đối tượng với 3 phương thức khác nhau phản ánh những phương thức được mô tả cho [nhà cung cấp tùy chỉnh](https://docs.nestjs.com/fundamentals/custom-providers):

- `useClass`: bạn cung cấp một lớp sẽ được khởi tạo để cung cấp instance để ghi đè đối tượng (nhà cung cấp, guard, v.v.).
- `useValue`: bạn cung cấp một instance sẽ ghi đè đối tượng.
- `useFactory`: bạn cung cấp một hàm trả về một instance sẽ ghi đè đối tượng.

Mặt khác, `overrideModule()` trả về một đối tượng với phương thức `useModule()`, mà bạn có thể sử dụng để cung cấp một module sẽ ghi đè module gốc, như sau:

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideModule(CatsModule)
  .useModule(AlternateCatsModule)
  .compile();
```

Mỗi loại phương thức ghi đè, đến lượt nó, trả về instance `TestingModule`, và do đó có thể được nối chuỗi với các phương thức khác theo [kiểu fluent](https://en.wikipedia.org/wiki/Fluent_interface). Bạn nên sử dụng `compile()` ở cuối chuỗi như vậy để khiến Nest khởi tạo và khởi động module.

Ngoài ra, đôi khi bạn có thể muốn cung cấp một logger tùy chỉnh, ví dụ khi các bài kiểm thử được chạy (ví dụ, trên một máy chủ CI). Sử dụng phương thức `setLogger()` và truyền một đối tượng thỏa mãn giao diện `LoggerService` để hướng dẫn `TestModuleBuilder` cách ghi log trong quá trình kiểm thử (mặc định, chỉ các log "error" sẽ được ghi ra console).

Module đã được biên dịch có một số phương thức hữu ích, như được mô tả trong bảng sau:

<table>
  <tr>
    <td>
      <code>createNestApplication()</code>
    </td>
    <td>
      Tạo và trả về một ứng dụng Nest (instance <code>INestApplication</code>) dựa trên module đã cho.
      Lưu ý rằng bạn phải khởi tạo ứng dụng thủ công bằng phương thức <code>init()</code>.
    </td>
  </tr>
  <tr>
    <td>
      <code>createNestMicroservice()</code>
    </td>
    <td>
      Tạo và trả về một microservice Nest (instance <code>INestMicroservice</code>) dựa trên module đã cho.
    </td>
  </tr>
  <tr>
    <td>
      <code>get()</code>
    </td>
    <td>
      Truy xuất một instance tĩnh của một bộ điều khiển hoặc nhà cung cấp (bao gồm guards, filters, v.v.) có sẵn trong ngữ cảnh ứng dụng. Được kế thừa từ lớp <a href="/fundamentals/module-ref">tham chiếu module</a>.
    </td>
  </tr>
  <tr>
     <td>
      <code>resolve()</code>
    </td>
    <td>
      Truy xuất một instance có phạm vi được tạo động (request hoặc transient) của một bộ điều khiển hoặc nhà cung cấp (bao gồm guards, filters, v.v.) có sẵn trong ngữ cảnh ứng dụng. Được kế thừa từ lớp <a href="/fundamentals/module-ref">tham chiếu module</a>.
    </td>
  </tr>
  <tr>
    <td>
      <code>select()</code>
    </td>
    <td>
      Di chuyển qua đồ thị phụ thuộc của module; có thể được sử dụng để truy xuất một instance cụ thể từ module đã chọn (được sử dụng cùng với chế độ nghiêm ngặt (<code>strict: true</code>) trong phương thức <code>get()</code>).
    </td>
  </tr>
</table>

> info **Gợi ý** Giữ các tệp kiểm thử e2e của bạn trong thư mục `test`. Các tệp kiểm thử nên có hậu tố `.e2e-spec`.

#### Ghi đè các enhancer đã đăng ký toàn cục (Overriding globally registered enhancers)

Nếu bạn có một guard (hoặc pipe, interceptor, hoặc filter) đã đăng ký toàn cục, bạn cần thực hiện thêm một vài bước để ghi đè enhancer đó. Để tóm tắt, việc đăng ký ban đầu trông như thế này:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
],
```

Điều này đăng ký guard như một nhà cung cấp "multi" thông qua token `APP_*`. Để có thể thay thế `JwtAuthGuard` ở đây, việc đăng ký cần sử dụng một nhà cung cấp đã tồn tại trong slot này:

```typescript
providers: [
  {
    provide: APP_GUARD,
    useExisting: JwtAuthGuard,
    // ^^^^^^^^ lưu ý việc sử dụng 'useExisting' thay vì 'useClass'
  },
  JwtAuthGuard,
],
```

> info thông tin **Gợi ý** Thay đổi `useClass` thành `useExisting` để tham chiếu đến một nhà cung cấp đã đăng ký thay vì để Nest khởi tạo nó đằng sau mã thông báo.

Bây giờ `JwtAuthGuard` có thể được Nest nhìn thấy như một nhà cung cấp thông thường có thể được ghi đè khi tạo `TestingModule`:

```typescript
const moduleRef = await Test.createTestingModule({
  imports: [AppModule],
})
  .overrideProvider(JwtAuthGuard)
  .useClass(MockAuthGuard)
  .compile();
```

Bây giờ tất cả các bài kiểm tra của bạn sẽ sử dụng `MockAuthGuard` cho mọi yêu cầu.

#### Kiểm tra các trường hợp có phạm vi yêu cầu (Testing request-scoped instances)

Các nhà cung cấp có [phạm vi yêu cầu](/fundamentals/injection-scopes) được tạo ra duy nhất cho mỗi **yêu cầu** đến. Trường hợp này sẽ bị thu gom rác sau khi yêu cầu đã được xử lý xong. Điều này gây ra một vấn đề, bởi vì chúng ta không thể truy cập vào một cây con tiêm phụ thuộc được tạo ra đặc biệt cho một yêu cầu được kiểm tra.

Chúng ta biết (dựa trên các phần trên) rằng phương thức `resolve()` có thể được sử dụng để truy xuất một lớp được khởi tạo động. Ngoài ra, như đã mô tả <a href="https://docs.nestjs.com/fundamentals/module-ref#resolving-scoped-providers">ở đây</a>, chúng ta biết rằng chúng ta có thể truyền một định danh ngữ cảnh duy nhất để kiểm soát vòng đời của một cây con container DI. Làm thế nào để chúng ta tận dụng điều này trong một ngữ cảnh kiểm tra?

Chiến lược là tạo ra một định danh ngữ cảnh trước đó và buộc Nest sử dụng ID cụ thể này để tạo một cây con cho tất cả các yêu cầu đến. Bằng cách này, chúng ta sẽ có thể truy xuất các trường hợp được tạo ra cho một yêu cầu được kiểm tra.

Để thực hiện điều này, sử dụng `jest.spyOn()` trên `ContextIdFactory`:

```typescript
const contextId = ContextIdFactory.create();
jest.spyOn(ContextIdFactory, 'getByRequest').mockImplementation(() => contextId);
```

Bây giờ chúng ta có thể sử dụng `contextId` để truy cập vào một cây con container DI duy nhất được tạo ra cho bất kỳ yêu cầu tiếp theo nào.

```typescript
catsService = await moduleRef.resolve(CatsService, contextId);
```
