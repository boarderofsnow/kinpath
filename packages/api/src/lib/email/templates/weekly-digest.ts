export interface WeeklyDigestData {
  displayName: string;
  childName: string;
  // Pregnancy-specific (null if child is born)
  gestationalWeek: number | null;
  babySize: { object: string; emoji: string } | null;
  encouragement: string | null;
  weeksRemaining: number | null;
  // Body changes
  maternalBody: string | null;
  maternalTip: string | null;
  // Planning tips
  planningTips: { tip: string; category: string }[];
  // New resources
  newResources: { title: string; slug: string; summary: string }[];
  // Links
  dashboardUrl: string;
  settingsUrl: string;
}

export function buildWeeklyDigest(data: WeeklyDigestData): string {
  const isPregnant = data.gestationalWeek !== null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KinPath Weekly Update</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f0eeec;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b89f 0%, #0d9b8c 100%);
      color: white;
      padding: 24px 20px;
      text-align: center;
    }
    .header img {
      max-height: 48px;
      width: auto;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #333;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #10b89f;
      margin-bottom: 15px;
      border-bottom: 2px solid #10b89f;
      padding-bottom: 8px;
    }
    .pregnancy-progress {
      background-color: #f0f9f7;
      border-left: 4px solid #10b89f;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    .pregnancy-progress-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .pregnancy-emoji {
      font-size: 48px;
      flex-shrink: 0;
    }
    .pregnancy-details {
      flex-grow: 1;
    }
    .pregnancy-week {
      font-size: 20px;
      font-weight: 600;
      color: #10b89f;
      margin: 0;
    }
    .pregnancy-remaining {
      font-size: 14px;
      color: #666;
      margin: 4px 0 0 0;
    }
    .encouragement-box {
      background-color: #f0fdfb;
      border: 1px solid #97f8e1;
      padding: 12px;
      border-radius: 4px;
      margin-top: 12px;
      font-size: 14px;
      color: #0b776b;
      font-style: italic;
    }
    .maternal-section {
      background-color: #f8f8f8;
      border-left: 4px solid #10b89f;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 15px;
    }
    .maternal-change {
      font-size: 14px;
      margin-bottom: 8px;
      color: #333;
    }
    .maternal-tip {
      font-size: 14px;
      color: #666;
      margin-top: 10px;
      font-style: italic;
    }
    .tips-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .tips-list li {
      padding: 12px;
      margin-bottom: 10px;
      background-color: #f8f8f8;
      border-radius: 4px;
      border-left: 4px solid #10b89f;
      font-size: 14px;
    }
    .tip-category {
      display: inline-block;
      background-color: #e0f4f1;
      color: #10b89f;
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 3px;
      margin-right: 8px;
    }
    .resources-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .resources-list li {
      padding: 12px;
      margin-bottom: 10px;
      background-color: #f8f8f8;
      border-radius: 4px;
      border-left: 4px solid #10b89f;
    }
    .resource-title {
      font-size: 14px;
      font-weight: 600;
      color: #10b89f;
      margin: 0 0 4px 0;
    }
    .resource-summary {
      font-size: 13px;
      color: #666;
      margin: 0 0 8px 0;
    }
    .resource-link {
      font-size: 13px;
    }
    .resource-link a {
      color: #10b89f;
      text-decoration: none;
    }
    .resource-link a:hover {
      text-decoration: underline;
    }
    .cta-button {
      display: inline-block;
      background-color: #10b89f;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      margin-top: 10px;
    }
    .cta-button:hover {
      background-color: #0d9b8c;
    }
    .footer {
      background-color: #f0eeec;
      border-top: 1px solid #e0e0e0;
      padding: 20px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .footer-link {
      color: #10b89f;
      text-decoration: none;
    }
    .footer-link:hover {
      text-decoration: underline;
    }
    .disclaimer {
      font-size: 11px;
      color: #999;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e0e0e0;
    }
    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <img src="https://kinpath.family/kinpath-logo.png" alt="KinPath" style="max-height: 48px; width: auto;" />
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hi ${data.displayName},</p>

      <!-- Pregnancy Progress Section -->
      ${
        isPregnant && data.babySize
          ? `
        <div class="section">
          <h2 class="section-title">Your Pregnancy Progress</h2>
          <div class="pregnancy-progress">
            <div class="pregnancy-progress-content">
              <div class="pregnancy-emoji">${data.babySize.emoji}</div>
              <div class="pregnancy-details">
                <p class="pregnancy-week">Week ${data.gestationalWeek}</p>
                <p class="pregnancy-remaining">Your baby is about the size of a ${data.babySize.object}</p>
                ${data.weeksRemaining ? `<p class="pregnancy-remaining">${data.weeksRemaining} weeks to go</p>` : ""}
              </div>
            </div>
            ${data.encouragement ? `<div class="encouragement-box">"${data.encouragement}"</div>` : ""}
          </div>
        </div>
      `
          : ""
      }

      <!-- Maternal Changes Section -->
      ${
        isPregnant && (data.maternalBody || data.maternalTip)
          ? `
        <div class="section">
          <h2 class="section-title">This Week for You</h2>
          <div class="maternal-section">
            ${data.maternalBody ? `<p class="maternal-change"><strong>Body Changes:</strong> ${data.maternalBody}</p>` : ""}
            ${data.maternalTip ? `<p class="maternal-tip"><strong>Tip:</strong> ${data.maternalTip}</p>` : ""}
          </div>
        </div>
      `
          : ""
      }

      <!-- Planning Tips Section -->
      ${
        data.planningTips && data.planningTips.length > 0
          ? `
        <div class="section">
          <h2 class="section-title">Planning Tips</h2>
          <ul class="tips-list">
            ${data.planningTips.map((tip) => `
              <li>
                <span class="tip-category">${tip.category}</span>
                ${tip.tip}
              </li>
            `).join("")}
          </ul>
        </div>
      `
          : ""
      }

      <!-- New Resources Section -->
      ${
        data.newResources && data.newResources.length > 0
          ? `
        <div class="section">
          <h2 class="section-title">New Resources for You</h2>
          <ul class="resources-list">
            ${data.newResources.map((resource) => `
              <li>
                <p class="resource-title">${resource.title}</p>
                <p class="resource-summary">${resource.summary}</p>
                <p class="resource-link">
                  <a href="${data.dashboardUrl}/resources/${resource.slug}">Read more →</a>
                </p>
              </li>
            `).join("")}
          </ul>
        </div>
      `
          : ""
      }

      <!-- CTA Button -->
      <div style="text-align: center; margin-top: 30px;">
        <a href="${data.dashboardUrl}" class="cta-button">View Full Dashboard</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        Questions? <a href="${data.settingsUrl}" class="footer-link">Update your email preferences</a>
      </p>
      <div class="disclaimer">
        <p style="margin: 0;">
          This email contains general information and should not be considered medical advice.
          Always consult with your healthcare provider for personalized guidance.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
