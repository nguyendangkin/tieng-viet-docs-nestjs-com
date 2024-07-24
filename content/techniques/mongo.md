### Mongo

Nest hỗ trợ hai phương pháp để tích hợp với cơ sở dữ liệu [MongoDB](https://www.mongodb.com/). Bạn có thể sử dụng module [TypeORM](https://github.com/typeorm/typeorm) tích hợp sẵn được mô tả [ở đây](/techniques/database), có connector cho MongoDB, hoặc sử dụng [Mongoose](https://mongoosejs.com), công cụ mô hình hóa đối tượng MongoDB phổ biến nhất. Trong chương này, chúng ta sẽ mô tả phương pháp sau, sử dụng gói `@nestjs/mongoose` chuyên dụng.

Bắt đầu bằng cách cài đặt [các dependencies cần thiết](https://github.com/Automattic/mongoose):

```bash
$ npm i @nestjs/mongoose mongoose
```

Sau khi quá trình cài đặt hoàn tất, chúng ta có thể import `MongooseModule` vào `AppModule` gốc.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/nest')],
})
export class AppModule {}
```

Phương thức `forRoot()` chấp nhận cùng một đối tượng cấu hình như `mongoose.connect()` từ gói Mongoose, như được mô tả [ở đây](https://mongoosejs.com/docs/connections.html).

#### Tiêm mô hình (Model injection)

Với Mongoose, mọi thứ đều bắt nguồn từ một [Schema](http://mongoosejs.com/docs/guide.html). Mỗi schema ánh xạ tới một collection MongoDB và định nghĩa hình dạng của các tài liệu trong collection đó. Schema được sử dụng để định nghĩa [Models](https://mongoosejs.com/docs/models.html). Models chịu trách nhiệm tạo và đọc tài liệu từ cơ sở dữ liệu MongoDB cơ bản.

Schema có thể được tạo bằng decorators của NestJS, hoặc bằng Mongoose một cách thủ công. Việc sử dụng decorators để tạo schema giúp giảm đáng kể boilerplate và cải thiện khả năng đọc của mã tổng thể.

Hãy định nghĩa `CatSchema`:

```typescript
@@filename(schemas/cat.schema)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatDocument = HydratedDocument<Cat>;

@Schema()
export class Cat {
  @Prop()
  name: string;

  @Prop()
  age: number;

