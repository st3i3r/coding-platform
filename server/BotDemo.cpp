// BotDemo.cpp : Defines the entry point for the console application.
//
//#include "stdafx.h"
#include <iostream>
#include <sstream>
#include <time.h>
#include <vector>
#define _USE_MATH_DEFINES
#include <math.h>

#define PLAYER_PICK_RADIUS 200

#define MAX_GRENADE			3
#define MAX_KIT				3
#define MAX_BULLET			15

#define CHARACTER_RADIUS	150

#define RADIUS_EXPLOSION_BY_GRENADE 600

#define MAX_TURN_INCREASE_HEALTH  100

using namespace std;

int MAP_WIDTH = 14000;
int MAP_HEIGHT = 9600;


enum Action
{
	WAIT = 0, //action do nothing
	MOVE, //action move on map
	USE, //action use a item you have which have a type
	PICK, //action pick a item on map which have a ID
	DROP //action drop a item on map which have a type
};

enum TypeGameObject
{
	SUNG_LUC,//object items
	SUNG_AK,//object items
	GRENADE,//object items
	KIT,//object items
	ARMOR,//object items
	HELMET,//object items
	BULLETS_BOX,//object items
	CHEST,//object items
	CHARACTER,//object player
	BUSH,//object map
	ROCK,//object map
	FLYING_BULLET,//bullet shoot is moving
	FLYING_GRENADE,//grenade object is moving
	NONE_TYPE
};

struct Vector2
{
	float x;
	float y;
	Vector2() : x(0.0f), y(0.0f) {}
	Vector2(float _x, float _y) : x(_x), y(_y) {}
	Vector2 operator =(Vector2 pos) { x = pos.x; y = pos.y; return *this; }
	Vector2 operator-(Vector2& v) { return Vector2(x - v.x, y - v.y); }
	Vector2& operator*=(double s) { x *= s; y *= s; return *this; }
	float length() const { return std::sqrt(x * x + y * y); }
	Vector2 normalize() const
	{
		Vector2 tmp = *this;
		float lengthTmp = tmp.length();
		if (lengthTmp == 0)
			return tmp;
		tmp *= (1.0 / lengthTmp);
		return tmp;
	}
	static float dot(Vector2 v1, Vector2 v2)
	{
		return v1.x * v2.x + v1.y * v2.y;
	}
};

class Object //game's object information
{
public:
	Object():ID(0), m_type(0), r(0) {}
	int ID;
	Vector2 m_pos;
	Vector2 m_direction; //Bullet or grenade's moving direction when it was shoot
	unsigned int m_type;
	float r;
};

class Player : public Object //player's information
{
public:
	Player() :m_action(0), m_itemActionID(0), m_hp(100), m_AK_Bullets(0), m_numberKit(0), m_numberGrenade(0), m_haveArmor(false), m_haveHelmet(false), Object() {}
	int m_action;
	unsigned int m_itemActionID; //it is item's ID when action Pick //it is item's type when action use
	Vector2 m_targetPos; //direction of moving/target pos
	float m_hp; //current hp // max 100
	unsigned int m_AK_Bullets; //current  AK-47's number bullet //max 15 
	unsigned int m_numberKit; //current medical bags //max 3
	unsigned int m_numberGrenade; //current grenade you have //max 3
	bool m_haveArmor; //equipped armor
	bool m_haveHelmet; //equipped helmet
};

class Circle // game's circle information
{
public:
	Circle() :m_currentRadius(0), m_turnCountDown(0), m_hpReduce(0.0f), m_currentCloseSpeed(0), m_nextRadius(0) {}
	Vector2 m_currentPosition; //green circle's position
	float m_currentRadius; //green circle's radius
	unsigned int m_turnCountDown; //turn remain to it start to close //when it equal 0 it mean circle is closing
	float m_hpReduce; //player lose their hp when outside the circle on turn
	float m_currentCloseSpeed;

	Vector2 m_nextPosition; //white circle's position // green circle will move to this position when it start to close
	float m_nextRadius; //white circle's radius // green circle will close to this radius when it start to close
};

