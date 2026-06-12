import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import Barcode from "react-barcode";
import { toast } from "sonner";
import {
  Car,
  CheckCircle2,
  FileText,
  PackageSearch,
  Pencil,
  Plus,
  Printer,
  Search,
  Wrench,
  AlertCircle,
} from "lucide-react";

import { apiFetch, authHeaders } from "../../lib/auth";
import { cn } from "../../lib/utils";
import {
  DataTableShell,
  ExportButtons,
  PremiumCard,
  PremiumModal,
  dataTableClass,
} from "../../components/ui/premium";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const API = import.meta.env.VITE_API_URL ?? "";

const PRESET_CATEGORIES = {
  "MANTENIMIENTO – HERRAMIENTAS": ["AREA DE HERRAMIENTAS Y EQUIPOS"],
  "ALMACÉN – SOPORTE LOGISTICO": [
    "AREA DE INSUMOS",
    "AREA DE EMBALAJE Y DESPACHO",
    "AREA DE RACKS Y GABINETES",
    "AREA DE FIBRA ÓPTICA",
    "AREA DE CABLEADO",
    "AREA DE CABLEADO DE RED",
  ],
  "SEGURIDAD INDUSTRIAL": ["AREA DE EQUIPO DE PROTECCIÓN PERSONAL"],
  "CYBERSEGURIDAD (SEGURIDAD ELECTRICA)": ["AREA DE VIDEOVIGILANCIA"],
  "INFRAESTRUCTURA ELECTRICA": ["AREA DE PROTECCIÓN ELÉCTRICA"],
  "TELECOMUNICACIONES": ["AREA DE SWITCHING Y ROUTING", "AREA DE CONECTIVIDAD"],
  "COMUNICACIONES DE VOZ / TELEFONÍA": ["AREA DE TELEFONIA"],
  "COMPUTO E INFRAESTRUCTURA TI": [
    "AREA DE RESPALDO DE ENERGIA",
    "AREA DE ALMACENAMIENTO Y CONTROL",
    "AREA DE EQUIPOS DE USUARIO",
  ],
};

const emptyArticulo = {
  nombre: "",
  modelo: "",
  subcategoria_id: "",
  categoria_seleccionada: "",
  subcategoria_seleccionada: "",
  nueva_categoria: "",
  nueva_subcategoria: "",
  unidad_medida: "PZA",
  stock_minimo: "0",
  tipo_articulo: "herramienta",
  requiere_serie: false,
  es_consumible: false,
  sku_maestro: "",
  regenerar_sku: false,
};

const emptyVehiculo = {
  nombre: "",
  modelo: "",
  placas: "",
  numero_serie: "",
  tipo_vehiculo: "Pickup",
  numero: "",
  estado_gps: "Sin Unidad",
  poliza_seguro: "",
  grupo: "",
  certificacion: "",
  estado: "ACTIVO",
};

function unwrapPagination(payload) {
  const data = payload?.data ?? payload;
  return {
    rows: Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [],
    currentPage: data?.current_page ?? 1,
    lastPage: data?.last_page ?? 1,
    total: data?.total ?? (Array.isArray(data) ? data.length : 0),
  };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function PillTab({ active, icon: Icon, label, count, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-300",
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-blue-100"
          : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs",
          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function Field({ label, required, children, error }) {
  return (
    <div className="space-y-2 text-sm font-semibold text-slate-800">
      <label className="block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-bold text-rose-500 mt-1 animate-in slide-in-from-top-1">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}

function TextInput({ error, ...props }) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-xl border px-4 text-sm outline-none transition",
        error
          ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-100 placeholder:text-rose-300"
          : "border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100",
        props.className
      )}
    />
  );
}

function ToggleButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all",
        active
          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
          : "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-slate-800"
      )}
    >
      {children}
    </button>
  );
}

