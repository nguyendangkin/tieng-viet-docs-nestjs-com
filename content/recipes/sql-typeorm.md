### SQL (TypeORM)

##### Chương này chỉ áp dụng cho TypeScript

> **Cảnh báo** Trong bài viết này, bạn sẽ học cách tạo một `DatabaseModule` dựa trên gói **TypeORM** từ đầu bằng cách sử dụng cơ chế nhà cung cấp tùy chỉnh. Do đó, giải pháp này chứa nhiều chi phí phụ mà bạn có thể bỏ qua bằng cách sử dụng gói `@nestjs/typeorm` chuyên dụng có sẵn. Để tìm hiểu thêm, xem [tại đây](/techniques/sql).

[TypeORM](https://github.com/typeorm/typeorm) chắc chắn là Object Relational Mapper (ORM) trưởng thành nhất có sẵn trong thế giới node.js. Vì nó được viết bằng TypeScript, nó hoạt động khá tốt với framework Nest.

#### Bắt đầu (Getting started)

Để bắt đầu cuộc phiêu lưu với thư viện này, chúng ta phải cài đặt tất cả các phụ thuộc cần thiết:

```bash
$ npm install --save typeorm mysql2
```

Bước đầu tiên chúng ta cần làm là thiết lập kết nối với cơ sở dữ liệu của chúng ta bằng cách sử dụng hàm `new DataSource().initialize()` được import từ gói `typeorm`. Hàm `initialize()` trả về một `Promise`, và do đó chúng ta phải tạo một [nhà cung cấp bất đồng bộ](/fundamentals/async-components).

```typescript
@@filename(database.providers)
import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'root',
        database: 'test',
        entities: [
            __dirname + '/../**/*.entity{.ts,.js}',
        ],
        synchronize: true,
      });

      return dataSource.initialize();
    },
  },
];
```

> cảnh báo **Cảnh báo** Đặt `synchronize: true` không nên được sử dụng trong sản xuất - nếu không bạn có thể mất dữ liệu sản xuất.

> thông tin **Gợi ý** Theo các thực hành tốt nhất, chúng ta đã khai báo nhà cung cấp tùy chỉnh trong file riêng biệt có hậu tố `*.providers.ts`.

Sau đó, chúng ta cần xuất các nhà cung cấp này để làm cho chúng **có thể truy cập** cho phần còn lại của ứng dụng.

```typescript
@@filename(database.module)
import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
```

Bây giờ chúng ta có thể tiêm đối tượng `DATA_SOURCE` bằng cách sử dụng decorator `@Inject()`. Mỗi lớp phụ thuộc vào nhà cung cấp bất đồng bộ `DATA_SOURCE` sẽ đợi cho đến khi `Promise` được giải quyết.

#### Mẫu kho lưu trữ (Repository pattern)

[TypeORM](https://github.com/typeorm/typeorm) hỗ trợ mẫu thiết kế kho lưu trữ, do đó mỗi thực thể có Kho lưu trữ riêng của nó. Các kho lưu trữ này có thể được lấy từ kết nối cơ sở dữ liệu.

Nhưng trước tiên, chúng ta cần ít nhất một thực thể. Chúng ta sẽ tái sử dụng thực thể `Photo` từ tài liệu chính thức.

```typescript
@@filename(photo.entity)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  name: string;

  @Column('text')
  description: string;

  @Column()
  filename: string;

  @Column('int')
  views: number;

  @Column()
  isPublished: boolean;
}
```

Thực thể `Photo` thuộc về thư mục `photo`. Thư mục này đại diện cho `PhotoModule`. Bây giờ, hãy tạo một nhà cung cấp **Repository**:

```typescript
@@filename(photo.providers)
import { DataSource } from 'typeorm';
import { Photo } from './photo.entity';

export const photoProviders = [
  {
    provide: 'PHOTO_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Photo),
    inject: ['DATA_SOURCE'],
  },
];
```

> cảnh báo **Cảnh báo** Trong các ứng dụng thực tế, bạn nên tránh **chuỗi ma thuật**. Cả `PHOTO_REPOSITORY` và `DATA_SOURCE` nên được giữ trong file `constants.ts` riêng biệt.

Bây giờ chúng ta có thể tiêm `Repository<Photo>` vào `PhotoService` bằng cách sử dụng decorator `@Inject()`:

```typescript
@@filename(photo.service)
import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Photo } from './photo.entity';

@Injectable()
export class PhotoService {
  constructor(
    @Inject('PHOTO_REPOSITORY')
    private photoRepository: Repository<Photo>,
  ) {}

  async findAll(): Promise<Photo[]> {
    return this.photoRepository.find();
  }
}
```

Kết nối cơ sở dữ liệu là **bất đồng bộ**, nhưng Nest làm cho quá trình này hoàn toàn vô hình đối với người dùng cuối. `PhotoRepository` đang đợi kết nối cơ sở dữ liệu, và `PhotoService` bị trì hoãn cho đến khi kho lưu trữ sẵn sàng để sử dụng. Toàn bộ ứng dụng có thể bắt đầu khi mỗi lớp được khởi tạo.

Đây là `PhotoModule` cuối cùng:

```typescript
@@filename(photo.module)
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { photoProviders } from './photo.providers';
import { PhotoService } from './photo.service';

@Module({
  imports: [DatabaseModule],
  providers: [
    ...photoProviders,
    PhotoService,
  ],
})
export class PhotoModule {}
```

> thông tin **Gợi ý** Đừng quên import `PhotoModule` vào `AppModule` gốc.