//helper function
void rotateDirection(double deg, Vector2& NewDirection);
float DistancePos(Vector2 PosA, Vector2 PosB);
float RandFloat(float M, float N);
int Rand(int min, int max);
Vector2 GenObjectPositionInsideArea(Vector2 center, int radius);
void OutputCommand(const Player& myTeam);

void WaitAction(); //action do nothing
void MoveAction(Vector2 tagetPos); //action move to x, y
void UseAction(TypeGameObject typeItem, Vector2 tagetPos); //use a item at x,y taget
void PickAction(unsigned int itemID); //pick a item with a ID
void DropAction(TypeGameObject typeItem, int number);

void MoveRandomInsideCircle(int turn, Vector2 greenCirclePos, float greenCircleRadius);
void MoveFarAwayTaget(Vector2 taget);
void MoveFarAwayTaget90(Vector2 taget);

bool ApproxEqual(float a, float b, float tolerance)
{
	return abs(a - b) < tolerance;
}

bool Parallel(Vector2 a, Vector2 b, float tolerance)
{
	Vector2 aUnit = a.normalize();
	Vector2 bUnit = b.normalize();
	return ApproxEqual(Vector2::dot(aUnit,bUnit), 1.0f, tolerance);
}
//helper function end

Player player; //your player information

unsigned int nMapObjects = 0, numberPlayer = 0;

vector<Object> objectsMap; //objects on map when game initialized 

bool isInitialize = false;
unsigned int currentTurn = 0; //current game's turn

