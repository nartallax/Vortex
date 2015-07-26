<?php
	
function getApiDataTemplate(){
	return '{}';
}
	
function calledApiFunction($data){ 
	global $changeset;
	global $schedule;
	
	$main = $schedule->fetchSingleBy(array('is_main' => true));
	if(!isset($main['id'])) return array();
	$main = $main['id'];
	
	$sets = $changeset->fetchBy(array('schedule' => $main, 'is_published' => false));
	$result = array();
	
	foreach($sets as $set){
		foreach($set['changes'] as &$change){
			if(!isset($change['proposer'])) continue;
			unset($change['changeset']);
			$result[] = $change;
		}
	}
	
	return $result;
}