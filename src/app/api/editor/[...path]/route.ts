function handle() {
  return Response.json({ localOnly: true, error: "Chỉnh sửa và upload chỉ khả dụng trên máy local. Lưu vào public rồi commit/push để cập nhật thiệp." }, { status: 403, headers: { "Cache-Control": "no-store" } });
}

export { handle as GET, handle as POST, handle as PUT };
