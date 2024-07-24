### Cơ sở dữ liệu (Database)

Nest không phụ thuộc vào cơ sở dữ liệu cụ thể, cho phép bạn dễ dàng tích hợp với bất kỳ cơ sở dữ liệu SQL hoặc NoSQL nào. Bạn có một số lựa chọn tùy thuộc vào sở thích của mình. Ở mức tổng quát nhất, việc kết nối Nest với cơ sở dữ liệu đơn giản chỉ là tải driver Node.js phù hợp cho cơ sở dữ liệu đó, giống như bạn làm với [Express](https://expressjs.com/en/guide/database-integration.html) hoặc Fastify.

Bạn cũng có thể sử dụng trực tiếp bất kỳ thư viện hoặc ORM tích hợp cơ sở dữ liệu Node.js đa năng nào, như [MikroORM](https://mikro-orm.io/) (xem [MikroORM recipe](/recipes/mikroorm)), [Sequelize](https://sequelize.org/) (xem [Sequelize integration](/techniques/database#sequelize-integration)), [Knex.js](https://knexjs.org/) (xem [Knex.js tutorial](https://dev.to/nestjs/build-a-nestjs-module-for-knex-js-or-other-resource-based-libraries-in-5-minutes-12an)), [TypeORM](https://github.com/typeorm/typeorm), và [Prisma](https://www.github.com/prisma/prisma) (xem [Prisma recipe](/recipes/prisma)), để hoạt động ở mức trừu tượng cao hơn.

Để thuận tiện, Nest cung cấp tích hợp chặt chẽ với TypeORM và Sequelize ngay từ đầu thông qua các gói `@nestjs/typeorm` và `@nestjs/sequelize` tương ứng, mà chúng ta sẽ đề cập trong chương này, và Mongoose với `@nestjs/mongoose`, được đề cập trong [chương này](/techniques/mongodb). Những tích hợp này cung cấp thêm các tính năng đặc thù cho NestJS, như injection model/repository, khả năng kiểm thử, và cấu hình bất đồng bộ để làm cho việc truy cập cơ sở dữ liệu bạn chọn trở nên dễ dàng hơn.

### Tích hợp TypeORM (TypeORM Integration)

Để tích hợp với cơ sở dữ liệu SQL và NoSQL, Nest cung cấp gói `@nestjs/typeorm`. [TypeORM](https://github.com/typeorm/typeorm) là ORM (Object Relational Mapper) trưởng thành nhất có sẵn cho TypeScript. Vì nó được viết bằng TypeScript, nó tích hợp tốt với framework Nest.

Để bắt đầu sử dụng, trước tiên chúng ta cài đặt các dependencies cần thiết. Trong chương này, chúng ta sẽ minh họa bằng cách sử dụng [MySQL](https://www.mysql.com/) RDBMS phổ biến, nhưng TypeORM hỗ trợ nhiều cơ sở dữ liệu quan hệ, như PostgreSQL, Oracle, Microsoft SQL Server, SQLite, và thậm chí cả cơ sở dữ liệu NoSQL như MongoDB. Quy trình chúng ta sẽ thực hiện trong chương này sẽ giống nhau cho bất kỳ cơ sở dữ liệu nào được TypeORM hỗ trợ. Bạn chỉ cần cài đặt các thư viện API client liên quan cho cơ sở dữ liệu bạn chọn.

```bash
$ npm install --save @nestjs/typeorm typeorm mysql2
```

Khi quá trình cài đặt hoàn tất, chúng ta có thể import `TypeOrmModule` vào `AppModule` gốc.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

> warning **Cảnh báo** Không nên sử dụng `synchronize: true` trong môi trường production - nếu không bạn có thể mất dữ liệu production.

Phương thức `forRoot()` hỗ trợ tất cả các thuộc tính cấu hình được công khai bởi hàm tạo `DataSource` từ gói [TypeORM](https://typeorm.io/data-source-options#common-data-source-options). Ngoài ra, có một số thuộc tính cấu hình bổ sung được mô tả dưới đây.

<table>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Số lần thử kết nối với cơ sở dữ liệu (mặc định: <code>10</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Độ trễ giữa các lần thử kết nối (ms) (mặc định: <code>3000</code>)</td>
  </tr>
  <tr>
    <td><code>autoLoadEntities</code></td>
    <td>Nếu <code>true</code>, các entities sẽ được tự động tải (mặc định: <code>false</code>)</td>
  </tr>
</table>

> info **Gợi ý** Tìm hiểu thêm về các tùy chọn data source [tại đây](https://typeorm.io/data-source-options).

Khi hoàn thành, các đối tượng `DataSource` và `EntityManager` của TypeORM sẽ có sẵn để inject trong toàn bộ dự án (mà không cần import bất kỳ module nào), ví dụ:

```typescript
@@filename(app.module)
import { DataSource } from 'typeorm';

@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
@@switch
import { DataSource } from 'typeorm';

@Dependencies(DataSource)
@Module({
  imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }
}
```

#### Mẫu repository (Repository pattern)

[TypeORM](https://github.com/typeorm/typeorm) hỗ trợ **mẫu thiết kế repository**, vì vậy mỗi entity có repository riêng của nó. Các repository này có thể được lấy từ data source của cơ sở dữ liệu.

Để tiếp tục ví dụ, chúng ta cần ít nhất một entity. Hãy định nghĩa entity `User`.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;
}
```

> info **Gợi ý** Tìm hiểu thêm về entities trong [tài liệu TypeORM](https://typeorm.io/#/entities).

File entity `User` nằm trong thư mục `users`. Thư mục này chứa tất cả các file liên quan đến `UsersModule`. Bạn có thể quyết định nơi lưu trữ các file model của mình, tuy nhiên, chúng tôi khuyên bạn nên tạo chúng gần với **domain** tương ứng, trong thư mục module tương ứng.

Để bắt đầu sử dụng entity `User`, chúng ta cần cho TypeORM biết về nó bằng cách chèn nó vào mảng `entities` trong tùy chọn phương thức `forRoot()` của module (trừ khi bạn sử dụng đường dẫn glob tĩnh):

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [User],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

Tiếp theo, hãy xem xét `UsersModule`:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

Module này sử dụng phương thức `forFeature()` để xác định những repository nào được đăng ký trong phạm vi hiện tại. Với điều đó, chúng ta có thể inject `UsersRepository` vào `UsersService` bằng cách sử dụng decorator `@InjectRepository()`:

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
@Dependencies(getRepositoryToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id) {
    return this.usersRepository.findOneBy({ id });
  }

  async remove(id) {
    await this.usersRepository.delete(id);
  }
}
```

> warning **Lưu ý** Đừng quên import `UsersModule` vào `AppModule` gốc.

Nếu bạn muốn sử dụng repository bên ngoài module mà import `TypeOrmModule.forFeature`, bạn sẽ cần xuất lại các providers được tạo bởi nó.
Bạn có thể làm điều này bằng cách xuất toàn bộ module, như sau:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  exports: [TypeOrmModule]
})
export class UsersModule {}
```

Bây giờ nếu chúng ta import `UsersModule` trong `UserHttpModule`, chúng ta có thể sử dụng `@InjectRepository(User)` trong các providers của module sau.

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
```

#### Quan hệ (Relations)

Quan hệ là các mối liên kết được thiết lập giữa hai hoặc nhiều bảng. Quan hệ dựa trên các trường chung từ mỗi bảng, thường liên quan đến khóa chính và khóa ngoại.

Có ba loại quan hệ:

<table>
  <tr>
    <td><code>Một-một</code></td>
    <td>Mỗi hàng trong bảng chính có một và chỉ một hàng liên kết trong bảng ngoại. Sử dụng decorator <code>@OneToOne()</code> để định nghĩa loại quan hệ này.</td>
  </tr>
  <tr>
    <td><code>Một-nhiều / Nhiều-một</code></td>
    <td>Mỗi hàng trong bảng chính có một hoặc nhiều hàng liên quan trong bảng ngoại. Sử dụng các decorator <code>@OneToMany()</code> và <code>@ManyToOne()</code> để định nghĩa loại quan hệ này.</td>
  </tr>
  <tr>
    <td><code>Nhiều-nhiều</code></td>
    <td>Mỗi hàng trong bảng chính có nhiều hàng liên quan trong bảng ngoại, và mỗi bản ghi trong bảng ngoại có nhiều hàng liên quan trong bảng chính. Sử dụng decorator <code>@ManyToMany()</code> để định nghĩa loại quan hệ này.</td>
  </tr>
</table>

Để định nghĩa quan hệ trong các entities, sử dụng các **decorators** tương ứng. Ví dụ, để định nghĩa quan hệ trong các entities, sử dụng các **decorators** tương ứng. Ví dụ, để định nghĩa rằng mỗi `User` có thể có nhiều ảnh, sử dụng decorator `@OneToMany()`.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Photo } from '../photos/photo.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(type => Photo, photo => photo.user)
  photos: Photo[];
}
```

> info **Gợi ý** Để tìm hiểu thêm về quan hệ trong TypeORM, hãy truy cập [tài liệu TypeORM](https://typeorm.io/#/relations).

Dưới đây là bản dịch của phần còn lại, giữ nguyên markdown và kèm theo tiếng gốc trong ngoặc cho các đề mục:

#### Tự động tải entities (Auto-load entities)

Thêm thủ công các entities vào mảng `entities` của tùy chọn data source có thể tốn công. Ngoài ra, việc tham chiếu entities từ module gốc phá vỡ ranh giới domain ứng dụng và gây rò rỉ chi tiết triển khai đến các phần khác của ứng dụng. Để giải quyết vấn đề này, một giải pháp thay thế được cung cấp. Để tự động tải entities, đặt thuộc tính `autoLoadEntities` của đối tượng cấu hình (được truyền vào phương thức `forRoot()`) thành `true`, như được hiển thị bên dưới:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
```

Với tùy chọn đó được chỉ định, mọi entity được đăng ký thông qua phương thức `forFeature()` sẽ tự động được thêm vào mảng `entities` của đối tượng cấu hình.

> warning **Cảnh báo** Lưu ý rằng các entities không được đăng ký thông qua phương thức `forFeature()`, mà chỉ được tham chiếu từ entity (thông qua một mối quan hệ), sẽ không được bao gồm bằng cách sử dụng cài đặt `autoLoadEntities`.

#### Tách biệt định nghĩa entity (Separating entity definition)

Bạn có thể định nghĩa một entity và các cột của nó ngay trong model, sử dụng decorators. Nhưng một số người thích định nghĩa entities và các cột của chúng trong các file riêng biệt sử dụng ["entity schemas"](https://typeorm.io/#/separating-entity-definition).

```typescript
import { EntitySchema } from 'typeorm';
import { User } from './user.entity';

export const UserSchema = new EntitySchema<User>({
  name: 'User',
  target: User,
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  relations: {
    photos: {
      type: 'one-to-many',
      target: 'Photo', // tên của PhotoSchema
    },
  },
});
```

> warning error **Cảnh báo** Nếu bạn cung cấp tùy chọn `target`, giá trị của tùy chọn `name` phải giống với tên của lớp target.
> Nếu bạn không cung cấp `target`, bạn có thể sử dụng bất kỳ tên nào.

Nest cho phép bạn sử dụng một instance `EntitySchema` ở bất cứ đâu mà một `Entity` được mong đợi, ví dụ:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSchema])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

#### Giao dịch TypeORM (TypeORM Transactions)

Một giao dịch cơ sở dữ liệu tượng trưng cho một đơn vị công việc được thực hiện trong một hệ thống quản lý cơ sở dữ liệu đối với một cơ sở dữ liệu, và được xử lý một cách nhất quán và đáng tin cậy độc lập với các giao dịch khác. Một giao dịch thường đại diện cho bất kỳ thay đổi nào trong cơ sở dữ liệu ([tìm hiểu thêm](https://en.wikipedia.org/wiki/Database_transaction)).

Có nhiều chiến lược khác nhau để xử lý [giao dịch TypeORM](https://typeorm.io/#/transactions). Chúng tôi khuyên bạn nên sử dụng lớp `QueryRunner` vì nó cung cấp toàn quyền kiểm soát giao dịch.

Đầu tiên, chúng ta cần inject đối tượng `DataSource` vào một lớp theo cách thông thường:

```typescript
@Injectable()
export class UsersService {
  constructor(private dataSource: DataSource) {}
}
```

> info **Gợi ý** Lớp `DataSource` được import từ gói `typeorm`.

Bây giờ, chúng ta có thể sử dụng đối tượng này để tạo một giao dịch.

```typescript
async createMany(users: User[]) {
  const queryRunner = this.dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.manager.save(users[0]);
    await queryRunner.manager.save(users[1]);

    await queryRunner.commitTransaction();
  } catch (err) {
    // vì chúng ta có lỗi, hãy rollback các thay đổi đã thực hiện
    await queryRunner.rollbackTransaction();
  } finally {
    // bạn cần giải phóng queryRunner đã được khởi tạo thủ công
    await queryRunner.release();
  }
}
```

> info **Gợi ý** Lưu ý rằng `dataSource` chỉ được sử dụng để tạo `QueryRunner`. Tuy nhiên, để kiểm thử lớp này sẽ yêu cầu mocking toàn bộ đối tượng `DataSource` (hiển thị nhiều phương thức). Do đó, chúng tôi khuyên bạn nên sử dụng một lớp factory helper (ví dụ: `QueryRunnerFactory`) và định nghĩa một interface với một tập hợp giới hạn các phương thức cần thiết để duy trì giao dịch. Kỹ thuật này làm cho việc mocking các phương thức này khá đơn giản.

<app-banner-devtools></app-banner-devtools>

Ngoài ra, bạn có thể sử dụng phương pháp dựa trên callback với phương thức `transaction` của đối tượng `DataSource` ([đọc thêm](https://typeorm.io/#/transactions/creating-and-using-transactions)).

```typescript
async createMany(users: User[]) {
  await this.dataSource.transaction(async manager => {
    await manager.save(users[0]);
    await manager.save(users[1]);
  });
}
```

#### Subscribers

Với [subscribers](https://typeorm.io/#/listeners-and-subscribers/what-is-a-subscriber) của TypeORM, bạn có thể lắng nghe các sự kiện entity cụ thể.

```typescript
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';
import { User } from './user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log(`BEFORE USER INSERTED: `, event.entity);
  }
}
```

> error **Cảnh báo** Event subscribers không thể là [request-scoped](/fundamentals/injection-scopes).

Bây giờ, thêm lớp `UserSubscriber` vào mảng `providers`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserSubscriber } from './user.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, UserSubscriber],
  controllers: [UsersController],
})
export class UsersModule {}
```

> info **Gợi ý** Tìm hiểu thêm về entity subscribers [tại đây](https://typeorm.io/#/listeners-and-subscribers/what-is-a-subscriber).

#### Di trú (Migrations)

[Migrations](https://typeorm.io/#/migrations) cung cấp một cách để cập nhật lược đồ cơ sở dữ liệu một cách tăng dần để giữ cho nó đồng bộ với mô hình dữ liệu của ứng dụng trong khi vẫn bảo toàn dữ liệu hiện có trong cơ sở dữ liệu. Để tạo, chạy và hoàn tác các migration, TypeORM cung cấp một [CLI](https://typeorm.io/#/migrations/creating-a-new-migration) chuyên dụng.

Các lớp migration được tách biệt khỏi mã nguồn ứng dụng Nest. Vòng đời của chúng được duy trì bởi TypeORM CLI. Do đó, bạn không thể tận dụng dependency injection và các tính năng đặc thù khác của Nest với migrations. Để tìm hiểu thêm về migrations, hãy làm theo hướng dẫn trong [tài liệu TypeORM](https://typeorm.io/#/migrations/creating-a-new-migration).

#### Nhiều cơ sở dữ liệu (Multiple databases)

Một số dự án yêu cầu nhiều kết nối cơ sở dữ liệu. Điều này cũng có thể đạt được với module này. Để làm việc với nhiều kết nối, trước tiên hãy tạo các kết nối. Trong trường hợp này, việc đặt tên data source trở nên **bắt buộc**.

Giả sử bạn có một entity `Album` được lưu trữ trong cơ sở dữ liệu riêng của nó.

```typescript
const defaultOptions = {
  type: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      entities: [User],
    }),
    TypeOrmModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      entities: [Album],
    }),
  ],
})
export class AppModule {}
```

> warning **Lưu ý** Nếu bạn không đặt `name` cho một data source, tên của nó sẽ được đặt là `default`. Vui lòng lưu ý rằng bạn không nên có nhiều kết nối mà không có tên, hoặc có cùng tên, nếu không chúng sẽ bị ghi đè.

> warning **Lưu ý** Nếu bạn đang sử dụng `TypeOrmModule.forRootAsync`, bạn phải **cũng** đặt tên data source bên ngoài `useFactory`. Ví dụ:
>
> ```typescript
> TypeOrmModule.forRootAsync({
>   name: 'albumsConnection',
>   useFactory: ...,
>   inject: ...,
> }),
> ```
>
> Xem [issue này](https://github.com/nestjs/typeorm/issues/86) để biết thêm chi tiết.

Tại thời điểm này, bạn có các entity `User` và `Album` được đăng ký với data source riêng của chúng. Với cài đặt này, bạn phải cho phương thức `TypeOrmModule.forFeature()` và decorator `@InjectRepository()` biết nên sử dụng data source nào. Nếu bạn không truyền bất kỳ tên data source nào, data source `default` sẽ được sử dụng.

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([User]), TypeOrmModule.forFeature([Album], 'albumsConnection')],
})
export class AppModule {}
```

