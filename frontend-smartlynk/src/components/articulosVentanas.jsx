import React from "react";
import { router } from '@inertiajs/react';

export function FormularioModalAgregarArticulo({subcategorias = [],  onClose }) {
    const [nomnbre, setNombre] = React.useState("");
    const [unidadMedida, setUnidadMedida] = React.useState("");
    const [modelo, setModelo] = React.useState("");
    const [subcategoria, setSubcategoria] = React.useState("");
    const [requiereSerie, setRequiereSerie] = React.useState(false);
    const [esConsumible, setEsConsumible] = React.useState(false);
    const [stockMinimo, setStockMinimo] = React.useState(0);
    const [errores, setErrores] = React.useState({});

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validación básica en frontend
        const newErrores = {};
        if (!nomnbre.trim()) newErrores.nombre = "El nombre es requerido";
        if (!subcategoria) newErrores.subcategoria_id = "La subcategoría es requerida";
        
        if (Object.keys(newErrores).length > 0) {
            setErrores(newErrores);
            return;
        }

        // Enviar los datos al backend a la ruta /articulos
        router.post('/articulos', {
            nombre: nomnbre,
            unidad_medida: unidadMedida,
            modelo: modelo,
            subcategoria_id: subcategoria,
            requiere_serie: requiereSerie,
            es_consumible: esConsumible,
            stock_minimo: stockMinimo
        }, {
            onSuccess: () => {
                console.log("Artículo creado exitosamente");
                onClose(); // Cerrar el modal después de enviar
            },
            onError: (errors) => {
                console.log("Errores:", errors);
                setErrores(errors);
            }
        });
    }

    const handleOverlayClick = (e) => {
        // Solo cerrar si se hace click en el overlay (fondo), no en el formulario
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-gray-400 backdrop-blur-xs animate-backdropFadeIn" onClick={handleOverlayClick}>
            <div className="bg-white p-10 rounded shadow-md animate-modalSlideIn">
                <div className="flex justify-between items-center mb-4 p-2">
                    <h2 className="text-lg font-bold border-r-2 border-gray-300 pr-10 ">Agregar Artículo</h2>
                    <button onClick={onClose} className="p-2 px-3 m-2 bg-red-400 rounded text-white font-bold"> X </button>
                </div>
                <hr className="border rounded-md h-px my-4 border-blue-500" />
                {Object.keys(errores).length > 0 && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {Object.entries(errores).map(([key, value]) => (
                            <p key={key}>{value}</p>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Nombre</label>
                        <input
                            type="text"
                            value={nomnbre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="border border-gray-300 p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Unidad de Medida</label>
                        <input
                            type="text"
                            value={unidadMedida}
                            onChange={(e) => setUnidadMedida(e.target.value)}
                            className="border border-gray-300 p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Modelo</label>
                        <input
                            type="text"
                            value={modelo}
                            onChange={(e) => setModelo(e.target.value)}
                            className="border border-gray-300 p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Subcategoría</label>
                        <select
                            value={subcategoria}
                            onChange={(e) => setSubcategoria(e.target.value)}
                            className="border border-gray-300 p-2 w-full"
                        >
                            <option value="" disabled >Seleccionar subcategoría</option>
                            {console.log(subcategorias)}
                            {subcategorias.map((subcategoria) => (
                                <option key={subcategoria.id} value={String(subcategoria.id)}>{subcategoria.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={requiereSerie}
                                onChange={(e) => setRequiereSerie(e.target.checked)}
                                className="mr-2"
                            />
                            Requiere Serie
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={esConsumible}
                                onChange={(e) => setEsConsumible(e.target.checked)}
                                className="mr-2"
                            />
                            Consumible
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
                        <input
                            type="number"
                            value={stockMinimo}
                            onChange={(e) => setStockMinimo(e.target.value)}
                            className="border border-gray-300 p-2 w-full"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                            Agregar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function FormularioModalEditarArticulo({articulo = {}, subcategorias = [], onClose }) {
    // Encontrar el ID de la subcategoría por nombre
    const subcategoriaId = subcategorias.find(
        sub => sub.nombre === articulo.subcategoria
    )?.id;
    
    const [nomnbre, setNombre] = React.useState(articulo.nombre || "");
    const [unidadMedida, setUnidadMedida] = React.useState(articulo.unidad_medida || "");
    const [modelo, setModelo] = React.useState(articulo.modelo || "");
    const [subcategoria, setSubcategoria] = React.useState(String(subcategoriaId || ""));
    const [requiereSerie, setRequiereSerie] = React.useState(articulo.requiere_serie || false);
    const [esConsumible, setEsConsumible] = React.useState(articulo.es_consumible || false);
    const [stockMinimo, setStockMinimo] = React.useState(articulo.stock_minimo || 0);
    const [errores, setErrores] = React.useState({});


    const handleSubmit = (e) => {
        e.preventDefault();

        const newErrores = {};
        if (!nomnbre.trim()) newErrores.nombre = "El nombre es requerido";
        if (!subcategoria) newErrores.subcategoria_id = "La subcategoría es requerida";
        
        if (Object.keys(newErrores).length > 0) {
            setErrores(newErrores);
            return;
        }

        // convertir de nuevo el id de subcategoría a número antes de enviar
        const subcategoriaIdNum = parseInt(subcategoria);

        router.put(`/articulos/${articulo.id}`, {
            nombre: nomnbre,
            unidad_medida: unidadMedida,
            modelo: modelo,
            subcategoria_id: subcategoriaIdNum,
            requiere_serie: requiereSerie,
            es_consumible: esConsumible,
            stock_minimo: stockMinimo
        }, {
            onSuccess: () => {
                console.log("Artículo modificado exitosamente");
                onClose(); // Cerrar el modal después de enviar
            },
            onError: (errors) => {
                console.log("Errores:", errors);
                setErrores(errors);
            }
        });
        
        onClose(); // Cerrar el modal después de enviar
    }

    const handleOverlayClick = (e) => {
        // Solo cerrar si se hace click en el overlay (fondo), no en el formulario
        if (e.target === e.currentTarget) {
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-gray-400 backdrop-blur-xs animate-backdropFadeIn" onClick={handleOverlayClick}>
            <div className="bg-white p-10 rounded shadow-md animate-modalSlideIn">
                <div className="flex justify-between items-center mb-4 p-2">
                    <h2 className="text-lg font-bold border-r-2 border-gray-300 pr-10 ">Editar Artículo</h2>
                    <button onClick={onClose} className="p-2 px-3 m-2 bg-red-400 rounded text-white font-bold hover:bg-red-500 transition"> X </button>
                </div>
                <hr className="border rounded-md h-px my-4 border-blue-500" />
                {Object.keys(errores).length > 0 && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {Object.entries(errores).map(([key, value]) => (
                            <p key={key}>{value}</p>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Nombre</label>
                        <input
                            type="text"
                            value={nomnbre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="border border-gray-300 p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Unidad de Medida</label>
                        <input
                            type="text"
                            value={unidadMedida}
                            onChange={(e) => setUnidadMedida(e.target.value)}
                            className="border border-gray-300 p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Modelo</label>
                        <input
                            type="text"
                            value={modelo}
                            onChange={(e) => setModelo(e.target.value)}
                            className="border border-gray-300 p-2 w-full"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Subcategoría</label>
                        <select
                            value={subcategoria}
                            onChange={(e) => setSubcategoria(e.target.value)}
                            className="border border-gray-300 p-2 w-full"
                        >
                            <option value="">Seleccionar subcategoría</option>
                            {subcategorias.map((sub) => (
                                <option key={sub.id} value={String(sub.id)}>{sub.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={requiereSerie}
                                onChange={(e) => setRequiereSerie(e.target.checked)}
                                className="mr-2"
                            />
                            Requiere Serie
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={esConsumible}
                                onChange={(e) => setEsConsumible(e.target.checked)}
                                className="mr-2"
                            />
                            Consumible
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
                        <input
                            type="number"
                            value={stockMinimo}
                            onChange={(e) => setStockMinimo(e.target.value)}
                            className="border border-gray-300 p-2 w-full"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function ModalInformacionArticulo({articulo = {}, subcategorias = [], onClose }) {
    const nombre = articulo.nombre || "";
    const unidadMedida = articulo.unidad_medida || "";
    const modelo = articulo.modelo || "";
    const subcategoria = articulo.subcategoria?.nombre || "Sin categoría";
    const requiereSerie = articulo.requiere_serie || false;
    const esConsumible = articulo.es_consumible || false;
    const stockMinimo = articulo.stock_minimo || 0;

    
    const handleOverlayClick = (e) => {
        // Solo cerrar si se hace click en el overlay (fondo), no en el contenido
        if (e.target === e.currentTarget) {
            onClose();
        }

    }

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-gray-400 backdrop-blur-xs animate-backdropFadeIn" onClick={handleOverlayClick}>
        <div className="bg-white rounded shadow-md  w-150 animate-modalSlideIn">
            <h2 className="font-bold text-2xl col-span-2 bg-blue-700 p-4 rounded-b-3xl w-100 text-white">{nombre}</h2>
            <div className="grid grid-cols-2 gap-4 p-10">
                <article className="bg-gray-100 p-4 rounded-2xl">
                    <p className="font-semibold pb-2">Unidad de Medida:</p>
                    <p className="bg-white p-2 rounded"> {unidadMedida}</p>
                </article>

                <article className="bg-gray-100 p-4 rounded-2xl">
                    <p className="font-semibold pb-2">Modelo:</p>
                    <p className="bg-white p-2 rounded">{modelo || "No especificado"}</p>
                </article>

                <article className="bg-gray-100 p-4 rounded-2xl">
                    <p className="font-semibold pb-2">Subcategoría:</p>
                    <p className="bg-white p-2 rounded">{subcategoria}</p>
                </article>
                <article className="bg-gray-100 p-4 rounded-2xl">
                    <p className="font-semibold pb-2">Requiere Serie:</p>
                    <p className="bg-white p-2 rounded">{requiereSerie ? "Sí" : "No"}</p>
                </article>
                <article className="bg-gray-100 p-4 rounded-2xl">
                    <p className="font-semibold pb-2">Consumible:</p>
                    <p className="bg-white p-2 rounded">{esConsumible ? "Sí" : "No"}</p>
                </article>
                <article className="bg-gray-100 p-4 rounded-2xl">
                    <p className="font-semibold pb-2">Stock Mínimo:</p>
                    <p className="bg-white p-2 rounded">{stockMinimo}</p>
                </article>
                <button onClick={onClose} className=" col-span-2  bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition">Cerrar</button>
            </div>
            
        </div>
    </div>
        
    )
}

export function ModalConfirmDeleteArticulo({articulo = {}, onClose }) {
    const nombre = articulo.nombre || "";
    const unidadMedida = articulo.unidad_medida || "";
    const modelo = articulo.modelo || "";
    const subcategoria = articulo.subcategoria?.nombre || "Sin categoría";
    const requiereSerie = articulo.requiere_serie || false;
    const esConsumible = articulo.es_consumible || false;
    const stockMinimo = articulo.stock_minimo || 0;

    
    const handleOverlayClick = (e) => {
        // Solo cerrar si se hace click en el overlay (fondo), no en el contenido
        if (e.target === e.currentTarget) {
            onClose();
        }

    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent bg-gray-400 backdrop-blur-xs animate-backdropFadeIn" onClick={handleOverlayClick}>
            <div className="bg-white rounded shadow-md  w-150 animate-modalSlideIn">
                <h2 className="font-bold text-2xl col-span-2 bg-red-700 p-4 rounded-b-3xl w-100 text-white">¿Eliminar artículo?</h2>
                <div className="grid grid-cols-2 gap-4 p-10">
                    <p className="col-span-2 text-center text-gray-700">¿Estás seguro de que deseas eliminar el artículo <span className="font-semibold">{nombre}</span>? Esta acción no se puede deshacer.</p>
                    <button onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition">Cancelar</button>
                    <button onClick={() => {
                        // Aquí iría la lógica para eliminar el artículo, por ejemplo:
                        // router.delete(`/articulos/${articulo.id}`);
                        router.delete(`/articulos/${articulo.id}`, {
                            onSuccess: () => {
                                console.log("Artículo eliminado exitosamente");
                                onClose(); // Cerrar el modal después de eliminar
                            },
                            onError: (errors) => {
                                console.log("Errores:", errors);
                                // Aquí podrías mostrar un mensaje de error si lo deseas
                            }
                        });
                        onClose();
                    }} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">Eliminar</button>
                </div>
            </div>
        </div>
    )
}