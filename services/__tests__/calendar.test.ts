import { generateICS } from "../calendar";

describe("Calendar Service", () => {
  it("generates valid RFC 5545 iCalendar content", () => {
    const start = new Date("2026-11-20T10:00:00Z");
    const end = new Date("2026-11-20T11:30:00Z");

    const ics = generateICS({
      title: "Optimal Outdoor Window (AQI 78)",
      description: "Safest window for errands and school run. Air quality is lowest PM2.5.",
      location: "Delhi, India",
      startDate: start,
      endDate: end,
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20261120T100000Z");
    expect(ics).toContain("DTEND:20261120T113000Z");
    expect(ics).toContain("SUMMARY:Optimal Outdoor Window (AQI 78)");
    expect(ics).toContain("LOCATION:Delhi\\, India");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });
});
