# Thiệp cưới Duy Trường & Diễm Quỳnh

Next.js App Router, mobile-first, đỏ rượu vang / trắng ngà, hoa hồng. Thiết kế theo workflow `ui-ux-pro-max`: nội dung Quicksand mềm nhẹ, tiêu đề Cormorant Garamond, tên Great Vibes viết tay nét thanh; chữ số lining/tabular đồng đều, chuyển động nhẹ, tương tác cảm ứng và lazy loading.

## Chạy dự án

```bash
npm install
npm run dev
```

- `/`: màn mở đầu hiển thị tên và hai lựa chọn nhà trai / nhà gái ngay trên cùng màn hình. Không dùng một ngày chung cho hai gia đình, không hiển thị thiệp chính trước khi chọn.
- `/nha-trai`: lời mời nhà trai, giới thiệu cô dâu Diễm Quỳnh.
- `/nha-gai`: lời mời nhà gái, giới thiệu chú rể Duy Trường.

## Thay nội dung sau

Toàn bộ nội dung chỉnh tại **`src/data/wedding.json`**: tên, lời giới thiệu, ngày giờ, địa điểm, lịch trình, đường dẫn ảnh, nội dung các section, form, album và metadata SEO. `src/config/wedding.ts` chỉ khai báo kiểu dữ liệu và tạo danh sách ảnh cho lightbox, không chứa nội dung thiệp.

Địa chỉ trống, ngày chưa có và link bản đồ trống được ẩn, không hiển thị thông báo chờ cập nhật cho khách. JSON không hỗ trợ comment; trường `_meta` cuối file ghi ngày và mục đích thay đổi cấu hình.

Thông tin ngày cưới:

- Nhà trai giữ ngày đã cung cấp: Chủ Nhật, **29/11/2026**, nhằm ngày 21 tháng 10 năm Bính Ngọ; giữ giờ 17:30 từ dữ liệu trước đó.
- Nhà gái sớm hơn một ngày: Thứ Bảy, **28/11/2026**, nhằm ngày 20 tháng 10 năm Bính Ngọ.
- Mỗi bên có giờ riêng trong `events.<side>.dateTime`; hiện giữ **17:30** theo dữ liệu đã có. Khi có giờ thực tế, chỉnh độc lập từng bên. Hero và lời mời đều hiển thị giờ của đúng gia đình.
- Địa điểm mặc định là tư gia từng bên, `address` trống và `mapUrl` là `null`; điền địa chỉ thật riêng cho mỗi bên.
- Mỗi route lấy duy nhất `events.groom` hoặc `events.bride` cho ngày bìa, lịch tháng, giờ tiệc, âm lịch, địa điểm, chỉ đường, lịch trình và ngày cuối thiệp. Thay một bên không ảnh hưởng bên kia.

