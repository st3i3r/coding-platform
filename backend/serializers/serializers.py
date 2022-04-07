from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from backend.models import Player

import re


class RegisterSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fiedlds = ('username', 'password',)
		extra_kwargs = {
			'password':{'write_only': True},
		}


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'


class PlayerRegister(serializers.ModelSerializer):
	password = serializers.CharField(max_length=20, min_length=8)
	confirm_password = serializers.CharField(max_length=20, min_length=8)
	
	class Meta:
		model = Player
		fields = (
			'user__firstname',
			'user__lastname',
			'username',
			'phonenumber',
			'email',
			'graduation',
			'university',
			'password',
			'confirm_password',
		)
		
	def validate_username(self, username):
		if getUserFromUsername(username):
			raise serializers.ValidationError('User already exists')
		if len(username) < 5:
			raise serializers.ValidationError('Minimum length is 5')
			
		return username
		
	def validate_email(self, email):
		if not re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", email):
			raise ValidationError("Invalid email format")
			
		if User.objects.filter(email=email).first():
			raise ValidationError("Email is already used")
			
		return email 
		
	def validate_confirm_password(self, confirm_password):
		# Check
		logger.info(self.__dict__)
		if not confirm_password == self.password:
			
	def create(self, validated_data):
		first_name = validated_data.pop('firstname')
		last_name = validated_data.pop('lastname')
		email = validated_data.pop('email')
		password = validated_data.pop('password')
		
		user = User.objects.create(username=username, is_active=False, email=email)
		user.first_name = first_name
		user.last_name = last_name
		user.set_password(password)
		user.save()
		
		Player.objects.create(**validated_data)
		
		uid = urlsafe_base64_encode(force_bytes(user.pk))
		token = account_activation_token.make_token(user)
		url = "%s/#verify/%s/%s" % (getDomainName(), uid, token)
		logger.info("Uid= %s -- Token= %s -- Url= %s " %(uid, token, url))
		sendEmail(email, username, settings.EMAIL_REGISTER_VERIFY, url)
		
		
