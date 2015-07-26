<?php

/* в этом файле хранятся разные функции, которые больше некуда приткнуть */

function reindex($arr, $col){
	$result = array();
	foreach($arr as $v) $result[$v[$col]] = $v;
	return $result;
}

function arrcol($arr, $col){
	$result = array();
	foreach($arr as $v) $result[] = $v[$col];
	return $result;
}

function mergeTables($a, $b){
	$l = count($a);
	$result = array();
	while($l-->0) $result[] = array_merge($a[$l], $b[$l]);
	return $result;
}

function roundTimestampToDays($ts){ return $ts - ($ts % (60 * 60 * 24)); }

function getPrefixedFlagKeyStrict($arr, $prefix){
	$len = strlen($prefix);
	$key = null;
	foreach($arr as $k => $v)
		if($v && substr($k, 0, $len) === $prefix){
			if($key === null) $key = $k;
			else throw new Exception('server_error');
		}
	return $key;
}

function getPrefixedFlagKey($arr, $prefix){
	$len = strlen($prefix);
	foreach($arr as $k => $v)
		if($v && substr($k, 0, $len) === $prefix)
			return $k;
	return null;
}

/*
	возвращает список путей к файлам - 
		сначала файлы в текущей директории, отсортированы по возрастанию, 
		потом - в поддиректориях, рекурсивно
	такой порядок файлов - важный кусок логики! не менять
 */
function getFilesRecursive($path, $ext = null){
	$result = array();
	$dirs = array();
	
	if(!($dirHandle = opendir($path))) throw new Exception('server_error');
	
	while (false !== ($entry = readdir($dirHandle))){
		if($entry === '.' || $entry === '..') continue;
		$entry = $path.'/'.$entry;
		if(is_file($entry)){
			if($ext === null || utils::endsWith($entry, $ext))
				$result[] = $entry;
		} else $dirs[] = $entry;
	}
	closedir($dirHandle);
	
	sort($result);
	sort($dirs);

	foreach($dirs as $dir) 
		$result = array_merge($result, getFilesRecursive($dir, $ext));
	return $result;
}

class utils {
	
	public static function classContainsMethod($className, $methodName){
		$reflection = new ReflectionClass($className);
		$methods = $reflection->getMethods();
		foreach($methods as $value)
			if($value->name == $methodName)
				return true;
		return false;
	}
	
	public static function HttpRequest($host, $port, $path, $method, $headers, $body, $timeout, $charset){
		if(is_null($charset) || $charset == '')
			$charset = 'UTF-8';
		
		$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
		socket_connect($socket, $host, $port);
		
		$tmp = "$method $path HTTP/1.1\r\n";
		socket_send($socket, $tmp, strlen($tmp), 0);
		
		if(!array_key_exists('Host', $headers)) $headers['Host'] = $host;
		if(!array_key_exists('Connection', $headers)) $headers['Connection'] = 'close';
		foreach($headers as $name => $value){
			$tmp = "$name: $value\r\n";
			socket_send($socket, $tmp, strlen($tmp), 0);
		}
		$tmp = "\r\n$body\r\n";
		socket_send($socket, $tmp, strlen($tmp), 0);
		
		$response = '';
		$result = true;
		
		//status line
		$statusLine = socket_read($socket, 65535, PHP_NORMAL_READ);
		preg_match('/(?:\s|^)(\d+)(?:\s|$)/', $statusLine, $statusGroups);
		if(count($statusGroups) > 1) $statusCode = intval($statusGroups[1]);
		else $statusCode = null; // not defined
		
		// headers
		$headers = array();
		while(true){
			$header = socket_read($socket, 65535, PHP_NORMAL_READ);			
			if($header === "\n") continue; // just end of previous line, nothing special, pass
			if($header === "\r") break; // empty line, no more headers
			$breaker = strpos($header, ':');
			$name = trim(substr($header, 0, $breaker));
			$value = trim(substr($header, $breaker + 1));
			if(array_key_exists($name, $headers)) $headers[$name][] = $value;
			else $headers[$name] = array($value);
		}
		socket_read($socket, 1024, PHP_NORMAL_READ); // reading the remaining \n
		
		// chunked body detection
		$chunkedEncoding = false;
		if(array_key_exists('Transfer-Encoding', $headers))
			foreach($headers['Transfer-Encoding'] as $headerVal)
				if(strtolower($headerVal) === 'chunked'){
					$chunkedEncoding = true;
					break;
				}
				
		//body reading
		if($chunkedEncoding) while(true){
			$buffer = socket_read($socket, 1024, PHP_NORMAL_READ);
			if($buffer{strlen($buffer) - 1} === "\r") $buffer .= socket_read($socket, 1024, PHP_NORMAL_READ);
			preg_match('/([a-fA-F\d]+)/', $buffer, $chunkedHeaderGroups);
			if(count($chunkedHeaderGroups) > 1){
				$chunkLength = hexdec(strtolower($chunkedHeaderGroups[1]));
				//echo("Header: '$chunkLength' <= '$buffer'");
			}
			else{
				//echo("CRITICAL ERROR: '$buffer'");
				//echo($response);
				//exit();
				break;
			}
			if($chunkLength === 0) break; // reached the end
			//$buffer = socket_read($socket, $chunkLength, PHP_BINARY_READ) . socket_read($socket, 1024, PHP_NORMAL_READ) . socket_read($socket, 1024, PHP_NORMAL_READ);
			while($chunkLength > 0){
				$chunkLength -= socket_recv($socket, $buffer, $chunkLength, MSG_WAITALL);
				$response .= $buffer;
			}
			socket_read($socket, 1024, PHP_NORMAL_READ); // read \r at the end of chunk
			socket_read($socket, 1024, PHP_NORMAL_READ); // read \n at the end of chunk
			//echo("Data: '$buffer'");
		}
		else while(true){
			$buffer = socket_read($socket, 1024, PHP_BINARY_READ);
			if($buffer === false || $buffer === '')
				break;
			$response .= $buffer;
		}
		socket_close($socket);
		
		$response = mb_convert_encoding($response, 'UTF-8', $charset);
		
		return array('status' => $statusCode, 'headers' => $headers, 'body' => $response);
	}
	
