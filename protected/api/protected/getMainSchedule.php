<?php

function getApiDataTemplate(){
	return '{}'; 
}

function calledApiFunction($data){
	global $schedule;

	
	$targetSchedule = $schedule->fetchSingleBy(array('is_main' => true));
	if(!isset($targetSchedule['id'])) return array();
	$targetSchedule = db\getFullSchedule($targetSchedule);
	return $targetSchedule;
}