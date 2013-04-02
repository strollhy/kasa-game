#!/usr/bin/env python
#
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Hongyu Song
# 2/23/2013


import webapp2
import os
import jinja2
import json
import datetime
import hmac

from google.appengine.api import memcache

template_dir = os.path.join(os.path.dirname(__file__), 'templates')
jinja_env = jinja2.Environment(loader = jinja2.FileSystemLoader(template_dir),
                               autoescape = True)

def render_str(template, **params):
    t = jinja_env.get_template(template)
    return t.render(params)

#####################################
### hash code for cookie
secret = "a123shy"

def make_secure_val(val):
    return "%s|%s" % (str(val), hash_str(val))

def check_secure_val(secure_val):
    val = secure_val.split('|')[0]
    if secure_val == make_secure_val(val):
        return val

def hash_str(s):
    return hmac.new(secret,s).hexdigest()
######################################

class MainHandler(webapp2.RequestHandler):
    def write(self, *a, **kw):
        self.response.out.write(*a, **kw)

    def render_str(self, template, **params):
        return render_str(template, **params)

    def render(self, template, **kw):
        self.write(self.render_str(template, **kw))

    def setCookie(self, info, val):
        cookie_val = make_secure_val(val)
        expTime = (datetime.datetime.now() + datetime.timedelta(weeks=3)).strftime('%a, %d %b %Y %H:%M:%S GMT')
        self.response.headers.add_header(
            'Set-Cookie',
            '%s=%s; Path=/; expires=%s' % (info, cookie_val, expTime))

    def readCookie(self, name):
        cookie_val = self.request.cookies.get(name)
        if cookie_val and check_secure_val(cookie_val):
            return cookie_val.split('|')[0]

    def login(self, info):
        self.setCookie('user', info)

    def logout(self):
        expTime = (datetime.datetime.now() - datetime.timedelta(weeks=3)).strftime('%a, %d %b %Y %H:%M:%S GMT')
        self.response.headers.add_header(
            'Set-Cookie',
            'user=; Path=/; expires=%s' % expTime)
############# Kasa game #############
from board import Board

def start_game():
    board = Board()
    return board

def cache_room(rid):
    memcache.set('room_num', rid)
    memcache.set('room%s' % rid, start_game())

def create_room():
    room_num = memcache.get('room_num')
    if not room_num:
        room_num = 1
        cache_room(room_num)

    else:
        room_num += 1
        cache_room(room_num)

#####################################
### Ajax stuff
class RPCHandler(MainHandler):
    def get(self):
        info = {}
        room = "None"
        action = self.request.get('action')
        user_info = self.readCookie('user') 
        if user_info:
            user_name = user_info.split('@')[0]
            room = user_info.split('@')[1]
        
        board = memcache.get(room)
        ### requests 
        if action == 'start_game':
            board = memcache.get("room1")
            if not board:
                create_room()
                board = start_game()
                user_name = 'Player0'
                board.add_player(user_name)
                board.players[user_name].mode = 'wait'

                self.login('Player0@room1')

            else:
                if len(board.players) == 4:
                    info['error'] = 'Sorry, room is full'
                    self.response.write(json.dumps(info))  
                    return
                else:
                    user_name = 'Player%s' % len(board.players)
                    board.add_player(user_name)
                    self.login('%s@room1' % user_name)

                    if len(board.players) >= 2 :
                        board.players['Player0'].mode = 'place'


        elif action == 'place':
            cardId = self.request.get('arg0')
            if cardId:
                board.playerPlace(user_name, int(cardId))
            
        elif action == 'choose_target':
            dst_name = self.request.get('arg0') 
            target_mode = self.request.get('arg1')
            if dst_name and target_mode:
                board.playerTarget(int(target_mode), user_name, dst_name.split('"')[1])

        elif action == 'choose_flag':
            flag = self.request.get('arg0')
            if flag:
                board.playerFlag(int(flag), user_name)

        elif action == 'quit':
            self.logout()

        # for debug
        elif action == 'clear_game':
            memcache.flush_all()
            return

        elif action == 'add_player':
            user_name = 'Player%s' % len(board.players)
            board.add_player(user_name)
            if len(board.players) == 4:
                board.players['Player0'].mode = 'place'


        if board:
            info = board.update_all(user_name)
        else:
            info['info'] = 'nogame'

        memcache.set('room1', board)  
        if len(board.players) < 2:
            info['error'] = 'Please wait for one more player'
        self.response.write(json.dumps(info))        

    def post(self):
        pass


### Pages
class HomePage(MainHandler):
    def get(self):
        self.render('home.html')

    def post(self):
        pass

class RoomPage(MainHandler):
    def get(self):
        self.render('home.html')

    def post(self):
        pass



app = webapp2.WSGIApplication([
    ('/', HomePage),
    ('/room', RoomPage),
    ('/rpc', RPCHandler)
], debug=True)



