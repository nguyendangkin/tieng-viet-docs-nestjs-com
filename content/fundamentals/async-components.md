### Nhà cung cấp bất đồng bộ (Asynchronous providers)

Đôi khi, việc khởi động ứng dụng nên được trì hoãn cho đến khi một hoặc nhiều **tác vụ bất đồng bộ** hoàn thành. Ví dụ, bạn có thể không muốn bắt đầu chấp nhận yêu cầu cho đến khi kết nối với cơ sở dữ liệu đã được thiết lập. Bạn có thể đạt được điều này bằng cách sử dụng các nhà cung cấp bất đồng bộ.

Cú pháp cho việc này là sử dụng `async/await` với cú pháp `useFactory`. Factory trả về một `Promise`, và hàm factory có thể `await` các tác vụ bất đồng bộ. Nest sẽ đợi giải quyết promise trước khi khởi tạo bất kỳ lớp nào phụ thuộc vào (tiêm) nhà cung cấp như vậy.

```typescript
{
  provide: 'ASYNC_CONNECTION',
  useFactory: async () => {
    const connection = await createConnection(options);
    return connection;
  },
}
```

> info **Gợi ý** Tìm hiểu thêm về cú pháp nhà cung cấp tùy chỉnh [tại đây](/fundamentals/custom-providers).

#### Tiêm (Injection)

Các nhà cung cấp bất đồng bộ được tiêm vào các thành phần khác bằng token của chúng, giống như bất kỳ nhà cung cấp nào khác. Trong ví dụ trên, bạn sẽ sử dụng cấu trúc `@Inject('ASYNC_CONNECTION')`.

#### Ví dụ (Example)

[Công thức TypeORM](/recipes/sql-typeorm) có một ví dụ đầy đủ hơn về nhà cung cấp bất đồng bộ.
