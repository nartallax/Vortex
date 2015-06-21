<?php
	
function getApiDataTemplate(){
	return '{}';
}
	
function calledApiFunction($data){
	global $sessionData;
	
	if(!is_array($sessionData)) // null?
		return array('logged' => false);
	if(!$sessionData['is_admin']) 
		return array('logged' => true, 'admin' => false, 'lector_id' => $sessionData['id']);
	return array('logged' => true, 'admin' => true);
}