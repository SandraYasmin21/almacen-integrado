import React from "react";


export function ArticuloCard({
        nombre, 
        unidad_medida, 
        modelo, 
        subcategoria, 
        requiere_serie, 
        es_consumible, 
        stock_minimo, 
        id, 
        onEditClick,
        onInfoClick,
        onDeleteClick
    }) 
    {

    const tipocategoria = {
        "Herramientas" : "text-yellow-500 bg-yellow-100",
        "Soporte" : "text-green-500 bg-green-100",
        "Seguridad Industrial" : "text-blue-500 bg-blue-100",
        "Cyberseguridad" : "text-purple-500 bg-purple-100",
        "Infraestructura Electrica" : "text-gray-500 bg-gray-100",
        "Comunicaciones" : "text-pink-500 bg-pink-100",
        "Computo e Infraestructura TI" : "text-indigo-500 bg-indigo-100",
    }

    const handleEditClick = () => {
        onEditClick({
            id,
            nombre,
            unidad_medida,
            modelo,
            subcategoria,
            requiere_serie,
            es_consumible,
            stock_minimo
        });
    }

    const handleInfoClick = () => {
        onInfoClick({
            id,
            nombre,
            unidad_medida,  
            modelo,
            subcategoria,
            requiere_serie,
            es_consumible,
            stock_minimo
        });
    }

    const handleDeleteClick = () => {
        onDeleteClick({
            id,
            nombre,
            unidad_medida,  
            modelo,
            subcategoria,
            requiere_serie,
            es_consumible,
            stock_minimo
        });
    }

    return(
        <article
            onClick={handleInfoClick}
            className="border p-4 rounded grid grid-cols-12 gap-4 items-center auto-rows-max hover:bg-gray-50 cursor-pointer
            ease-in-out duration-200
            "
        >
            <h2 className="col-span-2 text-center">{nombre}</h2>
            <span className="text-gray-400 font-semibold text-sm truncate text-center">{unidad_medida}</span>
            <span className="col-span-2 text-sm truncate text-center">{modelo}</span>
            <span className={`col-span-2 p-2 rounded-xl text-xs text-center
                ${tipocategoria[subcategoria]} truncate`}
            >{subcategoria}</span>
            <span className={`p-2 text-xs text-center ${
                requiere_serie ? "text-green-500 bg-green-100 rounded-2xl" : "text-red-500 bg-red-100 rounded-xl"
            }`}> {requiere_serie ? "Sí" : "No"}</span>
            <span className={`p-2 text-xs text-center ${
                es_consumible ? "text-green-500 bg-green-100 rounded-2xl" : "text-red-500 bg-red-100 rounded-2xl"
            }`}>{es_consumible ? "Sí" : "No"}</span>
            <span className="text-sm text-center">{stock_minimo}</span>
            <button onClick={(e) => {
                e.stopPropagation();
                handleEditClick();
            }} className="bg-blue-500 text-white p-2 rounded text-sm hover:bg-blue-600 cursor-pointer"> Editar </button>
            <button onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
            }} className="bg-red-500 text-white p-2 rounded text-sm hover:bg-red-600 cursor-pointer"> Eliminar </button>
        </article>
    )
}


// componentes para las opciones de filtro
const filtroEstilos = "w-full px-3 py-2 bg-white border-1 border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500 hover:border-gray-400 cursor-pointer text-gray-800 font-medium transition-all duration-200 appearance-none";
const filtroOpcionesEstilos = "text-base text-gray-800 bg-white hover:bg-blue-100 py-2 px-3";        

export function FiltroCategoria({ categorias, onChange, value = "" }) {
    return (
        <select onChange={onChange} value={value} className={filtroEstilos}>
            <option value="" disabled>Filtrar por categoría</option>
            {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
            ))}
        </select>
    );
}

export function FiltroSubcategoria({ subcategorias, onChange, value = "" }) {
    return (
        <select onChange={onChange} value={value}
        className={filtroEstilos}>
            <option value="" disabled className={filtroOpcionesEstilos} >Filtrar por subcategoría</option>
            {subcategorias.map((subcategoria) => (
                <option key={subcategoria.id} value={subcategoria.id}>{subcategoria.nombre}</option>
            ))}
        </select>
    );
}

export function FiltroSerie({ onChange, value = "" }) {
    return (
        <select onChange={onChange} value={value}
        className={filtroEstilos}>
            <option value="" disabled>Filtrar por serie</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
        </select>
    );
}

export function FiltroConsumible({ onChange, value = "" }) {
    return (
        <select onChange={onChange} value={value}
        className={filtroEstilos}>
            <option value="" disabled>Filtrar por consumible</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
        </select>
    );
}

export function FiltroMedida({ medida, onChange, value = "" }) {
    return (
        <select onChange={onChange} value={value}
        className={filtroEstilos}>
            <option value="" disabled>Filtrar por medida</option>
            {medida.map((medida) => (
                <option key={medida.id} value={medida.id}>{medida.unidad_medida}</option>
            ))}
        </select>
    );
}

export function BarraBusqueda({ onChange, value = "" }) {
    return (
        <input 
            type="text" 
            placeholder="Buscar por nombre o modelo..." 
            onChange={onChange} 
            value={value}
            className="border p-2 px-4 rounded-3xl focus:ring focus:ring-blue-300 focus:outline-none w-full"
        />
    );
}