- `events.groom` / `events.bride`: `sideLabel`, `label`, `venue`, `address`, `dateTime`, `lunarDate`, `mapUrl`, `schedule` độc lập.
- `events.<side>.dateTime`: ISO 8601 giờ Việt Nam, định dạng `YYYY-MM-DDTHH:mm:ss+07:00`. Lịch tháng tự tính số ngày và vị trí ngày cưới từ giá trị này. Để `null` khi chưa chốt.
- `events.<side>.lunarDate`: điền âm lịch tương ứng khi đổi ngày; không tự tính hay sao chép từ bên kia.
- `events.<side>.schedule`: các mốc `{ time, title, detail, icon }` của riêng gia đình đó. Mảng rỗng sẽ ẩn section. Icon hỗ trợ: `car`, `flower`, `heart`, `rings`, `pin`, `calendar`, `check`, `arrow`, `image`.
- `mapUrl`: URL chỉ đường thật khi có địa chỉ. Để `null` thì không hiện nút chỉ đường.
- `groom.introduction` / `bride.introduction`: lời giới thiệu cá nhân.
- Upload ảnh vào `public/images/`, rồi khai báo đường dẫn `/images/ten-file.jpg` trong JSON.
- `groom.portrait` / `bride.portrait`: đường dẫn ảnh chân dung. Đã có ảnh để hiển thị, thay trực tiếp đường dẫn khi có bộ ảnh thật.
- `photos.hero`, `photos.roses`: ảnh bìa và hoa hồng. Bìa nên ngang, tối thiểu 1600px.
- `photos.story`: bốn ảnh tạo bố cục editorial: ảnh chính khung giấy nghiêng, ảnh phụ chồng lớp, ảnh vòm và ảnh vuông. Màn hình lớn trải ảnh thành bố cục ba vùng thay vì kéo dài cột mobile. Thuộc tính `position` chỉnh điểm crop.
- `photos.gallery`: năm ảnh tạo lưới bất đối xứng, xen khung vòm, ảnh tròn, dọc và ngang. Có thể thêm ảnh; ảnh từ vị trí thứ sáu tiếp tục xuống hàng. Giữ ít nhất một ảnh.
- `content`: tất cả tiêu đề, câu mời, lời cảm ơn, nhãn điều hướng, nhãn accessibility và thông báo tương tác. `metadata`: tiêu đề và mô tả SEO.
- Không hiển thị nhãn ảnh mẫu, thông báo chờ ảnh, hướng dẫn phát triển hay trạng thái chưa có địa chỉ trên thiệp.

## Tương tác & hiệu năng

- Chọn gia đình ngay màn mở đầu để mở route thiệp riêng. Không có nút đổi bên trong thiệp. Sao chép đúng link theo bên được mời.
- Album phóng to, chuyển bằng nút hoặc phím mũi tên, đóng bằng Escape. Dialog quản lý focus, khóa cuộn nền.
- Form hồi đáp gửi `POST /api/rsvp`, kiểm tra dữ liệu và lưu trên server trong `.rsvp/responses/`, tách riêng nhà trai / nhà gái. Không còn chỉ lưu `localStorage`. Email là tùy chọn; chỉ khách chọn tham dự và nhập email mới được gửi hướng dẫn nếu đã bật và cấu hình SMTP. Preview admin không lưu hồi đáp hoặc gửi email thật.
- Next Image tối ưu ảnh, preload bìa, lazy-load ảnh ngoài màn hình; dialog album và form tải qua dynamic import khi mở.
- Font tiếng Việt lưu nội bộ; không gọi Google Fonts khi build hoặc xem thiệp.
- Hỗ trợ giảm chuyển động, bàn phím, thanh điều hướng mobile và safe area. Không có header; nội dung hero vừa một màn hình trên mobile và desktop. Nội dung vẫn hiện nếu chưa chạy JavaScript; hiệu ứng cuộn chỉ bật sau hydration.

## Kiểm tra

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Tài nguyên minh họa

Ảnh từ Unsplash chỉ để dựng bố cục, không phải ảnh thật của Duy Trường và Diễm Quỳnh. Không sao chép ảnh cá nhân từ thiệp tham khảo.

| File | Unsplash image ID |
| --- | --- |
| wedding-demo.jpg | photo-1519741497674-611481863552 |
| moments-demo.jpg | photo-1511285560929-80b456fea0bc |
| details-demo.jpg | photo-1523438885200-e635ba2c371e |
| roses-demo.jpg | photo-1518895949257-7621c3c786d7 |
| editorial-demo.jpg | photo-1591604466107-ec97de577aff |
| ceremony-demo.jpg | photo-1537633552985-df8429e8048b |
| flowers-demo.jpg | photo-1529636798458-92182e662485 |

Font Quicksand, Cormorant Garamond, Charmonman Bold và Great Vibes lưu nội bộ; giấy phép SIL Open Font License trong `public/fonts/`. Bộ font trước vẫn giữ nguyên file, không xóa tài nguyên ngoài phạm vi. Họa tiết hoa hồng là SVG nội bộ, không dùng ảnh riêng của cặp đôi trong thiệp tham khảo.

## Hero và trải nghiệm nghe nhạc — 2026-11-12

