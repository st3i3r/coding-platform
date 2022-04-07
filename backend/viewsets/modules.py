from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.models import Module
from backend.serializers.challenges import QuestionSerializer
from backend.serializers.modules import ModuleSerializer


class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer

    @action(methods=['get'], detail=True, url_path='get-questions')
    def get_questions(self, request, *args, **kwargs):
        module = self.get_object()
        questions = module.questions.all()
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data, status.HTTP_200_OK)