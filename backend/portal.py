from django.conf import settings

import json
import subprocess
import os
import sys
import logging
logger = logging.getLogger()

import shlex
import asyncio
import async_timeout
from select import select
import io
import threading
# Define const variable
FILE_NAME_DATA_SEND_TO_SERVER = "data_send_to_webpage.json"

# Define functions
def LoadJsonConfig(g_ServerStartArgs, match, listBot):
	listPlayersName = dict()
	ListPlayersPath = dict()
	listPlayersName= {}
	ListPlayersPath ={}
	ListPlayersPath["0"] = match.getBotOwner()


	PathSaveFile = '/webservice/media/%s/%s.zip' % (match.bot.user.__str__(),match.taskID)

	g_ServerStartArgs["MatchID"] =  match.pk
	g_ServerStartArgs["SavePath"] = PathSaveFile
	g_ServerStartArgs["Brush"] = 25
	g_ServerStartArgs["Rock"] = 20
	g_ServerStartArgs["Bullet"] = 20
	g_ServerStartArgs["Helmet"] = 5
	g_ServerStartArgs["Grenade"] = 15
	g_ServerStartArgs["Kit"] = 15
	g_ServerStartArgs["Armor"] = 10

	listPlayersName["userID"] = 0
	listPlayersName["UserName"] = str(match.bot.user.__str__())
	listPlayers =[]
	listPlayers.append(listPlayersName)

	botIndex=1
	for bot in listBot:
		ListPlayersPath[str(botIndex)] = bot.getBot()
		listPlayersName = {}
		listPlayersName["UserID"] = botIndex
		listPlayersName["UserName"] = str(bot.bot.user.__str__())
		listPlayers.append(listPlayersName)
		botIndex=botIndex+1
	g_ServerStartArgs["Players"] = listPlayers
	return ListPlayersPath

def SpawnGameserverProcess(g_ServerStartArgs,match):
	g_ServerProcess = None
	LOG_SERVER_PATH = '/webservice/media/server/server_%s.log'%match.taskID
	g_ServerProcess = subprocess.Popen([os.path.join(os.getcwd(), settings.SERVER_BINARY_PATH), g_ServerStartArgs], stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=open(LOG_SERVER_PATH,"w"))
	return g_ServerProcess

def SpawnBotsProcess(g_ListPathsOfPlayers, match):
	g_ListProcess = dict()
	g_ListProcess = {}
	file_path = '/webservice/media/%s/%s.log' % (match.bot.user, match. taskID)
	for userID in g_ListPathsOfPlayers:
		if (userID == "0"):
			g_ListProcess[userID] = subprocess.Popen(shlex.split(g_ListPathsOfPlayers[userID]), stdout=subprocess.PIPE, stdin=subprocess.PIPE, stderr=open(file_path,"w"))
		else:
			g_ListProcess[userID] = subprocess.Popen(shlex.split(g_ListPathsOfPlayers[userID]), stdout=subprocess.PIPE, stdin=subprocess.PIPE)
	return g_ListProcess

# def	SetLeaderboadForDepenPlayer(playerID, valueLeaderboard):
# 	g_ListPlayers[playerID]['leaderboard'] = valueLeaderboard

def SaveLeaderBoard(LeaderBoard):
	
	ListPlayerLeaderBoard = []
	ListPlayerLeaderBoard = json.loads(LeaderBoard.rstrip().decode())["LeaderBoard"]
	# print ("giang",ListPlayerLeaderBoard)
	return ListPlayerLeaderBoard
	# for Player in ListPlayerLeaderBoard:
	# 	print("data  -",Player['ID'],Player['damage'],Player['kill'],Player['rank'])
		# addRank(match.pk, match.bot.pk, position=1,kills=0, damage=0, owner=True)
		

def GetFilePathDataSendToWebpage():
	"""Get absolute path"""
	path = ""
	if os.path.isfile('./' + FILE_NAME_DATA_SEND_TO_SERVER):
		path = os.path.abspath(FILE_NAME_DATA_SEND_TO_SERVER)
	return path

