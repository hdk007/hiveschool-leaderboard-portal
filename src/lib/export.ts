import type { Student } from "@/types/database";

export type ExportStudent = Student & { teams?: { name: string } | null };

/** Trigger a client-side file download from a string blob. */
function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const COLUMNS = [
  { key: "rank", label: "Rank" },
  { key: "name", label: "Student Name" },
  { key: "team_name", label: "Team Name" },
  { key: "final_score", label: "Score" },
  { key: "assignments_completed", label: "Assignments" },
  { key: "attendance_percentage", label: "Attendance %" },
  { key: "growth_percentage", label: "Growth %" },
];

export function exportLeaderboardCSV(students: ExportStudent[], filename = "hiveschool-leaderboard.csv") {
  const header = COLUMNS.map((c) => c.label).join(",");
  const rows = students.map((s) =>
    COLUMNS.map((c) => {
      let val = "";
      if (c.key === "team_name") {
        val = s.teams?.name ?? "No Team";
      } else {
        const raw = s[c.key as keyof Student];
        val = raw === null || raw === undefined ? "" : String(raw);
      }
      // Escape values containing commas/quotes.
      return /[",\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(",")
  );
  download(filename, [header, ...rows].join("\n"), "text/csv;charset=utf-8;");
}

export async function exportLeaderboardPDF(students: ExportStudent[], filename = "hiveschool-leaderboard.pdf") {
  // Dynamic import keeps jsPDF out of the initial bundle.
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(18);
  doc.setTextColor("#0F172A");
  doc.text("HiveSchool — Leaderboard", 14, 18);
  doc.setFontSize(10);
  doc.setTextColor("#6B7280");
  doc.text(`Generated ${new Date().toLocaleString()}  ·  ${students.length} students`, 14, 25);

  autoTable(doc, {
    startY: 30,
    head: [COLUMNS.map((c) => c.label)],
    body: students.map((s) =>
      COLUMNS.map((c) => {
        if (c.key === "team_name") {
          return s.teams?.name ?? "No Team";
        }
        const raw = s[c.key as keyof Student];
        return raw === null || raw === undefined ? "" : String(raw);
      })
    ),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: "grid",
  });

  doc.save(filename);
}
