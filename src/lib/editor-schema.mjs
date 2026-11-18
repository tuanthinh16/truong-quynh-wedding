const unsafe = new Set(["__proto__", "constructor", "prototype"]);
const labels = {
  groom: "Chú rể", bride: "Cô dâu", name: "Họ tên", shortName: "Tên ngắn", initial: "Chữ đầu", portrait: "Ảnh chân dung", introduction: "Giới thiệu", role: "Vai trò",
  photos: "Hình ảnh", hero: "Ảnh hero · mọi màn hình", roses: "Ảnh mở đầu · dọc (mobile)", heroAlt: "Mô tả ảnh hero", story: "Khoảnh khắc", gallery: "Album", src: "Ảnh", alt: "Mô tả ảnh", position: "Vị trí ảnh", label: "Nhãn",
  events: "Ngày cưới", sideLabel: "Tên gia đình", venue: "Địa điểm", address: "Địa chỉ", dateTime: "Ngày và giờ", lunarDate: "Âm lịch", mapUrl: "Link bản đồ", schedule: "Lịch trình", time: "Giờ", title: "Tiêu đề", detail: "Mô tả", icon: "Biểu tượng",
  content: "Nội dung", entrance: "Màn mở đầu", invitation: "Lời mời", partner: "Giới thiệu", calendar: "Lịch", album: "Album", reply: "Hồi đáp", footer: "Cuối thiệp", navigation: "Điều hướng", modal: "Hộp thoại", rsvp: "Form hồi đáp",
  metadata: "SEO", openGraph: "Chia sẻ mạng xã hội", description: "Mô tả", locale: "Ngôn ngữ", experience: "Trải nghiệm", audio: "Nhạc nền", volume: "Âm lượng", loop: "Phát lặp", scroll: "Cuộn tự động", pixelsPerSecond: "Tốc độ cuộn (px/s)", rampMilliseconds: "Thời gian tăng tốc (ms)", controls: "Nút điều khiển", decoration: "Trang trí", bouquet: "Bó hoa", storageKey: "Khóa lưu hồi đáp",
  eyebrow: "Dòng dẫn", accent: "Chữ nhấn", question: "Câu hỏi", button: "Nút bấm", weekdays: "Thứ trong tuần", month: "Tháng", heading: "Đầu mục", note: "Ghi chú", selected: "Ngày chọn", quote: "Lời nhắn", caption: "Chú thích", signature: "Chữ ký", closing: "Lời kết",
  skip: "Bỏ qua phần mở đầu", invite: "Dòng kính mời", atTime: "Nhãn giờ", lunarPrefix: "Tiền tố âm lịch", atVenue: "Nhãn địa điểm", map: "Nút chỉ đường", intro: "Lời giới thiệu", share: "Nút chia sẻ", copied: "Thông báo đã sao chép", link: "Nhãn đường dẫn", view: "Nút xem ảnh", previous: "Ảnh trước", next: "Ảnh tiếp theo", close: "Nút đóng",
  namePlaceholder: "Gợi ý nhập tên", attendance: "Câu hỏi tham dự", yes: "Lựa chọn có mặt", no: "Lựa chọn vắng mặt", guests: "Số khách", guestUnit: "Đơn vị số khách", message: "Nhãn lời nhắn", messagePlaceholder: "Gợi ý lời nhắn", submit: "Nút lưu hồi đáp", nameError: "Lỗi chưa nhập tên", storageError: "Lỗi lưu trên thiết bị", thanks: "Dòng cảm ơn", successTitle: "Tiêu đề đã lưu", successMessage: "Thông báo đã lưu", back: "Nút trở về", dateLabel: "Nhãn ngày cưới", timeLabel: "Nhãn giờ cưới", venueLabel: "Nhãn nơi tổ chức", loveLabel: "Nhãn lời hẹn", play: "Nút phát nhạc", pause: "Nút tạm dừng", scrollStart: "Nút tiếp tục cuộn", scrollPause: "Nút dừng cuộn",
  gifts: "Quà mừng online", gift: "Lời nhắn quà mừng", giftButton: "Nút gửi quà online", enabled: "Bật chức năng", qrImage: "Ảnh mã QR", bankName: "Tên ngân hàng", accountName: "Chủ tài khoản", accountNumber: "Số tài khoản", transferNote: "Nội dung chuyển khoản", mail: "Email hướng dẫn", subject: "Tiêu đề thư", greeting: "Lời chào", instructions: "Hướng dẫn tham dự",
  email: "Nhãn email", emailPlaceholder: "Gợi ý nhập email", emailHelp: "Mục đích sử dụng email", emailError: "Lỗi email không hợp lệ", submitting: "Nhãn đang gửi", submitError: "Lỗi gửi hồi đáp", emailSent: "Thông báo đã gửi email", emailUnavailable: "Thông báo chưa gửi được email", emailPending: "Thông báo email đang xử lý", previewMessage: "Thông báo bản xem trước", qrAlt: "Mô tả mã QR", bankLabel: "Nhãn ngân hàng", accountNameLabel: "Nhãn chủ tài khoản", accountNumberLabel: "Nhãn số tài khoản", transferNoteLabel: "Nhãn nội dung chuyển khoản", copy: "Nút sao chép", copyError: "Lỗi sao chép", emptyMessage: "Thông báo chưa có mã QR", safetyNote: "Lưu ý kiểm tra người nhận",
  // 2026-11-13: Noi dung cam on rieng cho khach khong the tham du.
  declinedTitle: "Tiêu đề khi khách vắng mặt", declinedMessage: "Lời cảm ơn khi khách vắng mặt",
  // 2026-11-13: Ten hien thi nguoi gui email, tach khoi dia chi SMTP.
  senderName: "Tên người gửi email",
  // Added 2026-11-13: responsive couple photos, shared love story and temporary RSVP disclosure.
  entranceAlt: "Mô tả ảnh mở màn", loveStory: "Chuyện chúng mình", subtitle: "Dòng tiếng Anh", temporaryNotice: "Lưu ý hồi đáp tạm thời",
  // Added 2026-11-13: dated family timelines, invitation letter and shared couple/location portraits.
  date: "Ngày diễn ra", letterTitle: "Tiêu đề lời mời", letterBody: "Nội dung lời mời", couplePortrait: "Ảnh chung cô dâu & chú rể", coupleAlt: "Mô tả ảnh chung", locationImage: "Ảnh cưới cạnh bản đồ", locationImageAlt: "Mô tả ảnh cạnh bản đồ",
  // Added 2026-11-13: address heading and countdown labels shared with the admin preview.
  locationTitle: "Tiêu đề khu vực địa chỉ", countdown: "Đếm ngược ngày cưới", days: "Nhãn ngày", hours: "Nhãn giờ", minutes: "Nhãn phút", seconds: "Nhãn giây",
  // Added 2026-11-13: separate the editable Google Maps iframe source from the directions link.
  mapEmbedUrl: "Link Google Maps nhúng",
  // Added 2026-11-13: editable greeting and thank-you copy for named invitation links.
  personalization: "Lời mời cá nhân hóa", inviteLabel: "Dòng kính mời khách", fallbackName: "Tên hiển thị khi không có tên khách", thankYou: "Lời cảm ơn · dùng {name} để chèn tên", genericThanks: "Lời cảm ơn khi không có tên khách",
  // Added 2026-11-13: shared party concept, palette and dress code for invitations and email.
  partyConcept: "Concept bữa tiệc", paletteLabel: "Nhãn concept", tones: "Tone màu (văn bản)", dressCodeLabel: "Nhãn trang phục", dressCode: "Trang phục",
  // Added 2026-11-14: per-family slideshow labels in the visual editor.
  heroSlides: "Ảnh hero dọc (mobile) · mỗi 2 giây",
  // Added 2026-11-14: select a separate landscape photo before choosing a family.
  entranceLandscape: "Ảnh mở đầu · ngang (desktop)",
  // Added 2026-11-14: separate multi-image desktop hero albums for both families.
  heroLandscapeSlides: "Ảnh hero ngang (desktop) · mỗi 2 giây",
  // Added 2026-11-18: edit the bride ceremony independently of the reception.
  ceremonyDateTime: "Ngày và giờ lễ thành hôn",
  // Added 2026-11-18: reception date is independent of both ceremony and legacy fallback.
  receptionDateTime: "Ngày và giờ mời cơm",
};

