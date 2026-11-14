// Added 2026-11-13: shared local fonts and removable invitation blocks for public rendering and live admin previews.
// Updated 2026-11-14: direct block font editing inside content modals, dedicated number font config.
export const fontOptions = [
  { id: "quicksand", label: "Quicksand (Không chân nhẹ nhàng)", family: "var(--font-quicksand), sans-serif" },
  { id: "be-vietnam-pro", label: "Be Vietnam Pro (Tiếng Việt chuẩn)", family: "var(--font-be-vietnam-pro), sans-serif" },
  { id: "cormorant-garamond", label: "Cormorant Garamond (Có chân thanh lịch)", family: "var(--font-cormorant-garamond), serif" },
  { id: "lora", label: "Lora (Có chân trang trọng)", family: "var(--font-lora), serif" },
  { id: "great-vibes", label: "Great Vibes (Viết tay lãng mạn)", family: "var(--font-great-vibes), cursive" },
  { id: "charmonman", label: "Charmonman (Viết tay nghệ thuật)", family: "var(--font-charmonman), cursive" },
  { id: "tahoma", label: "Tahoma (Chữ thường / Số chuẩn)", family: "Tahoma, Verdana, sans-serif" },
];

export const blockDefinitions = [
  { id: "hero", label: "Ảnh bìa & tên cô dâu chú rể" },
  { id: "invitation", label: "Lời mời & ngày cưới" },
  { id: "loveStory", label: "Chuyện chúng mình" },
  { id: "partner", label: "Giới thiệu cô dâu chú rể" },
  { id: "schedule", label: "Lịch trình" },
  { id: "story", label: "Khoảnh khắc" },
  { id: "album", label: "Album ảnh" },
  { id: "reply", label: "Hồi đáp & quà mừng" },
  { id: "location", label: "Địa chỉ & bản đồ" },
  { id: "footer", label: "Lời cảm ơn" },
];

export function fontFamily(id) {
  return fontOptions.find(font => font.id === id)?.family;
}

export function resolveBlockId(documentId, selectedPath) {
  if (Array.isArray(selectedPath) && selectedPath.length > 0) {
    const [first, second] = selectedPath;
    if (first === "experience" && second === "hero") return "hero";
    if (first === "content" && typeof second === "string") {
      if (second === "invitation") return "invitation";
      if (second === "loveStory") return "loveStory";
      if (second === "partner") return "partner";
      if (second === "schedule") return "schedule";
      if (second === "story") return "story";
      if (second === "album" || second === "gallery") return "album";
      if (second === "reply" || second === "rsvp" || second === "gift") return "reply";
      if (second === "footer") return "footer";
      if (second === "entrance") return "hero";
    }
    if (first === "groom" || first === "bride") return "partner";
    if (first === "events") {
      if (selectedPath[2] === "schedule") return "schedule";
      const field = selectedPath.at(-1);
      if (["address", "venue", "mapUrl", "mapEmbedUrl", "locationImage"].includes(String(field))) return "location";
      return "schedule";
    }
    if (first === "photos") {
      if (second === "story") return "story";
      if (second === "gallery") return "album";
      if (second === "couplePortrait" || second === "coupleAlt") return "partner";
      if (second === "hero" || second === "heroSlides" || second === "heroLandscapeSlides" || second === "roses" || second === "entranceLandscape") return "hero";
    }
    if (first === "gifts") return "reply";
  }

  const map = {
    "content-invitation": "invitation",
    "content-loveStory": "loveStory",
    "content-partner": "partner",
    "content-schedule": "schedule",
    "content-story": "story",
    "content-album": "album",
    "content-gallery": "album",
    "content-reply": "reply",
    "content-rsvp": "reply",
    "content-gift": "reply",
    "content-footer": "footer",
    "content-entrance": "hero",
    "photos": "album",
    "groom": "partner",
    "bride": "partner",
    "event-groom": "schedule",
    "event-bride": "schedule",
    "gift-groom": "reply",
    "gift-bride": "reply",
  };
  return map[documentId] || null;
}

export function withPresentation(data) {
  const content = { ...data };
  delete content.partyConcept;
  const current = data.presentation ?? {};
  return {
    ...content,
    presentation: {
      ...current,
      typography: {
        body: "quicksand",
        display: "cormorant-garamond",
        script: "great-vibes",
        numbers: "tahoma",
        ...current.typography,
      },
      blocks: {
        ...current.blocks,
        ...Object.fromEntries(blockDefinitions.map(block => [block.id, { visible: true, font: "", ...current.blocks?.[block.id] }])),
      },
    },
    // Added 2026-11-14: migrate per-family hero lists without overwriting the original cover photo.
    photos: {
      ...data.photos,
      heroSlides: { groom: [], bride: [], ...data.photos?.heroSlides },
      // Added 2026-11-14: separate desktop entrance photo, preserving legacy content.
      entranceLandscape: data.photos?.entranceLandscape || data.photos?.roses || "",
      // Added 2026-11-14: desktop hero albums, without replacing existing portrait albums.
      heroLandscapeSlides: { groom: [], bride: [], ...data.photos?.heroLandscapeSlides },
    },
  };
}

export function typographyStyle(typography) {
  const body = fontFamily(typography.body);
  const display = fontFamily(typography.display);
  const script = fontFamily(typography.script);
  const numbers = fontFamily(typography.numbers || "tahoma");
  return {
    "--font-body": body,
    "--font-display": display,
    "--font-script": script,
    "--font-names": script,
    "--font-numbers": numbers,
    fontFamily: body,
  };
}