Bạn cũng có thể inject `DataSource` hoặc `EntityManager` cho một data source nhất định:

```typescript
@Injectable()
export class AlbumsService {
  constructor(
    @InjectDataSource('albumsConnection')
    private dataSource: DataSource,
    @InjectEntityManager('albumsConnection')
    private entityManager: EntityManager,
  ) {}
}
```

Cũng có thể inject bất kỳ `DataSource` nào vào các providers:

```typescript
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsConnection: DataSource) => {
        return new AlbumsService(albumsConnection);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
```

#### Kiểm thử (Testing)

Khi kiểm thử đơn vị một ứng dụng, chúng ta thường muốn tránh kết nối cơ sở dữ liệu, giữ cho bộ kiểm thử độc lập và quá trình thực thi nhanh nhất có thể. Nhưng các lớp của chúng ta có thể phụ thuộc vào các repository được lấy từ instance của nguồn dữ liệu (kết nối). Làm thế nào để xử lý điều đó? Giải pháp là tạo các mock repository. Để đạt được điều đó, chúng ta thiết lập [custom providers](/fundamentals/custom-providers). Mỗi repository đã đăng ký được tự động biểu diễn bởi một token `<EntityName>Repository`, trong đó `EntityName` là tên của lớp entity của bạn.

Gói `@nestjs/typeorm` cung cấp hàm `getRepositoryToken()` trả về một token đã được chuẩn bị dựa trên entity đã cho.

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: getRepositoryToken(User),
      useValue: mockRepository,
    },
  ],
})
export class UsersModule {}
```

Bây giờ một `mockRepository` thay thế sẽ được sử dụng làm `UsersRepository`. Bất cứ khi nào một lớp yêu cầu `UsersRepository` bằng cách sử dụng decorator `@InjectRepository()`, Nest sẽ sử dụng đối tượng `mockRepository` đã đăng ký.

#### Cấu hình bất đồng bộ (Async configuration)

Bạn có thể muốn truyền các tùy chọn module repository của mình một cách bất đồng bộ thay vì tĩnh. Trong trường hợp này, sử dụng phương thức `forRootAsync()`, cung cấp một số cách để xử lý cấu hình bất đồng bộ.

Một cách tiếp cận là sử dụng hàm factory:

```typescript
TypeOrmModule.forRootAsync({
  useFactory: () => ({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    entities: [],
    synchronize: true,
  }),
});
```

Factory của chúng ta hoạt động giống như bất kỳ [provider bất đồng bộ](https://docs.nestjs.com/fundamentals/async-providers) nào khác (ví dụ: nó có thể là `async` và nó có thể inject các dependencies thông qua `inject`).

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  inject: [ConfigService],
});
```

