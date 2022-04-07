from time import sleep
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from ldap3 import Server, Connection

import logging
logger = logging.getLogger()

class LdapAuth(object):
    """LDAP authenticator."""
    def __init__(self, host, port, use_ssl=False):
        """Init object and set ldap parameters from settings."""
        self.server_address = host
        self.server_port = port
        self.use_ssl = use_ssl

    def authenticate(self, user, password):
        """
        Check if user with the password exists in the LDAP.

        Args:
            user:
            password:

        Returns:

        """
        me = None
        got_response = False
        trials = 0

        while trials < 3 and got_response is False:
            try:
                server = Server(self.server_address, port=self.server_port, use_ssl=self.use_ssl)
                conn = Connection(server, user=user, password=password, auto_bind=True)
                me = conn.extend.standard.who_am_i()
                got_response = True
            except Exception as e:
                logger.info("Username=%s -- Retry=%d -- Impossible to login on LDAP, reason=%s" % (user, trials, e))
                trials += 1
                sleep(0.2)
        return me

class GameloftLdapBackend(ModelBackend):
    """
    Auth backend that check password in the LDAP and DB.

    User should exists in the DB. First check LDAP directory for provided user/password,
    if user wasnt found, check password in DB.
    """
    def __init__(self):
        """Constructor."""
        ldap_server = 'dad-dc01.gameloft.org'
        ldap_port = 389
        ldap_use_ssl = False
        if ldap_server is not None and ldap_port is not None:
            self.ldap_auth = LdapAuth(ldap_server, ldap_port, ldap_use_ssl)
        else:
            self.ldap_auth = None
        self.default_email_domain = 'gameloft.com'

    def user_can_authenticate(self, user):
        """
        Reject users with is_active=False. Custom user models that don't have
        that attribute are allowed.
        """
        whitelist = ['admin','nhungocbui4','hdduy110697','nguyenvducminh','vanlinhnguyenued', \
            'transuong998','tranvankhanh99a','xuannhan2905','phuongltd97dn','truongngochao98', \
            'philong07712','nhuhan2505','truyenle16398','quangminhphamlu']
        return (user in whitelist)
    
    def authenticate(self, request, username=None, password=None):
        if self.ldap_auth is None:
            return None
        
        UserDataBase = get_user_model()
        if '@' not in username:
            try:
                user = UserDataBase._default_manager.get_by_natural_key(username) 
            except UserDataBase.DoesNotExist:
                logger.info("Username=%s --  Account invalid !!!!" % (username))
            else:
                logger.info("Username=%s -- Account Personal !!!!" % (username))
                if user.check_password(password) and self.user_can_authenticate(username):
                    return user

        logger.info("Username=%s -- Account Gameloft !!!!" % (username))
        if '@' not in username and self.default_email_domain :
            email = username + '@' + self.default_email_domain
        else:
            email = username
            username = username[:username.find('@')]
        
        authenticated = self.ldap_auth.authenticate(email, password)
        
        if authenticated:
            try:
                logger.info("Username=%s -- LDAP Done !!!!" %
                            (username))
                user = UserDataBase.objects.get(email=email)
                return user
            except (UserDataBase.DoesNotExist, UserDataBase.MultipleObjectsReturned):
                logger.info("Username=%s -- FIRST LOGIN !!!!" %
                            (username))
                user = UserDataBase(username=username)
                user.set_unusable_password()
                user.email = email
                user.is_active = False
                user.save()
                return user
        else:
            logger.info("Username=%s -- LDAP WRONG !!!!" % (username))
            return None

    def get_user(self, user_id):
        """
        Get user model by id.

        Args:
            user_id:

        Returns:

        """
        User = get_user_model()
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
