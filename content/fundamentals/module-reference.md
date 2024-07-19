### Tham chiếu Module (Module reference)

Nest cung cấp lớp `ModuleRef` để điều hướng danh sách nội bộ các nhà cung cấp và lấy tham chiếu đến bất kỳ nhà cung cấp nào bằng cách sử dụng token tiêm của nó làm khóa tra cứu. Lớp `ModuleRef` cũng cung cấp cách để khởi tạo động cả nhà cung cấp tĩnh và có phạm vi. `ModuleRef` có thể được tiêm vào một lớp theo cách thông thường:

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(private moduleRef: ModuleRef) {}
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }
}
```

> info **Gợi ý** Lớp `ModuleRef` được import từ gói `@nestjs/core`.

#### Truy xuất các thể hiện (Retrieving instances)

Thể hiện `ModuleRef` (sau đây chúng ta sẽ gọi là **tham chiếu module**) có phương thức `get()`. Mặc định, phương thức này trả về một nhà cung cấp, bộ điều khiển, hoặc injectable (ví dụ: guard, interceptor, v.v.) đã được đăng ký và đã được khởi tạo trong _module hiện tại_ bằng cách sử dụng token tiêm/tên lớp của nó. Nếu không tìm thấy thể hiện, một ngoại lệ sẽ được đưa ra.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private service: Service;
  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    this.service = this.moduleRef.get(Service);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  onModuleInit() {
    this.service = this.moduleRef.get(Service);
  }
}
```

> warning **Cảnh báo** Bạn không thể truy xuất các nhà cung cấp có phạm vi (tạm thời hoặc phạm vi yêu cầu) bằng phương thức `get()`. Thay vào đó, hãy sử dụng kỹ thuật được mô tả <a href="https://docs.nestjs.com/fundamentals/module-ref#resolving-scoped-providers">bên dưới</a>. Tìm hiểu cách kiểm soát phạm vi [tại đây](/fundamentals/injection-scopes).

Để truy xuất một nhà cung cấp từ ngữ cảnh toàn cục (ví dụ: nếu nhà cung cấp đã được tiêm trong một module khác), truyền tùy chọn `{{ '{' }} strict: false {{ '}' }}` làm đối số thứ hai cho `get()`.

```typescript
this.moduleRef.get(Service, { strict: false });
```

#### Giải quyết các nhà cung cấp có phạm vi (Resolving scoped providers)

Để giải quyết động một nhà cung cấp có phạm vi (tạm thời hoặc phạm vi yêu cầu), sử dụng phương thức `resolve()`, truyền token tiêm của nhà cung cấp làm đối số.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private transientService: TransientService;
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.transientService = await this.moduleRef.resolve(TransientService);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    this.transientService = await this.moduleRef.resolve(TransientService);
  }
}
```

Phương thức `resolve()` trả về một thể hiện duy nhất của nhà cung cấp, từ **cây con container DI** riêng của nó. Mỗi cây con có một **định danh ngữ cảnh** duy nhất. Do đó, nếu bạn gọi phương thức này nhiều lần và so sánh các tham chiếu thể hiện, bạn sẽ thấy rằng chúng không bằng nhau.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService),
      this.moduleRef.resolve(TransientService),
    ]);
    console.log(transientServices[0] === transientServices[1]); // false
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService),
      this.moduleRef.resolve(TransientService),
    ]);
    console.log(transientServices[0] === transientServices[1]); // false
  }
}
```

