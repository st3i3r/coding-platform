from celery import task
from celery.result import AsyncResult
from django.conf import settings
import json
import os
from discord_webhook import DiscordWebhook
import requests
import logging

logger = logging.getLogger()

@task(name="Send_notify_to_Discord")
def sendNotifyToDiscord(message):
    if settings.ENABLE_PROXY == False:
        logger.info("Could not sent message. Proxy disabled !!!")
        return
    logger.info("Sent message to Discord")
    webhook = DiscordWebhook(url=settings.DISCORD_WEBHOOK, content=message)
    webhook.execute()

@task(name="Send_message_to_Discord_by_request")
def sendNotifyToDiscordByRequest(message):
    if settings.ENABLE_PROXY == False:
        logger.info("Could not sent message. Proxy disabled !!!")
        return
    logger.info("Sent message to Discord by request")
    url = settings.DISCORD_WEBHOOK
    data = {}
    data["content"] = message
    data["username"] = "AT contest"

    data["embeds"] = []
    embed = {}
    embed["description"] = "text in embed"
    embed["title"] = "embed title"
    data["embeds"].append(embed)

    result = requests.post(url, data=json.dumps(data), headers={"Content-Type": "application/json"})

    try:
        result.raise_for_status()
    except requests.exceptions.HTTPError as err:
        logger.info("%s" % (err))
    else:
        logger.info("Payload delivered successfully, code %s " % (result.status_code))
