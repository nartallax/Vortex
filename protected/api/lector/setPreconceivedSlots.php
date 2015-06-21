<?php

function getApiDataTemplate(){
	return '[{
		value: isInt() && (me == 1 || me == -1 || me == -2),
		slot: isInt(),
		schedule?: isInt() || isNull()
	}]'; 
}

function calledApiFunction($data){
	global $sessionData;
	global $schedule;
	global $preconceivedLectorSlot;
	
	$sch = null;
	$lector = $sessionData['id'];
	foreach($data as &$slot){
		$slot['lector'] = $lector;
		if(!isset($slot['schedule'])){
			if(!isset($sch)){
				$sch = $schedule->fetchSingleBy(array('is_main' => true));
				if(!isset($sch['id'])) throw new Exception('inavailable');
				$sch = $sch['id'];
			}
			$slot['schedule'] = $sch;
		}
	} unset($slot);
	
	$preconceivedLectorSlot->delete(array('lector' => $lector));
	$preconceivedLectorSlot->createPack($data);
}