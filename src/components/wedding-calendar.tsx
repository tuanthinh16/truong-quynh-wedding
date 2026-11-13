"use client";

import Icon from "./icon";
import { useWedding } from "./wedding-content";

export default function WeddingCalendar({ date }: { date: string }) {
  const wedding = useWedding();
  const copy = wedding.content.calendar;
  const [year, month, selectedDay] = date.split("-").map(Number);
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => {
    const day = index - offset + 1;
    return day > 0 && day <= days ? day : null;
  });

  return (
    <div className="wedding-calendar">
      <div className="calendar-heading"><span>{copy.heading}</span><p>{copy.month} {String(month).padStart(2, "0")} / {year}</p></div>
      <table aria-label={copy.label.replace("{month}", String(month)).replace("{year}", String(year)).replace("{day}", String(selectedDay))}>
        <thead><tr>{copy.weekdays.map(day => <th key={day} scope="col">{day}</th>)}</tr></thead>
        <tbody>{Array.from({ length: cells.length / 7 }, (_, week) => <tr key={week}>{cells.slice(week * 7, week * 7 + 7).map((day, index) => <td key={index}>{day && <span className={day === selectedDay ? "calendar-selected" : ""} aria-label={day === selectedDay ? copy.selected.replace("{day}", String(day)) : undefined}>{day === selectedDay && <Icon name="heart" size={40} />}{day}</span>}</td>)}</tr>)}</tbody>
      </table>
      <p className="calendar-note"><span />{copy.note}<span /></p>
    </div>
  );
}
