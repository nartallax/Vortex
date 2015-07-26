<?php

function getApiDataTemplate(){
	return '{}'; 
}

function calledApiFunction($data){
	global $sessionData;
	global $preconceivedLectorSlot;
	
	return $preconceivedLectorSlot->fetchByCols(array('lector' => $sessionData['id']), array('schedule', 'slot', 'value'));
}