import java.util.Scanner;
import java.util.Random;
import java.security.SecureRandom;
import java.util.Vector;
import java.lang.Math;

enum Action{
	WAIT,
	MOVE,
	USE,
	PICK,
	DROP
}

enum TypeGameObject{
	SUNG_LUC,
	SUNG_AK,
	GRENADE,
	KIT,
	ARMOR,
	HELMET,
	BULLETS_BOX,
	CHEST,
	CHARACTER,
	BUSH,
	ROCK,
	FLYING_BULLET,
	FLYING_GRENADE,
	NONE_TYPE
}

class Vector2 {
	public float x, y;	
	
	public  Vector2(){
	}
	
	public  Vector2(float x, float y){
		this.x = x;
		this.y = y;
	}
	public  Vector2(Vector2 other){
		this.x = other.x;
		this.y = other.y;
	}
	
	public  Vector2 set(float x, float y){
		this.x = x;
		this.y = y;
				
		return this;
	}
	
	public  Vector2 set(Vector2 other){
		this.x = other.x;
		this.y = other.y;
		
		return this;
	}
	
	public  Vector2 add(float amount){
		this.x += amount;
		this.y += amount;
		
		return this;
	}
	
	public  Vector2 add(float x, float y){
		this.x += x;
		this.y += y;
		
		return this;
	}
	
	public  Vector2 add(Vector2 other){
		this.x += other.x;
		this.y += other.y;
		
		return this;
	}
	
	public Vector2 sub (float amount){
		this.x -= amount;
		this.y -= amount;
		
		return this;
	}
	
	public  Vector2 sub(float x, float y){
		this.x -= x;
		this.y -= y;
		
		return this;
	}
	
	public  Vector2 sub(Vector2 other){
		this.x -= other.x;
		this.y -= other.y;
		
		return this;
	}
	
	public  Vector2 mul(float scalar){
		this.x *= scalar;
		this.y *= scalar;
		
		return this;
	}
	
	public  float magnitude(){
		return (float)Math.sqrt(x*x + y*y);
	}
	
	public  Vector2 normalize(){
		float magnitude = magnitude();
		
		if(magnitude != 0){
			this.x /= magnitude;
			this.y /= magnitude;
		}
		
		return this;
	}

	public  float distance(Vector2 other){
		float distX = this.x - other.x;
		float distY = this.y - other.y;
		
		return (float)Math.sqrt(distX*distX + distY*distY);
	}
	
	public  float distance(float x, float y){
		float distX = this.x - x;
		float distY = this.y - y;
		
		return (float)Math.sqrt(distX*distX + distY*distY);
	}
	
	public  float distSquared(Vector2 other){
		float distX = this.x - other.x;
		float distY = this.y - other.y;
		
		return distX*distX + distY*distY;
	}
	
	public  float distSquared(float x, float y){
		float distX = this.x - x;
		float distY = this.y - y;
		
		return distX*distX + distY*distY;
	}
}

class Object{
	public Object(){
		ID = 0;
		m_type = 0;
		r = 0;
	}
	
	public int ID;
	public Vector2 m_pos;
	public Vector2 m_direction;
	public int m_type;
	public float r;
}

class Player extends Object
{
	public Player(){
		 m_action = 0;
		 m_itemActionID = 0;
		 m_hp = 100; 
		 m_AK_Bullets = 0; 
		 m_numberKit = 0; 
		 m_numberGrenade = 0;
		 m_haveArmor = false;
		 m_haveHelmet = false; 
		 new Object();
	}
	
	public int m_action;
	public int m_itemActionID; 
	public Vector2 m_targetPos;
	public float m_hp;
	public int m_AK_Bullets; 
	public int m_numberKit;
	public int m_numberGrenade;
	public boolean  m_haveArmor;
	public boolean  m_haveHelmet;
}

class Circle
{
	public Circle(){
		m_currentRadius = 0;
		m_turnCountDown = 0; 
		m_hpReduce = 0; 
		m_currentCloseSpeed = 0;
		m_nextRadius = 0;
	}
	
	public Vector2 m_currentPosition;
	public float m_currentRadius;
	public int m_turnCountDown;
	public float m_hpReduce;
	public float m_currentCloseSpeed;

