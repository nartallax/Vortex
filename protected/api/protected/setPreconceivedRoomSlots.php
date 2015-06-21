<?php

function getApiDataTemplate(){
	return '{
		id: isInt(),
		slots: [{
			room: isInt(),
			slot: isInt(),
			value: isInt()
		}]
	}'; 
}

function calledApiFunction($data){
	global $preconceivedRoomSlot;
	
	$sid = $data['id'];
	$preconceivedRoomSlot->delete(array('schedule' => $sid));
	
	$slots = $data['slots'];
	foreach($slots as &$slot) $slot['schedule'] = $sid;
	$preconceivedRoomSlot->createPack($slots);
}