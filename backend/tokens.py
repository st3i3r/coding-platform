from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import six
from django.utils.crypto import constant_time_compare, salted_hmac
from django.utils.http import base36_to_int, int_to_base36
from django.conf import settings

from datetime import date

import logging
logger = logging.getLogger()

class AccountActivationTokenGenerator(PasswordResetTokenGenerator):
	def _make_hash_value(self, user, timestamp):
		return (
			six.text_type(user.pk) + six.text_type(timestamp) + six.text_type(user.is_active)
		)

account_activation_token = AccountActivationTokenGenerator()

class AccountPasswordresetTokenGenerator(PasswordResetTokenGenerator):
	def _make_hash_value(self, user, timestamp):
		# Ensure results are consistent across DB backends
		login_timestamp = '' if user.last_login is None else user.last_login.replace(microsecond=0, tzinfo=None)
		return (
			six.text_type(user.pk) + user.password +
			six.text_type(login_timestamp) + six.text_type(timestamp)
		)

account_password_reset_token = AccountPasswordresetTokenGenerator()