Thay vào đó, bạn có thể sử dụng cú pháp `useClass`:

```typescript
TypeOrmModule.forRootAsync({
  useClass: TypeOrmConfigService,
});
```

Cấu trúc trên sẽ khởi tạo `TypeOrmConfigService` bên trong `TypeOrmModule` và sử dụng nó để cung cấp một đối tượng tùy chọn bằng cách gọi `createTypeOrmOptions()`. Lưu ý rằng điều này có nghĩa là `TypeOrmConfigService` phải triển khai interface `TypeOrmOptionsFactory`, như được hiển thị dưới đây:

```typescript
@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      entities: [],
      synchronize: true,
    };
  }
}
```

Để ngăn việc tạo `TypeOrmConfigService` bên trong `TypeOrmModule` và sử dụng một provider được import từ một module khác, bạn có thể sử dụng cú pháp `useExisting`.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Cấu trúc này hoạt động giống như `useClass` với một điểm khác biệt quan trọng - `TypeOrmModule` sẽ tìm kiếm các module đã import để tái sử dụng một `ConfigService` hiện có thay vì khởi tạo một cái mới.

> info **Gợi ý** Đảm bảo rằng thuộc tính `name` được định nghĩa ở cùng cấp với thuộc tính `useFactory`, `useClass`, hoặc `useValue`. Điều này sẽ cho phép Nest đăng ký nguồn dữ liệu đúng cách dưới token injection thích hợp.