  @Prop()
  breed: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
```

> info **Gợi ý** Lưu ý rằng bạn cũng có thể tạo định nghĩa schema thô bằng cách sử dụng lớp `DefinitionsFactory` (từ `nestjs/mongoose`). Điều này cho phép bạn sửa đổi thủ công định nghĩa schema được tạo ra dựa trên metadata bạn đã cung cấp. Điều này hữu ích cho một số trường hợp đặc biệt mà có thể khó để biểu diễn mọi thứ bằng decorators.

Decorator `@Schema()` đánh dấu một lớp là định nghĩa schema. Nó ánh xạ lớp `Cat` của chúng ta tới một collection MongoDB cùng tên, nhưng với một chữ "s" bổ sung ở cuối - vì vậy tên collection mongo cuối cùng sẽ là `cats`. Decorator này chấp nhận một đối số tùy chọn duy nhất là một đối tượng tùy chọn schema. Hãy nghĩ về nó như đối tượng bạn thường truyền vào như đối số thứ hai của constructor của lớp `mongoose.Schema` (ví dụ: `new mongoose.Schema(_, options)`). Để tìm hiểu thêm về các tùy chọn schema có sẵn, xem [chương này](https://mongoosejs.com/docs/guide.html#options).

Decorator `@Prop()` định nghĩa một thuộc tính trong tài liệu. Ví dụ, trong định nghĩa schema ở trên, chúng ta đã định nghĩa ba thuộc tính: `name`, `age`, và `breed`. Các loại schema (schema types) cho những thuộc tính này được suy ra tự động nhờ khả năng metadata (và reflection) của TypeScript. Tuy nhiên, trong các kịch bản phức tạp hơn mà các loại không thể được phản ánh ngầm định (ví dụ: mảng hoặc cấu trúc đối tượng lồng nhau), các loại phải được chỉ định rõ ràng, như sau:

```typescript
@Prop([String])
tags: string[];
```

Ngoài ra, decorator `@Prop()` chấp nhận một đối số là đối tượng tùy chọn ([đọc thêm](https://mongoosejs.com/docs/schematypes.html#schematype-options) về các tùy chọn có sẵn). Với điều này, bạn có thể chỉ ra liệu một thuộc tính có bắt buộc hay không, chỉ định giá trị mặc định, hoặc đánh dấu nó là bất biến. Ví dụ:

```typescript
@Prop({ required: true })
name: string;
```

Trong trường hợp bạn muốn chỉ định mối quan hệ với một model khác, sau này để populate, bạn cũng có thể sử dụng decorator `@Prop()`. Ví dụ, nếu `Cat` có `Owner` được lưu trữ trong một collection khác gọi là `owners`, thuộc tính nên có type và ref. Ví dụ:

```typescript
import * as mongoose from 'mongoose';
import { Owner } from '../owners/schemas/owner.schema';

// bên trong định nghĩa lớp
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
owner: Owner;
```

Trong trường hợp có nhiều chủ sở hữu, cấu hình thuộc tính của bạn nên như sau:

```typescript
@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }] })
owners: Owner[];
```

Cuối cùng, định nghĩa schema **thô** cũng có thể được truyền vào decorator. Điều này hữu ích khi, ví dụ, một thuộc tính đại diện cho một đối tượng lồng nhau không được định nghĩa như một lớp. Để làm điều này, sử dụng hàm `raw()` từ gói `@nestjs/mongoose`, như sau:

```typescript
@Prop(raw({
  firstName: { type: String },
  lastName: { type: String }
}))
details: Record<string, any>;
```

Ngoài ra, nếu bạn thích **không sử dụng decorators**, bạn có thể định nghĩa schema thủ công. Ví dụ:

```typescript
export const CatSchema = new mongoose.Schema({
  name: String,
  age: Number,
  breed: String,
});
```

File `cat.schema` nằm trong một thư mục trong thư mục `cats`, nơi chúng ta cũng định nghĩa `CatsModule`. Mặc dù bạn có thể lưu trữ các file schema ở bất kỳ đâu bạn thích, chúng tôi khuyên bạn nên lưu trữ chúng gần các đối tượng **domain** liên quan, trong thư mục module thích hợp.

Hãy xem `CatsModule`:

```typescript
@@filename(cats.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';
import { Cat, CatSchema } from './schemas/cat.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }])],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
```

`MongooseModule` cung cấp phương thức `forFeature()` để cấu hình module, bao gồm việc xác định các model nào nên được đăng ký trong phạm vi hiện tại. Nếu bạn cũng muốn sử dụng các model trong một module khác, thêm MongooseModule vào phần `exports` của `CatsModule` và import `CatsModule` trong module khác.

Sau khi đã đăng ký schema, bạn có thể tiêm một model `Cat` vào `CatsService` bằng cách sử dụng decorator `@InjectModel()`:

```typescript
@@filename(cats.service)
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema';
import { CreateCatDto } from './dto/create-cat.dto';

@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name) private catModel: Model<Cat>) {}

  async create(createCatDto: CreateCatDto): Promise<Cat> {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll(): Promise<Cat[]> {
    return this.catModel.find().exec();
  }
}
@@switch
import { Model } from 'mongoose';
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Cat } from './schemas/cat.schema';

@Injectable()
@Dependencies(getModelToken(Cat.name))
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }

  async create(createCatDto) {
    const createdCat = new this.catModel(createCatDto);
    return createdCat.save();
  }

  async findAll() {
    return this.catModel.find().exec();
  }
}
```

#### Kết nối (Connection)

Đôi khi bạn có thể cần truy cập đối tượng [Mongoose Connection](https://mongoosejs.com/docs/api.html#Connection) gốc. Ví dụ, bạn có thể muốn thực hiện các lệnh gọi API gốc trên đối tượng kết nối. Bạn có thể tiêm Mongoose Connection bằng cách sử dụng decorator `@InjectConnection()` như sau:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection() private connection: Connection) {}
}
```

#### Nhiều cơ sở dữ liệu (Multiple databases)

Một số dự án yêu cầu nhiều kết nối cơ sở dữ liệu. Điều này cũng có thể đạt được với module này. Để làm việc với nhiều kết nối, trước tiên hãy tạo các kết nối. Trong trường hợp này, việc đặt tên kết nối trở nên **bắt buộc**.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionName: 'cats',
    }),
    MongooseModule.forRoot('mongodb://localhost/users', {
      connectionName: 'users',
    }),
  ],
})
export class AppModule {}
```

> warning **Lưu ý** Xin lưu ý rằng bạn không nên có nhiều kết nối mà không có tên, hoặc với cùng một tên, nếu không chúng sẽ bị ghi đè.

Với cài đặt này, bạn phải cho hàm `MongooseModule.forFeature()` biết kết nối nào nên được sử dụng.

```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }], 'cats')],
})
export class CatsModule {}
```

Bạn cũng có thể tiêm `Connection` cho một kết nối cụ thể:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class CatsService {
  constructor(@InjectConnection('cats') private connection: Connection) {}
}
```

