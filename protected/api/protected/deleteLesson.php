<?php

function getApiDataTemplate(){
	return '{
		id: isInt(),
		schedule: isInt()
	}'; 
}

function calledApiFunction($data){
	global $lesson;
	global $schedule;

	$sch = $schedule->fetchSingleBy(array('id' => $data['schedule']));
	if(!$sch['is_editable']) throw new Exception('inapplicable');

	$lesson->delete($data);
}