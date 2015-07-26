<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $schedule;
	
	$sch = $schedule->fetchSingleBy($data);
	if(!$sch['is_editable']) throw new Exception('inapplicable');
	$data['is_editable'] = false;
	$schedule->update($data);
}