def HandleDataReceiveFromBot(ListRequestCurrentPlayer,playerID, dataFromBot):
	lock = threading.Lock()
	lock.acquire()
	try:
		if CheckSyntaxDataFromBot(dataFromBot):
			ListRequestCurrentPlayer[playerID] = dataFromBot
		else:
			ListRequestCurrentPlayer[playerID] = ""
	finally:
		lock.release()
	
	

def SumupDataSendToServer(ListRequestCurrentPlayer):
    return json.dumps(ListRequestCurrentPlayer)

#-----------fucntion check struct data-----------
def CheckSyntaxDataFromBot(data):
        #todo something here to check data of Bot
    return True
#--------------------------------------------------

def GetAndHandledataFromBot(ListRequestCurrentPlayer,StopThread,userId,proc):
	for line in io.TextIOWrapper(proc.stdout, encoding="utf-8"):
		if StopThread[userId]==True:
			break
		HandleDataReceiveFromBot(ListRequestCurrentPlayer,userId, line.rstrip())

def HanldeDataReceiveFromGS(StopThread,listBots,dataFromGS,ListBotsProcess):

	ListCurrentPlayer = dict()
	ListCurrentPlayer = json.loads(dataFromGS)
	CheckAndKillPlayerDead(StopThread,listBots,ListCurrentPlayer,ListBotsProcess)
	for playerID,data in ListCurrentPlayer.items():
		if StopThread[playerID] == False:
			logger.info("send data to bot : %s"%str(playerID))
			SendDataToBot(StopThread,playerID, data,ListBotsProcess)
	return ListCurrentPlayer

def SendDataToBot(StopThread,playerID, data,ListBotsProcess):
	
	try:
		if ListBotsProcess[playerID].poll() == None:
			ListBotsProcess[playerID].stdin.write(data.encode() + b"\n")
			ListBotsProcess[playerID].stdin.flush()
	except IOError as e:
		logger.warning("!!!!!!!!!!!!! Error %s"%(e))
		ListBotsProcess[playerID].kill()
		StopThread[playerID] = True
		logger.info("!!!!!!!!!!!!! Bot %s crashed. KILL"%(playerID))

def SendDataToServer(ServerProcess,message):
	ServerProcess.stdin.write(message)
	ServerProcess.stdin.flush()

def CheckAndKillPlayerDead(StopThread,listBots,ListCurrentPlayer,ListBotsProcess):
	for userId, data in listBots.items():
		if userId not in ListCurrentPlayer :
			logger.info("CheckAndKillPlayerDead %s"%(ListBotsProcess[userId].poll()))
			if ListBotsProcess[userId].poll() == None:
				logger.info("!!!!!!!!!!!!! Bot %s Died. KILL"%(userId))
				ListBotsProcess[userId].kill()
				StopThread[userId] = True

def KillProcess(ServerProcess,ListBotsProcess,ListCurrentPlayer):
	for userId, data in ListCurrentPlayer.items():
		ListBotsProcess[userId].kill()
	ServerProcess.kill()

async def HandleProcessServer(StopThread,GS_Data,listBots,ServerProcess,ListBotsProcess,ListRequestCurrentPlayer,timeout):
	ListCurrentPlayer = HanldeDataReceiveFromGS(StopThread,listBots,GS_Data,ListBotsProcess)
	count=1
	skipturn = False

	while (count<=settings.TIME_CHECK_EACH_MESSAGE and skipturn == False):
		await asyncio.sleep(timeout/settings.TIME_CHECK_EACH_MESSAGE)
		count=count+1
		shouldSkipTurn = True
		for userId, data in ListCurrentPlayer.items():
			if (StopThread[userId]==False and ListRequestCurrentPlayer[userId] ==""):
				logger.info("StopThread[userId]: %s"%userId)
				shouldSkipTurn = False
				break
		skipturn=shouldSkipTurn	
	if not skipturn :
		for userId, data in ListCurrentPlayer.items():
			if (ListRequestCurrentPlayer[userId] ==""):
				logger.info("!!!!!!!!!!!!! Bot %s Don't send data to gs when timeout. KILL"%(userId))
				ListBotsProcess[userId].kill()
				StopThread[userId]=True

	logger.info("---------------------- PORTAL PRINT ---------------- data send to server: %s"%(SumupDataSendToServer(ListRequestCurrentPlayer)))
	Player_Msg = SumupDataSendToServer(ListRequestCurrentPlayer).encode() +b"\n"
	for userId, data in ListCurrentPlayer.items():
		ListRequestCurrentPlayer[userId]=""
	SendDataToServer(ServerProcess,Player_Msg)
	
 

