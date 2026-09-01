import { PatientWithRisk } from "../types";

/**
 * Generate and trigger download for an individual Patient Risk Report PDF
 */
export function downloadPatientPDF(patient: PatientWithRisk) {
  const { risk } = patient;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download/print the PDF report.");
    return;
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const tierBgColor =
    risk.tier === "High"
      ? "#fee2e2"
      : risk.tier === "Medium"
      ? "#fef3c7"
      : risk.tier === "Low"
      ? "#ccfbf1"
      : "#f3f4f6";

  const tierTextColor =
    risk.tier === "High"
      ? "#991b1b"
      : risk.tier === "Medium"
      ? "#92400e"
      : risk.tier === "Low"
      ? "#115e59"
      : "#374151";

  const factorRowsHtml = risk.reasons
    .map(
      (r) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${r.label}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: ${
          r.points > 0 ? "#dc2626" : "#16a34a"
        };">
          +${r.points} pts (max ${r.maxPoints})
        </td>
      </tr>
    `
    )
    .join("");

  const actionsHtml = risk.suggestedActions
    .map(
      (a) => `
      <li style="margin-bottom: 6px; color: #1f2937; font-size: 14px;">
        <strong>→</strong> ${a}
      </li>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Patient Risk Report - ${patient.name} (${patient.id})</title>
        <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 20px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
          .badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 14px; background: ${tierBgColor}; color: ${tierTextColor}; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
          .stat-value { font-size: 18px; font-weight: 700; color: #0f172a; }
          .stat-label { font-size: 12px; color: #64748b; margin-top: 2px; }
          .section-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #0d9488; padding-left: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
          th { background: #f1f5f9; text-align: left; padding: 10px; font-size: 13px; color: #475569; font-weight: 700; border-bottom: 2px solid #cbd5e1; }
          .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Patient Follow-up Risk Report</h1>
            <div class="subtitle">CareCompass Clinical Risk Intelligence Platform · Generated on ${dateStr}</div>
          </div>
          <div style="text-align: right;">
            <div class="badge">${risk.tier} Risk Tier</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 6px;">ID: <strong>${patient.id}</strong></div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0f172a;">${patient.name}</h2>
          <div style="color: #475569; font-size: 14px;">${patient.email ? `Email: ${patient.email} · ` : ""}Age: ${patient.age} · Distance: ${patient.distanceKm} km</div>
        </div>

        <div class="grid">
          <div class="stat-card">
            <div class="stat-value">${risk.score === null ? "—" : risk.score + " / 100"}</div>
            <div class="stat-label">Calculated Risk Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${patient.missedAppointmentCount} / ${patient.totalAppointmentCount}</div>
            <div class="stat-label">Appointments Missed</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${patient.daysSinceLastVisit} days</div>
            <div class="stat-label">Days Since Last Visit</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${patient.expectedFrequencyDays} days</div>
            <div class="stat-label">Target Visit Frequency</div>
          </div>
        </div>

        <div class="section-title">Transparent 6-Factor Risk Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Risk Factor Rule</th>
              <th style="text-align: right;">Points Added</th>
            </tr>
          </thead>
          <tbody>
            ${factorRowsHtml}
          </tbody>
        </table>

        <div class="section-title">Suggested Clinical Next Actions</div>
        <ul style="padding-left: 20px; margin: 0;">
          ${actionsHtml}
        </ul>

        <div class="footer">
          This document is generated by CareCompass Patient Follow-up Risk Predictor. Rules-based engine · 100% Explainable.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Generate and trigger download for Bulk Patients Risk Summary PDF Report
 */
export function downloadBulkPatientsPDF(patients: PatientWithRisk[], title = "Bulk Patient Risk Report") {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to download/print the PDF report.");
    return;
  }

  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const highCount = patients.filter((p) => p.risk.tier === "High").length;
  const medCount = patients.filter((p) => p.risk.tier === "Medium").length;
  const lowCount = patients.filter((p) => p.risk.tier === "Low").length;
  const coldCount = patients.filter((p) => p.risk.tier === "Insufficient history").length;

  const rowsHtml = patients
    .map(
      (p, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${p.name}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 12px; color: #64748b;">${p.id}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">${p.age}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">${p.distanceKm} km</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">${p.missedAppointmentCount}/${p.totalAppointmentCount}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">${p.daysSinceLastVisit}d</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb; font-weight: 700;">${p.risk.score ?? "—"}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; background: ${
            p.risk.tier === "High"
              ? "#fee2e2; color: #991b1b"
              : p.risk.tier === "Medium"
              ? "#fef3c7; color: #92400e"
              : p.risk.tier === "Low"
              ? "#ccfbf1; color: #115e59"
              : "#f3f4f6; color: #374151"
          };">
            ${p.risk.tier}
          </span>
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${dateStr}</title>
        <style>
          @page { size: A4 landscape; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 20px; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
          .stats-strip { display: flex; gap: 16px; margin-bottom: 20px; }
          .stat-pill { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
          .stat-val { font-size: 20px; font-weight: 800; }
          .stat-lbl { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
          th { background: #0f172a; color: #ffffff; text-align: left; padding: 10px; font-weight: 700; font-size: 12px; text-transform: uppercase; }
          .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">${title}</h1>
            <div class="subtitle">CareCompass Patient Risk Predictor · Generated on ${dateStr}</div>
          </div>
          <div style="font-size: 13px; color: #64748b; text-align: right;">
            Total Records: <strong>${patients.length}</strong>
          </div>
        </div>

        <div class="stats-strip">
          <div class="stat-pill">
            <div class="stat-val" style="color: #dc2626;">${highCount}</div>
            <div class="stat-lbl">High Risk</div>
          </div>
          <div class="stat-pill">
            <div class="stat-val" style="color: #d97706;">${medCount}</div>
            <div class="stat-lbl">Medium Risk</div>
          </div>
          <div class="stat-pill">
            <div class="stat-val" style="color: #0d9488;">${lowCount}</div>
            <div class="stat-lbl">Low Risk</div>
          </div>
          <div class="stat-pill">
            <div class="stat-val" style="color: #64748b;">${coldCount}</div>
            <div class="stat-lbl">Insufficient History</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Patient Name</th>
              <th>Patient ID</th>
              <th>Age</th>
              <th>Distance</th>
              <th>Missed / Total</th>
              <th>Last Visit</th>
              <th>Risk Score</th>
              <th>Tier</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          CareCompass Clinical Risk Intelligence System · Confidential Patient Report
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
