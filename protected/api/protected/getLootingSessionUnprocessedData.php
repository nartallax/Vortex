<?php

function getApiDataTemplate(){
	return '{
		id: isInt()
	}'; 
}

function calledApiFunction($data){
	global $lootingSession;
	
	$result = $lootingSession->fetchSingleByCols($data, array('unprocessed_data'));
	return $result['unprocessed_data'];
}