export function readPath(data, path) {
  return path.reduce((value, key) => !unsafe.has(String(key)) && value != null && Object.hasOwn(value, key) ? value[key] : undefined, data);
}

export function writePath(data, path, value) {
  if (!Array.isArray(path) || !path.length || path.some(key => unsafe.has(String(key)))) throw new Error("Đường dẫn không hợp lệ.");
  const parent = readPath(data, path.slice(0, -1));
  if (!parent || typeof parent !== "object" || !Object.hasOwn(parent, path.at(-1))) throw new Error("Trường không tồn tại.");
  parent[path.at(-1)] = value;
}

export function listConfig(path) {
  const key = path.join(".");
  // Added 2026-11-14: optional per-family hero slides, editable with the existing image library.
  if (isHeroPhotoList(path)) return { min: 0, max: 20, template: { src: "/images/wedding-demo.jpg", alt: "Ảnh bìa thiệp cưới", position: "center" } };
  if (key === "photos.story") return { min: 1, max: 4, template: { src: "/images/editorial-demo.jpg", alt: "Khoảnh khắc ngày cưới", position: "center" } };
  if (key === "photos.gallery") return { min: 1, max: 100, template: { src: "/images/wedding-demo.jpg", alt: "Khoảnh khắc ngày cưới", label: "" } };
  if (/^events\.(groom|bride)\.schedule$/.test(key)) return { min: 0, max: 32, template: { time: "09:00", title: "Hoạt động mới", detail: "", icon: "heart", date: "" } };
  return null;
}

