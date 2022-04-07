from channels.generic.websocket import JsonWebsocketConsumer
from asgiref.sync import async_to_sync
from backend.tasks import check_testcases, send_testcase_detail, get_player_from_user, \
    send_submission_summary, send_submission_detail
from backend.models import Compile
from django.contrib.auth.models import User
from time import sleep

import logging

logger = logging.getLogger()


class AIConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.room_group_name = 'CompileTask'

        # DEBUG
        self.scope["user"] = User.objects.first()
        self.user = self.scope["user"]
        ###########

        self.scope["session"].save()

        if self.scope["user"].is_anonymous:
            logger.info("Woof woof woof woof woof woof woof woof woof woof woof woof woof woof woof")
            self.close()
        else:
            async_to_sync(self.channel_layer.group_add)(self.room_group_name, self.channel_name)
            self.accept()
            self.user = self.scope["user"]
            logger.info('Username= %s -- channel_name= %s' %
                        (self.user, self.channel_name))
            self.sendData(message={"message": "Connect successful", "status": "info", 'type_msg': "toast"})

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name, self.channel_name)
        # logger.info("Remove %s channel from users's group" % self.channel_name)
        self.close()

    def receive_json(self, message):
        # logger.info('Username= %s -- channel_name= %s -- Receive=%s' % (self.user, self.channel_name, message))
        player = get_player_from_user(self.user)
        if message['action'] == "submit":
            compile_log_pk = start_compile(self.user, message['data'], self.channel_name)
            # Check if compiled successfully, then process testcases
            if compile_log_pk:
                compile_log = Compile.objects.get(pk=compile_log_pk, user=self.user)
                submission = compile_log.submission

                # TODO: Refactor
                while compile_log.state == 2:
                    sleep(1)
                    compile_log = Compile.objects.get(pk=compile_log_pk)

                if compile_log.state == 1:
                    submission.status = 2  # Compilation error
                    submission.save(update_fields=['status'])
                elif compile_log.state == 0:
                    check_testcases.delay(self.channel_name, player.pk, compile_log_pk, submission.id)

        elif message['action'] == "get-testcase-detail":
            send_testcase_detail(self.channel_name, player, message['data'])

        elif message['action'] == "get-submissions":
            question_slug = message['data'].get('question_slug')
            send_submission_summary.delay(self.channel_name, player.pk, question_slug)

        elif message['action'] == "get-submission-detail":
            submission_id = message['data'].get('submission_id')
            send_submission_detail(self.channel_name, player.pk, submission_id)

    def sendData(self, message):
        # logger.info('Username= %s -- channel_name= %s -- Send=%s' %
        #            (self.user, self.channel_name, message))
        self.send_json({
            "message": message["message"],
            "type_msg": message["type_msg"],
            "status": message["status"],
            "data": message.get("data")
        })
