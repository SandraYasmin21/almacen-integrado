import re

with open('c:/Users/santi/Desktop/proyecto_smartlynk/frontend-smartlynk/src/pages/Almacen/Index.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'          </DataTableShell>\n          </>\n        \)}', content)
if match:
    clean = content[:match.end()] + '''

        {/* Vista Ubicaciones */}
        {vista === "ubicaciones" && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ubicaciones.length === 0 ? (
              <div className="col-span-full py-12 text-center">
                <p className="text-sm text-slate-400">No hay ubicaciones registradas</p>
              </div>
            ) : ubicaciones.map(ub => (
              <button key={ub.ubicacion} onClick={() => setUbicacionSeleccionada(ub)}
                className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                  </div>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-mono">{ub.ubicacion}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">{ub.total_articulos} artículos</p>
                <p className="text-xs text-slate-400 mt-0.5">{ub.total_unidades} unidades totales</p>
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Slide-over de Ubicaciones */}
      {ubicacionSeleccionada && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setUbicacionSeleccionada(null)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Ubicación: <span className="font-mono text-blue-600">{ubicacionSeleccionada.ubicacion}</span></h3>
                <p className="text-sm text-slate-500">{ubicacionSeleccionada.total_articulos} artículos • {ubicacionSeleccionada.total_unidades} unidades</p>
              </div>
              <button onClick={() => setUbicacionSeleccionada(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {articulos.filter(a => a.ubicacion === ubicacionSeleccionada.ubicacion).map(art => (
                <div key={art.id} className="flex items-start justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/50 transition">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{art.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{art.modelo ?? "-"} • {art.categoria_nombre}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 text-sm">{art.cantidad ?? 0}</span>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{art.unidad_medida}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setUbicacionSeleccionada(null)} className="w-full py-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalArticulo && (
        <ModalSalida
          articulo={modalArticulo}
          empleados={empleados}
          onClose={() => setModalArticulo(null)}
          onSuccess={() => { setModalArticulo(null); cargar(); }}
        />
      )}
    </>
  );
}
'''
    with open('c:/Users/santi/Desktop/proyecto_smartlynk/frontend-smartlynk/src/pages/Almacen/Index.jsx', 'w', encoding='utf-8') as f:
        f.write(clean)
    print('Fixed Index.jsx successfully')
else:
    print('Could not find anchor to fix Index.jsx')