export function isHeroPhotoList(path) {
  return /^photos\.(heroSlides|heroLandscapeSlides)\.(groom|bride)$/.test(path?.join(".") ?? "");
}

export function fieldKind(path, value) {
  const key = path.at(-1);
  if (typeof value === "boolean") return "toggle";
  if (typeof value === "number") return "number";
  if (["dateTime", "ceremonyDateTime", "receptionDateTime"].includes(key)) return "date";
  if (key === "date") return "day";
  if (key === "icon") return "icon";
  if (key === "portrait" || key === "bouquet" || key === "qrImage" || key === "locationImage" || path[0] === "photos" && ["hero", "roses", "couplePortrait", "src", "entranceLandscape"].includes(key)) return "image";
  if (["mapUrl", "mapEmbedUrl"].includes(key)) return "url";
  return "text";
}

export function editorDocuments(data) {
  const documents = [];
  function add(id, label, path) {
    const fields = [], lists = [];
    function walk(value, current, trail) {
      if (value && typeof value === "object") {
        const list = Array.isArray(value) && listConfig(current);
        if (list) lists.push({ path: current, label: trail.join(" / "), min: list.min, max: list.max });
        for (const [key, child] of Object.entries(value)) {
          if (key.startsWith("_")) continue;
          const fieldLabel = current.join(".") === "events.bride" && key === "dateTime" ? "Ngày và giờ cũ (fallback)" : labels[key] || (/^\d+$/.test(key) ? `Mục ${Number(key) + 1}` : key);
          walk(child, [...current, Array.isArray(value) ? Number(key) : key], [...trail, fieldLabel]);
        }
      } else fields.push({ path: current, key: String(current.at(-1)), label: trail.join(" / ") || label, kind: fieldKind(current, value), nullable: value === null || ["dateTime", "ceremonyDateTime", "receptionDateTime", "mapUrl", "mapEmbedUrl"].includes(current.at(-1)), value });
    }
    walk(readPath(data, path), path, []);
    documents.push({ id, label, path, fields, lists });
  }
  add("groom", "Chú rể", ["groom"]);
  add("bride", "Cô dâu", ["bride"]);
  add("event-groom", "Ngày cưới nhà trai", ["events", "groom"]);
  add("event-bride", "Ngày cưới nhà gái", ["events", "bride"]);
  add("photos", "Hình ảnh & album", ["photos"]);
  for (const key of Object.keys(data.content)) add(`content-${key}`, labels[key] || key, ["content", key]);
  add("metadata", "SEO & chia sẻ", ["metadata"]);
  add("experience", "Nhạc & chuyển động", ["experience"]);
  add("decoration", "Hoa trang trí", ["decoration"]);
  add("rsvp", "Lưu hồi đáp", ["rsvp"]);
  add("gift-groom", "Quà mừng nhà trai", ["gifts", "groom"]);
  add("gift-bride", "Quà mừng nhà gái", ["gifts", "bride"]);
  add("mail", "Email hướng dẫn", ["mail"]);
  documents.push({ id: "presentation", label: "Font chung & số", path: ["presentation"], fields: [], lists: [] });
  return documents;
}
