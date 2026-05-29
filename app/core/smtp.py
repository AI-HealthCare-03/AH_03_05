from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import Config

config = Config()


async def send_email(to: str, subject: str, body: str) -> None:
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{config.SMTP_FROM_NAME} <{config.SMTP_USER}>"
    message["To"] = to
    message.attach(MIMEText(body, "html"))

    await aiosmtplib.send(
        message,
        hostname=config.SMTP_HOST,
        port=config.SMTP_PORT,
        username=config.SMTP_USER,
        password=config.SMTP_PASSWORD,
        start_tls=True,
    )