export default function CatalogoCentral() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("articulos");
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [articulos, setArticulos] = useState({ rows: [], total: 0, currentPage: 1, lastPage: 1 });
  const [vehiculos, setVehiculos] = useState({ rows: [], total: 0, currentPage: 1, lastPage: 1 });
  const [subcategorias, setSubcategorias] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("articulos");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyArticulo);
  const [errors, setErrors] = useState({});
  const [skuResult, setSkuResult] = useState(null);
  const barcodeRef = useRef(null);

  const activeRows = activeTab === "articulos" ? articulos : vehiculos;

  const stats = useMemo(() => {
    const totalArticulos = articulos.total;
    const consumibles = articulos.rows.filter((item) => item.es_consumible).length;
    const activos = vehiculos.rows.filter((item) => String(item.estado).toUpperCase() === "ACTIVO").length;

    return [
      { label: "Artículos maestros", value: totalArticulos, icon: PackageSearch, color: "border-blue-500" },
      { label: "Consumibles visibles", value: consumibles, icon: Wrench, color: "border-emerald-500" },
      { label: "Vehículos registrados", value: vehiculos.total, icon: Car, color: "border-orange-500" },
      { label: "Vehículos activos", value: activos, icon: CheckCircle2, color: "border-violet-500" },
    ];
  }, [articulos, vehiculos]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, activeTab]);

  useEffect(() => {
    loadCatalogo();
  }, [activeTab, page, search]);

  useEffect(() => {
    loadSubcategorias();
    
    // Pre-cargar vehículos para que las estadísticas aparezcan desde el inicio
    async function preloadVehiculos() {
      try {
        const response = await apiFetch(`${API}/api/catalogo/vehiculos?page=1&per_page=10&q=`);
        const payload = await response.json();
        if (response.ok && payload.success !== false) {
          setVehiculos(unwrapPagination(payload));
        }
      } catch (error) {
        console.error("Error pre-cargando vehículos:", error);
      }
    }
    preloadVehiculos();
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.openArticulo) {
      setEditing(location.state.openArticulo);
      setModalType("articulos");
      // Limpiar el estado para evitar comportamiento fantasma al refrescar (F5)
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  async function loadCatalogo() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: "10",
        q: search.trim(),
      });
      const endpoint = activeTab === "articulos" ? "articulos" : "vehiculos";
      const response = await apiFetch(`${API}/api/catalogo/${endpoint}?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "No se pudo cargar el catálogo");
      }

      const normalized = unwrapPagination(payload);
      if (activeTab === "articulos") {
        setArticulos(normalized);
      } else {
        setVehiculos(normalized);
      }
    } catch (error) {
      toast.error(error.message || "No se pudo cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }

  async function loadSubcategorias() {
    try {
      const response = await apiFetch(`${API}/api/catalogo/subcategorias`);
      const payload = await response.json();
      if (!response.ok || payload.success === false) {
        throw new Error(payload.message || "No se pudieron cargar las subcategorías");
      }
      setSubcategorias(Array.isArray(payload.data) ? payload.data : []);
    } catch (error) {
      toast.error(error.message || "No se pudieron cargar las subcategorías");
    }
  }

  function openModal(type = "articulos") {
    setModalType(type);
    setEditing(null);
    setForm(type === "articulos" ? emptyArticulo : emptyVehiculo);
    setErrors({});
    setModalOpen(true);
    setSkuResult(null);
  }

  function closeModal() {
    setModalOpen(false);
    setErrors({});
    setSkuResult(null);
  }

  function openEdit(row) {
    setModalType(activeTab);
    setEditing(row);
    setErrors({});
    setModalType(activeTab);
    setSkuResult(null);
    setForm(
      activeTab === "articulos"
          ? {
              nombre: row.nombre ?? "",
              modelo: row.modelo ?? "",
              subcategoria_id: row.subcategoria_id ? String(row.subcategoria_id) : "",
              categoria_seleccionada: row.categoria ?? "",
              subcategoria_seleccionada: row.subcategoria ?? "",
              nueva_categoria: "",
              nueva_subcategoria: "",
              unidad_medida: row.unidad_medida ?? "PZA",
              stock_minimo: row.stock_minimo ?? "0",
              tipo_articulo: row.tipo_articulo ?? (row.es_consumible ? "venta" : "herramienta"),
              requiere_serie: Boolean(row.requiere_serie),
              es_consumible: Boolean(row.es_consumible),
              sku_maestro: row.sku_maestro ?? "",
              regenerar_sku: false,
            }
        : {
            nombre: row.nombre ?? "",
            modelo: row.modelo ?? "",
            placas: row.placas ?? "",
            numero_serie: row.numero_serie ?? "",
            tipo_vehiculo: row.tipo_vehiculo ?? "Pickup",
            numero: row.numero ?? "",
            estado_gps: row.estado_gps ?? "Sin Unidad",
            poliza_seguro: row.poliza_seguro ?? "",
            grupo: row.grupo ?? "",
            certificacion: row.certificacion ?? "",
            estado: String(row.estado ?? "ACTIVO").toUpperCase(),
          }
    );
    setModalOpen(true);
  }

  function printSkuLabel() {
    if (!skuResult?.sku_maestro) {
      toast.error("No hay SKU maestro disponible para imprimir");
      return;
    }

    const barcodeMarkup = barcodeRef.current?.innerHTML;
    const printWindow = window.open("", "_blank", "width=420,height=320");

    if (!printWindow || !barcodeMarkup) {
      toast.error("No se pudo abrir la ventana de impresión");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir SKU</title>
          <style>
            @page { size: 70mm 40mm; margin: 6mm; }
            body {
              margin: 0;
              font-family: Inter, ui-sans-serif, system-ui, sans-serif;
              color: #0f172a;
              text-align: center;
            }
            h3 {
              margin: 0 0 8px;
              font-size: 14px;
              line-height: 1.2;
            }
            .sku {
              margin-top: 6px;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.08em;
            }
          </style>
        </head>
        <body>
          <h3>${skuResult.nombre}</h3>
          ${barcodeMarkup}
          <div class="sku">${skuResult.sku_maestro}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 150);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const newErrors = {};
    if (modalType === "articulos") {
      if (!form.nombre?.trim()) newErrors.nombre = "El nombre del artículo es obligatorio";
      if (!form.categoria_seleccionada) newErrors.categoria_seleccionada = "Selecciona una categoría";
      if (form.categoria_seleccionada === "NUEVA" && !form.nueva_categoria?.trim()) newErrors.nueva_categoria = "Escribe el nombre de la categoría";
      if (!form.subcategoria_seleccionada) newErrors.subcategoria_seleccionada = "Selecciona una subcategoría";
      if (form.subcategoria_seleccionada === "NUEVA" && !form.nueva_subcategoria?.trim()) newErrors.nueva_subcategoria = "Escribe el nombre de la subcategoría";
      if (!form.unidad_medida?.trim()) newErrors.unidad_medida = "La unidad es obligatoria";
    } else {
      if (!form.nombre?.trim()) newErrors.nombre = "El nombre es obligatorio";
      if (!form.modelo?.trim()) newErrors.modelo = "El modelo es obligatorio";
      if (!form.tipo_vehiculo?.trim()) newErrors.tipo_vehiculo = "El tipo de vehículo es obligatorio";
      if (!form.placas?.trim()) newErrors.placas = "Las placas son obligatorias";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor completa los campos marcados en rojo");
      return;
    }
    setErrors({});

    const endpoint = modalType === "articulos" ? "articulos" : "vehiculos";
    const method = editing ? "PUT" : "POST";
    const url = editing
      ? `${API}/api/catalogo/${endpoint}/${editing.id}`
      : `${API}/api/catalogo/${endpoint}`;

    const payloadForm = { ...form };
    if (modalType === "articulos") {
      if (payloadForm.categoria_seleccionada === "NUEVA") {
        payloadForm.subcategoria_id = "";
      } else if (payloadForm.subcategoria_seleccionada === "NUEVA") {
        payloadForm.subcategoria_id = "";
        payloadForm.nueva_categoria = payloadForm.categoria_seleccionada;
      } else {
        const found = subcategorias.find(
          (s) => s.categoria === payloadForm.categoria_seleccionada && s.nombre === payloadForm.subcategoria_seleccionada
        );
        if (found) {
          payloadForm.subcategoria_id = found.id;
          payloadForm.nueva_categoria = "";
          payloadForm.nueva_subcategoria = "";
        } else {
          payloadForm.subcategoria_id = "";
          payloadForm.nueva_categoria = payloadForm.categoria_seleccionada;
          payloadForm.nueva_subcategoria = payloadForm.subcategoria_seleccionada;
        }
      }
    }

    const payload =
      modalType === "articulos"
        ? {
            nombre: payloadForm.nombre,
            modelo: payloadForm.modelo,
            subcategoria_id: payloadForm.subcategoria_id,
            nueva_categoria: payloadForm.nueva_categoria,
            nueva_subcategoria: payloadForm.nueva_subcategoria,
            unidad_medida: payloadForm.unidad_medida,
            stock_minimo: Number(payloadForm.stock_minimo || 0),
            tipo_articulo: payloadForm.tipo_articulo,
            requiere_serie: payloadForm.requiere_serie,
            es_consumible: payloadForm.es_consumible,
            regenerar_sku: payloadForm.regenerar_sku,
          }
        : form;

    try {
      const response = await apiFetch(url, {
        method,
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "No se pudo guardar el registro");
      }

      toast.success(data.message || "Registro guardado correctamente");

      if (modalType === "articulos") {
        const saved = data.data ?? {};
        setSkuResult({
          nombre: saved.nombre ?? form.nombre,
          modelo: saved.modelo ?? form.modelo,
          tipo_articulo: saved.tipo_articulo ?? form.tipo_articulo,
          sku_maestro: saved.sku_maestro ?? "",
        });

        if (activeTab !== "articulos") {
          setActiveTab("articulos");
          setPage(1);
        } else {
          await loadCatalogo();
        }
        return;
      }

      closeModal();
      if (activeTab !== modalType) {
        setActiveTab(modalType);
        setPage(1);
      } else {
        await loadCatalogo();
      }
    } catch (error) {
      toast.error(error.message || "No se pudo guardar el registro");
    }
  }

  async function handleExport(format) {
    const tipo = activeTab === "articulos" ? "articulos" : "vehiculos";
    try {
      const response = await apiFetch(`${API}/api/catalogo/export/${tipo}/${format}`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        let message = "No se pudo exportar el catálogo";
        try {
          const payload = await response.json();
          message = payload.message || message;
        } catch {
          // Binary endpoints do not always return JSON.
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const extension = format === "pdf" ? "pdf" : "xlsx";
      downloadBlob(blob, `catalogo_${tipo}.${extension}`);
      toast.success(`Catálogo exportado en ${format === "pdf" ? "PDF" : "Excel"}`);
    } catch (error) {
      toast.error(error.message || "No se pudo exportar el catálogo");
    }
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, modelo, categoría, placas o NIV..."
            className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExportButtons onPdf={() => handleExport("pdf")} onExcel={() => handleExport("excel")} />
          <button
            type="button"
            onClick={() => openModal("articulos")}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Nuevo registro
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <PremiumCard key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">{item.label}</p>
                <p className="mt-2 text-3xl font-extrabold text-slate-900">{item.value}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-blue-600">
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </PremiumCard>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3" role="tablist" aria-label="Catálogo central">
        <PillTab
          active={activeTab === "articulos"}
          icon={PackageSearch}
          label="Artículos y Herramientas"
          count={articulos.total}
          onClick={() => setActiveTab("articulos")}
        />
        <PillTab
          active={activeTab === "vehiculos"}
          icon={Car}
          label="Vehículos"
          count={vehiculos.total}
          onClick={() => setActiveTab("vehiculos")}
        />
      </div>

      <DataTableShell>
        {activeTab === "articulos" ? (
          <table className="w-full table-fixed min-w-[900px] text-left text-sm text-slate-600 whitespace-normal">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[24%] px-5 py-4 whitespace-normal">Artículo</th>
                <th className="w-[18%] px-5 py-4">Categoría</th>
                <th className="w-[12%] px-5 py-4">Unidad</th>
                <th className="w-[14%] px-5 py-4">Stock ideal</th>
                <th className="w-[14%] px-5 py-4">Stock actual</th>
                <th className="w-[12%] px-5 py-4">Tipo</th>
                <th className="w-[6%] px-5 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {articulos.rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <div className="truncate font-bold text-slate-900">{row.nombre}</div>
                    <div className="truncate text-xs text-slate-500">{row.modelo || "Sin modelo"}</div>
                    <div className="truncate font-mono text-[11px] font-semibold text-blue-600">
                      {row.sku_maestro || "SKU pendiente"}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="truncate font-semibold text-slate-700">{row.categoria || "Sin categoría"}</div>
                    <div className="truncate text-xs text-slate-500">{row.subcategoria || "Sin subcategoría"}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">{row.unidad_medida}</td>
                  <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-900">{row.stock_minimo}</td>
                  <td className="px-5 py-4 whitespace-nowrap font-semibold text-blue-700">{row.stock_actual}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {String(row.tipo_articulo || (row.es_consumible ? "venta" : "herramienta")).replace(/^\w/, (letter) =>
                        letter.toUpperCase()
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="inline-flex items-center justify-center rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-sm"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full table-fixed min-w-[900px] text-left text-sm text-slate-600 whitespace-normal">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-[24%] px-5 py-4 whitespace-normal">Vehículo</th>
                <th className="w-[14%] px-5 py-4">Placas</th>
                <th className="w-[18%] px-5 py-4">NIV</th>
                <th className="w-[14%] px-5 py-4">Tipo</th>
                <th className="w-[14%] px-5 py-4">GPS</th>
                <th className="w-[10%] px-5 py-4">Estado</th>
                <th className="w-[6%] px-5 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehiculos.rows.map((row) => (
                <tr key={row.id} className="transition hover:bg-slate-50/80">
                  <td className="px-5 py-4">
                    <div className="truncate font-bold text-slate-900">{row.nombre}</div>
                    <div className="truncate text-xs text-slate-500">{row.modelo || "Sin modelo"}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-semibold text-slate-900">{row.placas || "-"}</td>
                  <td className="px-5 py-4 whitespace-nowrap">{row.numero_serie || "-"}</td>
                  <td className="px-5 py-4 whitespace-nowrap">{row.tipo_vehiculo || "-"}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                      {row.estado_gps || "Sin Unidad"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        String(row.estado).toUpperCase() === "ACTIVO"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      )}
                    >
                      {row.estado || "ACTIVO"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="inline-flex items-center justify-center rounded-xl border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-sm"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && activeRows.rows.length === 0 && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 border-t border-slate-100 px-6 py-10 text-center text-slate-500">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="font-semibold">Sin registros para esta vista</p>
          </div>
        )}

        {loading && (
          <div className="flex min-h-48 items-center justify-center border-t border-slate-100 px-6 py-10 text-sm font-semibold text-slate-500">
            Cargando catálogo...
          </div>
        )}
      </DataTableShell>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
        <span>
          Mostrando {activeRows.rows.length} de {activeRows.total} registros
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={activeRows.currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="font-semibold text-slate-800 whitespace-nowrap">
            Página {activeRows.currentPage} de {activeRows.lastPage}
          </span>
          <button
            type="button"
            disabled={activeRows.currentPage >= activeRows.lastPage}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>

      {modalOpen && (
        <PremiumModal className="max-w-3xl" onBackdropClick={closeModal}>
          {skuResult ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Registro guardado</h2>
                <p className="mt-2 text-sm text-slate-500">
                  SKU maestro generado para identificar el producto en catálogo.
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-900">{skuResult.nombre}</p>
                {skuResult.modelo && <p className="text-xs text-slate-500">{skuResult.modelo}</p>}
                {skuResult.sku_maestro ? (
                  <div ref={barcodeRef} className="mt-4 flex justify-center rounded-2xl bg-white p-4">
                    <Barcode
                      value={skuResult.sku_maestro}
                      width={1.8}
                      height={72}
                      fontSize={16}
                      margin={8}
                      displayValue
                    />
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
                    El registro se guardó, pero falta aplicar en BD el campo sku_maestro para imprimir etiquetas.
                  </div>
                )}
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-11 rounded-full bg-slate-100 px-6 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  disabled={!skuResult.sku_maestro}
                  onClick={printSkuLabel}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir etiqueta
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {editing ? "Editar registro" : "Nuevo registro"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {modalType === "articulos"
                    ? "Datos maestros para artículos, herramientas y consumibles."
                    : "Datos maestros para vehículos de flotilla."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-500 transition hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="grid gap-3 rounded-2xl bg-slate-50 p-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={Boolean(editing)}
                onClick={() => {
                  setModalType("articulos");
                  setForm(emptyArticulo);
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-70",
                  modalType === "articulos"
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                )}
              >
                <PackageSearch className="h-4 w-4" />
                Artículo o herramienta
              </button>
              <button
                type="button"
                disabled={Boolean(editing)}
                onClick={() => {
                  setModalType("vehiculos");
                  setForm(emptyVehiculo);
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-70",
                  modalType === "vehiculos"
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                    : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                )}
              >
                <Car className="h-4 w-4" />
                Vehículo
              </button>
            </div>

            {modalType === "articulos" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre del artículo" required error={errors.nombre}>
                  <TextInput
                    value={form.nombre}
                    onChange={(event) => setForm((value) => ({ ...value, nombre: event.target.value }))}
                    placeholder="Ej. Taladro percutor 1/2"
                    error={errors.nombre}
                  />
                </Field>
                <Field label="Modelo" error={errors.modelo}>
                  <TextInput
                    value={form.modelo}
                    onChange={(event) => setForm((value) => ({ ...value, modelo: event.target.value }))}
                    placeholder="Ej. Bosch GSB 550"
                    error={errors.modelo}
                  />
                </Field>
                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                  <Field label="Categoría" required error={errors.categoria_seleccionada}>
                    <Select
                      value={form.categoria_seleccionada}
                      onValueChange={(value) => setForm((current) => ({ ...current, categoria_seleccionada: value, subcategoria_seleccionada: "" }))}
                    >
                      <SelectTrigger className={cn("bg-slate-50", errors.categoria_seleccionada && "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-100")}>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(PRESET_CATEGORIES).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        {Array.from(new Set(subcategorias.map((s) => s.categoria)))
                          .filter((c) => c && !PRESET_CATEGORIES[c])
                          .map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        <SelectItem value="NUEVA">➕ Agregar nueva...</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {form.categoria_seleccionada === "NUEVA" && (
                    <Field label="Nombre de la nueva Categoría" required error={errors.nueva_categoria}>
                      <TextInput
                        value={form.nueva_categoria}
                        onChange={(event) => setForm((value) => ({ ...value, nueva_categoria: event.target.value }))}
                        placeholder="Ej. HERRAMIENTAS ELÉCTRICAS"
                        error={errors.nueva_categoria}
                      />
                    </Field>
                  )}
                  <Field label="Subcategoría" required error={errors.subcategoria_seleccionada}>
                    <Select
                      value={form.subcategoria_seleccionada}
                      onValueChange={(value) => setForm((current) => ({ ...current, subcategoria_seleccionada: value }))}
                    >
                      <SelectTrigger className={cn("bg-slate-50", errors.subcategoria_seleccionada && "border-rose-400 bg-rose-50/30 text-rose-900 focus:ring-rose-100")}>
                        <SelectValue placeholder="Seleccionar subcategoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {form.categoria_seleccionada && PRESET_CATEGORIES[form.categoria_seleccionada] && PRESET_CATEGORIES[form.categoria_seleccionada].map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                        {form.categoria_seleccionada && Array.from(new Set(subcategorias.filter(s => s.categoria === form.categoria_seleccionada).map(s => s.nombre)))
                          .filter((s) => s && !(PRESET_CATEGORIES[form.categoria_seleccionada] || []).includes(s))
                          .map((sub) => (
                            <SelectItem key={sub} value={sub}>
                              {sub}
                            </SelectItem>
                          ))}
                        <SelectItem value="NUEVA">➕ Agregar nueva...</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {form.subcategoria_seleccionada === "NUEVA" && (
                    <Field label="Nombre de la nueva Subcategoría" required error={errors.nueva_subcategoria}>
                      <TextInput
                        value={form.nueva_subcategoria}
                        onChange={(event) => setForm((value) => ({ ...value, nueva_subcategoria: event.target.value }))}
                        placeholder="Ej. TALADROS"
                        error={errors.nueva_subcategoria}
                      />
                    </Field>
                  )}
                </div>
                <Field label="Unidad de medida" required error={errors.unidad_medida}>
                  <TextInput
                    value={form.unidad_medida}
                    onChange={(event) => setForm((value) => ({ ...value, unidad_medida: event.target.value }))}
                    placeholder="PZA"
                    error={errors.unidad_medida}
                  />
                </Field>
                <Field label="Stock ideal" error={errors.stock_minimo}>
                  <TextInput
                    type="number"
                    min="0"
                    value={form.stock_minimo}
                    onChange={(event) => setForm((value) => ({ ...value, stock_minimo: event.target.value }))}
                    error={errors.stock_minimo}
                  />
                </Field>
                <div className="md:col-span-2 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">SKU maestro actual</p>
                    <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                      {form.sku_maestro || "Se generará automáticamente"}
                    </p>
                  </div>
                  <ToggleButton
                    active={form.regenerar_sku}
                    onClick={() => setForm((value) => ({ ...value, regenerar_sku: !value.regenerar_sku }))}
                  >
                    Generar nuevo SKU al guardar
                  </ToggleButton>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre / Alias" required error={errors.nombre}>
                  <TextInput
                    value={form.nombre}
                    onChange={(event) => setForm((value) => ({ ...value, nombre: event.target.value }))}
                    placeholder="Ej. Ranger Blanca"
                    error={errors.nombre}
                  />
                </Field>
                <Field label="Modelo" required error={errors.modelo}>
                  <TextInput
                    value={form.modelo}
                    onChange={(event) => setForm((value) => ({ ...value, modelo: event.target.value }))}
                    placeholder="Ej. Ford Ranger 2021"
                    error={errors.modelo}
                  />
                </Field>
                <Field label="Placas" required error={errors.placas}>
                  <TextInput
                    value={form.placas}
                    onChange={(event) => setForm((value) => ({ ...value, placas: event.target.value }))}
                    placeholder="ABC-123-D"
                    error={errors.placas}
                  />
                </Field>
                <Field label="NIV / Número de serie">
                  <TextInput
                    value={form.numero_serie}
                    onChange={(event) => setForm((value) => ({ ...value, numero_serie: event.target.value }))}
                    placeholder="1FTER4FH5..."
                  />
                </Field>
                <Field label="Tipo" required error={errors.tipo_vehiculo}>
                  <TextInput
                    value={form.tipo_vehiculo}
                    onChange={(event) => setForm((value) => ({ ...value, tipo_vehiculo: event.target.value }))}
                    placeholder="Pickup"
                    error={errors.tipo_vehiculo}
                  />
                </Field>
                <Field label="Número económico">
                  <TextInput
                    value={form.numero}
                    onChange={(event) => setForm((value) => ({ ...value, numero: event.target.value }))}
                    placeholder="No. 830"
                  />
                </Field>
                <Field label="Estado GPS">
                  <Select
                    value={form.estado_gps}
                    onValueChange={(value) => setForm((current) => ({ ...current, estado_gps: value }))}
                  >
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue placeholder="Seleccionar estado GPS" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="INACTIVO">Inactivo</SelectItem>
                      <SelectItem value="Sin Unidad">Sin Unidad</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Estado">
                  <Select
                    value={form.estado}
                    onValueChange={(value) => setForm((current) => ({ ...current, estado: value }))}
                  >
                    <SelectTrigger className="bg-slate-50">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVO">Activo</SelectItem>
                      <SelectItem value="INACTIVO">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="h-11 rounded-full bg-slate-100 px-6 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-11 rounded-full bg-blue-600 px-6 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
              >
                Guardar registro
              </button>
            </div>
          </form>
          )}
        </PremiumModal>
      )}
    </div>
  );
}
