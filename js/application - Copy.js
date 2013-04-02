/**
 * @author Darth Talon-7
 */

/*
 * Daniel Fallon
 * 2/23/2013
 * Card movement and handling
 *
 *these three functions are used externally, others should be left alone unless absolutely necessary
 * cardId - is the card's id
 * locId - is the absolute location ID as will be provided by the server
 * cardInfo - is the information about the card in the format: "2D" "3C" denoting the 2 of diamonds and the 3 of clubs respectively
 *
 * updateCard moves the card to a new location, or changes its info. 
 * createCard creates a new card
 * destroyCard destroys an individual card by id
 * destroyAll destroys all cards on field
 * 
 */
updateCard = function(cardId, locId, cardInfo){
	pixelLoc = getPixelLoc(parseInt(locId.split(':')[0]),parseInt(locId.split(':')[1]),swappedLocIds);
	if(cardInfo ==="")
		cardInfo = "back";
	update($("[data-cardId="+cardId+"]"),$('<div></div>').attr('data-locID',locId).removeClass().addClass('card').addClass(cardInfo).css('left', pixelLoc[0]).css('top', pixelLoc[1]).data('rotation', pixelLoc[2]).css('z-index', pixelLoc[3]).css('background-image', "url(/images/"+cardInfo+".png)"));

	
}

createCard = function(cardId, locId, cardInfo){
	startingLocId = "1:0";
	startingPixelLoc = getPixelLoc(parseInt(startingLocId.split(':')[0]),parseInt(startingLocId.split(':')[1]),swappedLocIds); //setting pixel locs for deck where card will be taken from
	var newCard = $('<div></div').addClass("card").attr('data-cardId',cardId).addClass(cardInfo).css('left',startingPixelLoc[0]).css('top', startingPixelLoc[1]).data('rotation', startingPixelLoc[2]).css('z-index', startingPixelLoc[3]);
	pixelLoc = getPixelLoc(parseInt(locId.split(':')[0]),parseInt(locId.split(':')[1]),swappedLocIds);
	newCard.appendTo($('#wrapper'));
	if(cardInfo ==="")
		cardInfo = "back"
	newCard.bind('dblclick', function(event) {})
	update(newCard,$('<div></div>').attr('data-locID', locId).css('left', pixelLoc[0]).css('top', pixelLoc[1]).data('rotation', pixelLoc[2]).css('z-index', pixelLoc[3]).css('background-image', "url(/images/"+cardInfo+".png)"));
}

destroyCard = function(cardId){
	$('[data-cardId='+cardId+']').remove(); //find card id, remove its object.
}

destroyAll = function(){
	$('.card').remove();
}

getPixelLoc = function(mapLoc,subLoc,swappedLocation){ 
		//returns [left,top,rotation,z-index]
	mainLocations = [
		//[    left , top, rotation]
		[(windowWidth/2)-135,(windowHeight/2)-88, 0], //loc 0
		[(windowWidth/2)+10,(windowHeight/2)-88, 0], //loc 1
		[windowWidth/2, windowHeight-195, 0], //loc 2
		[(25+20), (windowHeight/2)-25, 90], //loc 3
		[(windowWidth/2)-125, 20, 180], //loc 4
		[windowWidth-170, (windowHeight/2)-150, -90], //loc 5
	];
	
	returnLocation = [
			//left
				mainLocations[swappedLocation[mapLoc]][0]+((!(swappedLocation[mapLoc] == 0 || swappedLocation[mapLoc] == 1))?(Math.round(Math.cos(mainLocations[swappedLocation[mapLoc]][2] * Math.PI/180))*(Math.floor((125/2)*(subLoc-3)))):0),
			//top
				mainLocations[swappedLocation[mapLoc]][1]+((!(swappedLocation[mapLoc] == 0 || swappedLocation[mapLoc] == 1))?(Math.round(Math.sin(mainLocations[swappedLocation[mapLoc]][2] * Math.PI/180))*(Math.floor((125/2)*(subLoc-3)))):0),
			//rotation
				mainLocations[swappedLocation[mapLoc]][2],
				subLoc
	];
	
	return returnLocation;
	
}

update = function(card, newCard){
	card.attr('class', newCard.attr('class'));
	card.attr('data-locId', newCard.attr('data-locId'));
	card.animate({top: newCard.css('top'), left: newCard.css('left')}, 1500);
	card.rotate({animateTo: newCard.data('rotation')});
	card.data('rotation',newCard.data('rotation'));
	card.css('z-index',newCard.css('z-index'));
	card.css('background-image', newCard.css('background-image'));
}
var windowHeight;//setting window height/width to be global constants prevent resize
var windowWidth;
var swappedLocIds = [0,1,2,3,4,5];
$(document).ready(function() {
	windowHeight = $(window).height();
	windowWidth = $(window).width();
	//update($(".card"),$('<div></div>').addClass('card').addClass('ridiculous').data('rotation',90).css('top',200).css('left',500));
	
});

