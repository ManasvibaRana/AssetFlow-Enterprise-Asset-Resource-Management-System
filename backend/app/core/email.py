import smtplib
import ssl
from email.message import EmailMessage

from .config import SMTP_FROM, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER


def send_email(to: str, subject: str, html: str, text: str | None = None) -> bool:
    """Send an email via SMTP. Returns True on success, False otherwise.
    Never raises — callers treat email as best-effort."""
    if not SMTP_HOST or not SMTP_USER:
        print("[email] SMTP not configured; skipping send to", to)
        return False

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to
    msg.set_content(text or "This message requires an HTML-capable email client.")
    msg.add_alternative(html, subtype="html")

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=20) as server:
            server.login(SMTP_USER, SMTP_PASSWORD.replace(" ", ""))
            server.send_message(msg)
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[email] failed to send to {to}: {exc}")
        return False


# ---------- Branded templates ----------

def _layout(heading: str, body_html: str, button_text: str | None = None, button_url: str | None = None) -> str:
    button = ""
    if button_text and button_url:
        button = (
            f'<a href="{button_url}" style="display:inline-block;background:#0F172A;color:#ffffff;'
            f'text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;margin-top:8px">'
            f"{button_text}</a>"
        )
    return f"""\
<div style="background:#f1f5f9;padding:32px 0;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1a2030">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
    <div style="background:#0F172A;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:700">
      <span style="color:#10b981">■</span>&nbsp;AssetFlow
    </div>
    <div style="padding:28px">
      <h1 style="font-size:20px;margin:0 0 12px;color:#0F172A">{heading}</h1>
      <div style="font-size:14px;line-height:1.6;color:#45474c">{body_html}</div>
      <div style="margin-top:20px">{button}</div>
    </div>
    <div style="padding:16px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#8a94a4">
      AssetFlow — Enterprise Asset &amp; Resource Management. This is an automated message.
    </div>
  </div>
</div>"""


def send_password_reset(to: str, name: str, reset_url: str) -> bool:
    html = _layout(
        "Reset your password",
        f"Hi {name or 'there'},<br/><br/>We received a request to reset your AssetFlow password. "
        "Click the button below to choose a new one. This link expires in 30 minutes.<br/><br/>"
        "If you didn't request this, you can safely ignore this email.",
        "Reset password",
        reset_url,
    )
    text = f"Reset your AssetFlow password (expires in 30 min): {reset_url}"
    return send_email(to, "Reset your AssetFlow password", html, text)


def send_welcome(to: str, name: str, login_url: str) -> bool:
    html = _layout(
        "Welcome to AssetFlow",
        f"Hi {name or 'there'},<br/><br/>Your AssetFlow account is ready. You can now sign in to view assets "
        "assigned to you, book shared resources, and raise requests.<br/><br/>"
        "An administrator can grant you additional roles from the Employee Directory.",
        "Open AssetFlow",
        login_url,
    )
    text = f"Welcome to AssetFlow. Sign in: {login_url}"
    return send_email(to, "Welcome to AssetFlow", html, text)


def send_account_invite(to: str, name: str, temp_password: str, login_url: str) -> bool:
    html = _layout(
        "Your AssetFlow account",
        f"Hi {name or 'there'},<br/><br/>An administrator created an AssetFlow account for you. "
        f"Sign in with your email and this temporary password:<br/><br/>"
        f'<span style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;'
        f'padding:8px 12px;font-family:Consolas,monospace;font-size:14px;color:#0F172A">{temp_password}</span>'
        "<br/><br/>Please change it after your first sign-in from your profile.",
        "Sign in",
        login_url,
    )
    text = f"An AssetFlow account was created for you. Temp password: {temp_password}. Sign in: {login_url}"
    return send_email(to, "Your AssetFlow account is ready", html, text)
