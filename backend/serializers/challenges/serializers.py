from rest_framework import serializers

from backend.models import Question, SolutionTemplate


class SolutionTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolutionTemplate
        fields = '__all__'


class QuestionSerializer(serializers.ModelSerializer):
    skillset = serializers.SlugRelatedField(many=False, slug_field='title', read_only=True)

    class Meta:
        model = Question
        fields = '__all__'