void Init()
{
	//string serverInput;
	//getline(std::cin, serverInput);
	//cerr << "bot received init data: " << serverInput;
	//stringstream sServerInput(serverInput);
	//number player in game // your player id and it's position on map at first turn and current player information
	std::cin >> currentTurn >> numberPlayer >> player.ID >> player.m_pos.x >> player.m_pos.y >> player.m_hp >> player.m_AK_Bullets >> player.m_haveHelmet >> player.m_haveArmor >> player.m_numberKit >> player.m_numberGrenade; 
	cerr << "bot received init player.ID: " << player.ID;
	std::cin >> nMapObjects;
	objectsMap.reserve(nMapObjects);
	for (size_t i = 0; i < nMapObjects; i++) //objects and items information on map when game initialized 
	{
		Object object;
		std::cin >> object.ID >> object.m_type >> object.m_pos.x >> object.m_pos.y >> object.r; //it's id, type, position, radius
		objectsMap.push_back(object);
	}
	isInitialize = true;
}
int main()
{
	//init timer rand
	srand(time(NULL));
	
	//***************************************************************
	// Write an action using std::cout or printf()					|
	// To debug log: std:cerr << "Debug messages here...";			|
	//***************************************************************

	
	
	unsigned int nAlive = 0; //number player alive

	unsigned int numberObjectVisible = 0;
	vector<Object> objectsVisible; //game's objects (object, items, other players) in your visible area (radius 1500 around your position)

	Circle gameCircle; //green circle and white circle information

	int countDownWhenUsedKit = 0; //Kit have effect in 100 turn and don't stack

	while (true)
	{
		string serverInput = "";
		if (!isInitialize)
			Init();
		else
		{
			//getline(std::cin, serverInput); //get server's information return
			//stringstream sServerInput(serverInput);

			//use cin for check, make sure game server alway send correct and enough information
			//get current player information
			std::cin >> currentTurn >> nAlive >> player.m_pos.x >> player.m_pos.y >> player.m_hp >> player.m_AK_Bullets >> player.m_haveHelmet >> player.m_haveArmor >> player.m_numberKit >> player.m_numberGrenade;
			
			//get Visible objects information
			std::cin >> numberObjectVisible;
			objectsVisible.clear();
			objectsVisible.reserve(numberObjectVisible);
			for (unsigned int i = 0; i < numberObjectVisible; i++)
			{
				Object object;
				std::cin >> object.ID >> object.m_type >> object.m_pos.x >> object.m_pos.y >> object.m_direction.x >> object.m_direction.y; //visible object's id, type, position
				objectsVisible.push_back(object);
			}

			//get game circle information
			std::cin >> gameCircle.m_currentPosition.x >> gameCircle.m_currentPosition.y >> gameCircle.m_currentRadius >> gameCircle.m_turnCountDown >> gameCircle.m_currentCloseSpeed >> gameCircle.m_hpReduce >> gameCircle.m_nextPosition.x >> gameCircle.m_nextPosition.y >> gameCircle.m_nextRadius; //visible object's id, type, position
		}

		//Simple bot demo
		std::vector<Object*> playerVisible;
		std::vector<Object*> playerShotVisible;//this player shot in your listenable area but you don't see him so you don't know that player's id
		std::vector<Object*> itemVisible;
		std::vector<Object*> bulletsVisible;
		std::vector<Object*> grenadeVisible;
		std::vector<Object*> rocksVisible;
		std::vector<Object*> buhsVisible;

		for (size_t i = 0; i < objectsVisible.size(); i++)
		{
			if (objectsVisible[i].m_type == TypeGameObject::CHARACTER)
			{
				if (objectsVisible[i].ID != -1)
				{
					playerVisible.push_back(&(objectsVisible[i]));
				}
				else
				{
					playerShotVisible.push_back(&(objectsVisible[i]));
				}
			}
			else if (objectsVisible[i].m_type == TypeGameObject::ARMOR || objectsVisible[i].m_type == TypeGameObject::HELMET || objectsVisible[i].m_type == TypeGameObject::KIT
				|| objectsVisible[i].m_type == TypeGameObject::GRENADE || objectsVisible[i].m_type == TypeGameObject::BULLETS_BOX || objectsVisible[i].m_type == TypeGameObject::CHEST)
			{
				itemVisible.push_back(&(objectsVisible[i]));
			}
			else if (objectsVisible[i].m_type == TypeGameObject::FLYING_BULLET)
			{
				bulletsVisible.push_back(&(objectsVisible[i]));
			}
			else if (objectsVisible[i].m_type == TypeGameObject::FLYING_GRENADE)
			{
				grenadeVisible.push_back(&(objectsVisible[i]));
			}
			else if (objectsVisible[i].m_type == TypeGameObject::ROCK)
			{
				rocksVisible.push_back(&(objectsVisible[i]));
			}
			else if (objectsVisible[i].m_type == TypeGameObject::BUSH)
			{
				buhsVisible.push_back(&(objectsVisible[i]));
			}
		}

		bool isRunning = false;
		if (grenadeVisible.size())
		{
			for (size_t i = 0; i < grenadeVisible.size(); i++)
			{
				Vector2 directionToPlayer = (player.m_pos - grenadeVisible[i]->m_pos);
				if (DistancePos(player.m_pos, grenadeVisible[i]->m_pos) <= (RADIUS_EXPLOSION_BY_GRENADE+ CHARACTER_RADIUS)) //check if grenade is close
				{
					MoveFarAwayTaget(grenadeVisible[i]->m_pos); //run away
					isRunning = true;
					break;
				}
				//check if grenade is coming to your local
				else if (Parallel(directionToPlayer, grenadeVisible[i]->m_direction, 0.5)) //does not test this function yet, not sure this working
				{
					MoveFarAwayTaget90(grenadeVisible[i]->m_pos); //does not test this function yet, not sure this working
					isRunning = true;
					break;
				}
			}
		}

		if (!isRunning)
		{
			if (DistancePos(player.m_pos, gameCircle.m_currentPosition) > gameCircle.m_currentRadius) //player is out side green circle // will lose hp
			{
				MoveAction(gameCircle.m_currentPosition); //Move inside green circle
			}
			else if (playerShotVisible.size() > 0)//Someone shot in your listenable area
			{
				if (player.m_numberGrenade > 0)
				{
					UseAction(TypeGameObject::GRENADE, playerShotVisible[0]->m_pos); //use grenade to target
				}
				else if (player.m_AK_Bullets > 0)
				{
					UseAction(TypeGameObject::SUNG_AK, playerShotVisible[0]->m_pos); //use AK to target
				}
				else
				{
					UseAction(TypeGameObject::SUNG_LUC, playerShotVisible[0]->m_pos); //use pistol to target
				}
			}
			else if (playerVisible.size() > 0) //other player is near
			//if (false)
			{
				if (player.m_hp > 50) //if have high hp
				{
					if (player.m_numberGrenade > 0)
					//if(false)
					{
						UseAction(TypeGameObject::GRENADE, playerVisible[0]->m_pos); //use grenade to target
					}
					else if (player.m_AK_Bullets > 0)
					{
						UseAction(TypeGameObject::SUNG_AK, playerVisible[0]->m_pos); //use AK to target
					}
					else
					{
						UseAction(TypeGameObject::SUNG_LUC, playerVisible[0]->m_pos); //use pistol to target
					}
				}
				else //if have low hp
				{
					MoveFarAwayTaget90(playerVisible[0]->m_pos); //run
				}
			}
			else if (player.m_hp < 60 && player.m_numberKit > 0 && countDownWhenUsedKit <= 0)
			{
				UseAction(TypeGameObject::KIT, Vector2(0, 0)); //use kit to restore hp
				countDownWhenUsedKit = MAX_TURN_INCREASE_HEALTH; //because kit don't stack show we need check if kit is in count down or not
			}
			else if (itemVisible.size() > 0) //items is near
			{
				//find the item closest
				bool isFoundItem = false;
				float mindistance = 999999;
				int mindistanceItemIndex = -1;
				for (size_t i = 0; i < itemVisible.size(); i++)
				{
					if (DistancePos(itemVisible[i]->m_pos, gameCircle.m_currentPosition) <= gameCircle.m_currentRadius)
					{
						switch (itemVisible[i]->m_type)
						{
						case GRENADE:
							if (player.m_numberGrenade < MAX_GRENADE)
							{
								float dist = DistancePos(player.m_pos, itemVisible[i]->m_pos);
								if (dist < mindistance)
								{
									mindistance = dist;
									mindistanceItemIndex = i;
								}
							}
							break;
						case KIT:
							if (player.m_numberKit < MAX_KIT)
							{
								float dist = DistancePos(player.m_pos, itemVisible[i]->m_pos);
								if (dist < mindistance)
								{
									mindistance = dist;
									mindistanceItemIndex = i;
								}
							}
							break;
						case ARMOR:
							if (!player.m_haveArmor)
							{
								float dist = DistancePos(player.m_pos, itemVisible[i]->m_pos);
								if (dist < mindistance)
								{
									mindistance = dist;
									mindistanceItemIndex = i;
								}
							}
							break;
						case HELMET:
							if (!player.m_haveHelmet)
							{
								float dist = DistancePos(player.m_pos, itemVisible[i]->m_pos);
								if (dist < mindistance)
								{
									mindistance = dist;
									mindistanceItemIndex = i;
								}
							}
							break;
						case BULLETS_BOX:
							if (player.m_AK_Bullets < MAX_BULLET)
							{
								float dist = DistancePos(player.m_pos, itemVisible[i]->m_pos);
								if (dist < mindistance)
								{
									mindistance = dist;
									mindistanceItemIndex = i;
								}
							}
							break;
						case CHEST:
						{
							float dist = DistancePos(player.m_pos, itemVisible[i]->m_pos);
							if (dist < mindistance)
							{
								mindistance = dist;
								mindistanceItemIndex = i;
							}
							break;
						}
							
						default:
							break;
						}
					}
				}
				if (mindistanceItemIndex != -1)
				{
					if (mindistance > PLAYER_PICK_RADIUS)
						MoveAction(itemVisible[mindistanceItemIndex]->m_pos); //Move to item
					else
						PickAction(itemVisible[mindistanceItemIndex]->ID);
					isFoundItem = true; //found item closest
				}
				if (!isFoundItem) //didn't find any items
				{
					MoveRandomInsideCircle(currentTurn, gameCircle.m_currentPosition, gameCircle.m_currentRadius); //Move random inside green circle
				}
			}
			else
			{
				MoveRandomInsideCircle(currentTurn, gameCircle.m_currentPosition, gameCircle.m_currentRadius); //Move random inside green circle
			}
		}
		//simple bot demo

		--countDownWhenUsedKit;

		std:cerr << "OutputCommand\n";
		//Demo send players' action to server		
		OutputCommand(player);
	}
	return 0;
}

