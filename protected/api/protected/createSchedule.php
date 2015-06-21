<?php

function getApiDataTemplate(){
	return '{
		name: isStr(),
		duration: isInt(),
		
		note?: isStr() || isNull()
	}'; 
}

function calledApiFunction($data){
	global $schedule;

	if(!isset($data['note'])) $data['note'] = null;
	
	$result = $schedule->create($data);
	return $result['id'];
}