#### Custom DataSource Factory

Kết hợp với cấu hình bất đồng bộ sử dụng `useFactory`, `useClass`, hoặc `useExisting`, bạn có thể tùy chọn chỉ định một hàm `dataSourceFactory` cho phép bạn cung cấp nguồn dữ liệu TypeORM của riêng bạn thay vì để `TypeOrmModule` tạo nguồn dữ liệu.

`dataSourceFactory` nhận `DataSourceOptions` của TypeORM được cấu hình trong quá trình cấu hình bất đồng bộ sử dụng `useFactory`, `useClass`, hoặc `useExisting` và trả về một `Promise` giải quyết một `DataSource` của TypeORM.

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  // Sử dụng useFactory, useClass, hoặc useExisting
  // để cấu hình DataSourceOptions.
  useFactory: (configService: ConfigService) => ({
    type: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    entities: [],
    synchronize: true,
  }),
  // dataSource nhận DataSourceOptions đã được cấu hình
  // và trả về một Promise<DataSource>.
  dataSourceFactory: async (options) => {
    const dataSource = await new DataSource(options).initialize();
    return dataSource;
  },
});
```

> info **Gợi ý** Lớp `DataSource` được import từ gói `typeorm`.

#### Ví dụ (Example)

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/05-sql-typeorm).

<app-banner-enterprise></app-banner-enterprise>

### Tích hợp Sequelize (Sequelize Integration)

Một lựa chọn thay thế cho việc sử dụng TypeORM là sử dụng ORM [Sequelize](https://sequelize.org/) với gói `@nestjs/sequelize`. Ngoài ra, chúng ta tận dụng gói [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) cung cấp một tập hợp các decorator bổ sung để định nghĩa các entity một cách khai báo.

Để bắt đầu sử dụng nó, trước tiên chúng ta cài đặt các dependencies cần thiết. Trong chương này, chúng ta sẽ minh họa bằng cách sử dụng [MySQL](https://www.mysql.com/) DBMS phổ biến, nhưng Sequelize cung cấp hỗ trợ cho nhiều cơ sở dữ liệu quan hệ, như PostgreSQL, MySQL, Microsoft SQL Server, SQLite, và MariaDB. Quy trình chúng ta trình bày trong chương này sẽ giống nhau cho bất kỳ cơ sở dữ liệu nào được Sequelize hỗ trợ. Bạn chỉ cần cài đặt các thư viện API client liên quan cho cơ sở dữ liệu bạn đã chọn.

```bash
$ npm install --save @nestjs/sequelize sequelize sequelize-typescript mysql2
$ npm install --save-dev @types/sequelize
```

Sau khi quá trình cài đặt hoàn tất, chúng ta có thể import `SequelizeModule` vào `AppModule` gốc.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    }),
  ],
})
export class AppModule {}
```