void WaitAction()
{
	player.m_action = Action::WAIT;
	player.m_targetPos.x = 0; //should reset to 0
	player.m_targetPos.y = 0; //should reset to 0
}

void MoveAction(Vector2 tagetPos)
{
	player.m_action = Action::MOVE;
	player.m_targetPos.x = tagetPos.x;
	player.m_targetPos.y = tagetPos.y;
}

void UseAction(TypeGameObject typeItem, Vector2 tagetPos) //position where you want to shot or where you want throw grenade
{
	player.m_action = Action::USE;
	player.m_itemActionID = typeItem; //type item on your equipment want to use //type Gun, Kit, grenade
	//item kit will restore hp on yourself so it no need taget's positon
	player.m_targetPos.x = tagetPos.x;
	player.m_targetPos.y = tagetPos.y;
}

void PickAction(unsigned int itemID)
{
	player.m_action = Action::PICK;
	player.m_itemActionID = itemID; //item's ID you want to pick
}

void DropAction(TypeGameObject typeItem, int number)
{
	player.m_action = Action::DROP;
	player.m_itemActionID = typeItem; //type item on your equipment want to drop //type bullets AK, kits, grenades
	player.m_targetPos.x = number; //number items on your equipment want to drop //number bullets AK, number kits, number grenades
}

