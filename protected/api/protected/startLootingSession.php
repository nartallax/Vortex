<?php

function getApiDataTemplate(){
	return '{
		unprocessed_data: isStr(),
		
		note?: isStr() || isNull()
	}'; 
}

function calledApiFunction($data){
	global $lootingSession;
	
	$data['looting_end'] = null;
	$result = $lootingSession->create($data);
	return $result['id'];
}