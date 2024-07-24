### Mã hóa và Băm (Encryption and Hashing)

**Mã hóa** (Encryption) là quá trình mã hóa thông tin. Quá trình này chuyển đổi biểu diễn ban đầu của thông tin, được gọi là văn bản thuần túy, thành một hình thức thay thế được gọi là văn bản mã hóa. Lý tưởng nhất, chỉ các bên được ủy quyền mới có thể giải mã văn bản mã hóa trở lại thành văn bản thuần túy và truy cập thông tin gốc. Mã hóa không tự nó ngăn chặn can thiệp nhưng từ chối nội dung có thể hiểu được đối với một kẻ đánh chặn tiềm năng. Mã hóa là một hàm hai chiều; những gì được mã hóa có thể được giải mã với khóa thích hợp.

**Băm** (Hashing) là quá trình chuyển đổi một khóa đã cho thành một giá trị khác. Một hàm băm được sử dụng để tạo ra giá trị mới theo một thuật toán toán học. Một khi việc băm đã được thực hiện, nó phải không thể đi từ đầu ra đến đầu vào.

#### Mã hóa (Encryption)

Node.js cung cấp một [mô-đun crypto](https://nodejs.org/api/crypto.html) tích hợp mà bạn có thể sử dụng để mã hóa và giải mã chuỗi, số, buffer, luồng, và nhiều hơn nữa. Bản thân Nest không cung cấp bất kỳ gói bổ sung nào trên mô-đun này để tránh đưa ra các trừu tượng không cần thiết.

Ví dụ, hãy sử dụng thuật toán AES (Advanced Encryption System) `'aes-256-ctr'` với chế độ mã hóa CTR.

```typescript
import { createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const iv = randomBytes(16);
const password = 'Password used to generate key';

// Độ dài khóa phụ thuộc vào thuật toán.
// Trong trường hợp này cho aes256, nó là 32 byte.
const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;
const cipher = createCipheriv('aes-256-ctr', key, iv);

const textToEncrypt = 'Nest';
const encryptedText = Buffer.concat([cipher.update(textToEncrypt), cipher.final()]);
```

Bây giờ để giải mã giá trị `encryptedText`:

```typescript
import { createDecipheriv } from 'crypto';

const decipher = createDecipheriv('aes-256-ctr', key, iv);
const decryptedText = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
```

#### Băm (Hashing)

Đối với việc băm, chúng tôi khuyên bạn nên sử dụng gói [bcrypt](https://www.npmjs.com/package/bcrypt) hoặc [argon2](https://www.npmjs.com/package/argon2). Bản thân Nest không cung cấp bất kỳ wrapper bổ sung nào trên các mô-đun này để tránh đưa ra các trừu tượng không cần thiết (làm cho đường cong học tập ngắn).

Ví dụ, hãy sử dụng `bcrypt` để băm một mật khẩu ngẫu nhiên.

Đầu tiên cài đặt các gói cần thiết:

```shell
$ npm i bcrypt
$ npm i -D @types/bcrypt
```

Sau khi hoàn tất cài đặt, bạn có thể sử dụng hàm `hash` như sau:

```typescript
import * as bcrypt from 'bcrypt';

const saltOrRounds = 10;
const password = 'random_password';
const hash = await bcrypt.hash(password, saltOrRounds);
```

Để tạo một salt, sử dụng hàm `genSalt`:

```typescript
const salt = await bcrypt.genSalt();
```

Để so sánh/kiểm tra một mật khẩu, sử dụng hàm `compare`:

```typescript
const isMatch = await bcrypt.compare(password, hash);
```

Bạn có thể đọc thêm về các hàm có sẵn [tại đây](https://www.npmjs.com/package/bcrypt).