void MoveRandomInsideCircle(int turn, Vector2 greenCirclePos, float greenCircleRadius)
{
	static Vector2 randomPos = GenObjectPositionInsideArea(greenCirclePos, greenCircleRadius);
	if (turn % 30 == 0)
	{
		randomPos = GenObjectPositionInsideArea(greenCirclePos, greenCircleRadius);
	}
	MoveAction(randomPos);
}

void MoveFarAwayTaget(Vector2 taget)
{
	Vector2 newDirection = Vector2(player.m_pos.x - taget.x, player.m_pos.y - taget.y); //opposite direction
	MoveAction(Vector2(player.m_targetPos.x + newDirection.x, player.m_targetPos.y + newDirection.y));
}

void MoveFarAwayTaget90(Vector2 taget)
{
	Vector2 newDirection = Vector2(player.m_pos.x - taget.x, player.m_pos.y - taget.y); //opposite direction
	//float randomAngle = RandFloat(-M_PI / 4, M_PI / 4);
	rotateDirection(90, newDirection);
	MoveAction(Vector2(player.m_targetPos.x + newDirection.x, player.m_targetPos.y + newDirection.y));
}

void rotateDirection(double deg, Vector2& NewDirection)
{
	double theta = deg / 180.0 * M_PI;
	double c = cos(theta);
	double s = sin(theta);
	double tx = NewDirection.x * c - NewDirection.y * s;
	double ty = NewDirection.x * s + NewDirection.y * c;
	NewDirection.x = tx;
	NewDirection.y = ty;
}
void OutputCommand(const Player& player){
	//best performance with one-line printf out.
	printf("%d %d %f %f\n", player.m_action, player.m_itemActionID, player.m_targetPos.x, player.m_targetPos.y);
}

float DistancePos(Vector2 PosA, Vector2 PosB){
	float dis = sqrt((PosA.x - PosB.x)*(PosA.x - PosB.x) + (PosA.y - PosB.y)*(PosA.y - PosB.y));
	return dis;
}

float RandFloat(float M, float N)
{
	return M + (rand() / (RAND_MAX / (N - M)));
}

int Rand(int min, int max)
{
	return min + rand() % (max - min);
}

Vector2 GenObjectPositionInsideArea(Vector2 center, int radius)
{
	if (radius == 0)
	{
		return center;
	}
	Vector2 genPosition;

	int randomRadius = Rand(0, radius);
	float randomAngle = RandFloat(0, 2 * M_PI);

	genPosition.x = round(randomRadius * cos(randomAngle)) + center.x;
	genPosition.y = round(randomRadius * sin(randomAngle)) + center.y;

	return genPosition;
}