	public Vector2 m_nextPosition;
	public float m_nextRadius;
}

class Main{
	static final int PLAYER_PICK_RADIUS 			= 200;
	static final int MAX_GRENADE 					= 3;
	static final int MAX_KIT 						= 3;
	static final int MAX_BULLET 					= 15;
	static final int CHARACTER_RADIUS 				= 150;
	static final int RADIUS_EXPLOSION_BY_GRENADE 	= 600;
	static final int MAX_TURN_INCREASE_HEALTH		= 100;
	static final int MAP_WIDTH 						= 14000;
	static final int MAP_HEIGHT 					= 9600;
	
	static Vector2 randomPos;
	
	private boolean ApproxEqual(float a, float b, float tolerance){
		return Math.abs(a - b) < tolerance;
	}

	private boolean Parallel(Vector2 a, Vector2 b, float tolerance){
		Vector2 aUnit = a.normalize();
		Vector2 bUnit = b.normalize();
		float dot = aUnit.x * bUnit.x + aUnit.y * bUnit.y;
		
		return ApproxEqual(dot, 1.0f, tolerance);
	}
	
	private void rotateDirection(double deg, Vector2 NewDirection){
		double theta = deg / 180.0 * Math.PI;
		double c = Math.cos(theta);
		double s = Math.sin(theta);
		double tx = NewDirection.x * c - NewDirection.y * s;
		double ty = NewDirection.x * s + NewDirection.y * c;
	}
	
	private float DistancePos(Vector2 PosA, Vector2 PosB){
		float dis = (float)Math.sqrt((PosA.x - PosB.x)*(PosA.x - PosB.x) + (PosA.y - PosB.y)*(PosA.y - PosB.y));
		return dis;
	}
	
	private float RandFloat(float M, float N){
		Random r = new Random();
		return (M + r.nextFloat() * (N - M));
	}
	
	private int Rand(int min, int max){
		return (int )(Math.random() * max + min);
	}
	
	private Vector2 GenObjectPositionInsideArea(Vector2 center, int radius){
		if (radius == 0)
		{
			return center;
		}
		
		int randomRadius = Rand(0, radius);
		float randomAngle = RandFloat(0, (float)(2 * Math.PI));

		Vector2 genPosition = new Vector2();
		genPosition.x = Math.round(randomRadius * Math.cos(randomAngle)) + center.x;
		genPosition.y = Math.round(randomRadius * Math.sin(randomAngle)) + center.y;

		return genPosition;
	}
	
	private void OutputCommand(Player player){
		System.out.printf("%d %d %f %f%n", player.m_action, player.m_itemActionID, player.m_targetPos.x, player.m_targetPos.y);
	}
	
	private void WaitAction(){
		player.m_action = Action.WAIT.ordinal();
		player.m_targetPos.x = 0; 
		player.m_targetPos.y = 0; 
	}
	
	private void MoveAction(Vector2 tagetPos){
		player.m_action = Action.MOVE.ordinal();
		player.m_targetPos.x = tagetPos.x;
		player.m_targetPos.y = tagetPos.y;
	}
	
	private void UseAction(TypeGameObject typeItem, Vector2 tagetPos){
		player.m_action = Action.USE.ordinal();
		player.m_itemActionID = typeItem.ordinal();
		player.m_targetPos.x = tagetPos.x;
		player.m_targetPos.y = tagetPos.y;
	}
	
	private void PickAction(int itemID){
		player.m_action = Action.PICK.ordinal();
		player.m_itemActionID = itemID;
	}
	
	private void DropAction(TypeGameObject typeItem, int number){
		player.m_action = Action.DROP.ordinal();
		player.m_itemActionID = typeItem.ordinal();
		player.m_targetPos.x = number;
	}
	
	private void MoveRandomInsideCircle(int turn, Vector2 greenCirclePos, float greenCircleRadius){
		randomPos = GenObjectPositionInsideArea(greenCirclePos, (int)greenCircleRadius);
		if (turn % 30 == 0)
		{
			randomPos = GenObjectPositionInsideArea(greenCirclePos, (int)greenCircleRadius);
		}
		MoveAction(randomPos);
	}
	
