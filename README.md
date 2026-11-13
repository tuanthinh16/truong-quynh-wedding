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
- Hỗ trợ giảm chuyển động, bàn phím và safe area. Không có header/navbar; chỉ giữ nút loa. Nội dung vẫn hiện nếu chưa chạy JavaScript; hiệu ứng cuộn chỉ bật sau hydration.

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
- Chạm, kéo, cuộn chuột hoặc dùng phím điều hướng sẽ trả quyền cuộn cho khách; tới cuối trang tự dừng. Chỉ có nút loa bật/tắt nhạc, không có nút cuộn riêng. Tôn trọng `prefers-reduced-motion`: không tự cuộn khi khách bật giảm chuyển động.

## Visual editor — 2026-11-13

- Tạo `.env.local` theo `.env.example`, đặt `ADMIN_USERNAME` và `ADMIN_PASSWORD` riêng (mật khẩu ít nhất 12 ký tự). Không có tài khoản mặc định. Khởi động lại server sau khi đổi thông tin đăng nhập.
- Chạy `npm run dev` (hoặc `npm run editor`), mở `http://localhost:3000/admin`. Đổi port bằng `npm run dev -- --port 3001`. Editor chỉ lắng nghe trên loopback, dành cho quản trị local theo mẫu `do-tho-dn`.
- Chọn màn mở đầu / nhà trai / nhà gái, bấm trực tiếp chữ hoặc ảnh để sửa. Nút **Nội dung** cung cấp toàn bộ dữ liệu: tên, ngày cưới, địa điểm, lịch trình, album, nhãn form, thông báo, SEO, nhạc và hoa. Có thêm/xóa/sắp xếp ảnh và lịch trình, hoàn tác/làm lại, preview desktop/tablet/mobile và chế độ duyệt thử.
- Bản nháp cập nhật tức thì trong iframe nhưng chưa đổi thiệp thật. Bấm **Lưu thay đổi** hoặc `Ctrl/Cmd+S` để ghi `src/data/wedding.json`. Nếu file đã bị sửa ở phiên khác, editor từ chối ghi đè; bản nháp vẫn còn để đối chiếu trước khi tải lại.
- Trong **Hình ảnh & album**, chọn **Vị trí chèn ảnh** trước khi thêm: đầu danh sách, trước một ảnh cụ thể hoặc cuối danh sách. Thumbnail và số thứ tự giúp xác định vị trí; ảnh mới đẩy các ảnh sau xuống, xem trước cập nhật ngay và hỗ trợ Hoàn tác/Làm lại.
- Phần giới thiệu dùng **một ảnh chung bên trái, nội dung cả hai bên phải** trên desktop; mobile xếp ảnh trước, chữ sau. Sửa ảnh tại **Hình ảnh & album → Ảnh chung cô dâu & chú rể**; tên, vai trò và lời giới thiệu tại **Chú rể** / **Cô dâu**; dòng dẫn và lời nhắn chung tại **Giới thiệu**. Thiệp chỉ giữ một nút loa bật/tắt nhạc, không còn navbar.
- Upload trực tiếp JPG/PNG/WebP/AVIF (tối đa 30 MB và 60 MP). Server kiểm tra nội dung ảnh, tự xoay theo EXIF, giới hạn cạnh 2560px và chuyển sang WebP. File thật nằm trong `public/uploads/editor/`, URL `/uploads/editor/<uuid>.webp`; không dùng dịch vụ lưu ảnh ngoài. File upload được ghi ngay, nhưng chỉ gắn lên thiệp sau khi lưu bản nháp. Thư viện cho chọn lại ảnh trong `public/images` và `public/uploads`.
- Mỗi lần lưu có bản sao dữ liệu cũ trong `.editor/history/` (không public, không commit). Đăng nhập dùng cookie HttpOnly, giới hạn số lần thử và kiểm tra cùng origin cho API ghi/upload. Không upload SVG hoặc ghi đường dẫn tùy ý.
- Local `npm run dev` dùng editor filesystem có đăng nhập. Production `npm run build` / `npm start` và Vercel chỉ xem trước nội dung công khai tại `/admin`, khóa toàn bộ upload/lưu và API ghi. Thiệp lấy JSON và ảnh từ bản commit, không cần kho lưu trữ ngoài.
- Cập nhật 2026-11-13: thư viện admin chỉ tải thumbnail WebP tối đa 256×256, không tải ảnh gốc để dựng danh sách. Thumbnail tạo với số tác vụ giới hạn, cache tại `public/optimized/editor-thumbnails/` và tự đổi URL khi ảnh gốc thay đổi; lần tạo đầu có thể mất vài giây. Danh sách dùng cache chung trong phiên admin, upload bổ sung trực tiếp vào cache, lưới render từng đợt 24 ảnh khi cuộn. Sau khi sửa `scripts/editor/service.mjs`, lưu bản nháp rồi khởi động lại `npm run dev` để server nhận thay đổi.

