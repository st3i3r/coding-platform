from channels.auth import AuthMiddlewareStack
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import AnonymousUser
from backend.utils import get_user_from_token

import logging

logger = logging.getLogger()


class TokenAuthMiddleware:
	"""
	Token authorization middleware for Django Channels 2
	"""

	def __init__(self, inner):
		self.inner = inner

	def __call__(self, scope):
		try:
			token_key = (dict((x.split('=') for x in scope['query_string'].decode().split("&")))).get('token', None)
			logger.info(token_key)
		except ValueError:
			token_key = None
				
		scope['user'] = AnonymousUser() if token_key is None else get_user_from_token(token_key)	
		logger.info(f"JWT Authentication: {scope['user']}")
		return self.inner(scope)
		

TokenAuthMiddlewareStack = lambda inner: TokenAuthMiddleware(AuthMiddlewareStack(inner))