- Hero hai bên dùng chung khung giấy viền uốn lượn, hoa hồng đối xứng hai góc và ảnh phủ gradient; ngày, âm lịch và địa điểm vẫn lấy riêng từ `events.<side>`.
- Ảnh giới thiệu sử dụng mask cọ xén `public/images/portrait-mask.svg`, không đóng khung vòm hay làm mờ nội dung chữ. Nền có các vùng gradient blur nhẹ riêng.
- `experience` nằm ở cuối `src/data/wedding.json`: `audio.src` là `/i-do.mp3`, `audio.volume` là `0.2`, `audio.loop` bật phát lặp.
- Audio nằm ở layout để không ngắt khi chọn nhà trai / nhà gái. Thao tác chọn bên gọi phát nhạc ngay trong sự kiện người dùng. Mở link trực tiếp sẽ thử tự phát; nếu trình duyệt chặn, nút phát nhỏ trên thiệp cho phép bắt đầu bằng thao tác người dùng, không hiển thị màn hướng dẫn.
- Web Audio dùng gain 20% với âm lượng nguồn 100%, hoặc volume native 20% nếu không có Web Audio. Không giảm cả hai cùng lúc.
- `experience.scroll.pixelsPerSecond` là 19.8, nhanh hơn đúng 10% so với 18 trước đó; `rampMilliseconds` giữ 5000 để bắt đầu thật nhẹ rồi đạt tốc độ cuộn chậm. Chỉ cuộn khi nhạc thực sự đang phát; tạm dừng nhạc, buffering hoặc mở dialog sẽ dừng cuộn.
- Chạm, kéo, cuộn chuột hoặc dùng phím điều hướng sẽ trả quyền cuộn cho khách. Có nút dừng / tiếp tục cuộn riêng; tới cuối trang tự dừng. Tôn trọng `prefers-reduced-motion`: không tự cuộn khi khách bật giảm chuyển động, nhưng vẫn cho phép chủ động bật bằng nút.

## Visual editor — 2026-11-13

- Tạo `.env.local` theo `.env.example`, đặt `ADMIN_USERNAME` và `ADMIN_PASSWORD` riêng (mật khẩu ít nhất 12 ký tự). Không có tài khoản mặc định. Khởi động lại server sau khi đổi thông tin đăng nhập.
- Chạy `npm run dev` (hoặc `npm run editor`), mở `http://localhost:3000/admin`. Đổi port bằng `npm run dev -- --port 3001`. Editor chỉ lắng nghe trên loopback, dành cho quản trị local theo mẫu `do-tho-dn`.
- Chọn màn mở đầu / nhà trai / nhà gái, bấm trực tiếp chữ hoặc ảnh để sửa. Nút **Nội dung** cung cấp toàn bộ dữ liệu: tên, ngày cưới, địa điểm, lịch trình, album, nhãn form, thông báo, SEO, nhạc và hoa. Có thêm/xóa/sắp xếp ảnh và lịch trình, hoàn tác/làm lại, preview desktop/tablet/mobile và chế độ duyệt thử.
- Bản nháp cập nhật tức thì trong iframe nhưng chưa đổi thiệp thật. Bấm **Lưu thay đổi** hoặc `Ctrl/Cmd+S` để ghi `src/data/wedding.json`. Nếu file đã bị sửa ở phiên khác, editor từ chối ghi đè; bản nháp vẫn còn để đối chiếu trước khi tải lại.
- Trong **Hình ảnh & album**, chọn **Vị trí chèn ảnh** trước khi thêm: đầu danh sách, trước một ảnh cụ thể hoặc cuối danh sách. Thumbnail và số thứ tự giúp xác định vị trí; ảnh mới đẩy các ảnh sau xuống, xem trước cập nhật ngay và hỗ trợ Hoàn tác/Làm lại.
- Phần giới thiệu hiển thị chung cả cô dâu và chú rể trên hai thiệp; sửa ảnh, tên, vai trò và lời giới thiệu tại nhóm **Chú rể** / **Cô dâu**, sửa dòng dẫn và lời nhắn chung tại **Giới thiệu**. Thiệp chỉ giữ một nút loa bật/tắt nhạc, không còn navbar.
- Upload trực tiếp JPG/PNG/WebP/AVIF (tối đa 10 MB và 30 MP). Server kiểm tra nội dung ảnh, tự xoay theo EXIF, giới hạn cạnh 2560px và chuyển sang WebP. File thật nằm trong `public/uploads/editor/`, URL `/uploads/editor/<uuid>.webp`; không dùng dịch vụ lưu ảnh ngoài. File upload được ghi ngay, nhưng chỉ gắn lên thiệp sau khi lưu bản nháp. Thư viện cho chọn lại ảnh trong `public/images` và `public/uploads`.
- Mỗi lần lưu có bản sao dữ liệu cũ trong `.editor/history/` (không public, không commit). Đăng nhập dùng cookie HttpOnly, giới hạn số lần thử và kiểm tra cùng origin cho API ghi/upload. Không upload SVG hoặc ghi đường dẫn tùy ý.
- Local `npm run dev` dùng editor filesystem. Production `npm run build` / `npm start` và Vercel dùng API editor Next.js khi có **private Vercel Blob** (hướng dẫn cuối tài liệu). Không có Blob thì thiệp vẫn dùng JSON đi kèm bản build, nhưng editor production sẽ báo thiếu cấu hình; không dùng dev server để chữa production.

