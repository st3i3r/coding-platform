from django.contrib.auth.models import User
from rest_framework import serializers
from backend.models import Compile, Question


class CompileSerializer(serializers.ModelSerializer):
    language = serializers.CharField(source='get_language_display', read_only=True)
    question = serializers.SlugRelatedField(many=False, slug_field='slug', read_only=True)

    class Meta:
        model = Compile
        fields = '__all__'


class CodeSubmitSerializer(serializers.ModelSerializer):
    question = serializers.SlugRelatedField(many=False, slug_field='slug', queryset=Question.objects.all(), required=True)

    class Meta:
        model = Compile
        fields = ['content', 'question', 'language']

    def create(self, validated_data):
        # TODO: Remove admin
        # validated_data['user'] = self.request.user
        validated_data['user'] = User.objects.first()
        return super().create(validated_data)