Để tiêm một `Connection` cụ thể vào một provider tùy chỉnh (ví dụ: provider factory), sử dụng hàm `getConnectionToken()` truyền tên của kết nối như một đối số.

```typescript
{
  provide: CatsService,
  useFactory: (catsConnection: Connection) => {
    return new CatsService(catsConnection);
  },
  inject: [getConnectionToken('cats')],
}
```

Nếu bạn chỉ muốn tiêm model từ một cơ sở dữ liệu có tên, bạn có thể sử dụng tên kết nối làm tham số thứ hai cho decorator `@InjectModel()`.

```typescript
@@filename(cats.service)
@Injectable()
export class CatsService {
  constructor(@InjectModel(Cat.name, 'cats') private catModel: Model<Cat>) {}
}
@@switch
@Injectable()
@Dependencies(getModelToken(Cat.name, 'cats'))
export class CatsService {
  constructor(catModel) {
    this.catModel = catModel;
  }
}
```

#### Hooks (middleware)

Middleware (còn được gọi là pre và post hooks) là các hàm được truyền quyền kiểm soát trong quá trình thực thi các hàm bất đồng bộ. Middleware được chỉ định ở cấp độ schema và hữu ích cho việc viết plugins ([nguồn](https://mongoosejs.com/docs/middleware.html)). Việc gọi `pre()` hoặc `post()` sau khi biên dịch một model không hoạt động trong Mongoose. Để đăng ký một hook **trước** khi đăng ký model, sử dụng phương thức `forFeatureAsync()` của `MongooseModule` cùng với một provider factory (tức là `useFactory`). Với kỹ thuật này, bạn có thể truy cập đối tượng schema, sau đó sử dụng phương thức `pre()` hoặc `post()` để đăng ký một hook trên schema đó. Xem ví dụ dưới đây:

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatsSchema;
          schema.pre('save', function () {
            console.log('Hello from pre save');
          });
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
```

Giống như các [factory providers](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory) khác, hàm factory của chúng ta có thể là `async` và có thể tiêm các dependencies thông qua `inject`.

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const schema = CatsSchema;
          schema.pre('save', function() {
            console.log(
              `${configService.get('APP_NAME')}: Hello from pre save`,
            ),
          });
          return schema;
        },
        inject: [ConfigService],
      },
    ]),
  ],
})
export class AppModule {}
```

#### Plugins

Để đăng ký một [plugin](https://mongoosejs.com/docs/plugins.html) cho một schema cụ thể, sử dụng phương thức `forFeatureAsync()`.

```typescript
@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Cat.name,
        useFactory: () => {
          const schema = CatsSchema;
          schema.plugin(require('mongoose-autopopulate'));
          return schema;
        },
      },
    ]),
  ],
})
export class AppModule {}
```

Để đăng ký một plugin cho tất cả các schema cùng một lúc, gọi phương thức `.plugin()` của đối tượng `Connection`. Bạn nên truy cập kết nối trước khi các model được tạo; để làm điều này, sử dụng `connectionFactory`:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/test', {
      connectionFactory: (connection) => {
        connection.plugin(require('mongoose-autopopulate'));
        return connection;
      }
    }),
  ],
})
export class AppModule {}
```

#### (Bộ phân loại) Discriminators

[Discriminators](https://mongoosejs.com/docs/discriminators.html) là một cơ chế kế thừa schema. Chúng cho phép bạn có nhiều model với các schema chồng chéo trên cùng một collection MongoDB cơ bản.

Giả sử bạn muốn theo dõi các loại sự kiện khác nhau trong một collection duy nhất. Mọi sự kiện sẽ có một timestamp.

```typescript
@@filename(event.schema)
@Schema({ discriminatorKey: 'kind' })
export class Event {
  @Prop({
    type: String,
    required: true,
    enum: [ClickedLinkEvent.name, SignUpEvent.name],
  })
  kind: string;

  @Prop({ type: Date, required: true })
  time: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
```

> info **Gợi ý** Cách mongoose phân biệt giữa các model discriminator khác nhau là bằng "khóa discriminator", mặc định là `__t`. Mongoose thêm một đường dẫn String gọi là `__t` vào schema của bạn mà nó sử dụng để theo dõi discriminator này là một instance của document nào.
> Bạn cũng có thể sử dụng tùy chọn `discriminatorKey` để xác định đường dẫn cho phân biệt.

Các instance `SignedUpEvent` và `ClickedLinkEvent` sẽ được lưu trữ trong cùng một collection như các sự kiện chung.

Bây giờ, hãy định nghĩa lớp `ClickedLinkEvent` như sau:

```typescript
@@filename(click-link-event.schema)
@Schema()
export class ClickedLinkEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  url: string;
}

