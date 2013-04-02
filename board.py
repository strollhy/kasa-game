import random
########################################################################
###	Kasa Game
###
### Hongyu Song
### 2/23/2013
###
### All check and update actions after player placing a card are implement in class Board
########################################################################
class Card():
	map = {'2': 2,'3': 3,'6': 6,'8': 8,'9': 9, 'K':99,
			 'A': 1, '4': 4, '5': 5, '7': 7, 'T': 10, 'Q': 20, 'J': 11}
	action = [1, 5, 7, 10, 11, 20]

	def __init__(self, val, suit):
		self.val = val
		self.suit = suit
			
	@property
	def get(self):
		return self.val + self.suit
	
	@property
	def getValue(self):
		return self.map[self.val]
	
	@property
	def isScore(self):
		return not self.getValue in self.action

##############################################################
###	
##############################################################
class Player():
	def __init__(self, name, seat, deck):
		self.name = name
		self.mode = 'wait'
		self.seat = seat
		self.hand = []
		self.status = 1 # 1 alive

		for i in range(5):
			self.draw(deck)
			
	def draw(self, dst, indx = 0):
		cardId = dst.pop(indx)
		self.hand.append(cardId)

					
	def place(self, cardId, dst):
		self.hand.remove(cardId)
		dst.append(cardId)
		

	# withdraw all cards after death
	def withdraw(self, dst):
		while(len(self.hand) > 0):
			self.place(self.hand[0], dst)

	# output all player's information
	@property
	def outInfo(self):
		p = {}
		p['name'] = self.name
		p['mode'] = self.mode
		p['seat'] = self.seat
		p['cards_id'] = self.hand
		p['status'] = self.status
		return p

###################################################
class Board:
	#intialize deck and all status
	org_deck = [Card(r,s) for r in '23456789TJQKA' for s in 'SHDC']
	
	def __init__(self):
		self.deck = [cardId for cardId in range(len(self.org_deck))]
		random.shuffle(self.deck)
		self.grave = []

		#dictionary of card id
		self.c_list = {self.deck[i] : self.org_deck[i] for i in range(len(self.deck))}
		random.shuffle(self.deck)
		
		#for storing players
		self.players = {}
		self.names = []		
		
		#### status 
		self.score = 0
		self.clockWise = 1
		self.next = 1

		self.your_mode = ''
		self.target_mode = 0
		self.flag = 10
		self.current = 0

	# move turn to next player
	@property
	def Next(self):
		self.current = self.next
		next_name = self.names[self.current]
		self.players[next_name].mode = 'place'
		
		self.next += self.clockWise
		self.next = self.next % len(self.players)
		while self.players[self.names[self.next]].status == -1:
			self.next += self.clockWise
			self.next = self.next % len(self.players)


	# send all players' info to client
	def update_all(self, pname):
		Info = {}
		players = []
		for player_name in self.players.keys():
			player = self.players[player_name]
			#should show hands for me
			if player_name == pname:
				my_info = player.outInfo
				cards = []
				for i in range(len(my_info['cards_id'])):
					cards.append(self.c_list[my_info['cards_id'][i]].get)
				my_info['cards'] = cards
				players.append(my_info)
				Info['your_HP'] = player.status
				Info['your_seat'] = player.seat
				Info['your_mode'] = player.mode
			else:
				players.append(player.outInfo)

		Info['action'] = 'update'
		Info['players'] = players
		Info['score'] = self.score
		Info['clockWise'] = self.clockWise
		Info['current'] = self.current
		Info['next_one'] = self.next
		Info['target_mode'] = self.target_mode
		Info['flag'] = self.flag
		Info['deck'] = self.deck[0]
		if self.grave:
			Info['grave'] = [[self.grave[i], self.c_list[self.grave[i]].get] for i in range(len(self.grave)) ]
		return Info

	#re-shuffle the deck
	def __reshuffle():
		self.deck = self.grave
		self.grave = []
		#dictionary of card id
		random.shuffle(self.deck)
		self.c_list = {self.deck[i] : self.org_deck[i] for i in range(len(self.deck))}
		random.shuffle(self.deck)

	#swap hands		
	def __swap(self, p1, p2):
		tmp = p1.hand
		p1.hand = p2.hand
		p2.hand = tmp
	
	#update board	
	def __update(self, val):
		if val == 99:
			self.score = 99
			return True
		if (self.score + val > 99):
			return False
		else:
			self.score += val
		return True

	
	#check card value & send further request
	def __check(self, player_name, cardId, flag=""):
		card = self.c_list[cardId]
		val = card.getValue
		src = self.players[player_name]

		if card.isScore :
			if self.__update(val) is False:
				self.players[player_name].status = 0
				self.players[player_name].withdraw(self.grave)
				src.mode = "wait"
				#del self.players[player_name]
				#self.names.remove(player_name)
				self.Next
			else:
				self.playerDraw(player_name)
		
		elif card.getValue in [1,5,7]:
			src.mode = 'choose_target' 
			self.target_mode = card.getValue

		elif card.getValue in [10,20]:
			src.mode = 'choose_flag'
			self.flag = card.getValue 

		elif card.getValue == 11:
			self.playerDraw(player_name)

		elif card.getValue == 4:
			self.clockWise == - self.clockWise
			src.mode = 'wait'
			self.Next

	def add_player(self, name):
		# index player object by the name
		self.players[name] = Player(name, len(self.players.keys()), self.deck)
		self.names.append(name)

	### Player's Turn
	### Handle responses from client
	def playerPlace(self, src_name, cardId, flag=None):
		self.players[src_name].place(cardId, self.grave)
		self.__check(src_name, cardId)
		#while(self.players[self.players.keys[self.next]].status == -1):
			#self.next += self.clockWise
		
	#Target a player
	def playerTarget(self, target_mode, src_name, dst_name):
		src = self.players[src_name]
		dst = self.players[dst_name]
		
		if target_mode == 1:
			cardId = src.draw(dst.hand, indx = random.randint(0, len(dst.hand) - 1))
		
		elif target_mode == 5:
			self.next = dst.seat

		elif target_mode == 7:
			self.__swap(src, dst)

		src.mode = 'wait'
		self.Next


	def playerFlag(self, flag, src_name):
		src = self.players[src_name]
		self.__update(flag)
		src.draw(self.deck)

		src.mode = 'wait'
		self.Next
		

	def playerDraw(self, src_name):
		src = self.players[src_name]
		if len(self.deck) == 0:
			self.__reshuffle()
		src.draw(self.deck)

		src.mode = 'wait'
		self.Next