## Quà mừng, bản đồ & email hướng dẫn — 2026-11-13

- Admin → **Nội dung → Ngày cưới nhà trai / Ngày cưới nhà gái**: nhập `address` là địa chỉ đầy đủ và `mapUrl` là link Google Maps thật. Bản đồ nhúng thu gọn ở góc phải cuối phần hồi đáp, trước footer, tự cập nhật theo `address`; xóa địa chỉ sẽ ẩn bản đồ. Hero bấm mở `mapUrl`; email dùng cùng địa chỉ/link của đúng nhà. Đang dựng mẫu với khu vực Hải Châu / Sơn Trà, Đà Nẵng, **không phải địa chỉ cưới thật**; thay cả địa chỉ và link chỉ đường trước khi phát hành.
- Admin → **Nội dung → Quà mừng nhà trai / Quà mừng nhà gái**: upload `qrImage`, nhập ngân hàng, chủ tài khoản, số tài khoản và nội dung chuyển khoản. QR hiển thị trực tiếp **trước nút Lời hồi đáp**, không cần mở hộp thoại. QR upload được chuyển WebP lossless, không cắt/crop, lưu vào `public/uploads/editor/`. Bật/tắt toàn bộ thẻ QR riêng từng nhà bằng `enabled`. Ảnh `public/images/gift-qr-demo.png` chỉ mã hóa lời nhắn mẫu, **không phải QR thanh toán**; tài khoản mẫu không thể dùng chuyển khoản. Thay QR, thông tin ngân hàng và nội dung `safetyNote` trong **Lời nhắn quà mừng** trước khi phát hành.
- Admin → **Nội dung → Email hướng dẫn**: bật/tắt, sửa tiêu đề, lời chào, nội dung hướng dẫn và lời kết; hỗ trợ `{name}`, `{couple}`, `{side}`, `{guests}`. Các nhãn/form/thông báo nằm trong **Form hồi đáp**, nhãn quà trong **Lời nhắn quà mừng**. Mọi thay đổi cần **Lưu** để đồng bộ ra thiệp; email thật chỉ dùng nội dung đã lưu.
- Thêm cấu hình SMTP ở cuối `.env.local` theo `.env.example`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, tùy chọn `SMTP_REPLY_TO`. `SMTP_FROM`/`SMTP_REPLY_TO` là một địa chỉ email thuần. Port 587 dùng `SMTP_SECURE=false` với STARTTLS bắt buộc; port 465 dùng `true`. Để trống đồng thời USER/PASS chỉ khi SMTP relay của bạn cho phép không xác thực. **Không đưa mật khẩu SMTP vào JSON hoặc admin. Khởi động lại server sau khi đổi env.**
- Khách chọn không tham dự: hiện lời cảm ơn riêng, sửa được qua `declinedTitle` / `declinedMessage` trong **Form hồi đáp**. Khách không tham dự hoặc không nhập email vẫn được ghi nhận hồi đáp, không gửi thư. Khi SMTP thiếu/lỗi/đạt quota, hồi đáp vẫn được lưu và UI thông báo chưa gửi được email; không báo giả là thư đã tới hộp thư. `sent` nghĩa là máy chủ SMTP đã chấp nhận thư, không đảm bảo thư đã được phát vào Inbox.
- Admin → **Tùy chọn → Danh sách hồi đáp**: xem tên, email, số khách, nhà được mời, lời nhắn và trạng thái gửi thư. Dữ liệu cá nhân chỉ nằm trong `.rsvp/`, không nằm trong `public` hoặc JSON nội dung; thư mục này đã được bỏ qua bởi Git. Giới hạn hiển thị 500 hồi đáp gần nhất.
- API kiểm tra cùng origin, giới hạn payload 8 KB, honeypot, 120 lượt gửi mới / 10 phút / process; mã hồi đáp UUID giúp retry không gửi lại cùng thư. Giới hạn email lưu trên đĩa: một lần thử / email / nhà / ngày UTC, tổng mặc định 100 lần thử mỗi ngày qua `RSVP_DAILY_EMAIL_LIMIT`. SMTP lỗi vẫn tính một lần thử để tránh spam; không tự gửi lại khi retry. Cần điều chỉnh quota và bổ sung chống bot chuyên dụng nếu mở cho lưu lượng lớn.
- `POST /api/rsvp` hoạt động cả khi chạy `npm run dev`, `npm start` và Vercel. Local không có Blob dùng `.rsvp/` và cần filesystem bền vững. Vercel bắt buộc dùng private Blob cho hồi đáp; không ghi vào filesystem serverless hay `/tmp`. Không dùng static export. Với reverse proxy, giữ đúng host/protocol để Origin khớp URL công khai. Chủ thiệp quản lý và xóa dữ liệu khách khi không còn cần thiết.

