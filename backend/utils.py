from functools import wraps
from django.db.models import QuerySet

from django.contrib.auth.models import User, AnonymousUser
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

from webserivce.settings import TEMPORARY

import random
import string
import os

import logging

logger = logging.getLogger()


def randomString():
    return ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(10))


def getpathforUser(username):
    path = TEMPORARY + "/" + username
    if not os.path.exists(path):
        os.makedirs(path)

    return path


def user_directory_path(instance, filename):
    if hasattr(instance, 'user'):
        return '{0}/{1}_{2}'.format(instance.user.username, randomString(), filename)
    return '{0}_{1}'.format(randomString(), filename)


def send_message(channel_name, message):
    async_to_sync(get_channel_layer().send)(channel_name, {
        "type": "sendData",
        "message": message.get("message"),
        "type_msg": message.get('type_msg', "toast"),
        "status": message["status"],
        "data": message.get("data", None)
    })


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def get_user_from_token(token_key):
    user = AnonymousUser()
    try:
        token_obj = AccessToken(token_key)
        user_id = token_obj['user_id']
        user = User.objects.get(id=user_id)
    except Exception as e:
        logger.info(str(e))
        logger.info("Token Error")

    return user


def paginate(func):
    @wraps(func)
    def inner(self, *args, **kwargs):
        queryset = func(self, *args, **kwargs)
        assert isinstance(queryset, (list, QuerySet)), "apply_pagination expects a List or a QuerySet"

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    return inner
