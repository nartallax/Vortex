<?php

function getApiDataTemplate(){
	return '{}';
}
	
function calledApiFunction($data){
	global $sessionName;
	if(is_null($sessionName))
		throw new Exception('not_logged_in');
	session::end($sessionName);
}