<?php

function getApiDataTemplate(){
	return '{}';
}
	
function calledApiFunction($data){ 
	global $schedule;
	
	$mainSchedule = $schedule->fetchSingleBy(array('is_main' => true));
	$mainSchedule = db\getTruncatedSchedule($mainSchedule);
	return $mainSchedule;
}