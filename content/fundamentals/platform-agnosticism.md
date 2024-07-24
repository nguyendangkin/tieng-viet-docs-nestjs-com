### Tính không phụ thuộc nền tảng (Platform agnosticism)

Nest là một framework không phụ thuộc nền tảng. Điều này có nghĩa là bạn có thể phát triển **các phần logic có thể tái sử dụng** mà có thể được sử dụng trong các loại ứng dụng khác nhau. Ví dụ, hầu hết các thành phần có thể được tái sử dụng mà không cần thay đổi trên các framework máy chủ HTTP khác nhau (ví dụ: Express và Fastify), và thậm chí trên các _loại_ ứng dụng khác nhau (ví dụ: các framework máy chủ HTTP, Microservices với các lớp truyền tải khác nhau, và Web Sockets).

#### Xây dựng một lần, sử dụng mọi nơi (Build once, use everywhere)

Phần **Tổng quan** của tài liệu chủ yếu trình bày các kỹ thuật lập trình sử dụng các framework máy chủ HTTP (ví dụ: các ứng dụng cung cấp API REST hoặc cung cấp ứng dụng được render phía máy chủ theo kiểu MVC). Tuy nhiên, tất cả các khối xây dựng đó có thể được sử dụng trên các lớp truyền tải khác nhau ([microservices](/microservices/basics) hoặc [websockets](/websockets/gateways)).

Hơn nữa, Nest đi kèm với một module [GraphQL](/graphql/quick-start) chuyên dụng. Bạn có thể sử dụng GraphQL như lớp API của mình thay thế lẫn nhau với việc cung cấp API REST.

Ngoài ra, tính năng [ngữ cảnh ứng dụng](/application-context) giúp tạo ra bất kỳ loại ứng dụng Node.js nào - bao gồm cả những thứ như công việc CRON và ứng dụng CLI - trên nền tảng Nest.

Nest hướng tới việc trở thành một nền tảng đầy đủ cho các ứng dụng Node.js, mang lại mức độ module hóa và khả năng tái sử dụng cao hơn cho các ứng dụng của bạn. Xây dựng một lần, sử dụng mọi nơi!
