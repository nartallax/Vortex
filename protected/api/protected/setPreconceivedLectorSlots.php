<?php

function getApiDataTemplate(){
	return '{
		id: isInt(),
		slots: [{
			lector: isInt(),
			slot: isInt(),
			value: isInt()
		}]
	}'; 
}

function calledApiFunction($data){
	global $preconceivedLectorSlot;
	
	$sid = $data['id'];
	$preconceivedLectorSlot->delete(array('schedule' => $sid));
	
	$slots = $data['slots'];
	foreach($slots as &$slot) $slot['schedule'] = $sid;
	$preconceivedLectorSlot->createPack($slots);
}