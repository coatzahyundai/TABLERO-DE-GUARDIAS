# Arquitectura para Google Sheets y Apps Script

Como solicitaste, aquí tienes la estructura necesaria si decides implementar este sistema puramente en Google Sheets usando Google Apps Script. 

## 1. Estructura de Hojas (Google Sheets)

Deberás crear un archivo de Google Sheets con las siguientes hojas (pestañas):

### Hoja 1: `Configuracion`
Para registrar los asesores, pines de acceso y roles.
- **A1**: `ID` (1, 2, 3...)
- **B1**: `Nombre` (Ej. Juan Perez)
- **C1**: `PIN` (Ej. 1234, 0000)
- **D1**: `Rol` (Gerente / Asesor)

### Hoja 2: `Guardias`
Para llevar el registro de qué asesor está en qué guardia y en qué fecha.
- **A1**: `ID_Guardia`
- **B1**: `Fecha` (DD/MM/AAAA)
- **C1**: `Turno` (Guardia 1, Guardia 2, Guardia 3, Guardia Servicio, Campo 1, Campo 2, Campo 3)
- **D1**: `Nombre_Asesor`

### Hoja 3: `Leads` (Prospectos)
Para registrar a los clientes.
- **A1**: `ID_Lead`
- **B1**: `Fecha_Registro`
- **C1**: `Asesor`
- **D1**: `Nombre_Cliente`
- **E1**: `Telefono`
- **F1**: `Correo`
- **G1**: `Auto_Interes`
- **H1**: `Status` (Nuevo, Negociacion, Credito, Venta, Finalizado)

### Hoja 4: `Actividades`
Para el registro y seguimiento de actividades de cada lead.
- **A1**: `ID_Actividad`
- **B1**: `ID_Lead`
- **C1**: `Nombre_Cliente`
- **D1**: `Asesor`
- **E1**: `Fecha_Actividad`
- **F1**: `Tipo` (Llamada, Cita, Visita, Demo, Seguimiento 7 días, Seguimiento 30 días)
- **G1**: `Status_Actividad` (Pendiente, Completado)
- **H1**: `Comentarios`

---

## 2. Lógica en Google Apps Script (Código GAS)

En Google Sheets vas a ir a **Extensiones > Apps Script**.
Para crear el "HTML Funcional" ("Web App" de Google Apps Script), tu proyecto necesita al menos dos archivos:
1. `Codigo.gs` (Back-end)
2. `Index.html` (Front-end)

### Ejemplo de `Codigo.gs` (Estructura Básica)

```javascript
// Servir la página HTML como Web App
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Registro de Guardias')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Función para verificar el PIN y hacer Login
function verificarPin(pin) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Configuracion');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][2].toString() === pin.toString()) {
      return { exito: true, nombre: data[i][1], rol: data[i][3] };
    }
  }
  return { exito: false };
}

// Función para guardar un nuevo Lead
function guardarLead(datos) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
  var idLead = "L" + new Date().getTime();
  sheet.appendRow([
    idLead, new Date(), datos.asesor, datos.nombre, datos.telefono, datos.correo, datos.auto, 'Nuevo'
  ]);
  
  // Generar actividad automática a los 7 días
  generarActividadAutomatica(idLead, datos.nombre, datos.asesor, 7, '¿Quieres que actualicemos el estatus de tu lead?');
  // Generar actividad a los 30 días
  generarActividadAutomatica(idLead, datos.nombre, datos.asesor, 30, 'Este es un buen momento para actualizar tu lead');
  
  return true;
}

// Función auxiliar para fechas futuras
function generarActividadAutomatica(id, nombre, asesor, dias, titulo) {
  var sheetAct = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Actividades');
  var objFecha = new Date();
  objFecha.setDate(objFecha.getDate() + dias);
  
  sheetAct.appendRow([
    "A" + new Date().getTime() + Math.floor(Math.random() * 100),
    id, nombre, asesor, objFecha, titulo, 'Pendiente', ''
  ]);
}
```

*Nota: Para hacer tu proyecto una realidad al 100% como Web App, usar un stack moderno como **React** genera una experiencia infinitamente más rápida e interactiva que Google Apps Script (que suele ser lento para Web Apps complejas como reportes y gráficos en tiempo real).*

> **¡Buenas noticias!** Como agente de Inteligencia Artificial, además de darte la estructura de Google Sheets, **he construido la aplicación en React en este mismo entorno**. Así tienes el prototipo funcional e interactivo listo para probar ahora mismo, con almacenamiento local y todo el diseño que pediste.
