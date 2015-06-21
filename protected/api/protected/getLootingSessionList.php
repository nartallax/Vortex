<?php

function getApiDataTemplate(){
	return '{}'; 
}

function calledApiFunction($data){
	global $lootingSession;
	
	return $lootingSession->fetch();
}