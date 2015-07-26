<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $lootingSession;
	global $lootingShard;
	
	$result = $lootingSession->fetchSingleBy($data);
	
	if(isset($result['looting_end']))
		$result['shards'] = $lootingShard->fetchByCols(array('looting_session' => $data['id']), array('lector', 'room', 'building','subject', 'slot', 'cohort', 'source'));
	
	return $result;
}