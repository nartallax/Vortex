<?php

function getApiDataTemplate(){
	return '{
		value: isInt()
	}';
}
	
function calledApiFunction($data){ 
	file_put_contents('./vars/week_shift', $data['value']);
}