Phương thức `forRoot()` hỗ trợ tất cả các thuộc tính cấu hình được hiển thị bởi constructor của Sequelize ([đọc thêm](https://sequelize.org/v5/manual/getting-started.html#setting-up-a-connection)). Ngoài ra, có một số thuộc tính cấu hình bổ sung được mô tả dưới đây.

<table>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Số lần thử kết nối đến cơ sở dữ liệu (mặc định: <code>10</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Độ trễ giữa các lần thử kết nối (ms) (mặc định: <code>3000</code>)</td>
  </tr>
  <tr>
    <td><code>autoLoadModels</code></td>
    <td>Nếu <code>true</code>, các model sẽ được tự động tải (mặc định: <code>false</code>)</td>
  </tr>
  <tr>
    <td><code>keepConnectionAlive</code></td>
    <td>Nếu <code>true</code>, kết nối sẽ không bị đóng khi ứng dụng tắt (mặc định: <code>false</code>)</td>
  </tr>
  <tr>
    <td><code>synchronize</code></td>
    <td>Nếu <code>true</code>, các model được tải tự động sẽ được đồng bộ hóa (mặc định: <code>true</code>)</td>
  </tr>
</table>

Sau khi hoàn tất, đối tượng `Sequelize` sẽ có sẵn để inject trong toàn bộ dự án (mà không cần phải import bất kỳ module nào), ví dụ:

```typescript
@@filename(app.service)
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AppService {
  constructor(private sequelize: Sequelize) {}
}
@@switch
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Dependencies(Sequelize)
@Injectable()
export class AppService {
  constructor(sequelize) {
    this.sequelize = sequelize;
  }
}
```

#### Các Model (Models)

Sequelize triển khai mẫu Active Record. Với mẫu này, bạn sử dụng các lớp model trực tiếp để tương tác với cơ sở dữ liệu. Để tiếp tục ví dụ, chúng ta cần ít nhất một model. Hãy định nghĩa model `User`.

```typescript
@@filename(user.model)
import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;
}
```

> info **Gợi ý** Tìm hiểu thêm về các decorator có sẵn [tại đây](https://github.com/RobinBuschmann/sequelize-typescript#column).

File model `User` nằm trong thư mục `users`. Thư mục này chứa tất cả các file liên quan đến `UsersModule`. Bạn có thể quyết định nơi lưu trữ các file model của mình, tuy nhiên, chúng tôi khuyên bạn nên tạo chúng gần với **domain** của chúng, trong thư mục module tương ứng.

Để bắt đầu sử dụng model `User`, chúng ta cần cho Sequelize biết về nó bằng cách chèn nó vào mảng `models` trong các tùy chọn phương thức `forRoot()` của module:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './users/user.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [User],
    }),
  ],
})
export class AppModule {}
```

Tiếp theo, hãy xem xét `UsersModule`:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

Module này sử dụng phương thức `forFeature()` để xác định những model nào được đăng ký trong phạm vi hiện tại. Với cấu hình đó, chúng ta có thể inject `UserModel` vào `UsersService` bằng cách sử dụng decorator `@InjectModel()`:

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  findOne(id: string): Promise<User> {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
@Dependencies(getModelToken(User))
export class UsersService {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }

  async findAll() {
    return this.userModel.findAll();
  }

  findOne(id) {
    return this.userModel.findOne({
      where: {
        id,
      },
    });
  }

  async remove(id) {
    const user = await this.findOne(id);
    await user.destroy();
  }
}
```