def Process(g_ServerStartArgs, listBots, match):
	ListBotsProcess = dict()
	ListBotsProcess = {}
	ListRequestCurrentPlayer = dict
	ListRequestCurrentPlayer={}
	ListCurrentPlayer = dict
	ListCurrentPlayer = {}
	ListPlayerLeaderBoard = []
	ServerProcess = SpawnGameserverProcess(g_ServerStartArgs,match)
	ListBotsProcess = SpawnBotsProcess(listBots, match)
	logger.info("---------------------- PORTAL GAME START --------------------------")
	###------Start Gameserver----------
	for userId, data in listBots.items():
		ListRequestCurrentPlayer[userId]=""
	match.InitMapInfo(ServerProcess.stdout.readline().rstrip().decode())
	match.save()

	GS_init_info = ServerProcess.stdout.readline()
	logger.info(b"---------------------- PORTAL PRINT ---------------- server init data -- %s"%(GS_init_info))
#send Init info:
# ===============================
	if not (GS_init_info.startswith(b"null")):
	
		threads = dict
		threads = {}
		StopThread = dict
		StopThread={}
		for userId,data in listBots.items():
			StopThread[userId] = False
			threads[userId] = threading.Thread(target=GetAndHandledataFromBot, args=(ListRequestCurrentPlayer,StopThread,userId,ListBotsProcess[userId]))
			threads[userId].start() 
		loop = asyncio.get_event_loop()
		loop.run_until_complete(asyncio.gather(HandleProcessServer(StopThread,GS_init_info,listBots,ServerProcess,ListBotsProcess,ListRequestCurrentPlayer,1)))
#-------------------------------
#Send each turn infos
		while True:
			MapInfo = ServerProcess.stdout.readline()
			logger.info("\n\n---------------------- PORTAL PRINT ----------------data gs send to gp  :   %s"%MapInfo)
			if MapInfo.startswith(b"END"):
				LeaderBoard = ServerProcess.stdout.readline()
				print ("leader board", LeaderBoard)
				ListPlayerLeaderBoard = SaveLeaderBoard(LeaderBoard)
				KillProcess(ServerProcess,ListBotsProcess,ListCurrentPlayer)
				break
			if (MapInfo.startswith(b"null") or MapInfo==b'' ):
				logger.info(b"---------------------- PORTAL PRINT ---------------- SERVER FAILED WHEN SEND DATA -----------------")
				KillProcess(ServerProcess,ListBotsProcess,listBots)
				break
			loop = asyncio.get_event_loop()
			loop.run_until_complete(asyncio.gather(HandleProcessServer(StopThread,MapInfo,listBots,ServerProcess,ListBotsProcess,ListRequestCurrentPlayer,0.1)))
	else:
		logger.info("data init null, Game can't start")
		KillProcess(ServerProcess,ListBotsProcess,listBots)
	logger.info(b"---------------------- PORTAL PRINT ---------------- END GAME -----------------")
	return ListPlayerLeaderBoard


# Main function
def StartBattle(match, listBot):
	g_ServerStartArgs = dict()
	g_ServerStartArgs = {}
	LeaderBoard = []
	listBots = LoadJsonConfig(g_ServerStartArgs, match, listBot)
	logger.info("+++++++++++++++ PORTAL PRINT ++++++++++++ server start arg  == %s \n" , json.dumps(g_ServerStartArgs))
	# Process(json.dumps(g_ServerStartArgs),listBots,match)
	LeaderBoard = Process(json.dumps(g_ServerStartArgs),listBots,match)
	return LeaderBoard
	# #Write result json file path to Webpage
	# sys.stderr.write(GetFilePathDataSendToWebpage())



