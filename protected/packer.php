<?php

/*
	Это - Упаковщик.
	теоретически, он нужен для того, чтобы сжимать отдаваемые данные
	на практике, он был бы медленным, а работал хуже, чем тот же zlib
	поэтому я не стал его писать (а клиентская часть была реализована, см. packer.js)
	
	но некогда backend.php содержал код для обработки аргумента строки запроса packed=true,
	которая включала этот обработчик. может, и сейчас содержит
*/

namespace packer;

function write($data){
}

function read($data){
}