	public static function startsWith($data, $search) {
		return substr($data, 0, strlen($search)) === $search;
	}
	
	public static function endsWith($data, $search){
		$searchlen = strlen($search);
		return substr($data, strlen($data) - $searchlen, $searchlen) === $search;
	}
	
	public static function getDirFileList($path){
		$result = array();
		if ($dirHandle = opendir($path)) {
			while (false !== ($entry = readdir($dirHandle)))
				if($entry != '.' && $entry != '..' && is_file($path.'/'.$entry))
					$result[] = $entry;
			closedir($dirHandle);
		}
		sort($result);
		return $result;
	}
	
	public static function regexpExtract($input, $regexp){
		preg_match('/' . $regexp . '/', $input, $groups);
		return $groups[1];
	}
	
	public static function numArrayToSqlList($arr){
		$result = '(';
		$firstElement = true;
		foreach($arr as $num){
			if($firstElement)
				$firstElement = false;
			else
				$result .= ',';
			$result .= $num;
		}
		return $result . ')';
	}
	
	public static function extractColumnFromTable($table, $colName){
		$result = array();
		foreach($table as $row)
			$result[] = $row[$colName];
		return $result;
	}
	
	public static function getFileExtension($filename){
		return strtolower(utils::regexpExtract($filename, '([a-zA-Z\-_]*)$'));
	}
	
	public static function getUniqueFileNameInDirectory($dirPath, $sourceName){
		do{
			$filename = md5(utils::getTimestamp()) . md5($sourceName);
		}while(file_exists($dirPath . $filename));
		return $filename;
	}
	
	public static function getTimestamp(){
		//return date_timestamp_get(date_create('now', new DateTimeZone('UTC')));
		return time();
	}
	
	public static function parseIntCol($arr, $colName){
		foreach($arr as $key=>$row)
			$arr[$key][$colName] = intval($row[$colName]);
		return $arr;
	}
	
	public static function arrayDateToTimestamp($arr){
		global $CONFIG;
		$year = $arr['year'];
		$month = $arr['month'] < 10? '0' . $arr['month']: $arr['month'];
		$day = $arr['day'] < 10? '0' . $arr['day']: $arr['day'];
		$hours = $arr['hours'] < 10? '0' . $arr['hours']: $arr['hours'];
		$minutes = $arr['minutes'] < 10? '0' . $arr['minutes']: $arr['minutes']; 
		$seconds = $arr['seconds'] < 10? '0' . $arr['seconds']: $arr['seconds'];
		$date = DateTime::createFromFormat('Y-m-d H:i:s', "$year-$month-$day $hours:$minutes:$seconds", new DateTimeZone($CONFIG['timezone']));
		return date_timestamp_get($date);
	}
}