Để tạo một thể hiện duy nhất qua nhiều lần gọi `resolve()`, và đảm bảo chúng chia sẻ cùng một cây con container DI được tạo, bạn có thể truyền một định danh ngữ cảnh cho phương thức `resolve()`. Sử dụng lớp `ContextIdFactory` để tạo một định danh ngữ cảnh. Lớp này cung cấp phương thức `create()` trả về một định danh duy nhất phù hợp.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    const contextId = ContextIdFactory.create();
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService, contextId),
      this.moduleRef.resolve(TransientService, contextId),
    ]);
    console.log(transientServices[0] === transientServices[1]); // true
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    const contextId = ContextIdFactory.create();
    const transientServices = await Promise.all([
      this.moduleRef.resolve(TransientService, contextId),
      this.moduleRef.resolve(TransientService, contextId),
    ]);
    console.log(transientServices[0] === transientServices[1]); // true
  }
}
```

> info **Gợi ý** Lớp `ContextIdFactory` được import từ gói `@nestjs/core`.

#### Đăng ký nhà cung cấp `REQUEST` (Registering `REQUEST` provider)

Các định danh ngữ cảnh được tạo thủ công (bằng `ContextIdFactory.create()`) đại diện cho các cây con DI trong đó nhà cung cấp `REQUEST` là `undefined` vì chúng không được khởi tạo và quản lý bởi hệ thống tiêm phụ thuộc của Nest.

Để đăng ký một đối tượng `REQUEST` tùy chỉnh cho một cây con DI được tạo thủ công, sử dụng phương thức `ModuleRef#registerRequestByContextId()`, như sau:

```typescript
const contextId = ContextIdFactory.create();
this.moduleRef.registerRequestByContextId(/* ĐỐI_TƯỢNG_YÊU_CẦU_CỦA_BẠN */, contextId);
```

#### Lấy cây con hiện tại (Getting current sub-tree)

Đôi khi, bạn có thể muốn giải quyết một thể hiện của một nhà cung cấp có phạm vi yêu cầu trong một **ngữ cảnh yêu cầu**. Giả sử rằng `CatsService` có phạm vi yêu cầu và bạn muốn giải quyết thể hiện `CatsRepository` cũng được đánh dấu là một nhà cung cấp có phạm vi yêu cầu. Để chia sẻ cùng một cây con container DI, bạn phải lấy định danh ngữ cảnh hiện tại thay vì tạo một cái mới (ví dụ: với hàm `ContextIdFactory.create()`, như đã hiển thị ở trên). Để lấy định danh ngữ cảnh hiện tại, bắt đầu bằng cách tiêm đối tượng yêu cầu sử dụng decorator `@Inject()`.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(
    @Inject(REQUEST) private request: Record<string, unknown>,
  ) {}
}
@@switch
@Injectable()
@Dependencies(REQUEST)
export class CatsService {
  constructor(request) {
    this.request = request;
  }
}
```

> info **Gợi ý** Tìm hiểu thêm về nhà cung cấp yêu cầu [tại đây](https://docs.nestjs.com/fundamentals/injection-scopes#request-provider).

Bây giờ, sử dụng phương thức `getByRequest()` của lớp `ContextIdFactory` để tạo một id ngữ cảnh dựa trên đối tượng yêu cầu, và truyền nó cho lệnh gọi `resolve()`:

```typescript
const contextId = ContextIdFactory.getByRequest(this.request);
const catsRepository = await this.moduleRef.resolve(CatsRepository, contextId);
```

#### Khởi tạo động các lớp tùy chỉnh (Instantiating custom classes dynamically)

Để khởi tạo động một lớp **chưa được đăng ký trước đó** như một **nhà cung cấp**, sử dụng phương thức `create()` của tham chiếu module.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService implements OnModuleInit {
  private catsFactory: CatsFactory;
  constructor(private moduleRef: ModuleRef) {}

  async onModuleInit() {
    this.catsFactory = await this.moduleRef.create(CatsFactory);
  }
}
@@switch
@Injectable()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  async onModuleInit() {
    this.catsFactory = await this.moduleRef.create(CatsFactory);
  }
}
```

Kỹ thuật này cho phép bạn khởi tạo có điều kiện các lớp khác nhau bên ngoài container của framework.

<app-banner-devtools></app-banner-devtools>
