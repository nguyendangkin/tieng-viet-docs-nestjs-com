### Giới thiệu (Introduction)

Nest (NestJS) là một framework để xây dựng các ứng dụng server-side [Node.js](https://nodejs.org/) hiệu quả và có khả năng mở rộng. Nó sử dụng JavaScript tiến bộ, được xây dựng với và hỗ trợ đầy đủ [TypeScript](http://www.typescriptlang.org/) (tuy nhiên vẫn cho phép các nhà phát triển lập trình bằng JavaScript thuần túy) và kết hợp các yếu tố của OOP (Lập trình hướng đối tượng), FP (Lập trình hàm) và FRP (Lập trình phản ứng hàm).

Bên dưới, Nest sử dụng các framework HTTP Server mạnh mẽ như [Express](https://expressjs.com/) (mặc định) và tùy chọn có thể được cấu hình để sử dụng [Fastify](https://github.com/fastify/fastify)!

Nest cung cấp một mức trừu tượng trên các framework Node.js phổ biến này (Express/Fastify), nhưng cũng đồng thời cho phép các nhà phát triển truy cập trực tiếp vào API của chúng. Điều này cho phép các nhà phát triển tự do sử dụng vô số module của bên thứ ba có sẵn cho nền tảng cơ bản.

#### Triết lý (Philosophy)

Trong những năm gần đây, nhờ Node.js, JavaScript đã trở thành "ngôn ngữ chung" của web cho cả ứng dụng front-end và back-end. Điều này đã tạo ra những dự án tuyệt vời như [Angular](https://angular.dev/), [React](https://github.com/facebook/react) và [Vue](https://github.com/vuejs/vue), giúp tăng năng suất cho nhà phát triển và cho phép tạo ra các ứng dụng front-end nhanh, dễ kiểm thử và có khả năng mở rộng. Tuy nhiên, trong khi có rất nhiều thư viện, công cụ hỗ trợ và công cụ tuyệt vời tồn tại cho Node (và JavaScript phía server), không có cái nào giải quyết hiệu quả vấn đề chính - **Kiến trúc**.

Nest cung cấp một kiến trúc ứng dụng sẵn có cho phép các nhà phát triển và nhóm tạo ra các ứng dụng có khả năng kiểm thử cao, mở rộng, kết nối lỏng lẻo và dễ bảo trì. Kiến trúc này được lấy cảm hứng mạnh mẽ từ Angular.

#### Cài đặt (Installation)

Để bắt đầu, bạn có thể tạo khung dự án với [Nest CLI](/cli/overview), hoặc clone một dự án khởi đầu (cả hai sẽ tạo ra kết quả giống nhau).

Để tạo khung dự án với Nest CLI, chạy các lệnh sau. Điều này sẽ tạo một thư mục dự án mới và điền vào thư mục với các tệp Nest cốt lõi ban đầu và các module hỗ trợ, tạo ra một cấu trúc cơ bản thông thường cho dự án của bạn. Tạo một dự án mới với **Nest CLI** được khuyến nghị cho người dùng lần đầu. Chúng ta sẽ tiếp tục với cách tiếp cận này trong [Những bước đầu tiên](first-steps).

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

> info **Gợi ý** Để tạo một dự án TypeScript mới với bộ tính năng nghiêm ngặt hơn, hãy truyền cờ `--strict` vào lệnh `nest new`.

#### Các lựa chọn thay thế (Alternatives)

Ngoài ra, để cài đặt dự án khởi đầu TypeScript bằng **Git**:

```bash
$ git clone https://github.com/nestjs/typescript-starter.git project
$ cd project
$ npm install
$ npm run start
```

> info **Gợi ý** Nếu bạn muốn clone repository mà không có lịch sử git, bạn có thể sử dụng [degit](https://github.com/Rich-Harris/degit).

Mở trình duyệt của bạn và điều hướng đến [`http://localhost:3000/`](http://localhost:3000/).

Để cài đặt phiên bản JavaScript của dự án khởi đầu, sử dụng `javascript-starter.git` trong chuỗi lệnh trên.

Bạn cũng có thể tự tạo một dự án mới từ đầu bằng cách cài đặt các tệp cốt lõi và hỗ trợ với **npm** (hoặc **yarn**). Trong trường hợp này, tất nhiên, bạn sẽ phải tự tạo các tệp boilerplate cho dự án.

```bash
$ npm i --save @nestjs/core @nestjs/common rxjs reflect-metadata
```
