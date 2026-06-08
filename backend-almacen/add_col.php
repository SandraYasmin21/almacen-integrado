<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if(!Schema::hasColumn('usuarios_sistema', 'activo')) {
    Schema::table('usuarios_sistema', function (Blueprint $table) {
        $table->boolean('activo')->default(true);
    });
    echo "Added activo\n";
} else {
    echo "activo already exists\n";
}