## Quà mừng, bản đồ & email hướng dẫn — 2026-11-13

- Admin → **Nội dung → Ngày cưới nhà trai / Ngày cưới nhà gái**: nhập `address` là địa chỉ đầy đủ và `mapUrl` là link Google Maps thật. Bản đồ nhúng thu gọn ở góc phải cuối phần hồi đáp, trước footer, tự cập nhật theo `address`; xóa địa chỉ sẽ ẩn bản đồ. Hero bấm mở `mapUrl`; email dùng cùng địa chỉ/link của đúng nhà. Đang dựng mẫu với khu vực Hải Châu / Sơn Trà, Đà Nẵng, **không phải địa chỉ cưới thật**; thay cả địa chỉ và link chỉ đường trước khi phát hành.
- Admin → **Nội dung → Quà mừng nhà trai / Quà mừng nhà gái**: upload `qrImage`, nhập ngân hàng, chủ tài khoản, số tài khoản và nội dung chuyển khoản. QR hiển thị trực tiếp **trước nút Lời hồi đáp**, không cần mở hộp thoại. QR upload được chuyển WebP lossless, không cắt/crop, lưu vào `public/uploads/editor/`. Bật/tắt toàn bộ thẻ QR riêng từng nhà bằng `enabled`. Ảnh `public/images/gift-qr-demo.png` chỉ mã hóa lời nhắn mẫu, **không phải QR thanh toán**; tài khoản mẫu không thể dùng chuyển khoản. Thay QR, thông tin ngân hàng và nội dung `safetyNote` trong **Lời nhắn quà mừng** trước khi phát hành.
- Admin → **Nội dung → Email hướng dẫn**: bật/tắt, sửa tiêu đề, lời chào, nội dung hướng dẫn và lời kết; hỗ trợ `{name}`, `{couple}`, `{side}`, `{guests}`. Các nhãn/form/thông báo nằm trong **Form hồi đáp**, nhãn quà trong **Lời nhắn quà mừng**. Mọi thay đổi cần **Lưu** để đồng bộ ra thiệp; email thật chỉ dùng nội dung đã lưu.
- Thêm cấu hình SMTP ở cuối `.env.local` theo `.env.example`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, tùy chọn `SMTP_REPLY_TO`. `SMTP_FROM`/`SMTP_REPLY_TO` là một địa chỉ email thuần. Port 587 dùng `SMTP_SECURE=false` với STARTTLS bắt buộc; port 465 dùng `true`. Để trống đồng thời USER/PASS chỉ khi SMTP relay của bạn cho phép không xác thực. **Không đưa mật khẩu SMTP vào JSON hoặc admin. Khởi động lại server sau khi đổi env.**
- Khách chọn không tham dự: hiện lời cảm ơn riêng, sửa được qua `declinedTitle` / `declinedMessage` trong **Form hồi đáp**. Khách không tham dự hoặc không nhập email vẫn được ghi nhận hồi đáp, không gửi thư. Khi SMTP thiếu/lỗi/đạt quota, hồi đáp vẫn được lưu và UI thông báo chưa gửi được email; không báo giả là thư đã tới hộp thư. `sent` nghĩa là máy chủ SMTP đã chấp nhận thư, không đảm bảo thư đã được phát vào Inbox.
- Admin → **Tùy chọn → Danh sách hồi đáp**: xem tên, email, số khách, nhà được mời, lời nhắn và trạng thái gửi thư. Dữ liệu cá nhân chỉ nằm trong `.rsvp/`, không nằm trong `public` hoặc JSON nội dung; thư mục này đã được bỏ qua bởi Git. Giới hạn hiển thị 500 hồi đáp gần nhất.
- API kiểm tra cùng origin, giới hạn payload 8 KB, honeypot, 120 lượt gửi mới / 10 phút / process; mã hồi đáp UUID giúp retry không gửi lại cùng thư. Giới hạn email lưu trên đĩa: một lần thử / email / nhà / ngày UTC, tổng mặc định 100 lần thử mỗi ngày qua `RSVP_DAILY_EMAIL_LIMIT`. SMTP lỗi vẫn tính một lần thử để tránh spam; không tự gửi lại khi retry. Cần điều chỉnh quota và bổ sung chống bot chuyên dụng nếu mở cho lưu lượng lớn.
- `POST /api/rsvp` hoạt động cả khi chạy `npm run dev`, `npm start` và Vercel. Local lưu `.rsvp/` trên filesystem. Vercel chỉ lưu tạm trong `/tmp/.rsvp/`: **có thể mất khi instance dừng, không đồng bộ giữa các instance, admin local không xem được hồi đáp trên Vercel**. UI báo rõ giới hạn này sau khi gửi. Chống gửi trùng/quota chỉ có hiệu lực trong cùng filesystem còn tồn tại, không đảm bảo toàn deployment. SMTP vẫn gửi hướng dẫn theo đúng nhà khi được cấu hình. Không dùng danh sách tạm làm nguồn chốt khách duy nhất. Không dùng static export.

