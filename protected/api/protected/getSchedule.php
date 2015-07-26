<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $schedule;

	$targetSchedule = $schedule->fetchSingleBy($data);
	$targetSchedule = db\getFullSchedule($targetSchedule);
	return $targetSchedule;
}