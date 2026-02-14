export interface MilestoneAlertData {
  displayName: string;
  childName: string;
  gestationalWeek: number;
  milestoneName: string;
  encouragement: string;
  dashboardUrl: string;
  settingsUrl: string;
}

export function buildMilestoneAlert(data: MilestoneAlertData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KinPath Milestone Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9f9f9;
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
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 14px;
      opacity: 0.95;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #333;
    }
    .milestone-box {
      background: linear-gradient(135deg, #f0f9f7 0%, #e8f7f4 100%);
      border: 2px solid #10b89f;
      border-radius: 8px;
      padding: 25px;
      text-align: center;
      margin: 25px 0;
    }
    .milestone-emoji {
      font-size: 56px;
      margin-bottom: 15px;
      display: block;
    }
    .milestone-title {
      font-size: 24px;
      font-weight: 600;
      color: #10b89f;
      margin: 0 0 8px 0;
    }
    .milestone-week {
      font-size: 16px;
      color: #666;
      margin: 0 0 15px 0;
    }
    .milestone-description {
      font-size: 14px;
      color: #333;
      margin: 0;
    }
    .encouragement-box {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
      font-size: 15px;
      color: #856404;
      font-style: italic;
      text-align: center;
    }
    .cta-button {
      display: inline-block;
      background-color: #10b89f;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      margin-top: 20px;
    }
    .cta-button:hover {
      background-color: #0d9b8c;
    }
    .footer {
      background-color: #f8f8f8;
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
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>KinPath</h1>
      <p>Celebrating your milestones</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Hi ${data.displayName},</p>

      <p style="font-size: 15px; color: #333; margin-bottom: 10px;">
        We're thrilled to celebrate a special moment in your journey with ${data.childName}!
      </p>

      <!-- Milestone Box -->
      <div class="milestone-box">
        <span class="milestone-emoji">🎉</span>
        <h2 class="milestone-title">${data.milestoneName}</h2>
        <p class="milestone-week">Week ${data.gestationalWeek}</p>
        <p class="milestone-description">
          This is an important moment in your pregnancy journey. Your body and baby are experiencing incredible changes.
        </p>
      </div>

      <!-- Encouragement -->
      <div class="encouragement-box">
        "${data.encouragement}"
      </div>

      <!-- CTA -->
      <div style="text-align: center;">
        <a href="${data.dashboardUrl}" class="cta-button">Learn More About This Milestone</a>
      </div>

      <p style="font-size: 14px; color: #666; margin-top: 25px; text-align: center;">
        This is one of many milestones you'll reach. We're here to support you every step of the way.
      </p>
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