### Concept bữa tiệc và email màu sắc — 2026-11-13

- Admin → **Nội dung → Concept bữa tiệc**: bật/tắt, sửa tone màu và trang phục bằng văn bản. Cấu hình `partyConcept` đặt cuối JSON, dùng chung cho hai nhà.
- Dưới cụm lịch và trong email chỉ hiện hai dòng chữ nhỏ: “Concept chính: …” và “Trang phục: …”; không chấm màu, border hay nội dung thêm.
- Email hướng dẫn dùng HTML đỏ rượu–kem: tên cô dâu/chú rể, thẻ thời gian/địa điểm theo đúng nhà, nút Google Maps và concept đồng bộ từ dữ liệu đã **Lưu**. Luôn kèm bản plain text cho ứng dụng không hiển thị HTML. Tắt concept sẽ ẩn trong cả thiệp và thư; email đã gửi không tự thay đổi.

### Gmail và tên người gửi — 2026-11-13

1. Trong tài khoản Google, bật **Xác minh 2 bước**, sau đó tạo **Mật khẩu ứng dụng** cho website. Không dùng mật khẩu đăng nhập Google thông thường. Nếu không có mục Mật khẩu ứng dụng, kiểm tra chính sách tài khoản tổ chức / Advanced Protection / phương thức xác minh của tài khoản.
2. Trong `.env.local`, điền các key SMTP hiện có: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`, `SMTP_USER` là Gmail gửi thư, `SMTP_PASS` là mật khẩu ứng dụng 16 ký tự (bỏ khoảng trắng phân nhóm), `SMTP_FROM` cùng địa chỉ Gmail đó. `SMTP_REPLY_TO` là địa chỉ muốn nhận thư trả lời, có thể để trống. Không thêm lại key trùng và không gửi mật khẩu vào chat. Có thể dùng port 587 với `SMTP_SECURE=false` thay cho 465.
3. Admin → **Nội dung → Email hướng dẫn**: `senderName` (**Tên người gửi email**) mặc định là **Trường Quỳnh Wedding**, độc lập với tên tài khoản Google. `SMTP_FROM` vẫn chỉ nhập địa chỉ email thuần, không nhập `Tên <email>`.
4. Email ghi rõ **Nhà trai / Nhà gái**, thời gian, địa điểm, địa chỉ và link Google Maps của đúng bên mà khách hồi đáp. Nếu chưa nhập `mapUrl` nhưng có địa chỉ, thư tự tạo link tìm địa chỉ trên Google Maps. Sửa dữ liệu hai nhà trong admin trước khi gửi thiệp thật; hiện địa điểm vẫn là mẫu.
5. Lưu nội dung admin và khởi động lại server sau khi sửa `.env.local`. Chỉ khách đồng ý tham dự và có email mới được gửi thư; không tự gửi lại các hồi đáp cũ sau khi bổ sung SMTP.

Tài liệu: https://support.google.com/accounts/answer/185833 và https://developers.google.com/workspace/gmail/imap/imap-smtp.

## Upload local, deploy từ Git — 2026-11-13

1. Giữ preset **Next.js**, Build Command `npm run build`, không dùng static export hoặc chạy `npm run dev` trên production.
2. Chạy `npm run dev`, đăng nhập admin local, upload ảnh rồi bấm **Lưu thay đổi**. Giới hạn 30 MB / ảnh, 60 MP; ảnh nằm trong `public/uploads/editor/`, nội dung trong `src/data/wedding.json`.
3. Commit/push **cả JSON lẫn ảnh mới**. Vercel tự build từ commit; deployment mới luôn thay thế nội dung/ảnh theo Git. Không commit `.env.local`, `.editor/` hoặc `.rsvp/`.
4. Bản online `/admin` chỉ xem trước, không cần đăng nhập vì chỉ chứa dữ liệu thiệp đã công khai; input/upload/lưu đều khóa. `/__editor` và `/api/editor` chặn mọi thao tác ghi ở server. Không có mật khẩu hay hồi đáp khách trong dữ liệu public này.
5. Chỉ cần các biến `SMTP_*` và `RSVP_DAILY_EMAIL_LIMIT` trên Vercel nếu dùng email. Biến `ADMIN_*` chỉ dùng local. Không cần token kho ảnh hoặc SDK lưu trữ ngoài. Biến môi trường cũ nếu có không còn được code sử dụng.
6. Hồi đáp Vercel là tạm thời như giới hạn ở trên; email xác nhận vẫn dùng cấu hình SMTP. Nếu cần danh sách khách bền vững sau này, cần bổ sung lưu trữ riêng.

### Nội dung và ảnh responsive — 2026-11-13

- **Hình ảnh & album**: cập nhật 2026-11-13, mỗi vị trí chỉ có một nguồn ảnh trên mọi màn hình: `photos.hero` cho hero và `photos.roses` cho mở đầu. Trong admin, sửa **Ảnh hero · mọi màn hình** hoặc **Ảnh mở đầu · mọi màn hình** một lần để áp dụng cả mobile/desktop. Không còn hai trường ảnh mobile riêng; trình duyệt vẫn chọn kích thước WebP phù hợp từ cùng ảnh gốc. Collage khoảnh khắc dùng hai cột lệch nhịp, nghiêng nhẹ, không xếp toàn bộ ảnh lên cùng một ô.
- **Chuyện chúng mình**: sửa tiêu đề, dòng tiếng Anh và hai đoạn văn; section nằm ngay sau thông tin ngày/giờ, hiện trên cả hai thiệp.
- **Hồi đáp**: nội dung Save a Seat chia thành các đoạn, nút hồi đáp nằm trước phần quà mừng. **Lời nhắn quà mừng** sửa lời dẫn và chữ Gửi quà; trái tim rung nhẹ, mặc định che QR, nhấn hoặc dùng Enter/Space để mở/đóng. Không hiện hướng dẫn thao tác. QR 180px, mỗi nhà một mã riêng; chỉ hiển thị ảnh mã, không kèm thông tin tài khoản. Tắt chuyển động khi khách bật giảm chuyển động.
- **Lời mời**: lời gửi những người thân thương và nội dung hành trình 8 năm nằm phía trên lịch/ngày cưới; sửa `letterTitle` / `letterBody`.
- **Ngày cưới nhà trai / nhà gái → Lịch trình**: mỗi mốc có ngày riêng (`date`, chọn bằng date picker), giờ, tiêu đề, mô tả và icon. Nhà gái có ăn hỏi **09:30 28/11/2026**, bữa cơm **17:30 28/11/2026** (tạm giữ giờ tiệc đã có, chưa được xác nhận lại), vu quy **10:00 29/11/2026**, thành hôn **11:00 29/11/2026**. Nhà trai dựng tương tự để sửa sau nhưng không có bữa cơm thân mật.
- **Ngày cưới → Ảnh cưới cạnh bản đồ**: mỗi nhà chọn một ảnh dọc riêng. Bố cục cuối thiệp giữ ảnh bên trái, tiêu đề Address / tư gia / địa chỉ / map gọn bên phải trên cả mobile và desktop. Giờ và ngày âm lịch nằm phía trên; dùng cùng dữ liệu ngày cưới và cùng component trong admin preview. Sửa tiêu đề tại **Lời mời → Tiêu đề khu vực địa chỉ**.
- **Đếm ngược ngày cưới**: bốn ô ngày/giờ/phút/giây bên dưới ảnh và map, chạy theo `events.<side>.dateTime` của từng nhà. Đổi ngày giờ trong admin sẽ cập nhật bộ đếm; qua giờ tổ chức thì dừng ở 00, không hiển thị số âm; bỏ ngày giờ thì ẩn bộ đếm. Các nhãn sửa trong nhóm **Đếm ngược ngày cưới**.
- **THE BEGINNING OF ALWAYS**: ảnh xếp chồng kiểu scrapbook, nhấn vào phần ảnh lộ ra hoặc dùng bàn phím để xem; không có icon góc ảnh. Hai ảnh cuối **OUR WEDDING GALLERY** đổi sang vòm và chữ nhật bo góc bất đối xứng.

### Tối ưu ảnh và map nhúng — 2026-11-13

- Giới hạn upload dùng chung `src/lib/image-settings.mjs`: 30 MB dung lượng file, 60 MP chống ảnh quá lớn gây tràn bộ nhớ; cập nhật ngày 2026-11-13 để nhận bộ ảnh máy ảnh 32,74 MP hiện có. Upload chỉ thực hiện local; bản online vẫn chỉ xem trước.
- Cập nhật 2026-11-13: custom editor server không hot-reload theo Next.js. Sau khi sửa backend hoặc giới hạn upload, cần dừng terminal dev và chạy lại `npm run dev`. Admin kiểm tra giới hạn thực tế trước khi gửi file, chặn server cũ thay vì hiển thị 30 MB nhưng bị backend từ chối. Lưu bản nháp trước khi tải lại admin. Upload dùng raw binary, không base64; thông báo lỗi tách dung lượng MB và độ phân giải MP, upload thành công hiển thị dung lượng/kích thước ảnh sau nén. Ảnh nguồn 30 MB không được gửi nguyên dung lượng đó cho khách xem: server lưu WebP tối đa 2560px, build tiếp tục tạo responsive variants có hash/cache.
- `npm run dev`, `npm run editor` và `npm run build` tự tạo ảnh WebP nhiều kích thước vào `public/optimized/` và manifest `.generated/images.json`. Có thể chạy riêng `npm run prepare:images`. Không commit hai thư mục sinh tự động; Vercel tạo lại lúc build. Build Command trên Vercel cần là `npm run build`, không ghi đè thành `next build` trực tiếp. Trước khi chạy `tsc` trực tiếp trên checkout mới, chạy `npm run prepare:images`.
- Hero/mở màn dùng một nguồn ảnh dọc cho mọi màn hình, ưu tiên tải ngay; desktop đặt ảnh bên phải và giữ trọn khung, nội dung bên trái. Album dùng khung dọc 2:3, collage xếp hai cột lệch nhịp để từng ảnh đều nhìn rõ; ảnh dưới trang vẫn lazy-load. Gallery và hoa dùng cùng ảnh dựng sẵn, không chờ nén ảnh theo từng request đầu tiên. Ảnh vừa upload trong bản nháp chưa có variant vẫn dùng Next Image Optimization để preview; build tiếp theo sẽ tạo variant.
- Tên variant chứa hash nội dung ảnh và cấu hình encoder, cache browser 1 năm với `immutable`; Vercel tự cache file tĩnh trên CDN. Thay ảnh rồi build sẽ tạo URL mới, không cần xóa cache. Không đặt immutable cho file `/images` có tên cố định. QR giữ ảnh gốc lossless, không nén mất chi tiết.
- Vercel có CDN cache static assets; các variant là file tĩnh, không dùng lượt Image Optimization động. Cache thực tế được nạp khi có request, không phải khẳng định mọi điểm CDN đã được làm nóng sẵn.
- Admin **Ngày cưới nhà trai / nhà gái → Link Google Maps nhúng**: dán HTML iframe từ Google Maps → Chia sẻ → Nhúng bản đồ, hoặc chỉ URL `src`. Link nhúng tách biệt với link chỉ đường và địa chỉ, không tự tìm lại khi sửa địa chỉ; xóa link sẽ ẩn map. Chỉ nhận HTTPS Google Maps nhúng, không nhận link rút gọn hay iframe website khác.
- Không tự commit/push; chỉ deploy khi người dùng yêu cầu.

### Link mời cá nhân hóa và hero ảnh dọc — 2026-11-13

- Hero và màn mở đầu dùng cùng nguồn ảnh trên mọi kích thước: desktop/tablet giữ ảnh dọc tự nhiên bên phải, bỏ viền/vòm; mobile ảnh phủ kín section với gradient nhẹ ở chân ảnh. Màn mở đầu có lời kính mời, tên khách (mặc định **Bạn**) và ngày/tháng/năm màu đỏ rượu vang ở 1/3 trên; tên dâu rể và hai lựa chọn gia đình màu sáng ở chân ảnh. Ngày mở đầu sửa tại **Nội dung → Màn mở đầu → Ngày diễn ra**, độc lập ngày từng nhà. Hero hai nhà chỉ giữ ngày lớn, tên, tên buổi lễ/gia đình và giờ ở một cụm; không có địa chỉ, map hoặc nút xem lời mời. Tên người được mời hiển thị đầy đủ trong phần lời mời bên dưới; bản đồ vẫn nằm cuối trang. Dùng chung trang chính và admin preview.
- Trong admin chọn **Tạo link mời**, nhập **domain đã deploy** (thay localhost nếu đang chỉnh local), chọn màn mở đầu / nhà trai / nhà gái, nhập mỗi tên một dòng và bấm **Tạo link mời**. Có thể sao chép từng link, sao chép tất cả hoặc tải `.txt`; danh sách không lưu lên server.
- Link dạng `?name=...` hiển thị tên ở lời kính mời và lời cảm ơn cuối thiệp. Chọn nhà trai/gái từ màn mở đầu hoặc sao chép link chia sẻ vẫn giữ tên. Link không có tên dùng lời mời chung.
- Sửa nhãn kính mời, tên mặc định và lời cảm ơn trong **Nội dung → Lời mời cá nhân hóa**; dùng `{name}` trong lời cảm ơn để chèn tên khách. Tên tối đa 120 ký tự, khoảng trắng được chuẩn hóa; dòng trống và tên trùng được bỏ qua khi tạo link.

### Lưu admin không reload — 2026-11-13

- Có thể nhập `A+B`, `A + B` hoặc `A + người yêu` trên cùng một dòng để tạo một lời mời chung. Link được tạo tự mã hóa dấu cộng thành `%2B`; không thay `%2B` bằng `+` thủ công vì dấu `+` thô trong query được trình duyệt hiểu là khoảng trắng.
- Nội dung JSON chỉ được đọc phía server, không import vào bundle chạy của trình duyệt. Local đọc dữ liệu mới ở mỗi request; production dùng cache để giữ khả năng dựng trang tĩnh và tối ưu tải trang. File nội dung được đưa vào output tracing của Vercel.
- Bấm **Lưu thay đổi** cập nhật dữ liệu, baseline và revision trong React state, giữ nguyên khung xem trước, nhóm nội dung đang sửa và lịch sử hoàn tác; không reload trang hoặc iframe do ghi JSON. **Tải lại dữ liệu** cũng lấy JSON qua API rồi cập nhật state, chỉ bỏ bản nháp sau khi xác nhận.

### Tải ảnh theo cuộn và mở màn — 2026-11-13

- Ảnh nội dung chỉ mount khi cách khung nhìn tối đa 120px; ra khỏi vùng này sẽ unmount ở cả hai chiều cuộn. Khung ảnh giữ nguyên kích thước để không nhảy trang. Ảnh đầu trang vẫn tải ngay, ảnh đã tải có thể được trình duyệt giữ trong cache.
- Ảnh xuất hiện luân phiên từ trái/phải khi vào màn hình; cuộn ra rồi quay lại sẽ chạy lại. Màn chọn gia đình và hero mở từ trên xuống. Tôn trọng `prefers-reduced-motion`.
- Reload thiệp công khai đưa về đầu trang, không khôi phục vị trí cuộn cũ; không áp dụng cho admin.
- 2026-11-13: Reset cuộn chỉ chạy lúc khởi tạo trang, không dùng `pageshow` vì sự kiện này có thể đến muộn khi ảnh tải chậm và kéo khách đang xem về đầu. Observer lấy trạng thái giao cắt cuối mỗi batch để ảnh không kẹt trạng thái cũ khi cuộn nhanh; ảnh nội dung giữ native lazy loading, hero vẫn tải ngay.
