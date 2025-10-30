import httpx
from typing import Optional
from loguru import logger
from config.settings import get_settings

settings = get_settings()


class EmailService:
    def __init__(self):
        self.api_key = settings.RESEND_API_KEY
        self.base_url = "https://api.resend.com"
        self.from_email = "noreply@whop-lead-engine.com"  # Configure your domain
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        content: str, 
        from_email: Optional[str] = None
    ) -> Optional[str]:
        """Send email using Resend API"""
        
        if not self.api_key:
            logger.warning("Resend API key not configured - email not sent")
            return self._simulate_email_send(to_email, subject)
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": from_email or self.from_email,
                "to": [to_email],
                "subject": subject,
                "html": self._format_html_email(content),
                "text": content
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/emails",
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    message_id = result.get("id")
                    logger.info(f"Email sent successfully to {to_email}: {message_id}")
                    return message_id
                else:
                    logger.error(f"Failed to send email to {to_email}: {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error sending email to {to_email}: {e}")
            return None
    
    async def send_bulk_emails(self, emails: list) -> dict:
        """Send multiple emails efficiently"""
        
        results = {
            "sent": 0,
            "failed": 0,
            "message_ids": []
        }
        
        for email_data in emails:
            message_id = await self.send_email(
                to_email=email_data["to_email"],
                subject=email_data["subject"],
                content=email_data["content"],
                from_email=email_data.get("from_email")
            )
            
            if message_id:
                results["sent"] += 1
                results["message_ids"].append(message_id)
            else:
                results["failed"] += 1
        
        logger.info(f"Bulk email results: {results['sent']} sent, {results['failed']} failed")
        return results
    
    def _format_html_email(self, content: str) -> str:
        """Format plain text content as HTML email"""
        
        # Convert line breaks to HTML
        html_content = content.replace('\n', '<br>')
        
        # Wrap in basic HTML template
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Whop Lead Engine</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .footer {{
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    font-size: 12px;
                    color: #666;
                }}
            </style>
        </head>
        <body>
            <div>
                {html_content}
            </div>
            <div class="footer">
                <p>This message was sent via Whop Lead Engine</p>
                <p>If you don't want to receive these emails, please reply with "UNSUBSCRIBE"</p>
            </div>
        </body>
        </html>
        """
        
        return html_template
    
    def _simulate_email_send(self, to_email: str, subject: str) -> str:
        """Simulate email sending for development/testing"""
        
        # Generate a fake message ID
        import uuid
        message_id = f"sim_{uuid.uuid4().hex[:12]}"
        
        logger.info(f"[SIMULATED] Email to {to_email}: {subject} (ID: {message_id})")
        
        return message_id


class EmailTemplates:
    """Pre-built email templates"""
    
    @staticmethod
    def welcome_email(community_name: str, user_name: str = "there") -> dict:
        return {
            "subject": f"Welcome to {community_name}!",
            "content": f"""
Hi {user_name},

Welcome to {community_name}! We're excited to have you join our community.

Here's what you can expect:
• Access to exclusive content and discussions
• Direct interaction with community members
• Regular updates and valuable insights

To get started, log in to your account and explore the community.

If you have any questions, don't hesitate to reach out.

Best regards,
The {community_name} Team
            """.strip()
        }
    
    @staticmethod
    def lead_outreach_template(community_name: str, lead_name: str = "there") -> dict:
        return {
            "subject": f"Invitation to join {community_name}",
            "content": f"""
Hi {lead_name},

I noticed your interest in [RELEVANT_TOPIC] and thought you might find value in {community_name}.

We're a community of [COMMUNITY_DESCRIPTION] where members:
• [BENEFIT_1]
• [BENEFIT_2]
• [BENEFIT_3]

I'd love to invite you to check it out. We're currently accepting new members and I think you'd be a great fit.

[COMMUNITY_LINK]

Let me know if you have any questions!

Best,
[SENDER_NAME]
            """.strip()
        }
    
    @staticmethod
    def retention_reminder(community_name: str, member_name: str = "there") -> dict:
        return {
            "subject": f"We miss you in {community_name}!",
            "content": f"""
Hi {member_name},

I noticed you haven't been active in {community_name} lately, and wanted to check in.

You might have missed some great discussions and content that I think you'd find valuable:
• [RECENT_HIGHLIGHT_1]
• [RECENT_HIGHLIGHT_2]
• [RECENT_HIGHLIGHT_3]

The community has been growing and there are some exciting new features coming soon.

Hope to see you back soon!

Best,
The {community_name} Team
            """.strip()
        }
    
    @staticmethod
    def retention_coupon(community_name: str, member_name: str = "there", discount: str = "special") -> dict:
        return {
            "subject": f"Special offer for {community_name} members",
            "content": f"""
Hi {member_name},

We've missed you in {community_name} and wanted to reach out with a special offer.

As a valued member, you're eligible for a {discount} discount on your next renewal.

This offer is valid for the next 7 days and is our way of saying thank you for being part of our community.

[REDEEM_LINK]

Hope to see you back soon!

Best,
The {community_name} Team
            """.strip()
        }