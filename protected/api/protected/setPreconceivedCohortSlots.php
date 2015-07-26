<?php

function getApiDataTemplate(){
	return '{
		id: isInt(),
		slots: [{
			cohort: isInt(),
			slot: isInt(),
			value: isInt()
		}]
	}'; 
}

function calledApiFunction($data){
	global $preconceivedCohortSlot;
	
	$sid = $data['id'];
	$preconceivedCohortSlot->delete(array('schedule' => $sid));
	
	$slots = $data['slots'];
	foreach($slots as &$slot) $slot['schedule'] = $sid;
	$preconceivedCohortSlot->createPack($slots);
}