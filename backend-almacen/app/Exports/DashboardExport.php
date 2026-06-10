<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Carbon\Carbon;

class DashboardExport implements FromView, ShouldAutoSize
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function view(): View
    {
        return view('pdf.dashboard', [
            'data'         => $this->data,
            'fecha'        => Carbon::now()->format('d/m/Y H:i'),
            'generado_por' => auth()->user()->nombre_usuario ?? 'Sistema',
        ]);
    }
}