### Gmail và tên người gửi — 2026-11-13

1. Trong tài khoản Google, bật **Xác minh 2 bước**, sau đó tạo **Mật khẩu ứng dụng** cho website. Không dùng mật khẩu đăng nhập Google thông thường. Nếu không có mục Mật khẩu ứng dụng, kiểm tra chính sách tài khoản tổ chức / Advanced Protection / phương thức xác minh của tài khoản.
2. Trong `.env.local`, điền các key SMTP hiện có: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER` là Gmail gửi thư, `SMTP_PASS` là mật khẩu ứng dụng 16 ký tự (bỏ khoảng trắng phân nhóm), `SMTP_FROM` cùng địa chỉ Gmail đó. `SMTP_REPLY_TO` là địa chỉ muốn nhận thư trả lời, có thể để trống. Không thêm lại key trùng và không gửi mật khẩu vào chat. Có thể dùng port 587 với `SMTP_SECURE=false` thay cho 465.
3. Admin → **Nội dung → Email hướng dẫn**: `senderName` (**Tên người gửi email**) mặc định là **Trường Quỳnh Wedding**, độc lập với tên tài khoản Google. `SMTP_FROM` vẫn chỉ nhập địa chỉ email thuần, không nhập `Tên <email>`.
4. Email ghi rõ **Nhà trai / Nhà gái**, thời gian, địa điểm, địa chỉ và link Google Maps của đúng bên mà khách hồi đáp. Nếu chưa nhập `mapUrl` nhưng có địa chỉ, thư tự tạo link tìm địa chỉ trên Google Maps. Sửa dữ liệu hai nhà trong admin trước khi gửi thiệp thật; hiện địa điểm vẫn là mẫu.
5. Lưu nội dung admin và khởi động lại server sau khi sửa `.env.local`. Chỉ khách đồng ý tham dự và có email mới được gửi thư; không tự gửi lại các hồi đáp cũ sau khi bổ sung SMTP.

Tài liệu: https://support.google.com/accounts/answer/185833 và https://developers.google.com/workspace/gmail/imap/imap-smtp.

## Deploy Vercel có admin — 2026-11-13

1. Giữ preset **Next.js**, Build Command `npm run build`, không dùng static export hoặc chạy `npm run dev` trên production.
2. Trong Vercel tạo **Blob store loại Private**, kết nối với project. Đảm bảo `BLOB_READ_WRITE_TOKEN` có trong Environment Variables của **Production**. Không dùng public store: kho này chứa cả nội dung thiệp, phiên admin và dữ liệu hồi đáp riêng tư. Không thêm `NEXT_PUBLIC_` trước tên token.
3. Thêm `ADMIN_USERNAME`, `ADMIN_PASSWORD` (ít nhất 12 ký tự) và các biến `SMTP_*` đã hướng dẫn vào Environment Variables. `.env.local` trên máy không được đưa lên Vercel. **Redeploy** sau khi thay biến môi trường.
4. Mở `/admin/login`, đăng nhập, sửa và **Lưu**. Nội dung được lưu vào Blob, thiệp và email đọc nội dung đã lưu ở mỗi request, không cần rebuild cho mỗi lần chỉnh. SEO của các trang thiệp cũng đọc cùng nguồn nội dung. Trước lần lưu đầu tiên, hệ thống lấy `src/data/wedding.json` trong deployment làm mẫu ban đầu.
5. Ảnh mới upload lưu bền vững trên private Blob và chỉ công khai qua route `/uploads/editor/<uuid>.webp`. Không thể ghi thêm trực tiếp vào thư mục `public` của một deployment Vercel đã build. Ảnh được kiểm tra và chuyển WebP; QR dùng lossless. Giới hạn upload server trên Vercel **4 MB / ảnh, 30 MP**, local filesystem vẫn **10 MB**. Admin tự hiển thị đúng giới hạn.
6. Tên miền chính và miền `vercel.app` đều dùng kiểm tra same-origin theo request; phiên đăng nhập riêng cho mỗi domain, cookie HttpOnly/SameSite/secure khi HTTPS, hết hạn sau 8 giờ. Phiên và giới hạn đăng nhập lưu trên Blob, hoạt động qua nhiều instance. Đăng xuất thu hồi phiên trên server. Đổi username/password sẽ vô hiệu hóa phiên cũ.
7. Lưu nội dung dùng ETag/conditional write để chống ghi đè giữa hai admin; bản sao trước khi lưu nằm trong `history/`, tự hết hạn sau 30 ngày. Hồi đáp, phiên và quota email đều là private Blob. UUID hồi đáp chống gửi thư trùng; mỗi email/nhà/ngày chỉ thử một lần, quota ngày áp dụng chung các instance. Nếu process dừng giữa lúc gửi mail, trạng thái có thể giữ `pending`; không tự gửi lại để tránh gửi trùng.
8. Không chia sẻ cùng namespace giữa **Preview** và **Production**. Mặc định prefix là `wedding-production` / `wedding-preview` theo `VERCEL_ENV`. Có thể đặt `WEDDING_BLOB_PREFIX` (chữ/số/`_`/`-`, tối đa 80 ký tự) hoặc dùng store riêng. Không đổi/xóa store đang dùng nếu chưa sao lưu dữ liệu; redeploy không xóa nội dung Blob đã lưu.

Ghi chú bảo mật 2026-11-13: `overrides` ở cuối `package.json` nâng riêng Zod của `@vercel/cli-config` lên bản vá để SDK Blob không kéo lỗ hổng GHSA-mrhx-c7xc-m3w5. Không chạy `npm audit fix --force` vì có thể hạ SDK và mất conditional-write/private-read cần cho serverless.

Tài liệu: https://vercel.com/docs/vercel-blob/using-blob-sdk và https://vercel.com/docs/functions/limitations.
