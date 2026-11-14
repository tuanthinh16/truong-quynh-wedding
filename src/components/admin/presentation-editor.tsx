"use client";

import { fontFamily, fontOptions } from "@/lib/presentation.mjs";
import type { EditorPath, FieldValue, WeddingData } from "@/lib/editor-types";

export function PresentationEditor({ data, disabled, change }: { data: WeddingData; disabled: boolean; change: (path: EditorPath, value: FieldValue) => void }) {
  const typography = data.presentation.typography;
  return (
    <div className="ed-presentation">
      <p className="ed-config-help">
        Cấu hình các font dùng chung toàn thiệp và font hiển thị số. Font riêng của từng thành phần (như Lời mời, Chuyện chúng mình, Cô dâu chú rể, Album, v.v...) được chỉnh sửa trực tiếp ngay trong modal nội dung của phần đó.
      </p>

      <h3>Font chữ số (Ngày, giờ, lịch, đếm ngược)</h3>
      <section className="ed-field">
        <label htmlFor="font-numbers">Font hiển thị số</label>
        <select
          id="font-numbers"
          disabled={disabled}
          value={typography.numbers || "tahoma"}
          onChange={event => change(["presentation", "typography", "numbers"], event.target.value)}
        >
          {fontOptions.map(font => (
            <option key={font.id} value={font.id}>{font.label}</option>
          ))}
        </select>
        <p className="ed-font-sample" style={{ fontFamily: fontFamily(typography.numbers || "tahoma") }}>
          0123456789 · 09:00 · 15/11/2026 · 14 ngày 08 giờ
        </p>
      </section>

      <h3>Font dùng chung toàn trang</h3>
      {([
        ["body", "Font nội dung chung (Body)"],
        ["display", "Font tiêu đề chung (Display)"],
        ["script", "Font tên & chữ viết tay (Script)"],
      ] as const).map(([key, label]) => (
        <section className="ed-field" key={key}>
          <label htmlFor={`font-${key}`}>{label}</label>
          <select
            id={`font-${key}`}
            disabled={disabled}
            value={typography[key]}
            onChange={event => change(["presentation", "typography", key], event.target.value)}
          >
            {fontOptions.map(font => (
              <option key={font.id} value={font.id}>{font.label}</option>
            ))}
          </select>
          <p className="ed-font-sample" style={{ fontFamily: fontFamily(typography[key]) }}>
            {key === "script" ? "Xuân Trường & Thúy Quỳnh" : key === "display" ? "Lời Mời Trân Trọng · Save The Date" : "Hôn lễ được tổ chức với sự hiện diện của hai bên gia đình."}
          </p>
        </section>
      ))}
    </div>
  );
}
