<?php

function getApiDataTemplate(){
	return '{
		name: isStr(),
		duration: isInt() && me > 0,
		id: isInt(),
		
		note?: isStr() || isNull()
	}';
}

function calledApiFunction($data){
	global $schedule;
	
	if(!isset($data['note'])) $data['note'] = null;
	
	$schedule->update($data);
}