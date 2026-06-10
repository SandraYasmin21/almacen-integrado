import React, { useState, useEffect } from "react";
import { ArticuloCard, FiltroCategoria, FiltroSubcategoria, FiltroSerie, FiltroConsumible, FiltroMedida, BarraBusqueda } from "../components/articulos.jsx";
import { FormularioModalAgregarArticulo, FormularioModalEditarArticulo, ModalInformacionArticulo, ModalConfirmDeleteArticulo } from "../components/articulosVentanas.jsx";

export default function CatalogoArticulosPage({ cantidad = 0, articulos = [], categorias = [], subcategorias = [], medidas = [] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
    
    // Estados para filtros
    const [filtroCategoria, setFiltroCategoria] = useState("");
    const [filtroSubcategoria, setFiltroSubcategoria] = useState("");
    const [filtroSerie, setFiltroSerie] = useState("");
    const [filtroConsumible, setFiltroConsumible] = useState("");
    const [filtroMedida, setFiltroMedida] = useState("");
    const [filtroBusqueda, setFiltroBusqueda] = useState("");
    
    // Estado para controlar la animación
    const [isFiltering, setIsFiltering] = useState(false);

    // Efecto para animar cuando cambian los filtros
    useEffect(() => {
        setIsFiltering(true);
        const timer = setTimeout(() => setIsFiltering(false), 100);
        return () => clearTimeout(timer);
    }, [filtroCategoria, filtroSubcategoria, filtroSerie, filtroConsumible, filtroMedida]);

    // Obtener subcategorías filtradas por categoría seleccionada
    const subcategoriasFiltradasPorCategoria = filtroCategoria
        ? subcategorias.filter(sub => sub.categoria_id === parseInt(filtroCategoria))
        : subcategorias;

    // Filtrar artículos basado en todos los filtros activos
    const articulosFiltrados = articulos.filter(articulo => {
        // Filtro por búsqueda de texto
        if (filtroBusqueda) {
            const busquedaLower = filtroBusqueda.toLowerCase();
            if (!articulo.nombre?.toLowerCase().includes(busquedaLower) && 
                !articulo.modelo?.toLowerCase().includes(busquedaLower)) {
                return false;
            }
        }

        // Filtro por categoría (a través de subcategoría)
        if (filtroCategoria) {
            if (articulo.subcategoria?.categoria_id !== parseInt(filtroCategoria)) {
                return false;
            }
        }

        // Filtro por subcategoría
        if (filtroSubcategoria) {
            if (articulo.subcategoria_id !== parseInt(filtroSubcategoria)) {
                return false;
            }
        }

        // Filtro por requiere serie
        if (filtroSerie) {
            if (String(articulo.requiere_serie) !== filtroSerie) {
                return false;
            }
        }

        // Filtro por consumible
        if (filtroConsumible) {
            if (String(articulo.es_consumible) !== filtroConsumible) {
                return false;
            }
        }

        // Filtro por medida
        if (filtroMedida) {
            if (articulo.unidad_medida !== filtroMedida) {
                return false;
            }
        }

        return true;
    });

    // Limpiar filtros relacionados cuando cambia la categoría
    const handleCategoriaChange = (e) => {
        setFiltroCategoria(e.target.value);
        setFiltroSubcategoria(""); // Limpiar subcategoría al cambiar categoría
    };

    const handleEditClick = (articulo) => {
        setArticuloSeleccionado(articulo);
        setIsEditModalOpen(true);
    }
    
    const handleInfoClick = (articulo) => {
        setArticuloSeleccionado(articulo);
        setIsInfoModalOpen(true);
    }

    const handleDeleteClick = (articulo) => {
        setArticuloSeleccionado(articulo);
        setIsDeleteModalOpen(true);
    }

    return (

        <div className="flex">
        
            <aside className="w-1/6 bg-gray-200 p-4 sticky top-0 h-screen">
                Supuesto menu lateral
            </aside>
            <main className="w-5/6">
                <header className="bg-gray-200">
                    Supuesto menu superior
                </header>
                <section className="">
                    <div className="bg-blue-800 flex flex-row gap-4 justify-between items-center p-8 rounded-b-3xl">
                            
                                <h1 className="text-start text-white text-4xl font-bold m-4 ">Catálogo Central</h1>
                                
                            </div>
                    <div className="p-4 flex flex-col gap-4">
                        <div className="">
                            
                            <div className="flex flex-row gap-4 justify-between items-center">
                                <span className="m-4">Diccionario del sistema - {articulosFiltrados.length} de {cantidad} artículos {(articulosFiltrados.length !== cantidad) && `(${cantidad - articulosFiltrados.length} ocultos)`} </span>
                                <div className="flex gap-4">

                                    <button 
                                        className="bg-blue-500 rounded p-4 text-white font-bold"
                                        onClick={() => setIsModalOpen(true)}
                                    > 
                                        Agregar Artículo 
                                    </button>
    
                                </div>
                            </div>
                        </div>
                        <div>
                            <BarraBusqueda 
                                value={filtroBusqueda}
                                onChange={(e) => setFiltroBusqueda(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-row gap-2  bg-gray-50 p-4 rounded items-center">

                            <FiltroCategoria categorias={categorias} onChange={handleCategoriaChange} value={filtroCategoria} />
                            
                            {filtroCategoria && (
                                <FiltroSubcategoria 
                                    subcategorias={subcategoriasFiltradasPorCategoria} 
                                    onChange={(e) => setFiltroSubcategoria(e.target.value)} 
                                    value={filtroSubcategoria}
                                />
                            )}
                            
                            <FiltroSerie onChange={(e) => setFiltroSerie(e.target.value)} value={filtroSerie} />
                            <FiltroConsumible onChange={(e) => setFiltroConsumible(e.target.value)} value={filtroConsumible} />
                                
                            <FiltroMedida medida={medidas} onChange={(e) => setFiltroMedida(e.target.value)} value={filtroMedida} />
                            
                            {(filtroCategoria || filtroSubcategoria || filtroSerie || filtroConsumible || filtroMedida) && (
                                <button 
                                    onClick={() => {
                                        setFiltroCategoria("");
                                        setFiltroSubcategoria("");
                                        setFiltroSerie("");
                                        setFiltroConsumible("");
                                        setFiltroMedida("");
                                    }}
                                    className="ml-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold transition animate-pulse"
                                >
                                    Limpiar Filtros
                                </button>
                            )}

                        </div>

                        <div className="">

                            <div className="border bg-gray-100 p-4 rounded grid grid-cols-12 gap-4 items-center auto-rows-max">
                                <h2 className="col-span-2 font-bold text-center">Nombre</h2>
                                <span className="text-gray-400 font-semibold text-sm text-center">Unidad de Medida</span>
                                <span className="col-span-2 text-sm truncate text-center">Modelo</span>
                                <span className={`col-span-2 p-2 rounded-xl text-sm text-center
                                    ${"text-gray-500 bg-gray-100"} truncate`}
                                >Subcategoría</span>
                                <span className={`p-2 text-sm text-center ${
                                    "text-gray-500 bg-gray-100 rounded-xl"
                                }`}> Requiere Serie </span>
                                <span className={`p-2 text-sm text-center ${
                                    "text-gray-500 bg-gray-100 rounded-xl"
                                }`}> Consumible </span>
                                <span className="text-sm text-center">Stock Mínimo</span>
                                <span className="text-sm text-center col-span-2">Opciones</span>

                            </div>
                            {articulosFiltrados.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">
                                    No se encontraron artículos que coincidan con los filtros aplicados.
                                </div>
                            ) : (
                                <div className={`transition-all duration-300 ease-in-out`}>
                                    {articulosFiltrados.map((articulo) => (
                                        <div key={articulo.id} className={`${isFiltering ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
                                            <ArticuloCard
                                                id={articulo.id}    
                                            nombre={articulo.nombre}
                                            unidad_medida={articulo.unidad_medida}
                                            modelo={articulo.modelo}
                                            subcategoria={articulo.subcategoria?.nombre || "Sin categoría"}
                                            requiere_serie={articulo.requiere_serie}
                                            es_consumible={articulo.es_consumible}
                                            stock_minimo={articulo.stock_minimo}
                                            onEditClick={handleEditClick}
                                            onInfoClick={handleInfoClick}
                                            onDeleteClick={handleDeleteClick}
                                            />
                                        </div>
                                    ))}
                            </div>
                            )}

                        </div>
                        {isModalOpen && 
                        (
                            <FormularioModalAgregarArticulo 
                                subcategorias={subcategorias} 
                                onClose={() => setIsModalOpen(false)} 
                            />
                        )}

                        {isEditModalOpen && (
                            <FormularioModalEditarArticulo 
                                articulo={articuloSeleccionado} 
                                subcategorias={subcategorias} 
                                onClose={() => setIsEditModalOpen(false)} 
                            />
                        )}

                        {isInfoModalOpen && (
                            <ModalInformacionArticulo 
                                articulo={articuloSeleccionado} 
                                subcategorias={subcategorias} 
                                onClose={() => setIsInfoModalOpen(false)} 
                            />
                        )}

                        {isDeleteModalOpen && (
                            <ModalConfirmDeleteArticulo 
                                articulo={articuloSeleccionado} 
                                onClose={() => setIsDeleteModalOpen(false)} 
                            />
                        )}
                    </div>
                    
                </section>
            </main>
        </div>
    );
}