from django.contrib.auth.models import User
from rest_framework import viewsets

from backend.models import Compile
from backend.serializers.compiles import CompileSerializer


class CompileViewSet(viewsets.ModelViewSet):
    queryset = Compile.objects.all()
    serializer_class = CompileSerializer

    def get_queryset(self):
        # TODO: Filter by player
        if self.request.user.is_anonymous:
            self.request.user = User.objects.first()
        return self.queryset.filter(user=self.request.user)