> warning **Lưu ý** Đừng quên import `UsersModule` vào `AppModule` gốc.

Nếu bạn muốn sử dụng repository bên ngoài module mà import `SequelizeModule.forFeature`, bạn sẽ cần phải re-export các provider được tạo ra bởi nó.
Bạn có thể làm điều này bằng cách export toàn bộ module, như sau:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.entity';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  exports: [SequelizeModule]
})
export class UsersModule {}
```

Bây giờ nếu chúng ta import `UsersModule` trong `UserHttpModule`, chúng ta có thể sử dụng `@InjectModel(User)` trong các provider của module sau.

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [UsersModule],
  providers: [UsersService],
  controllers: [UsersController]
})
export class UserHttpModule {}
```

#### Quan hệ (Relations)

Quan hệ là các mối liên kết được thiết lập giữa hai hoặc nhiều bảng. Quan hệ dựa trên các trường chung từ mỗi bảng, thường liên quan đến khóa chính và khóa ngoại.

Có ba loại quan hệ:

<table>
  <tr>
    <td><code>Một-đối-một</code></td>
    <td>Mỗi hàng trong bảng chính có một và chỉ một hàng liên kết trong bảng ngoại</td>
  </tr>
  <tr>
    <td><code>Một-đối-nhiều / Nhiều-đối-một</code></td>
    <td>Mỗi hàng trong bảng chính có một hoặc nhiều hàng liên quan trong bảng ngoại</td>
  </tr>
  <tr>
    <td><code>Nhiều-đối-nhiều</code></td>
    <td>Mỗi hàng trong bảng chính có nhiều hàng liên quan trong bảng ngoại, và mỗi bản ghi trong bảng ngoại có nhiều hàng liên quan trong bảng chính</td>
  </tr>
</table>

Để định nghĩa quan hệ trong các model, sử dụng các **decorator** tương ứng. Ví dụ, để định nghĩa rằng mỗi `User` có thể có nhiều ảnh, sử dụng decorator `@HasMany()`.

```typescript
@@filename(user.model)
import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Photo } from '../photos/photo.model';

@Table
export class User extends Model {
  @Column
  firstName: string;

  @Column
  lastName: string;

  @Column({ defaultValue: true })
  isActive: boolean;

  @HasMany(() => Photo)
  photos: Photo[];
}
```