	private void MoveFarAwayTaget(Vector2 taget){
		Vector2 newDirection = new Vector2(player.m_pos.x - taget.x, player.m_pos.y - taget.y);
		MoveAction(new Vector2(player.m_targetPos.x + newDirection.x, player.m_targetPos.y + newDirection.y));
	}
	
	private void MoveFarAwayTaget90(Vector2 taget){
		Vector2 newDirection = new Vector2(player.m_pos.x - taget.x, player.m_pos.y - taget.y);
		rotateDirection(90, newDirection);
		MoveAction(new Vector2(player.m_targetPos.x + newDirection.x, player.m_targetPos.y + newDirection.y));
	}
	
	Player player = new Player();
	int nMapObjects = 0;
	int numberPlayer = 0;
	Vector<Object> objectsMap = new Vector<Object>();
	boolean isInitialize = false;
	int currentTurn = 0;
	
	private void Init(){
		Scanner sc = new Scanner(System.in);
		currentTurn = sc.nextInt();
		numberPlayer = sc.nextInt();
		player.ID = sc.nextInt();
		player.m_pos.x = sc.nextFloat();
		player.m_pos.y = sc.nextFloat();
		player.m_hp = sc.nextInt();
		player.m_AK_Bullets = sc.nextInt(); 
		player.m_haveHelmet = sc.nextBoolean();
		player.m_haveArmor = sc.nextBoolean();
		player.m_numberKit = sc.nextInt(); 
		player.m_numberGrenade = sc.nextInt();
		
		nMapObjects = sc.nextInt(); 
		
		for (int i = 0; i < nMapObjects; i++)
		{
			Object object = new Object();
			object.ID = sc.nextInt();
			object.m_type = sc.nextInt();
			object.m_pos.x = sc.nextFloat();
			object.m_pos.y = sc.nextFloat();
			object.r = sc.nextFloat();
			
			objectsMap.add(object);
		}
		isInitialize = true;
	}
	