export const ClickedLinkEventSchema = SchemaFactory.createForClass(ClickedLinkEvent);
```

Và lớp `SignUpEvent`:

```typescript
@@filename(sign-up-event.schema)
@Schema()
export class SignUpEvent {
  kind: string;
  time: Date;

  @Prop({ type: String, required: true })
  user: string;
}

export const SignUpEventSchema = SchemaFactory.createForClass(SignUpEvent);
```

Với cài đặt này, sử dụng tùy chọn `discriminators` để đăng ký một discriminator cho một schema cụ thể. Nó hoạt động trên cả `MongooseModule.forFeature` và `MongooseModule.forFeatureAsync`:

```typescript
@@filename(event.module)
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        discriminators: [
          { name: ClickedLinkEvent.name, schema: ClickedLinkEventSchema },
          { name: SignUpEvent.name, schema: SignUpEventSchema },
        ],
      },
    ]),
  ]
})
export class EventsModule {}
```

#### Kiểm thử (Testing)

Khi thực hiện unit test cho một ứng dụng, chúng ta thường muốn tránh bất kỳ kết nối cơ sở dữ liệu nào, làm cho bộ test của chúng ta đơn giản hơn để thiết lập và nhanh hơn để thực thi. Nhưng các lớp của chúng ta có thể phụ thuộc vào các model được lấy từ instance kết nối. Làm thế nào để chúng ta giải quyết các lớp này? Giải pháp là tạo các model giả.

Để làm cho điều này dễ dàng hơn, gói `@nestjs/mongoose` cung cấp một hàm `getModelToken()` trả về một [injection token](https://docs.nestjs.com/fundamentals/custom-providers#di-fundamentals) đã được chuẩn bị dựa trên tên token. Sử dụng token này, bạn có thể dễ dàng cung cấp một triển khai giả bằng cách sử dụng bất kỳ kỹ thuật [custom provider](/fundamentals/custom-providers) tiêu chuẩn nào, bao gồm `useClass`, `useValue`, và `useFactory`. Ví dụ:

```typescript
@Module({
  providers: [
    CatsService,
    {
      provide: getModelToken(Cat.name),
      useValue: catModel,
    },
  ],
})
export class CatsModule {}
```

Trong ví dụ này, một `catModel` cứng (instance đối tượng) sẽ được cung cấp bất cứ khi nào bất kỳ consumer nào tiêm một `Model<Cat>` sử dụng decorator `@InjectModel()`.

<app-banner-courses></app-banner-courses>

#### Cấu hình bất đồng bộ (Async configuration)

Khi bạn cần truyền tùy chọn module một cách bất đồng bộ thay vì tĩnh, sử dụng phương thức `forRootAsync()`. Giống như hầu hết các module động, Nest cung cấp một số kỹ thuật để xử lý cấu hình bất đồng bộ.

Một kỹ thuật là sử dụng hàm factory:

```typescript
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: 'mongodb://localhost/nest',
  }),
});
```

Giống như các [factory providers](https://docs.nestjs.com/fundamentals/custom-providers#factory-providers-usefactory) khác, hàm factory của chúng ta có thể là `async` và có thể tiêm các dependencies thông qua `inject`.

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URI'),
  }),
  inject: [ConfigService],
});
```

Ngoài ra, bạn có thể cấu hình `MongooseModule` sử dụng một lớp thay vì một factory, như được hiển thị dưới đây:

```typescript
MongooseModule.forRootAsync({
  useClass: MongooseConfigService,
});
```

Cấu trúc trên khởi tạo `MongooseConfigService` bên trong `MongooseModule`, sử dụng nó để tạo đối tượng tùy chọn cần thiết. Lưu ý rằng trong ví dụ này, `MongooseConfigService` phải triển khai giao diện `MongooseOptionsFactory`, như được hiển thị dưới đây. `MongooseModule` sẽ gọi phương thức `createMongooseOptions()` trên đối tượng được khởi tạo của lớp được cung cấp.

```typescript
@Injectable()
export class MongooseConfigService implements MongooseOptionsFactory {
  createMongooseOptions(): MongooseModuleOptions {
    return {
      uri: 'mongodb://localhost/nest',
    };
  }
}
```

Nếu bạn muốn tái sử dụng một provider tùy chọn hiện có thay vì tạo một bản sao riêng bên trong `MongooseModule`, sử dụng cú pháp `useExisting`.

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

#### Ví dụ

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/06-mongoose).