> info **Gợi ý** Để tìm hiểu thêm về các mối quan hệ trong Sequelize, hãy đọc [chương này](https://github.com/RobinBuschmann/sequelize-typescript#model-association).

#### Tự động tải model (Auto-load models)

Việc thêm model một cách thủ công vào mảng `models` của các tùy chọn kết nối có thể rất tẻ nhạt. Ngoài ra, việc tham chiếu model từ module gốc phá vỡ ranh giới domain của ứng dụng và gây ra việc rò rỉ chi tiết triển khai đến các phần khác của ứng dụng. Để giải quyết vấn đề này, tự động tải model bằng cách đặt cả hai thuộc tính `autoLoadModels` và `synchronize` của đối tượng cấu hình (được truyền vào phương thức `forRoot()`) thành `true`, như được hiển thị dưới đây:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...
      autoLoadModels: true,
      synchronize: true,
    }),
  ],
})
export class AppModule {}
```

Với tùy chọn đó được chỉ định, mọi model được đăng ký thông qua phương thức `forFeature()` sẽ được tự động thêm vào mảng `models` của đối tượng cấu hình.

> warning **Cảnh báo** Lưu ý rằng các model không được đăng ký thông qua phương thức `forFeature()`, mà chỉ được tham chiếu từ model (thông qua một mối quan hệ), sẽ không được bao gồm.

#### Giao dịch Sequelize (Sequelize Transactions)

Một giao dịch cơ sở dữ liệu tượng trưng cho một đơn vị công việc được thực hiện trong hệ thống quản lý cơ sở dữ liệu đối với một cơ sở dữ liệu, và được xử lý một cách nhất quán và đáng tin cậy độc lập với các giao dịch khác. Một giao dịch thường đại diện cho bất kỳ thay đổi nào trong cơ sở dữ liệu ([tìm hiểu thêm](https://en.wikipedia.org/wiki/Database_transaction)).

Có nhiều chiến lược khác nhau để xử lý [giao dịch Sequelize](https://sequelize.org/v5/manual/transactions.html). Dưới đây là một ví dụ triển khai của giao dịch được quản lý (auto-callback).

Đầu tiên, chúng ta cần inject đối tượng `Sequelize` vào một lớp theo cách thông thường:

```typescript
@Injectable()
export class UsersService {
  constructor(private sequelize: Sequelize) {}
}
```

> info **Gợi ý** Lớp `Sequelize` được import từ gói `sequelize-typescript`.

Bây giờ, chúng ta có thể sử dụng đối tượng này để tạo một giao dịch.

```typescript
async createMany() {
  try {
    await this.sequelize.transaction(async t => {
      const transactionHost = { transaction: t };

      await this.userModel.create(
          { firstName: 'Abraham', lastName: 'Lincoln' },
          transactionHost,
      );
      await this.userModel.create(
          { firstName: 'John', lastName: 'Boothe' },
          transactionHost,
      );
    });
  } catch (err) {
    // Giao dịch đã bị rollback
    // err là bất cứ điều gì đã từ chối chuỗi promise được trả về cho callback giao dịch
  }
}
```

> info **Gợi ý** Lưu ý rằng instance `Sequelize` chỉ được sử dụng để bắt đầu giao dịch. Tuy nhiên, để kiểm tra lớp này sẽ yêu cầu mock toàn bộ đối tượng `Sequelize` (mà nó hiển thị một số phương thức). Do đó, chúng tôi khuyến nghị sử dụng một lớp factory helper (ví dụ: `TransactionRunner`) và định nghĩa một interface với một tập hợp giới hạn các phương thức cần thiết để duy trì giao dịch. Kỹ thuật này làm cho việc mock các phương thức này trở nên khá đơn giản.

#### Di chuyển (Migrations)

[Di chuyển](https://sequelize.org/v5/manual/migrations.html) cung cấp một cách để cập nhật lũy tiến schema cơ sở dữ liệu để giữ cho nó đồng bộ với mô hình dữ liệu của ứng dụng trong khi vẫn bảo toàn dữ liệu hiện có trong cơ sở dữ liệu. Để tạo, chạy và hoàn tác các di chuyển, Sequelize cung cấp một [CLI](https://sequelize.org/v5/manual/migrations.html#the-cli) chuyên dụng.

Các lớp di chuyển tách biệt với mã nguồn ứng dụng Nest. Vòng đời của chúng được duy trì bởi Sequelize CLI. Do đó, bạn không thể tận dụng dependency injection và các tính năng đặc biệt khác của Nest với các di chuyển. Để tìm hiểu thêm về di chuyển, hãy theo hướng dẫn trong [tài liệu Sequelize](https://sequelize.org/v5/manual/migrations.html#the-cli).

<app-banner-courses></app-banner-courses>

#### Nhiều cơ sở dữ liệu (Multiple databases)

Một số dự án yêu cầu nhiều kết nối cơ sở dữ liệu. Điều này cũng có thể đạt được với module này. Để làm việc với nhiều kết nối, trước tiên hãy tạo các kết nối. Trong trường hợp này, đặt tên kết nối trở thành **bắt buộc**.

Giả sử bạn có một entity `Album` được lưu trữ trong cơ sở dữ liệu riêng của nó.

```typescript
const defaultOptions = {
  dialect: 'postgres',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'db',
  synchronize: true,
};

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...defaultOptions,
      host: 'user_db_host',
      models: [User],
    }),
    SequelizeModule.forRoot({
      ...defaultOptions,
      name: 'albumsConnection',
      host: 'album_db_host',
      models: [Album],
    }),
  ],
})
export class AppModule {}
```

> warning **Lưu ý** Nếu bạn không đặt `name` cho một kết nối, tên của nó được đặt là `default`. Xin lưu ý rằng bạn không nên có nhiều kết nối mà không có tên, hoặc với cùng một tên, nếu không chúng sẽ bị ghi đè.

Tại thời điểm này, bạn có các model `User` và `Album` được đăng ký với kết nối riêng của chúng. Với cấu hình này, bạn phải nói cho phương thức `SequelizeModule.forFeature()` và decorator `@InjectModel()` biết kết nối nào nên được sử dụng. Nếu bạn không truyền bất kỳ tên kết nối nào, kết nối `default` sẽ được sử dụng.

```typescript
@Module({
  imports: [SequelizeModule.forFeature([User]), SequelizeModule.forFeature([Album], 'albumsConnection')],
})
export class AppModule {}
```

Bạn cũng có thể inject instance `Sequelize` cho một kết nối cụ thể:

```typescript
@Injectable()
export class AlbumsService {
  constructor(
    @InjectConnection('albumsConnection')
    private sequelize: Sequelize,
  ) {}
}
```

Cũng có thể inject bất kỳ instance `Sequelize` nào vào các provider:

```typescript
@Module({
  providers: [
    {
      provide: AlbumsService,
      useFactory: (albumsSequelize: Sequelize) => {
        return new AlbumsService(albumsSequelize);
      },
      inject: [getDataSourceToken('albumsConnection')],
    },
  ],
})
export class AlbumsModule {}
```

#### Kiểm thử (Testing)

Khi nói đến việc kiểm thử đơn vị một ứng dụng, chúng ta thường muốn tránh việc tạo kết nối cơ sở dữ liệu, giữ cho bộ kiểm thử của chúng ta độc lập và quá trình thực thi của chúng càng nhanh càng tốt. Nhưng các lớp của chúng ta có thể phụ thuộc vào các model được lấy từ instance kết nối. Làm thế nào để chúng ta xử lý điều đó? Giải pháp là tạo các model giả. Để đạt được điều đó, chúng ta thiết lập [custom providers](/fundamentals/custom-providers). Mỗi model đã đăng ký được tự động biểu diễn bởi một token `<ModelName>Model`, trong đó `ModelName` là tên của lớp model của bạn.

Gói `@nestjs/sequelize` cung cấp hàm `getModelToken()` trả về một token đã được chuẩn bị dựa trên một model đã cho.

```typescript
@Module({
  providers: [
    UsersService,
    {
      provide: getModelToken(User),
      useValue: mockModel,
    },
  ],
})
export class UsersModule {}
```

Bây giờ một `mockModel` thay thế sẽ được sử dụng làm `UserModel`. Bất cứ khi nào bất kỳ lớp nào yêu cầu `UserModel` sử dụng decorator `@InjectModel()`, Nest sẽ sử dụng đối tượng `mockModel` đã đăng ký.

#### Cấu hình bất đồng bộ (Async configuration)

Bạn có thể muốn truyền các tùy chọn `SequelizeModule` của mình một cách bất đồng bộ thay vì tĩnh. Trong trường hợp này, sử dụng phương thức `forRootAsync()`, cung cấp một số cách để xử lý cấu hình bất đồng bộ.

Một cách tiếp cận là sử dụng hàm factory:

```typescript
SequelizeModule.forRootAsync({
  useFactory: () => ({
    dialect: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'test',
    models: [],
  }),
});
```

Factory của chúng ta hoạt động giống như bất kỳ [provider bất đồng bộ](https://docs.nestjs.com/fundamentals/async-providers) nào khác (ví dụ: nó có thể là `async` và nó có thể inject các dependencies thông qua `inject`).

```typescript
SequelizeModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    dialect: 'mysql',
    host: configService.get('HOST'),
    port: +configService.get('PORT'),
    username: configService.get('USERNAME'),
    password: configService.get('PASSWORD'),
    database: configService.get('DATABASE'),
    models: [],
  }),
  inject: [ConfigService],
});
```

Thay vào đó, bạn có thể sử dụng cú pháp `useClass`:

```typescript
SequelizeModule.forRootAsync({
  useClass: SequelizeConfigService,
});
```

Cấu trúc trên sẽ khởi tạo `SequelizeConfigService` bên trong `SequelizeModule` và sử dụng nó để cung cấp một đối tượng tùy chọn bằng cách gọi `createSequelizeOptions()`. Lưu ý rằng điều này có nghĩa là `SequelizeConfigService` phải triển khai interface `SequelizeOptionsFactory`, như được hiển thị dưới đây:

```typescript
@Injectable()
class SequelizeConfigService implements SequelizeOptionsFactory {
  createSequelizeOptions(): SequelizeModuleOptions {
    return {
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'test',
      models: [],
    };
  }
}
```

Để ngăn việc tạo `SequelizeConfigService` bên trong `SequelizeModule` và sử dụng một provider được import từ một module khác, bạn có thể sử dụng cú pháp `useExisting`.

```typescript
SequelizeModule.forRootAsync({
  imports: [ConfigModule],
  useExisting: ConfigService,
});
```

Cấu trúc này hoạt động giống như `useClass` với một điểm khác biệt quan trọng - `SequelizeModule` sẽ tìm kiếm các module đã import để tái sử dụng một `ConfigService` hiện có thay vì khởi tạo một cái mới.

#### Ví dụ (Example)

Một ví dụ hoạt động có sẵn [tại đây](https://github.com/nestjs/nest/tree/master/sample/07-sequelize).