	public static void main(String[] args){
		Main classMain = new Main();
		Circle gameCircle = new Circle();
		Vector<Object> objectsVisible = new Vector<Object>();
		
		int nAlive = 0;
		int numberObjectVisible = 0;
		int countDownWhenUsedKit = 0;
		
		if (!classMain.isInitialize){
			classMain.Init();
		}
		else{			
			Scanner sc = new Scanner(System.in);
			classMain.currentTurn = sc.nextInt();
			nAlive = sc.nextInt();
			classMain.player.m_pos.x = sc.nextFloat();
			classMain.player.m_pos.y = sc.nextFloat();
			classMain.player.m_hp = sc.nextInt();
			classMain.player.m_AK_Bullets = sc.nextInt(); 
			classMain.player.m_haveHelmet = sc.nextBoolean();
			classMain.player.m_haveArmor = sc.nextBoolean();
			classMain.player.m_numberKit = sc.nextInt(); 
			classMain.player.m_numberGrenade = sc.nextInt();
			
			numberObjectVisible = sc.nextInt();
			objectsVisible.clear();
			
			for (int i = 0; i < numberObjectVisible; i++)
			{
				Object object = new Object();
				
				object.ID = sc.nextInt();
				object.m_type = sc.nextInt();
				object.m_pos.x = sc.nextFloat();
				object.m_pos.y = sc.nextFloat();
				object.m_direction.x = sc.nextFloat();
				object.m_direction.y = sc.nextFloat();
				
				objectsVisible.add(object);
			}

			gameCircle.m_currentPosition.x = sc.nextFloat();
			gameCircle.m_currentPosition.y = sc.nextFloat();
			gameCircle.m_currentRadius = sc.nextFloat();
			gameCircle.m_turnCountDown = sc.nextInt();
			gameCircle.m_currentCloseSpeed = sc.nextFloat();
			gameCircle.m_hpReduce = sc.nextFloat();
			gameCircle.m_nextPosition.x = sc.nextFloat();
			gameCircle.m_nextPosition.y = sc.nextFloat(); 
			gameCircle.m_nextRadius = sc.nextFloat();
		}
		
		//Simple bot demo
		Vector<Object> playerVisible = new Vector<Object>();
		Vector<Object> playerShotVisible = new Vector<Object>();
		Vector<Object> itemVisible = new Vector<Object>();
		Vector<Object> bulletsVisible = new Vector<Object>();
		Vector<Object> grenadeVisible = new Vector<Object>();
		Vector<Object> rocksVisible = new Vector<Object>();
		Vector<Object> buhsVisible = new Vector<Object>();
		
		for (int i = 0; i < objectsVisible.size(); i++) 
		{
			if (objectsVisible.get(i).m_type == TypeGameObject.CHARACTER.ordinal()) 
			{
				if (objectsVisible.get(i).ID != -1) 
				{
					playerVisible.add(objectsVisible.get(i));
				}
				else 
				{
					playerShotVisible.add(objectsVisible.get(i));
				}
			}
			else if (objectsVisible.get(i).m_type == TypeGameObject.ARMOR.ordinal() 
				|| objectsVisible.get(i).m_type == TypeGameObject.HELMET.ordinal() 
				|| objectsVisible.get(i).m_type == TypeGameObject.KIT.ordinal()
				|| objectsVisible.get(i).m_type == TypeGameObject.GRENADE.ordinal() 
				|| objectsVisible.get(i).m_type == TypeGameObject.BULLETS_BOX.ordinal() 
				|| objectsVisible.get(i).m_type == TypeGameObject.CHEST.ordinal())
			{
				itemVisible.add(objectsVisible.get(i));
			}
			else if (objectsVisible.get(i).m_type == TypeGameObject.FLYING_BULLET.ordinal())
			{
				bulletsVisible.add(objectsVisible.get(i));
			}
			else if (objectsVisible.get(i).m_type == TypeGameObject.FLYING_GRENADE.ordinal())
			{
				grenadeVisible.add(objectsVisible.get(i));
			}
			else if (objectsVisible.get(i).m_type == TypeGameObject.ROCK.ordinal())
			{
				rocksVisible.add(objectsVisible.get(i));
			}
			else if (objectsVisible.get(i).m_type == TypeGameObject.BUSH.ordinal())
			{
				buhsVisible.add(objectsVisible.get(i));
			}
		}
		
		boolean isRunning = false;
		if (grenadeVisible.size() > 0)
		{
			for (int i = 0; i < grenadeVisible.size(); i++)
			{
				Vector2 directionToPlayer = classMain.player.m_pos.sub(grenadeVisible.get(i).m_pos);
				if (classMain.DistancePos(classMain.player.m_pos, grenadeVisible.get(i).m_pos) <= (RADIUS_EXPLOSION_BY_GRENADE+ CHARACTER_RADIUS))
				{
					classMain.MoveFarAwayTaget(grenadeVisible.get(i).m_pos);
					isRunning = true;
					break;
				}
				else if (classMain.Parallel(directionToPlayer, grenadeVisible.get(i).m_direction, 0.5f))
				{
					classMain.MoveFarAwayTaget90(grenadeVisible.get(i).m_pos);
					isRunning = true;
					break;
				}
			}
		}
		
		if (!isRunning)
		{
			if (classMain.DistancePos(classMain.player.m_pos, gameCircle.m_currentPosition) > gameCircle.m_currentRadius)
			{	
				classMain.MoveAction(gameCircle.m_currentPosition);
			}
			
			if (playerShotVisible.size() > 0)
			{
				if (classMain.player.m_numberGrenade > 0)
				{
					classMain.UseAction(TypeGameObject.GRENADE, playerShotVisible.get(0).m_pos);
				}
				else if (classMain.player.m_AK_Bullets > 0)
				{
					classMain.UseAction(TypeGameObject.SUNG_AK, playerShotVisible.get(0).m_pos);
				}
				else
				{
					classMain.UseAction(TypeGameObject.SUNG_LUC, playerShotVisible.get(0).m_pos);
				}
			}
			else if (playerVisible.size() > 0)
			{
				if (classMain.player.m_hp > 50)
				{
					if (classMain.player.m_numberGrenade > 0)
					{
						classMain.UseAction(TypeGameObject.GRENADE, playerVisible.get(0).m_pos);
					}
					else if (classMain.player.m_AK_Bullets > 0)
					{
						classMain.UseAction(TypeGameObject.SUNG_AK, playerVisible.get(0).m_pos);
					}
					else
					{
						classMain.UseAction(TypeGameObject.SUNG_LUC, playerVisible.get(0).m_pos);
					}
				}
				else
				{
					classMain.MoveFarAwayTaget90(playerVisible.get(0).m_pos);
				}
			}
			else if (classMain.player.m_hp < 60 && classMain.player.m_numberKit > 0 && countDownWhenUsedKit <= 0)
			{
				classMain.UseAction(TypeGameObject.KIT, new Vector2(0, 0));
				countDownWhenUsedKit = MAX_TURN_INCREASE_HEALTH;
			}
			else if (itemVisible.size() > 0)
			{
				boolean isFoundItem = false;
				float mindistance = 999999;
				int mindistanceItemIndex = -1;
				
				for (int i = 0; i < itemVisible.size(); i++)
				{
					Object item = new Object();
					item = itemVisible.get(i);
					
					if (classMain.DistancePos(item.m_pos, gameCircle.m_currentPosition) <= gameCircle.m_currentRadius)
					{
						if (item.m_type == TypeGameObject.GRENADE.ordinal())
						{
							if (classMain.player.m_numberGrenade < MAX_GRENADE)
							{
								float dist = classMain.DistancePos(classMain.player.m_pos, item.m_pos);
								
								if (dist < mindistance)
								{
									mindistance = dist;
									mindistanceItemIndex = i;
								}
							}
							break;
						}	
						else if (item.m_type == TypeGameObject.KIT.ordinal())
						{
							if (classMain.player.m_numberKit < MAX_KIT)
							{
								float dist = classMain.DistancePos(classMain.player.m_pos, item.m_pos);
								
								if (dist < mindistance)
								{
									mindistance = dist;
									mindistanceItemIndex = i;
								}
							}
							break;
						}	
						else if (item.m_type == TypeGameObject.ARMOR.ordinal())
						{
							if (!classMain.player.m_haveArmor)
							{
								float dist = classMain.DistancePos(classMain.player.m_pos, item.m_pos);
								
								if (dist < mindistance)
								{
									mindistance = dist;
									mindistanceItemIndex = i;
								}
							}
							break;
						}	
						else if (item.m_type == TypeGameObject.HELMET.ordinal())
						{
							if (!classMain.player.m_haveHelmet)
							{
								float dist = classMain.DistancePos(classMain.player.m_pos, item.m_pos);
								
								if (dist < mindistance)
								{
									mindistance = dist;
									mindistanceItemIndex = i;
								}
							}
							break;
						}	
						else if (item.m_type == TypeGameObject.BULLETS_BOX.ordinal())
						{
							if (classMain.player.m_AK_Bullets < MAX_BULLET)
							{
								float dist = classMain.DistancePos(classMain.player.m_pos, item.m_pos);
								
								if (dist < mindistance)
								{
									mindistance = dist;
									mindistanceItemIndex = i;
								}
							}
							break;
						}	
						else if (item.m_type == TypeGameObject.CHEST.ordinal())
						{
							float dist = classMain.DistancePos(classMain.player.m_pos, item.m_pos);
							
							if (dist < mindistance)
							{
								mindistance = dist;
								mindistanceItemIndex = i;
							}
							break;
						}	
					}
				}
				
				if (mindistanceItemIndex != -1)
				{
					if (mindistance > PLAYER_PICK_RADIUS)
						classMain.MoveAction(itemVisible.get(mindistanceItemIndex).m_pos);
					else
						classMain.PickAction(itemVisible.get(mindistanceItemIndex).ID);
					
					isFoundItem = true;
				}
				
				if (!isFoundItem)
				{
					classMain.MoveRandomInsideCircle(classMain.currentTurn, gameCircle.m_currentPosition, gameCircle.m_currentRadius);
				}
			}
			else
			{
				classMain.MoveRandomInsideCircle(classMain.currentTurn, gameCircle.m_currentPosition, gameCircle.m_currentRadius);
			}
		}

		--countDownWhenUsedKit;	
		classMain.OutputCommand(classMain.player);
	}
}
