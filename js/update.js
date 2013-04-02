    /**************
    Check & Update:

    Check the Action of Client & judge the validity;
    Determine enter into Ajax or not & create corresponding response.

    **************/    
    //
    //
    //
    //check action's validity:
    //check turn & mode.
    check = function(obj, local_info) {

      if (local_info.current == local_info.your_seat) {
        //if it's your turn
        /*if(local_info.your_HP != 1)
        {
          return null;
        }*/ 
        //then check action

        if (local_info.your_mode == 'place') {
          if (translate_back(obj.attr('data-locId').split(':')[0], local_info.your_seat) == local_info.your_seat) {
            place(obj.attr('data-cardId'));
          }
        }
        else if (local_info.your_mode == 'choose_target') {
          choose_target(obj.html(), local_info.target_mode);
        }
        else if (local_info.your_mode == 'choose_flag') {
          
          choose_flag(parseInt(obj.val()));
        }
        else {
          //for invalide action, show hint in the status.
          //$('#status').text("valide operation, please.");
          return null;
        }
      }
      else {
        //if it's not your turn, should wait
        return null;
      }
    }

    //update all game Info as the response
    updateAll = function(response) 
    {
      //update hands
      updatehands(response);

      //update grave
      if(response.grave)
      {
        for(var i=0; i<response.grave.length; i++)
        {
          updateCard(response.grave[i][0], "0:0", response.grave[i][1]);
        }
      }
      //update deck
      createCard(response.deck, "1:0","");

      //update score
      updateScore(response);

      //update clockwise
      updateDirection(response);

      //update current
      updateCurrent(response);
    }
      
    //update hands
    updatehands = function(response) {
      if(response.your_mode == "choose_flag")
      {
        $('#flag').css('display', 'block');
        $('#plus').val("+" + response.flag);
        $('#minus').val("-" + response.flag);
      }
      else
      {
        $('#flag').css('display', 'none');
      }

      for(var i=0; i<response.players.length; i++)
        {
          var offset = parseInt(response.your_seat)
          var locid = (parseInt(response.players[i].seat) + 4 - offset) % 4 + 2;
          // update playername
          $("#p"+locid).html(response.players[i].name).css('color','white');
          $("#p"+((response.current + 4 - offset) % 4 + 2)).css('color','red');

          if(response.players[i].cards)
          {
            //translate back: (locid + offset) % 4
            for(var j=0; j<response.players[i].cards_id.length; j++)
            {
              if ($("div[data-cardId=" + response.players[i].cards_id[j]+ "]").length == 0) {
                //check whether the card is exit or not
                createCard(response.players[i].cards_id[j], locid + ":" + j, response.players[i].cards[j]);
              }
              else {
                updateCard(response.players[i].cards_id[j], locid + ":" + j, response.players[i].cards[j]);
              }
            }
          }
          else {
            for(var j=0; j<response.players[i].cards_id.length; j++)
            {
              if ($("div[data-cardId=" + response.players[i].cards_id[j]+ "]").length == 0) {
                //check whether the card is exit or not
                createCard(response.players[i].cards_id[j], locid + ":" + j, "");
              }
              else {
                updateCard(response.players[i].cards_id[j], locid + ":" + j, "");
              }
            }
          }
        }
    }

    //update score
    updateScore = function(response) {
      $('#score').text(response.score);
    }

    //update current
    updateCurrent = function(response) {
      $('#current').text(response.current);
    }

    //update clockwise
    updateDirection = function(response) {
      $('#direction').text(response.direction);
    }

    //translate back location Id
    translate_back = function(locid, offset) {
      return (locid - 2 + offset) % 4
    }