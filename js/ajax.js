    //
    // As mentioned at http://en.wikipedia.org/wiki/XMLHttpRequest
    //
    if( !window.XMLHttpRequest ) XMLHttpRequest = function()
    {
      try{ return new ActiveXObject("Msxml2.XMLHTTP.6.0") }catch(e){}
      try{ return new ActiveXObject("Msxml2.XMLHTTP.3.0") }catch(e){}
      try{ return new ActiveXObject("Msxml2.XMLHTTP") }catch(e){}
      try{ return new ActiveXObject("Microsoft.XMLHTTP") }catch(e){}
      throw new Error("Could not find an XMLHttpRequest alternative.")
    };

    //
    // Makes an AJAX request to a local server function w/ optional arguments
    //
    // functionName: the name of the server's AJAX function to call
    // opt_argv: an Array of arguments for the AJAX function
    //
    function Request(function_name, opt_argv) {

      if (!opt_argv)
        opt_argv = new Array();

      // Find if the last arg is a callback function; save it
      var callback = null;
      var len = opt_argv.length;
      if (len > 0 && typeof opt_argv[len-1] == 'function') {
        callback = opt_argv[len-1];
        opt_argv.length--;
      }
      var async = (callback != null);

      // Encode the arguments in to a URI
      var query = 'action=' + encodeURIComponent(function_name);
      for (var i = 0; i < opt_argv.length; i++) {
        var key = 'arg' + i;
        var val = JSON.stringify(opt_argv[i]);
        query += '&' + key + '=' + encodeURIComponent(val);
      }

      // Create an XMLHttpRequest 'GET' request w/ an optional callback handler
      var req = new XMLHttpRequest();
      req.open('GET', '/rpc?' + query, async);

      if (async) {
        req.onreadystatechange = function() {
          if(req.readyState == 4 && req.status == 200) {
            var response = null;
            try {
             response = JSON.parse(req.responseText);
            } catch (e) {
             response = req.responseText;
            }
            callback(response);
          }
        }
      }

      // Make the actual request
      req.send(null);
    }

    // Adds a stub function that will pass the arguments to the AJAX call
    function InstallFunction(obj, functionName) {
      obj[functionName] = function() { Request(functionName, arguments); }
    }


    // Server object that will contain the callable methods
    var server = {};

    // Insert 'Add' as the name of a callable method
    InstallFunction(server, 'start_game');
    InstallFunction(server, 'draw');
    InstallFunction(server, 'place');
    InstallFunction(server, 'choose_target');
    InstallFunction(server, 'choose_flag');
    InstallFunction(server, 'req_update');
    InstallFunction(server, 'quit')
    
    // For debugging
    InstallFunction(server, 'add_player')
    InstallFunction(server, 'clear_game')


    /* Request for updating when the page is loaded
     */
    window.onload = function() {req_update()}


    // Handy "macro"
    function start_game() {
    	server.start_game(checkRep);
    }
    
    function req_update() {
        server.req_update(checkRep);
    }

    // user action
    function draw() {
	  	server.draw(checkRep);
    }
    
    function place(cardid) {
	  	server.place(parseInt(cardid), checkRep);
    }

    function choose_target(player_name, actionmode) {
        server.choose_target(player_name, actionmode,checkRep);
    }

    function choose_flag(cardid,flag) {
        server.choose_flag(cardid,flag,checkRep);
    }
    

    function wait() {
        server.req_update(checkRep);
    }

    
    function quit() {
        server.quit();
        document.location.reload(true);
    }

    function clear_game() {
      server.clear_game()
      destroyAll();
    }

    function add_player() {
      server.add_player(checkRep);
    }


    function checkRep(response) {
      var local_info = {}
      local_info = response;
      $('#old-local-info').data('old-local-info',local_info);

      if (response.error) {
        //check error
        document.getElementById('error').innerHTML = response.error;
      }
      else {
        document.getElementById('error').innerHTML = "";
      }
              //change display of start/clear button
        if(response.info === 'nogame'){
          $('.ingame').css('display','none');
          $('.outgame').css('display','block');
          return
        }
        if (response.your_mode == 'wait') {
          setTimeout(wait, 2000);
        }
        
        
      $('.ingame').css('display', 'block');
      $('.outgame').css('display', 'none');

      //each action receive an updateAll response
      updateAll(response);
    }



    
