<?php

use Illuminate\Support\Facades\Route;

// El frontend está separado (frontend-smartlynk/ con Vite+React).
// Este backend funciona 100% como API — ver routes/api.php
Route::get('/', function () {
    return response()->json([
        'status'  => 'online',
        'app'     => 'SmartLynk API',
        'version' => '1.0.0',
    ]);
});
