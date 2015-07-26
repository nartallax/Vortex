<?php

function getApiDataTemplate(){
	return '{
		unprocessed_data: isStr() || isNull(),
		id: isInt(),
		
		shards?: [{
			lector?: isStr() || isNull(),
			room?: isStr() || isNull(),
			building?: isStr() || isNull(),
			subject?: isStr() || isNull(),
			slot?: isStr() || isNull(),
			cohort?: isStr() || isNull(),
			source?: isStr() || isNull()
		}]
	}'; 
}

function calledApiFunction($data){
	global $lootingSession;
	global $lootingShard;
	
	if(isset($data['shards'])){
		$shards = $data['shards'];
		unset($data['shards']);
		foreach($shards as &$shard)
			$shard['looting_session'] = $data['id'];
			
		$lootingShard->createPack($shards);
	}
	
	$lootingSession->update($data);
	if(!isset($data['unprocessed_data']) || trim($data['unprocessed_data']) === '')
		$lootingSession->updateFieldsWithDefaults(array('id' => $data['id']) ,array('looting_end'));
}